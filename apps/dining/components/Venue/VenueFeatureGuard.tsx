/**
 * Venue Feature Guard
 * 
 * Prevents access to venue/seat selection features in Expo Go
 * Redirects back or shows nothing if accessed
 */

import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { isSVGAvailable } from '../../utils/platformDetection';

interface VenueFeatureGuardProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

/**
 * Guard component that only renders children if SVG features are available
 * Otherwise redirects to fallback route
 */
export const VenueFeatureGuard: React.FC<VenueFeatureGuardProps> = ({
  children,
  fallbackRoute = '/(tabs)',
}) => {
  
  useEffect(() => {
    // If SVG not available (Expo Go), redirect immediately
    if (!isSVGAvailable()) {
      console.log('⚠️ Venue features not available - redirecting to:', fallbackRoute);
      router.replace(fallbackRoute as any);
    }
  }, [fallbackRoute]);
  
  // Only render if SVG available
  if (!isSVGAvailable()) {
    return <View style={styles.empty} />;
  }
  
  return <>{children}</>;
};

const styles = StyleSheet.create({
  empty: {
    flex: 1,
  },
});

