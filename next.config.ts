import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "1",
});

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    // appDir is stable in Next.js 15
  },
};

export default withBundleAnalyzer(nextConfig);