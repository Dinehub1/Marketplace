/**
 * Haversine Distance Calculation Utility
 * 
 * Provides functions for calculating straight-line distances between geographic coordinates,
 * formatting distances nicely, and sorting arrays of items by distance.
 */

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface ItemWithLocation extends LocationPoint {
  id: string;
  [key: string]: any;
}

export interface ItemWithDistance extends ItemWithLocation {
  distance_m: number;
  distance_text: string;
}

/**
 * Calculate the straight-line distance between two points using the Haversine formula
 * 
 * @param lat1 - Latitude of first point in degrees
 * @param lng1 - Longitude of first point in degrees  
 * @param lat2 - Latitude of second point in degrees
 * @param lng2 - Longitude of second point in degrees
 * @returns Distance in meters
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Earth's radius in meters
  const R = 6371000;
  
  // Convert degrees to radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  // Haversine formula
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in meters
  const distance = R * c;
  
  return Math.round(distance);
}

/**
 * Format distance in meters to a nice human-readable string
 * 
 * @param meters - Distance in meters
 * @returns Formatted string like "850 m" or "2.3 km"
 */
export function formatDistanceNice(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
}

/**
 * Calculate distance from user location to a single item
 * 
 * @param userLocation - User's current location
 * @param item - Item with latitude/longitude
 * @returns Item with added distance_m and distance_text fields
 */
export function addDistanceToItem<T extends ItemWithLocation>(
  userLocation: LocationPoint,
  item: T
): T & ItemWithDistance {
  const distance_m = haversineDistanceMeters(
    userLocation.latitude,
    userLocation.longitude,
    item.latitude,
    item.longitude
  );

  return {
    ...item,
    distance_m,
    distance_text: formatDistanceNice(distance_m)
  };
}

/**
 * Sort an array of items by distance from user location (nearest first)
 * Adds distance_m and distance_text fields to each item
 * 
 * @param userLocation - User's current location
 * @param items - Array of items with latitude/longitude
 * @returns Sorted array with distance information added
 */
export function sortByDistance<T extends ItemWithLocation>(
  userLocation: LocationPoint,
  items: T[]
): (T & ItemWithDistance)[] {
  // Add distance to each item
  const itemsWithDistance = items.map(item => 
    addDistanceToItem(userLocation, item)
  );

  // Sort by distance (ascending - nearest first)
  return itemsWithDistance.sort((a, b) => a.distance_m - b.distance_m);
}

/**
 * Get the closest item from an array
 * 
 * @param userLocation - User's current location
 * @param items - Array of items with latitude/longitude
 * @returns Closest item with distance information, or null if array is empty
 */
export function getClosestItem<T extends ItemWithLocation>(
  userLocation: LocationPoint,
  items: T[]
): (T & ItemWithDistance) | null {
  if (items.length === 0) return null;
  
  const sorted = sortByDistance(userLocation, items);
  return sorted[0];
}

/**
 * Filter items within a certain radius from user location
 * 
 * @param userLocation - User's current location
 * @param items - Array of items with latitude/longitude
 * @param radiusMeters - Maximum distance in meters
 * @returns Filtered array with only items within radius, sorted by distance
 */
export function filterByRadius<T extends ItemWithLocation>(
  userLocation: LocationPoint,
  items: T[],
  radiusMeters: number
): (T & ItemWithDistance)[] {
  const itemsWithDistance = sortByDistance(userLocation, items);
  return itemsWithDistance.filter(item => item.distance_m <= radiusMeters);
}

/**
 * Default location for major Indian cities (fallback when user location is unavailable)
 */
export const DEFAULT_LOCATIONS = {
  mumbai: { latitude: 19.0760, longitude: 72.8777 },
  delhi: { latitude: 28.6139, longitude: 77.2090 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  hyderabad: { latitude: 17.3850, longitude: 78.4867 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
} as const;

export type DefaultCity = keyof typeof DEFAULT_LOCATIONS;

/**
 * Get default location for a city
 * 
 * @param city - City name
 * @returns Location coordinates for the city
 */
export function getDefaultLocation(city: DefaultCity = 'mumbai'): LocationPoint {
  return DEFAULT_LOCATIONS[city];
}
