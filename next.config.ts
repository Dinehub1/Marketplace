import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Pin the workspace root: the parent dir has its own package.json, which
  // Next.js would otherwise infer as the root and trace the wrong files.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
