import { haversineDistanceMeters } from '../../utils/haversine';

/**
 * Get date range for "Today" filter
 */
export function getTodayDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  return { startDate: dateStr, endDate: dateStr };
}

/**
 * Get date range for "Tomorrow" filter
 */
export function getTomorrowDateRange(): { startDate: string; endDate: string } {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  return { startDate: dateStr, endDate: dateStr };
}

/**
 * Get date range for "This Weekend" filter
 * Returns the upcoming Saturday and Sunday
 */
export function getThisWeekendDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate days until Saturday
  let daysUntilSaturday = 6 - dayOfWeek;
  if (daysUntilSaturday < 0) {
    daysUntilSaturday += 7;
  }

  // Get Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);

  // Get Sunday (next day)
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    startDate: saturday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0],
  };
}

/**
 * Check if event is within distance filter
 */
export function isEventWithinDistance(
  eventLat: number | null,
  eventLng: number | null,
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  maxDistanceKm: number
): boolean {
  if (!eventLat || !eventLng || !userLat || !userLng) {
    // If location data is missing, include the event by default
    return true;
  }

  const distance = haversineDistanceMeters(userLat, userLng, eventLat, eventLng) / 1000; // Convert to km
  return distance <= maxDistanceKm;
}

/**
 * Filter events based on date filter
 */
export function filterEventsByDate(
  events: any[],
  dateFilter: 'today' | 'tomorrow' | 'this_weekend' | null
): any[] {
  if (!dateFilter) return events;

  let dateRange: { startDate: string; endDate: string };

  switch (dateFilter) {
    case 'today':
      dateRange = getTodayDateRange();
      break;
    case 'tomorrow':
      dateRange = getTomorrowDateRange();
      break;
    case 'this_weekend':
      dateRange = getThisWeekendDateRange();
      break;
    default:
      return events;
  }

  return events.filter((event) => {
    if (!event.event_date) return false;
    const eventDate = event.event_date;
    return eventDate >= dateRange.startDate && eventDate <= dateRange.endDate;
  });
}

/**
 * Filter events based on distance
 */
export function filterEventsByDistance(
  events: any[],
  distanceFilter: number | null,
  userLat: number | null | undefined,
  userLng: number | null | undefined
): any[] {
  if (!distanceFilter || !userLat || !userLng) return events;

  return events.filter((event) =>
    isEventWithinDistance(event.latitude, event.longitude, userLat, userLng, distanceFilter)
  );
}

/**
 * Filter events based on categories
 */
export function filterEventsByCategories(
  events: any[],
  categoryIds: string[]
): any[] {
  if (categoryIds.length === 0) return events;

  return events.filter((event) => {
    if (!event.category_id) return false;
    return categoryIds.includes(event.category_id);
  });
}

/**
 * Sort events based on sort option
 */
export function sortEvents(
  events: any[],
  sortBy: 'popularity' | 'date' | 'price_low' | 'price_high' | 'distance',
  userLat?: number | null,
  userLng?: number | null
): any[] {
  const sortedEvents = [...events];

  switch (sortBy) {
    case 'popularity':
      // Sort by is_featured, then by total bookings/views
      return sortedEvents.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        // Could add booking count here if available
        return 0;
      });

    case 'date':
      // Sort by event_date ascending (nearest first)
      return sortedEvents.sort((a, b) => {
        const dateA = new Date(a.event_date).getTime();
        const dateB = new Date(b.event_date).getTime();
        return dateA - dateB;
      });

    case 'price_low':
      // Sort by min_price ascending
      return sortedEvents.sort((a, b) => {
        const priceA = a.min_price || 0;
        const priceB = b.min_price || 0;
        return priceA - priceB;
      });

    case 'price_high':
      // Sort by min_price descending
      return sortedEvents.sort((a, b) => {
        const priceA = a.min_price || 0;
        const priceB = b.min_price || 0;
        return priceB - priceA;
      });

    case 'distance':
      // Sort by distance from user location
      if (!userLat || !userLng) return sortedEvents;

      return sortedEvents.sort((a, b) => {
        const distA =
          a.latitude && a.longitude
            ? haversineDistanceMeters(userLat, userLng, a.latitude, a.longitude) / 1000
            : Infinity;
        const distB =
          b.latitude && b.longitude
            ? haversineDistanceMeters(userLat, userLng, b.latitude, b.longitude) / 1000
            : Infinity;
        return distA - distB;
      });

    default:
      return sortedEvents;
  }
}

/**
 * Apply all filters and sorting to events
 */
export function applyEventFilters(
  events: any[],
  filters: {
    dateFilter: 'today' | 'tomorrow' | 'this_weekend' | null;
    distanceFilter: number | null;
    selectedCategories: string[];
    sortBy: 'popularity' | 'date' | 'price_low' | 'price_high' | 'distance';
  },
  userLocation?: { latitude: number | null; longitude: number | null }
): any[] {
  let filteredEvents = [...events];

  // Apply date filter
  filteredEvents = filterEventsByDate(filteredEvents, filters.dateFilter);

  // Apply distance filter
  if (userLocation) {
    filteredEvents = filterEventsByDistance(
      filteredEvents,
      filters.distanceFilter,
      userLocation.latitude,
      userLocation.longitude
    );
  }

  // Apply category filter
  filteredEvents = filterEventsByCategories(filteredEvents, filters.selectedCategories);

  // Apply sorting
  filteredEvents = sortEvents(
    filteredEvents,
    filters.sortBy,
    userLocation?.latitude,
    userLocation?.longitude
  );

  return filteredEvents;
}

/**
 * Count events by category (for badge display)
 */
export function countEventsByCategory(events: any[]): Record<string, number> {
  const counts: Record<string, number> = {};

  events.forEach((event) => {
    if (event.category_id) {
      counts[event.category_id] = (counts[event.category_id] || 0) + 1;
    }
  });

  return counts;
}

