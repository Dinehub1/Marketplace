import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // @hermes/core ships raw TypeScript rather than a compiled dist — there is no
  // build step to keep in sync, and a workspace package that needs building before
  // every dev run is a package people stop editing. Next has to compile it as if it
  // were app source.
  //
  // @hermes/tokens is deliberately NOT listed: the tokens package is generated FROM
  // this app (`packages/tokens/scripts/extract.mjs` reads app/globals.css) and no web
  // source imports it, so listing it here advertised a dependency running the other way.
  transpilePackages: ["@hermes/core"],

  // Pin the trace root to the monorepo root, not this app: Next otherwise
  // infers a root from the nearest package.json and traces the wrong file set,
  // which on Vercel shows up as a deploy missing files it needs at runtime.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
