"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";
import { extractYouTubeVideoId } from "@/lib/youtube-url";
import type { PhraseResult } from "@/lib/types";
import type { AnalysisResult } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingAnalysis {
  id: string;
  userId: string;
  title: string | null;
  url: string | null;
  level: string;
  phrases: PhraseResult[];
  createdAt: string;
}

interface AnalysisRow {
  id: string;
  user_id: string | null;
  title: string | null;
  url: string | null;
  level: string;
  result_json: AnalysisResult;
  created_at: string;
}

async function mapRowsToAdminList(
  rows: AnalysisRow[]
): Promise<PendingAnalysis[]> {
  const mapped = rows.map((row) => ({
    id: row.id,
    userId: row.user_id ?? "",
    title: row.title,
    url: row.url,
    level: row.level,
    phrases: (row.result_json?.phrases ?? []).slice(0, 3),
    createdAt: row.created_at,
  }));

  return Promise.all(
    mapped.map(async (item) => {
      const hasTitle = Boolean(item.title?.trim());
      if (hasTitle || !item.url?.trim()) return item;
      if (!extractYouTubeVideoId(item.url)) return item;
      const t = await fetchYoutubeOembedTitle(item.url.trim());
      return t ? { ...item, title: t } : item;
    })
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADMIN_USER_ID;
}

/** 管理者承認による一般公開は YouTube 解析のみ */
function analysisResultIsYoutubePublicable(
  result: AnalysisResult | undefined
): boolean {
  return result?.source_type === "youtube";
}

function isYoutubeAnalysisRow(row: AnalysisRow): boolean {
  return analysisResultIsYoutubePublicable(row.result_json);
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * ユーザーが掲載トグル ON（public_review_requested）かつ未承認（is_public = false）、
 * かつ YouTube 解析のみ。テキスト／web は含めない。
 */
export async function getAdminPendingAnalyses(): Promise<PendingAnalysis[]> {
  const { userId } = await auth();
  if (!userId || userId !== getAdminId()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, user_id, title, url, level, result_json, created_at")
    .eq("is_public", false)
    .eq("public_review_requested", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const youtubeOnly = (data as AnalysisRow[]).filter(isYoutubeAnalysisRow);
  return mapRowsToAdminList(youtubeOnly);
}

/**
 * is_public = true の解析一覧（管理画面・公開済みタブ用）。新しい順、最大 200 件。
 */
export async function getAdminPublishedAnalyses(): Promise<PendingAnalysis[]> {
  const { userId } = await auth();
  if (!userId || userId !== getAdminId()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, user_id, title, url, level, result_json, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return mapRowsToAdminList(data as AnalysisRow[]);
}

/**
 * 解析を公開する（is_public = true に更新）。YouTube 以外は拒否。
 */
export async function publishAnalysisAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || userId !== getAdminId()) {
    return { ok: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: row, error: fetchError } = await supabase
    .from("saved_analyses")
    .select("result_json")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!row) return { ok: false, error: "解析が見つかりません" };

  const resultJson = (row as { result_json: AnalysisResult }).result_json;
  if (!analysisResultIsYoutubePublicable(resultJson)) {
    return {
      ok: false,
      error: "一般公開できるのは YouTube 解析のみです",
    };
  }

  const { error } = await supabase
    .from("saved_analyses")
    .update({ is_public: true, public_review_requested: false })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * 解析を削除する。
 */
export async function deleteAnalysisAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || userId !== getAdminId()) {
    return { ok: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("saved_analyses")
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
