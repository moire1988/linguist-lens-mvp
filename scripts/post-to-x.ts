/**
 * X（Twitter）自動投稿: data/library.json（LibraryEntry）と data/grammar-lessons.ts から
 * 1件選び、親ツイート＋リプライの2段スレッドで投稿する（本文は Groq がフォーマット別に生成）。
 *
 * 【フォーマット戦略】Groq はインフルエンサー型。
 * AIの暴走を防ぐため、ガチガチの「穴埋めテンプレート形式」で出力を強制します。
 * * 実行: npm run post-to-x
 * Phase 1: POST_TO_X_PHASE1=1 npm run post-to-x
 * 生成のみテスト: npm run test:post（DRY_RUN + Phase 1 相当）
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { ApiResponseError, TwitterApi } from "twitter-api-v2";
import type { SendTweetV2Params } from "twitter-api-v2";
import type { LibraryEntry } from "../lib/library";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

function isPostToXPhase1Enabled(): boolean {
  const v = process.env.POST_TO_X_PHASE1?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const PHASE1_MODE: boolean = isPostToXPhase1Enabled();

function isDryRunEnabled(): boolean {
  const v = process.env.DRY_RUN?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const DRY_RUN: boolean = isDryRunEnabled();

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const POSTED_HISTORY_MAX = 5;
const SITE_URL = "https://linguistlens.app";
const GRAMMAR_PAGE_BASE = `${SITE_URL}/library/grammar`;
const LIBRARY_PAGE = `${SITE_URL}/library`;

/**
 * AIの文字数制限を少し緩和（100 -> 135）。
 * Xの上限（140文字）に収めつつ、末尾が不自然に切れるのを防ぎます。
 */
const LLM_STRICT_TWEET_MAX = 190;
const PARENT_TWEET_MAX = LLM_STRICT_TWEET_MAX;
const REPLY_POST_MAX = 270;

const TRUNCATION_SUFFIX = "...";

function ensureMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  if (max <= 0) return "";
  const suffixLen = TRUNCATION_SUFFIX.length;
  if (max <= suffixLen) {
    return TRUNCATION_SUFFIX.slice(0, max);
  }
  return `${text.slice(0, max - suffixLen)}${TRUNCATION_SUFFIX}`;
}

function isPostToXDebugDedupEnabled(): boolean {
  const v = process.env.POST_TO_X_DEBUG_DEDUP?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function buildDebugParentTweetSuffix(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `\n·ll-debug·${String(ts)}·${rand}`;
}

function applyDebugDedupSuffixToParent(parentText: string, maxChars: number): string {
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

type TweetFormat = "quiz" | "ng_contrast" | "grammar_page" | "curiosity_gap";

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

function readPostedHistory(): string[] {
  const path = resolvePostedHistoryPath();
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (!isPostedHistoryPayload(parsed)) return [];
    return parsed.phrases.filter(p => typeof p === "string" && p.trim() !== "").slice(-POSTED_HISTORY_MAX) as string[];
  } catch {
    return [];
  }
}

function writePostedHistory(phrases: readonly string[]): void {
  const path = resolvePostedHistoryPath();
  const body = `${JSON.stringify({ phrases: [...phrases] }, null, 2)}\n`;
  writeFileSync(path, body, "utf-8");
}

function recordPostedPhrase(historyKey: string): void {
  const trimmed = historyKey.trim();
  if (trimmed === "") return;
  const prev = readPostedHistory();
  const next = [...prev, trimmed].slice(-POSTED_HISTORY_MAX);
  writePostedHistory(next);
}

function resolveHistoryKey(source: ContentSource): string {
  return source.type === "grammar_lesson"
    ? `grammar:${source.slug}`
    : source.entry.expression;
}

function resolveCtaUrl(source: ContentSource): string {
  if (source.type === "grammar_lesson") {
    return `${GRAMMAR_PAGE_BASE}/${source.slug}`;
  }
  return LIBRARY_PAGE;
}

const URL_IN_TEXT_RE = /https?:\/\/[^\s]+/g;

function fallbackReplyText(ctaUrl: string): string {
  if (ctaUrl === "") {
    return ensureMaxLength("✅ 正解は上の流れで。コアは「情景で単語を選ぶ」イメージで！", LLM_STRICT_TWEET_MAX);
  }
  return ensureMaxLength(`コアイメージで解説中 → ${ctaUrl}`, REPLY_POST_MAX);
}

function collapseComparableText(s: string): string {
  return s.replace(URL_IN_TEXT_RE, "").replace(/\s+/g, " ").trim();
}

function stripAllUrls(s: string): string {
  return s.replace(URL_IN_TEXT_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

function stripHttpUrlsForPhase1(text: string): string {
  return text
    .replace(URL_IN_TEXT_RE, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function truncateCoreKeepingCtaSuffix(bodyCore: string, ctaUrl: string, maxTotal: number): string {
  const suffix = `\n\n${ctaUrl}`;
  const maxCore = Math.max(0, maxTotal - suffix.length);
  if (maxCore === 0) {
    return ctaUrl.length <= maxTotal ? ctaUrl : ensureMaxLength(ctaUrl, maxTotal);
  }
  let core = bodyCore;
  if (core.length > maxCore) {
    core = ensureMaxLength(core, maxCore);
  }
  return `${core}${suffix}`;
}

function normalizeReplyForThread(parentText: string, replyText: string, ctaUrl: string): string {
  let core = stripAllUrls(replyText);
  if (core === "") {
    core = "✅ コアイメージは「場面で言い方が変わる」。詳細は会話で！";
  }
  if (ctaUrl === "") {
    return ensureMaxLength(core, LLM_STRICT_TWEET_MAX);
  }
  return truncateCoreKeepingCtaSuffix(core, ctaUrl, REPLY_POST_MAX);
}

function logTwitterApiError(context: string, err: unknown): void {
  console.error(`[post-to-x] ${context}`);
  if (err instanceof ApiResponseError) {
    console.error(`[post-to-x] HTTP status: ${String(err.code)}`);
    console.error(`[post-to-x] API error data (JSON): ${JSON.stringify(err.data, null, 2)}`);
  } else if (err && typeof err === "object" && "message" in err) {
    console.error(`[post-to-x] Error message: ${String((err as Error).message)}`);
  }
  console.error("[post-to-x] Full error:", err);
}

const BOT_LEVELS = new Set<LibraryEntry["level"]>(["B1", "B2", "C1"]);

function isLibraryEntry(row: unknown): row is LibraryEntry {
  if (row === null || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.expression === "string" && typeof o.type === "string";
}

function loadLibrary(): LibraryEntry[] {
  const path = resolve(process.cwd(), "data/library.json");
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) throw new Error("library.json err");
  const items = data.filter(r => isLibraryEntry(r) && BOT_LEVELS.has(r.level)) as LibraryEntry[];
  if (items.length === 0) throw new Error("No B1/B2/C1 entries");
  return items;
}

async function loadGrammarLessonSummaries(): Promise<GrammarLessonSummary[]> {
  try {
    const { GRAMMAR_LESSONS } = await import("../data/grammar-lessons");
    return GRAMMAR_LESSONS.map((l) => ({
      slug: l.slug, h1: l.h1, intro: l.intro,
      practiceItems: l.practiceItems.map((p) => ({
        prompt: p.prompt, options: p.options, correctIndex: p.correctIndex, explanation: p.explanation,
      })),
    }));
  } catch (e) {
    return [];
  }
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickContentSource(library: LibraryEntry[], grammarLessons: GrammarLessonSummary[], history: Set<string>): ContentSource {
  const useGrammar = grammarLessons.length > 0 && Math.random() < 0.2;
  if (useGrammar) {
    const available = grammarLessons.filter((l) => !history.has(`grammar:${l.slug}`));
    const pool = available.length > 0 ? available : grammarLessons;
    return { type: "grammar_lesson", slug: pickRandom(pool).slug, lesson: pickRandom(pool) };
  }
  const available = library.filter((i) => !history.has(i.expression));
  const pool = available.length > 0 ? available : library;
  return { type: "library", entry: pickRandom(pool) };
}

function pickTweetFormat(source: ContentSource): TweetFormat {
  if (source.type === "grammar_lesson") return "grammar_page";
  const weights: [TweetFormat, number][] = [["quiz", 40], ["ng_contrast", 35], ["curiosity_gap", 25]];
  const entry = source.entry;
  const filtered = entry.badExample || entry.warnExample ? weights : weights.filter(([f]) => f !== "ng_contrast");
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
  if (!v) throw new Error(`環境変数 ${name} が未設定`);
  return v;
}

function extractGroqAssistantText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: unknown }).message;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : "";
}

// ─── テンプレート完全拘束プロンプト群 ───────────────────────────────────────────────

const INFLUENCER_GLOBAL_USER_BLOCK = `【絶対遵守の生成ルール】
1. シチュエーションは「カフェ」「友達との会話」「日常の仕事」など【極めて一般的な日常シーン】に限定すること。ソフトウェア開発やIT、専門的な文脈は絶対禁止。
2. 以下の【出力テンプレート】を一言一句そのまま出力し、[ ] の部分だけを指示に従って埋めること。テンプレート外の語りかけ、「1/2」などの連番追加は絶対禁止。
3. 親ツイートとリプライの間に必ず \`---REPLY---\` のみを挟むこと。`;

function buildQuizPrompt(entry: LibraryEntry): string {
  const wrong = entry.badExample ?? entry.warnExample ?? "（日本人がやりがちな直訳や不自然な英語）";
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

教材:「${entry.expression}」意味:${entry.meaning_ja}

【出力テンプレート】
【9割の日本人が間違える英語】

[「${entry.meaning_ja}」となる具体的な日常シーンを15〜20文字で。例：「車のエンジンがかからない時」「仕事でミスをして焦った時」など、必ず具体的な情景を書き「〜な時」「〜な場面」で終わらせること]
❌ ${wrong}
と言っていませんか？

実はこれ、ネイティブには少し不自然に聞こえます。
自然な表現は...👇

#英語 #英語学習
---REPLY---
✅ 正解: ${entry.goodExample}

「[対象となる英単語/熟語]」のコアイメージは「[視覚的で分かりやすいコアイメージを40文字以内で]」です。

[そのフレーズを使う時の感情やニュアンス（例：驚きが伝わります、等）を30文字以内で]
ぜひ使ってみてね！`;
}

function buildNgContrastPrompt(entry: LibraryEntry): string {
  return buildQuizPrompt(entry); // QuizとNG対比は同じバズり型に統一
}

function buildCuriosityGapPrompt(entry: LibraryEntry): string {
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

教材意味:「${entry.meaning_ja}」

【出力テンプレート】
【英語でパッと言えますか？】

[「${entry.meaning_ja}」となる極めて日常的なシーン（20文字以内）]
「${entry.meaning_ja}」って、英語で何て言うか迷いますよね。

直訳すると不自然になりがちです。
ネイティブの自然な表現は...👇

#英語 #英語学習
---REPLY---
✅ 正解: ${entry.goodExample}

「[対象となる英単語/熟語]」のコアイメージは「[視覚的で分かりやすいコアイメージを40文字以内で]」です。

[そのフレーズを使う時の感情やニュアンス（30文字以内で）]
ぜひ使ってみてね！`;
}

function buildGrammarLessonPrompt(lesson: GrammarLessonSummary): string {
  return `${INFLUENCER_GLOBAL_USER_BLOCK}

文法テーマ:「${lesson.h1}」

【出力テンプレート】
【9割が知らない文法の罠】

[「${lesson.h1}」で迷いやすい極めて日常的なシーン（20文字以内）]
どっちを使うか迷ったことはありませんか？

実はネイティブは「あるイメージ」で使い分けています。
その答えは...👇

#英語 #英語学習
---REPLY---
✅ ネイティブの使い分け感覚

「[テーマとなる文法/単語]」のコアイメージは「[視覚的で分かりやすいコアイメージを40文字以内で]」です。

[そのルールを知ることでどう英語が変わるか（30文字以内で）]
ぜひ意識してみてね！`;
}

function buildPrompt(source: ContentSource, format: TweetFormat): string {
  if (source.type === "grammar_lesson") return buildGrammarLessonPrompt(source.lesson);
  // 💡 formatが何であろうと、最強の「9割が間違える（Quiz）」型を強制適用！
  return buildQuizPrompt(source.entry);
}

async function generateTweetThread(source: ContentSource, format: TweetFormat): Promise<{parent: string; reply: string}> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  console.log(`[post-to-x] Groq model: ${GROQ_MODEL}${PHASE1_MODE ? " [Phase 1: URL なし]" : ""}`);

  const systemContent = 
    "あなたは穴埋めテンプレートに沿ってテキストを生成する厳格なシステムです。" +
    "指示された【出力テンプレート】の文字通りに出力し、[ ] の部分だけを文脈に合わせて書き換えてください。" +
    "ITやソフトウェアなどの専門用語は絶対禁止。日常会話に限定してください。" +
    "「1/2」などの連番、テンプレート外の語りかけは一切禁止です。" +
    "出力には「【出力テンプレート】」などの見出しや説明を含めず、実際に投稿するテキストのみを出力してください。";

  const userContent = buildPrompt(source, format);

  const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      temperature: 0.3, // ハルシネーションを防ぐため温度を低下
      max_tokens: 400,
    }),
  });

  const rawBody = await res.text();
  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${rawBody}`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error(`Groq JSON Error: ${rawBody}`);
  }

  const text = extractGroqAssistantText(parsed).trim();
  const parts = text.split("---REPLY---");
  const parentRaw = (parts[0] ?? text).trim().replace(/^【出力テンプレート.*?】\n/g, ""); // 万が一見出しが出た場合の保険
  const replyPart = (parts[1] ?? "").trim().replace(/^【出力テンプレート.*?】\n/g, "");

  let parent = ensureMaxLength(parentRaw, PARENT_TWEET_MAX);
  let reply = replyPart.length > 0 ? ensureMaxLength(replyPart, LLM_STRICT_TWEET_MAX) : "✅ 正解は上の流れで！";

  if (PHASE1_MODE) {
    parent = stripHttpUrlsForPhase1(parent);
    reply = stripHttpUrlsForPhase1(reply);
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

export async function postThreadToX(parentText: string, replyText: string, ctaUrl: string) {
  const rwUser = createTwitterRw();
  const parentSafe = isPostToXDebugDedupEnabled()
    ? applyDebugDedupSuffixToParent(parentText, PARENT_TWEET_MAX)
    : parentText;

  let parentPosted = await rwUser.v2.tweet({ text: parentSafe });
  const parentId = parentPosted.data?.id;
  if (!parentId) throw new Error("親ツイートID取得失敗");

  const replyNormalized = normalizeReplyForThread(parentSafe, replyText, ctaUrl);
  let replyPosted = await rwUser.v2.reply(replyNormalized, parentId);
  const replyId = replyPosted.data?.id;
  if (!replyId) throw new Error("リプライID取得失敗");

  return { parentId, replyId };
}

async function main(): Promise<void> {
  if (DRY_RUN) console.log("\n[post-to-x] DRY_RUN=有効\n");

  const library = loadLibrary();
  const grammarLessons = await loadGrammarLessonSummaries();
  const historySet = new Set(readPostedHistory());

  const source = pickContentSource(library, grammarLessons, historySet);
  const format = pickTweetFormat(source);

  const { parent, reply } = await generateTweetThread(source, format);
  console.log("--- Parent ---\n", parent, "\n---");
  console.log("--- Reply ---\n", reply, "\n---");

  if (DRY_RUN) return;

  const ctaUrl = PHASE1_MODE ? "" : resolveCtaUrl(source);
  const { parentId, replyId } = await postThreadToX(parent, reply, ctaUrl);
  recordPostedPhrase(resolveHistoryKey(source));
  console.log(`Posted. Parent: ${parentId} | Reply: ${replyId}`);
}

main().catch((err: unknown) => {
  logTwitterApiError("post-to-x 実行失敗", err);
  process.exit(1);
});