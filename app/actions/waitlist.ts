"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

// ─── Logged-in: Clerk のメアドを自動取得して登録 ──────────────────────────────

export async function registerWaitlistLoggedInAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "ログインが必要です" };

  // Clerk から primary email を取得
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return { ok: false, error: "メールアドレスが取得できませんでした" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("waitlist")
    .upsert({ email, user_id: userId }, { onConflict: "email" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Guest: 入力メアドを登録 ─────────────────────────────────────────────────

export async function registerWaitlistGuestAction(email: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "有効なメールアドレスを入力してください" };
  }

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("waitlist")
    .upsert({ email: trimmed }, { onConflict: "email" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
