/**
 * 本番の公開オリジン（metadataBase / canonical / OG / sitemap / シェア URL 用）。
 *
 * Vercel の Environment Variables に
 * `NEXT_PUBLIC_SITE_URL=https://linguistlens.app`
 * を設定すると上書きできます（プレビュー環境で別 URL にしたい場合など）。
 * 未設定時は独自ドメインを既定とします。
 */
export function getPublicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://linguistlens.app";
}
