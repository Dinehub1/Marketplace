const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

// Load root .env for monorepo configuration
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  try {
    process.loadEnvFile(rootEnvPath);
    if (process.env.EXPO_PUBLIC_DINING_SUPABASE_URL) {
      process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_DINING_SUPABASE_URL;
    }
    if (process.env.EXPO_PUBLIC_DINING_SUPABASE_ANON_KEY) {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_DINING_SUPABASE_ANON_KEY;
    }
  } catch {}
}

const config = getDefaultConfig(__dirname);

// ✅ Configure react-native-svg-transformer for SVG support
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  // Remove 'svg' from assetExts so it's treated as source code
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  // Add 'svg' to sourceExts so it can be imported as components
  sourceExts: [...resolver.sourceExts, 'svg'],
};

// Ensure other assets are properly handled
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'bin');

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
};

module.exports = config;
