import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
