import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { PremiumColors } from '../constants/Colors';

const { width } = Dimensions.get('window');

// Optimized: Simplified shimmer animation for 60 FPS
// Removed dual animations (pulse + slide), keeping only one smooth animation
const ShimmerEffect = ({ style }: { style?: any }) => {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    // Optimized: Single slide animation for better performance
    Animated.loop(
      Animated.timing(translateX, {
        toValue: width * 2,
        duration: 1800, // Slightly faster
        useNativeDriver: true, // ✅ Native driver for smooth 60 FPS
      })
    ).start();
  }, [translateX]);

  return (
    <View style={[styles.shimmerContainer, style]}>
      <View style={styles.shimmerBase} />
      <Animated.View 
        style={[
          styles.shimmerGradient,
          {
            transform: [{ translateX }],
          },
        ]} 
      />
    </View>
  );
};

// Trending Restaurant Card Skeleton
export const TrendingRestaurantSkeleton = () => {
  return (
    <View style={styles.trendingCard}>
      {/* Image Skeleton */}
      <View style={styles.trendingImageSkeleton}>
        <ShimmerEffect style={styles.trendingImageShimmer} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.trendingContentSkeleton}>
        <View style={styles.titleSkeletonWrapper}>
          <ShimmerEffect style={styles.titleSkeleton} />
        </View>
        <View style={styles.locationSkeletonWrapper}>
          <ShimmerEffect style={styles.locationSkeleton} />
        </View>
        <View style={styles.cuisineSkeletonWrapper}>
          <ShimmerEffect style={styles.cuisineSkeleton} />
        </View>
        
        <View style={styles.footerSkeleton}>
          <View style={styles.ratingSkeletonWrapper}>
            <ShimmerEffect style={styles.ratingSkeleton} />
          </View>
          <View style={styles.distanceSkeletonWrapper}>
            <ShimmerEffect style={styles.distanceSkeleton} />
          </View>
        </View>
        
        <View style={styles.priceSkeletonWrapper}>
          <ShimmerEffect style={styles.priceSkeleton} />
        </View>
      </View>
    </View>
  );
};

// Grid Restaurant Card Skeleton
export const GridRestaurantSkeleton = () => {
  return (
    <View style={styles.gridCard}>
      {/* Image Skeleton */}
      <View style={styles.gridImageSkeleton}>
        <ShimmerEffect style={styles.gridImageShimmer} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.gridContentSkeleton}>
        <View style={styles.gridTitleSkeletonWrapper}>
          <ShimmerEffect style={styles.gridTitleSkeleton} />
        </View>
        <View style={styles.gridCuisineSkeletonWrapper}>
          <ShimmerEffect style={styles.gridCuisineSkeleton} />
        </View>
        
        <View style={styles.gridFooterSkeleton}>
          <View style={styles.gridRatingSkeletonWrapper}>
            <ShimmerEffect style={styles.gridRatingSkeleton} />
          </View>
          <View style={styles.gridDistanceSkeletonWrapper}>
            <ShimmerEffect style={styles.gridDistanceSkeleton} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Event Card Skeleton
export const EventCardSkeleton = () => {
  return (
    <View style={styles.eventCard}>
      {/* Image Skeleton */}
      <View style={styles.eventImageSkeleton}>
        <ShimmerEffect style={styles.eventImageShimmer} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.eventContentSkeleton}>
        <View style={styles.eventVenueSkeletonWrapper}>
          <ShimmerEffect style={styles.eventVenueSkeleton} />
        </View>
        <View style={styles.eventTitleSkeletonWrapper}>
          <ShimmerEffect style={styles.eventTitleSkeleton} />
        </View>
        <View style={styles.eventDateSkeleton}>
          <View style={styles.eventDateShimmerWrapper}>
            <ShimmerEffect style={styles.eventDateShimmer} />
          </View>
          <View style={styles.eventTimeShimmerWrapper}>
            <ShimmerEffect style={styles.eventTimeShimmer} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Expert Card Skeleton
export const ExpertCardSkeleton = () => {
  return (
    <View style={styles.expertCard}>
      {/* Avatar Skeleton */}
      <View style={styles.expertAvatarSkeleton}>
        <ShimmerEffect style={styles.expertAvatarShimmer} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.expertNameSkeletonWrapper}>
        <ShimmerEffect style={styles.expertNameSkeleton} />
      </View>
      <View style={styles.expertRoleSkeletonWrapper}>
        <ShimmerEffect style={styles.expertRoleSkeleton} />
      </View>
    </View>
  );
};

// Banner/Offer Skeleton
export const BannerSkeleton = () => {
  return (
    <View style={styles.bannerCard}>
      <ShimmerEffect style={styles.bannerShimmer} />
    </View>
  );
};

// Category Skeleton
export const CategorySkeleton = () => {
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryCircle}>
        <ShimmerEffect style={styles.categoryCircleShimmer} />
      </View>
      <View style={styles.categoryNameSkeletonWrapper}>
        <ShimmerEffect style={styles.categoryNameSkeleton} />
      </View>
    </View>
  );
};

// Featured Event Carousel Skeleton
export const FeaturedEventSkeleton = () => {
  return (
    <View style={styles.featuredEventCard}>
      {/* Image Skeleton */}
      <View style={styles.featuredEventImageSkeleton}>
        <ShimmerEffect style={styles.featuredEventImageShimmer} />
        {/* Overlay gradient for better visual */}
        <View style={styles.featuredImageOverlay} />
        {/* Category badge skeleton */}
        <View style={styles.featuredCategoryBadge}>
          <ShimmerEffect style={styles.featuredCategoryBadgeShimmer} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.featuredEventContentSkeleton}>
        {/* Venue Skeleton */}
        <View style={styles.featuredVenueSkeletonWrapper}>
          <ShimmerEffect style={styles.featuredVenueSkeleton} />
        </View>
        
        {/* Title Skeleton */}
        <View style={styles.featuredTitleSkeletonWrapper}>
          <ShimmerEffect style={styles.featuredTitleSkeleton} />
        </View>
        <View style={styles.featuredTitleLine2Wrapper}>
          <ShimmerEffect style={styles.featuredTitleLine2Skeleton} />
        </View>
        
        {/* Date/Time Skeleton */}
        <View style={styles.featuredDateTimeWrapper}>
          <View style={styles.featuredDateTimeIcon}>
            <ShimmerEffect style={styles.featuredIconSkeleton} />
          </View>
          <ShimmerEffect style={styles.featuredDateSkeleton} />
          <ShimmerEffect style={styles.featuredTimeSkeleton} />
        </View>
        
        {/* Price skeleton */}
        <View style={styles.featuredPriceWrapper}>
          <ShimmerEffect style={styles.featuredPriceSkeleton} />
        </View>
      </View>
    </View>
  );
};

// Full Page Event/Activity Card Skeleton
export const FullPageEventSkeleton = () => {
  return (
    <View style={styles.fullPageEventCard}>
      {/* Image Skeleton */}
      <View style={styles.fullPageEventImageSkeleton}>
        <ShimmerEffect style={styles.fullPageEventImageShimmer} />
        {/* Image overlay gradient */}
        <View style={styles.fullPageImageOverlay} />
        {/* Category Badge Skeleton */}
        <View style={styles.fullPageCategoryBadgeSkeleton}>
          <ShimmerEffect style={styles.fullPageCategoryBadgeShimmer} />
        </View>
        {/* Favorite icon skeleton */}
        <View style={styles.fullPageFavoriteIcon}>
          <ShimmerEffect style={styles.fullPageFavoriteIconShimmer} />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.fullPageEventContentSkeleton}>
        {/* Header row with venue and date */}
        <View style={styles.fullPageHeaderRow}>
          <View style={styles.fullPageVenueSkeletonWrapper}>
            <ShimmerEffect style={styles.fullPageVenueSkeleton} />
          </View>
          <View style={styles.fullPageDateTimeWrapper}>
            <ShimmerEffect style={styles.fullPageDateSkeleton} />
            <ShimmerEffect style={styles.fullPageTimeSkeleton} />
          </View>
        </View>
        
        {/* Title Skeleton */}
        <View style={styles.fullPageTitleSkeletonWrapper}>
          <ShimmerEffect style={styles.fullPageTitleSkeleton} />
        </View>
        <View style={styles.fullPageTitleLine2Wrapper}>
          <ShimmerEffect style={styles.fullPageTitleLine2Skeleton} />
        </View>
        
        {/* Subtitle/Description Skeleton */}
        <View style={styles.fullPageSubtitleSkeletonWrapper}>
          <ShimmerEffect style={styles.fullPageSubtitleSkeleton} />
        </View>
        <View style={styles.fullPageSubtitleLine2Wrapper}>
          <ShimmerEffect style={styles.fullPageSubtitleLine2Skeleton} />
        </View>
        
        {/* Meta Footer Skeleton */}
        <View style={styles.fullPageMetaFooter}>
          <View style={styles.fullPageLocationRow}>
            <View style={styles.fullPageLocationIcon}>
              <ShimmerEffect style={styles.fullPageLocationIconShimmer} />
            </View>
            <View style={styles.fullPageLocationSkeletonWrapper}>
              <ShimmerEffect style={styles.fullPageLocationSkeleton} />
            </View>
          </View>
          <View style={styles.fullPagePriceWrapper}>
            <ShimmerEffect style={styles.fullPagePriceSkeleton} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.tertiary,
  },
  shimmerBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PremiumColors.background.tertiary,
  },
  shimmerGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Slightly more visible
    width: 120, // Wider shimmer effect
  },

  // Wrapper styles for spacing
  titleSkeletonWrapper: {
    marginBottom: 8,
  },
  locationSkeletonWrapper: {
    marginBottom: 6,
  },
  cuisineSkeletonWrapper: {
    marginBottom: 12,
  },
  ratingSkeletonWrapper: {
    flex: 1,
  },
  distanceSkeletonWrapper: {
    flex: 1,
  },
  priceSkeletonWrapper: {
    marginTop: 8,
  },

  // Trending Restaurant Skeleton
  trendingCard: {
    width: 300,
    height: 420,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    overflow: 'hidden',
  },
  trendingImageSkeleton: {
    height: 260,
    position: 'relative',
    overflow: 'hidden',
  },
  trendingImageShimmer: {
    width: '100%',
    height: '100%',
  },
  trendingContentSkeleton: {
    padding: 16,
  },
  titleSkeleton: {
    height: 20,
    borderRadius: 6,
    width: '80%',
  },
  locationSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '60%',
  },
  cuisineSkeleton: {
    height: 14,
    borderRadius: 6,
    width: '50%',
  },
  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  ratingSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '100%',
  },
  distanceSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '100%',
  },
  priceSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '50%',
  },

  // Grid Restaurant Skeleton
  gridCard: {
    width: '48%',
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gridImageSkeleton: {
    height: 160,
    overflow: 'hidden',
  },
  gridImageShimmer: {
    width: '100%',
    height: '100%',
  },
  gridContentSkeleton: {
    padding: 12,
  },
  gridTitleSkeletonWrapper: {
    marginBottom: 6,
  },
  gridTitleSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '85%',
  },
  gridCuisineSkeletonWrapper: {
    marginBottom: 12,
  },
  gridCuisineSkeleton: {
    height: 14,
    borderRadius: 6,
    width: '65%',
  },
  gridFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gridRatingSkeletonWrapper: {
    flex: 1,
  },
  gridRatingSkeleton: {
    height: 14,
    borderRadius: 6,
    width: '100%',
  },
  gridDistanceSkeletonWrapper: {
    flex: 1,
  },
  gridDistanceSkeleton: {
    height: 14,
    borderRadius: 6,
    width: '100%',
  },

  // Event Card Skeleton
  eventCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImageSkeleton: {
    height: 150,
    overflow: 'hidden',
  },
  eventImageShimmer: {
    width: '100%',
    height: '100%',
  },
  eventContentSkeleton: {
    padding: 12,
  },
  eventVenueSkeletonWrapper: {
    marginBottom: 6,
  },
  eventVenueSkeleton: {
    height: 12,
    borderRadius: 6,
    width: '70%',
  },
  eventTitleSkeletonWrapper: {
    marginBottom: 8,
  },
  eventTitleSkeleton: {
    height: 18,
    borderRadius: 6,
    width: '90%',
  },
  eventDateSkeleton: {
    gap: 4,
  },
  eventDateShimmerWrapper: {
    marginBottom: 4,
  },
  eventDateShimmer: {
    height: 12,
    borderRadius: 6,
    width: '60%',
  },
  eventTimeShimmerWrapper: {
  },
  eventTimeShimmer: {
    height: 12,
    borderRadius: 6,
    width: '50%',
  },

  // Expert Card Skeleton
  expertCard: {
    width: 160,
    alignItems: 'center',
    padding: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 12,
    marginRight: 12,
  },
  expertAvatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    overflow: 'hidden',
  },
  expertAvatarShimmer: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  expertNameSkeletonWrapper: {
    marginBottom: 6,
    width: '80%',
  },
  expertNameSkeleton: {
    height: 16,
    borderRadius: 6,
    width: '100%',
  },
  expertRoleSkeletonWrapper: {
    width: '60%',
  },
  expertRoleSkeleton: {
    height: 14,
    borderRadius: 6,
    width: '100%',
  },

  // Banner Skeleton
  bannerCard: {
    width: width - 32,
    height: 180,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  bannerShimmer: {
    width: '100%',
    height: '100%',
  },

  // Category Skeleton
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 6,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    overflow: 'hidden',
  },
  categoryCircleShimmer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  categoryNameSkeletonWrapper: {
    width: 60,
  },
  categoryNameSkeleton: {
    height: 12,
    borderRadius: 6,
    width: '100%',
  },

  // Featured Event Carousel Skeleton
  featuredEventCard: {
    width: width * 0.72,
    marginHorizontal: 8,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredEventImageSkeleton: {
    width: '100%',
    aspectRatio: 3 / 4, // 3:4 ratio like the actual cards
    overflow: 'hidden',
    position: 'relative',
  },
  featuredEventImageShimmer: {
    width: '100%',
    height: '100%',
  },
  featuredImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  featuredCategoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 80,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredCategoryBadgeShimmer: {
    width: '100%',
    height: '100%',
  },
  featuredEventContentSkeleton: {
    padding: 12,
    paddingBottom: 16,
    flex: 1,
  },
  featuredVenueSkeletonWrapper: {
    marginBottom: 6,
  },
  featuredVenueSkeleton: {
    height: 14,
    width: '60%',
    borderRadius: 6,
  },
  featuredTitleSkeletonWrapper: {
    marginBottom: 4,
  },
  featuredTitleSkeleton: {
    height: 20,
    width: '95%',
    borderRadius: 6,
  },
  featuredTitleLine2Wrapper: {
    marginBottom: 8,
  },
  featuredTitleLine2Skeleton: {
    height: 20,
    width: '75%',
    borderRadius: 6,
  },
  featuredDateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featuredDateTimeIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  featuredIconSkeleton: {
    width: '100%',
    height: '100%',
  },
  featuredDateSkeleton: {
    height: 12,
    width: 60,
    borderRadius: 6,
  },
  featuredTimeSkeleton: {
    height: 12,
    width: 70,
    borderRadius: 6,
  },
  featuredPriceWrapper: {
    alignSelf: 'flex-start',
  },
  featuredPriceSkeleton: {
    height: 16,
    width: 80,
    borderRadius: 8,
  },

  // Full Page Event/Activity Card Skeleton
  fullPageEventCard: {
    width: '100%',
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullPageEventImageSkeleton: {
    width: '100%',
    height: width * 1.25, // 4:5 aspect ratio for full cards
    position: 'relative',
    overflow: 'hidden',
  },
  fullPageEventImageShimmer: {
    width: '100%',
    height: '100%',
  },
  fullPageImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fullPageCategoryBadgeSkeleton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 100,
    height: 28,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullPageCategoryBadgeShimmer: {
    width: '100%',
    height: '100%',
  },
  fullPageFavoriteIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullPageFavoriteIconShimmer: {
    width: '100%',
    height: '100%',
  },
  fullPageEventContentSkeleton: {
    padding: 16,
  },
  fullPageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fullPageVenueSkeletonWrapper: {
    flex: 1,
    marginRight: 16,
  },
  fullPageVenueSkeleton: {
    height: 14,
    width: '80%',
    borderRadius: 6,
  },
  fullPageDateTimeWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  fullPageDateSkeleton: {
    height: 12,
    width: 70,
    borderRadius: 6,
  },
  fullPageTimeSkeleton: {
    height: 12,
    width: 60,
    borderRadius: 6,
  },
  fullPageTitleSkeletonWrapper: {
    marginBottom: 4,
  },
  fullPageTitleSkeleton: {
    height: 24,
    width: '95%',
    borderRadius: 8,
  },
  fullPageTitleLine2Wrapper: {
    marginBottom: 8,
  },
  fullPageTitleLine2Skeleton: {
    height: 24,
    width: '75%',
    borderRadius: 8,
  },
  fullPageSubtitleSkeletonWrapper: {
    marginBottom: 4,
  },
  fullPageSubtitleSkeleton: {
    height: 16,
    width: '90%',
    borderRadius: 6,
  },
  fullPageSubtitleLine2Wrapper: {
    marginBottom: 16,
  },
  fullPageSubtitleLine2Skeleton: {
    height: 16,
    width: '60%',
    borderRadius: 6,
  },
  fullPageMetaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullPageLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  fullPageLocationIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fullPageLocationIconShimmer: {
    width: '100%',
    height: '100%',
  },
  fullPageLocationSkeletonWrapper: {
    flex: 1,
  },
  fullPageLocationSkeleton: {
    height: 12,
    width: '70%',
    borderRadius: 6,
  },
  fullPagePriceWrapper: {
    alignItems: 'flex-end',
  },
  fullPagePriceSkeleton: {
    height: 18,
    width: 80,
    borderRadius: 8,
  },
});
