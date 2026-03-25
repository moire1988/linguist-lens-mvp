"use server";

import { getRecentPublicAnalyses, getFeaturedAnalyses } from "@/lib/db/analyses";
import type { RecentPublicAnalysis, FeaturedAnalysis } from "@/lib/db/analyses";

export type { RecentPublicAnalysis, FeaturedAnalysis };

export async function getRecentPublicAnalysesAction(
  limit = 6
): Promise<RecentPublicAnalysis[]> {
  return getRecentPublicAnalyses(limit);
}

export async function getFeaturedAnalysesAction(
  limit = 6
): Promise<FeaturedAnalysis[]> {
  return getFeaturedAnalyses(limit);
}
