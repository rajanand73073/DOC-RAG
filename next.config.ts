import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@langchain/community",
    "@langchain/core",
    "@langchain/qdrant",
    "langchain",
  ],
};

export default nextConfig;

