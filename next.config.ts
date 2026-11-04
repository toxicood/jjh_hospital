import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is database-driven and session-based: static-first cache
     components are disabled so pages render per-request. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
