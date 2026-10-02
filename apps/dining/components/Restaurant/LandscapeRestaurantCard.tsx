import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  addToFavorites,
  checkIsFavorite,
  removeFromFavorites
} from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { Restaurant } from '../../data/mockData';
import { haversineDistanceMeters } from '../../utils/haversine';

interface LandscapeRestaurantCardProps {
  restaurant: Restaurant;
}

export const LandscapeRestaurantCard: React.FC<LandscapeRestaurantCardProps> = ({ restaurant }) => {
  const { user } = useAuth();
  const { locationData } = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  useEffect(() => {
    checkFavoriteStatus();
  }, [restaurant.id, user]);

  const checkFavoriteStatus = async () => {
    if (!user) return;
    try {
      const { isFavorite: favoriteStatus } = await checkIsFavorite(user.id, restaurant.id, 'restaurant');
      setIsFavorite(favoriteStatus);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please login to add restaurants to your favorites',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/welcome') }
        ]
      );
      return;
    }

    if (isTogglingFavorite) return;
    
    setIsTogglingFavorite(true);
    
    try {
      if (isFavorite) {
        const { error } = await removeFromFavorites(user.id, restaurant.id, 'restaurant');
        if (!error) {
          setIsFavorite(false);
        }
      } else {
        const { error } = await addToFavorites(user.id, restaurant.id, 'restaurant');
        if (!error) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };
  
  const handleCardPress = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(`/restaurant/${restaurant.id}`);
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const getHighestOffer = () => {
    const offers = (restaurant as any).dinein_offers;
    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return null;
    }

    const activeOffers = offers.filter((offer: any) => offer.is_active);
    if (activeOffers.length === 0) {
      return null;
    }

    // Find the highest discount value
    const highestOffer = activeOffers.reduce((max: any, current: any) => {
      const currentValue = parseFloat(current.discount_value) || 0;
      const maxValue = parseFloat(max.discount_value) || 0;
      return currentValue > maxValue ? current : max;
    });

    return highestOffer;
  };

  const formatOfferText = (offer: any) => {
    if (!offer) return null;
    
    const value = Math.round(parseFloat(offer.discount_value) || 0);
    
    if (offer.discount_type === 'percentage') {
      return `Flat ${value}% Off`;
    } else if (offer.discount_type === 'flat') {
      return `Flat ₹${value} Off`;
    }
    
    return `${value}% Off`;
  };

  const calculateDistance = () => {
    if (!locationData?.latitude || !locationData?.longitude) {
      return null;
    }

    const restaurantLat = (restaurant as any).latitude;
    const restaurantLng = (restaurant as any).longitude;

    if (!restaurantLat || !restaurantLng) {
      return null;
    }

    const distanceInMeters = haversineDistanceMeters(
      locationData.latitude,
      locationData.longitude,
      parseFloat(restaurantLat),
      parseFloat(restaurantLng)
    );

    const distanceInKm = distanceInMeters / 1000;

    if (distanceInKm < 1) {
      return `${Math.round(distanceInMeters)} m`;
    } else {
      return `${distanceInKm.toFixed(1)} km`;
    }
  };

  const formatPrice = () => {
    const price = (restaurant as any).price_range || '1200';
    return `₹${price} for Two`;
  };

  return (
    <TouchableOpacity
      onPress={handleCardPress}
      style={styles.landscapeCard}
      activeOpacity={0.8}
    >
      <View style={styles.landscapeImageContainer}>
        <Image 
          source={{ 
            uri: (restaurant as any).cover_image_url || 
                 restaurant.image || 
                 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' 
          }} 
          style={styles.landscapeImage}
          resizeMode="cover"
        />
        
        {/* Discount Badge */}
        {(() => {
          const highestOffer = getHighestOffer();
          const offerText = formatOfferText(highestOffer);
          
          if (offerText) {
            return (
              <View style={styles.discountBadge}>
                <View style={styles.discountIconContainer}>
                  <Ionicons name="pricetag" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.discountText}>{offerText}</Text>
              </View>
            );
          }
          return null;
        })()}

        <TouchableOpacity 
          style={styles.landscapeFavoriteButton}
          onPress={handleToggleFavorite}
          disabled={isTogglingFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={isFavorite ? "#FF6B6B" : "#fff"} 
          />
        </TouchableOpacity>
      </View> 

      <View style={styles.landscapeContent}>
        {/* Title and Rating Row */}
        <View style={styles.titleRatingRow}>
          <Text style={styles.landscapeName} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.landscapeRating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.landscapeRatingText}>{restaurant.rating || '4.5'}</Text>
          </View>
        </View>

        {/* Location */}
        <Text style={styles.landscapeLocation} numberOfLines={1}>
          {(() => {
            const address = (restaurant as any).address;
            const city = (restaurant as any).city;
            
            if (address && city) {
              return `${address}, ${city}`;
            } else if (address) {
              return address;
            } else if (city) {
              return city;
            } else {
              return restaurant.location || 'Location';
            }
          })()}
        </Text>

        {/* Cuisine - Only show if exists */}
        {(() => {
          const cuisines = (restaurant as any).cuisines;
          if (cuisines && Array.isArray(cuisines) && cuisines.length > 0) {
            const cuisineText = cuisines.join(', ');
            return (
              <Text style={styles.landscapeCuisine} numberOfLines={1}>
                {cuisineText}
              </Text>
            );
          }
          return null;
        })()}
        
        {/* Footer with Distance and Price */}
        <View style={styles.landscapeFooter}>
          <Text style={styles.landscapeDistance}>
            {calculateDistance() || 'Distance N/A'}
          </Text>
          <Text style={styles.landscapePrice}>
            {formatPrice()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  discountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  discountIconContainer: {
    marginRight: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  landscapeContent: {
    padding: 16,
  },
  titleRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  landscapeName: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    flex: 1,
    marginRight: 12,
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
    marginTop: 8,
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
});

