export type ExpressionType =
  | "phrasal_verb"
  | "idiom"
  | "collocation"
  | "grammar_pattern";

export interface PhraseResult {
  expression: string;
  type: ExpressionType;
  context: string;
  context_translation?: string;
  meaning_ja: string;
  nuance: string;
  example: string;
  example_translation?: string;
  cefr_level: string;
  why_hard_for_japanese: string;
  /**
   * transcript 内でハイライトする際に実際に検索する文字列。
   * 動詞の活用・類義表現など expression と異なる形がテキストに現れる場合に指定する。
   * 未指定時は expression をそのまま検索する。
   * data-expr には常に expression が入り、カードとの紐付けは変わらない。
   */
  transcriptHighlight?: string;
}

export interface AnalysisResult {
  phrases: PhraseResult[];
  source_type: "youtube" | "web" | "text";
  total_count: number;
  /** 元コンテンツのタイトル（AI または取得元メタデータ） */
  title?: string;
  source_text?: string;
  full_script_with_highlight?: string;
  overall_level?: string;
}

/** UI / devMode の検証用。一般ユーザー向けコピーとは別にコードで原因を切り分け可能。 */
export type AnalyzeErrorCode =
  | "no_subtitles"
  | "invalid_url"
  | "missing_anthropic_key"
  | "missing_supadata_key"
  | "subtitle_api_error"
  | "ai_error"
  | "ai_rate_limit"
  | "ai_auth_error"
  | "generic";
