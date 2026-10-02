/**
 * Venue Features Hook
 * 
 * Hook to check if venue/seat selection features are available
 * and provide utility functions for venue-related operations
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FEATURES } from '../config/features';
import { isExpoGo, isSVGAvailable } from '../utils/platformDetection';

/**
 * Hook to manage venue feature availability
 */
export const useVenueFeatures = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  
  useEffect(() => {
    const available = isSVGAvailable();
    setIsAvailable(available);
    
    if (!available) {
      console.log('⚠️ Venue features disabled (Expo Go mode)');
    }
  }, []);
  
  /**
   * Navigate to venue selection (only if available)
   */
  const navigateToVenueSelection = (venueId: string, eventId: string) => {
    if (!isAvailable) {
      console.log('⚠️ Cannot navigate to venue selection - feature not available');
      return false;
    }
    
    router.push(`/venue/${venueId}/select?eventId=${eventId}` as any);
    return true;
  };
  
  /**
   * Check if venue selection should be shown for an event
   */
  const shouldShowVenueSelection = (event: any): boolean => {
    return isAvailable && event?.seat_selection_enabled === true;
  };
  
  return {
    isVenueSelectionAvailable: isAvailable,
    isExpoGo: isExpoGo(),
    navigateToVenueSelection,
    shouldShowVenueSelection,
    features: FEATURES,
  };
};

/**
 * Hook to redirect if venue features are not available
 */
export const useRequireVenueFeatures = (fallbackRoute: string = '/(tabs)') => {
  useEffect(() => {
    if (!isSVGAvailable()) {
      console.log('⚠️ Venue features required but not available - redirecting');
      router.replace(fallbackRoute as any);
    }
  }, [fallbackRoute]);
  
  return isSVGAvailable();
};

