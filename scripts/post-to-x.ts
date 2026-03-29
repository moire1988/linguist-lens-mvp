/**
 * X（Twitter）自動投稿: data/library.json（LibraryEntry）と data/grammar-lessons.ts から
 * 1件選び、親ツイート＋リプライの2段で投稿する（本文は Groq がフォーマット別に生成）。
 * ライブラリのクイズ型のみ親ツイートに X API v2 の Poll（2択・duration 1440 分・選択肢は固定短文）。
 *
 * 直近の重複回避: 投稿成功後に scripts/posted_history.json にキーを最大5件保持する。
 * - ライブラリ: 表現文字列（expression）
 * - 文法特集: "grammar:{slug}"
 *
 * 環境変数（.env.local 推奨）:
 * - GEMINI_API_KEY … Groq API キー（GitHub Secrets 名を据え置くためこの名前のまま）
 * - TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
 *
 * 実行: npm run post-to-x
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { ApiResponseError, TwitterApi } from "twitter-api-v2";
import type { SendTweetV2Params } from "twitter-api-v2";
import type { LibraryEntry } from "../lib/library";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

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

/** X API v2 Poll: 5〜10080 分。24 時間 = 1440 */
const POLL_DURATION_MINUTES = 1440;

/**
 * 投票の各選択肢の最大文字数（X の Poll は短いラベル前提。超過分は切り詰め）
 * https://docs.x.com/x-api/posts/manage-tweets/create-tweet
 */
const POLL_OPTION_MAX_CHARS = 25;

export type PostThreadPollPayload = {
  duration_minutes: number;
  options: [string, string];
};

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
  const line = `コアイメージで解説中 → ${ctaUrl}`;
  return line.length <= REPLY_TWEET_MAX
    ? line
    : line.slice(0, REPLY_TWEET_MAX - 1) + "…";
}

/** 比較用: URL除去＋空白正規化 */
function collapseComparableText(s: string): string {
  return s.replace(URL_IN_TEXT_RE, "").replace(/\s+/g, " ").trim();
}

/** 本文から URL をすべて除去し整形 */
function stripAllUrls(s: string): string {
  return s.replace(URL_IN_TEXT_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * リプライ末尾に ctaUrl を1回だけ付与し、親ツイートと同一本文にならないよう調整する。
 * （X が重複・スパム扱いで 403 になりやすいため）
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
      : `${ctaUrl.slice(0, Math.max(0, maxTotal - 1))}…`;
  }
  let core = bodyCore;
  if (core.length > maxCore) {
    core = `${core.slice(0, maxCore - 1)}…`;
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
 * grammar は posted_history に grammar:slug で記録
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
    ["quiz", 35],
    ["ng_contrast", 30],
    ["curiosity_gap", 20],
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

// ─── クイズ型 Poll: X API は選択肢が極短い前提のためラベルは固定（25文字以内） ──

const QUIZ_POLL_OPTION_A = "Aの方が自然！";
const QUIZ_POLL_OPTION_B = "Bの方が自然！";

const QUIZ_FIXED_POLL_PAYLOAD: PostThreadPollPayload = {
  duration_minutes: POLL_DURATION_MINUTES,
  options: [QUIZ_POLL_OPTION_A, QUIZ_POLL_OPTION_B],
};

// ─── Prompt builders ────────────────────────────────────────────────────────

function buildQuizPrompt(entry: LibraryEntry, ctaUrl: string): string {
  const wrong =
    entry.badExample ?? entry.warnExample ?? "(不自然な例をモデルが簡潔に作る)";
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX（Twitter）投稿を作成してください。

【フォーマット: クイズ型・親ツイートに Poll（投票）あり】
親ツイートの本文（合計 ${PARENT_TWEET_MAX} 文字以内。超えないよう英文は必要なら短く整えてよい）:
1. 冒頭に「【英語クイズ】どちらが自然？」などのフック、フレーズや意味のヒント
2. 次の2つの英文を必ず本文に含める（見出し付きで）:
   A（不自然・誤用寄り）: ${wrong}
   B（自然）: ${entry.goodExample}
3. 「↓の投票で選んでね」「正解はこのポストのリプライで」など一言
4. ハッシュタグ: #英語 #LinguistLens

重要（API仕様）:
- 投票ボタンに表示される文言はシステム側で固定「${QUIZ_POLL_OPTION_A}」「${QUIZ_POLL_OPTION_B}」（各 ${POLL_OPTION_MAX_CHARS} 文字以内）にする。
- あなたは Poll 用の選択肢テキストを出力しない。比較する英文はすべて親ツイートの本文（text）にのみ書くこと。

リプライ（${REPLY_TWEET_MAX}文字以内）:
1. 正解が B であることを明かす（例: 「正解: B」）
2. なぜ A が不自然か 1〜2 文（要点: ${entry.why_hard_for_japanese}）
3. CTA 1 行: コアイメージで解説 → ${ctaUrl}

親ツイートとリプライを次の1行だけで区切る（この文字列をそのまま使うこと）:
---REPLY---
<リプライ本文>`;
}

function buildNgContrastPrompt(entry: LibraryEntry, ctaUrl: string): string {
  const wrong =
    entry.badExample ?? entry.warnExample ?? "(不自然な例をモデルが簡潔に作る)";
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: NG対比型】
親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. 冒頭「日本人が使いがちな英語 ⚠️」または「日本人が間違えやすい英語」
2. × "${wrong}"
3. ○ "${entry.goodExample}"
4. コアイメージ1文（素材: ${entry.coreImage}）
5. #英語学習 #LinguistLens

リプライ（${REPLY_TWEET_MAX}文字以内）:
1. nuance を1〜2文（素材: ${entry.nuance}）
2. context（使用シーン: ${entry.context}）
3. CTA: 「なぜそうなるのかコアイメージで解説 → ${ctaUrl}」

親ツイートとリプライを "---REPLY---" で区切って出力してください。`;
}

function buildCuriosityGapPrompt(entry: LibraryEntry, ctaUrl: string): string {
  return `次の英語フレーズ「${entry.expression}」（意味: ${entry.meaning_ja}）を使ったX投稿を作成してください。

【フォーマット: 好奇心ギャップ型】
親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. 「「${entry.meaning_ja}」を英語で言うと？」または「ネイティブはなぜ〜と言うのか」から始める
2. 答え（フレーズ）を提示
3. コアイメージを2〜3文で展開（素材: ${entry.coreImage} / ${entry.nuance}）
4. #英語 #TOEIC #LinguistLens

リプライ（${REPLY_TWEET_MAX}文字以内）:
1. 例文: "${entry.goodExample}"（和訳: ${entry.goodExampleJa}）
2. why_hard_for_japanese の要点1文: ${entry.why_hard_for_japanese}
3. CTA: 「同じシーンの関連表現はこちら → ${ctaUrl}」

親ツイートとリプライを "---REPLY---" で区切って出力してください。`;
}

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
親ツイート（${PARENT_TWEET_MAX}文字以内）:
1. タイトル「${lesson.h1}」を含める
2. introの冒頭を引用・要約: ${introSnippet}
3. 「ミニクイズつき・無料」と価値を伝える
4. CTA: 「→ ${ctaUrl}」
5. #英語文法 #英語 #LinguistLens

リプライ（${REPLY_TWEET_MAX}文字以内）:
1. ミニクイズ1問を抜粋:
   "${quiz?.prompt ?? "コアイメージを問うクイズ"}"
   ${optionLines.join(" / ")}
2. 「全5問のクイズはこちら → ${ctaUrl}」

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
  poll?: PostThreadPollPayload;
};

async function generateParentTweetGroq(
  source: ContentSource,
  format: TweetFormat
): Promise<GeneratedTweetThread> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const ctaUrl = resolveCtaUrl(source);
  console.log(`[post-to-x] Groq model: ${GROQ_MODEL}`);

  const systemContent =
    "あなたはCTR最大化のプロのSNSコピーライターであり、認知言語学に基づく英語教育の専門家です。X（Twitter）で英語学習者のエンゲージメントを最大化するツイートを書いてください。リプライでは親ツイートの本文を繰り返さないこと。リプライ内のURLは指示どおり1回だけ（重複リンク禁止）。クイズ型では比較する2つの英文は必ず親ツイート本文に含め、投票ラベル用の長文は出力しない（区切りは ---REPLY--- のみ）。";

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

  if (format === "quiz" && source.type === "library") {
    const entry = source.entry;
    const wrong =
      entry.badExample ?? entry.warnExample ?? "（誤用例を1文で）";
    const parts = text.split("---REPLY---");
    const parentRaw = (parts[0] ?? text).trim();
    const replyPart = (parts[1] ?? "").trim();

    const defaultParent = `【英語クイズ】どちらが自然？「${entry.expression}」

A: ${wrong}
B: ${entry.goodExample}

↓投票で回答 / 正解はリプライで
#英語 #LinguistLens`;

    let parent =
      parentRaw !== ""
        ? parentRaw.slice(0, PARENT_TWEET_MAX)
        : defaultParent.slice(0, PARENT_TWEET_MAX);

    if (parentRaw === "" || replyPart === "") {
      console.warn(
        "[post-to-x] クイズ応答の ---REPLY--- 区切りが不完全。親またはリプライをフォールバックします。"
      );
      if (parentRaw === "") {
        parent = defaultParent.slice(0, PARENT_TWEET_MAX);
      }
    }

    const reply =
      replyPart.length > 0
        ? replyPart.slice(0, REPLY_TWEET_MAX)
        : fallbackReplyText(ctaUrl);

    return {
      parent,
      reply,
      poll: QUIZ_FIXED_POLL_PAYLOAD,
    };
  }

  const parts = text.split("---REPLY---");
  const parent = (parts[0] ?? text).trim().slice(0, PARENT_TWEET_MAX);
  const replyPart = (parts[1] ?? "").trim();
  const reply =
    replyPart.length > 0
      ? replyPart.slice(0, REPLY_TWEET_MAX)
      : fallbackReplyText(ctaUrl);

  return { parent, reply };
}

function ensureMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  console.warn(
    `警告: 本文が${text.length}文字のため、${max}文字に切り詰めます`
  );
  return text.slice(0, max - 1) + "…";
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
 * 親ツイートを投稿し、そのツイートIDにリプライする。
 * `ctaUrl` でリプライ末尾のリンクを1つに正規化し、親と同一本文を避ける。
 * `poll` があるときは親を X API v2 の Poll（2択）付きで投稿する。
 */
export async function postThreadToX(
  parentText: string,
  replyText: string,
  ctaUrl: string,
  poll?: PostThreadPollPayload
): Promise<{ parentId: string; replyId: string }> {
  const rwUser = createTwitterRw();

  const parentSafe = ensureMaxLength(parentText, PARENT_TWEET_MAX);

  let parentPosted: Awaited<ReturnType<typeof rwUser.v2.tweet>>;
  try {
    if (poll !== undefined) {
      if (poll.options.length !== 2) {
        throw new Error("Poll は options がちょうど2件である必要があります");
      }
      const [opt0, opt1] = poll.options;
      if (opt0.trim() === "" || opt1.trim() === "") {
        throw new Error("Poll の選択肢が空です");
      }
      if (poll.duration_minutes < 5 || poll.duration_minutes > 10080) {
        throw new Error(
          "Poll の duration_minutes は 5〜10080 の範囲である必要があります"
        );
      }
      const parentPayload: SendTweetV2Params = {
        text: parentSafe,
        poll: {
          duration_minutes: poll.duration_minutes,
          options: [opt0, opt1],
        },
      };
      console.log(
        "[post-to-x] 親ツイート（Poll 付き）POST ペイロード:",
        JSON.stringify(parentPayload, null, 2)
      );
      parentPosted = await rwUser.v2.tweet(parentPayload);
    } else {
      parentPosted = await rwUser.v2.tweet(parentSafe);
    }
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
  if (replyUrlCount !== 1) {
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

  const { parent, reply, poll } = await generateParentTweetGroq(source, format);
  console.log("--- Parent ---\n", parent, "\n---");
  if (poll) {
    console.log(
      "--- Poll ---\n",
      `duration_minutes: ${String(poll.duration_minutes)}`,
      "\n",
      poll.options,
      "\n---"
    );
  }
  console.log("--- Reply ---\n", reply, "\n---");

  const ctaUrl = resolveCtaUrl(source);
  const { parentId, replyId } = await postThreadToX(parent, reply, ctaUrl, poll);
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
