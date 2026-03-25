"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AnalysisResult } from "@/lib/types";
import type { SavedAnalysis } from "@/lib/saved-analyses";

export type SaveAnalysisResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalysisRow {
  id: string;
  user_id: string | null;
  url: string | null;
  level: string;
  result_json: AnalysisResult;
  is_shared: boolean;
  is_approved: boolean;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
}

/** getAnalysisDetailAction が返す拡張型 */
export type AnalysisDetail = SavedAnalysis & {
  isPublic: boolean;
  isOwner: boolean;
};

// ─── 解析結果を自動保存（ログイン不要・ゲストは user_id = NULL） ──────────────

export async function saveAnalysisAction(payload: {
  data: AnalysisResult;
  inputMode: "url" | "text";
  cefrLevel: string;
  sourceUrl?: string;
}): Promise<SaveAnalysisResult> {
  const { userId } = await auth();

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "DB接続エラー" };
  }

  const { data, error } = await db
    .from("saved_analyses")
    .insert({
      user_id:     userId ?? null,
      url:         payload.sourceUrl ?? null,
      content:     null,
      title:       null,
      level:       payload.cefrLevel,
      result_json: payload.data,
      is_public:   false,
      is_featured: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "保存に失敗しました" };
  }

  return { success: true, id: (data as { id: string }).id };
}

// ─── ユーザー自身の解析一覧を取得 ────────────────────────────────────────────

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

// ─── 単一解析結果を取得（詳細ページ用・isPublic / isOwner 付き）────────────────

/**
 * 指定 ID の解析結果を取得する。アクセス制御:
 * - user_id = NULL（ゲスト解析）→ 誰でも UUID を知っていればアクセス可
 * - user_id が設定されている → オーナーのみアクセス可
 * 返り値に isPublic と isOwner を含む。
 */
export async function getAnalysisAction(
  id: string
): Promise<AnalysisDetail | null> {
  const { userId } = await auth();

  let db;
  try { db = createAdminClient(); } catch { return null; }

  const { data, error } = await db
    .from("saved_analyses")
    .select("id, url, level, result_json, is_shared, is_approved, created_at, user_id, is_public")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as AnalysisRow;

  // アクセス制御:
  // - is_public=true → 誰でも閲覧可（ゲストにはページ側でペイウォールを表示）
  // - is_public=false, user_id=null（ゲスト解析）→ UUID を知る誰でも閲覧可
  // - is_public=false, user_id 一致 → オーナーのみ閲覧可
  // - それ以外 → 閲覧不可
  const isPublic = row.is_public;
  const isGuestAnalysis = row.user_id === null;
  const isOwnerAccess = row.user_id === userId;

  if (!isPublic && !isGuestAnalysis && !isOwnerAccess) {
    return null;
  }

  return {
    id: row.id,
    savedAt: row.created_at,
    sourceUrl: row.url ?? undefined,
    inputMode: row.url ? "url" : "text",
    cefrLevel: row.level,
    data: row.result_json,
    isShared: row.is_shared ?? false,
    isApproved: row.is_approved ?? false,
    isPublic: row.is_public ?? false,
    isOwner: row.user_id !== null && row.user_id === userId,
  };
}

// ─── OGP 用メタデータ取得（認証不要・公開情報のみ）─────────────────────────────

/**
 * generateMetadata 専用。認証なしで解析の基本情報を取得する。
 * 公開 / 非公開に関わらず ID で引けるが、取得できる情報は最小限。
 */
export async function getAnalysisMetadataAction(id: string): Promise<{
  cefrLevel: string;
  phraseCount: number;
  sourceUrl: string | null;
  isPublic: boolean;
} | null> {
  let db;
  try { db = createAdminClient(); } catch { return null; }

  const { data, error } = await db
    .from("saved_analyses")
    .select("level, result_json, url, is_public")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as Pick<AnalysisRow, "level" | "result_json" | "url" | "is_public">;
  return {
    cefrLevel: row.level,
    phraseCount: (row.result_json as AnalysisResult).total_count ?? 0,
    sourceUrl: row.url,
    isPublic: row.is_public ?? false,
  };
}

// ─── 公開 / 非公開を切り替え（オーナーのみ）──────────────────────────────────

export async function toggleAnalysisPublicAction(
  id: string,
  isPublic: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "ログインが必要です" };

  let db;
  try { db = createAdminClient(); } catch { return { ok: false, error: "DB接続エラー" }; }

  // オーナー確認（サービスロール経由でも user_id チェックを必ず行う）
  const { data: row } = await db
    .from("saved_analyses")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!row || (row as { user_id: string | null }).user_id !== userId) {
    return { ok: false, error: "この操作を行う権限がありません" };
  }

  const { error } = await db
    .from("saved_analyses")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
    .eq("user_id", userId);

  return { ok: true };
}
