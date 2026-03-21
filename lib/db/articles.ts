import { supabase } from "@/lib/supabase";
import type { Article, ArticleVocabItem, EnglishVariant } from "@/lib/article-types";

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
    contentHtml:     row.content_html,
    translationHtml: row.translation_html,
    vocabularyList:  row.vocabulary_json,
    publishedAt:     row.published_at,
    createdAt:       row.created_at,
  };
}

const SELECT_COLS =
  "id, slug, title_en, title_ja, level, english_variant, keyword, category, content_html, translation_html, vocabulary_json, published_at, created_at";

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
