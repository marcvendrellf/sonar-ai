import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages are published as TypeScript source (exports -> ./src),
  // so Next must transpile them rather than expecting pre-built JS.
  transpilePackages: ["@sonar-ai/core", "@sonar-ai/risk-engine"],
};

export default nextConfig;
