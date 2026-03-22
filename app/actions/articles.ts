"use server";

import { getAllPublishedArticles } from "@/lib/db/articles";
import type { ArticleSummary } from "@/lib/article-types";

export async function getLatestArticlesAction(limit = 10): Promise<ArticleSummary[]> {
  const all = await getAllPublishedArticles();
  return all.slice(0, limit);
}
