import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { PremiumColors } from '../constants/Colors';

const { width } = Dimensions.get('window');

const ShimmerEffect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.shimmerContainer}>
      {children}
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

export const RestaurantDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Image Skeleton */}
      <ShimmerEffect>
        <View style={styles.headerImageSkeleton} />
      </ShimmerEffect>

      {/* Restaurant Info Skeleton */}
      <View style={styles.infoSection}>
        {/* Name and Rating */}
        <View style={styles.nameRow}>
          <ShimmerEffect>
            <View style={styles.nameSkeleton} />
          </ShimmerEffect>
          <ShimmerEffect>
            <View style={styles.ratingSkeleton} />
          </ShimmerEffect>
        </View>

        {/* Address */}
        <ShimmerEffect>
          <View style={styles.addressSkeleton} />
        </ShimmerEffect>

        {/* Meta Info */}
        <View style={styles.metaRow}>
          <ShimmerEffect>
            <View style={styles.metaSkeleton} />
          </ShimmerEffect>
        </View>

        {/* Timing */}
        <ShimmerEffect>
          <View style={styles.timingSkeleton} />
        </ShimmerEffect>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <ShimmerEffect>
            <View style={styles.actionButtonSkeleton} />
          </ShimmerEffect>
          <ShimmerEffect>
            <View style={styles.actionButtonSkeleton} />
          </ShimmerEffect>
          <ShimmerEffect>
            <View style={styles.actionButtonSkeleton} />
          </ShimmerEffect>
        </View>
      </View>

      {/* Tab Navigation Skeleton */}
      <View style={styles.tabSection}>
        <View style={styles.tabsRow}>
          {[1, 2, 3, 4].map((i) => (
            <ShimmerEffect key={i}>
              <View style={styles.tabSkeleton} />
            </ShimmerEffect>
          ))}
        </View>
      </View>

      {/* Section Skeleton */}
      <View style={styles.contentSection}>
        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <ShimmerEffect>
            <View style={styles.sectionTitleSkeleton} />
          </ShimmerEffect>
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {[1, 2].map((i) => (
            <ShimmerEffect key={i}>
              <View style={styles.cardSkeleton} />
            </ShimmerEffect>
          ))}
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <ShimmerEffect>
            <View style={styles.sectionTitleSkeleton} />
          </ShimmerEffect>
        </View>

        {/* Info Cards Grid (About Section) */}
        <View style={styles.infoGrid}>
          {[1, 2, 3, 4].map((i) => (
            <ShimmerEffect key={i}>
              <View style={styles.infoCardSkeleton} />
            </ShimmerEffect>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  shimmerContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  
  // Header Image
  headerImageSkeleton: {
    width: width,
    height: 300,
    backgroundColor: PremiumColors.background.secondary,
  },
  
  // Info Section
  infoSection: {
    padding: 20,
    backgroundColor: PremiumColors.background.primary,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameSkeleton: {
    width: width * 0.6,
    height: 28,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 8,
  },
  ratingSkeleton: {
    width: 60,
    height: 32,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 8,
  },
  addressSkeleton: {
    width: width * 0.8,
    height: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 6,
    marginBottom: 12,
  },
  metaRow: {
    marginBottom: 12,
  },
  metaSkeleton: {
    width: width * 0.5,
    height: 14,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 6,
  },
  timingSkeleton: {
    width: width * 0.6,
    height: 14,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 6,
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSkeleton: {
    flex: 1,
    height: 48,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 8,
  },
  
  // Tab Navigation
  tabSection: {
    backgroundColor: PremiumColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  tabSkeleton: {
    width: 80,
    height: 20,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 6,
  },
  
  // Content Section
  contentSection: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleSkeleton: {
    width: 140,
    height: 24,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 8,
  },
  cardsGrid: {
    marginBottom: 24,
    gap: 12,
  },
  cardSkeleton: {
    width: '100%',
    height: 120,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
  },
  
  // Info Cards (About Section)
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoCardSkeleton: {
    width: (width - 56) / 2,
    height: 140,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
  },
});

