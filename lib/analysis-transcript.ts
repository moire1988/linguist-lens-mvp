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

/**
 * 本文の先頭から最初の非空行のみ（テキスト解析のカード見出し用）。
 */
export function getFirstLineFromAnalysisBody(data: AnalysisResult): string {
  const plain = resolveTranscriptPlainText(data);
  if (!plain) return "";
  for (const line of plain.split(/\r?\n/)) {
    const t = line.trim();
    if (t.length > 0) return t;
  }
  return "";
}
