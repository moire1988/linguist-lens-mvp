// ─── Mock Auth State ─────────────────────────────────────────────────────────
// DevモードがONの時のみ使用する認証モック。
// localStorage に保存し、pub/sub でリアルタイムに全コンポーネントへ通知する。

export type MockAuthState = "unauthenticated" | "free" | "pro";

export const MOCK_AUTH_KEY = "ll_mock_auth_state";

// ─── Pub/Sub ─────────────────────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeMockAuth(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function getMockAuthState(): MockAuthState | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(MOCK_AUTH_KEY);
  if (v === "unauthenticated" || v === "free" || v === "pro") return v;
  return null;
}

export function setMockAuthState(state: MockAuthState): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_AUTH_KEY, state);
  }
  notify();
}

export function clearMockAuthState(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(MOCK_AUTH_KEY);
  }
  notify();
}

// ─── Mock payloads ────────────────────────────────────────────────────────────

export const MOCK_USER_ID: Record<"free" | "pro", string> = {
  free: "mock_user_free",
  pro:  "mock_user_pro",
};
