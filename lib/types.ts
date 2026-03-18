export type ExpressionType =
  | "phrasal_verb"
  | "idiom"
  | "collocation"
  | "grammar_pattern";

export interface PhraseResult {
  expression: string;
  type: ExpressionType;
  context: string;
  meaning_ja: string;
  nuance: string;
  example: string;
  cefr_level: string;
  why_hard_for_japanese: string;
}

export interface AnalysisResult {
  phrases: PhraseResult[];
  source_type: "youtube" | "web" | "text";
  total_count: number;
  source_text?: string;
}
