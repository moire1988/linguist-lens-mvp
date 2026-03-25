"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AnalysisResult } from "@/lib/types";
import { fetchYoutubeOembedTitle } from "@/lib/youtube-oembed";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SavePublicAnalysisResult =
  | { success: true;  id: string; shareUrl: string }
  | { success: false; error: string };

// ─── Server Action ───────────────────────────────────────────────────────────

/**
 * 解析結果を is_public = true で saved_analyses に保存する。
 * セキュリティ: サービスロールキーを使用し RLS をバイパスするが、
 * その前にサーバー側で管理者 ID を検証するため、
 * クライアント側の UI 制御に頼らない二重ガードになっている。
 */
export async function savePublicAnalysis(payload: {
  data: AnalysisResult;
  cefrLevel: string;
  sourceUrl?: string;
  inputMode: "url" | "text";
}): Promise<SavePublicAnalysisResult> {
  // ── 1. サーバー側で管理者であることを検証 ─────────────────
  const { userId } = await auth();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  if (!userId) {
    return { success: false, error: "ログインが必要です" };
  }
  if (!adminId || userId !== adminId) {
    // 管理者以外のリクエストは問答無用で拒否
    return { success: false, error: "管理者権限がありません" };
  }

  let resolvedTitle: string | null = null;
  if (
    payload.data.source_type === "youtube" &&
    payload.sourceUrl?.trim()
  ) {
    resolvedTitle = await fetchYoutubeOembedTitle(payload.sourceUrl.trim());
  }

  // ── 2. サービスロールで is_public = true を INSERT ─────────
  const db = createAdminClient();
  const { data, error } = await db
    .from("saved_analyses")
    .insert({
      user_id:     userId,
      title:       resolvedTitle,
      url:         payload.sourceUrl ?? null,
      level:       payload.cefrLevel,
      result_json: payload.data,
      is_public:   true,           // 管理者 + サービスロールのみここに到達できる
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Supabase への保存に失敗しました" };
  }

  const id = (data as { id: string }).id;
  const siteUrl = "https://linguist-lens-mvp.vercel.app";

  return {
    success:  true,
    id,
    shareUrl: `${siteUrl}/share/${id}`,
  };
}
