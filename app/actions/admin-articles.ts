"use server";

import { createAdminClient } from "@/lib/supabase-admin";
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

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getAdminArticles(): Promise<Article[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("articles")
      .select("id, slug, title_en, title_ja, level, english_variant, keyword, category, cultural_tip, content_html, translation_html, vocabulary_json, published_at, created_at")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as ArticleRow[]).map(rowToArticle);
  } catch {
    return [];
  }
}

export async function updateArticlePublish(
  id: string,
  publish: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from("articles")
      .update({ published_at: publish ? new Date().toISOString() : null })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB エラー" };
  }
}

export async function deleteAdminArticle(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB エラー" };
  }
}
