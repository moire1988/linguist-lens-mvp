"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AnalysisResult } from "@/lib/types";
import type { SavedAnalysis } from "@/lib/saved-analyses";

export type SaveAnalysisResult =
  | { success: true; id: string }
  | { success: false; error: string };

/**
 * ログイン済みユーザーの解析結果を Supabase に保存する。
 * サービスロールキーを使用するため Clerk JWT の Supabase 連携設定不要。
 */
export async function saveAnalysisAction(payload: {
  data: AnalysisResult;
  inputMode: "url" | "text";
  cefrLevel: string;
  sourceUrl?: string;
}): Promise<SaveAnalysisResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "ログインが必要です" };

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { data, error } = await db
    .from("saved_analyses")
    .insert({
      user_id:     userId,
      url:         payload.sourceUrl ?? null,
      content:     null,
      title:       null,
      level:       payload.cefrLevel,
      result_json: payload.data,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "保存に失敗しました" };
  }

  return { success: true, id: (data as { id: string }).id };
}

// ─── ユーザー自身の解析一覧を取得 ────────────────────────────────────────────

interface AnalysisRow {
  id: string;
  url: string | null;
  level: string;
  result_json: AnalysisResult;
  is_shared: boolean;
  is_approved: boolean;
  created_at: string;
}

export async function getUserAnalysesAction(): Promise<SavedAnalysis[]> {
  const { userId } = await auth();
  if (!userId) return [];

  let db;
  try { db = createAdminClient(); } catch { return []; }

  const { data, error } = await db
    .from("saved_analyses")
    .select("id, url, level, result_json, is_shared, is_approved, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as AnalysisRow[]).map((row) => ({
    id: row.id,
    savedAt: row.created_at,
    sourceUrl: row.url ?? undefined,
    inputMode: row.url ? "url" : "text",
    cefrLevel: row.level,
    data: row.result_json,
    isShared: row.is_shared ?? false,
    isApproved: row.is_approved ?? false,
  }));
}

// ─── 単一解析結果を取得（詳細ページ用）──────────────────────────────────────────

export async function getAnalysisAction(
  id: string
): Promise<SavedAnalysis | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let db;
  try { db = createAdminClient(); } catch { return null; }

  const { data, error } = await db
    .from("saved_analyses")
    .select("id, url, level, result_json, is_shared, is_approved, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  const row = data as AnalysisRow;
  return {
    id: row.id,
    savedAt: row.created_at,
    sourceUrl: row.url ?? undefined,
    inputMode: row.url ? "url" : "text",
    cefrLevel: row.level,
    data: row.result_json,
    isShared: row.is_shared ?? false,
    isApproved: row.is_approved ?? false,
  };
}

// ─── ユーザー自身の解析を削除 ─────────────────────────────────────────────────

export async function deleteUserAnalysisAction(
  id: string
): Promise<{ ok: boolean }> {
  const { userId } = await auth();
  if (!userId) return { ok: false };

  let db;
  try { db = createAdminClient(); } catch { return { ok: false }; }

  await db
    .from("saved_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId); // user_id で絞ることで他人のデータは削除不可

  return { ok: true };
}
