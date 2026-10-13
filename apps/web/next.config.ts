import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  async redirects() {
    // The old task-scoped project pages showed sample data; projects live at
    // /projects now.
    return [
      {
        source: "/tasks/projects",
        destination: "/projects",
        permanent: true,
      },
      {
        source: "/tasks/projects/:slug",
        destination: "/projects/:slug",
        permanent: true,
      },
    ];
  },
  transpilePackages: [
    "@zentro/ui",
    "@zentro/db",
    "@zentro/auth",
    "@zentro/modules",
    "@zentro/utils",
  ],
};

export default nextConfig;
