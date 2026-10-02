import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { Restaurant } from '../../data/mockData';
import { FadeInView } from '../FadeInView';
import { TrendingRestaurantSkeleton } from '../SkeletonLoader';
import { Button, EmptyState } from '../ui';
import { LandscapeRestaurantCard } from './LandscapeRestaurantCard';

interface AllRestaurantsProps {
  data: Restaurant[];
  loading?: boolean;
  onSeeAllPress?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export const AllRestaurants: React.FC<AllRestaurantsProps> = ({
  data,
  loading = false,
  onSeeAllPress,
  onLoadMore,
  hasMore = false,
  loadingMore = false
}) => {
  return (
    <View style={styles.section}>
      {loading ? (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonButton} />
          </View>
          <View style={styles.restaurantsList}>
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
          </View>
        </>
      ) : (
        <FadeInView delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.compactSectionTitle}>All Restaurants</Text>
            <Button variant="ghost" size="sm" onPress={onSeeAllPress || (() => router.push('/search'))}>
              View All
            </Button>
          </View>
          <View style={styles.restaurantsList}>
            {data.length > 0 ? (
              <>
                {data.map((restaurant) => (
                  <LandscapeRestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
                
                {/* Load More Button */}
                {hasMore && onLoadMore && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton}
                    onPress={onLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <ActivityIndicator size="small" color={PremiumColors.accent.primary} />
                    ) : (
                      <Text style={styles.loadMoreText}>Load More Restaurants</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <EmptyState
                variant="restaurants"
                title="No Restaurants Available"
                description="We're working on adding restaurants to your area"
                actionText="Browse Categories"
                onAction={() => router.push('/search')}
              />
            )}
          </View>
        </FadeInView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  compactSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  restaurantsList: {
    paddingHorizontal: 16,
  },
  skeletonSectionTitle: {
    height: 18,
    width: 180,
    borderRadius: 6,
    backgroundColor: PremiumColors.background.tertiary,
  },
  skeletonButton: {
    height: 32,
    width: 80,
    borderRadius: 8,
    backgroundColor: PremiumColors.background.tertiary,
  },
  loadMoreButton: {
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.accent.primary,
  },
});