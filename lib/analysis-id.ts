/** 動的ルートの [id] を DB の UUID 照合用に正規化 */
export function normalizeAnalysisId(raw: string): string {
  let id = raw.trim();
  try {
    id = decodeURIComponent(id);
  } catch {
    // ignore malformed URI
  }
  return id.trim();
}
