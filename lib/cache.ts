import type { AnalysisResult } from "@/app/actions/analyze";

const CACHE_KEY = "linguist-lens-analysis-cache";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

interface CacheEntry {
  data: AnalysisResult;
  cachedAt: string;
  cefrLevel: string;
}

type CacheStore = Record<string, CacheEntry>;

function getStore(): CacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheStore) : {};
  } catch {
    return {};
  }
}

function buildKey(url: string, cefrLevel: string): string {
  return `${url.trim()}::${cefrLevel}`;
}

export function getCachedResult(
  url: string,
  cefrLevel: string
): AnalysisResult | null {
  const store = getStore();
  const entry = store[buildKey(url, cefrLevel)];
  if (!entry) return null;

  const age = Date.now() - new Date(entry.cachedAt).getTime();
  if (age > CACHE_TTL_MS) {
    // 期限切れを削除
    const key = buildKey(url, cefrLevel);
    delete store[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
    return null;
  }
  return entry.data;
}

export function setCachedResult(
  url: string,
  cefrLevel: string,
  data: AnalysisResult
): void {
  if (typeof window === "undefined") return;
  const store = getStore();
  store[buildKey(url, cefrLevel)] = {
    data,
    cachedAt: new Date().toISOString(),
    cefrLevel,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    // localStorage 容量不足時はキャッシュをリセット
    localStorage.removeItem(CACHE_KEY);
  }
}

export function getCacheCount(): number {
  return Object.keys(getStore()).length;
}
