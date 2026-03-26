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
 * YouTube: `yt:videoId::level` — Web 記事: `web:canonicalUrl::level`（旧 `u:` は読み取り互換のみ）。
 * テキスト解析はこのキャッシュを使わない（page 側で URL モードのみ参照）。
 */
export function buildCacheKey(url: string, cefrLevel: string): string {
  const level = cefrLevel.trim();
  const u = url.trim();
  if (!u || !level) return `__invalid__::${level}`;
  const vid = extractYouTubeVideoId(u);
  if (vid) return `yt:${vid}::${level}`;
  return `web:${u}::${level}`;
}

/** 移行前の Web 用プレフィックス */
function legacyWebCacheKey(url: string, cefrLevel: string): string {
  return `u:${url.trim()}::${cefrLevel.trim()}`;
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
  const legacyWebKey = legacyWebCacheKey(url, cefrLevel);

  let entry = store[newKey];
  let fromKey: string | null = entry ? newKey : null;

  if (!entry && legacyWebKey !== newKey) {
    const lw = store[legacyWebKey];
    if (lw) {
      entry = lw;
      fromKey = legacyWebKey;
    }
  }

  if (!entry && legacyKey !== newKey && legacyKey !== legacyWebKey) {
    const leg = store[legacyKey];
    if (leg) {
      entry = leg;
      fromKey = legacyKey;
    }
  }

  if (!entry) return null;

  /** URL 種別と source_type の不一致（誤キャッシュ）は破棄する */
  const st = entry.data.source_type;
  const keyUsed = fromKey ?? newKey;
  const isYtKey = keyUsed.startsWith("yt:");
  const isWebKey =
    keyUsed.startsWith("web:") || keyUsed.startsWith("u:");

  if (isWebKey && st === "youtube") {
    delete store[keyUsed];
    persistStore(store);
    return null;
  }
  if (isYtKey && st !== "youtube") {
    delete store[keyUsed];
    persistStore(store);
    return null;
  }

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
  const legacyWebKey = legacyWebCacheKey(url, cefrLevel);
  if (legacyKey !== newKey) {
    delete store[legacyKey];
  }
  if (legacyWebKey !== newKey) {
    delete store[legacyWebKey];
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
