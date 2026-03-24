"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AnalysisResult } from "@/lib/types";

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
