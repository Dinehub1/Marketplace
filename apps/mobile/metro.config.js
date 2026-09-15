const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// This app runs react 19.2.3 (the version Expo SDK 57 / RN 0.86.3 pins), while the
// repo root hoists react-dom 19.2.4 for the Next app. React requires react and
// react-dom to be the SAME version or it throws (error #527, or "Cannot read
// properties of null (reading 'useMemo')" when two copies end up in the bundle).
//
// extraNodeModules is only a FALLBACK, so a hoisted package such as react-native-web
// still resolved the root's react-dom. resolveRequest intercepts every import, which
// is the only way to guarantee one React in the bundle.
const FORCE = ["react", "react-dom"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isForced = FORCE.some((n) => moduleName === n || moduleName.startsWith(n + "/"));
  if (isForced) {
    const target = FORCE.find((n) => moduleName === n || moduleName.startsWith(n + "/"));
    // resolve against THIS app's node_modules, not the hoisted root copy
    const entry = require.resolve(target + moduleName.slice(target.length), {
      paths: [path.resolve(__dirname, "node_modules")],
    });
    return { type: "sourceFile", filePath: entry };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
