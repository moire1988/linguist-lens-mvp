import type { AnalysisResult } from "@/lib/types";

/**
 * 全文スクリプト用のプレーンテキスト（ハイライト HTML の元）。
 * transcript / script_text / source_text のいずれか最初に中身があるものを採用。
 */
export function resolveTranscriptPlainText(data: AnalysisResult): string {
  const candidates = [data.transcript, data.script_text, data.source_text];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return "";
}
