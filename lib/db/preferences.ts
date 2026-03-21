import { createAuthClient } from "@/lib/supabase";
import type { Accent, CefrLevel } from "@/lib/settings";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbPreferences {
  accent: Accent;
  defaultLevel: CefrLevel;
}

// ─── DB row shape (snake_case) ────────────────────────────────────────────────

interface PreferencesRow {
  user_id: string;
  voice_accent: string;
  default_level: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToPrefs(row: PreferencesRow): DbPreferences {
  return {
    accent: row.voice_accent as Accent,
    defaultLevel: row.default_level as CefrLevel,
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * ログインユーザーの設定を Supabase から取得する。
 * 行が存在しない場合は null を返す（呼び出し元でデフォルト値を使う）。
 */
export async function getDbPreferences(
  token: string,
  userId: string
): Promise<DbPreferences | null> {
  const client = createAuthClient(token);
  const { data, error } = await client
    .from("user_preferences")
    .select("voice_accent, default_level")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToPrefs(data as PreferencesRow);
}

/**
 * ログインユーザーの設定を Supabase に保存する（なければ INSERT、あれば UPDATE）。
 */
export async function upsertDbPreferences(
  token: string,
  userId: string,
  prefs: Partial<DbPreferences>
): Promise<void> {
  const client = createAuthClient(token);
  await client.from("user_preferences").upsert(
    {
      user_id: userId,
      ...(prefs.accent !== undefined && { voice_accent: prefs.accent }),
      ...(prefs.defaultLevel !== undefined && { default_level: prefs.defaultLevel }),
    },
    { onConflict: "user_id" }
  );
}
