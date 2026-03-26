import "server-only";

import { createAdminClient } from "@/lib/supabase-admin";
import { extractYouTubeVideoId } from "@/lib/youtube-url";

/** `result_json.source_type`（アプリは Web 記事を `web` で保存） */
const JSON_SOURCE_YOUTUBE = { source_type: "youtube" as const };
const JSON_SOURCE_WEB = { source_type: "web" as const };

/**
 * 同一内容の既存 `saved_analyses` 行があれば id を返す（`analyzeContent` の Pre-check）。
 * YouTube と Web で検索を分離し、`source_type` 不一致・video_id 未設定行の誤ヒットを防ぐ。
 */
export async function findExistingSavedAnalysisId(
  url: string,
  cefrLevel: string
): Promise<string | null> {
  const trimmed = url.trim();
  const level = cefrLevel.trim();
  if (!trimmed || !level) return null;

  let db;
  try {
    db = createAdminClient();
  } catch {
    return null;
  }

  const vid = extractYouTubeVideoId(trimmed);

  if (vid) {
    const { data: byVid, error: errVid } = await db
      .from("saved_analyses")
      .select("id")
      .eq("video_id", vid)
      .eq("level", level)
      .contains("result_json", JSON_SOURCE_YOUTUBE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      !errVid &&
      byVid &&
      typeof (byVid as { id: unknown }).id === "string"
    ) {
      return (byVid as { id: string }).id;
    }

    const { data: byUrlYt, error: errUrlYt } = await db
      .from("saved_analyses")
      .select("id")
      .eq("url", trimmed)
      .eq("level", level)
      .contains("result_json", JSON_SOURCE_YOUTUBE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      !errUrlYt &&
      byUrlYt &&
      typeof (byUrlYt as { id: unknown }).id === "string"
    ) {
      return (byUrlYt as { id: string }).id;
    }

    const { data: fuzzyRows, error: fuzzyErr } = await db
      .from("saved_analyses")
      .select("id, url")
      .eq("level", level)
      .contains("result_json", JSON_SOURCE_YOUTUBE)
      .not("url", "is", null)
      .ilike("url", `%${vid}%`)
      .order("created_at", { ascending: false })
      .limit(40);

    if (!fuzzyErr && fuzzyRows?.length) {
      for (const row of fuzzyRows as { id: string; url: string | null }[]) {
        if (!row.url) continue;
        if (extractYouTubeVideoId(row.url) === vid) {
          return row.id;
        }
      }
    }

    return null;
  }

  const { data: byWeb, error: errWeb } = await db
    .from("saved_analyses")
    .select("id")
    .eq("url", trimmed)
    .eq("level", level)
    .contains("result_json", JSON_SOURCE_WEB)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    !errWeb &&
    byWeb &&
    typeof (byWeb as { id: unknown }).id === "string"
  ) {
    return (byWeb as { id: string }).id;
  }

  return null;
}

/**
 * 最新の saved_analyses 1件の id（開発時・魔法URLデバッグのリダイレクト先フォールバック用）。
 */
export async function peekLatestSavedAnalysisId(): Promise<string | null> {
  let db;
  try {
    db = createAdminClient();
  } catch {
    return null;
  }

  const { data, error } = await db
    .from("saved_analyses")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  const id = (data as { id: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}
