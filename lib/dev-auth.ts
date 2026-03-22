import { useAuth } from "@clerk/nextjs";
import { getSettings } from "./settings";

/**
 * Returns { isSignedIn, isPro } with dev-mode overrides.
 * When devMode is OFF or devAuthState === "real", falls through to Clerk's actual auth.
 *
 * devAuthState:
 *   "real"  → use real Clerk auth (isPro always false for now)
 *   "guest" → isSignedIn: false, isPro: false
 *   "free"  → isSignedIn: true,  isPro: false
 *   "pro"   → isSignedIn: true,  isPro: true
 */
export function useEffectiveAuth(): { isSignedIn: boolean; isPro: boolean } {
  const { isSignedIn } = useAuth();

  const settings = typeof window !== "undefined" ? getSettings() : null;

  if (!settings || !settings.devMode || settings.devAuthState === "real") {
    return { isSignedIn: !!isSignedIn, isPro: false };
  }

  switch (settings.devAuthState) {
    case "guest": return { isSignedIn: false, isPro: false };
    case "free":  return { isSignedIn: true,  isPro: false };
    case "pro":   return { isSignedIn: true,  isPro: true  };
    default:      return { isSignedIn: !!isSignedIn, isPro: false };
  }
}
