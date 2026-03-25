/**
 * 厳選表現ライブラリのプレミアム閲覧権限。
 * Clerk `publicMetadata.stripeSubscriptionStatus === 'active'` でプレミアム。
 *
 * テスト: `'auto'` = メタデータ準拠 / `'free'` / `'premium'` で UI のみ固定。
 *
 * 開発時: `useEffectiveAuth().isPro`（DEV パネルで Pro）が真なら `/library` ではフル閲覧（`app/library/page.tsx`）。
 */
export const LIBRARY_PREMIUM_TEST_OVERRIDE: "auto" | "free" | "premium" = "auto";

type PublicMetadataShape = {
  stripeSubscriptionStatus?: string;
};

export function isLibraryPremiumAccess(
  override: typeof LIBRARY_PREMIUM_TEST_OVERRIDE,
  stripeStatus: string | undefined
): boolean {
  if (override === "premium") return true;
  if (override === "free") return false;
  return stripeStatus === "active";
}

export function getStripeStatusFromUserPublicMetadata(
  publicMetadata: Record<string, unknown> | undefined | null
): string | undefined {
  if (!publicMetadata || typeof publicMetadata !== "object") return undefined;
  const raw = (publicMetadata as PublicMetadataShape).stripeSubscriptionStatus;
  return typeof raw === "string" ? raw : undefined;
}
