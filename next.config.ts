import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // MSW's browser entry has no server build; see src/mocks/server-stub.ts.
      "msw/browser": { browser: "msw/browser", default: "./src/mocks/server-stub.ts" },
    },
  },
  // Pages retired with the MVP rescope (Oct 2026). Temporary, so they can come back after launch.
  async redirects() {
    return [
      { source: "/changelog", destination: "/roadmap", permanent: false },
      { source: "/pricing", destination: "/waitlist", permanent: false },
      { source: "/status", destination: "/roadmap", permanent: false },
      { source: "/docs/:path*", destination: "/roadmap", permanent: false },
      { source: "/careers", destination: "/about", permanent: false },
    ];
  },
};

export default nextConfig;
