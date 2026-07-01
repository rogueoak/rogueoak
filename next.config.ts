import type { NextConfig } from "next";
import { POSTHOG_ASSET_HOST, POSTHOG_INGEST_HOST } from "./src/lib/analytics";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the file-tracing root to this project so `output: standalone` always
  // emits server.js at `.next/standalone/server.js`. Without it, a second
  // lockfile in the nested `.worktrees/` checkout makes Next infer the OUTER
  // repo as the workspace root and nest server.js. No-op in CI and Docker, where
  // the app is the only root.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 31536000,
  },
  // PostHog reverse proxy. The browser only ever talks to this origin at
  // `/ingest/*`; Next rewrites that to PostHog US Cloud. Keeps analytics
  // same-origin so tracker blockers that block `*.posthog.com` miss it and a
  // future CSP needs no third-party `connect-src`. `us-assets` serves the
  // static JS + array bundles; `us.i` is the ingest API.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSET_HOST}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${POSTHOG_ASSET_HOST}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_INGEST_HOST}/:path*`,
      },
    ];
  },
  // Required by the PostHog proxy: its ingest paths use trailing slashes (e.g.
  // `/e/`), which Next would otherwise 308-redirect and break event capture.
  skipTrailingSlashRedirect: true,
  // Conservative baseline security headers for a public static-content site.
  // No CSP yet: the pre-paint theme script is inline, so a future CSP must use a
  // hash / nonce rather than 'unsafe-inline'.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
