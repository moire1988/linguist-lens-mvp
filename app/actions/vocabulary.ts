"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { SavedPhrase } from "@/lib/vocabulary";

type ActionResult = { success: boolean; error?: string };

interface VocabularyRow {
  id: string;
  user_id: string;
  expression: string;
  type: string;
  cefr_level: string;
  meaning_ja: string;
  nuance: string | null;
  example: string | null;
  example_translation: string | null;
  context: string | null;
  why_hard_for_japanese: string | null;
  source_url: string | null;
  source_analysis_id: string | null;
  status: string;
  saved_at: string;
  archived_at: string | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToPhrase(row: VocabularyRow): SavedPhrase {
  return {
    id: row.id,
    expression: row.expression,
    type: row.type as SavedPhrase["type"],
    cefr_level: row.cefr_level,
    meaning_ja: row.meaning_ja,
    nuance: row.nuance ?? "",
    example: row.example ?? "",
    example_translation: row.example_translation ?? undefined,
    context: row.context ?? "",
    why_hard_for_japanese: row.why_hard_for_japanese ?? "",
    sourceUrl: row.source_url ?? undefined,
    source_analysis_id: row.source_analysis_id ?? undefined,
    savedAt: row.saved_at,
    status: row.status === "archived" ? "archived" : "learning",
    archivedAt: row.archived_at ?? undefined,
  };
}

export type SaveVocabularyActionResult =
  | { success: true; phrase: SavedPhrase }
  | { success: false; error: string; reason?: "duplicate" };

/** Server Component / クライアント再取得用 */
export async function getUserVocabularyAction(): Promise<SavedPhrase[]> {
  const { userId } = await auth();
  if (!userId) return [];

  let db;
  try {
    db = createAdminClient();
  } catch {
    return [];
  }

  const { data, error } = await db
    .from("saved_expressions")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return (data as VocabularyRow[]).map(rowToPhrase);
}

export async function getVocabularyCountAction(): Promise<number> {
  const { userId } = await auth();
  if (!userId) return 0;

  let db;
  try {
    db = createAdminClient();
  } catch {
    return 0;
  }

  const { count, error } = await db
    .from("saved_expressions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

/** 保存済み判定用（小文字キー） */
export async function listSavedExpressionKeysAction(): Promise<string[]> {
  const phrases = await getUserVocabularyAction();
  return phrases.map((p) => p.expression.toLowerCase());
}

export async function saveVocabularyAction(
  phrase: Omit<SavedPhrase, "id" | "savedAt">
): Promise<SaveVocabularyActionResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "ログインが必要です" };
  }

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "DB接続エラー",
    };
  }

  const id = generateId();
  const row = {
    id,
    user_id: userId,
    expression: phrase.expression.trim(),
    type: phrase.type,
    cefr_level: phrase.cefr_level,
    meaning_ja: phrase.meaning_ja,
    nuance: phrase.nuance ?? "",
    example: phrase.example ?? "",
    example_translation: phrase.example_translation ?? null,
    context: phrase.context ?? "",
    why_hard_for_japanese: phrase.why_hard_for_japanese ?? "",
    source_url: phrase.sourceUrl ?? null,
    source_analysis_id: phrase.source_analysis_id ?? null,
    status: phrase.status ?? "learning",
  };

  const { data, error } = await db
    .from("saved_expressions")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "この表現はすでに保存されています",
        reason: "duplicate",
      };
    }
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "保存に失敗しました" };
  }

  return { success: true, phrase: rowToPhrase(data as VocabularyRow) };
}

export async function archiveVocabularyAction(id: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "ログインが必要です" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("saved_expressions")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function restoreVocabularyAction(id: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "ログインが必要です" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("saved_expressions")
    .update({ status: "learning", archived_at: null })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteVocabularyAction(id: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "ログインが必要です" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("saved_expressions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearVocabularyAction(
  status: "learning" | "archived"
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "ログインが必要です" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { error } = await db
    .from("saved_expressions")
    .delete()
    .eq("user_id", userId)
    .eq("status", status);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
