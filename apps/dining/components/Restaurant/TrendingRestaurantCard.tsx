import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { OptimizedImage } from '../ui/OptimizedImage';

interface TrendingRestaurantCardProps {
  item: any;
}

export const TrendingRestaurantCard: React.FC<TrendingRestaurantCardProps> = ({ item }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  const handlePress = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(`/restaurant/${item.id}`);
    setTimeout(() => setIsNavigating(false), 1000);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.modernTrendingCard}>
      {/* Restaurant Image - Optimized */}
      <View style={styles.modernImageContainer}>
        <OptimizedImage 
          source={{ 
            uri: (item as any).cover_image_url || 
                 (item as any).gallery_images?.[0] || 
                 item.image || 
                 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' 
          }} 
          style={styles.modernTrendingImage} 
          contentFit="cover"
          priority="normal"
          transition={300}
          cachePolicy="memory-disk"
        />
        
        {/* Offer Badge */}
        <View style={styles.modernOfferBadge}>
          <Text style={styles.modernOfferText}>Flat 20% Off</Text>
          <Text style={styles.modernOfferSubtext}>150 off with ONE + UP To 15% off With Bank Offers</Text>
        </View>
      </View>

      {/* Restaurant Info */}
      <View style={styles.modernCardContent}>
        <Text style={styles.modernRestaurantName} numberOfLines={1}>
          {item.name || 'Bella Buono'}
        </Text>
        <Text style={styles.modernLocation} numberOfLines={1}>
          {(item as any).address?.split(',')[0] || item.location || 'Vijay nagar'}
        </Text>
        <Text style={styles.modernCuisine} numberOfLines={1}>
          {(item as any).cuisine_type || item.cuisine || 'Multi-Cuisine Restaurants'}
        </Text>
        
        {/* Rating, Distance and Price */}
        <View style={styles.modernFooter}>
          <View style={styles.modernRatingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.modernRating}>{item.rating || '4.5'}</Text>
          </View>
          <Text style={styles.modernDistance}>7.5 Km</Text>
        </View>
        
        <Text style={styles.modernPrice}>₹{(item as any).average_cost_for_two || '1400'} for Two</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

