function readRole(
  metadata: Record<string, unknown> | null | undefined
): string | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const r = metadata.role;
  return typeof r === "string" ? r : undefined;
}

/**
 * アプリの「管理者」判定（フッター権限バッジ・UI ガード用）。
 * - Clerk `publicMetadata.role === 'admin'`
 * - または `NEXT_PUBLIC_ADMIN_USER_ID` と userId が一致
 */
export function isAppAdminUser(
  userId: string | null | undefined,
  publicMetadata: Record<string, unknown> | null | undefined
): boolean {
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  if (userId && adminId && userId === adminId) return true;
  if (readRole(publicMetadata) === "admin") return true;
  return false;
}
