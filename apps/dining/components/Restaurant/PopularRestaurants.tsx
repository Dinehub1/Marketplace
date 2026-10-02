import { router } from 'expo-router';
import React from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { FadeInView } from '../FadeInView';
import { TrendingRestaurantSkeleton } from '../SkeletonLoader';
import { Button, EmptyState } from '../ui';
import { TrendingRestaurantCard } from './TrendingRestaurantCard';

interface PopularRestaurantsProps {
  data: any[];
  loading?: boolean;
  onSeeAllPress?: () => void;
}

export const PopularRestaurants: React.FC<PopularRestaurantsProps> = ({
  data,
  loading = false,
  onSeeAllPress
}) => {
  return (
    <View style={styles.section}>
      {loading ? (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonButton} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modernTrendingContainer}>
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
            <TrendingRestaurantSkeleton />
          </ScrollView>
        </>
      ) : (
        <FadeInView delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={styles.compactSectionTitle}>Popular Choices ⭐</Text>
            <Button variant="ghost" size="sm" onPress={onSeeAllPress || (() => router.push('/search'))}>
              See All
            </Button>
          </View>
          {data.length > 0 ? (
            <FlatList
              data={data}
              renderItem={({ item }) => <TrendingRestaurantCard item={item} />}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modernTrendingContainer}
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
                title="No Popular Restaurants"
                description="We're adding popular dining spots to your area"
                actionText="Explore Restaurants"
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
  skeletonButton: {
    height: 32,
    width: 80,
    borderRadius: 8,
    backgroundColor: PremiumColors.background.tertiary,
  },
});