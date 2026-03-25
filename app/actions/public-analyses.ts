"use server";

import { getRecentPublicAnalyses, getFeaturedAnalyses } from "@/lib/db/analyses";
import type { FeaturedAnalysis, RecentPublicAnalysis } from "@/lib/public-analyses-types";

export type { FeaturedAnalysis, RecentPublicAnalysis };

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
