// Metro must be told about the monorepo explicitly: by default it only watches
// the app folder, so `@hermes/tokens` and `@hermes/core` — which live two levels
// up and are symlinked in by npm workspaces — resolve at type-check time and
// fail at bundle time with an unhelpful "module not found".
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// expo-router discovers its route directory through this env var, which
// babel-preset-expo reads at transform time. It is normally derived from the
// process cwd — which in a workspace is the repo root, not the app — producing
// "First argument of `require.context` should be a string" from a file that is
// plainly on disk. Setting it explicitly removes the guesswork.
process.env.EXPO_ROUTER_APP_ROOT = path.join(projectRoot, "app");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// tsconfig `paths` are a type-checker concern only; Metro has its own resolver
// and needs the workspace packages mapped explicitly, or they typecheck fine
// and fail at bundle time.
config.resolver.extraNodeModules = {
  "@hermes/tokens": path.resolve(workspaceRoot, "packages/tokens"),
  "@hermes/core": path.resolve(workspaceRoot, "packages/core"),
};

/*
 * Pin React to this app's copy.
 *
 * The web app needs React 19.2.4 (Next 16) and React Native 0.81 needs exactly
 * 19.1.0, so npm hoists 19.2.4 to the workspace root and nests 19.1.0 here.
 * Metro resolves hierarchically from the *importing* file, so anything inside
 * the root node_modules that imports "react" gets 19.2.4 while
 * react-native-renderer stays on 19.1.0 — and the app dies at launch with
 * "Incompatible React versions".
 *
 * nodeModulesPaths does not fix this: it is a fallback list, consulted only
 * after the normal upward walk fails. Interception is the only reliable point.
 *
 * NOT solved by aligning versions: RN pins its renderer to an exact React
 * build, and forcing the web app down to 19.1.0 to suit the phone would be the
 * tail wagging the dog.
 */
const PINNED = new Set(["react", "react-dom", "react-native", "react/jsx-runtime", "react/jsx-dev-runtime"]);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (PINNED.has(moduleName)) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(projectRoot, "index.js") },
      moduleName,
      platform,
    );
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
