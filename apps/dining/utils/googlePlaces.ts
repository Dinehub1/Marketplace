/**
 * Google Places API Utility
 * 
 * Integrates with Google Maps Platform APIs:
 * - Places API (Autocomplete & Place Details)
 * - Geocoding API (Address to Coordinates)
 * - Geolocation API (Device Location)
 */

// For Expo projects, use process.env for environment variables
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

if (!GOOGLE_API_KEY) {
  console.warn('⚠️ GOOGLE_API_KEY not found in environment variables');
}

/**
 * Location interface
 */
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  area?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/**
 * Place autocomplete prediction
 */
export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

/**
 * Place details
 */
export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  types: string[];
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
    html_attributions: string[];
  }>;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

/**
 * Search places using Google Places Autocomplete API
 * @param input - Search query
 * @param sessionToken - Optional session token for billing
 * @param location - Optional bias location
 * @param radius - Optional search radius in meters
 * @returns Array of place predictions
 */
export const searchPlaces = async (
  input: string,
  sessionToken?: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<{ predictions: PlacePrediction[]; error?: string }> => {
  if (!input || input.trim().length < 2) {
    return { predictions: [] };
  }

  try {
    const params = new URLSearchParams({
      input: input.trim(),
      key: GOOGLE_API_KEY,
      language: 'en',
      components: 'country:in', // Restrict to India
    });

    // Add session token if provided (for billing optimization)
    if (sessionToken) {
      params.append('sessiontoken', sessionToken);
    }

    // Add location bias if provided
    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
      if (radius) {
        params.append('radius', radius.toString());
      }
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log(`✅ Found ${data.predictions.length} place predictions`);
      return { predictions: data.predictions };
    } else if (data.status === 'ZERO_RESULTS') {
      return { predictions: [] };
    } else {
      console.error('❌ Places API error:', data.status, data.error_message);
      return { predictions: [], error: data.error_message || data.status };
    }
  } catch (error) {
    console.error('❌ Error searching places:', error);
    return { predictions: [], error: 'Network error' };
  }
};

/**
 * Get place details by place ID
 * @param placeId - Google Place ID
 * @param sessionToken - Optional session token
 * @returns Place details
 */
export const getPlaceDetails = async (
  placeId: string,
  sessionToken?: string
): Promise<{ place?: PlaceDetails; error?: string }> => {
  if (!placeId) {
    return { error: 'Place ID required' };
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_API_KEY,
      fields: 'place_id,name,formatted_address,geometry,address_components,types,photos,rating,user_ratings_total,business_status',
      language: 'en',
    });

    if (sessionToken) {
      params.append('sessiontoken', sessionToken);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      console.log('✅ Place details retrieved:', data.result.name);
      return { place: data.result };
    } else {
      console.error('❌ Place Details API error:', data.status, data.error_message);
      return { error: data.error_message || data.status };
    }
  } catch (error) {
    console.error('❌ Error getting place details:', error);
    return { error: 'Network error' };
  }
};

/**
 * Get photo URL for a place
 * @param photoReference - Photo reference from place details
 * @param maxWidth - Maximum width (default: 400)
 * @returns Photo URL
 */
export const getPlacePhotoUrl = (
  photoReference: string,
  maxWidth: number = 400
): string => {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
};

/**
 * Geocode an address to get coordinates
 * @param address - Address string
 * @returns Location with coordinates
 */
export const geocodeAddress = async (
  address: string
): Promise<{ location?: Location; error?: string }> => {
  if (!address) {
    return { error: 'Address required' };
  }

  try {
    const params = new URLSearchParams({
      address: address.trim(),
      key: GOOGLE_API_KEY,
      language: 'en',
      region: 'in', // Bias to India
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const location: Location = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
      };

      // Extract city, state, country from address components
      result.address_components.forEach((component: any) => {
        if (component.types.includes('locality')) {
          location.city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          location.state = component.long_name;
        }
        if (component.types.includes('country')) {
          location.country = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          location.postalCode = component.long_name;
        }
      });

      console.log('✅ Geocoded address:', location.city);
      return { location };
    } else {
      console.error('❌ Geocoding API error:', data.status, data.error_message);
      return { error: data.error_message || data.status };
    }
  } catch (error) {
    console.error('❌ Error geocoding address:', error);
    return { error: 'Network error' };
  }
};

/**
 * Reverse geocode coordinates to get address
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Location with address
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<{ location?: Location; error?: string }> => {
  if (!latitude || !longitude) {
    return { error: 'Coordinates required' };
  }

  try {
    const params = new URLSearchParams({
      latlng: `${latitude},${longitude}`,
      key: GOOGLE_API_KEY,
      language: 'en',
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const location: Location = {
        latitude,
        longitude,
        address: result.formatted_address,
      };

      // Extract detailed location components
      result.address_components.forEach((component: any) => {
        const types = component.types;
        
        // Extract city/locality
        if (types.includes('locality')) {
          location.city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !location.city) {
          location.city = component.long_name;
        }
        
        // Extract area/sublocality (neighborhood)
        if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
          location.area = component.long_name;
        } else if (types.includes('neighborhood') && !location.area) {
          location.area = component.long_name;
        }
        
        // Extract state
        if (types.includes('administrative_area_level_1')) {
          location.state = component.long_name;
        }
        
        // Extract country
        if (types.includes('country')) {
          location.country = component.long_name;
        }
        
        // Extract postal code
        if (types.includes('postal_code')) {
          location.postalCode = component.long_name;
        }
      });

      console.log('✅ Reverse geocoded to:', { area: location.area, city: location.city });
      return { location };
    } else {
      console.error('❌ Reverse Geocoding API error:', data.status, data.error_message);
      return { error: data.error_message || data.status };
    }
  } catch (error) {
    console.error('❌ Error reverse geocoding:', error);
    return { error: 'Network error' };
  }
};

/**
 * Get current device location using expo-location
 * @returns Current location
 */
export const getCurrentLocation = async (): Promise<{
  location?: Location;
  error?: string;
}> => {
  try {
    console.log('📍 Requesting device location...');

    // Dynamically import expo-location
    const Location = await import('expo-location');

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('❌ Location permission denied');
      return { error: 'Location permission denied' };
    }

    // Get current position
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    console.log('✅ Device location obtained');

    // Reverse geocode to get address
    const { location: geocodedLocation } = await reverseGeocode(
      position.coords.latitude,
      position.coords.longitude
    );

    return {
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: geocodedLocation?.address,
        area: geocodedLocation?.area,
        city: geocodedLocation?.city,
        state: geocodedLocation?.state,
        country: geocodedLocation?.country,
      },
    };
  } catch (error) {
    console.error('❌ Error getting current location:', error);
    return { error: 'Failed to get location' };
  }
};

/**
 * Generate a session token for Places API (for billing optimization)
 * Session tokens group autocomplete and place details calls together
 * @returns Session token (UUID v4)
 */
export const generateSessionToken = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Format location for display
 * @param location - Location object
 * @returns Formatted string
 */
export const formatLocationDisplay = (location: Location): string => {
  if (location.city && location.state) {
    return `${location.city}, ${location.state}`;
  }
  if (location.city) {
    return location.city;
  }
  if (location.address) {
    // Return first part of address (usually area/locality)
    return location.address.split(',')[0];
  }
  return 'Unknown Location';
};

/**
 * Check if location is a restaurant/establishment
 * @param types - Place types from Google Places
 * @returns True if restaurant/establishment
 */
export const isRestaurantPlace = (types: string[]): boolean => {
  const restaurantTypes = [
    'restaurant',
    'food',
    'cafe',
    'bar',
    'meal_delivery',
    'meal_takeaway',
    'bakery',
  ];
  return types.some((type) => restaurantTypes.includes(type));
};

