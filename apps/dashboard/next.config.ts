import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ralphberry/core", "@ralphberry/db", "@ralphberry/queue"],
};

export default nextConfig;
