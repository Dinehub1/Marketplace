import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ActiveReservationCard } from '../../components/ActiveReservationCard';
import { EventFilters, applyEventFilters } from '../../components/Events';
import EventCard from '../../components/Events/EventCard';
import type { EventCategory } from '../../components/Events/EventFilterModal';
import type { EventFiltersState } from '../../components/Events/EventFilters';
import { FadeInView } from '../../components/FadeInView';
import { FeaturedEventsCarousel } from '../../components/FeaturedEventsCarousel';
import { FeaturedEventSkeleton, FullPageEventSkeleton } from '../../components/SkeletonLoader';
import { H2 } from '../../components/ui';
import { getEventCategories, getEvents, getFeaturedEvents } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { supabase } from '../../config/supabase'; // adjust path if needed
import { getUserActiveReservationsWithDetails } from '../../utils/reservationManager';
const { width } = Dimensions.get('window');


interface ShowtimeScreenProps {
  scrollY?: Animated.Value;
}

export default function ShowtimeScreen({ scrollY }: ShowtimeScreenProps) {
  const { user } = useAuth();
  const { locationData } = useLocation();
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [displayEvents, setDisplayEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Active reservations state
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // Quick categories for filter bar (most popular ones)
  const quickCategories = eventCategories.slice(0, 3).map(cat => ({
    id: cat.id,
    name: cat.name
  }));

 
useEffect(() => {
  loadEvents();
  loadFeaturedEvents();
  loadEventCategories();
}, [locationData?.city]); // Reload when city changes


  const loadEventCategories = async () => {
    try {
      const currentCity = locationData?.city;
      console.log('🏷️ Loading event categories for city:', currentCity);
      
      setCategoriesLoading(true);
      
      const { data, error } = await getEventCategories(currentCity);
      
      if (error) {
        console.error('Error loading event categories:', error);
        setCategoriesLoading(false);
        return;
      }

      setEventCategories(data || []);
      setCategoriesLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setCategoriesLoading(false);
    }
  };

  const loadFeaturedEvents = async () => {
    try {
      const currentCity = locationData?.city;
      console.log('🎭 Loading featured events for city:', currentCity);
      
      setFeaturedLoading(true);
      
      const [dataResult] = await Promise.all([
        getFeaturedEvents(currentCity),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      const { data, error } = dataResult;
      
      if (error) {
        console.error('Error loading featured events:', error);
        setFeaturedLoading(false);
        return;
      }

      setFeaturedEvents(data || []);
      setFeaturedLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setFeaturedLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const currentCity = locationData?.city;
      console.log('🎪 Loading events for city:', currentCity);
      
      setLoading(true);
      
      // Simulate minimum loading time for smooth skeleton display
      const [dataResult] = await Promise.all([
        getEvents({ city: currentCity }),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      const { data, error } = dataResult;
      
      if (error) {
        console.error('Error loading events:', error);
        setLoading(false);
        return;
      }

      // Map database events to expected format
      const mappedEvents = (data || []).map((event: any) => {
        // Use price_display_string from database, with fallback to ticket type calculation
        let minPrice = 0;
        let isFreeEvent = event.ticket_type === 'free';
        
        // Only calculate from ticket types if price_display_string is not available
        if (!event.price_display_string && !isFreeEvent && event.event_ticket_types && event.event_ticket_types.length > 0) {
          const activeTickets = event.event_ticket_types.filter((ticket: any) => ticket.is_active);
          
          if (activeTickets.length > 0) {
            const ticketPrices = activeTickets.map((ticket: any) => {
              const basePrice = parseFloat(ticket.entry_fee_amount) || parseFloat(ticket.price) || 0;
              const coverCharge = ticket.ticket_cover_enabled ? (parseFloat(ticket.ticket_cover_amount) || 0) : 0;
              return basePrice + coverCharge;
            });
            minPrice = Math.min(...ticketPrices);
          }
        }
        // Get venue name and city from event_venue
        let venueName = '';
        let venueCity = '';
        
        if (event.event_venue?.[0]) {
          const eventVenue = event.event_venue[0];
          if (eventVenue.restaurant_id && eventVenue.restaurants) {
            // If restaurant is linked - get city from restaurant data
            venueName = eventVenue.restaurants.name;
            venueCity = eventVenue.restaurants.city || event.city || '';
          } else if (eventVenue.venue_data) {
            // If custom venue data exists
            try {
              const venueData = typeof eventVenue.venue_data === 'string' 
                ? JSON.parse(eventVenue.venue_data) 
                : eventVenue.venue_data;
              venueName = venueData.name || '';
              venueCity = event.city || '';
            } catch (e) {
              venueName = '';
            }
          }
        }

        // Format venue display
        let venueDisplay = '';
        if (venueName && venueCity) {
          venueDisplay = `${venueName}, ${venueCity}`;
        } else if (venueName) {
          venueDisplay = venueName;
        }

        return {
          id: event.id,
          title: event.title,
          subtitle: event.description,
          image: event.cover_image_url || 'https://i.pinimg.com/1200x/12/07/79/12077906500898292f2c46d44ef5e2ef.jpg',
          video: event.cover_video_url,
          date: event.event_date,
          time: event.start_time,
          venue: venueDisplay,
          price: event.ticket_price || 0,
          description: event.description,
          category: event.event_categories?.name || 'Other',
          duration: '3 hours',
          organizer: venueName,
          // Pricing information
          ticket_type: event.ticket_type,
          min_price: minPrice,
          is_free: isFreeEvent,
          price_display_string: event.price_display_string, // Pass price_display_string from database
          // Additional fields for filtering
          event_date: event.event_date,
          category_id: event.category_id,
          latitude: event.latitude,
          longitude: event.longitude,
          is_featured: event.is_featured
        };
      });

      setAllEvents(mappedEvents);
      setDisplayEvents(mappedEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Handle filter changes from EventFilters component
  const handleFiltersChange = (filters: EventFiltersState) => {
    console.log('🔍 Applying filters:', filters);
    
    const userLocation = locationData ? {
      latitude: locationData.latitude,
      longitude: locationData.longitude
    } : undefined;

    const filtered = applyEventFilters(allEvents, filters, userLocation);
    setDisplayEvents(filtered);
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        onScroll={scrollY ? Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        ) : undefined}
        scrollEventThrottle={16}
      >


        {/* Featured Events Carousel */}
        {featuredLoading ? (
          <View style={styles.featuredSection}>
            {/* Enhanced Header Skeleton */}
            <View style={styles.featuredHeaderContainer}>
              <View style={styles.featuredHeaderSkeleton}>
                <View style={styles.featuredTitleSkeleton} />
                <View style={styles.featuredSubtitleSkeleton} />
              </View>
              <View style={styles.featuredViewAllSkeleton} />
            </View>
            
            {/* Enhanced Carousel Skeleton */}
            <View style={styles.featuredCarouselContainer}>
              <View style={styles.featuredSkeletonScroll}>
                <View style={{ width: 16 }} />
                <FeaturedEventSkeleton />
                <FeaturedEventSkeleton />
                <View style={{ width: 16 }} />
              </View>
            </View>
            
            {/* Enhanced Pagination Skeleton */}
            <View style={styles.paginationContainer}>
              <View style={styles.paginationSkeleton}>
                <View style={[styles.paginationDotSkeleton, styles.paginationDotActive]} />
                <View style={styles.paginationDotSkeleton} />
                <View style={styles.paginationDotSkeleton} />
                <View style={styles.paginationDotSkeleton} />
              </View>
            </View>
          </View>
        ) : featuredEvents.length > 0 ? (
          <FadeInView>
            <FeaturedEventsCarousel events={featuredEvents} />
          </FadeInView>
        ) : null}

        {/* Event Filters */}
        {categoriesLoading ? (
          <View style={styles.filtersSkeletonContainer}>
            <View style={styles.filtersSkeletonHeader}>
              <View style={styles.filterTitleSkeleton} />
              <View style={styles.filterCountSkeleton} />
            </View>
            <View style={styles.filtersSkeletonRow}>
              <View style={styles.filterChipSkeleton} />
              <View style={styles.filterChipSkeleton} />
              <View style={styles.filterChipSkeleton} />
              <View style={styles.filterChipSkeletonSmall} />
            </View>
          </View>
        ) : (
          <FadeInView>
            <EventFilters
              categories={eventCategories}
              onFiltersChange={handleFiltersChange}
              quickCategories={quickCategories}
            />
          </FadeInView>
        )}

        {/* Results Header */}
        {loading ? (
          <View style={styles.resultsHeader}>
            <View style={styles.resultsHeaderSkeleton}>
              <View style={styles.skeletonResultsTitle} />
              <View style={styles.skeletonResultsCount} />
            </View>
          </View>
        ) : (
          <FadeInView>
            <View style={styles.resultsHeader}>
              <H2 style={styles.resultsTitle}>All Events</H2>
            </View>
          </FadeInView>
        )}

        {/* Events List */}
        <View style={styles.eventsSection}>
          {loading ? (
            <View style={styles.eventsListSkeleton}>
              <View style={styles.eventsSkeletonHeader}>
                <View style={styles.eventsCountSkeleton} />
                <View style={styles.eventsSortSkeleton} />
              </View>
              <View style={styles.eventsList}>
                <FullPageEventSkeleton />
                <FullPageEventSkeleton />
                <FullPageEventSkeleton />
                <View style={styles.loadingMoreSkeleton}>
                  <View style={styles.loadingDotSkeleton} />
                  <View style={styles.loadingDotSkeleton} />
                  <View style={styles.loadingDotSkeleton} />
                </View>
              </View>
            </View>
          ) : displayEvents.length > 0 ? (
            <FadeInView>
              <View style={styles.eventsList}>
                {displayEvents.map((event, index) => (
                  <FadeInView key={event.id} delay={index * 50}>
                    <EventCard event={event} />
                  </FadeInView>
                ))}
              </View>
            </FadeInView>
          ) : (
            <FadeInView>
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={PremiumColors.text.muted} />
                <Text style={styles.emptyStateTitle}>No events found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Check back later for new events
                </Text>
              </View>
            </FadeInView>
          )}
        </View>

        {/* Bottom Spacing for floating nav */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PremiumColors.background.primary,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  resultsHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonResultsTitle: {
    height: 20,
    width: 120,
    borderRadius: 8,
    backgroundColor: PremiumColors.background.tertiary,
  },
  skeletonResultsCount: {
    height: 16,
    width: 60,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.6,
  },
  
  // Filter Skeleton Styles
  filtersSkeletonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  filtersSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitleSkeleton: {
    height: 18,
    width: 100,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
  },
  filterCountSkeleton: {
    height: 14,
    width: 40,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.6,
  },
  filtersSkeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterChipSkeleton: {
    height: 36,
    width: 80,
    borderRadius: 18,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.7,
  },
  filterChipSkeletonSmall: {
    height: 36,
    width: 60,
    borderRadius: 18,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.5,
  },
  eventsSection: {
    paddingHorizontal: 16,
  },
  eventsListSkeleton: {
    marginTop: 8,
  },
  eventsSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  eventsCountSkeleton: {
    height: 16,
    width: 100,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.6,
  },
  eventsSortSkeleton: {
    height: 16,
    width: 80,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.5,
  },
  eventsList: {
    gap: 20,
  },
  loadingMoreSkeleton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  loadingDotSkeleton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
  },
  
  // Enhanced Featured Section Skeleton Styles
  featuredSection: {
    marginBottom: 32,
    backgroundColor: PremiumColors.background.primary,
  },
  featuredHeaderContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    paddingTop: 8,
  },
  featuredHeaderSkeleton: {
    marginBottom: 12,
  },
  featuredTitleSkeleton: {
    height: 28,
    width: 220,
    borderRadius: 8,
    backgroundColor: PremiumColors.background.tertiary,
    marginBottom: 8,
  },
  featuredSubtitleSkeleton: {
    height: 16,
    width: 160,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.7,
  },
  featuredViewAllSkeleton: {
    height: 20,
    width: 80,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
    alignSelf: 'flex-end',
    opacity: 0.6,
  },
  featuredCarouselContainer: {
    marginBottom: 20,
  },
  featuredSkeletonScroll: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  paginationContainer: {
    paddingBottom: 8,
  },
  paginationSkeleton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDotSkeleton: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PremiumColors.background.tertiary,
    opacity: 0.4,
  },
  paginationDotActive: {
    width: 24,
    opacity: 0.8,
  },
  
  // Active Reservations Section Styles
  reservationsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: PremiumColors.background.primary,
    marginBottom: 8,
  },
  reservationsHeader: {
    marginBottom: 16,
  },
  reservationsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reservationsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  }
});