import type { NextConfig } from "next";

// Server-only env. Never expose to the browser bundle.
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Browser hits /api/v1/* on its own origin; Next forwards to the backend.
    // Keeps cookies first-party, removes CORS preflight, hides the backend
    // URL from the client bundle. WebSockets and provider webhooks bypass
    // this — see pattern.md → "API proxy".
    return [
      {
        source: `${API_PREFIX}/:path*`,
        destination: `${API_ORIGIN}${API_PREFIX}/:path*`,
      },
    ];
  },
};

export default nextConfig;
