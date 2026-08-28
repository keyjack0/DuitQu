import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
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