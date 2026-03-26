import type { MetadataRoute } from "next";
import { getAllPublicAnalysisIds } from "@/lib/db/analyses";
import { getAllPublishedArticleSlugs } from "@/lib/db/articles";
import { EXAMPLES } from "@/lib/examples-data";

const SITE_URL = "https://linguist-lens-mvp.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (
    (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy'))
  ) {
    return [];
  }
  // ── 固定ページ ──────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url:             SITE_URL,
      lastModified:    new Date(),
      changeFrequency: "daily",
      priority:        1.0,
    },
    {
      url:             `${SITE_URL}/examples`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.75,
    },
    {
      url:             `${SITE_URL}/mypage`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.5,
    },
  ];

  // ── examples ページ ─────────────────────────────────────────
  const exampleRoutes: MetadataRoute.Sitemap = EXAMPLES.map((ex) => ({
    url:             `${SITE_URL}/examples/${ex.slug}`,
    lastModified:    new Date(),
    changeFrequency: "monthly" as const,
    priority:        0.7,
  }));

  // ── 公開シェアページ（Supabase から動的取得）───────────────
  const publicAnalyses = await getAllPublicAnalysisIds();
  const shareRoutes: MetadataRoute.Sitemap = publicAnalyses.map(({ id, createdAt }) => ({
    url:             `${SITE_URL}/analyses/${id}`,
    lastModified:    new Date(createdAt),
    changeFrequency: "never" as const,
    priority:        0.8,
  }));

  // ── 公開記事（Supabase から動的取得）────────────────────────
  const publishedArticles = await getAllPublishedArticleSlugs();
  const articleRoutes: MetadataRoute.Sitemap = publishedArticles.map(({ slug, publishedAt }) => ({
    url:             `${SITE_URL}/articles/${slug}`,
    lastModified:    new Date(publishedAt),
    changeFrequency: "monthly" as const,
    priority:        0.9,
  }));

  return [...staticRoutes, ...exampleRoutes, ...shareRoutes, ...articleRoutes];
}
