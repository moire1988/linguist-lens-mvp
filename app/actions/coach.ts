"use server";

import Anthropic from "@anthropic-ai/sdk";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PhraseInput {
  expression: string;
  type: string;
  cefr_level: string;
  meaning_ja: string;
}

/** AIコーチの3段構成（各フィールドは Markdown 本文） */
export interface CoachAnalysis {
  /** 🎯 あなたの現在地（分析） */
  current_situation_md: string;
  /** 💡 おすすめの学習法（ソリューション） */
  learning_method_md: string;
  /** 🎬 今日のアクションプラン（具体例） */
  action_plan_md: string;
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

const COACH_SYSTEM_PROMPT = `あなたは LinguistLens（日本人向け英語学習アプリ）の「バイリンガル英語コーチ」です。日本語と英語の両方を扱い、学習者の気持ちに寄り添います。

## ペルソナとトーン（必須）
- 冷たい分析者やレポートの文体は禁止。「〜傾向があります」「客観的に見ると〜」だけで終わらせない。
- まず共感し、不安を和らげ、希望と次の一歩を必ずセットにする。例：「〜ですよね。でも大丈夫！こうやって克服しましょう！」のような、明るく励ますコーチの口調。
- 学習者を責めず、努力を認めつつ、苦手を「次に伸ばすチャンス」として語る。

## 出力フォーマット（必須）
- 応答は**有効な JSON オブジェクトのみ**（前置き・後書き・コードフェンス禁止）。
- 次の3キーを必ず含める。値はいずれも **GitHub Flavored Markdown 風の本文**（日本語メイン。英語の表現例はそのまま英語で）。
- **読みやすさ**：段落の間に空行を入れる。**太字**で要点を示す。必要に応じて \`- \` の箇条書きを使う。文字の塊（長い1段落だけ）にしない。

## 3段構成の内容ルール（各キー1つずつ対応）
1. current_situation_md  
   - テーマ：苦手な傾向や特徴の指摘（例：句動詞のニュアンス、コロケーションの選び方など）。  
   - リストのデータに触れつつ、共感→整理→前向きな一文で締める。

2. learning_method_md  
   - テーマ：おすすめの学習法（ソリューション）。  
   - 具体的で実行可能なステップ（短時間でできるものから）。必要なら小見出しは **太字行** で。

3. action_plan_md  
   - テーマ：今日のアクションプラン（具体例）。  
   - 必ず次のような**具体物**を盛り込む：LinguistLens で見るとよい動画のジャンルやトピック、海外ドラマの例（例：「フレンズのようなシットコムで〜」）、**まず覚えるとよいおすすめフレーズを3つ**（例：pull off, dawn on など。実際のリストに合わせて選ぶ）。`;

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

  const userPrompt = `以下は、ある日本人英語学習者が LinguistLens のマイ単語に保存した英語表現リストです。

${phraseList}

このリストを踏まえ、システム指示どおりに JSON のみを返してください。キー名は次の3つ固定です：
- "current_situation_md"
- "learning_method_md"
- "action_plan_md"`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: COACH_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AIの応答形式が予期しないものでした");

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const current = parsed.current_situation_md;
    const learning = parsed.learning_method_md;
    const action = parsed.action_plan_md;

    if (
      typeof current !== "string" ||
      typeof learning !== "string" ||
      typeof action !== "string"
    ) {
      throw new Error("AIの応答に必要なフィールドがありません");
    }

    const data: CoachAnalysis = {
      current_situation_md: current,
      learning_method_md: learning,
      action_plan_md: action,
    };
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "分析中にエラーが発生しました",
    };
  }
}
