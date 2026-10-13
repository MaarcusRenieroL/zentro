import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  transpilePackages: [
    "@zentro/ui",
    "@zentro/db",
    "@zentro/auth",
    "@zentro/utils",
  ],
};

export default nextConfig;
