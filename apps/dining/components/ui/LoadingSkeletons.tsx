import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <View style={styles.restaurantCard}>
      <Skeleton width="100%" height={180} borderRadius={12} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Skeleton width="70%" height={20} style={styles.restaurantName} />
        <Skeleton width="50%" height={16} style={styles.restaurantCuisine} />
        <View style={styles.restaurantMeta}>
          <Skeleton width={60} height={16} />
          <Skeleton width={40} height={16} />
        </View>
        <Skeleton width="80%" height={14} style={styles.deliveryInfo} />
      </View>
    </View>
  );
}

export function EventCardSkeleton() {
  return (
    <View style={styles.eventCard}>
      <Skeleton width="100%" height={160} borderRadius={12} style={styles.eventImage} />
      <View style={styles.eventInfo}>
        <Skeleton width="60%" height={16} style={styles.eventVenue} />
        <Skeleton width="90%" height={20} style={styles.eventTitle} />
        <View style={styles.eventDateTime}>
          <Skeleton width={80} height={14} />
          <Skeleton width={100} height={14} />
        </View>
      </View>
    </View>
  );
}

export function RestaurantListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <RestaurantCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function EventListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function HorizontalRestaurantSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.horizontalContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.horizontalCard}>
          <Skeleton width={280} height={180} borderRadius={12} />
          <View style={styles.horizontalInfo}>
            <Skeleton width="80%" height={18} style={{ marginBottom: 6 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
            <View style={styles.horizontalMeta}>
              <Skeleton width={50} height={14} />
              <Skeleton width={70} height={14} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  restaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  restaurantImage: {
    marginBottom: 0,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    marginBottom: 8,
  },
  restaurantCuisine: {
    marginBottom: 8,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  deliveryInfo: {
    marginBottom: 0,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginRight: 16,
    width: 280,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  eventImage: {
    marginBottom: 0,
  },
  eventInfo: {
    padding: 16,
  },
  eventVenue: {
    marginBottom: 8,
  },
  eventTitle: {
    marginBottom: 12,
  },
  eventDateTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  horizontalContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  horizontalCard: {
    marginRight: 16,
    width: 280,
  },
  horizontalInfo: {
    marginTop: 12,
  },
  horizontalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});