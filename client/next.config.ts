import type { NextConfig } from "next";

const API_SERVER = process.env.API_SERVER_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Proxies API calls to the Express server so the browser only ever talks
  // to same-origin `/api/*` (no CORS setup needed in dev or prod).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_SERVER}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
