import type { AnalysisResult } from "@/lib/types";
import { getFirstLineFromAnalysisBody } from "@/lib/analysis-transcript";

// ─── Constants ──────────────────────────────────────────────────────────────

export const ANALYSIS_MAX_SLOTS = 3;

const STORAGE_KEY = "ll_saved_analyses";
const RESTORE_KEY = "ll_restore";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SavedAnalysis {
  id: string;
  savedAt: string;
  sourceUrl?: string;
  /** DB `saved_analyses.title`（記事・動画タイトル） */
  contentTitle?: string | null;
  inputMode: "url" | "text";
  cefrLevel: string;
  data: AnalysisResult;
  isShared?: boolean;
  /** DB `saved_analyses.is_approved`（トップ「みんなの解析」掲載・管理者承認） */
  isApproved?: boolean;
  /** DB `saved_analyses.is_public`（リンク共有・URLを知る人のみ閲覧可） */
  isPublic?: boolean;
  /** DB `saved_analyses.public_review_requested` */
  publicReviewRequested?: boolean;
}

/**
 * 解析詳細のシェアパネル（`AnalysisSharePanel`）と同じ公開ステータス表記。
 */
/**
 * マイページの解析カード等で表示するタイトル。
 * 取得できない場合は transcript / source_text 等の本文1行目に寄せる（表示は `line-clamp` で省略）。
 */
export function getSavedAnalysisCardTitle(analysis: SavedAnalysis): string {
  const titleFromDb = analysis.contentTitle?.trim() ?? "";
  if (titleFromDb !== "") return titleFromDb;

  const isTextSource =
    analysis.data.source_type === "text" ||
    (analysis.inputMode === "text" && !analysis.sourceUrl);

  if (isTextSource) {
    const first = getFirstLineFromAnalysisBody(analysis.data);
    if (first !== "") return first;
  }

  const titleFromResult = analysis.data.title?.trim() ?? "";
  if (titleFromResult !== "") return titleFromResult;

  const firstLineFallback = getFirstLineFromAnalysisBody(analysis.data);
  if (firstLineFallback !== "") return firstLineFallback;

  if (isTextSource) return "テキスト入力";
  return "解析結果";
}

export function getAnalysisPublicStatusLabel(analysis: SavedAnalysis): string {
  const linkOn = analysis.isPublic === true;
  const approved = analysis.isApproved === true;
  const pendingListing =
    analysis.publicReviewRequested === true && !approved;
  const isYt = analysis.data?.source_type === "youtube";

  if (linkOn && isYt && approved) return "みんなの解析に掲載中";
  if (linkOn && pendingListing) return "掲載審査待ち";
  if (linkOn) return "リンク共有中";
  return "非公開";
}

export type SaveAnalysisResult =
  | { success: true; id: string }
  | { success: false; reason: "full" };

// ─── CRUD ───────────────────────────────────────────────────────────────────

export function getSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis[]) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(
  data: AnalysisResult,
  inputMode: "url" | "text",
  cefrLevel: string,
  sourceUrl?: string
): SaveAnalysisResult {
  const current = getSavedAnalyses();
  if (current.length >= ANALYSIS_MAX_SLOTS) {
    return { success: false, reason: "full" };
  }
  const entry: SavedAnalysis = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
    sourceUrl,
    inputMode,
    cefrLevel,
    data,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...current]));
  return { success: true, id: entry.id };
}

export function deleteSavedAnalysis(id: string): void {
  const updated = getSavedAnalyses().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ─── Restore handoff (sessionStorage — cleared on tab close) ────────────────

/** Store analysis ID so the main page can restore it on next mount. */
export function setPendingRestore(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESTORE_KEY, id);
}

/** Read and immediately clear the pending restore ID. Returns null if none. */
export function getPendingRestore(): string | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(RESTORE_KEY);
  if (id) sessionStorage.removeItem(RESTORE_KEY);
  return id;
}
