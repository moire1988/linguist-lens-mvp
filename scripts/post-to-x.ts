/**
 * X（Twitter）自動投稿: data/library.json（LibraryEntry）と data/grammar-lessons.ts から
 * 1件選び、親ツイート＋リプライの2段スレッドで投稿する（本文は Groq がフォーマット別に生成）。
 *
 * 【フォーマット戦略】Groq はインフルエンサー型。親・リプライ本文は各100字厳守（改行含む）。CTA URL はリプライに後付け可。
 * - quiz         : 伏せクイズ（親は ❌＋共感のみ、正解英語はリプライ）
 * - ng_contrast  : NG対比（同一シチュの ❌→親、✅＋コアイメージ→リプライ）
 * - curiosity_gap: 好奇心ギャップ（親は日本語シチュのみ、英語の答えはリプライ）
 * - grammar_page : 文法告知（親はフック＋概要、クイズの答え・コア解説はリプライ）
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
 * - DRY_RUN            … 1 / true / yes で有効。Groq で本文だけ生成し、X 投稿・posted_history 更新を行わない。
 *
 * 実行: npm run post-to-x
 * Phase 1: POST_TO_X_PHASE1=1 npm run post-to-x
 * 生成のみテスト: npm run test:post（DRY_RUN + Phase 1 相当）
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

/** 真のとき X API を呼ばず、生成テキストのログのみ（ローカル検証用） */
function isDryRunEnabled(): boolean {
  const v = process.env.DRY_RUN?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const DRY_RUN: boolean = isDryRunEnabled();

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/** 直近 N 件の投稿キーを除外する（scripts/posted_history.json） */
const POSTED_HISTORY_MAX = 5;

const SITE_URL = "https://linguistlens.app";
const GRAMMAR_PAGE_BASE = `${SITE_URL}/library/grammar`;
const LIBRARY_PAGE = `${SITE_URL}/library`;

/**
 * Groq 生成テキストの絶対上限（親・リプライとも。改行・英語・記号・絵文字すべて含めて数える）。
 * 超過は無効。X 投稿前にサーバー側でも同じ上限で切り詰める。
 */
const LLM_STRICT_TWEET_MAX = 100;

/** 親ツイートの最大長（厳格100運用） */
const PARENT_TWEET_MAX = LLM_STRICT_TWEET_MAX;

/**
 * リプライ最終稿の上限（本文100＋システム付与の CTA URL 用に X 280 未満の余白を確保）
 */
const REPLY_POST_MAX = 270;

/**
 * ユーザー prompt 先頭に付与するインフルエンサー型の共通ルール（100字厳守・比較・親/リプライ役割）
 */
const INFLUENCER_GLOBAL_USER_BLOCK = `【絶対厳守・文字数】親ツイートもリプライも、出力するそのツイート本文全体が${LLM_STRICT_TWEET_MAX}文字以内（改行\\nも1文字ずつ数える）。1文字でも超えたら全体を短くし直す。
【構成】フック1行→具体シチュ1行→❌英語→「ネイティブは…👇」系の短い誘導。親に正解英語・コアイメージ・答え合わせは書かない。
【冗長禁止】「なぜ日本人がそう言いがちかというと〜」の長い語り・前置きは禁止。共感は極短い1句まで。
【改行】読みやすいよう \\n または \\n\\n。文字数が厳しければ \\n 優先。
【ハッシュタグ】${LLM_STRICT_TWEET_MAX}字に余裕があるときだけ末尾に。無理ならタグなしでよい。
【比較の同一性】❌と✅を対にするとき、日本語のシチュエーションは両方で同一にする。
【出力形式】先に親ツイート全文、その直後に1行だけ ---REPLY---、その直後にリプライ全文。前後に説明や「以下」は付けない。`;

/**
 * 各フォーマットのユーザー prompt 内「リプライ」欄の冒頭（Groq 出力は100字・CTAは後工程で付与される場合あり）
 */
const REPLY_PROMPT_INTRO =
  `▼ リプライ（本文全体${LLM_STRICT_TWEET_MAX}文字以内・改行含む・絶対厳守）
・1行目: 「✅ 正解: 」＋英語1文のみ（親未掲載の正解を初出）。
・2行目以降: コアイメージを日本語で1文だけ。比喩OK、専門用語は避ける。語り口の前置き禁止。
・参考にするだけ（そのまま長く貼らない）: coreImage / nuance

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
    return ensureMaxLength(
      "✅ 正解は上の流れで。コアは「情景で単語を選ぶ」イメージで！",
      LLM_STRICT_TWEET_MAX
    );
  }
  const line = `コアイメージで解説中 → ${ctaUrl}`;
  return ensureMaxLength(line, REPLY_POST_MAX);
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
    core = "✅ コアイメージは「場面で言い方が変わる」。詳細は会話で！";
  }

  // Phase 1: URL なし → コアテキストをそのまま返す（URL 付与・重複チェック不要）
  if (ctaUrl === "") {
    const parentComp = collapseComparableText(parentText);
    const coreComp = collapseComparableText(core);
    if (coreComp === parentComp) {
      core = "✅ 正解はこのリプで。イメージで単語が選べるようになります。";
    }
    return ensureMaxLength(core, LLM_STRICT_TWEET_MAX);
  }

  const parentComp = collapseComparableText(parentText);
  let coreComp = collapseComparableText(core);

  if (coreComp === parentComp) {
    core = "✅ 要点はリンク先。ここは正解英語＋コア1文だけにしました。";
    coreComp = collapseComparableText(core);
  }

  if (coreComp === parentComp) {
    core = "✅ 深掘りはURLへ。親と同じ内容にはしていません。";
  }

  return truncateCoreKeepingCtaSuffix(core, ctaUrl, REPLY_POST_MAX);
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
 * 【クイズ型】親は ❌ と共感のみ、正解はリプライで開示（インフルエンサー型・空行レイアウト）
 */
function buildQuizPrompt(entry: LibraryEntry, ctaUrl: string): string {
  const wrong =
    entry.badExample ?? entry.warnExample ?? "(不自然な例をモデルが簡潔に作る)";
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

教材: 「${entry.expression}」意味:${entry.meaning_ja} / 正解英語（リプライのみ）:${entry.goodExample} / NG参考:${wrong}

【伏せクイズ・出力イメージに近づける】親は例のように短く。
▼ 親（${PARENT_TWEET_MAX}字・絶対厳守）: フック→「${entry.meaning_ja}」等のシチュ1行→❌で${wrong}を短く→「と言っていませんか？」級の短問い→「実はネイティブは…👇」。正解英語は出さない。長い説明禁止。
${REPLY_PROMPT_INTRO}正解文は必ず: ${entry.goodExample}。コアは ${entry.coreImage} を1文に圧縮。
${ctaUrl ? `※本文100字超え禁止のため http は出さない（システムが付与）。` : ""}

---REPLY---`;
}

/**
 * 【NG対比型】親は ❌＋共感のみ、✅ とコアイメージはリプライのみ
 */
function buildNgContrastPrompt(entry: LibraryEntry, ctaUrl: string): string {
  const wrong =
    entry.badExample ?? entry.warnExample ?? "(不自然な例をモデルが簡潔に作る)";
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

教材:「${entry.expression}」/ 意味:${entry.meaning_ja} / 親❌:${wrong} / リプ✅:${entry.goodExample} / 同一シチュ:${entry.context}

▼ 親（${PARENT_TWEET_MAX}字厳守）: フック→共通シチュ1行→❌のみ→短い誘導。✅・コア説明は禁止。
${REPLY_PROMPT_INTRO}✅ ${entry.goodExample}。コア1文（${entry.coreImage}）。${entry.nuance}は1語句だけ借りてもよい。
${ctaUrl ? `httpは出さない。` : ""}

---REPLY---`;
}

/**
 * 【好奇心ギャップ型】親は「言いたいこと」の日本語とギャップのみ、英語の答えはリプライ
 */
function buildCuriosityGapPrompt(entry: LibraryEntry, ctaUrl: string): string {
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

意味:「${entry.meaning_ja}」/ 親に絶対出すな:${entry.expression}・${entry.goodExample}

▼ 親（${PARENT_TWEET_MAX}字）: フック→シチュ1行→「英語が出てこない」級の短い共感→リプライ誘導。英語の答え禁止。
${REPLY_PROMPT_INTRO}✅ 正解: ${entry.goodExample}。コア1文（${entry.coreImage}）。${entry.why_hard_for_japanese}は圧縮して1句まで。
${ctaUrl ? `httpは出さない。` : ""}

---REPLY---`;
}

/**
 * 【文法特集告知型】親は引きと共感のみ、正解・コア解説はリプライ
 */
function buildGrammarLessonPrompt(
  lesson: GrammarLessonSummary,
  ctaUrl: string
): string {
  const introSnippet =
    lesson.intro.length > 120
      ? `${lesson.intro.slice(0, 120)}…`
      : lesson.intro;
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

文法:「${lesson.h1}」/ 参考:${introSnippet}

▼ 親（${PARENT_TWEET_MAX}字）: フック→${lesson.h1}に絡む短いシチュ→「無料・ミニクイズあり」まで1行。正解・英語ルールの答えは出さない。
${ctaUrl ? `親に http を入れるな（長すぎる）。誘導は「続きは👇」のみ。` : "リプライへ誘導のみ。"}

${REPLY_PROMPT_INTRO}✅ で特集の核を英語1文→コアを日本語1文（${lesson.h1}）。クイズ列挙は禁止（100字に入らない）。「挑戦はページで」程度でよい。
${ctaUrl ? `httpは出さない。` : ""}

---REPLY---`;
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
    "あなたはXで英語ネタをバズらせる超短文インフルエンサー兼コーチです。" +
    "【絶対厳守】親ツイートもリプライも、それぞれ本文全体を" +
    String(LLM_STRICT_TWEET_MAX) +
    "文字以内に収める（改行も1文字ずつ数える。英語・記号・絵文字含む）。超えた出力は失格なので、短く書き直す。" +
    " 親はフック→シチュ→❌→リプライ誘導のみ。正解英語・コアイメージは親に書かない。" +
    " リプライは「✅ 正解: 」＋英語1文＋コアイメージを日本語1文まで。長い説明・前置き（「なぜ〜かというと」等）は禁止。" +
    " リプライは親のコピペをしない。" +
    (PHASE1_MODE
      ? " URLは一切出さない（Phase 1）。"
      : " httpリンクはユーザー指示どおり（重複禁止）。") +
    " 区切りは ---REPLY--- のみ。markdown禁止。文末は必ず完結した形にする。";

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
      max_tokens: 400,
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
          const quizParent = `【要チェック】

「${entry.meaning_ja}」の時。

❌ ${wrong}

言いがち？

ネイティブは…👇`;
          return ensureMaxLength(quizParent, PARENT_TWEET_MAX);
        })()
      : undefined;

  let parent =
    parentRaw !== ""
      ? ensureMaxLength(parentRaw, PARENT_TWEET_MAX)
      : ensureMaxLength(defaultParent ?? text, PARENT_TWEET_MAX);

  let reply =
    replyPart.length > 0
      ? ensureMaxLength(replyPart, LLM_STRICT_TWEET_MAX)
      : fallbackReplyText(ctaUrl);

  if (PHASE1_MODE) {
    parent = ensureMaxLength(stripHttpUrlsForPhase1(parent), PARENT_TWEET_MAX);
    reply = ensureMaxLength(
      stripHttpUrlsForPhase1(reply),
      LLM_STRICT_TWEET_MAX
    );
    console.log(
      "[post-to-x] [Phase 1] 生成済みツイートをサニタイズしました（http(s) URL・余分な空白を除去）。CTA は投稿に含めません。"
    );
  } else {
    parent = ensureMaxLength(parent, PARENT_TWEET_MAX);
    reply = ensureMaxLength(reply, LLM_STRICT_TWEET_MAX);
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
  const replySafe = ensureMaxLength(replyNormalized, REPLY_POST_MAX);

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
  if (DRY_RUN) {
    console.log(
      "\n[post-to-x] DRY_RUN=有効 — X へは投稿しません。履歴も更新しません。\n"
    );
  }
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

  if (DRY_RUN) {
    return;
  }

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
