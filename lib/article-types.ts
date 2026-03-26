// ─── CMS 記事の型定義 ────────────────────────────────────────────────────────

export interface ArticleVocabItem {
  word:                      string;  // 見出し語（原形）
  partOfSpeech:              string;  // "verb" | "noun" | "adjective" | "adverb" | "phrase"
  meaning:                   string;  // 日本語訳（簡潔に）
  nuance:                    string;  // ニュアンス解説（日本語）
  dynamicExample:            string;  // 記事に即した例文
  dynamicExampleTranslation?: string; // 例文の自然な日本語訳（任意）
}

export type EnglishVariant = "US" | "UK" | "AU" | "common";

export interface Article {
  id:              string;
  slug:            string;
  titleEn:         string;   // 英語ライン（サブ見出し・OG 等でも使用）
  titleJa?:        string;   // メイン見出し（日本語キャッチ）。未設定時は titleEn を主表示にフォールバック
  level:           string;
  englishVariant:  EnglishVariant;
  keyword?:        string;   // SEO focus keyword (e.g. "Netflix slang English B2")
  category?:       string;   // Content category (see `ARTICLE_CATEGORIES` in lib/article-categories.ts)
  culturalTip?:    string;   // 文化・語学豆知識（日本語 2〜3文）
  contentHtml:     string;
  translationHtml: string;
  vocabularyList:  ArticleVocabItem[];
  publishedAt:     string | null;
  createdAt:       string;
}

// 一覧ページ用の軽量型（content_html / translation_html を含まない）
export interface ArticleSummary {
  id:             string;
  slug:           string;
  titleEn:        string; // 英語サブ
  titleJa?:       string; // メイン見出し（任意）
  level:          string;
  englishVariant: EnglishVariant;
  keyword?:       string;
  category?:      string;
  publishedAt:    string | null;
  createdAt:      string;
}

// generateCmsArticle の戻り値
export type GenerateCmsArticleResult =
  | { success: true;  article: Article }
  | { success: false; error: string };
