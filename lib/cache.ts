import type { AnalysisResult } from "@/lib/types";
import { extractYouTubeVideoId } from "@/lib/youtube-url";

const CACHE_KEY = "linguist-lens-analysis-cache";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

export interface AnalysisCacheEntry {
  data: AnalysisResult;
  cachedAt: string;
  cefrLevel: string;
  /** DB 保存後に付与。同一動画×レベルで INSERT せずリダイレクトに使う */
  analysisId?: string;
}

type CacheStore = Record<string, AnalysisCacheEntry>;

function getStore(): CacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheStore) : {};
  } catch {
    return {};
  }
}

/** 旧キー形式（URL 文字列 + レベル） */
function legacyCacheKey(url: string, cefrLevel: string): string {
  return `${url.trim()}::${cefrLevel.trim()}`;
}

/**
 * YouTube は video_id ベースでキー統一（youtu.be / watch?v= の表記ゆれで重複しない）。
 * それ以外は URL 文字列ベース。
 */
export function buildCacheKey(url: string, cefrLevel: string): string {
  const level = cefrLevel.trim();
  const vid = extractYouTubeVideoId(url.trim());
  if (vid) return `yt:${vid}::${level}`;
  return `u:${url.trim()}::${level}`;
}

function persistStore(store: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * 7日以内のキャッシュエントリを取得。旧キーは新キーへ移行する。
 */
export function getCachedEntry(
  url: string,
  cefrLevel: string
): AnalysisCacheEntry | null {
  if (typeof window === "undefined") return null;
  const store = getStore();
  const newKey = buildCacheKey(url, cefrLevel);
  const legacyKey = legacyCacheKey(url, cefrLevel);

  let entry = store[newKey];
  let fromKey: string | null = entry ? newKey : null;

  if (!entry && legacyKey !== newKey) {
    const leg = store[legacyKey];
    if (leg) {
      entry = leg;
      fromKey = legacyKey;
    }
  }

  if (!entry) return null;

  if (!entry.data.full_script_with_highlight) {
    const k = fromKey ?? newKey;
    delete store[k];
    persistStore(store);
    return null;
  }

  const age = Date.now() - new Date(entry.cachedAt).getTime();
  if (age > CACHE_TTL_MS) {
    const k = fromKey ?? newKey;
    delete store[k];
    persistStore(store);
    return null;
  }

  if (fromKey && fromKey !== newKey) {
    store[newKey] = entry;
    delete store[fromKey];
    persistStore(store);
  }

  return entry;
}

export function getCachedResult(
  url: string,
  cefrLevel: string
): AnalysisResult | null {
  return getCachedEntry(url, cefrLevel)?.data ?? null;
}

/**
 * 解析結果をキャッシュ。保存完了後は analysisId を渡すと次回から INSERT を省略できる。
 */
export function setCachedResult(
  url: string,
  cefrLevel: string,
  data: AnalysisResult,
  analysisId?: string
): void {
  if (typeof window === "undefined") return;
  const store = getStore();
  const newKey = buildCacheKey(url, cefrLevel);
  const legacyKey = legacyCacheKey(url, cefrLevel);
  if (legacyKey !== newKey) {
    delete store[legacyKey];
  }
  const prev = store[newKey];
  store[newKey] = {
    data,
    cachedAt: new Date().toISOString(),
    cefrLevel: cefrLevel.trim(),
    analysisId: analysisId ?? prev?.analysisId,
  };
  persistStore(store);
}

export function getCacheCount(): number {
  return Object.keys(getStore()).length;
}
