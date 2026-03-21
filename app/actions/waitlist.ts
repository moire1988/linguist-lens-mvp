"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * ログインユーザーを Pro ウェイティングリストに登録する。
 * user_preferences.wants_pro_notify = true にする。
 *
 * 前提: user_preferences テーブルに以下のカラムが必要:
 *   ALTER TABLE user_preferences
 *     ADD COLUMN IF NOT EXISTS wants_pro_notify BOOLEAN DEFAULT false;
 */
export async function registerProWaitlistAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "ログインが必要です" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("user_preferences")
    .upsert({ user_id: userId, wants_pro_notify: true }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
