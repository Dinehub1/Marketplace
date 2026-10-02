const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const fs = require('fs');

// Load root .env for monorepo configuration
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  try {
    process.loadEnvFile(rootEnvPath);
    if (process.env.EXPO_PUBLIC_GATTED_SUPABASE_URL) {
      process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_GATTED_SUPABASE_URL;
    }
    if (process.env.EXPO_PUBLIC_GATTED_SUPABASE_ANON_KEY) {
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_GATTED_SUPABASE_ANON_KEY;
    }
  } catch {}
}

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
};

module.exports = config;
