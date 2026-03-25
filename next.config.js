/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

module.exports = nextConfig;
