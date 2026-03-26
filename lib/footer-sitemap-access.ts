import type { AppRouteConfig } from "@/lib/routes-config";

/**
 * フッター表示用の実効ロール（`useEffectiveAuth` と一致）。
 * DEV の Guest/Free/Pro シミュレーション時も、本番の未ログイン・Free と同じ見た目になる。
 */
export type FooterEffectiveContext = {
  isSignedIn: boolean;
  isPro: boolean;
};

function isGuestTier(ctx: FooterEffectiveContext): boolean {
  return !ctx.isSignedIn;
}

function isPremiumTier(ctx: FooterEffectiveContext): boolean {
  return ctx.isSignedIn && ctx.isPro;
}

/**
 * フッターリンクを「制限あり」として抑えめに見せるか。
 * アプリ内の Guest / Free の体験（チラ見せ・ティーザー等）に揃える。
 */
export function isFooterRouteVisuallyRestricted(
  route: AppRouteConfig,
  ctx: FooterEffectiveContext
): boolean {
  if (route.requiredRole === "free" && isGuestTier(ctx)) return true;
  if (route.href === "/library" && !isPremiumTier(ctx)) return true;
  if (route.href === "/articles" && isGuestTier(ctx)) return true;
  if (route.href === "/examples" && isGuestTier(ctx)) return true;
  return false;
}

/**
 * 厳選ライブラリ横の王冠 — ティーザー（Guest/Free）でも表示。
 * 閲覧制限の有無は `isFooterRouteVisuallyRestricted` 側で表現する。
 */
export function shouldShowFooterPremiumCrown(route: AppRouteConfig): boolean {
  return route.premiumCrownInFooter === true;
}
