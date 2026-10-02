import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import EventCard from '../../components/Events/EventCard';
import { HorizontalTabBar, TabItem } from '../../components/HorizontalTabBar';
import PlacesNearMe from '../../components/Location/PlacesNearMe';
import { LandscapeRestaurantCard } from '../../components/Restaurant/LandscapeRestaurantCard';
import { getActivities, getEvents, getRestaurants } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useLocation } from '../../contexts/LocationContext';
import { PlaceWithDistance } from '../../utils/locationService';

// Debounce function for search optimization
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface SearchResult {
  id: string;
  type: 'restaurant' | 'event' | 'activity';
  title: string;
  subtitle?: string;
  image: string;
  data: any; // Original data object
}

export default function SearchScreen() {
  const { availableTabs, contentSections, locationData } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const scrollY = new Animated.Value(0);

  // Initialize active tab based on available content
  useEffect(() => {
    if (availableTabs.length > 0) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs]);

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Debounced search function
  const debouncedFilter = useMemo(
    () =>
      debounce((query: string, tab: string) => {
        filterResults(query, tab);
        setShowResults(query.length > 0);
      }, 300),
    [allResults]
  );

  useEffect(() => {
    debouncedFilter(searchQuery, activeTab);
  }, [searchQuery, activeTab, debouncedFilter]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const results: SearchResult[] = [];

      // Load restaurants if available
      if (contentSections?.showDining) {
        const { data: restaurants, error: restaurantError } = await getRestaurants();
        if (!restaurantError && restaurants) {
          restaurants.forEach((restaurant: any) => {
            results.push({
              id: restaurant.id,
              type: 'restaurant',
              title: restaurant.name,
              subtitle: restaurant.cuisine_type || restaurant.description,
              image: restaurant.cover_image_url || restaurant.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
              data: restaurant,
            });
          });
        }
      }

      // Load events if available
      if (contentSections?.showEvents) {
        const { data: events, error: eventError } = await getEvents();
        if (!eventError && events) {
          console.log('🎪 Search: Loading events data:', events.length, 'events');
          console.log('🎪 Search: First event structure:', events[0]);
          events.forEach((event: any) => {
            // Calculate minimum price from ticket types (same logic as showtime.tsx)
            let minPrice = 0;
            let isFreeEvent = event.ticket_type === 'free';
            
            if (!isFreeEvent && event.event_ticket_types && event.event_ticket_types.length > 0) {
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

            // Get venue name and city from event_venue (same logic as showtime.tsx)
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

            results.push({
              id: event.id,
              type: 'event',
              title: event.title,
              subtitle: event.description,
              image: event.cover_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
              data: {
                id: event.id,
                title: event.title,
                subtitle: event.description,
                image: event.cover_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
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
                // Additional fields for filtering
                event_date: event.event_date,
                category_id: event.category_id,
                latitude: event.latitude,
                longitude: event.longitude,
                is_featured: event.is_featured
              },
            });
          });
        }
      }

      // Load activities if available
      if (contentSections?.showActivities) {
        const { data: activities, error: activityError } = await getActivities();
        if (!activityError && activities) {
          activities.forEach((activity: any) => {
            // Calculate minimum price from ticket types (same logic as showtime.tsx)
            let minPrice = 0;
            let isFreeEvent = activity.ticket_type === 'free';
            
            if (!isFreeEvent && activity.event_ticket_types && activity.event_ticket_types.length > 0) {
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

            // Get venue name and city from event_venue (same logic as showtime.tsx)
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

            results.push({
              id: activity.id,
              type: 'activity',
              title: activity.title,
              subtitle: activity.description,
              image: activity.cover_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
              data: {
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
                category: activity.event_categories?.name || 'Activity',
                duration: '3 hours',
                organizer: venueName,
                // Pricing information
                ticket_type: activity.ticket_type,
                min_price: minPrice,
                is_free: isFreeEvent,
                // Additional fields for filtering
                event_date: activity.event_date,
                category_id: activity.category_id,
                latitude: activity.latitude,
                longitude: activity.longitude,
                is_featured: activity.is_featured
              },
            });
          });
        }
      }

      setAllResults(results);
      setFilteredResults(results);
    } catch (error) {
      console.error('Error loading search data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResults = (query: string, tab: string) => {
    let filtered = allResults;

    // Filter by tab
    if (tab !== 'for-you') {
      const typeMap: { [key: string]: string } = {
        'dining': 'restaurant',
        'showtime': 'event',
        'activities': 'activity',
      };
      const targetType = typeMap[tab];
      if (targetType) {
        filtered = filtered.filter(result => result.type === targetType);
      }
    }

    // Filter by search query
    if (query && query.length > 0) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(result => {
        const titleMatch = result.title.toLowerCase().includes(lowerQuery);
        const subtitleMatch = result.subtitle?.toLowerCase().includes(lowerQuery);
        const venueMatch = result.data.venue?.toLowerCase().includes(lowerQuery);
        const categoryMatch = result.data.category?.toLowerCase().includes(lowerQuery);
        const addressMatch = result.data.address?.toLowerCase().includes(lowerQuery);
        const cityMatch = result.data.city?.toLowerCase().includes(lowerQuery);
        const cuisineMatch = result.data.cuisine_type?.toLowerCase().includes(lowerQuery);

        return titleMatch || subtitleMatch || venueMatch || categoryMatch || 
               addressMatch || cityMatch || cuisineMatch;
      });
    }

    setFilteredResults(filtered);
  };

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'restaurant':
        router.push(`/restaurant/${result.id}`);
        break;
      case 'event':
        router.push(`/events/${result.id}`);
        break;
      case 'activity':
        router.push(`/events/${result.id}`); // Activities use same booking flow as events
        break;
    }
  };

  const handlePlaceSelect = (place: PlaceWithDistance) => {
    // Set the place name as search query to show related results
    setSearchQuery(place.name);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case 'restaurant':
        return (
          <View style={styles.resultContainer}>
            <LandscapeRestaurantCard restaurant={item.data} />
          </View>
        );
      case 'event':
      case 'activity':
        return (
          <View style={styles.resultContainer}>
            <EventCard event={item.data} />
          </View>
        );
      default:
        return null;
    }
  };

  const getResultTypeText = (type: string) => {
    switch (type) {
      case 'restaurant': return 'Restaurant';
      case 'event': return 'Event';
      case 'activity': return 'Activity';
      default: return '';
    }
  };

  const getTabsForSearch = (): TabItem[] => {
    const searchTabs: TabItem[] = [
      { id: 'for-you', label: 'All', icon: 'sparkles' },
    ];

    // Add tabs based on available content
    availableTabs.forEach(tab => {
      if (tab.id !== 'for-you') {
        searchTabs.push({
          id: tab.id,
          label: tab.title,
          icon: tab.icon as any,
        });
      }
    });

    return searchTabs;
  };

  const getPlaceholderText = () => {
    switch (activeTab) {
      case 'dining':
        return 'Search restaurants, cuisine, location...';
      case 'showtime':
        return 'Search events, venues, artists...';
      case 'activities':
        return 'Search activities, venues, categories...';
      default:
        return 'Search restaurants, events, activities...';
    }
  };

  const getQuickSearches = () => {
    switch (activeTab) {
      case 'dining':
        return ['Pizza', 'Burger', 'Chinese', 'Italian', 'Fast Food', 'Fine Dining'];
      case 'showtime':
        return ['Live Music', 'Jazz Night', 'Comedy Show', 'Dance Party', 'Concert', 'Theater'];
      case 'activities':
        return ['Outdoor', 'Adventure', 'Workshop', 'Sports', 'Fitness', 'Art & Craft'];
      default:
        return ['Pizza', 'Live Music', 'Adventure', 'Comedy Show', 'Fine Dining', 'Concert'];
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={PremiumColors.background.primary}
          translucent={false}
        />
        
        {/* Header with Search Bar */}
        <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={PremiumColors.text.tertiary} />
             <TextInput
               style={styles.searchInput}
               placeholder={getPlaceholderText()}
               placeholderTextColor={PremiumColors.text.tertiary}
               value={searchQuery}
               onChangeText={setSearchQuery}
               autoFocus={true}
               onSubmitEditing={() => Keyboard.dismiss()}
               returnKeyType="search"
               keyboardAppearance="dark"
               selectionColor={PremiumColors.accent.secondary}
             />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color={PremiumColors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <HorizontalTabBar
          tabs={getTabsForSearch()}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

       <Animated.ScrollView
         style={styles.content}
         onScroll={Animated.event(
           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
           { useNativeDriver: false }
         )}
         scrollEventThrottle={16}
         keyboardShouldPersistTaps="handled"
         keyboardDismissMode="on-drag"
         showsVerticalScrollIndicator={false}
       >
        {showResults ? (
          // Search Results
          <View style={styles.resultsSection}>
            <Text style={styles.resultsCount}>
              {filteredResults.length} results found
            </Text>
            
            <FlatList
              data={filteredResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={5}
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color={PremiumColors.text.muted} />
                    <Text style={styles.emptyText}>No results found</Text>
                    <Text style={styles.emptySubtext}>
                      Try a different search term or browse categories below
                    </Text>
                  </View>
                )
              }
            />
          </View>
        ) : (
          // Default Content - Quick Searches
          <View style={styles.defaultContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Searches</Text>
              <View style={styles.quickSearchContainer}>
                {getQuickSearches().map((search, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.quickSearchItem}
                    onPress={() => setSearchQuery(search)}
                  >
                    <Text style={styles.quickSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Places Near Me */}
            {locationData?.city && (
              <View style={styles.section}>
                <PlacesNearMe
                  userLocation={locationData.latitude && locationData.longitude ? {
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                  } : null}
                  userCity={locationData.city}
                  onPlaceSelect={handlePlaceSelect}
                  selectedPlaceId={undefined}
                />
              </View>
            )}

            {/* Popular Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Categories</Text>
              <View style={styles.categoryContainer}>
                {activeTab === 'dining' && (
                  <>
                    {['North Indian', 'Italian', 'Chinese', 'Fast Food'].map((category, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.categoryItem}
                        onPress={() => setSearchQuery(category)}
                      >
                        <Text style={styles.categoryText}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {activeTab === 'showtime' && (
                  <>
                    {['Music', 'Comedy', 'Theater', 'Dance'].map((category, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.categoryItem}
                        onPress={() => setSearchQuery(category)}
                      >
                        <Text style={styles.categoryText}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {activeTab === 'activities' && (
                  <>
                    {['Adventure', 'Sports', 'Workshop', 'Fitness'].map((category, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.categoryItem}
                        onPress={() => setSearchQuery(category)}
                      >
                        <Text style={styles.categoryText}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {activeTab === 'for-you' && (
                  <>
                    {['Restaurants', 'Events', 'Activities', 'Live Music', 'Pizza', 'Adventure'].map((category, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={styles.categoryItem}
                        onPress={() => setSearchQuery(category)}
                      >
                        <Text style={styles.categoryText}>{category}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            </View>
          </View>
        )}
       </Animated.ScrollView>

       {loading && (
         <View style={styles.loadingOverlay}>
           <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
         </View>
       )}
     </KeyboardAvoidingView>
   </TouchableWithoutFeedback>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  header: {
    backgroundColor: PremiumColors.background.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PremiumColors.text.primary,
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  resultsSection: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  resultContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  defaultContent: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  quickSearchContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSearchItem: {
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  quickSearchText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    backgroundColor: PremiumColors.background.tertiary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    minWidth: '45%',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(19, 19, 21, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
