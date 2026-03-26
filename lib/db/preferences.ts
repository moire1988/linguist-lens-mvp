import { createAuthClient } from "@/lib/supabase";
import { getSettings, type Accent, type CefrLevel } from "@/lib/settings";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DbPreferences {
  accent: Accent;
  defaultLevel: CefrLevel;
  /** メルマガ受信（未設定行は false 扱い） */
  wantsEmail: boolean;
}

/** DB 更新後にバナー等が再取得する用 */
export const USER_PREFERENCES_CHANGED_EVENT = "ll-user-preferences-changed";

/** Supabase / PostgREST のエラー（UI・デバッグ用） */
export interface PreferencesDbError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

/** Developer Mode のトースト用（改行区切りテキスト） */
export function formatPreferencesDbErrorForDev(e: PreferencesDbError): string {
  return [
    e.code ? `code: ${e.code}` : null,
    e.message ? `message: ${e.message}` : null,
    e.details ? `details: ${e.details}` : null,
    e.hint ? `hint: ${e.hint}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

// ─── DB row shape (snake_case) ────────────────────────────────────────────────

interface PreferencesRow {
  user_id: string;
  voice_accent: string;
  default_level: string;
  wants_email: boolean | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToPrefs(row: PreferencesRow): DbPreferences {
  return {
    accent: row.voice_accent as Accent,
    defaultLevel: row.default_level as CefrLevel,
    wantsEmail: row.wants_email ?? false,
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
    .select("voice_accent, default_level, wants_email")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToPrefs(data as PreferencesRow);
}

/**
 * ログインユーザーの設定を Supabase に保存する（なければ INSERT、あれば UPDATE）。
 * 部分更新でも voice_accent / default_level / wants_email を揃えて送り、
 * INSERT 時の NOT NULL 欠落や upsert の取りこぼしを防ぐ。
 */
export async function upsertDbPreferences(
  token: string,
  userId: string,
  prefs: Partial<DbPreferences>
): Promise<{ error: PreferencesDbError | null }> {
  const client = createAuthClient(token);
  const existing = await getDbPreferences(token, userId);
  const local = typeof window !== "undefined" ? getSettings() : null;

  const merged: DbPreferences = {
    accent: prefs.accent ?? existing?.accent ?? local?.accent ?? "US",
    defaultLevel:
      prefs.defaultLevel ?? existing?.defaultLevel ?? local?.defaultLevel ?? "B2",
    wantsEmail: prefs.wantsEmail ?? existing?.wantsEmail ?? false,
  };

  const { error } = await client.from("user_preferences").upsert(
    {
      user_id: userId,
      voice_accent: merged.accent,
      default_level: merged.defaultLevel,
      wants_email: merged.wantsEmail,
    },
    { onConflict: "user_id" }
  );
  if (!error) return { error: null };
  return {
    error: {
      message: error.message,
      code: error.code ?? "",
      details: error.details ?? null,
      hint: error.hint ?? null,
    },
  };
}
