/**
 * YouTube oEmbed（公開 API・キー不要）で動画タイトルを取得する。
 */
export async function fetchYoutubeOembedTitle(
  videoUrl: string
): Promise<string | null> {
  try {
    const u = new URL("https://www.youtube.com/oembed");
    u.searchParams.set("url", videoUrl);
    u.searchParams.set("format", "json");
    const res = await fetch(u.toString(), {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    const t = data.title?.trim();
    return t && t.length > 0 ? t : null;
  } catch {
    return null;
  }
}
