import "server-only";

import { createAdminClient } from "@/lib/supabase-admin";
import { extractYouTubeVideoId } from "@/lib/youtube-url";

/**
 * 同一 YouTube 動画（video_id）＋同一 CEFR レベル、または同一 URL 文字列＋レベルで
 * 既存の saved_analyses 行があればその id を返す（LLM 前のキャッシュ再利用用）。
 * 検索順: (1) video_id + level → (2) url 完全一致 + level → (3) YouTube は url に ID を含む行を候補取得し、
 * extractYouTubeVideoId で同一動画と判定（video_id 未設定・URL表記違いの重複防止）。
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

  // 1) video_id 列が埋まっている行（新規保存済み）
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

  // 2) 入力 URL 文字列の完全一致（旧データで video_id が NULL の行もここで拾える）
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

  // 3) YouTube かつ video_id 未設定／表記ゆれ（youtu.be ↔ watch?v= 等）で 2) が外れた場合
  if (vid) {
    const { data: fuzzyRows, error: fuzzyErr } = await db
      .from("saved_analyses")
      .select("id, url")
      .eq("level", level)
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
