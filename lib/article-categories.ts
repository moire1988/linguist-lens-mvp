/**
 * AI 記事生成で選ばれるカテゴリ（DB `category` にそのまま保存する日本語ラベル）。
 */
export const ARTICLE_CATEGORIES = [
  "リアルな英語・文法",
  "トレンド・スラング",
  "働き方・ライフスタイル",
  "恋愛・人間関係",
  "海外カルチャーあるある",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export function pickArticleCategory(): string {
  const list = ARTICLE_CATEGORIES as readonly string[];
  return list[Math.floor(Math.random() * list.length)];
}

/** 文法エッセイ・英語本文で解説するモード（プロンプト分岐用） */
export function isGrammarMasterclassCategory(category: string): boolean {
  const t = category.trim();
  return t === "リアルな英語・文法" || t.startsWith("リアルな英語・文法");
}

/** 一覧・詳細のカテゴリバッジ（キーは `ARTICLE_CATEGORIES` と完全一致） */
export const ARTICLE_CATEGORY_BADGE_STYLE: Record<string, string> = {
  "リアルな英語・文法":
    "bg-amber-50 text-amber-800 border-amber-200",
  "トレンド・スラング":
    "bg-pink-50 text-pink-800 border-pink-200",
  "働き方・ライフスタイル":
    "bg-sky-50 text-sky-800 border-sky-200",
  "恋愛・人間関係":
    "bg-rose-50 text-rose-800 border-rose-200",
  海外カルチャーあるある:
    "bg-violet-50 text-violet-800 border-violet-200",
};

/**
 * フィルタ用表示名（現行カテゴリはそのまま返す）。
 * @deprecated 新カテゴリは生文字列＝表示名のため、互換のため残す。
 */
export const ARTICLE_CATEGORY_SHORT_LABEL: Record<string, string> = {
  [ARTICLE_CATEGORIES[0]]: ARTICLE_CATEGORIES[0],
  [ARTICLE_CATEGORIES[1]]: ARTICLE_CATEGORIES[1],
  [ARTICLE_CATEGORIES[2]]: ARTICLE_CATEGORIES[2],
  [ARTICLE_CATEGORIES[3]]: ARTICLE_CATEGORIES[3],
  [ARTICLE_CATEGORIES[4]]: ARTICLE_CATEGORIES[4],
};

/** 旧ショートラベル（移行前 UI）→ 新カテゴリ */
const LEGACY_SHORT_TO_NEW: Record<string, string> = {
  "文化・社会": "海外カルチャーあるある",
  "ポップ・Z世代": "トレンド・スラング",
  "仕事・日常": "働き方・ライフスタイル",
  文法: "リアルな英語・文法",
};

/** 旧 DB 生値（短文）→ 新カテゴリ */
const LEGACY_ARTICLE_CATEGORY_SHORT_LABEL: Record<string, string> = {
  "Tech & Startup": "働き方・ライフスタイル",
  "Pop Culture & Entertainment": "トレンド・スラング",
  "Lifehacks & Psychology": "働き方・ライフスタイル",
  "Real Parenting & Family": "恋愛・人間関係",
  "Local Travel Secrets": "海外カルチャーあるある",
  "Tech & Startup Culture (e.g., remote work, AI tools, silicon valley trends)":
    "働き方・ライフスタイル",
  "Pop Culture & Entertainment (e.g., movies, music, internet slang)": "トレンド・スラング",
  "Psychology & Human Behavior (e.g., motivation, habits, communication)":
    "恋愛・人間関係",
  "Modern Daily Life & Relationships (e.g., dating, family dynamics, friendships)":
    "恋愛・人間関係",
  "Health, Wellness & Food (e.g., diet trends, mental health, workouts)":
    "働き方・ライフスタイル",
};

/** 長い英語カテゴリ（prefix）→ 新カテゴリ（長い方を先にマッチ） */
const LEGACY_CATEGORY_PREFIX_TO_NEW: readonly { prefix: string; label: string }[] = [
  { prefix: "English Grammar & Nuance Masterclass", label: "リアルな英語・文法" },
  { prefix: "Deep Cultural Nuances & Society", label: "海外カルチャーあるある" },
  { prefix: "Pop Culture & Z-Gen Trends", label: "トレンド・スラング" },
  { prefix: "Workplace & Daily Survival", label: "働き方・ライフスタイル" },
  { prefix: "Tech & Startup Culture", label: "働き方・ライフスタイル" },
  { prefix: "Pop Culture & Entertainment", label: "トレンド・スラング" },
  { prefix: "Psychology & Human Behavior", label: "恋愛・人間関係" },
  { prefix: "Modern Daily Life & Relationships", label: "恋愛・人間関係" },
  { prefix: "Health, Wellness & Food", label: "働き方・ライフスタイル" },
];

const NEW_SET = new Set<string>(ARTICLE_CATEGORIES as unknown as string[]);

/**
 * バッジ・フィルタ用の正規化カテゴリ名（常に新5分類のいずれか、または未マッチ時は原文）
 */
export function getArticleCategoryDisplayLabel(category: string | undefined): string {
  if (category === undefined) return "";
  const trimmed = category.trim();
  if (trimmed === "") return "";

  if (NEW_SET.has(trimmed)) return trimmed;

  const fromLegacyShort = LEGACY_SHORT_TO_NEW[trimmed];
  if (fromLegacyShort !== undefined) return fromLegacyShort;

  const fromLegacyExact = LEGACY_ARTICLE_CATEGORY_SHORT_LABEL[trimmed];
  if (fromLegacyExact !== undefined) return fromLegacyExact;

  for (const { prefix, label } of LEGACY_CATEGORY_PREFIX_TO_NEW) {
    if (trimmed.startsWith(prefix)) return label;
  }

  return trimmed;
}

/**
 * バッジ用クラス（旧 `category` 生値でも新5色に寄せる）
 */
export function getArticleCategoryBadgeClass(category: string | undefined): string {
  const label = getArticleCategoryDisplayLabel(category);
  return (
    ARTICLE_CATEGORY_BADGE_STYLE[label] ??
    "bg-slate-50 text-slate-600 border-slate-200"
  );
}
