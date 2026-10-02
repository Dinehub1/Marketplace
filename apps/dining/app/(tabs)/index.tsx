import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ExpertCard from '../../components/ExpertCard';
import { FadeInView } from '../../components/FadeInView';
import { AllRestaurants } from '../../components/Restaurant/AllRestaurants';
import { PopularRestaurants } from '../../components/Restaurant/PopularRestaurants';
import { TrendingRestaurants } from '../../components/Restaurant/TrendingRestaurants';
import { OptimizedImage } from '../../components/ui/OptimizedImage';
import {
    BannerSkeleton,
    ExpertCardSkeleton
} from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/ui';
import {
    getAllRestaurants,
    getExperts,
    getPopularRestaurants,
    getTrendingRestaurants,
    getUpcomingEvents
} from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import {
    mockOffers
} from '../../data/mockData';

const { width, height } = Dimensions.get('window');

interface DiningScreenProps {
  scrollY?: Animated.Value;
}

export default function DiningScreen({ scrollY }: DiningScreenProps) {
  const { user } = useAuth();
  const { contentSections, contentAvailability, contentLoading, locationData } = useLocation();
  const [isLoading, setIsLoading] = useState(true); // Initial loading for all sections
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  
  // All Restaurants pagination state
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]);
  const [allRestaurantsLoading, setAllRestaurantsLoading] = useState(true);
  const [allRestaurantsPage, setAllRestaurantsPage] = useState(0);
  const [hasMoreRestaurants, setHasMoreRestaurants] = useState(true);
  const [loadingMoreRestaurants, setLoadingMoreRestaurants] = useState(false);

  // No redirect logic needed - coming soon is now a tab

  // Auto-scroll offers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOfferIndex((prevIndex) => 
        prevIndex === mockOffers.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Load data from database
  useEffect(() => {
    loadData();
  }, [locationData?.city]); // Reload when city changes

  const loadData = async () => {
    try {
      const currentCity = locationData?.city;
      console.log('🏙️ Loading dining data for city:', currentCity);
      
      // Simulate initial loading delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);

      // Load restaurants data
      setRestaurantsLoading(true);
      const [trendingResult, popularResult] = await Promise.all([
        getTrendingRestaurants(6, currentCity),
        getPopularRestaurants(6, currentCity)
      ]);

      if (trendingResult.data && Array.isArray(trendingResult.data)) {
        setTrending(trendingResult.data);
      } else {
        setTrending([]);
      }
      
      if (popularResult.data && Array.isArray(popularResult.data)) {
        setPopular(popularResult.data);
      } else {
        setPopular([]);
      }
      setRestaurantsLoading(false);

      // Load all restaurants (first page)
      setAllRestaurantsLoading(true);
      const allRestaurantsResult = await getAllRestaurants(0, 20, currentCity);
      if (allRestaurantsResult.data && Array.isArray(allRestaurantsResult.data)) {
        setAllRestaurants(allRestaurantsResult.data);
        setHasMoreRestaurants(allRestaurantsResult.hasMore || false);
      } else {
        setAllRestaurants([]);
        setHasMoreRestaurants(false);
      }
      setAllRestaurantsLoading(false);

      // Load events data
      setEventsLoading(true);
      const eventsResult = await getUpcomingEvents(5, currentCity);
      if (eventsResult.data && Array.isArray(eventsResult.data)) {
        setEvents(eventsResult.data);
      } else {
        setEvents([]);
      }
      setEventsLoading(false);

      // Load experts data
      setExpertsLoading(true);
      const expertsResult = await getExperts(6);
      if (expertsResult.data && Array.isArray(expertsResult.data)) {
        setExperts(expertsResult.data);
      } else {
        setExperts([]);
      }
      setExpertsLoading(false);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
      setRestaurantsLoading(false);
      setAllRestaurantsLoading(false);
      setEventsLoading(false);
      setExpertsLoading(false);
    }
  };

  // Load more restaurants for pagination
  const loadMoreRestaurants = async () => {
    if (loadingMoreRestaurants || !hasMoreRestaurants) {
      return;
    }

    try {
      const currentCity = locationData?.city;
      setLoadingMoreRestaurants(true);
      const nextPage = allRestaurantsPage + 1;
      const result = await getAllRestaurants(nextPage, 20, currentCity);
      
      if (result.data && Array.isArray(result.data)) {
        setAllRestaurants(prev => [...prev, ...result.data]);
        setAllRestaurantsPage(nextPage);
        setHasMoreRestaurants(result.hasMore || false);
      }
    } catch (error) {
      console.error('Error loading more restaurants:', error);
    } finally {
      setLoadingMoreRestaurants(false);
    }
  };


  // Clean Special Offers Banner Component
  const SpecialOffersBanner = () => {
    const banners = [1, 2, 3, 4]; // Just numbers for multiple banners

    return (
      <View style={styles.specialOffersContainer}>
        <FlatList
          data={banners}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={width - 32}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style={styles.bannerCard}>
              <OptimizedImage 
                source={require('../../assets/Other-images/Banner.png')} 
                style={styles.bannerImage}
                contentFit="cover"
                priority="high"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>
          )}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.bannerScrollContainer}
          // ✅ Performance Optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={4}
          windowSize={3}
          initialNumToRender={2}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: width - 32,
            offset: (width - 32) * index,
            index,
          })}
        />
      </View>
    );
  };

  // Card components moved to components/restaurant/ folder

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollY ? Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        ) : undefined}
        scrollEventThrottle={16}
      >
        {/* Premium Offers Section */}
        {/* Special Offers Section with Banner */}
        {(isLoading || contentLoading) ? (
          <View style={styles.specialOffersContainer}>
            <View style={styles.skeletonTitleWrapper}>
              <View style={styles.skeletonTitle} />
            </View>
            <View style={styles.bannerScrollContainer}>
              <BannerSkeleton />
            </View>
          </View>
        ) : (
          <FadeInView>
            <SpecialOffersBanner />
          </FadeInView>
        )}

        {/* Trending Restaurants */}
        <TrendingRestaurants 
                  data={trending}
          loading={restaurantsLoading}
          onSeeAllPress={() => {}}
        />

        {/* Food Experts Section */}
        <View style={styles.section}>
          {expertsLoading ? (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.skeletonSectionTitle} />
                <View style={styles.skeletonSeeAll} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <ExpertCardSkeleton />
                <ExpertCardSkeleton />
                <ExpertCardSkeleton />
              </ScrollView>
            </>
          ) : (
            <FadeInView>
              <View style={styles.sectionHeader}>
                <Text style={styles.compactSectionTitle}>Food Experts 👨‍🍳</Text>
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {experts.length > 0 ? (
                  experts.map((expert) => (
                    <ExpertCard
                      key={expert.id}
                      expert={expert}
                      onPress={() => router.push(`/expert/${expert.id}`)}
                    />
                  ))
                ) : (
                  <View style={styles.emptyExpertsContainer}>
                    <EmptyState
                      variant="events"
                      title="No Experts Available"
                      description="Check back soon for expert recommendations"
                      actionText="Explore Restaurants"
                      onAction={() => router.push('/search')}
                    />
                  </View>
                )}
              </ScrollView>
            </FadeInView>
          )}
        </View>

        {/* Popular Restaurants */}
         <PopularRestaurants 
          data={popular}
          loading={restaurantsLoading}
          onSeeAllPress={() => router.push('/search')}
        />

        {/* All Restaurants List */}
        <AllRestaurants 
          data={allRestaurants}
          loading={allRestaurantsLoading}
          onSeeAllPress={() => router.push('/search')}
          onLoadMore={loadMoreRestaurants}
          hasMore={hasMoreRestaurants}
          loadingMore={loadingMoreRestaurants}
        />

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  scrollContent: {
    paddingTop: 0,
  },

  // Skeleton Text Placeholders
  skeletonTitleWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  skeletonTitle: {
    height: 16,
    width: 120,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
  },
  skeletonSectionTitle: {
    height: 18,
    width: 180,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
  },
  skeletonSeeAll: {
    height: 14,
    width: 60,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
  },
  skeletonButton: {
    height: 32,
    width: 80,
    borderRadius: 8,
    backgroundColor: PremiumColors.background.tertiary,
  },

  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyEventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 32,
    minWidth: width - 32,
  },
  expertCardSkeleton: {
    width: 160,
    marginRight: 16,
  },
  emptyExpertsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 32,
    minWidth: width - 32,
  },
  gridSkeletonCard: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  

  // Special Offers Banner Styles
  specialOffersContainer: {
    paddingVertical: 20,
  },
  specialOffersTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: PremiumColors.text.primary,
    marginLeft: 16,
    marginBottom: 16,
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
  bannerScrollContainer: {
    paddingLeft: 16,
  },
  bannerCard: {
    width: width - 32,
    height: 180,
    marginRight: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },

  // Modern Trending Restaurants Styles
  trendingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  trendingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  trendingSeeAll: {
    fontSize: 14,
    color: PremiumColors.accent.primary,
    fontWeight: '500',
  },
  modernTrendingContainer: {
    paddingLeft: 16,
  },
  modernTrendingCard: {
    width: 300,
    height: 420,
    marginRight: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modernImageContainer: {
    position: 'relative',
    height: 260,
  },
  modernTrendingImage: {
    width: '100%',
    height: '100%',
  },
  modernOfferBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 12,
  },
  modernOfferText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modernOfferSubtext: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.9,
  },
  modernCardContent: {
    padding: 16,
    paddingBottom: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  modernRestaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  modernLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
    marginBottom: 4,
  },
  modernCuisine: {
    fontSize: 13,
    fontWeight: '400',
    color: PremiumColors.text.tertiary,
    marginBottom: 12,
  },
  modernFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernRating: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginLeft: 4,
  },
  modernDistance: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
  },
  modernPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },

  // Compact Section Title
  compactSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },

  // Trending Section with Bottom Padding
  trendingSection: {
    paddingBottom: 20,
  },

  // Compact Category Styles
  compactCategoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  compactCategoryCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactCategoryEmoji: {
    fontSize: 20,
  },
  compactCategoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumColors.text.primary,
    textAlign: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  filterButton: {
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Premium Offers Styles
  offersSection: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24, // px-6 for better spacing
    marginBottom: 20, // mb-5
  },
  sectionTitle: {
    // Styles handled by H2 component
  },
  seeAllText: {
    fontSize: 14,
    color: PremiumColors.accent.primary,
    fontWeight: '600',
  },
  offersContainer: {
    position: 'relative',
  },
  offersScrollContainer: {
    paddingLeft: 24,
    paddingRight: 24,
  },
  offerCard: {
    width: width - 48,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 0,
  },
  offerImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16/9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  offerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  offerBadgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  discountBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  offerContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  offerTextContainer: {
    marginBottom: 16,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  offerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
    width: 24,
  },

  // Premium Categories Styles
  categoriesSection: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  categoryCard: {
    alignItems: 'center',
    width: 85,
  },
  categoryCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },

  // Restaurant Card Styles
  section: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  restaurantsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  restaurantCard: {
    width: Math.min(280, width * 0.75),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  restaurantImageContainer: {
    position: 'relative',
    height: 160,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    aspectRatio: 16/10,
  },
  restaurantImageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  favoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 6,
  },
  offerBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deliveryTimeContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 2,
  },
  cuisine: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  restaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceRange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  distance: {
    fontSize: 12,
    color: '#666666',
  },
  closedText: {
    fontSize: 10,
    color: '#FF4444',
    fontWeight: '600',
  },
  offerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  offerText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
    flex: 1,
  },

  // Event Card Styles
  horizontalScroll: {
    paddingLeft: 20,
    paddingBottom: 8,
  },
  eventCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 150, // Adjusted for better 4:5 ratio for card size
    resizeMode: 'cover',
  },
  eventVideo: {
    width: '100%',
    height: 150, // Adjusted for better 4:5 ratio for card size  
    backgroundColor: '#000',
  },
  eventImageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  eventShareButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 6,
  },
  eventBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  eventInfo: {
    padding: 12,
    paddingBottom: 16,
  },
  eventVenueText: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumColors.text.tertiary,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDateTimeContainer: {
    gap: 2,
  },
  eventDate: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 12,
    color: PremiumColors.text.tertiary,
  },

  // Landscape Card Styles
  restaurantsList: {
    paddingHorizontal: 16,
  },
  landscapeCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  landscapeImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  landscapeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  landscapeFavoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  landscapeContent: {
    padding: 16,
  },
  landscapeName: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  landscapeLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
    marginBottom: 4,
  },
  landscapeCuisine: {
    fontSize: 13,
    fontWeight: '400',
    color: PremiumColors.text.tertiary,
    marginBottom: 12,
  },
  landscapeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  landscapeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  landscapeRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginLeft: 4,
  },
  landscapeDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
  },
  landscapePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },

  // Modern Grid Styles
  modernRestaurantsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  modernGridCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  modernGridImageContainer: {
    position: 'relative',
    height: 160,
  },
  modernGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modernGridOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  modernFavoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modernDeliveryBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernDeliveryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  modernGridContent: {
    padding: 16,
  },
  modernGridName: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  modernGridCuisine: {
    fontSize: 13,
    fontWeight: '400',
    color: PremiumColors.text.secondary,
    marginBottom: 12,
  },
  modernGridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernGridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modernGridRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginLeft: 4,
  },
  modernGridDistance: {
    fontSize: 12,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
  },
  modernGridSkeletonCard: {
    width: '48%',
    height: 240,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },

  // Old Grid Styles (for backward compatibility)
  restaurantsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: width < 400 ? '100%' : '48%',
    marginBottom: 20,
  },
  gridRestaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  gridRestaurantImageContainer: {
    position: 'relative',
    height: 140,
  },
  gridRestaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    aspectRatio: 4/3,
  },
  gridImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  gridFavoriteButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 6,
    padding: 4,
  },
  gridOfferBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridOfferBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gridDeliveryTime: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridDeliveryTimeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 2,
  },
  gridRestaurantInfo: {
    padding: 12,
    paddingBottom: 16,
  },
  gridRestaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  gridCuisine: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
  },
  gridRestaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  gridRating: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 2,
  },
  gridDistance: {
    fontSize: 10,
    color: '#666666',
  },
  gridOfferInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  gridOfferText: {
    fontSize: 9,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 3,
    flex: 1,
  },
});