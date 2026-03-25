import "server-only";

import { createAdminClient } from "@/lib/supabase-admin";
import { extractYouTubeVideoId } from "@/lib/youtube-url";

/**
 * 同一 YouTube 動画（video_id）＋同一 CEFR レベル、または同一 URL 文字列＋レベルで
 * 既存の saved_analyses 行があればその id を返す（LLM 前のキャッシュ再利用用）。
 * YouTube は video_id 優先。旧行で video_id が NULL の場合は url 完全一致にフォールバック。
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
    const { data, error } = await db
      .from("saved_analyses")
      .select("id")
      .eq("video_id", vid)
      .eq("level", level)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data && typeof (data as { id: unknown }).id === "string") {
      return (data as { id: string }).id;
    }
  }

  const { data: byUrl, error: urlErr } = await db
    .from("saved_analyses")
    .select("id")
    .eq("url", trimmed)
    .eq("level", level)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!urlErr && byUrl && typeof (byUrl as { id: unknown }).id === "string") {
    return (byUrl as { id: string }).id;
  }

  return null;
}
