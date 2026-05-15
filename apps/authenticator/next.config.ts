import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zentro/ui", "@zentro/db", "@zentro/auth"],
};

export default nextConfig;
