const ID11 = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract 11-character YouTube video id from common URL shapes (www / m / shorts / embed / music).
 */
export function extractYouTubeVideoId(input: string): string | null {
  const s = input.trim();
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (
      host === "youtu.be" ||
      host.endsWith("youtube.com") ||
      host.endsWith("youtube-nocookie.com")
    ) {
      const v = u.searchParams.get("v");
      if (v && ID11.test(v)) return v;
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.slice("/shorts/".length).split("/")[0];
        if (id && ID11.test(id)) return id;
      }
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.slice("/embed/".length).split("/")[0];
        if (id && ID11.test(id)) return id;
      }
      if (host === "youtu.be" && u.pathname.length > 1) {
        const id = u.pathname.slice(1).split("/")[0];
        if (id && ID11.test(id)) return id;
      }
    }
  } catch {
    /* not absolute URL — try patterns below */
  }

  const patterns: RegExp[] = [
    /[?&]v=([a-zA-Z0-9_-]{11})(?:[&#[/]|$)/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m?.[1] && ID11.test(m[1])) return m[1];
  }
  return null;
}
