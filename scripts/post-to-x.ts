/**
 * X（Twitter）自動投稿: data/library.json（LibraryEntry）と data/grammar-lessons.ts から
 * 1件選び、親ツイート＋リプライの2段スレッドで投稿する（本文は Groq がフォーマット別に生成）。
 *
 * 【フォーマット戦略】
 * - quiz         : A/B テキストクイズ（「リプライで答えてみて」→ リプライ数でアルゴリズム評価↑）
 * - ng_contrast  : NG対比型（日本人がやりがちなミスを突く）
 * - curiosity_gap: 好奇心ギャップ型（「言えますか？」系）
 * - grammar_page : 文法特集告知型
 *
 * ※ X API Free tier では Poll は使用不可（Basic $100/月 以上が必要）。
 *   スレッド形式のみで運用する。リプライ誘導はアルゴリズム的にも Poll より上位シグナル。
 *
 * 【Phase 1 モード（POST_TO_X_PHASE1=1）】
 * アカウント育成初期（最初の30日）向け。URL/サイトリンクを一切含まず、
 * 純粋な教育コンテンツのみを投稿する。Bot判定・凍結リスクを下げるための運用モード。
 * Phase 2 以降は POST_TO_X_PHASE1 を削除または 0 にする。
 *
 * 直近の重複回避: 投稿成功後に scripts/posted_history.json にキーを最大5件保持する。
 * - ライブラリ: 表現文字列（expression）
 * - 文法特集: "grammar:{slug}"
 *
 * 環境変数（.env.local 推奨）:
 * - GEMINI_API_KEY … Groq API キー（GitHub Secrets 名を据え置くためこの名前のまま）
 * - TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
 * - POST_TO_X_PHASE1      … 1 / true / yes で有効。URLなし純粋教育コンテンツモード（初期グロース用）
 * - POST_TO_X_DEBUG_DEDUP … 1 / true / yes で有効。テスト時に親ツイート末尾へタイムスタンプ＋乱数を付与し
 *   Duplicate Tweet（403）を避けやすくする（本番では未設定推奨）。
 *
 * 実行: npm run post-to-x
 * Phase 1: POST_TO_X_PHASE1=1 npm run post-to-x
 * （@cgo-growth-hacker 想定の初期30日・リンクなし運用）
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { ApiResponseError, TwitterApi } from "twitter-api-v2";
import type { SendTweetV2Params } from "twitter-api-v2";
import type { LibraryEntry } from "../lib/library";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

/**
 * Phase 1 モード（X運用・初期グロース）: CTA の URL を投稿から完全に除外し、純粋な教育コンテンツのみにする。
 * 有効化: POST_TO_X_PHASE1=1（または true / yes）
 */
function isPostToXPhase1Enabled(): boolean {
  const v = process.env.POST_TO_X_PHASE1?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const PHASE1_MODE: boolean = isPostToXPhase1Enabled();

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/** 直近 N 件の投稿キーを除外する（scripts/posted_history.json） */
const POSTED_HISTORY_MAX = 5;

const SITE_URL = "https://linguistlens.app";
const GRAMMAR_PAGE_BASE = `${SITE_URL}/library/grammar`;
const LIBRARY_PAGE = `${SITE_URL}/library`;

/** 親ツイート・リプライの上限（X 280 から余白） */
const PARENT_TWEET_MAX = 270;
const REPLY_TWEET_MAX = 270;

/**
 * リプライ内「日本語の解説・補足」に対する厳格上限（Groq プロンプトで強制）。
 * 全体の REPLY_TWEET_MAX とは別。長文解説 → サーバー側カット → 不自然末尾 → 403 の連鎖を防ぐ。
 */
const REPLY_JA_EXPLANATION_MAX_CHARS = 100;

/**
 * 各フォーマットのユーザー prompt 内「リプライ」欄の冒頭（日本語解説の短さを強制）
 */
const REPLY_PROMPT_INTRO =
  `▼ リプライ（全体${REPLY_TWEET_MAX}文字以内。日本語の解説・補足は必ず${REPLY_JA_EXPLANATION_MAX_CHARS}文字以内）
【絶対遵守】解説は日本語で要点だけを極めて簡潔に。${REPLY_JA_EXPLANATION_MAX_CHARS}文字を超えないこと。文末は必ず完結した自然な形で終える（「〜してくださ」のような途切れた丁寧語で終わらせない）。

`;

/** 切り詰め時に末尾へ付ける省略記号（X が不自然な途中切断をスパム扱いしやすいため明示的に付与） */
const TRUNCATION_SUFFIX = "...";

/**
 * 本文が max を超える場合のみ、末尾を `...` で終わるよう短くする（中間のハード slice を避ける）。
 */
function ensureMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  console.warn(
    `警告: 本文が${text.length}文字のため、${max}文字に切り詰めます（末尾に ${TRUNCATION_SUFFIX} を付与）`
  );
  if (max <= 0) return "";
  const suffixLen = TRUNCATION_SUFFIX.length;
  if (max <= suffixLen) {
    return TRUNCATION_SUFFIX.slice(0, max);
  }
  return `${text.slice(0, max - suffixLen)}${TRUNCATION_SUFFIX}`;
}

/**
 * テスト実行時、親ツイート本文の重複による Duplicate Tweet（403）を避けやすくする。
 * POST_TO_X_DEBUG_DEDUP=1 / true / yes
 */
function isPostToXDebugDedupEnabled(): boolean {
  const v = process.env.POST_TO_X_DEBUG_DEDUP?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * 親本文の末尾に付けるユニーク接尾辞（改行＋タイムスタンプ＋短い乱数）
 */
function buildDebugParentTweetSuffix(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `\n·ll-debug·${String(ts)}·${rand}`;
}

/**
 * 親ツイート最大長を維持したままデバッグ接尾辞を付与（本文が長い場合は先頭側を短くする）
 */
function applyDebugDedupSuffixToParent(
  parentText: string,
  maxChars: number
): string {
  const suffix = buildDebugParentTweetSuffix();
  const suffixLen = suffix.length;
  if (suffixLen >= maxChars) {
    return ensureMaxLength(suffix.trim(), maxChars);
  }
  const budget = maxChars - suffixLen;
  const head =
    parentText.length <= budget
      ? parentText
      : budget < TRUNCATION_SUFFIX.length
        ? TRUNCATION_SUFFIX.slice(0, Math.max(0, budget))
        : `${parentText.slice(0, budget - TRUNCATION_SUFFIX.length)}${TRUNCATION_SUFFIX}`;
  return `${head}${suffix}`;
}

// ─── Content source & formats ───────────────────────────────────────────────

type TweetFormat = "quiz" | "ng_contrast" | "grammar_page" | "curiosity_gap";

/** 文法レッスンの投稿用サマリ */
interface GrammarLessonSummary {
  slug: string;
  h1: string;
  intro: string;
  practiceItems: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

type ContentSource =
  | { type: "library"; entry: LibraryEntry }
  | { type: "grammar_lesson"; slug: string; lesson: GrammarLessonSummary };

function resolvePostedHistoryPath(): string {
  return resolve(process.cwd(), "scripts/posted_history.json");
}

function isPostedHistoryPayload(data: unknown): data is { phrases: unknown[] } {
  return (
    data !== null &&
    typeof data === "object" &&
    "phrases" in data &&
    Array.isArray((data as { phrases: unknown }).phrases)
  );
}

/** 履歴を読み込み、直近 POSTED_HISTORY_MAX 件に正規化する */
function readPostedHistory(): string[] {
  const path = resolvePostedHistoryPath();
  if (!existsSync(path)) {
    return [];
  }
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
  if (!isPostedHistoryPayload(parsed)) {
    return [];
  }
  const out: string[] = [];
  for (const p of parsed.phrases) {
    if (typeof p === "string") {
      const t = p.trim();
      if (t !== "") {
        out.push(t);
      }
    }
  }
  return out.slice(-POSTED_HISTORY_MAX);
}

function writePostedHistory(phrases: readonly string[]): void {
  const path = resolvePostedHistoryPath();
  const body = `${JSON.stringify({ phrases: [...phrases] }, null, 2)}\n`;
  writeFileSync(path, body, "utf-8");
}

/** 投稿成功後に呼ぶ。直近 POSTED_HISTORY_MAX 件だけ残す */
function recordPostedPhrase(historyKey: string): void {
  const trimmed = historyKey.trim();
  if (trimmed === "") {
    return;
  }
  const prev = readPostedHistory();
  const next = [...prev, trimmed].slice(-POSTED_HISTORY_MAX);
  writePostedHistory(next);
}

/** 投稿記録のキー: library は expression、grammar は "grammar:{slug}" */
function resolveHistoryKey(source: ContentSource): string {
  return source.type === "grammar_lesson"
    ? `grammar:${source.slug}`
    : source.entry.expression;
}

/** コンテンツの種類に応じたリンク先を返す */
function resolveCtaUrl(source: ContentSource): string {
  if (source.type === "grammar_lesson") {
    return `${GRAMMAR_PAGE_BASE}/${source.slug}`;
  }
  return LIBRARY_PAGE;
}

/** 本文中の http(s) URL（t.co 含む）をマッチ */
const URL_IN_TEXT_RE = /https?:\/\/[^\s]+/g;

function fallbackReplyText(ctaUrl: string): string {
  // Phase 1: URL なし → 学習を促す締め文で代替
  if (ctaUrl === "") {
    return "コアイメージを意識すると、英語の感覚が少しずつ変わってきます。ぜひ次の会話で1度使ってみてください！";
  }
  const line = `コアイメージで解説中 → ${ctaUrl}`;
  return ensureMaxLength(line, REPLY_TWEET_MAX);
}

/** 比較用: URL除去＋空白正規化 */
function collapseComparableText(s: string): string {
  return s.replace(URL_IN_TEXT_RE, "").replace(/\s+/g, " ").trim();
}

/** 本文から URL をすべて除去し整形 */
function stripAllUrls(s: string): string {
  return s.replace(URL_IN_TEXT_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Phase 1: LLM が誤って出した http(s) リンクを除去（CTA 完全除外の保険） */
function stripHttpUrlsForPhase1(text: string): string {
  return text
    .replace(URL_IN_TEXT_RE, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * リプライ末尾に ctaUrl を1回だけ付与し、親ツイートと同一本文にならないよう調整する。
 */
function truncateCoreKeepingCtaSuffix(
  bodyCore: string,
  ctaUrl: string,
  maxTotal: number
): string {
  const suffix = `\n\n${ctaUrl}`;
  const maxCore = Math.max(0, maxTotal - suffix.length);
  if (maxCore === 0) {
    return ctaUrl.length <= maxTotal
      ? ctaUrl
      : ensureMaxLength(ctaUrl, maxTotal);
  }
  let core = bodyCore;
  if (core.length > maxCore) {
    core = ensureMaxLength(core, maxCore);
  }
  return `${core}${suffix}`;
}

function normalizeReplyForThread(
  parentText: string,
  replyText: string,
  ctaUrl: string
): string {
  let core = stripAllUrls(replyText);
  if (core === "") {
    core =
      "日本語話者向けに、なぜそうなるかをコアイメージで整理しています。";
  }

  // Phase 1: URL なし → コアテキストをそのまま返す（URL 付与・重複チェック不要）
  if (ctaUrl === "") {
    const parentComp = collapseComparableText(parentText);
    const coreComp = collapseComparableText(core);
    if (coreComp === parentComp) {
      core =
        "コアイメージで考えると直感が変わります。ぜひ使ってみてください！";
    }
    return ensureMaxLength(core, REPLY_TWEET_MAX);
  }

  const parentComp = collapseComparableText(parentText);
  let coreComp = collapseComparableText(core);

  if (coreComp === parentComp) {
    core =
      "【リプライ｜正解・解説】詳細は次の1リンクのみから。日本語話者の誤解ポイントを短くまとめています。";
    coreComp = collapseComparableText(core);
  }

  if (coreComp === parentComp) {
    core =
      "正解と補足はリンク先のページで。親ツイートとは別内容のみここに記載しています。";
  }

  return truncateCoreKeepingCtaSuffix(core, ctaUrl, REPLY_TWEET_MAX);
}

function logTwitterApiError(context: string, err: unknown): void {
  console.error(`[post-to-x] ${context}`);
  if (err instanceof ApiResponseError) {
    console.error(`[post-to-x] HTTP status: ${String(err.code)}`);
    console.error(
      `[post-to-x] API error data (JSON): ${JSON.stringify(err.data, null, 2)}`
    );
    if (err.errors) {
      console.error(
        `[post-to-x] errors[]: ${JSON.stringify(err.errors, null, 2)}`
      );
    }
    if (err.rateLimit) {
      console.error(
        `[post-to-x] rateLimit: ${JSON.stringify(err.rateLimit, null, 2)}`
      );
    }
  } else if (err && typeof err === "object" && "message" in err) {
    console.error(
      `[post-to-x] Error message: ${String((err as Error).message)}`
    );
  }
  console.error("[post-to-x] Full error:", err);
}

/** X 投稿は中級〜上級帯（アプリのターゲット層に合わせる） */
const BOT_LEVELS = new Set<LibraryEntry["level"]>(["B1", "B2", "C1"]);

function isLibraryEntry(row: unknown): row is LibraryEntry {
  if (row === null || typeof row !== "object") {
    return false;
  }
  const o = row as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.expression === "string" &&
    typeof o.type === "string" &&
    typeof o.level === "string" &&
    typeof o.meaning_ja === "string" &&
    typeof o.coreImage === "string" &&
    typeof o.nuance === "string" &&
    typeof o.goodExample === "string" &&
    typeof o.goodExampleJa === "string" &&
    typeof o.context === "string" &&
    typeof o.why_hard_for_japanese === "string"
  );
}

function loadLibrary(): LibraryEntry[] {
  const path = resolve(process.cwd(), "data/library.json");
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("data/library.json は配列である必要があります");
  }
  const items: LibraryEntry[] = [];
  for (const row of data) {
    if (isLibraryEntry(row) && BOT_LEVELS.has(row.level)) {
      items.push(row);
    }
  }
  if (items.length === 0) {
    throw new Error(
      "data/library.json に B1・B2・C1 の有効なエントリがありません"
    );
  }
  return items;
}

/** data/grammar-lessons から投稿用サマリを抽出（失敗時は空配列） */
async function loadGrammarLessonSummaries(): Promise<GrammarLessonSummary[]> {
  try {
    const { GRAMMAR_LESSONS } = await import("../data/grammar-lessons");
    return GRAMMAR_LESSONS.map((l) => ({
      slug: l.slug,
      h1: l.h1,
      intro: l.intro,
      practiceItems: l.practiceItems.map((p) => ({
        prompt: p.prompt,
        options: p.options,
        correctIndex: p.correctIndex,
        explanation: p.explanation,
      })),
    }));
  } catch (e) {
    console.warn(
      "[post-to-x] grammar-lessons の読み込み失敗。library のみ使用",
      e
    );
    return [];
  }
}

function pickRandom<T>(arr: readonly T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] as T;
}

/**
 * コンテンツソースを選択（library 80% / grammar_lesson 20% の比率目安）
 */
function pickContentSource(
  library: LibraryEntry[],
  grammarLessons: GrammarLessonSummary[],
  history: Set<string>
): ContentSource {
  const useGrammar =
    grammarLessons.length > 0 && Math.random() < 0.2;

  if (useGrammar) {
    const available = grammarLessons.filter(
      (l) => !history.has(`grammar:${l.slug}`)
    );
    const pool = available.length > 0 ? available : grammarLessons;
    const lesson = pickRandom(pool);
    return { type: "grammar_lesson", slug: lesson.slug, lesson };
  }

  const available = library.filter((i) => !history.has(i.expression));
  const pool = available.length > 0 ? available : library;
  if (available.length === 0) {
    console.warn(
      "[post-to-x] 履歴と重複しないライブラリ候補がありません。全件から選びます。"
    );
  }
  return { type: "library", entry: pickRandom(pool) };
}

/** 重み付きランダムでフォーマットを選択 */
function pickTweetFormat(source: ContentSource): TweetFormat {
  if (source.type === "grammar_lesson") return "grammar_page";

  const weights: [TweetFormat, number][] = [
    ["quiz", 40],
    ["ng_contrast", 35],
    ["curiosity_gap", 25],
  ];

  const entry = source.entry;
  const filtered =
    entry.badExample || entry.warnExample
      ? weights
      : weights.filter(([f]) => f !== "ng_contrast");

  const total = filtered.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [format, w] of filtered) {
    r -= w;
    if (r <= 0) return format;
  }
  return "curiosity_gap";
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`環境変数 ${name} が設定されていません（.env.local を確認）`);
  }
  return v;
}

function extractGroqAssistantText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const first = choices[0];
  if (!first || typeof first !== "object") return "";
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : "";
}

// ─── Prompt builders ────────────────────────────────────────────────────────

/**
 * 【クイズ型】テキストのみの A/B クイズ。Poll は使わない。
 * 「リプライで答えてみて」CTA により、アルゴリズム評価の高いリプライ数を稼ぐ。
 *
 * フック公式（いずれかを冒頭に使う）:
 *   ① 「【英語クイズ】TOEIC 800点でも間違えやすい表現」
 *   ② 「ネイティブには通じない日本人英語、どちらか分かりますか？」
 *   ③ 「この2つ、どちらが自然か即答できますか？」
 */
function buildQuizPrompt(entry: LibraryEntry, ctaUrl: string): string {
  const wrong =
    entry.badExample ?? entry.warnExample ?? "(不自然な例をモデルが簡潔に作る)";
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: テキストクイズ型（Poll なし・リプライ誘導型）】

▼ 親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. 冒頭フック（必ずいずれか1つ使う）:
   ・「【英語クイズ】TOEIC 800点でも間違えやすい表現」
   ・「ネイティブに一瞬「え？」と思われる日本人英語、分かりますか？」
   ・「この2つ、どちらが自然か即答できますか？」
2. A/B 比較（必ず含める）:
   A: ${wrong}
   B: ${entry.goodExample}
3. 末尾に「👇 コメントで答えてみて！正解はリプライで」
4. ハッシュタグ: #英語 #TOEIC #英語学習

${REPLY_PROMPT_INTRO}1. 「✅ 正解: B」を明記
2. なぜ A が不自然か（要点: ${entry.why_hard_for_japanese}）を1〜2文
3. コアイメージ1文（素材: ${entry.coreImage}）
${ctaUrl
  ? `4. CTA: 「他にも同系統の表現まとめてます → ${ctaUrl}」`
  : `4. 締め: 「ぜひ今日の英会話で1度試してみてください 💪」などの前向きな一文（URLなし）`
}

親ツイートとリプライを次の区切り文字のみで分ける（前後に余計な文字なし）:
---REPLY---`;
}

/**
 * 【NG対比型】日本人の「あるある」ミスを突く構成。
 *
 * フック公式:
 *   ① 「日本人がやりがちな英語 ⚠️」
 *   ② 「海外で一瞬空気が止まった日本人英語」
 *   ③ 「ネイティブはそれを聞いてどう感じるか知っていますか？」
 */
function buildNgContrastPrompt(entry: LibraryEntry, ctaUrl: string): string {
  const wrong =
    entry.badExample ?? entry.warnExample ?? "(不自然な例をモデルが簡潔に作る)";
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: NG対比型】

▼ 親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. 冒頭フック（必ずいずれか1つ使う）:
   ・「日本人がやりがちな英語 ⚠️」
   ・「これ言ってたら要注意。海外で一瞬空気が止まる日本人英語」
   ・「ネイティブがこっそり感じている違和感、気づいていましたか？」
2. 対比:
   ❌ "${wrong}"
   ✅ "${entry.goodExample}"
3. コアイメージを1〜2文で（素材: ${entry.coreImage}）
4. ハッシュタグ: #英語 #英語学習 #LinguistLens

${REPLY_PROMPT_INTRO}1. nuance を1〜2文（素材: ${entry.nuance}）
2. 使用シーン1文（素材: ${entry.context}）
${ctaUrl
  ? `3. CTA: 「同じ落とし穴がある関連表現はこちら → ${ctaUrl}」`
  : `3. 締め: 「この感覚を意識するだけで、英語の印象がガラッと変わります」などの学びを促す一文（URLなし）`
}

親ツイートとリプライを "---REPLY---" で区切って出力してください。`;
}

/**
 * 【好奇心ギャップ型】「言えますか？」系の自己テストフォーマット。
 *
 * フック公式:
 *   ① 「『〇〇』を英語でなんと言いますか？」
 *   ② 「英語上級者とそうでない人を分ける表現」
 *   ③ 「これが言えたらネイティブから一目置かれます」
 */
function buildCuriosityGapPrompt(entry: LibraryEntry, ctaUrl: string): string {
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: 好奇心ギャップ型】

▼ 親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. 冒頭フック（必ずいずれか1つ使う）:
   ・「『${entry.meaning_ja}』を英語でなんと言いますか？」
   ・「英語上級者とそうでない人を分ける表現があります」
   ・「これが自然に言えたら、英語力が一段階上がった証拠です」
2. 答えを提示（「→ ${entry.expression}」の形で）
3. コアイメージを2〜3文で展開（素材: ${entry.coreImage} / ${entry.nuance}）
4. ハッシュタグ: #英語 #TOEIC #LinguistLens

${REPLY_PROMPT_INTRO}1. 例文: "${entry.goodExample}"（和訳: ${entry.goodExampleJa}）
2. なぜ日本人には難しいか1文: ${entry.why_hard_for_japanese}
${ctaUrl
  ? `3. CTA: 「同じシーンで使える関連表現はこちら → ${ctaUrl}」`
  : `3. 締め: 「このコアイメージを持つと、次の表現も自然に使えるようになります」など（URLなし）`
}

親ツイートとリプライを "---REPLY---" で区切って出力してください。`;
}

/**
 * 【文法特集告知型】無料コンテンツへの誘導。クイズ1問をリプライに入れてエンゲージメントを稼ぐ。
 */
function buildGrammarLessonPrompt(
  lesson: GrammarLessonSummary,
  ctaUrl: string
): string {
  const quiz = lesson.practiceItems[0];
  const introSnippet =
    lesson.intro.length > 200
      ? `${lesson.intro.slice(0, 200)}…`
      : lesson.intro;
  const optionLines =
    quiz?.options.map((o, i) => `${["A", "B", "C", "D"][i] ?? "?"}. ${o}`) ??
    [];
  return `文法特集ページ「${lesson.h1}」の告知ツイートを作成してください。

【フォーマット: 文法特集告知型】

▼ 親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. 冒頭フック（必ずいずれか1つ使う）:
   ・「${lesson.h1}の違い、コアイメージで説明できますか？」
   ・「文法書では教えてくれない、ネイティブ感覚を無料で解説しています」
   ・「英文法の『なんとなく』を終わらせる特集ページを公開しました」
2. intro の要点を1〜2文: ${introSnippet}
3. 「ミニクイズ5問つき・無料」を明示
${ctaUrl ? `4. CTA: 「→ ${ctaUrl}」` : "4. URLなし — 「ミニクイズに挑戦してみてください」などに留める"}
5. ハッシュタグ: #英語文法 #英語 #LinguistLens

${REPLY_PROMPT_INTRO}1. ミニクイズ1問:
   "${quiz?.prompt ?? "コアイメージを問うクイズ"}"
   ${optionLines.join(" / ")}
${ctaUrl
  ? `2. 「👇 答えをコメントで！全5問のクイズはこちら → ${ctaUrl}」`
  : `2. 「👇 答えをコメントで！正解は次のリプライで発表します」（URLなし）`
}

親ツイートとリプライを "---REPLY---" で区切って出力してください。`;
}

function buildPrompt(
  source: ContentSource,
  format: TweetFormat,
  ctaUrl: string
): string {
  if (source.type === "grammar_lesson") {
    return buildGrammarLessonPrompt(source.lesson, ctaUrl);
  }
  const entry = source.entry;
  switch (format) {
    case "quiz":
      return buildQuizPrompt(entry, ctaUrl);
    case "ng_contrast":
      return buildNgContrastPrompt(entry, ctaUrl);
    case "curiosity_gap":
      return buildCuriosityGapPrompt(entry, ctaUrl);
    default:
      return buildCuriosityGapPrompt(entry, ctaUrl);
  }
}

type GeneratedTweetThread = {
  parent: string;
  reply: string;
};

async function generateTweetThread(
  source: ContentSource,
  format: TweetFormat
): Promise<GeneratedTweetThread> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  // Phase 1: URL を一切含まない純粋な教育コンテンツ投稿。ctaUrl を空にすることで
  // 各プロンプトビルダーが自動的に URL なしの締め文に切り替わる。
  const ctaUrl = PHASE1_MODE ? "" : resolveCtaUrl(source);
  console.log(`[post-to-x] Groq model: ${GROQ_MODEL}${PHASE1_MODE ? " [Phase 1: URL なし]" : ""}`);

  const systemContent =
    "あなたはCTR最大化のプロのSNSコピーライターであり、認知言語学に基づく英語教育の専門家です。" +
    "X（Twitter）で英語学習者（主に日本人・TOEIC受験者）のエンゲージメントを最大化するツイートを書いてください。" +
    "【鉄則】① 1ツイート目の冒頭フックが全て。指定されたフック公式を必ず使うこと。" +
    "② リプライでは親ツイートの本文を繰り返さない。" +
    (PHASE1_MODE
      ? "③ URLは一切出力しない（Phase 1: 純粋な教育コンテンツのみ）。"
      : "③ リプライ内のURLは指示どおり1回だけ（重複リンク禁止）。") +
    "④ 区切りは ---REPLY--- のみ、前後に余計な文字・説明・markdown は一切出力しない。" +
    "⑤ リプライの日本語による解説・補足は必ず" +
    String(REPLY_JA_EXPLANATION_MAX_CHARS) +
    "文字以内に収め、要点のみ。冗長禁止。文末は必ず完結した形で終える（途切れた表現で終えない）。";

  const userContent = buildPrompt(source, format, ctaUrl);

  const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.85,
      max_tokens: 500,
    }),
  });

  const rawBody = await res.text();
  if (!res.ok) {
    throw new Error(
      `Groq API error ${res.status} ${res.statusText}: ${rawBody || "(empty body)"}`
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new Error(
      `Groq API の応答が JSON として解釈できません: ${rawBody.slice(0, 500)}`
    );
  }

  const text = extractGroqAssistantText(parsed).trim();
  if (!text) {
    throw new Error("Groq から空の応答が返りました");
  }

  const parts = text.split("---REPLY---");
  const parentRaw = (parts[0] ?? text).trim();
  const replyPart = (parts[1] ?? "").trim();

  if (parentRaw === "" || replyPart === "") {
    console.warn(
      "[post-to-x] ---REPLY--- 区切りが不完全。フォールバックします。"
    );
  }

  // クイズ型のフォールバック: Groq が区切りを出力しなかった場合
  const defaultParent =
    source.type === "library" && format === "quiz"
      ? (() => {
          const entry = source.entry;
          const wrong =
            entry.badExample ?? entry.warnExample ?? "（誤用例）";
          const quizParent = `【英語クイズ】この2つ、どちらが自然か即答できますか？

A: ${wrong}
B: ${entry.goodExample}

👇 コメントで答えてみて！正解はリプライで
#英語 #TOEIC #英語学習`;
          return ensureMaxLength(quizParent, PARENT_TWEET_MAX);
        })()
      : undefined;

  let parent =
    parentRaw !== ""
      ? ensureMaxLength(parentRaw, PARENT_TWEET_MAX)
      : ensureMaxLength(defaultParent ?? text, PARENT_TWEET_MAX);

  let reply =
    replyPart.length > 0
      ? ensureMaxLength(replyPart, REPLY_TWEET_MAX)
      : fallbackReplyText(ctaUrl);

  if (PHASE1_MODE) {
    parent = ensureMaxLength(stripHttpUrlsForPhase1(parent), PARENT_TWEET_MAX);
    reply = ensureMaxLength(stripHttpUrlsForPhase1(reply), REPLY_TWEET_MAX);
    console.log(
      "[post-to-x] [Phase 1] 生成済みツイートをサニタイズしました（http(s) URL・余分な空白を除去）。CTA は投稿に含めません。"
    );
  } else {
    parent = ensureMaxLength(parent, PARENT_TWEET_MAX);
    reply = ensureMaxLength(reply, REPLY_TWEET_MAX);
  }

  return { parent, reply };
}

function createTwitterRw() {
  return new TwitterApi({
    appKey: requireEnv("TWITTER_API_KEY"),
    appSecret: requireEnv("TWITTER_API_SECRET"),
    accessToken: requireEnv("TWITTER_ACCESS_TOKEN"),
    accessSecret: requireEnv("TWITTER_ACCESS_SECRET"),
  }).readWrite;
}

/**
 * 親ツイートを投稿し、そのツイートIDにリプライするスレッドを作成する。
 * `ctaUrl` でリプライ末尾のリンクを1つに正規化し、親と同一本文を避ける。
 */
export async function postThreadToX(
  parentText: string,
  replyText: string,
  ctaUrl: string
): Promise<{ parentId: string; replyId: string }> {
  const rwUser = createTwitterRw();

  const parentSafe = isPostToXDebugDedupEnabled()
    ? (() => {
        console.log(
          "[post-to-x] POST_TO_X_DEBUG_DEDUP: 親ツイート末尾にタイムスタンプ＋乱数を付与（Duplicate Tweet / 403 対策）"
        );
        return applyDebugDedupSuffixToParent(parentText, PARENT_TWEET_MAX);
      })()
    : ensureMaxLength(parentText, PARENT_TWEET_MAX);

  let parentPosted: Awaited<ReturnType<typeof rwUser.v2.tweet>>;
  try {
    const parentPayload: SendTweetV2Params = { text: parentSafe };
    console.log(
      "[post-to-x] 親ツイート POST ペイロード:",
      JSON.stringify(parentPayload, null, 2)
    );
    parentPosted = await rwUser.v2.tweet(parentPayload);
  } catch (err: unknown) {
    logTwitterApiError("親ツイート POST /2/tweets でエラー", err);
    throw err;
  }

  const parentIdRaw = parentPosted.data?.id;
  const parentId =
    typeof parentIdRaw === "string" ? parentIdRaw.trim() : undefined;
  if (!parentId) {
    console.error(
      "[post-to-x] 親ツイート応答:",
      JSON.stringify(parentPosted, null, 2)
    );
    throw new Error("X API が親ツイートのIDを返しませんでした");
  }
  console.log(
    `[post-to-x] 親ツイート成功 data.id=${parentId}（リプライの in_reply_to_tweet_id に使用）`
  );

  const replyNormalized = normalizeReplyForThread(
    parentSafe,
    replyText,
    ctaUrl
  );
  const replySafe = ensureMaxLength(replyNormalized, REPLY_TWEET_MAX);

  const replyUrlMatches = replySafe.match(URL_IN_TEXT_RE);
  const replyUrlCount = replyUrlMatches ? replyUrlMatches.length : 0;
  // Phase 1 は URL なしが正常。Phase 2 以降のみ URL 数を検証する。
  if (!PHASE1_MODE && replyUrlCount !== 1) {
    console.warn(
      `[post-to-x] リプライ内の http(s) URL 数が ${String(replyUrlCount)}（期待: 1）。本文: ${replySafe}`
    );
  }

  const replyPayload: SendTweetV2Params = {
    text: replySafe,
    reply: { in_reply_to_tweet_id: parentId },
  };
  console.log(
    "[post-to-x] リプライ送信ペイロード（確認用）:",
    JSON.stringify(replyPayload, null, 2)
  );

  let replyPosted: Awaited<ReturnType<typeof rwUser.v2.reply>>;
  try {
    replyPosted = await rwUser.v2.reply(replySafe, parentId);
  } catch (err: unknown) {
    logTwitterApiError(
      `リプライ POST /2/tweets（in_reply_to_tweet_id=${parentId}）でエラー`,
      err
    );
    throw err;
  }

  const replyIdRaw = replyPosted.data?.id;
  const replyId =
    typeof replyIdRaw === "string" ? replyIdRaw.trim() : undefined;
  if (!replyId) {
    console.error(
      "[post-to-x] リプライ応答:",
      JSON.stringify(replyPosted, null, 2)
    );
    throw new Error("X API がリプライのIDを返しませんでした");
  }

  return { parentId, replyId };
}

async function main(): Promise<void> {
  if (PHASE1_MODE) {
    console.log(
      "\n[post-to-x] ═══════════════════════════════════════════════════" +
      "\n[post-to-x]  X運用 Phase 1（初期グロース）— 有効" +
      "\n[post-to-x]  CTA（URL）は生成・投稿ともに含めません（純粋な教育コンテンツのみ）。" +
      "\n[post-to-x]  無効化: POST_TO_X_PHASE1 を未設定・0・false・no に" +
      "\n[post-to-x] ═══════════════════════════════════════════════════\n"
    );
  }

  const library = loadLibrary();
  const grammarLessons = await loadGrammarLessonSummaries();
  const historyArr = readPostedHistory();
  const historySet = new Set(historyArr);

  const source = pickContentSource(library, grammarLessons, historySet);
  const format = pickTweetFormat(source);

  const label =
    source.type === "grammar_lesson"
      ? `grammar:${source.slug}`
      : `[${source.entry.level}] ${source.entry.expression}`;
  console.log(`Picked: ${label} | Format: ${format}`);

  const { parent, reply } = await generateTweetThread(source, format);
  console.log("--- Parent ---\n", parent, "\n---");
  console.log("--- Reply ---\n", reply, "\n---");

  // Phase 1 は postThreadToX にも空文字を渡してリプライの URL 正規化をスキップ
  const ctaUrl = PHASE1_MODE ? "" : resolveCtaUrl(source);
  const { parentId, replyId } = await postThreadToX(parent, reply, ctaUrl);
  recordPostedPhrase(resolveHistoryKey(source));
  console.log(
    `[post-to-x] 履歴を更新しました（直近最大${POSTED_HISTORY_MAX}件）`
  );
  console.log(`Posted thread. Parent: ${parentId} | Reply: ${replyId}`);
}

main().catch((err: unknown) => {
  logTwitterApiError("post-to-x 実行失敗", err);
  process.exit(1);
});
