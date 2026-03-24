import type { AnalysisResult } from "@/lib/types";

// ─── Constants ──────────────────────────────────────────────────────────────

export const ANALYSIS_MAX_SLOTS = 3;

const STORAGE_KEY = "ll_saved_analyses";
const RESTORE_KEY = "ll_restore";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SavedAnalysis {
  id: string;
  savedAt: string;
  sourceUrl?: string;
  inputMode: "url" | "text";
  cefrLevel: string;
  data: AnalysisResult;
  isShared?: boolean;
  isApproved?: boolean;
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
