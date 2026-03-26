/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Hashed JS/CSS — safe to cache forever; filename changes each deploy.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // next/image 最適化 URL（クエリ付き）— 元は変わらないので長期でよい
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Vercel: コミットごとにビルドIDが変わり、/_next/static のハッシュが必ず更新される
  // ローカル dev で毎回 Date.now() にするとキャッシュとズレて欠落チャンク (Cannot find module './xxxx.js') が出やすい
  async redirects() {
    return [
      { source: "/vocabulary", destination: "/mypage", permanent: true },
    ];
  },
  generateBuildId: async () => {
    if (process.env.NODE_ENV === "development") {
      return "development";
    }
    return (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      `local-${Date.now()}`
    );
  },
};

module.exports = nextConfig;
