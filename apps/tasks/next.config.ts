import path from "node:path";

import type { NextConfig } from "next";

const authenticatorInternalUrl =
  process.env.AUTHENTICATOR_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: [
    "@zentro/ui",
    "@zentro/db",
    "@zentro/auth",
    "@zentro/utils",
  ],
  async rewrites() {
    return [
      {
        source: "/auth/:path*",
        destination: `${authenticatorInternalUrl}/auth/:path*`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${authenticatorInternalUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
