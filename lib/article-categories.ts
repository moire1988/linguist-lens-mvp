/**
 * AI 記事生成でランダム選択するカテゴリ（DB の `category` にそのまま保存される）。
 */
export const ARTICLE_CATEGORIES = [
  "Deep Cultural Nuances & Society (e.g., unspoken rules outsiders miss, echoes of class, modern dating culture)",
  "Pop Culture & Z-Gen Trends (e.g., fresh net slang, meme culture, how people actually talk on social)",
  "Workplace & Daily Survival (e.g., real office English, pub and café survival, flat-share headaches)",
  "English Grammar & Nuance Masterclass (e.g., subtle differences between near-synonyms, what natives feel when they pick a tense — explain insights in English)",
] as const;

export function pickArticleCategory(): string {
  const list = ARTICLE_CATEGORIES as readonly string[];
  return list[Math.floor(Math.random() * list.length)];
}

/** Grammar 専用カテゴリか（本文を文法エッセイにする分岐用） */
export function isGrammarMasterclassCategory(category: string): boolean {
  return category.startsWith("English Grammar & Nuance Masterclass");
}

/** 一覧・詳細のカテゴリバッジ（キーは `ARTICLE_CATEGORIES` の文字列と完全一致） */
export const ARTICLE_CATEGORY_BADGE_STYLE: Record<string, string> = {
  [ARTICLE_CATEGORIES[0]]:
    "bg-violet-50 text-violet-700 border-violet-200",
  [ARTICLE_CATEGORIES[1]]:
    "bg-pink-50 text-pink-700 border-pink-200",
  [ARTICLE_CATEGORIES[2]]:
    "bg-sky-50 text-sky-700 border-sky-200",
  [ARTICLE_CATEGORIES[3]]:
    "bg-amber-50 text-amber-700 border-amber-200",
};

/** フィルタ用の短い表示名 */
export const ARTICLE_CATEGORY_SHORT_LABEL: Record<string, string> = {
  [ARTICLE_CATEGORIES[0]]: "文化・社会",
  [ARTICLE_CATEGORIES[1]]: "Pop / Z",
  [ARTICLE_CATEGORIES[2]]: "仕事・日常",
  [ARTICLE_CATEGORIES[3]]: "文法",
};
