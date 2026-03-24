import { createAuthClient } from "@/lib/supabase";
import type { SavedPhrase } from "@/lib/vocabulary";

// ─── DB row shape (snake_case) ────────────────────────────────────────────────

interface VocabularyRow {
  id: string;
  user_id: string;
  expression: string;
  type: string;
  cefr_level: string;
  meaning_ja: string;
  nuance: string;
  example: string;
  example_translation: string | null;
  context: string;
  why_hard_for_japanese: string;
  source_url: string | null;
  status: string;
  saved_at: string;
  archived_at: string | null;
}

// ─── Row → SavedPhrase ────────────────────────────────────────────────────────

function rowToPhrase(row: VocabularyRow): SavedPhrase {
  return {
    id: row.id,
    expression: row.expression,
    type: row.type as SavedPhrase["type"],
    cefr_level: row.cefr_level,
    meaning_ja: row.meaning_ja,
    nuance: row.nuance,
    example: row.example,
    example_translation: row.example_translation ?? undefined,
    context: row.context,
    why_hard_for_japanese: row.why_hard_for_japanese,
    sourceUrl: row.source_url ?? undefined,
    savedAt: row.saved_at,
    status: (row.status === 'archived' ? 'archived' : 'learning') as 'learning' | 'archived',
    archivedAt: row.archived_at ?? undefined,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getDbVocabulary(
  token: string,
  userId: string
): Promise<SavedPhrase[]> {
  const client = createAuthClient(token);
  const { data, error } = await client
    .from("vocabulary_list")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) return [];
  return (data as VocabularyRow[]).map(rowToPhrase);
}

export async function insertDbVocabulary(
  token: string,
  userId: string,
  phrase: Omit<SavedPhrase, "id" | "savedAt">
): Promise<string | null> {
  const client = createAuthClient(token);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const { data, error } = await client
    .from("vocabulary_list")
    .insert({
      id,
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
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function archiveDbVocabulary(
  token: string,
  userId: string,
  id: string
): Promise<void> {
  const client = createAuthClient(token);
  await client
    .from("vocabulary_list")
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function restoreDbVocabulary(
  token: string,
  userId: string,
  id: string
): Promise<void> {
  const client = createAuthClient(token);
  await client
    .from("vocabulary_list")
    .update({ status: 'learning', archived_at: null })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function deleteDbVocabulary(
  token: string,
  userId: string,
  id: string
): Promise<void> {
  const client = createAuthClient(token);
  await client
    .from("vocabulary_list")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}

export async function clearDbVocabulary(
  token: string,
  userId: string,
  status: 'learning' | 'archived'
): Promise<void> {
  const client = createAuthClient(token);
  await client
    .from("vocabulary_list")
    .delete()
    .eq("user_id", userId)
    .eq("status", status);
}
