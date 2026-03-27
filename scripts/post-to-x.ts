/**
 * X（Twitter）自動投稿: library.json から1件選び、親ツイート（Gemini）＋リプライ（誘導文）の2段で投稿する。
 *
 * 環境変数（.env.local 推奨）:
 * - GEMINI_API_KEY（親ツイートの生成に必須）
 * - TWITTER_API_KEY / TWITTER_API_SECRET / TWITTER_ACCESS_TOKEN / TWITTER_ACCESS_SECRET
 * 使用モデル: gemini-1.5-flash に固定（429 回避のため環境変数では切り替えない）
 *
 * 実行: npm run post-to-x
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TwitterApi } from "twitter-api-v2";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

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

/** Gemini 呼び出しに使うモデル（Actions/ローカル共通で固定） */
const GEMINI_MODEL = "gemini-2.5-flash";

/** 親ツイート: 解説中心のため X 標準上限に合わせる */
const PARENT_TWEET_MAX = 280;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`環境変数 ${name} が設定されていません（.env.local を確認）`);
  }
  return v;
}

function buildParentPrompt(phrase: string, meaning: string): string {
  return `次の英語表現について、X（旧Twitter）の「親ツイート」用本文を1つだけ書いてください。

【題材】
・表現: ${phrase}
・意味（参考）: ${meaning}

【内容】
・純粋に「英語表現の解説」と「例文」に特化する（英語学習者が「へぇ〜」と思うニュアンス・使いどころ）。
・日本語を主にし、自然な英語の例文を1つ含める。
・URL・リンク・ハッシュタグは含めない。
・前置きや「以下は投稿です」などのメタ文は書かない。
・出力は投稿本文のみ。

【長さ】
・全体で${PARENT_TWEET_MAX}文字以内（改行・スペース含む）。`;
}

async function generateParentTweetGemini(
  phrase: string,
  meaning: string
): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  console.log(`[post-to-x] Gemini model: ${GEMINI_MODEL}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const prompt = buildParentPrompt(phrase, meaning);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    if (!text) {
      throw new Error("Gemini から空の応答が返りました");
    }
    return text;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[post-to-x] Gemini error: ${msg}`);
    throw error;
  }
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

  const parentBody = await generateParentTweetGemini(item.phrase, item.meaning);
  console.log("--- Parent (Gemini) ---\n", parentBody, "\n---");

  const replyBody = buildReplyText();
  console.log("--- Reply ---\n", replyBody, "\n---");

  const { parentId, replyId } = await postThreadToX(parentBody, replyBody);
  console.log(`Posted thread. Parent id: ${parentId} | Reply id: ${replyId}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
