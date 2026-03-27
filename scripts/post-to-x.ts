/**
 * X（Twitter）自動投稿: library.json から1件選び、親ツイート（Groq / Llama）＋リプライ（誘導文）の2段で投稿する。
 *
 * 環境変数（.env.local 推奨）:
 * - GEMINI_API_KEY … Groq API キー（GitHub Secrets 名を据え置くためこの名前のまま）
 * - TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
 *
 * 実行: npm run post-to-x
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { TwitterApi } from "twitter-api-v2";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface LibraryItem {
  phrase: string;
  meaning: string;
}

function loadLibrary(): LibraryItem[] {
  const path = resolve(process.cwd(), "data/library.json");
  const raw = readFileSync(path, "utf-8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("data/library.json は配列である必要があります");
  }
  const items: LibraryItem[] = [];
  for (const row of data) {
    if (
      row &&
      typeof row === "object" &&
      "phrase" in row &&
      "meaning" in row &&
      typeof (row as { phrase: unknown }).phrase === "string" &&
      typeof (row as { meaning: unknown }).meaning === "string"
    ) {
      items.push({
        phrase: (row as LibraryItem).phrase.trim(),
        meaning: (row as LibraryItem).meaning.trim(),
      });
    }
  }
  if (items.length === 0) {
    throw new Error("data/library.json に有効な表現がありません");
  }
  return items;
}

function pickRandom<T>(arr: readonly T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i] as T;
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

async function generateParentTweetGroq(
  phrase: string,
  meaning: string
): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  console.log(`[post-to-x] Groq model: ${GROQ_MODEL}`);

  const userContent = `以下の英語フレーズの解説をX（Twitter）用に作成してください。

フレーズ: ${phrase}
意味: ${meaning}

【構成案】
1行目: フレーズと意味
2行目: ニュアンスや使い方の短い解説
3行目: 例文: 英文 (和訳)
最後: #LinguistLens #英語学習`;

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
          content:
            "あなたはプロの英語講師でありSNSマーケターです。親しみやすく知的な解説を日本語で作成してください。140文字以内厳守。絵文字を効果的に使用してください。",
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
  const item = pickRandom(library);
  console.log(`Picked: ${item.phrase} / ${item.meaning}`);

  const parentBody = await generateParentTweetGroq(item.phrase, item.meaning);
  console.log("--- Parent (Groq) ---\n", parentBody, "\n---");

  const replyBody = buildReplyText();
  console.log("--- Reply ---\n", replyBody, "\n---");

  const { parentId, replyId } = await postThreadToX(parentBody, replyBody);
  console.log(`Posted thread. Parent id: ${parentId} | Reply id: ${replyId}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
