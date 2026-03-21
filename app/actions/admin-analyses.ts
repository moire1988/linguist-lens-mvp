"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { PhraseResult } from "@/lib/types";
import type { AnalysisResult } from "@/app/actions/analyze";

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
  user_id: string;
  title: string | null;
  url: string | null;
  level: string;
  result_json: AnalysisResult;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminId(): string | undefined {
  return process.env.NEXT_PUBLIC_ADMIN_USER_ID;
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * is_public = false の解析一覧を管理者向けに取得する。
 */
export async function getAdminPendingAnalyses(): Promise<PendingAnalysis[]> {
  const { userId } = await auth();
  if (!userId || userId !== getAdminId()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("saved_analyses")
    .select("id, user_id, title, url, level, result_json, created_at")
    .eq("is_public", false)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as AnalysisRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    url: row.url,
    level: row.level,
    phrases: (row.result_json?.phrases ?? []).slice(0, 3),
    createdAt: row.created_at,
  }));
}

/**
 * 解析を公開する（is_public = true に更新）。
 */
export async function publishAnalysisAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || userId !== getAdminId()) {
    return { ok: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("saved_analyses")
    .update({ is_public: true })
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
