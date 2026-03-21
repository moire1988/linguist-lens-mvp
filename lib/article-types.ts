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
  title:           string;
  level:           string;
  englishVariant:  EnglishVariant;
  keyword?:        string;   // SEO focus keyword (e.g. "Netflix slang English B2")
  category?:       string;   // Content category (e.g. "Pop Culture & Entertainment")
  contentHtml:     string;
  translationHtml: string;
  vocabularyList:  ArticleVocabItem[];
  publishedAt:     string | null;
  createdAt:       string;
}

// generateCmsArticle の戻り値
export type GenerateCmsArticleResult =
  | { success: true;  article: Article }
  | { success: false; error: string };
