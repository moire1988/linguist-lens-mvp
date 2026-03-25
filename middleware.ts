import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Avoid stale HTML after deploy (old document still pointing at removed hashed CSS/JS under /_next/static).
 * Hashed assets keep long cache; this applies to page/RSC responses only (matcher skips /_next and static extensions).
 */
const HTML_CACHE_CONTROL =
  "public, max-age=0, must-revalidate, s-maxage=0, stale-while-revalidate=0";

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
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", HTML_CACHE_CONTROL);
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
