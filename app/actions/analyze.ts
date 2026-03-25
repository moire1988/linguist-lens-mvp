"use server";

import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import fs from "fs";
import path from "path";
import type { PhraseResult, AnalysisResult } from "@/lib/types";
import { DEV_TEST_VIDEO_ID } from "@/lib/settings";
export type { ExpressionType, PhraseResult, AnalysisResult } from "@/lib/types";

export type AnalyzeErrorCode = "no_subtitles" | "invalid_url" | "generic";

function loadMockTranscript(): string {
  const filePath = path.join(process.cwd(), "data", "mock-transcript.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as { content: string };
  return raw.content.replace(/\s{2,}/g, " ").slice(0, 8000);
}

// ─── Demo transcript for Developer Mode ────────────────────────────────────
// Used when devMode=true to bypass Supadata API for testing Claude prompts.

const DEMO_TRANSCRIPT = `I was completely caught off guard when my manager asked me to step up to the plate and take on the new project. At first, I wanted to back out because I had too much on my plate already. But she made it clear that this was a make-or-break moment for my career, and I couldn't afford to drop the ball.

I decided to figure out a way to pull it off. I reached out to a few colleagues and asked them to pitch in. We burned the midnight oil for a couple of weeks trying to get everything sorted out. There were moments when things seemed to fall apart, but we always managed to get back on track.

The hardest part was dealing with a stakeholder who kept moving the goalposts. Every time we thought we had nailed down the requirements, he would come up with new demands out of the blue. It was getting on everyone's nerves, but we had to grin and bear it.

In the long run, the experience was a real eye-opener. I learned to roll with the punches and not get bogged down by setbacks. I'm glad I didn't throw in the towel when things got tough. It really paid off in the end.

The key takeaway was that you have to be willing to go the extra mile if you want to stand out. You can't just sit on the fence when an opportunity comes your way. Sometimes you need to take the bull by the horns and make things happen.`.trim();

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "英語学習を始めたばかりの超入門者（TOEIC 〜225程度）",
  A2: "基本的な日常表現を理解できる初級者（TOEIC 225〜549程度）",
  B1: "日常的な話題で意思疎通できる中級者（TOEIC 550〜780 / TOEFL iBT 42〜71程度）",
  B2: "幅広いトピックで流暢にコミュニケーションできる中上級者（TOEIC 785〜940 / TOEFL iBT 72〜94程度）",
  C1: "複雑な内容も柔軟に使いこなせる上級者（TOEIC 945〜990 / TOEFL iBT 95〜120程度）",
  C2: "ネイティブに近い表現力を持つ熟達者",
};

function getMaxCharsForLevel(level: string): number {
  if (level === "A1" || level === "A2") return 3000;
  if (level === "B1" || level === "B2") return 5500;
  if (level === "C1" || level === "C2") return 8000;
  return 5500;
}

function normalizeAndTruncateText(text: string, level: string): string {
  return text.replace(/\s{2,}/g, " ").trim().slice(0, getMaxCharsForLevel(level));
}

function parseYouTubeTimestampParam(raw: string | null): number {
  if (!raw) return 0;
  const value = raw.trim().toLowerCase();
  if (value === "") return 0;

  // 例: "120", "120s", "1m30s", "1h2m3s"
  const hmsMatch = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (hmsMatch) {
    const hours = Number(hmsMatch[1] ?? "0");
    const mins = Number(hmsMatch[2] ?? "0");
    const secs = Number(hmsMatch[3] ?? "0");
    const total = hours * 3600 + mins * 60 + secs;
    if (Number.isFinite(total) && total >= 0) return total;
  }

  const secOnly = value.match(/^(\d+)(?:s)?$/);
  if (secOnly) return Number(secOnly[1]);
  return 0;
}

function getYouTubeOffsetSeconds(url: string): number {
  try {
    const parsed = new URL(url);
    return Math.max(
      parseYouTubeTimestampParam(parsed.searchParams.get("t")),
      parseYouTubeTimestampParam(parsed.searchParams.get("start"))
    );
  } catch {
    return 0;
  }
}

type SupadataSegment = Record<string, unknown>;

function readSegmentText(segment: SupadataSegment): string {
  const text =
    (typeof segment.text === "string" && segment.text) ||
    (typeof segment.content === "string" && segment.content) ||
    (typeof segment.snippet === "string" && segment.snippet) ||
    "";
  return text.trim();
}

/**
 * Supadata `TranscriptChunk.offset` is in milliseconds (see OpenAPI TranscriptChunk).
 * Normalize to seconds for comparison with YouTube `t` / `start` query params (seconds).
 */
function readSegmentOffsetSeconds(segment: SupadataSegment): number | null {
  const raw =
    segment.offset ??
    segment.start ??
    segment.startTime ??
    segment.start_time ??
    segment.time ??
    null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw / 1000;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n / 1000;
  }
  return null;
}

function joinTranscriptAfterOffset(
  segments: SupadataSegment[],
  offsetSeconds: number
): string {
  const picked = segments
    .filter((seg) => {
      const sec = readSegmentOffsetSeconds(seg);
      if (sec === null) return true;
      return sec >= offsetSeconds;
    })
    .map(readSegmentText)
    .filter((t) => t.length > 0);
  return picked.join(" ");
}

/** Join Supadata transcript chunks (plain text, space-separated). */
function joinTranscriptChunks(segments: SupadataSegment[]): string {
  return segments
    .map(readSegmentText)
    .filter((t) => t.length > 0)
    .join(" ");
}

type SupadataTranscriptJson = {
  content?: string | SupadataSegment[];
  transcript?: SupadataSegment[];
  segments?: SupadataSegment[];
  lang?: string;
  error?: string;
  message?: string;
  details?: string;
};

function throwSupadataApiError(data: SupadataTranscriptJson): never {
  const code = data.error ?? "";
  const detail = data.details ?? data.message ?? "";
  const messages: Record<string, string> = {
    "transcript-unavailable":
      "この動画には字幕が取得できませんでした。字幕付きの別の動画をお試しください。",
    "not-found": "動画が見つかりませんでした。URLをご確認ください。",
    "limit-exceeded":
      "字幕取得サービスの利用上限に達しました。時間をおいて再度お試しください。",
    "upgrade-required":
      "字幕取得に必要なプランへのアップグレードが必要です。管理者にお問い合わせください。",
    unauthorized: "字幕APIの認証に失敗しました。環境設定をご確認ください。",
    forbidden: "字幕APIへのアクセスが拒否されました。",
    "invalid-request": "字幕取得リクエストが無効です。URLをご確認ください。",
    "internal-error": "字幕取得サービスで一時的なエラーが発生しました。しばらくしてから再度お試しください。",
  };
  throw new Error(messages[code] ?? (detail || `字幕APIエラー（${code || "unknown"}）`));
}

// ─── YouTube（Supadata API 経由）──────────────────────────────────────────

async function getYouTubeTranscript(url: string, cefrLevel: string): Promise<string> {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!match) throw new Error("YouTube URLの形式が正しくありません");
  const videoId = match[1];
  const offsetSeconds = getYouTubeOffsetSeconds(url);

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "字幕取得APIキーが設定されていません（SUPADATA_API_KEY）。管理者に連絡してください。"
    );
  }

  const endpoint =
    `https://api.supadata.ai/v1/youtube/transcript` +
    `?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;

  const res = await fetch(endpoint, {
    headers: { "x-api-key": apiKey },
    signal: AbortSignal.timeout(20000),
  });

  if (res.status === 404) {
    throw new Error(
      "この動画には字幕が存在しません。字幕付きの別の動画をお試しください。"
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as { message?: string; details?: string; error?: string };
      detail = errBody.details ?? errBody.message ?? errBody.error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(
      detail
        ? `字幕の取得に失敗しました（HTTP ${res.status}）: ${detail}`
        : `字幕の取得に失敗しました（HTTP ${res.status}）`
    );
  }

  const data = (await res.json()) as SupadataTranscriptJson;

  // HTTP 206 is "Transcript Unavailable" in OpenAPI but still in 2xx → res.ok === true
  if (res.status === 206) {
    if (data.error) throwSupadataApiError(data);
    throw new Error(
      "この動画には字幕を取得できませんでした。字幕付きの別の動画をお試しください。"
    );
  }

  // Error-shaped JSON with 2xx (e.g. proxies) — no usable transcript payload
  if (data.error && data.content === undefined) {
    throwSupadataApiError(data);
  }

  // Supadata: `text=true` → content is string; default → content is TranscriptChunk[]
  let baseTranscript = "";
  let segmentList: SupadataSegment[] | null = null;

  if (typeof data.content === "string") {
    baseTranscript = data.content.trim();
  } else if (Array.isArray(data.content)) {
    segmentList = data.content;
    baseTranscript = joinTranscriptChunks(segmentList).trim();
  }

  if (!baseTranscript && Array.isArray(data.transcript)) {
    segmentList = data.transcript;
    baseTranscript = joinTranscriptChunks(segmentList).trim();
  }
  if (!baseTranscript && Array.isArray(data.segments)) {
    segmentList = data.segments;
    baseTranscript = joinTranscriptChunks(segmentList).trim();
  }

  let transcript = baseTranscript;
  if (offsetSeconds > 0 && segmentList && segmentList.length > 0) {
    transcript = joinTranscriptAfterOffset(segmentList, offsetSeconds).trim();
  }

  if (!transcript) {
    throw new Error("この動画には字幕が見つかりませんでした。");
  }

  return normalizeAndTruncateText(transcript, cefrLevel);
}

// ─── Web Article ───────────────────────────────────────────────────────────

async function getWebContent(url: string, cefrLevel: string): Promise<string> {
  try {
    new URL(url);
  } catch {
    throw new Error("URLの形式が正しくありません。「https://」から始まるURLを入力してください。テキストを直接解析したい場合は「テキスト入力」タブをお使いください。");
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`ページの取得に失敗しました (HTTP ${res.status})`);

  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (text.length < 100)
    throw new Error(
      "ページからテキストを取得できませんでした。スクレイピングがブロックされている可能性があります。"
    );

  return normalizeAndTruncateText(text, cefrLevel);
}

// ─── Claude AI ─────────────────────────────────────────────────────────────

interface ClaudeResult {
  phrases: PhraseResult[];
  fullScriptWithHighlight: string;
  overallLevel?: string;
}

async function callClaude(text: string, cefrLevel: string): Promise<ClaudeResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const snippet = text.slice(0, 5500);

  const systemPrompt = `あなたは英語教育の専門家です。日本人英語学習者のために、英語テキストから学習価値の高い表現を分析・抽出します。出力は必ず指定されたJSON形式のみとし、前置きや説明文は一切出力しないでください。`;

  const userPrompt = `以下の英語テキストを分析し、**${cefrLevel}レベルの日本人英語学習者**（${LEVEL_DESCRIPTIONS[cefrLevel]}）にとって学習価値の高い重要表現を抽出してください。

## 抽出ターゲット（優先順位順）

1. **句動詞（Phrasal Verbs）**
   - "figure out", "pull off", "bring up", "get away with" など
   - 分離・非分離のパターン、前置詞との微妙なニュアンス差も含む

2. **イディオム・慣用表現**
   - ネイティブが日常的に使う固定表現
   - 文字通りに訳すと意味が取れないもの

3. **コロケーション（自然な語の組み合わせ）**
   - "make a decision" ではなく "reach a decision" のような、日本人が間違えやすい語の組み合わせ
   - 動詞＋名詞、形容詞＋名詞の自然なペア

4. **日本人が苦手な文法パターン**
   - 自然な仮定法・条件文の使い方
   - 分詞構文の慣用的用法
   - 強調構文（It is ... that）・倒置
   - 前置詞の選択が難しいパターン

## 抽出基準（最重要）

- **「意味は推測できるが、自分では咄嗟に使えない（Active Vocabularyになっていない）」**表現を最優先する
- ${cefrLevel}レベルの学習者がちょうど習得すべき難易度の表現を選ぶ
- 単純な単語や基礎表現（${cefrLevel}以下のレベル）は絶対に含めない
- **8〜12個**を目安に、質を重視して厳選する

## expression フィールドの表記ルール（必須）

- 必ず辞書に載っている**原形（ベースフォーム）**で出力すること
- 文脈上の目的語（someone / something / oneself 等）は**含めない**
- 活用形（過去形・ing 形・三単現 -s 等）は原形に戻すこと
- 例: 「lug something」→「lug」 ／ 「took off」→「take off」 ／ 「burned the midnight oil」→「burn the midnight oil」 ／ 「figuring out」→「figure out」

## テキスト
${snippet}

## 出力形式
以下のJSONオブジェクトのみを返してください（他のテキストは一切不要）：
{
  "overallLevel": "テキスト全体の難易度をCEFRで総合判定（語彙・文法・内容の複雑さを考慮）。A1/A2/B1/B2/C1/C2 のいずれか1つ",
  "phrases": [
    {
      "expression": "表現の基本形（例: give it a shot, end up -ing, talk oneself out of）",
      "type": "phrasal_verb | idiom | collocation | grammar_pattern",
      "context": "テキスト内での使用箇所（前後の文脈を含む1〜2文。原文を正確に引用）",
      "context_translation": "context フィールドの自然な日本語訳（直訳でなく意訳）",
      "meaning_ja": "この文脈での自然な日本語訳（直訳でなく意訳）",
      "nuance": "なぜこの場面でこの表現が選ばれたか、語感・ニュアンス・使用場面の解説（2〜3文）",
      "example": "別のシチュエーションでの自然な使用例文（英語）",
      "example_translation": "example フィールドの自然な日本語訳",
      "cefr_level": "A1 | A2 | B1 | B2 | C1 | C2",
      "why_hard_for_japanese": "日本人学習者がこの表現を能動的に使いこなすのが難しい理由（1〜2文）"
    }
  ],
  "fullScriptWithHighlight": "【重要】上記テキストを一字一句正確にコピーし、抽出した各表現が実際に使われている箇所のみHTMLタグで囲んだ文字列。タグ形式は必ずシングルクォートを使うこと: <b data-expr='expressionの値'>実際のテキスト</b>。ルール：①代名詞の変化（oneself→himself等）があっても同じ表現として囲む ②動詞活用形（end up→ended up）も囲む ③テキストの文字は一切変更せずタグ追加のみ ④data-exprにはphrasesのexpressionの値をそのまま入れる"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // ── Try parsing as full object ──────────────────────────────────────────
  const objMatch = rawText.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]) as {
        phrases: PhraseResult[];
        fullScriptWithHighlight?: string;
        overallLevel?: string;
      };
      if (Array.isArray(parsed.phrases) && parsed.phrases.length > 0) {
        return {
          phrases: parsed.phrases,
          fullScriptWithHighlight: parsed.fullScriptWithHighlight ?? snippet,
          overallLevel: parsed.overallLevel,
        };
      }
    } catch {
      // fall through to array fallback below
    }
  }

  // ── Fallback: extract phrases array only (ignore highlight) ─────────────
  const arrMatch = rawText.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const phrases = JSON.parse(arrMatch[0]) as PhraseResult[];
      return { phrases, fullScriptWithHighlight: snippet };
    } catch {
      // fall through
    }
  }

  throw new Error("AIの応答形式が予期しないものでした。もう一度お試しください。");
}

// ─── Server-side shared cache for URL analysis ────────────────────────────
// Shared across ALL users — prevents repeated Supadata + Claude API calls
// for the same URL+level (e.g. sample videos). TTL: 7 days.

const cachedUrlAnalysis = unstable_cache(
  async (url: string, cefrLevel: string) => {
    let text: string;
    let sourceType: "youtube" | "web";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      text = await getYouTubeTranscript(url, cefrLevel);
      sourceType = "youtube";
    } else {
      text = await getWebContent(url, cefrLevel);
      sourceType = "web";
    }
    const { phrases, fullScriptWithHighlight, overallLevel } = await callClaude(text, cefrLevel);
    return { text, sourceType, phrases, fullScriptWithHighlight, overallLevel };
  },
  ["url-analysis-v1"],
  { revalidate: 7 * 24 * 60 * 60 } // 7 days
);

// ─── Main Server Action ────────────────────────────────────────────────────

function classifyError(msg: string): AnalyzeErrorCode {
  if (
    msg.includes("字幕が存在しません") ||
    msg.includes("字幕が見つかりませんでした") ||
    msg.includes("字幕が見つかりません") ||
    msg.includes("has no transcript") ||
    msg.includes("Transcript not found") ||
    (msg.includes("404") && msg.includes("字幕"))
  ) return "no_subtitles";

  if (
    msg.includes("URLの形式が正しくありません") ||
    msg.includes("YouTube URLの形式") ||
    msg.includes("Invalid URL") ||
    msg.includes("https://") ||
    msg.includes("URL を確認") ||
    msg.includes("形式が正しく")
  ) return "invalid_url";

  return "generic";
}

export async function analyzeContent(
  input: string,
  cefrLevel: string,
  inputMode: "url" | "text",
  devMode?: boolean
): Promise<
  | { success: true; data: AnalysisResult }
  | { success: false; error: string; errorCode: AnalyzeErrorCode }
> {
  try {
    if (!input.trim()) return { success: false, error: "入力が空です", errorCode: "generic" };
    if (!process.env.ANTHROPIC_API_KEY)
      return { success: false, error: "APIキーが設定されていません。.env.local を確認してください。", errorCode: "generic" };

    // Developer mode: skip Supadata API, load transcript from local file or demo text
    if (devMode && inputMode === "url") {
      const isTestUrl = input.trim().includes(DEV_TEST_VIDEO_ID);
      const transcript = normalizeAndTruncateText(
        isTestUrl ? loadMockTranscript() : DEMO_TRANSCRIPT,
        cefrLevel
      );
      // Always call Claude directly — bypass unstable_cache so every submit tests the prompt
      const { phrases, fullScriptWithHighlight, overallLevel } = await callClaude(transcript, cefrLevel);
      return {
        success: true,
        data: {
          phrases,
          source_type: "youtube",
          total_count: phrases.length,
          source_text: transcript,
          full_script_with_highlight: fullScriptWithHighlight,
          overall_level: overallLevel,
        },
      };
    }

    if (inputMode === "text") {
      const text = input.trim();
      const { phrases, fullScriptWithHighlight, overallLevel } = await callClaude(text, cefrLevel);
      return {
        success: true,
        data: {
          phrases,
          source_type: "text",
          total_count: phrases.length,
          source_text: text,
          full_script_with_highlight: fullScriptWithHighlight,
          overall_level: overallLevel,
        },
      };
    }

    // URL mode: use server-side cache (shared across users)
    const { text, sourceType, phrases, fullScriptWithHighlight, overallLevel } =
      await cachedUrlAnalysis(input.trim(), cefrLevel);

    return {
      success: true,
      data: {
        phrases,
        source_type: sourceType,
        total_count: phrases.length,
        source_text: text,
        full_script_with_highlight: fullScriptWithHighlight,
        overall_level: overallLevel,
      },
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "予期しないエラーが発生しました";
    return { success: false, error: msg, errorCode: classifyError(msg) };
  }
}
