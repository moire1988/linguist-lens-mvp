import { supabase } from "@/lib/supabase";
import type { Article, ArticleSummary, ArticleVocabItem, EnglishVariant } from "@/lib/article-types";

// ─── DB row shape ─────────────────────────────────────────────────────────────

interface ArticleRow {
  id:               string;
  slug:             string;
  title_en:         string;
  title_ja:         string | null;
  level:            string;
  english_variant:  EnglishVariant;
  keyword:          string | null;
  category:         string | null;
  cultural_tip:     string | null;
  content_html:     string;
  translation_html: string;
  vocabulary_json:  ArticleVocabItem[];
  published_at:     string | null;
  created_at:       string;
}

function rowToArticle(row: ArticleRow): Article {
  return {
    id:              row.id,
    slug:            row.slug,
    titleEn:         row.title_en,
    titleJa:         row.title_ja ?? undefined,
    level:           row.level,
    englishVariant:  row.english_variant ?? "common",
    keyword:         row.keyword ?? undefined,
    category:        row.category ?? undefined,
    culturalTip:     row.cultural_tip ?? undefined,
    contentHtml:     row.content_html,
    translationHtml: row.translation_html,
    vocabularyList:  row.vocabulary_json,
    publishedAt:     row.published_at,
    createdAt:       row.created_at,
  };
}

const SELECT_COLS =
  "id, slug, title_en, title_ja, level, english_variant, keyword, category, cultural_tip, content_html, translation_html, vocabulary_json, published_at, created_at";

// ─── Public queries (no auth required) ───────────────────────────────────────

/**
 * スラッグで公開済み記事を1件取得する。
 * 未公開 (published_at IS NULL) はヒットしない。
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(SELECT_COLS)
    .eq("slug", slug)
    .not("published_at", "is", null)
    .single();

  if (error || !data) return null;
  return rowToArticle(data as ArticleRow);
}

/**
 * 記事一覧ページ用: 公開済み記事を新しい順で全件返す（本文HTMLは含まない）。
 */
export async function getAllPublishedArticles(): Promise<ArticleSummary[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title_en, title_ja, level, english_variant, keyword, category, published_at, created_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as {
    id: string; slug: string; title_en: string; title_ja: string | null;
    level: string; english_variant: EnglishVariant; keyword: string | null; category: string | null;
    published_at: string | null; created_at: string;
  }[]).map((row) => ({
    id:             row.id,
    slug:           row.slug,
    titleEn:        row.title_en,
    titleJa:        row.title_ja ?? undefined,
    level:          row.level,
    englishVariant: row.english_variant ?? "common",
    keyword:        row.keyword ?? undefined,
    category:       row.category ?? undefined,
    publishedAt:    row.published_at,
    createdAt:      row.created_at,
  }));
}

/**
 * 関連記事: 同じレベルで現在記事を除いた公開済み記事を返す。
 * 同カテゴリを優先して最大 limit 件返す。
 */
export async function getRelatedArticles(
  currentSlug: string,
  level: string,
  category: string | undefined,
  limit = 3
): Promise<ArticleSummary[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title_en, title_ja, level, english_variant, keyword, category, published_at, created_at")
    .eq("level", level)
    .neq("slug", currentSlug)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(12);

  if (error || !data) return [];

  const articles = (data as {
    id: string; slug: string; title_en: string; title_ja: string | null;
    level: string; english_variant: EnglishVariant; keyword: string | null; category: string | null;
    published_at: string | null; created_at: string;
  }[]).map((row) => ({
    id:             row.id,
    slug:           row.slug,
    titleEn:        row.title_en,
    titleJa:        row.title_ja ?? undefined,
    level:          row.level,
    englishVariant: row.english_variant ?? "common",
    keyword:        row.keyword ?? undefined,
    category:       row.category ?? undefined,
    publishedAt:    row.published_at,
    createdAt:      row.created_at,
  }));

  // 同カテゴリを先頭に
  if (category) {
    articles.sort((a, b) => {
      const aMatch = a.category === category ? 0 : 1;
      const bMatch = b.category === category ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  return articles.slice(0, limit);
}

/**
 * サイトマップ用: 公開済み記事の slug / created_at 一覧を返す。
 */
export async function getAllPublishedArticleSlugs(): Promise<
  { slug: string; publishedAt: string }[]
> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return (data as { slug: string; published_at: string }[]).map((r) => ({
    slug:        r.slug,
    publishedAt: r.published_at,
  }));
}
