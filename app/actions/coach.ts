"use server";

import Anthropic from "@anthropic-ai/sdk";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PhraseInput {
  expression: string;
  type: string;
  cefr_level: string;
  meaning_ja: string;
}

export interface TypeBreakdown {
  type: string;
  label: string;
  count: number;
  insight: string;
}

export interface Recommendation {
  title: string;
  detail: string;
}

export interface CoachAnalysis {
  weakness_summary: string;
  strong_areas: string;
  type_breakdown: TypeBreakdown[];
  recommendations: Recommendation[];
  encouragement: string;
}

export type CoachResult =
  | { success: true; data: CoachAnalysis }
  | { success: false; error: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  phrasal_verb: "句動詞",
  idiom: "イディオム",
  collocation: "コロケーション",
  grammar_pattern: "文法パターン",
};

// ─── Server Action ───────────────────────────────────────────────────────────

export async function analyzeVocabulary(
  phrases: PhraseInput[]
): Promise<CoachResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "APIキーが設定されていません" };
  }
  if (phrases.length < 5) {
    return { success: false, error: "分析には5個以上の表現が必要です" };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const phraseList = phrases
    .map(
      (p, i) =>
        `${i + 1}. [${TYPE_LABELS[p.type] ?? p.type}・${p.cefr_level}] ${p.expression}（${p.meaning_ja}）`
    )
    .join("\n");

  const prompt = `以下は、ある日本人英語学習者が保存した英語表現リストです。

${phraseList}

このリストを分析し、以下のJSONオブジェクトのみを返してください（前置き・説明文は不要）：
{
  "weakness_summary": "この学習者の苦手とする文法・表現パターンの分析（3〜4文。具体的な傾向と、なぜ日本人が苦手なのかの理由を含む）",
  "strong_areas": "すでに意識できている・得意な分野の分析（2〜3文。前向きな観点で）",
  "type_breakdown": [
    {
      "type": "phrasal_verb",
      "label": "句動詞",
      "count": 実際の保存数,
      "insight": "この種類に関するこの学習者固有の傾向・アドバイス（1〜2文）"
    }
  ],
  "recommendations": [
    {
      "title": "アドバイスのタイトル（12文字以内）",
      "detail": "具体的・実践的な学習方法（2〜3文）"
    }
  ],
  "encouragement": "この学習者の具体的な強みに触れながら、今後の学習への励ましのメッセージ（2文）"
}

注意：type_breakdownには実際に保存されている種類のみ含め、recommendationsは3〜4個にしてください。`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AIの応答形式が予期しないものでした");

    const data = JSON.parse(jsonMatch[0]) as CoachAnalysis;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "分析中にエラーが発生しました",
    };
  }
}
