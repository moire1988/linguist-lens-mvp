import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Avoid stale HTML after deploy (old document still pointing at removed hashed CSS/JS under /_next/static).
 * Hashed assets keep long cache (next.config.js); this applies to page/RSC only (matcher skips /_next and file extensions).
 *
 * - private: 共有 CDN にユーザー固有として扱わせ、誤キャッシュを減らす
 * - no-store: ブラウザ・中間プロキシがドキュメントを溜めない
 * - Vercel-CDN-Cache-Control: Edge が HTML を長期キャッシュしないようにする
 */
const HTML_CACHE_CONTROL =
  "private, no-cache, no-store, max-age=0, must-revalidate";

// These routes are accessible without signing in.
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/terms",
  "/privacy",
  "/analyses/(.*)",
  "/examples/(.*)",
  "/share/(.*)",
  "/sitemap.xml",
  "/robots.txt",
  "/og",
  "/icon.svg",
  "/articles",
  "/articles/(.*)",
  "/library",
  "/upgrade",
  // トップの解析は fetch(/api/analyze) 経由（Server Action スタブによる Webpack 不整合を避ける）
  "/api/analyze",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", HTML_CACHE_CONTROL);
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
