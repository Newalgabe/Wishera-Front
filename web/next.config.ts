import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not block production builds on ESLint errors in pages we didn't edit now
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5155/api/:path*",
      },
      {
        source: "/chat-api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
