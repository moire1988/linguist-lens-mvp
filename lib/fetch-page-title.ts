/**
 * 公開 Web ページの `<title>` / `og:title` を取得（解析詳細の Web URL 見出し用）。
 * 失敗時は null。
 */
function decodeBasicHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function fetchPageTitle(urlString: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(urlString.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const controller = new AbortController();
  const timeoutMs = 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.href, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; LinguistLens/1.0; +https://linguist-lens-mvp.vercel.app)",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch =
      html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i
      );
    const og = ogMatch?.[1]?.trim();
    if (og) return decodeBasicHtmlEntities(og);

    const titleMatch = html.match(
      /<title[^>]*>([\s\S]{1,800})<\/title>/i
    );
    if (titleMatch?.[1]) {
      const cleaned = titleMatch[1].replace(/\s+/g, " ").trim();
      if (cleaned) return decodeBasicHtmlEntities(cleaned);
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  return null;
}
