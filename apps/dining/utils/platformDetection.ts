/**
 * Platform Detection Utilities
 * 
 * Detect if app is running in Expo Go vs Development/Production Build
 * Used to conditionally enable features that require native modules
 */

import Constants from 'expo-constants';

/**
 * Check if app is running in Expo Go
 * @returns true if running in Expo Go, false if in development/production build
 */
export const isExpoGo = (): boolean => {
  return Constants.appOwnership === 'expo';
};

/**
 * Check if app is running in a standalone build (development or production)
 * @returns true if running in standalone build
 */
export const isStandaloneBuild = (): boolean => {
  return !isExpoGo();
};

/**
 * Check if SVG Transformer features are available
 * SVG Transformer only works in development/production builds, not in Expo Go
 * @returns true if SVG features are available
 */
export const isSVGAvailable = (): boolean => {
  return isStandaloneBuild();
};

/**
 * Get build environment name
 * @returns 'expo-go' | 'development' | 'production'
 */
export const getBuildEnvironment = (): 'expo-go' | 'development' | 'production' => {
  if (isExpoGo()) {
    return 'expo-go';
  }
  return __DEV__ ? 'development' : 'production';
};

/**
 * Log current build environment (for debugging)
 */
export const logBuildEnvironment = () => {
  const env = getBuildEnvironment();
  const svgAvailable = isSVGAvailable();
  
  console.log('📱 Build Environment:', env);
  console.log('🎨 SVG Support:', svgAvailable ? '✅ Available' : '❌ Not Available');
  
  if (env === 'expo-go') {
    console.log('⚠️ Running in Expo Go - SVG venue layouts disabled');
  }
};

