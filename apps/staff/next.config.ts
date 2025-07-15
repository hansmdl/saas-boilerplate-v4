import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      ui: path.resolve(__dirname, "../../packages/ui/src"),
      "@ui": path.resolve(__dirname, "../../packages/ui/src"),
    };
    return config;
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    return [
      {
        source: "/auth/:path*",
        destination: `${api}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
// This configuration allows you to import from the UI package using `import { Card } from "ui"` or `import { Card } from "@ui"`.
