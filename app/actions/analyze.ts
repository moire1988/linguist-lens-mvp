import "server-only";

import Anthropic, { APIError } from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fetchTranscript } from "youtube-transcript";
import type { AnalyzeErrorCode, PhraseResult, AnalysisResult } from "@/lib/types";
import { DEV_TEST_VIDEO_ID } from "@/lib/settings";
import {
  findExistingSavedAnalysisId,
  peekLatestSavedAnalysisId,
} from "@/lib/find-existing-analysis";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import { isAnalyzeDebugMagicUrlInput } from "@/lib/analyze-debug-magic";
import {
  ANALYSIS_MAX_OUTPUT_TOKENS,
  ANALYSIS_SNIPPET_MAX_CHARS,
  ANALYSIS_TEMPERATURE,
  buildAnalysisSystemPrompt,
  buildAnalysisUserPrompt,
  capPhrasesAtMax,
  getAnthropicAnalysisModelsToTry,
} from "@/lib/ai/analyze-video";

export type {
  AnalyzeErrorCode,
  ExpressionType,
  PhraseResult,
  AnalysisResult,
} from "@/lib/types";

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

// ─── YouTube: Supadata（主） + youtube-transcript（フォールバック）──────────

const SUPADATA_FETCH_MS = 45_000;

async function getYouTubeTranscriptUnofficial(
  videoId: string,
  cefrLevel: string,
  offsetSeconds: number
): Promise<string> {
  const chunks = await fetchTranscript(videoId);
  let list = chunks;
  if (offsetSeconds > 0 && chunks.length > 0) {
    const filtered = chunks.filter((c) => {
      const startSec = c.offset >= 1000 ? c.offset / 1000 : c.offset;
      return startSec >= offsetSeconds - 0.05;
    });
    if (filtered.length > 0) list = filtered;
  }
  const raw = list.map((c) => c.text).join(" ").replace(/\s{2,}/g, " ").trim();
  if (!raw) {
    throw new Error("この動画には字幕が見つかりませんでした。");
  }
  return normalizeAndTruncateText(raw, cefrLevel);
}

async function getYouTubeTranscriptSupadata(
  videoId: string,
  cefrLevel: string,
  offsetSeconds: number
): Promise<string> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "字幕取得APIキーが設定されていません（SUPADATA_API_KEY）。管理者に連絡してください。"
    );
  }

  const params = new URLSearchParams({ videoId });
  if (offsetSeconds === 0) {
    params.set("text", "true");
  }

  const endpoint = `https://api.supadata.ai/v1/youtube/transcript?${params.toString()}`;

  const res = await fetch(endpoint, {
    headers: { "x-api-key": apiKey },
    signal: AbortSignal.timeout(SUPADATA_FETCH_MS),
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

async function getYouTubeTranscript(url: string, cefrLevel: string): Promise<string> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("YouTube URLの形式が正しくありません");
  }
  const offsetSeconds = getYouTubeOffsetSeconds(url);

  try {
    return await getYouTubeTranscriptSupadata(videoId, cefrLevel, offsetSeconds);
  } catch (primary) {
    try {
      return await getYouTubeTranscriptUnofficial(videoId, cefrLevel, offsetSeconds);
    } catch {
      throw primary instanceof Error ? primary : new Error("字幕の取得に失敗しました");
    }
  }
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
  coachComment?: string;
}

function parseClaudeRawOutput(rawText: string, snippet: string): ClaudeResult {
  const objMatch = rawText.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]) as {
        error?: string;
        phrases?: PhraseResult[];
        fullScriptWithHighlight?: string;
        overallLevel?: string;
        coach_comment?: string;
      };
      if (parsed.error === "INAPPROPRIATE_CONTENT") {
        throw new Error("INAPPROPRIATE_CONTENT");
      }
      if (Array.isArray(parsed.phrases) && parsed.phrases.length > 0) {
        const coachRaw = parsed.coach_comment;
        const coachComment =
          typeof coachRaw === "string" && coachRaw.trim() !== ""
            ? coachRaw.trim()
            : undefined;
        return {
          phrases: capPhrasesAtMax(parsed.phrases),
          fullScriptWithHighlight: parsed.fullScriptWithHighlight ?? snippet,
          overallLevel: parsed.overallLevel,
          coachComment,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const arrMatch = rawText.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const phrases = capPhrasesAtMax(JSON.parse(arrMatch[0]) as PhraseResult[]);
      return { phrases, fullScriptWithHighlight: snippet, coachComment: undefined };
    } catch {
      /* fall through */
    }
  }

  throw new Error("AIの応答形式が予期しないものでした。もう一度お試しください。");
}

function claudeErrorToUserMessage(err: unknown): Error {
  if (err instanceof APIError) {
    if (err.status === 429) {
      return new Error(
        "AIの利用上限に達しました。しばらくしてから再度お試しください。"
      );
    }
    if (err.status === 401 || err.status === 403) {
      return new Error(
        "AI APIの認証に失敗しました。環境設定をご確認ください。"
      );
    }
    return new Error(`AI解析エラー（${String(err.status)}）: ${err.message}`);
  }
  return err instanceof Error ? err : new Error("AI解析に失敗しました");
}

async function callClaude(text: string, cefrLevel: string): Promise<ClaudeResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const snippet = text.slice(0, ANALYSIS_SNIPPET_MAX_CHARS);

  const systemPrompt = buildAnalysisSystemPrompt();
  const userPrompt = buildAnalysisUserPrompt(cefrLevel, snippet);

  const models = getAnthropicAnalysisModelsToTry();
  let lastModelError: unknown;

  for (const model of models) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: ANALYSIS_MAX_OUTPUT_TOKENS,
        temperature: ANALYSIS_TEMPERATURE,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      });
      const rawText =
        response.content[0].type === "text" ? response.content[0].text : "";
      return parseClaudeRawOutput(rawText, snippet);
    } catch (err) {
      lastModelError = err;
      if (err instanceof APIError && err.status === 404) {
        continue;
      }
      throw claudeErrorToUserMessage(err);
    }
  }

  throw lastModelError instanceof Error
    ? lastModelError
    : new Error("利用可能なAIモデルが見つかりませんでした。");
}

// ─── URL analysis (no unstable_cache: avoids serverless cache edge cases) ───

async function runUrlAnalysis(url: string, cefrLevel: string) {
  let text: string;
  let sourceType: "youtube" | "web";
  if (extractYouTubeVideoId(url)) {
    text = await getYouTubeTranscript(url, cefrLevel);
    sourceType = "youtube";
  } else {
    text = await getWebContent(url, cefrLevel);
    sourceType = "web";
  }
  const { phrases, fullScriptWithHighlight, overallLevel, coachComment } =
    await callClaude(text, cefrLevel);
  return {
    text,
    sourceType,
    phrases,
    fullScriptWithHighlight,
    overallLevel,
    coachComment,
  };
}

// ─── Main Server Action ────────────────────────────────────────────────────

const ANALYZE_DEBUG_SLEEP_MS = 2500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function classifyError(msg: string): AnalyzeErrorCode {
  if (msg === "INAPPROPRIATE_CONTENT" || msg.includes("INAPPROPRIATE_CONTENT")) {
    return "inappropriate_content";
  }
  if (
    msg.includes("ANTHROPIC_API_KEY") ||
    (msg.includes("APIキーが設定されていません") &&
      (msg.includes(".env") || msg.includes("環境")))
  ) {
    return "missing_anthropic_key";
  }
  if (msg.includes("SUPADATA_API_KEY") || msg.includes("字幕取得APIキーが設定されていません")) {
    return "missing_supadata_key";
  }
  if (msg.includes("AIの利用上限に達しました")) return "ai_rate_limit";
  if (msg.includes("AI APIの認証に失敗")) return "ai_auth_error";
  if (msg.includes("利用可能なAIモデルが見つかりません")) return "ai_error";
  if (msg.startsWith("AI解析エラー") || msg.includes("AI解析に失敗しました")) {
    return "ai_error";
  }

  if (
    msg.includes("字幕の取得に失敗しました") ||
    msg.includes("字幕APIエラー") ||
    msg.includes("字幕取得サービスで一時的なエラー") ||
    msg.includes("字幕取得リクエストが無効")
  ) {
    return "subtitle_api_error";
  }

  if (
    msg.includes("字幕が存在しません") ||
    msg.includes("字幕が見つかりませんでした") ||
    msg.includes("字幕が見つかりません") ||
    msg.includes("has no transcript") ||
    msg.includes("Transcript not found") ||
    (msg.includes("404") && msg.includes("字幕"))
  ) {
    return "no_subtitles";
  }

  if (
    msg.includes("URLの形式が正しくありません") ||
    msg.includes("YouTube URLの形式") ||
    msg.includes("Invalid URL") ||
    msg.includes("URL を確認") ||
    (msg.includes("形式が正しく") && msg.includes("URL"))
  ) {
    return "invalid_url";
  }

  return "generic";
}

export async function analyzeContent(
  input: string,
  cefrLevel: string,
  inputMode: "url" | "text",
  devMode?: boolean
): Promise<
  | { success: true; data: AnalysisResult }
  | { success: true; existingAnalysisId: string }
  | { success: false; error: string; errorCode: AnalyzeErrorCode }
> {
  try {
    if (!input.trim()) return { success: false, error: "入力が空です", errorCode: "generic" };

    /**
     * 開発時の魔法入力は DB キャッシュより優先し、ここではスキップ（衝突防止）。
     */
    const skipCacheForDebugMagic =
      process.env.NODE_ENV === "development" &&
      inputMode === "url" &&
      isAnalyzeDebugMagicUrlInput(input);

    /**
     * Pre-check（最優先）: Supabase `saved_analyses`（アプリ上の解析永続テーブル）を
     * video_id + level または url + level で検索。ヒット時は字幕/AI を一切呼ばない。
     */
    if (inputMode === "url" && !devMode && !skipCacheForDebugMagic) {
      const existingId = await findExistingSavedAnalysisId(input.trim(), cefrLevel);
      if (existingId) {
        console.log("Cache hit! Skipping AI generation.");
        return { success: true, existingAnalysisId: existingId };
      }
    }

    // DEV のみ: 魔法の URL → 字幕・AI を一切呼ばず、遅延後に既存解析ページへ誘導
    if (
      process.env.NODE_ENV === "development" &&
      inputMode === "url" &&
      isAnalyzeDebugMagicUrlInput(input)
    ) {
      await sleep(ANALYZE_DEBUG_SLEEP_MS);
      const envId = process.env.DEBUG_REDIRECT_ANALYSIS_ID?.trim();
      if (envId) {
        return { success: true, existingAnalysisId: envId };
      }
      const latestId = await peekLatestSavedAnalysisId();
      if (latestId) {
        return { success: true, existingAnalysisId: latestId };
      }
      return {
        success: false,
        error:
          "開発デバッグ: リダイレクト先がありません。.env.local に DEBUG_REDIRECT_ANALYSIS_ID=<saved_analyses の UUID> を設定するか、一度通常の解析でデータを作成してください。",
        errorCode: "generic",
      };
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error:
          "Anthropic APIキーが設定されていません（ANTHROPIC_API_KEY）。Vercel の Environment Variables を確認してください。",
        errorCode: "missing_anthropic_key",
      };
    }

    // Developer mode: skip Supadata API, load transcript from local file or demo text
    if (devMode && inputMode === "url") {
      const isTestUrl = input.trim().includes(DEV_TEST_VIDEO_ID);
      const transcript = normalizeAndTruncateText(
        isTestUrl ? loadMockTranscript() : DEMO_TRANSCRIPT,
        cefrLevel
      );
      // Always call Claude directly so every submit tests the prompt
      const { phrases, fullScriptWithHighlight, overallLevel, coachComment } =
        await callClaude(transcript, cefrLevel);
      return {
        success: true,
        data: {
          phrases,
          source_type: "youtube",
          total_count: phrases.length,
          source_text: transcript,
          full_script_with_highlight: fullScriptWithHighlight,
          overall_level: overallLevel,
          coach_comment: coachComment,
        },
      };
    }

    if (inputMode === "text") {
      const text = input.trim();
      const { phrases, fullScriptWithHighlight, overallLevel, coachComment } =
        await callClaude(text, cefrLevel);
      return {
        success: true,
        data: {
          phrases,
          source_type: "text",
          total_count: phrases.length,
          source_text: text,
          full_script_with_highlight: fullScriptWithHighlight,
          overall_level: overallLevel,
          coach_comment: coachComment,
        },
      };
    }

    // URL mode（新規のみ）
    const {
      text,
      sourceType,
      phrases,
      fullScriptWithHighlight,
      overallLevel,
      coachComment,
    } = await runUrlAnalysis(input.trim(), cefrLevel);

    return {
      success: true,
      data: {
        phrases,
        source_type: sourceType,
        total_count: phrases.length,
        source_text: text,
        full_script_with_highlight: fullScriptWithHighlight,
        overall_level: overallLevel,
        coach_comment: coachComment,
      },
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "予期しないエラーが発生しました";
    const code = classifyError(msg);
    const userMessage =
      code === "inappropriate_content"
        ? "不適切なコンテンツが含まれているため解析できませんでした。"
        : msg;
    return { success: false, error: userMessage, errorCode: code };
  }
}
