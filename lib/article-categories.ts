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

/** フィルタ・バッジ用の短い表示名（日本語で統一） */
export const ARTICLE_CATEGORY_SHORT_LABEL: Record<string, string> = {
  [ARTICLE_CATEGORIES[0]]: "文化・社会",
  [ARTICLE_CATEGORIES[1]]: "ポップ・Z世代",
  [ARTICLE_CATEGORIES[2]]: "仕事・日常",
  [ARTICLE_CATEGORIES[3]]: "文法",
};

/** DB に残る旧カテゴリ文字列（一覧の UI 名と過去の CMS プロンプト） */
const LEGACY_ARTICLE_CATEGORY_SHORT_LABEL: Record<string, string> = {
  "Tech & Startup": "テック・スタートアップ",
  "Pop Culture & Entertainment": "ポップ文化",
  "Lifehacks & Psychology": "ライフハック・心理",
  "Real Parenting & Family": "子育て・家族",
  "Local Travel Secrets": "旅行・ローカル",
  "Tech & Startup Culture (e.g., remote work, AI tools, silicon valley trends)":
    "テック・スタートアップ",
  "Pop Culture & Entertainment (e.g., movies, music, internet slang)": "ポップ文化",
  "Psychology & Human Behavior (e.g., motivation, habits, communication)":
    "心理・行動",
  "Modern Daily Life & Relationships (e.g., dating, family dynamics, friendships)":
    "日常・人間関係",
  "Health, Wellness & Food (e.g., diet trends, mental health, workouts)":
    "健康・ウェルネス",
};

/** 長い文字列や軽微な表記ゆれを prefix で吸収（長い方を先にマッチさせる） */
const LEGACY_CATEGORY_PREFIX_LABELS: readonly { prefix: string; label: string }[] = [
  { prefix: "English Grammar & Nuance Masterclass", label: "文法" },
  { prefix: "Workplace & Daily Survival", label: "仕事・日常" },
  { prefix: "Pop Culture & Z-Gen Trends", label: "ポップ・Z世代" },
  { prefix: "Deep Cultural Nuances & Society", label: "文化・社会" },
  { prefix: "Tech & Startup Culture", label: "テック・スタートアップ" },
  { prefix: "Pop Culture & Entertainment", label: "ポップ文化" },
  { prefix: "Psychology & Human Behavior", label: "心理・行動" },
  { prefix: "Modern Daily Life & Relationships", label: "日常・人間関係" },
  { prefix: "Health, Wellness & Food", label: "健康・ウェルネス" },
];

/**
 * フィルタ・カード・管理画面で表示するカテゴリ名（DB の `category` 生値 → 日本語ラベル）
 */
export function getArticleCategoryDisplayLabel(category: string | undefined): string {
  if (category === undefined) return "";
  const trimmed = category.trim();
  if (trimmed === "") return "";

  const fromCurrent = ARTICLE_CATEGORY_SHORT_LABEL[trimmed];
  if (fromCurrent !== undefined) return fromCurrent;

  const fromLegacy = LEGACY_ARTICLE_CATEGORY_SHORT_LABEL[trimmed];
  if (fromLegacy !== undefined) return fromLegacy;

  for (const { prefix, label } of LEGACY_CATEGORY_PREFIX_LABELS) {
    if (trimmed.startsWith(prefix)) return label;
  }

  return trimmed;
}
