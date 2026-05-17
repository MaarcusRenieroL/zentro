import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@zentro/ui",
    "@zentro/db",
    "@zentro/auth",
    "@zentro/utils",
  ],
};

export default nextConfig;
