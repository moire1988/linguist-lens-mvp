"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { FREE_ANALYSIS_LIMIT } from "@/lib/quota-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuotaResult =
  | { allowed: true;  isLoggedIn: boolean }
  | { allowed: false; isLoggedIn: boolean; reason: "guest" | "limit_reached" };

export interface AnalysisCountInfo {
  used: number;
  limit: number;
  isLoggedIn: boolean;
  isUnlimited: boolean; // Pro / Admin は true
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAdmin(userId: string): boolean {
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  return !!adminId && userId === adminId;
}

/** ユーザーの累計解析数（saved_analyses の行数）を取得 */
async function countUserAnalyses(userId: string): Promise<number> {
  let db;
  try { db = createAdminClient(); } catch { return 0; }

  const { count } = await db
    .from("saved_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * 解析を実行する前にクォータをチェックする。
 *
 * - Guest (未ログイン) → 即ブロック (reason: "guest")
 * - Admin             → 常に許可
 * - Pro               → 常に許可（将来実装）
 * - Free              → 累計 saved_analyses 数が上限未満なら許可
 */
export async function consumeQuotaAction(): Promise<QuotaResult> {
  const { userId } = await auth();

  // Guest: ログインを促す
  if (!userId) {
    return { allowed: false, isLoggedIn: false, reason: "guest" };
  }

  // Admin: 無制限
  if (isAdmin(userId)) {
    return { allowed: true, isLoggedIn: true };
  }

  // Pro: 無制限（TODO: サブスクリプション確認）
  const isPro = false;
  if (isPro) return { allowed: true, isLoggedIn: true };

  // Free: 累計解析数チェック
  const used = await countUserAnalyses(userId);
  if (used >= FREE_ANALYSIS_LIMIT) {
    return { allowed: false, isLoggedIn: true, reason: "limit_reached" };
  }

  return { allowed: true, isLoggedIn: true };
}

/**
 * UI表示用: 現在のユーザーの解析利用状況を返す。
 * Clerk の isSignedIn が確定してから呼ぶこと。
 */
export async function getUserAnalysisCountAction(): Promise<AnalysisCountInfo> {
  const { userId } = await auth();

  if (!userId) {
    return { used: 0, limit: FREE_ANALYSIS_LIMIT, isLoggedIn: false, isUnlimited: false };
  }

  if (isAdmin(userId)) {
    return { used: 0, limit: FREE_ANALYSIS_LIMIT, isLoggedIn: true, isUnlimited: true };
  }

  // TODO: Pro check
  const isPro = false;
  if (isPro) {
    return { used: 0, limit: FREE_ANALYSIS_LIMIT, isLoggedIn: true, isUnlimited: true };
  }

  const used = await countUserAnalyses(userId);
  return { used, limit: FREE_ANALYSIS_LIMIT, isLoggedIn: true, isUnlimited: false };
}
