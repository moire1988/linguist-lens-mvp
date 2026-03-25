import type { PhraseResult } from "@/lib/types";

/** トップ「最新の解析」カルーセル用 */
export interface RecentPublicAnalysis {
  id: string;
  title: string | null;
  url: string | null;
  level: string;
  phrases: PhraseResult[];
  createdAt: string;
}

/** トップ「注目の解析記事」用 */
export interface FeaturedAnalysis {
  id: string;
  url: string | null;
  level: string;
  phrases: PhraseResult[];
  phraseCount: number;
  createdAt: string;
}
