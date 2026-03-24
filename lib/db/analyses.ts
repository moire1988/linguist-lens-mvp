import { supabase, createAuthClient } from "@/lib/supabase";
import type { AnalysisResult } from "@/lib/types";
import type { SavedAnalysis } from "@/lib/saved-analyses";

// ─── DB row shape (snake_case) ────────────────────────────────────────────────

interface AnalysisRow {
  id: string;
  user_id: string;
  title: string | null;
  url: string | null;
  content: string | null;
  level: string;
  result_json: AnalysisResult;
  is_public: boolean;
  is_shared: boolean;
  is_approved: boolean;
  created_at: string;
}

// ─── Public row shape（シェアページ・サイトマップ用）──────────────────────────

export interface PublicAnalysis {
  id: string;
  title: string | null;
  url: string | null;
  level: string;
  result: AnalysisResult;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToSavedAnalysis(row: AnalysisRow): SavedAnalysis {
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

// ─── 認証済みユーザー向け CRUD ──────────────────────────────────────────────

/**
 * ログインユーザーの保存済み解析一覧を新しい順に取得する。
 */
export async function getDbAnalyses(
  token: string,
  userId: string
): Promise<SavedAnalysis[]> {
  const client = createAuthClient(token);
  const { data, error } = await client
    .from("saved_analyses")
    .select("id, url, level, result_json, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as AnalysisRow[]).map(rowToSavedAnalysis);
}

/**
 * 解析結果を Supabase に保存する。
 * - inputMode === "url" の場合は is_public = true（YouTubeやWeb記事は公開コンテンツのため）
 * - inputMode === "text" は is_public = false（ユーザーが入力したテキストはプライベート）
 * 成功時は新規行の id を返す。失敗時は null。
 */
export async function insertDbAnalysis(
  token: string,
  userId: string,
  payload: {
    data: AnalysisResult;
    inputMode: "url" | "text";
    cefrLevel: string;
    sourceUrl?: string;
    title?: string;
    content?: string;
  }
): Promise<string | null> {
  const client = createAuthClient(token);
  const { data, error } = await client
    .from("saved_analyses")
    .insert({
      user_id: userId,
      title: payload.title ?? null,
      url: payload.sourceUrl ?? null,
      content: payload.content ?? null,
      level: payload.cefrLevel,
      result_json: payload.data,
      is_public: false, // 公開フラグは管理者専用 Server Action 経由でのみ true にできる
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

/**
 * 指定 id の解析結果を削除する。
 */
export async function deleteDbAnalysis(
  token: string,
  userId: string,
  id: string
): Promise<void> {
  const client = createAuthClient(token);
  await client
    .from("saved_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}

// ─── 公開データ取得（認証不要）──────────────────────────────────────────────

/**
 * 公開シェアページ用: is_public = true の単一行を取得する。
 * 未認証でアクセス可（RLS: anon_select_public_analyses）。
 */
export async function getPublicAnalysis(id: string): Promise<PublicAnalysis | null> {
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, title, url, level, result_json, created_at")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (error || !data) return null;
  const row = data as AnalysisRow;
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    level: row.level,
    result: row.result_json,
    createdAt: row.created_at,
  };
}

// ─── 公開フィード用（最新N件）──────────────────────────────────────────────

export interface RecentPublicAnalysis {
  id: string;
  title: string | null;
  url: string | null;
  level: string;
  phrases: import("@/lib/types").PhraseResult[];
  createdAt: string;
}

/**
 * トップページ用: is_public = true の最新 N 件を取得する。
 * anon クライアント使用（RLS: anon_select_public_analyses）。
 */
export async function getRecentPublicAnalyses(
  limit = 6
): Promise<RecentPublicAnalysis[]> {
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, title, url, level, result_json, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as AnalysisRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    level: row.level,
    phrases: (row.result_json?.phrases ?? []).slice(0, 3),
    createdAt: row.created_at,
  }));
}

/**
 * サイトマップ用: is_public = true の全行 (id, created_at のみ) を取得する。
 */
export async function getAllPublicAnalysisIds(): Promise<
  { id: string; createdAt: string }[]
> {
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as { id: string; created_at: string }[]).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
  }));
}
