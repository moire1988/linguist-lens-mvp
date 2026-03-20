"use server";

import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import fs from "fs";
import path from "path";
import type { PhraseResult, AnalysisResult } from "@/lib/types";
import { DEV_TEST_VIDEO_ID } from "@/lib/settings";
export type { ExpressionType, PhraseResult, AnalysisResult } from "@/lib/types";

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

// ─── YouTube（Supadata API 経由）──────────────────────────────────────────

async function getYouTubeTranscript(url: string): Promise<string> {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (!match) throw new Error("YouTube URLの形式が正しくありません");
  const videoId = match[1];

  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "字幕取得APIキーが設定されていません（SUPADATA_API_KEY）。管理者に連絡してください。"
    );
  }

  const endpoint =
    `https://api.supadata.ai/v1/youtube/transcript` +
    `?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}` +
    `&text=true`;

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
    throw new Error(`字幕の取得に失敗しました（HTTP ${res.status}）`);
  }

  const data = (await res.json()) as { content?: string };
  const transcript = data.content?.trim();
  if (!transcript) {
    throw new Error("この動画には字幕が見つかりませんでした。");
  }

  return transcript.replace(/\s{2,}/g, " ").slice(0, 8000);
}

// ─── Web Article ───────────────────────────────────────────────────────────

async function getWebContent(url: string): Promise<string> {
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

  return text.slice(0, 8000);
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
      "meaning_ja": "この文脈での自然な日本語訳（直訳でなく意訳）",
      "nuance": "なぜこの場面でこの表現が選ばれたか、語感・ニュアンス・使用場面の解説（2〜3文）",
      "example": "別のシチュエーションでの自然な使用例文（英語）",
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
      text = await getYouTubeTranscript(url);
      sourceType = "youtube";
    } else {
      text = await getWebContent(url);
      sourceType = "web";
    }
    const { phrases, fullScriptWithHighlight, overallLevel } = await callClaude(text, cefrLevel);
    return { text, sourceType, phrases, fullScriptWithHighlight, overallLevel };
  },
  ["url-analysis-v1"],
  { revalidate: 7 * 24 * 60 * 60 } // 7 days
);

// ─── Main Server Action ────────────────────────────────────────────────────

export async function analyzeContent(
  input: string,
  cefrLevel: string,
  inputMode: "url" | "text",
  devMode?: boolean
): Promise<
  { success: true; data: AnalysisResult } | { success: false; error: string }
> {
  try {
    if (!input.trim()) return { success: false, error: "入力が空です" };
    if (!process.env.ANTHROPIC_API_KEY)
      return { success: false, error: "APIキーが設定されていません。.env.local を確認してください。" };

    // Developer mode: skip Supadata API, load transcript from local file or demo text
    if (devMode && inputMode === "url") {
      const isTestUrl = input.trim().includes(DEV_TEST_VIDEO_ID);
      const transcript = isTestUrl ? loadMockTranscript() : DEMO_TRANSCRIPT;
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
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "予期しないエラーが発生しました",
    };
  }
}
