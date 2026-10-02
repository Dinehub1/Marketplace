import { supabase } from '../config/supabase';

export interface CityContentAvailability {
  city: string;
  hasRestaurants: boolean;
  hasEvents: boolean;
  hasActivities: boolean; // For future use
  restaurantCount: number;
  eventCount: number;
  activityCount: number;
  totalContent: number;
}

export interface ContentSections {
  showDining: boolean;
  showEvents: boolean;
  showActivities: boolean;
  showComingSoon: boolean;
  availableSections: string[];
}

/**
 * Get content availability for a specific city
 */
export async function getCityContentAvailability(cityName: string): Promise<CityContentAvailability> {
  try {
    console.log('🔍 Checking content for city:', cityName);

    // Get restaurant count using count query
    const { count: restaurantCount, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('city', cityName)
      .eq('is_active', true);

    if (restaurantError) {
      console.error('Error fetching restaurants:', restaurantError);
    }

    // Get event count (only future events) using count query
    const { count: eventCount, error: eventError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('city', cityName)
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0]);

    if (eventError) {
      console.error('Error fetching events:', eventError);
    }

    // Get activities count (events with activity scope) using count query
    const { count: activityCount, error: activityError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('city', cityName)
      .eq('is_active', true)
      .contains('event_scope', ['activity'])
      .gte('event_date', new Date().toISOString().split('T')[0]);

    if (activityError) {
      console.error('Error fetching activities:', activityError);
    }

    const finalRestaurantCount = restaurantCount || 0;
    const finalEventCount = eventCount || 0;
    const finalActivityCount = activityCount || 0;

    console.log('📊 Content counts:', {
      city: cityName,
      restaurants: finalRestaurantCount,
      events: finalEventCount,
      activities: finalActivityCount
    });

    return {
      city: cityName,
      hasRestaurants: finalRestaurantCount > 0,
      hasEvents: finalEventCount > 0,
      hasActivities: finalActivityCount > 0,
      restaurantCount: finalRestaurantCount,
      eventCount: finalEventCount,
      activityCount: finalActivityCount,
      totalContent: finalRestaurantCount + finalEventCount + finalActivityCount,
    };
  } catch (error) {
    console.error('Error getting city content availability:', error);
    return {
      city: cityName,
      hasRestaurants: false,
      hasEvents: false,
      hasActivities: false,
      restaurantCount: 0,
      eventCount: 0,
      activityCount: 0,
      totalContent: 0,
    };
  }
}

/**
 * Determine which sections to show based on content availability
 */
export function getContentSections(availability: CityContentAvailability): ContentSections {
  const { hasRestaurants, hasEvents, hasActivities, totalContent } = availability;

  // If no content at all, show coming soon
  if (totalContent === 0) {
    return {
      showDining: false,
      showEvents: false,
      showActivities: false,
      showComingSoon: true,
      availableSections: [],
    };
  }

  // Determine which sections to show
  const sections: ContentSections = {
    showDining: hasRestaurants,
    showEvents: hasEvents,
    showActivities: hasActivities,
    showComingSoon: false,
    availableSections: [],
  };

  // Build available sections array
  if (hasRestaurants) sections.availableSections.push('dining');
  if (hasEvents) sections.availableSections.push('events');
  if (hasActivities) sections.availableSections.push('activities');

  return sections;
}

/**
 * Get tab configuration based on content availability
 */
export function getTabsForCity(availability: CityContentAvailability) {
  const sections = getContentSections(availability);
  const tabs = [];

  // If no content, return empty tabs (coming soon will be handled elsewhere)
  if (sections.showComingSoon) {
    return [];
  }

  // Always show "For You" tab as the main tab when there's content
  tabs.push({
    id: 'for-you',
    title: 'For You',
    icon: 'heart-outline' as const,
  });

  // Add content-specific tabs ONLY if they have actual content
  if (sections.showDining && availability.restaurantCount > 0) {
    tabs.push({
      id: 'dining',
      title: 'Dining',
      icon: 'restaurant-outline' as const,
    });
  }

  if (sections.showEvents && availability.eventCount > 0) {
    tabs.push({
      id: 'showtime',
      title: 'Events',
      icon: 'calendar-outline' as const,
    });
  }

  if (sections.showActivities && availability.activityCount > 0) {
    tabs.push({
      id: 'activities',
      title: 'Activities',
      icon: 'bicycle-outline' as const,
    });
  }

  return tabs;
}

/**
 * Get message for content availability
 */
export function getContentMessage(availability: CityContentAvailability): string {
  const { city, hasRestaurants, hasEvents, hasActivities, totalContent } = availability;

  if (totalContent === 0) {
    return `We're not available in ${city} yet. Coming soon! 🚀`;
  }

  const availableTypes = [];
  if (hasRestaurants) availableTypes.push('restaurants');
  if (hasEvents) availableTypes.push('events');
  if (hasActivities) availableTypes.push('activities');

  if (availableTypes.length === 1) {
    return `${availableTypes[0].charAt(0).toUpperCase() + availableTypes[0].slice(1)} available in ${city}`;
  }

  return ''; // No message needed when multiple types are available
}

/**
 * Check if a city has any content
 */
export async function cityHasContent(cityName: string): Promise<boolean> {
  const availability = await getCityContentAvailability(cityName);
  return availability.totalContent > 0;
}

/**
 * Get nearest cities with content (for fallback)
 */
export async function getNearestCitiesWithContent(
  userLat: number, 
  userLng: number, 
  limit: number = 3
): Promise<Array<{ city: string; distance: number; hasRestaurants: boolean; hasEvents: boolean }>> {
  try {
    // Get all cities with restaurants
    const { data: restaurantCities } = await supabase
      .from('restaurants')
      .select('city, latitude, longitude')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Get all cities with events
    const { data: eventCities } = await supabase
      .from('events')
      .select('city, latitude, longitude')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Combine and calculate distances
    const cityMap = new Map<string, { 
      city: string; 
      lat: number; 
      lng: number; 
      hasRestaurants: boolean; 
      hasEvents: boolean; 
    }>();

    // Add restaurant cities
    restaurantCities?.forEach(item => {
      if (!cityMap.has(item.city)) {
        cityMap.set(item.city, {
          city: item.city,
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          hasRestaurants: true,
          hasEvents: false,
        });
      } else {
        cityMap.get(item.city)!.hasRestaurants = true;
      }
    });

    // Add event cities
    eventCities?.forEach(item => {
      if (!cityMap.has(item.city)) {
        cityMap.set(item.city, {
          city: item.city,
          lat: parseFloat(item.latitude),
          lng: parseFloat(item.longitude),
          hasRestaurants: false,
          hasEvents: true,
        });
      } else {
        cityMap.get(item.city)!.hasEvents = true;
      }
    });

    // Calculate distances and sort
    const citiesWithDistance = Array.from(cityMap.values())
      .map(cityData => ({
        city: cityData.city,
        distance: calculateDistance(userLat, userLng, cityData.lat, cityData.lng),
        hasRestaurants: cityData.hasRestaurants,
        hasEvents: cityData.hasEvents,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return citiesWithDistance;
  } catch (error) {
    console.error('Error getting nearest cities:', error);
    return [];
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
