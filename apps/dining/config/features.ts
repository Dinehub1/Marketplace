/**
 * Feature Flags
 * 
 * Control which features are enabled based on build environment
 * Some features (like SVG venue layouts) only work in standalone builds
 */

import { isSVGAvailable, isExpoGo } from '../utils/platformDetection';

/**
 * Feature flag configuration
 */
export const FEATURES = {
  // ✅ SVG Venue Layouts - Only available in development/production builds
  SVG_VENUE_LAYOUTS: isSVGAvailable(),
  
  // ✅ Always available features
  RESTAURANT_BOOKINGS: true,
  EVENT_BOOKINGS: true,
  EXPERT_PROFILES: true,
  LOCATION_SEARCH: true,
  NOTIFICATIONS: true,
  SOCIAL_AUTH: true,
  REALTIME_UPDATES: true,
  
  // 🔧 Debug mode
  DEBUG_MODE: __DEV__,
} as const;

/**
 * Check if a feature is enabled
 * @param featureName - Name of the feature to check
 * @returns true if feature is enabled
 */
export const isFeatureEnabled = (featureName: keyof typeof FEATURES): boolean => {
  return FEATURES[featureName];
};

/**
 * Get disabled features (for debugging)
 */
export const getDisabledFeatures = (): string[] => {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature);
};

/**
 * Log feature availability (for debugging)
 */
export const logFeatureStatus = () => {
  console.log('🎯 Feature Status:');
  Object.entries(FEATURES).forEach(([feature, enabled]) => {
    console.log(`  ${enabled ? '✅' : '❌'} ${feature}`);
  });
  
  if (isExpoGo()) {
    console.log('\n⚠️ Running in Expo Go - Some features disabled');
    console.log('📱 Build a development build for full features');
  }
};

