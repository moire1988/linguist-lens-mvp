// ─── Login Prompt Store ───────────────────────────────────────────────────────
// 未ログインユーザーへのログイン誘導モーダルをアプリ全体から呼び出せる
// 軽量 pub/sub ストア（Context不要）。

export type LoginPromptFeature = "extraction" | "save" | "practice" | "generic";

export interface LoginPromptConfig {
  feature: LoginPromptFeature;
}

// ─── Pub/Sub ─────────────────────────────────────────────────────────────────

type Listener = (config: LoginPromptConfig | null) => void;
const listeners = new Set<Listener>();
let _config: LoginPromptConfig | null = null;

export function openLoginPrompt(feature: LoginPromptFeature = "generic"): void {
  _config = { feature };
  listeners.forEach((fn) => fn(_config));
}

export function closeLoginPrompt(): void {
  _config = null;
  listeners.forEach((fn) => fn(null));
}

export function getLoginPromptConfig(): LoginPromptConfig | null {
  return _config;
}

export function subscribeLoginPrompt(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Guest extraction tracking ────────────────────────────────────────────────
// ゲストユーザーの無料解析回数を管理する（1回まで無料）。

const GUEST_EXTRACTION_KEY = "ll_guest_extractions";

export function getGuestExtractionCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(GUEST_EXTRACTION_KEY) ?? "0", 10);
}

export function incrementGuestExtraction(): void {
  const c = getGuestExtractionCount();
  localStorage.setItem(GUEST_EXTRACTION_KEY, String(c + 1));
}
