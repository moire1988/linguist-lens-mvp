import { supabase, createAuthClient } from "@/lib/supabase";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";
import type { AnalysisResult } from "@/lib/types";
import type { FeaturedAnalysis, RecentPublicAnalysis } from "@/lib/public-analyses-types";
import type { SavedAnalysis } from "@/lib/saved-analyses";

function isYoutubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
}

/** result_json から抽出総数を正規化（total_count の型ゆれ・欠損を吸収） */
function resolvePhraseCountFromRow(row: AnalysisRow): number {
  const raw = row.result_json;
  let r: AnalysisResult | null = null;
  if (raw == null) return 0;
  if (typeof raw === "string") {
    try {
      r = JSON.parse(raw) as AnalysisResult;
    } catch {
      return 0;
    }
  } else {
    r = raw as AnalysisResult;
  }
  const phrases = Array.isArray(r.phrases) ? r.phrases : [];
  const len = phrases.length;
  const tc = r.total_count as unknown;
  let nFromTotal: number | null = null;
  if (typeof tc === "number" && Number.isFinite(tc) && tc >= 0) {
    nFromTotal = Math.floor(tc);
  } else if (typeof tc === "string" && tc.trim() !== "") {
    const p = parseInt(tc.trim(), 10);
    if (!Number.isNaN(p) && p >= 0) nFromTotal = p;
  }
  if (nFromTotal !== null) return Math.max(nFromTotal, len);
  return len;
}

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

export type { FeaturedAnalysis, RecentPublicAnalysis };

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

  const base: RecentPublicAnalysis[] = (data as AnalysisRow[]).map((row) => {
    const fromRow = row.title?.trim() || null;
    const fromJson = row.result_json?.title;
    const merged =
      fromRow ||
      (typeof fromJson === "string" && fromJson.trim() ? fromJson.trim() : null);
    const phrasesFull = Array.isArray(row.result_json?.phrases)
      ? row.result_json.phrases
      : [];
    const phraseCount = resolvePhraseCountFromRow(row);

    return {
      id: row.id,
      title: merged,
      url: row.url,
      level: row.level,
      phrases: phrasesFull.slice(0, 3),
      phraseCount,
      createdAt: row.created_at,
    };
  });

  return Promise.all(
    base.map(async (item) => {
      if (item.title) return item;
      if (item.url && isYoutubeUrl(item.url)) {
        const oembed = await fetchYoutubeOembedTitle(item.url);
        if (oembed) return { ...item, title: oembed };
      }
      return item;
    })
  );
}

// ─── 注目のピックアップ（is_featured=true）──────────────────────────────────

/**
 * トップページ「注目の解析記事」用:
 * is_public = true かつ is_featured = true の最新 N 件を取得する。
 */
export async function getFeaturedAnalyses(
  limit = 6
): Promise<FeaturedAnalysis[]> {
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, url, level, result_json, created_at")
    .eq("is_public", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as AnalysisRow[]).map((row) => ({
    id: row.id,
    url: row.url,
    level: row.level,
    phrases: (row.result_json?.phrases ?? []).slice(0, 2),
    phraseCount: row.result_json?.total_count ?? 0,
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
