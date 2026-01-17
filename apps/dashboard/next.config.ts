import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ralph/core", "@ralph/db", "@ralph/queue"],
};

export default nextConfig;
