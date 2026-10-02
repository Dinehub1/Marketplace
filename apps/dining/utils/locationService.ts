/**
 * Location Service for Cities, Areas, and Places
 * Provides functions to fetch and manage location data from Supabase
 */

import { supabase } from '../config/supabase';
import { LocationPoint, sortByDistance } from './haversine';

export interface City {
  id: string;
  name: string;
  display_order: number;
  cover_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CityArea {
  id: string;
  city_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  display_order: number;
  cover_image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Place {
  id: string;
  city_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  is_popular: boolean;
  cover_image_url: string | null;
  description: string | null;
  created_at: string;
}

export interface CityWithAreas extends City {
  areas?: CityArea[];
}

export interface PlaceWithDistance extends Place {
  distance_m: number;
  distance_text: string;
}

/**
 * Fetch all active cities ordered by display_order
 */
export async function getAllCities(): Promise<{ data: City[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error fetching cities:', error);
    return { data: null, error };
  }
}

/**
 * Fetch popular cities (first 6 cities by display_order) with cover images
 */
export async function getPopularCities(): Promise<{ data: City[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .not('cover_image_url', 'is', null)
      .order('display_order', { ascending: true })
      .limit(6);

    return { data, error };
  } catch (error) {
    console.error('Error fetching popular cities:', error);
    return { data: null, error };
  }
}

/**
 * Fetch areas for a specific city
 */
export async function getCityAreas(cityId: string): Promise<{ data: CityArea[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('city_areas')
      .select('*')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return { data, error };
  } catch (error) {
    console.error('Error fetching city areas:', error);
    return { data: null, error };
  }
}

/**
 * Fetch places for a specific city
 */
export async function getPlacesForCity(
  cityName: string
): Promise<{ data: PlaceWithDistance[] | null; error: any }> {
  try {
    // Get places for the specific city
    const { data: places, error } = await supabase
      .from('places')
      .select(`
        *,
        cities!inner(name)
      `)
      .eq('cities.name', cityName)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      return { data: null, error };
    }

    if (!places || places.length === 0) {
      return { data: [], error: null };
    }

    // Convert to format compatible with distance calculation
    const placesWithLocation = places.map(place => ({
      ...place,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      distance_m: 0, // Will be calculated if user location is available
      distance_text: '0 km',
    }));

    return { data: placesWithLocation, error: null };
  } catch (error) {
    console.error('Error fetching places for city:', error);
    return { data: null, error };
  }
}

/**
 * Fetch places near user location within a radius
 */
export async function getPlacesNearUser(
  userLocation: LocationPoint,
  radiusKm: number = 25
): Promise<{ data: PlaceWithDistance[] | null; error: any }> {
  try {
    // First get all places with their coordinates
    const { data: places, error } = await supabase
      .from('places')
      .select(`
        *,
        cities!inner(name)
      `)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      return { data: null, error };
    }

    if (!places || places.length === 0) {
      return { data: [], error: null };
    }

    // Convert to format compatible with distance calculation
    const placesWithLocation = places.map(place => ({
      ...place,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    }));

    // Sort by distance and filter by radius
    const placesWithDistance = sortByDistance(userLocation, placesWithLocation);
    const nearbyPlaces = placesWithDistance.filter(
      place => place.distance_m <= radiusKm * 1000
    );

    return { data: nearbyPlaces, error: null };
  } catch (error) {
    console.error('Error fetching places near user:', error);
    return { data: null, error };
  }
}

/**
 * Fetch popular places for a specific city with distance calculation if user location is provided
 */
export async function getPopularPlacesForCity(
  cityName: string,
  userLocation?: LocationPoint,
  limit: number = 10
): Promise<{ data: PlaceWithDistance[] | null; error: any }> {
  try {
    const { data: places, error } = await supabase
      .from('places')
      .select(`
        *,
        cities!inner(name)
      `)
      .eq('cities.name', cityName)
      .eq('is_popular', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit);

    if (error) {
      return { data: null, error };
    }

    if (!places || places.length === 0) {
      return { data: [], error: null };
    }

    // Convert to format compatible with distance calculation
    const placesWithLocation = places.map(place => ({
      ...place,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    }));

    let finalPlaces: PlaceWithDistance[];

    console.log('🔍 getPopularPlacesForCity - userLocation:', userLocation, 'placesWithLocation:', placesWithLocation.length);

    if (userLocation) {
      // Sort by distance if user location is available
      console.log('📍 Calculating distances...');
      finalPlaces = sortByDistance(userLocation, placesWithLocation);
      console.log('📍 First place with distance:', finalPlaces[0]?.name, finalPlaces[0]?.distance_text);
    } else {
      console.log('⚠️ No user location, using 0 km');
      // Just add default distance values
      finalPlaces = placesWithLocation.map(place => ({
        ...place,
        distance_m: 0,
        distance_text: '0 km',
      }));
    }

    return { data: finalPlaces, error: null };
  } catch (error) {
    console.error('Error fetching popular places for city:', error);
    return { data: null, error };
  }
}

/**
 * Fetch popular places (marked as popular) near user location
 */
export async function getPopularPlacesNearUser(
  userLocation: LocationPoint,
  radiusKm: number = 25,
  limit: number = 10
): Promise<{ data: PlaceWithDistance[] | null; error: any }> {
  try {
    const { data: places, error } = await supabase
      .from('places')
      .select(`
        *,
        cities!inner(name)
      `)
      .eq('is_popular', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(limit * 2); // Get more to account for filtering

    if (error) {
      return { data: null, error };
    }

    if (!places || places.length === 0) {
      return { data: [], error: null };
    }

    // Convert to format compatible with distance calculation
    const placesWithLocation = places.map(place => ({
      ...place,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    }));

    // Sort by distance and filter by radius
    const placesWithDistance = sortByDistance(userLocation, placesWithLocation);
    const nearbyPlaces = placesWithDistance
      .filter(place => place.distance_m <= radiusKm * 1000)
      .slice(0, limit);

    return { data: nearbyPlaces, error: null };
  } catch (error) {
    console.error('Error fetching popular places near user:', error);
    return { data: null, error };
  }
}

/**
 * Get city by ID
 */
export async function getCityById(cityId: string): Promise<{ data: City | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching city by ID:', error);
    return { data: null, error };
  }
}

/**
 * Get area by ID
 */
export async function getAreaById(areaId: string): Promise<{ data: CityArea | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('city_areas')
      .select('*')
      .eq('id', areaId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching area by ID:', error);
    return { data: null, error };
  }
}

/**
 * Check if a city has areas
 */
export async function cityHasAreas(cityId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('city_areas')
      .select('id')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Error checking city areas:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking city areas:', error);
    return false;
  }
}

/**
 * Check if a city has places
 */
export async function cityHasPlaces(cityName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select(`
        id,
        cities!inner(name)
      `)
      .eq('cities.name', cityName)
      .limit(1);

    if (error) {
      console.error('Error checking city places:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking city places:', error);
    return false;
  }
}