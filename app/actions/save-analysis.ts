"use server";

import { auth } from "@clerk/nextjs/server";
import { normalizeAnalysisId } from "@/lib/analysis-id";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";
import type { AnalysisResult } from "@/lib/types";
import type { SavedAnalysis } from "@/lib/saved-analyses";
import type {
  AnalysisDetail,
  AnalysisDetailResult,
  AnalysisLoadFailure,
} from "@/lib/analysis-load-types";

export type { AnalysisDetail, AnalysisDetailResult, AnalysisLoadFailure };

export type SaveAnalysisResult =
  | { success: true; id: string }
  | { success: false; error: string };

/** グローバルDBキャッシュ（同一 URL・同一レベルの最新解析） */
export type CheckExistingAnalysisResult =
  | { hit: true; data: AnalysisResult }
  | { hit: false };

function isValidCachedAnalysisResult(data: unknown): data is AnalysisResult {
  if (!data || typeof data !== "object") return false;
  const d = data as AnalysisResult;
  if (!Array.isArray(d.phrases)) return false;
  if (typeof d.total_count !== "number" || !Number.isFinite(d.total_count)) {
    return false;
  }
  if (d.total_count < 1) return false;
  return true;
}

/**
 * `saved_analyses` に同一 url・level の行があれば、最新の `result_json` を返す（作成者は問わない）。
 * API コスト削減用。失敗時は hit: false（フォールスルーしてフル解析へ）。
 */
export async function checkExistingAnalysisAction(
  url: string,
  level: string
): Promise<CheckExistingAnalysisResult> {
  const normalizedUrl = url.trim();
  const normalizedLevel = level.trim();
  if (!normalizedUrl || !normalizedLevel) {
    return { hit: false };
  }

  let db;
  try {
    db = createAdminClient();
  } catch {
    return { hit: false };
  }

  const { data, error } = await db
    .from("saved_analyses")
    .select("result_json")
    .eq("url", normalizedUrl)
    .eq("level", normalizedLevel)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[checkExistingAnalysisAction]", error.message);
    }
    return { hit: false };
  }

  const row = data?.[0] as { result_json: unknown } | undefined;
  if (!row || !isValidCachedAnalysisResult(row.result_json)) {
    return { hit: false };
  }

  return { hit: true, data: row.result_json };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalysisRow {
  id: string;
  user_id: string | null;
  url: string | null;
  title: string | null;
  level: string;
  result_json: AnalysisResult;
  is_shared: boolean;
  is_approved: boolean;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
}

function logAnalysisLoadFailureDev(failure: AnalysisLoadFailure): void {
  if (process.env.NODE_ENV !== "development") return;
  console.error("[LinguistLens] analysis detail load failed:", failure);
}

// ─── 解析結果を自動保存（ログイン不要・ゲストは user_id = NULL） ──────────────

export async function saveAnalysisAction(payload: {
  data: AnalysisResult;
  inputMode: "url" | "text";
  cefrLevel: string;
  sourceUrl?: string;
}): Promise<SaveAnalysisResult> {
  const { userId } = await auth();

  let resolvedTitle: string | null = null;
  if (
    payload.data.source_type === "youtube" &&
    payload.sourceUrl?.trim()
  ) {
    resolvedTitle = await fetchYoutubeOembedTitle(payload.sourceUrl.trim());
  }

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
      title:       resolvedTitle,
      level:       payload.cefrLevel,
      result_json: payload.data,
      is_public:   false,
      is_featured: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    const raw = error?.message ?? "";
    if (process.env.NODE_ENV === "development") {
      console.error("[saveAnalysisAction] insert failed", {
        raw,
        supabaseError: error
          ? { message: error.message, code: error.code, details: error.details }
          : null,
        hasData: Boolean(data),
      });
    }
    if (
      raw.includes("is_public") ||
      raw.includes("is_featured") ||
      raw.includes("schema cache")
    ) {
      return {
        success: false,
        error:
          "データベースに必要な列がありません。Supabase の SQL Editor で `supabase/ensure_saved_analyses_columns.sql` を実行し、必要なら Project Settings からスキーマを再読み込みしてください。詳細: " +
          raw,
      };
    }
    return { success: false, error: raw || "保存に失敗しました" };
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
 * 指定 ID の解析結果を取得する（成功 / 失敗理由つき）。
 * アクセス制御:
 * - user_id = NULL（ゲスト解析）→ 誰でも UUID を知っていればアクセス可
 * - user_id が設定されている → オーナーのみアクセス可
 */
export async function getAnalysisDetailResult(
  id: string
): Promise<AnalysisDetailResult> {
  const normalizedId = normalizeAnalysisId(id);
  if (!normalizedId) {
    const failure: AnalysisLoadFailure = { reason: "empty_id" };
    logAnalysisLoadFailureDev(failure);
    return { ok: false, failure };
  }

  const authResult = await auth();
  const userId = authResult.userId ?? null;
  const redirectToSignInAvailable =
    "redirectToSignIn" in authResult &&
    typeof authResult.redirectToSignIn === "function";

  let db;
  try {
    db = createAdminClient();
  } catch (err) {
    const failure: AnalysisLoadFailure = {
      reason: "admin_client_error",
      message: err instanceof Error ? err.message : String(err),
    };
    logAnalysisLoadFailureDev(failure);
    return { ok: false, failure };
  }

  const { data, error } = await db
    .from("saved_analyses")
    .select(
      "id, url, title, level, result_json, is_shared, is_approved, created_at, user_id, is_public"
    )
    .eq("id", normalizedId)
    .single();

  if (error) {
    const failure: AnalysisLoadFailure = {
      reason: "db_error",
      message: error.message,
      code: typeof error.code === "string" ? error.code : undefined,
    };
    logAnalysisLoadFailureDev(failure);
    return { ok: false, failure };
  }

  if (!data) {
    const failure: AnalysisLoadFailure = { reason: "no_row" };
    logAnalysisLoadFailureDev(failure);
    return { ok: false, failure };
  }

  const row = data as AnalysisRow;

  const isPublic = row.is_public;
  const isGuestAnalysis = row.user_id == null;
  const isOwnerAccess =
    userId !== null && row.user_id != null && row.user_id === userId;

  if (!isPublic && !isGuestAnalysis && !isOwnerAccess) {
    const failure: AnalysisLoadFailure = {
      reason: "access_denied",
      isPublic,
      rowUserId: row.user_id,
      viewerUserId: userId,
      redirectToSignInAvailable,
    };
    logAnalysisLoadFailureDev(failure);
    return { ok: false, failure };
  }

  return {
    ok: true,
    analysis: {
      id: row.id,
      savedAt: row.created_at,
      sourceUrl: row.url ?? undefined,
      contentTitle: row.title,
      inputMode: row.url ? "url" : "text",
      cefrLevel: row.level,
      data: row.result_json,
      isShared: row.is_shared ?? false,
      isApproved: row.is_approved ?? false,
      isPublic: row.is_public ?? false,
      isOwner:
        row.user_id != null && userId !== null && row.user_id === userId,
    },
  };
}

/**
 * 未ログインでオーナー行にアクセスできない場合のみ、本番でサインインへリダイレクト。
 * 開発時は呼び出し元でエラー表示するためスキップする。
 */
export async function maybeRedirectUnauthenticatedAnalysisAccess(
  result: AnalysisDetailResult,
  normalizedId: string
): Promise<void> {
  if (process.env.NODE_ENV === "development") return;
  if (result.ok) return;
  if (result.failure.reason !== "access_denied") return;
  const f = result.failure;
  if (f.viewerUserId) return;
  if (f.rowUserId == null || f.isPublic) return;
  if (!f.redirectToSignInAvailable) return;

  const nextAuth = await auth();
  if (
    "redirectToSignIn" in nextAuth &&
    typeof nextAuth.redirectToSignIn === "function"
  ) {
    nextAuth.redirectToSignIn({
      returnBackUrl: `/analyses/${normalizedId}`,
    });
  }
}

/**
 * 指定 ID の解析結果を取得する。アクセス制御は getAnalysisDetailResult と同じ。
 * 本番ではアクセス拒否かつ未ログインのときサインインへリダイレクトする場合がある。
 */
export async function getAnalysisAction(
  id: string
): Promise<AnalysisDetail | null> {
  const normalizedId = normalizeAnalysisId(id);
  const r = await getAnalysisDetailResult(id);
  if (r.ok) return r.analysis;
  await maybeRedirectUnauthenticatedAnalysisAccess(r, normalizedId);
  return null;
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
  const normalizedId = normalizeAnalysisId(id);
  if (!normalizedId) return null;

  let db;
  try { db = createAdminClient(); } catch { return null; }

  const { data, error } = await db
    .from("saved_analyses")
    .select("level, result_json, url, is_public")
    .eq("id", normalizedId)
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.error("[getAnalysisMetadataAction]", {
        normalizedId,
        supabaseError: error
          ? { message: error.message, code: error.code, details: error.details }
          : null,
        hasData: Boolean(data),
      });
    }
    return null;
  }

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
