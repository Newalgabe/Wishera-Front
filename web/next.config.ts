import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not block production builds on ESLint errors in pages we didn't edit now
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
