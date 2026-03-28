import type { MetadataRoute } from "next";
import { getAllGrammarSlugs } from "@/lib/grammar-lesson";
import { getAllPublicAnalysisIds } from "@/lib/db/analyses";
import { getAllPublishedArticleSlugs } from "@/lib/db/articles";
import { EXAMPLES } from "@/lib/examples-data";
import { getPublicSiteUrl } from "@/lib/site-url";

const SITE_URL = getPublicSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const grammarIndexRoute: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/library/grammar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
  ];

  const grammarDetailRoutes: MetadataRoute.Sitemap = getAllGrammarSlugs().map(
    (slug) => ({
      url: `${SITE_URL}/library/grammar/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })
  );

  const grammarRoutes = [...grammarIndexRoute, ...grammarDetailRoutes];

  const supabaseUnavailable =
    (process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy");

  if (supabaseUnavailable) {
    return grammarRoutes;
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/examples`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/mypage`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const exampleRoutes: MetadataRoute.Sitemap = EXAMPLES.map((ex) => ({
    url: `${SITE_URL}/examples/${ex.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const publicAnalyses = await getAllPublicAnalysisIds();
  const shareRoutes: MetadataRoute.Sitemap = publicAnalyses.map(
    ({ id, createdAt }) => ({
      url: `${SITE_URL}/analyses/${id}`,
      lastModified: new Date(createdAt),
      changeFrequency: "never" as const,
      priority: 0.8,
    })
  );

  const publishedArticles = await getAllPublishedArticleSlugs();
  const articleRoutes: MetadataRoute.Sitemap = publishedArticles.map(
    ({ slug, publishedAt }) => ({
      url: `${SITE_URL}/articles/${slug}`,
      lastModified: new Date(publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })
  );

  return [
    ...staticRoutes,
    ...exampleRoutes,
    ...grammarRoutes,
    ...shareRoutes,
    ...articleRoutes,
  ];
}
