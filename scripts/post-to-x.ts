/**
 * X（Twitter）自動投稿: data/library.json（LibraryEntry）から B1–C1 を1件選び、親ツイート（Groq）＋リプライの2段で投稿する。
 *
 * 直近の重複回避: 投稿成功後に scripts/posted_history.json にフレーズ文字列を最大5件保持する。
 * GitHub Actions ではワークフローでこのファイルをキャッシュし、実行間で引き継ぐ。
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
import { TwitterApi } from "twitter-api-v2";
import type { LibraryEntry } from "../lib/library";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/** 直近 N 件の投稿フレーズを除外する（scripts/posted_history.json） */
const POSTED_HISTORY_MAX = 5;

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
function recordPostedPhrase(expression: string): void {
  const trimmed = expression.trim();
  if (trimmed === "") {
    return;
  }
  const prev = readPostedHistory();
  const next = [...prev, trimmed].slice(-POSTED_HISTORY_MAX);
  writePostedHistory(next);
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

function pickRandom<T>(arr: readonly T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] as T;
}

function pickLibraryItemAvoidingRecent(
  library: readonly LibraryEntry[]
): LibraryEntry {
  const history = readPostedHistory();
  const historySet = new Set(history);
  const candidates = library.filter((i) => !historySet.has(i.expression));
  const pool = candidates.length > 0 ? candidates : library;
  if (candidates.length === 0) {
    console.warn(
      "[post-to-x] 履歴と重複しない候補がありません。全件から選びます。"
    );
  }
  return pickRandom(pool);
}

const SITE_URL = "https://linguistlens.app";

/** 親ツイート本文の上限（Groq 指示・substring 保険・投稿前トリムで揃える） */
const PARENT_TWEET_MAX = 140;

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

async function generateParentTweetGroq(entry: LibraryEntry): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  console.log(`[post-to-x] Groq model: ${GROQ_MODEL}`);

  const systemContent =
    "あなたは認知言語学に基づくプロの英語講師です。ターゲットは中級〜上級者（CEFR B1-C1）です。単なる日本語訳の丸暗記ではなく、「なぜその単語の組み合わせでその意味になるのか」という『ネイティブの感覚・コアイメージ』を論理的かつ直感的に解説してください。Twitter向けに見やすく改行を使い、140文字（日本語）の制限内で最大限の「ハッとする気づき」を与えてください。";

  const userContent = `以下の英語フレーズの解説をX（Twitter）用に作成してください。

【素材（必ず踏まえること）】
フレーズ: ${entry.expression}
意味: ${entry.meaning_ja}
コアイメージ: ${entry.coreImage}
ニュアンス: ${entry.nuance}
使用シーン: ${entry.context}
参考例文（英文）: ${entry.goodExample}

上記のコアイメージとニュアンスを最大限活かし、ライブラリの趣旨と矛盾しないように要約・再構成してよいですが、X用の短い本文ではその「骨格」と「ハッとする点」が伝わるようにしてください。

【出力構成（厳守）】
🔹 ${entry.expression}
意味: ${entry.meaning_ja}

🧠 コアイメージ
（※素材のコアイメージ・ニュアンスを反映し、直訳ではなく本質を簡潔に）

💡 例文
（英文のみ。和訳は不要）

#LinguistLens
※全角140文字以内に必ず収めること。`;

  const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 300,
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

  let text = extractGroqAssistantText(parsed).trim();
  if (!text) {
    throw new Error("Groq から空の応答が返りました");
  }
  if (text.length > PARENT_TWEET_MAX) {
    text = text.substring(0, PARENT_TWEET_MAX);
  }
  return text;
}

function ensureMaxLength(text: string, max: number): string {
  if (text.length <= max) return text;
  console.warn(
    `警告: 本文が${text.length}文字のため、${max}文字に切り詰めます`
  );
  return text.slice(0, max - 1) + "…";
}

/** 2枚目: 固定の誘導文（URL含む） */
function buildReplyText(): string {
  return `この表現が使われている動画をAIで探すなら 💡 ${SITE_URL}`;
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
 */
export async function postThreadToX(
  parentText: string,
  replyText: string
): Promise<{ parentId: string; replyId: string }> {
  const rwUser = createTwitterRw();

  const parentSafe = ensureMaxLength(parentText, PARENT_TWEET_MAX);
  const parentPosted = await rwUser.v2.tweet(parentSafe);
  const parentId = parentPosted.data.id;
  if (!parentId) {
    throw new Error("X API が親ツイートのIDを返しませんでした");
  }

  const replyPosted = await rwUser.v2.tweet({
    text: replyText,
    reply: { in_reply_to_tweet_id: parentId },
  });
  const replyId = replyPosted.data.id;
  if (!replyId) {
    throw new Error("X API がリプライのIDを返しませんでした");
  }

  return { parentId, replyId };
}

async function main(): Promise<void> {
  const library = loadLibrary();
  const item = pickLibraryItemAvoidingRecent(library);
  console.log(`Picked: [${item.level}] ${item.expression} / ${item.meaning_ja}`);

  const parentBody = await generateParentTweetGroq(item);
  console.log("--- Parent (Groq) ---\n", parentBody, "\n---");

  const replyBody = buildReplyText();
  console.log("--- Reply ---\n", replyBody, "\n---");

  const { parentId, replyId } = await postThreadToX(parentBody, replyBody);
  recordPostedPhrase(item.expression);
  console.log(
    `[post-to-x] 履歴を更新しました（直近最大${POSTED_HISTORY_MAX}件）`
  );
  console.log(`Posted thread. Parent id: ${parentId} | Reply id: ${replyId}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
