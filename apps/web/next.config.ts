import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve images as-is: optimizing them on Cloudflare needs the Images
  // binding, which isn't set up.
  images: { unoptimized: true },
};

export default nextConfig;
