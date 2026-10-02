import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserLocation } from '../config/supabase';
import {
  CityContentAvailability,
  ContentSections,
  getCityContentAvailability,
  getContentSections,
  getTabsForCity
} from '../utils/contentAvailability';
import { useAuth } from './AuthContext';

interface LocationContextType {
  currentLocation: string;
  locationSubtitle: string;
  locationData: {
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    area: string | null;
    state: string | null;
    fullAddress: string | null;
    lastUpdate: string | null;
  } | null;
  contentAvailability: CityContentAvailability | null;
  contentSections: ContentSections | null;
  availableTabs: Array<{ id: string; title: string; icon: string }>;
  setCurrentLocation: (location: string, subtitle?: string) => void;
  refreshLocation: () => Promise<void>;
  refreshContentAvailability: () => Promise<void>;
  loading: boolean;
  contentLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: React.ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocationState] = useState('Khatiwala Tank');
  const [locationSubtitle, setLocationSubtitle] = useState('Indore');
  const [locationData, setLocationData] = useState<{
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    area: string | null;
    state: string | null;
    fullAddress: string | null;
    lastUpdate: string | null;
  } | null>(null);
  const [contentAvailability, setContentAvailability] = useState<CityContentAvailability | null>(null);
  const [contentSections, setContentSections] = useState<ContentSections | null>(null);
  const [availableTabs, setAvailableTabs] = useState<Array<{ id: string; title: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);

  const setCurrentLocation = (location: string, subtitle?: string) => {
    setCurrentLocationState(location);
    if (subtitle) {
      setLocationSubtitle(subtitle);
    }
  };

  // Refresh content availability for current city
  const refreshContentAvailability = async () => {
    // Don't refresh if already loading
    if (contentLoading) {
      console.log('⏭️ Skipping content refresh - already loading');
      return;
    }
    
    const cityToCheck = locationData?.city;
    
    if (!cityToCheck) {
      console.log('❌ No city data available for content check');
      // Set default coming soon state
      setContentAvailability({
        city: 'Unknown',
        hasRestaurants: false,
        hasEvents: false,
        hasActivities: false,
        restaurantCount: 0,
        eventCount: 0,
        activityCount: 0,
        totalContent: 0,
      });
      setContentSections({
        showDining: false,
        showEvents: false,
        showActivities: false,
        showComingSoon: true,
        availableSections: [],
      });
      setAvailableTabs([]);
      return;
    }

    setContentLoading(true);
    try {
      console.log('🔍 Checking content availability for:', cityToCheck);
      
      // Get content availability for the current city
      const availability = await getCityContentAvailability(cityToCheck);
      const sections = getContentSections(availability);
      const tabs = getTabsForCity(availability);

      setContentAvailability(availability);
      setContentSections(sections);
      setAvailableTabs(tabs);

      console.log('✅ Content availability loaded:', {
        city: availability.city,
        restaurants: availability.restaurantCount,
        events: availability.eventCount,
        activities: availability.activityCount,
        total: availability.totalContent,
        sections: sections.availableSections,
        showComingSoon: sections.showComingSoon
      });
    } catch (error) {
      console.error('❌ Error refreshing content availability:', error);
      // Set coming soon state on error
      setContentAvailability({
        city: cityToCheck,
        hasRestaurants: false,
        hasEvents: false,
        hasActivities: false,
        restaurantCount: 0,
        eventCount: 0,
        activityCount: 0,
        totalContent: 0,
      });
      setContentSections({
        showDining: false,
        showEvents: false,
        showActivities: false,
        showComingSoon: true,
        availableSections: [],
      });
      setAvailableTabs([]);
    } finally {
      setContentLoading(false);
    }
  };

  // Helper function to filter full address
  // Removes postal code (6 digits) and "India" from the address
  const filterFullAddress = (fullAddress: string): string => {
    if (!fullAddress) return '';
    
    let filtered = fullAddress;
    
    // Remove postal code (6 digits with optional space before)
    filtered = filtered.replace(/\s*\d{6}\s*/g, ' ');
    
    // Remove ", India" or " India" at the end
    filtered = filtered.replace(/,?\s*India\s*$/i, '');
    
    // Clean up multiple commas and extra spaces
    filtered = filtered.replace(/\s*,\s*,\s*/g, ', ');
    filtered = filtered.replace(/\s+/g, ' ');
    filtered = filtered.trim();
    
    // Remove trailing comma if any
    filtered = filtered.replace(/,\s*$/, '');
    
    return filtered;
  };

  const refreshLocation = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('📍 Loading user location from database...');
      const { data, error } = await getUserLocation(user.id);

      if (error) {
        console.error('❌ Error loading location:', error);
        setLoading(false);
        return;
      }

      if (data && data.latitude && data.longitude) {
        const newLocationData = {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          area: data.area,
          state: data.state,
          fullAddress: data.fullAddress,
          lastUpdate: data.last_update,
        };
        
        setLocationData(newLocationData);
        
        // Format location string for display
        // Priority: area > city > coordinates
        let mainLocation = '';
        let subtitle = '';
        
        if (data.area) {
          // Main location is the area
          mainLocation = data.area;
          // Subtitle is filtered full address (remove postal code and country)
          if (data.fullAddress) {
            subtitle = filterFullAddress(data.fullAddress);
          } else {
            // Fallback to city + state
            subtitle = data.city && data.state 
              ? `${data.city}, ${data.state}` 
              : (data.city || data.state || '');
          }
        } else if (data.city) {
          mainLocation = data.city;
          subtitle = data.state || '';
        } else {
          mainLocation = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
          subtitle = '';
        }
        
        setCurrentLocationState(mainLocation);
        setLocationSubtitle(subtitle);
        
        console.log('✅ Location loaded:', { mainLocation, subtitle, data });
        
        // ALWAYS refresh content when location loads or changes
        // Check content for the NEW city, not the old one
        if (data.city) {
          console.log('🔄 City is:', data.city, '- Checking content availability...');
          // Use a small delay to ensure state has updated
          setTimeout(async () => {
            const availability = await getCityContentAvailability(data.city);
            const sections = getContentSections(availability);
            const tabs = getTabsForCity(availability);

            setContentAvailability(availability);
            setContentSections(sections);
            setAvailableTabs(tabs);

            console.log('✅ Content availability updated:', {
              city: availability.city,
              restaurants: availability.restaurantCount,
              events: availability.eventCount,
              sections: sections.availableSections,
              showComingSoon: sections.showComingSoon
            });
          }, 100);
        }
      } else {
        console.log('ℹ️ No saved location found, using default');
      }
    } catch (error) {
      console.error('❌ Error refreshing location:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load location when user changes
  useEffect(() => {
    refreshLocation();
  }, [user?.id]);

  const value: LocationContextType = {
    currentLocation,
    locationSubtitle,
    locationData,
    contentAvailability,
    contentSections,
    availableTabs,
    setCurrentLocation,
    refreshLocation,
    refreshContentAvailability,
    loading,
    contentLoading,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

