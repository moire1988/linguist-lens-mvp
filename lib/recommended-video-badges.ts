import type { VideoCategory } from "@/lib/recommended-videos-data";

/** トップ「おすすめ動画」カルーセルと /examples 一覧で共通 */
export const RECOMMENDED_LEVEL_STYLES: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600 border-slate-300",
  A2: "bg-green-50 text-green-700 border-green-200",
  B1: "bg-blue-50 text-blue-700 border-blue-200",
  B2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  C1: "bg-purple-50 text-purple-700 border-purple-200",
  C2: "bg-rose-50 text-rose-700 border-rose-200",
};

export const RECOMMENDED_CATEGORY_STYLES: Record<VideoCategory, string> = {
  TED: "bg-red-50 text-red-600 border-red-200",
  Speech: "bg-amber-50 text-amber-700 border-amber-200",
  Vlog: "bg-emerald-50 text-emerald-700 border-emerald-200",
  News: "bg-sky-50 text-sky-700 border-sky-200",
  Podcast: "bg-violet-50 text-violet-700 border-violet-200",
};
