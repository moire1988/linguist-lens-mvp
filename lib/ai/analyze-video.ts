/**
 * 動画・URL・テキスト解析向けの Anthropic 設定とプロンプト。
 * 決定性（temperature 0）・高速モデル（Haiku）・出力件数の上限をここで一元管理する。
 */

import type { PhraseResult } from "@/lib/types";

/**
 * 環境変数 `ANTHROPIC_ANALYSIS_MODEL` で最優先指定可能。
 * 既定は `app/actions/translate.ts` と同じ Haiku 4.5 → 旧 3.5 Haiku → 404 続く場合のみ Sonnet（解析失敗より遅延を許容）。
 * ※ `claude-3-haiku-20240307` 等は API 側で廃止され 404 になるため含めない。
 */
export const DEFAULT_ANALYSIS_MODEL_CANDIDATES = [
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-20241022",
  "claude-sonnet-4-5",
] as const;

export const ANALYSIS_TEMPERATURE = 0;

/** 出力トークン上限（フレーズ数制限とセットで物理的に生成時間を抑える） */
export const ANALYSIS_MAX_OUTPUT_TOKENS = 4096;

/** Claude に渡すテキスト先頭の最大文字数（入力トークン削減・レベル別全文切り詰めは別処理） */
export const ANALYSIS_SNIPPET_MAX_CHARS = 4500;

/** 厳選フレーズの上限（プロンプト・後処理の両方で強制） */
export const ANALYSIS_MAX_PHRASES = 10;

/** プロンプト上の目安の下限（AI に「埋めよう」とさせすぎないよう上限とセットで記載） */
export const ANALYSIS_TARGET_MIN_PHRASES = 8;

export const LEVEL_DESCRIPTIONS: Record<string, string> = {
  A1: "英語学習を始めたばかりの超入門者（TOEIC 〜225程度）",
  A2: "基本的な日常表現を理解できる初級者（TOEIC 225〜549程度）",
  B1: "日常的な話題で意思疎通できる中級者（TOEIC 550〜780 / TOEFL iBT 42〜71程度）",
  B2: "幅広いトピックで流暢にコミュニケーションできる中上級者（TOEIC 785〜940 / TOEFL iBT 72〜94程度）",
  C1: "複雑な内容も柔軟に使いこなせる上級者（TOEIC 945〜990 / TOEFL iBT 95〜120程度）",
  C2: "ネイティブに近い表現力を持つ熟達者",
};

export function getAnthropicAnalysisModelsToTry(): string[] {
  const envModel = process.env.ANTHROPIC_ANALYSIS_MODEL?.trim();
  const candidates = [
    envModel,
    ...DEFAULT_ANALYSIS_MODEL_CANDIDATES,
  ].filter((m): m is string => typeof m === "string" && m.length > 0);
  return Array.from(new Set(candidates));
}

export function buildAnalysisSystemPrompt(): string {
  return [
    "【重要】入力されたテキスト、字幕、URLのコンテンツが、性的な内容（NSFW）、暴力、ヘイトスピーチ、違法行為を助長する不適切なものであると判断した場合、解析を行わずに即座に { \"error\": \"INAPPROPRIATE_CONTENT\" } を返してください。",
    "あなたは英語教育の専門家です。日本人英語学習者のために、英語テキストから学習価値の高い表現を分析・抽出します。",
    "出力は必ず指定されたJSON形式のみとし、前置きや説明文は一切出力しないでください。",
    "**重要表現の件数は厳選して最大10個まで**とし、**11個目以降は絶対に出力しないでください**（配列の長さが10を超えてはいけません）。",
    "各フィールドは簡潔に：無駄な繰り返しや長文を避け、必要最小限の文量にしてください。",
    "抽出した表現や動画・テキストの文脈を踏まえて、学習者をモチベートする「AIコーチからのコメント」を coach_comment に2〜3文で書いてください。",
    "例：『〇〇や〇〇はネイティブも多用する必須表現です！』『カジュアルで日常会話にすぐ使える表現がたっぷりですね！』など、明るく親しみやすいトーンにすること。",
  ].join("\n");
}

export function buildAnalysisUserPrompt(cefrLevel: string, snippet: string): string {
  const levelDesc = LEVEL_DESCRIPTIONS[cefrLevel] ?? LEVEL_DESCRIPTIONS.B2;

  return `以下の英語テキストを分析し、**${cefrLevel}レベルの日本人英語学習者**（${levelDesc}）にとって学習価値の高い重要表現を抽出してください。

## 抽出件数（最優先・絶対遵守）
- **厳選した ${ANALYSIS_TARGET_MIN_PHRASES}〜${ANALYSIS_MAX_PHRASES} 個のみ**。質を優先し、${ANALYSIS_MAX_PHRASES} 個を超える場合は上位のみを残し、**${ANALYSIS_MAX_PHRASES} 個を超える要素を phrases 配列に含めてはいけません**。
- 簡潔な出力が求められています。説明は短く、重複を避けてください。

## 抽出ターゲット（優先順位順）

1. **句動詞（Phrasal Verbs）**
2. **イディオム・慣用表現**
3. **コロケーション（自然な語の組み合わせ）**
4. **日本人が苦手な文法パターン**

## 抽出基準

- **「意味は推測できるが、自分では咄嗟に使えない」**表現を最優先
- ${cefrLevel}レベルの学習者がちょうど習得すべき難易度
- 単純な基礎表現は含めない

## expression フィールドの表記ルール（必須）

- 辞書の**原形（ベースフォーム）**で出力
- 文脈上の目的語（someone / something 等）は**含めない**
- 活用形は原形に戻す（例: ended up → end up）

## テキスト
${snippet}

## 出力形式
以下のJSONオブジェクトのみを返してください（他のテキストは一切不要）：
{
  "overallLevel": "A1/A2/B1/B2/C1/C2 のいずれか1つ",
  "coach_comment": "AIコーチからの励ましコメント（日本語・2〜3文。上記のトーンで）",
  "phrases": [
    {
      "expression": "表現の基本形",
      "type": "phrasal_verb | idiom | collocation | grammar_pattern",
      "context": "使用箇所（1文、原文引用）",
      "context_translation": "context の自然な日本語訳",
      "meaning_ja": "この文脈での日本語訳（短く）",
      "nuance": "ニュアンス（1〜2文まで）",
      "example": "別シチュエーションの短い英語例文1つ",
      "example_translation": "example の日本語訳（短く）",
      "cefr_level": "A1 | A2 | B1 | B2 | C1 | C2",
      "why_hard_for_japanese": "日本人に難しい理由（1文）"
    }
  ],
  "fullScriptWithHighlight": "上記テキストを一字一句コピーし、抽出フレーズ箇所のみ <b data-expr='expressionの値'>実際のテキスト</b> で囲む。テキスト本体は変更禁止。phrases は最大${ANALYSIS_MAX_PHRASES}件なので、タグもその数に対応するまで。"
}`;
}

/**
 * AI が件数を超過した場合の保険。先頭から最大件数に切り詰める。
 */
export function capPhrasesAtMax(phrases: PhraseResult[]): PhraseResult[] {
  if (phrases.length <= ANALYSIS_MAX_PHRASES) return phrases;
  return phrases.slice(0, ANALYSIS_MAX_PHRASES);
}
