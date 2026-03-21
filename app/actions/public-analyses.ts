"use server";

import { getRecentPublicAnalyses } from "@/lib/db/analyses";
import type { RecentPublicAnalysis } from "@/lib/db/analyses";

export type { RecentPublicAnalysis };

export async function getRecentPublicAnalysesAction(
  limit = 6
): Promise<RecentPublicAnalysis[]> {
  return getRecentPublicAnalyses(limit);
}
