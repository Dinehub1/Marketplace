import { router } from 'expo-router';
import React from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { FadeInView } from '../FadeInView';
import { TrendingRestaurantSkeleton } from '../SkeletonLoader';
import { EmptyState } from '../ui';
import { TrendingRestaurantCard } from './TrendingRestaurantCard';

interface TrendingRestaurantsProps {
  data: any[];
  loading?: boolean;
  onSeeAllPress?: () => void;
}

export const TrendingRestaurants: React.FC<TrendingRestaurantsProps> = ({
  data,
  loading = false,
  onSeeAllPress
}) => {
  return (
    <View style={styles.trendingSection}>
      {loading ? (
        <>
          <View style={styles.trendingSectionHeader}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonSeeAll} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modernTrendingContainer}>
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
          </ScrollView>
        </>
      ) : (
        <FadeInView>
          <View style={styles.trendingSectionHeader}>
            <Text style={styles.compactSectionTitle}>Trending Restaurants 🔥</Text>
            <TouchableOpacity onPress={onSeeAllPress}>
              <Text style={styles.trendingSeeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {data.length > 0 ? (
            <FlatList
              data={data}
              renderItem={({ item }) => <TrendingRestaurantCard item={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modernTrendingContainer}
              snapToInterval={320}
              decelerationRate="fast"
              snapToAlignment="start"
              // ✅ Performance Optimizations
              removeClippedSubviews={true}
              maxToRenderPerBatch={3}
              windowSize={5}
              initialNumToRender={2}
              updateCellsBatchingPeriod={50}
              getItemLayout={(data, index) => ({
                length: 320,
                offset: 320 * index,
                index,
              })}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <EmptyState
                variant="restaurants"
                title="No Trending Restaurants"
                description="We're working on adding amazing restaurants to your area"
                actionText="View All Restaurants"
                onAction={() => router.push('/search')}
              />
            </View>
          )}
        </FadeInView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  trendingSection: {
    paddingBottom: 20,
  },
  trendingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  compactSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
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
});