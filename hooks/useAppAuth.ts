"use client";

// ─── useAppAuth ───────────────────────────────────────────────────────────────
// Clerkの認証状態をラップしたカスタムフック。
// DevモードがONかつモック状態が設定されている場合は偽の認証情報を返す。
//
// 使い方（今後はこのフックを使う）:
//   const { isSignedIn, isPro, userId, getToken } = useAppAuth();

import { useReducer, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getSettings } from "@/lib/settings";
import {
  getMockAuthState,
  subscribeMockAuth,
  MOCK_USER_ID,
} from "@/lib/mock-auth";

export interface AppAuth {
  /** Clerkの初期化が完了したか（モック時は常に true） */
  isLoaded:   boolean;
  /** ログイン済みか */
  isSignedIn: boolean;
  /** ユーザーID（未ログイン時は null） */
  userId:     string | null;
  /** 有料プランか（現在は billing 未実装のため実ユーザーは常に false） */
  isPro:      boolean;
  /** DevモードでモックがONかどうか（デバッグ表示用） */
  isMocked:   boolean;
  /** Supabase JWT取得など。モック時は常に null を返す */
  getToken:   (opts?: { template?: string }) => Promise<string | null>;
}

export function useAppAuth(): AppAuth {
  const clerk = useAuth();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  // モック状態が変わったら再レンダリング
  useEffect(() => subscribeMockAuth(forceUpdate), []);

  // DevMode設定が変わったら再レンダリング
  useEffect(() => {
    const handler = () => forceUpdate();
    window.addEventListener("ll-settings-changed", handler);
    return () => window.removeEventListener("ll-settings-changed", handler);
  }, []);

  const devMode   = getSettings().devMode;
  const mockState = devMode ? getMockAuthState() : null;

  // ── モック返却 ─────────────────────────────────────────────────────────────
  if (mockState) {
    const isSignedIn = mockState !== "unauthenticated";
    return {
      isLoaded:   true,
      isSignedIn,
      userId:     isSignedIn ? MOCK_USER_ID[mockState as "free" | "pro"] : null,
      isPro:      mockState === "pro",
      isMocked:   true,
      getToken:   async () => null,
    };
  }

  // ── 実際の Clerk 状態を返却 ───────────────────────────────────────────────
  return {
    isLoaded:   clerk.isLoaded,
    isSignedIn: !!clerk.isSignedIn,
    userId:     clerk.userId ?? null,
    isPro:      false, // TODO: Stripe等で課金チェックを実装する
    isMocked:   false,
    getToken:   clerk.getToken,
  };
}
