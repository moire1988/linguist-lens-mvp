"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { SavedPhrase } from "@/lib/vocabulary";

type ActionResult = { success: boolean; error?: string };

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveVocabularyAction(
  phrase: Omit<SavedPhrase, "id" | "savedAt">
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
    .from("vocabulary_list")
    .insert({
      id: generateId(),
      user_id: userId,
      expression: phrase.expression,
      type: phrase.type,
      cefr_level: phrase.cefr_level,
      meaning_ja: phrase.meaning_ja,
      nuance: phrase.nuance ?? '',
      example: phrase.example ?? '',
      example_translation: phrase.example_translation ?? null,
      context: phrase.context ?? '',
      why_hard_for_japanese: phrase.why_hard_for_japanese ?? '',
      source_url: phrase.sourceUrl ?? null,
      status: phrase.status ?? 'learning',
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
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
    .from("vocabulary_list")
    .update({ status: 'archived', archived_at: new Date().toISOString() })
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
    .from("vocabulary_list")
    .update({ status: 'learning', archived_at: null })
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
    .from("vocabulary_list")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearVocabularyAction(
  status: 'learning' | 'archived'
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
    .from("vocabulary_list")
    .delete()
    .eq("user_id", userId)
    .eq("status", status);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
