import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This app is database-driven and session-based: static-first cache
     components are disabled so pages render per-request. */
  cacheComponents: false,
  // Public preview link (Cloudflare quick tunnel) that family/management may use.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // pdfkit reads its own data/font files from disk — keep external, don't bundle.
  serverExternalPackages: ["pdfkit"],
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
