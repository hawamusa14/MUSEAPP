import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desktop iCloud evicts .next cache files and crashes `next dev`.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
