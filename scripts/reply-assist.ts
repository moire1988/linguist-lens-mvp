/**
 * 半自動・返信アシスト: ターゲットのツイート文面を貼り付けると
 * Groq が「気の利いたリプライ原稿 3 パターン」を即座に生成する。
 *
 * 使い方:
 *   npm run reply-assist "（ここにリプライ先のツイート文面を貼る）"
 *
 * または標準入力:
 *   echo "ツイート文面" | npm run reply-assist
 *
 * ※ 完全手動コピペ運用。自動投稿は行わない（X 凍結リスク回避）。
 *
 * 環境変数（.env.local）:
 *   GEMINI_API_KEY … Groq API キー
 */
import { config } from "dotenv";
import { resolve } from "path";
import { createInterface } from "readline";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`環境変数 ${name} が設定されていません（.env.local を確認）`);
  }
  return v;
}

function extractGroqText(data: unknown): string {
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

/** 標準入力から全テキストを読む（パイプ用） */
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, terminal: false });
    const lines: string[] = [];
    rl.on("line", (line) => lines.push(line));
    rl.on("close", () => resolve(lines.join("\n").trim()));
  });
}

async function generateReplySuggestions(tweetText: string): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY");

  const systemPrompt = `あなたは英語教育 × 認知言語学の専門家であり、X（Twitter）で英語学習コミュニティに深く関わる実践者です。
与えられたツイートに対して、フォロワーから「この人、詳しいな」「また話しかけたい」と思われるリプライを生成してください。

【絶対条件】
- 各パターンの本文は必ず「3文または4文」（句点「。」で区切る）。2文以下・5文以上は禁止
- 英語学習・認知言語学・CEFR・コアイメージ・語彙習得などの専門知見を、会話に自然に1つ織り込む
- 単なる賛同・褒め言葉にならない（新しい視点・補足・具体例を必ず加える）
- 宣伝・URLは一切含めない
- 日本語で書く
- ビジネス敬語ではなく「知的フレンドリー」なトーン（タメ口寄り丁寧語）

【出力形式（必ずこの形式で3パターン出力）】
▶ パターン1【専門知見で深掘り】
（リプライ本文）

▶ パターン2【共感 + 意外な補足Tips】
（リプライ本文）

▶ パターン3【問い返し・会話を続ける】
（リプライ本文）

---
各パターンの後に1行の短い【使いどき】コメントを添える（例: 「相手が初心者向け発信の場合に最適」）`;

  const userPrompt = `以下のツイートへの返信を生成してください:\n\n${tweetText}`;

  const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 700,
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
    throw new Error(`Groq 応答の JSON パース失敗: ${rawBody.slice(0, 300)}`);
  }

  const text = extractGroqText(parsed).trim();
  if (!text) {
    throw new Error("Groq から空の応答が返りました");
  }
  return text;
}

const CLI_HELP_NO_ARG =
  "❌ エラー: 返信対象のツイート文面を引数として渡してください。\n" +
  "💡 使い方: npm run reply-assist \"ここにツイートの文章\"";

async function main(): Promise<void> {
  const argv2Empty = (process.argv[2]?.trim() ?? "") === "";
  const cliJoined = process.argv.slice(2).join(" ").trim();

  let tweetText: string;
  if (!argv2Empty) {
    tweetText = cliJoined;
  } else if (!process.stdin.isTTY) {
    // パイプで渡す場合は従来どおり標準入力を読む
    tweetText = await readStdin();
  } else {
    console.error(CLI_HELP_NO_ARG);
    process.exit(1);
  }

  if (tweetText.trim() === "") {
    console.error(CLI_HELP_NO_ARG);
    process.exit(1);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("【対象ツイート】");
  console.log(tweetText);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("[reply-assist] Groq で返信案（3パターン）を生成中...\n");

  const suggestions = await generateReplySuggestions(tweetText);

  console.log("【返信候補】コピペして使ってください");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(suggestions);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[reply-assist] エラー: ${msg}`);
  process.exit(1);
});
