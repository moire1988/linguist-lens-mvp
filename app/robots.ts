import type { MetadataRoute } from "next";

import { getPublicSiteUrl } from "@/lib/site-url";

const SITE_URL = getPublicSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/mypage/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
