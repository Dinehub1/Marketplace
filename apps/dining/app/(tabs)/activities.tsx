import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { EventVideoPlayer } from '../../components/EventVideoPlayer';
import { EventFilters, applyEventFilters } from '../../components/Events';
import type { EventCategory } from '../../components/Events/EventFilterModal';
import type { EventFiltersState } from '../../components/Events/EventFilters';
import { FadeInView } from '../../components/FadeInView';
import { FullPageEventSkeleton } from '../../components/SkeletonLoader';
import { Card, H2, H3 } from '../../components/ui';
import { getActivities, getEventCategories } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useLocation } from '../../contexts/LocationContext';
const { width } = Dimensions.get('window');

interface ActivitiesScreenProps {
  scrollY?: Animated.Value;
}

export default function ActivitiesScreen({ scrollY }: ActivitiesScreenProps) {
  const { locationData } = useLocation();
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [displayActivities, setDisplayActivities] = useState<any[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Quick categories for filter bar (most popular ones)
  const quickCategories = eventCategories.slice(0, 3).map(cat => ({
    id: cat.id,
    name: cat.name
  }));

  useEffect(() => {
    loadActivities();
    loadEventCategories();
  }, [locationData?.city]); // Reload when city changes

  const loadEventCategories = async () => {
    try {
      const currentCity = locationData?.city;
      console.log('🏷️ Loading event categories for activities in city:', currentCity);
      
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

  const loadActivities = async () => {
    try {
      const currentCity = locationData?.city;
      console.log('🏃 Loading activities for city:', currentCity);
      
      setLoading(true);
      
      // Simulate minimum loading time for smooth skeleton display
      const [dataResult] = await Promise.all([
        getActivities({ city: currentCity }),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      const { data, error } = dataResult;
      
      if (error) {
        console.error('Error loading activities:', error);
        setLoading(false);
        return;
      }

      const mappedActivities = (data || []).map((activity: any) => {
        // Use price_display_string from database, with fallback to ticket type calculation
        let minPrice = 0;
        let isFreeEvent = activity.ticket_type === 'free';
        
        // Only calculate from ticket types if price_display_string is not available
        if (!activity.price_display_string && !isFreeEvent && activity.event_ticket_types && activity.event_ticket_types.length > 0) {
          const activeTickets = activity.event_ticket_types.filter((ticket: any) => ticket.is_active);
          
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
        
        if (activity.event_venue?.[0]) {
          const eventVenue = activity.event_venue[0];
          if (eventVenue.restaurant_id && eventVenue.restaurants) {
            // If restaurant is linked - get city from restaurant data
            venueName = eventVenue.restaurants.name;
            venueCity = eventVenue.restaurants.city || activity.city || '';
          } else if (eventVenue.venue_data) {
            // If custom venue data exists
            try {
              const venueData = typeof eventVenue.venue_data === 'string' 
                ? JSON.parse(eventVenue.venue_data) 
                : eventVenue.venue_data;
              venueName = venueData.name || '';
              venueCity = activity.city || '';
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
          id: activity.id,
          title: activity.title,
          subtitle: activity.description,
          image: activity.cover_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
          video: activity.cover_video_url,
          date: activity.event_date,
          time: activity.start_time,
          venue: venueDisplay,
          price: activity.ticket_price || 0,
          description: activity.description,
          category: activity.event_categories?.name || 'Other',
          duration: '3 hours',
          organizer: venueName,
          // Pricing information
          ticket_type: activity.ticket_type,
          min_price: minPrice,
          is_free: isFreeEvent,
          price_display_string: activity.price_display_string, // Pass price_display_string from database
          // Additional fields for filtering
          event_date: activity.event_date,
          category_id: activity.category_id,
          latitude: activity.latitude,
          longitude: activity.longitude,
          is_featured: activity.is_featured
        };
      });

      setAllActivities(mappedActivities);
      setDisplayActivities(mappedActivities); // Initialize displayActivities with all activities
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Handle filter changes from EventFilters component
  const handleFiltersChange = (filters: EventFiltersState) => {
    console.log('🔍 Applying filters to activities:', filters);
    
    const userLocation = locationData ? {
      latitude: locationData.latitude,
      longitude: locationData.longitude
    } : undefined;

    const filtered = applyEventFilters(allActivities, filters, userLocation);
    setDisplayActivities(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatPrice = (activity: any) => {
    // Use price_display_string from database if available
    if (activity.price_display_string !== undefined && activity.price_display_string !== null) {
      const priceValue = parseFloat(activity.price_display_string);
      if (priceValue === 0 || activity.price_display_string === '0') {
        return 'Free';
      }
      return `₹${activity.price_display_string} Onwards`;
    }
    
    // Fallback to old logic if price_display_string is not available
    if (activity.is_free || activity.ticket_type === 'free') {
      return 'Free';
    }
    
    if (activity.min_price && activity.min_price > 0) {
      return `₹${activity.min_price} Onwards`;
    }
    
    return 'Free'; // Default to Free if no price found for paid event
  };

  const ActivityCard = ({ activity }: { activity: any }) => (
    <Card 
      variant="elevated"
      padding="none"
      style={styles.activityCard}
      onPress={() => router.push(`/events/${activity.id}`)}
    >
      <View style={styles.activityImageContainer}>
        {activity.video ? (
          <EventVideoPlayer 
            videoUrl={activity.video}
            coverImageUrl={activity.image}
            aspectRatio="4:5"
            style={styles.activityVideo}
          />
        ) : (
          <Image source={{ uri: activity.image }} style={styles.activityImage} />
        )}
        {/* Category Badge on Image */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryChipText}>{activity.category}</Text>
        </View>
      </View>

      <View style={styles.activityContent}>
        {/* Date and Time - Highlighted */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
          <Text style={styles.dateSeparator}> • </Text>
          <Text style={styles.activityTime}>{formatTime(activity.time)}</Text>
        </View>

        <H3 style={styles.activityTitle}>{activity.title}</H3>

        {/* Venue with City */}
        {activity.venue && (
          <Text style={styles.venueText}>{activity.venue}</Text>
        )}

        {/* Ticket Price */}
        <Text style={styles.priceText}>{formatPrice(activity)}</Text>

        {/* Description - 2 lines max */}
        {activity.description && (
          <Text style={styles.activityDescription} numberOfLines={2}>
            {activity.description}
          </Text>
        )}
      </View>
    </Card>
  );

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
        {/* Activity Filters */}
        {!categoriesLoading && (
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
            <View style={styles.skeletonResultsTitle} />
          </View>
        ) : (
          <FadeInView>
            <View style={styles.resultsHeader}>
              <H2 style={styles.resultsTitle}>All Activities</H2>
            </View>
          </FadeInView>
        )}

        {/* Activities List */}
        <View style={styles.activitiesSection}>
          {loading ? (
            <View style={styles.activitiesList}>
              <FullPageEventSkeleton />
              <FullPageEventSkeleton />
              <FullPageEventSkeleton />
            </View>
          ) : displayActivities.length > 0 ? (
            <FadeInView>
              <View style={styles.activitiesList}>
                {displayActivities.map((activity, index) => (
                  <FadeInView key={activity.id} delay={index * 50}>
                    <ActivityCard activity={activity} />
                  </FadeInView>
                ))}
              </View>
            </FadeInView>
          ) : (
            <FadeInView>
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={64} color={PremiumColors.text.muted} />
                <Text style={styles.emptyStateTitle}>No activities found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Check back later for new activities
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
  skeletonResultsTitle: {
    height: 16,
    width: 180,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
  },
  activitiesSection: {
    paddingHorizontal: 16,
  },
  activitiesList: {
    gap: 20,
  },
  activityCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  activityImageContainer: {
    position: 'relative',
  },
  activityImage: {
    width: '100%',
    height: (width - 32) * 1.25,
    backgroundColor: PremiumColors.background.tertiary,
  },
  activityVideo: {
    width: '100%',
    height: (width - 32) * 1.25,
    backgroundColor: '#000',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 10,
    lineHeight: 24,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityDate: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  dateSeparator: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  venueText: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: PremiumColors.accent.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activityDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
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
});
