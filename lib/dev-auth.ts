"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getSettings } from "./settings";

/**
 * Returns { isSignedIn, isPro } with dev-mode overrides.
 * When devMode is OFF or devAuthState === "real", falls through to Clerk's actual auth.
 *
 * 初回のサーバー HTML とクライアントの hydration を一致させるため、
 * マウント完了までは常に Clerk の値のみを返し、localStorage の DEV 上書きは適用しない。
 *
 * devAuthState:
 *   "real"  → use real Clerk auth (isPro always false for now)
 *   "guest" → isSignedIn: false, isPro: false
 *   "free"  → isSignedIn: true,  isPro: false
 *   "pro"   → isSignedIn: true,  isPro: true
 */
export function useEffectiveAuth(): { isSignedIn: boolean; isPro: boolean } {
  const { isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return { isSignedIn: !!isSignedIn, isPro: false };
  }

  const settings = getSettings();

  if (!settings.devMode || settings.devAuthState === "real") {
    return { isSignedIn: !!isSignedIn, isPro: false };
  }

  switch (settings.devAuthState) {
    case "guest":
      return { isSignedIn: false, isPro: false };
    case "free":
      return { isSignedIn: true, isPro: false };
    case "pro":
      return { isSignedIn: true, isPro: true };
    default:
      return { isSignedIn: !!isSignedIn, isPro: false };
  }
}
