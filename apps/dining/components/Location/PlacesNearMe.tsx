import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { LocationPoint } from '../../utils/haversine';
import { PlaceWithDistance, getPopularPlacesForCity } from '../../utils/locationService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with margins

interface PlacesNearMeProps {
  userLocation: LocationPoint | null;
  userCity: string | null;
  onPlaceSelect: (place: PlaceWithDistance) => void;
  selectedPlaceId?: string;
}

export default function PlacesNearMe({ userLocation, userCity, onPlaceSelect, selectedPlaceId }: PlacesNearMeProps) {
  const [places, setPlaces] = useState<PlaceWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userCity) {
      console.log('🔍 PlacesNearMe: userCity:', userCity, 'userLocation:', userLocation);
      loadCityPlaces();
    }
  }, [userCity, userLocation]);

  const loadCityPlaces = async () => {
    if (!userCity) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getPopularPlacesForCity(
        userCity,
        userLocation ? userLocation : undefined, // Pass user location for distance calculation if available
        8   // limit to 8 places
      );
      
      if (fetchError) {
        setError('Failed to load places');
        console.error('Error loading places:', fetchError);
        return;
      }
      
      if (data) {
        setPlaces(data);
      }
    } catch (err) {
      setError('Failed to load places');
      console.error('Error loading places:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: PlaceWithDistance) => {
    // Show coming soon alert
    Alert.alert(
      'Coming Soon',
      `${place.name} - This feature is coming soon!`,
      [{ text: 'OK', style: 'default' }]
    );
    
    // Still call the callback for any additional handling
    onPlaceSelect(place);
  };

  const renderPlaceCard = ({ item }: { item: PlaceWithDistance }) => {
    const isSelected = selectedPlaceId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.placeCard,
          isSelected && styles.placeCardSelected
        ]}
        onPress={() => handlePlaceSelect(item)}
        activeOpacity={0.8}
      >
        {/* Place Image */}
        <View style={styles.imageContainer}>
          {item.cover_image_url ? (
            <Image
              source={{ uri: item.cover_image_url }}
              style={styles.placeImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="location"
                size={24}
                color={PremiumColors.text.muted}
              />
            </View>
          )}
        </View>
        
        {/* Place Info */}
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.distanceContainer}>
            <Ionicons
              name="location"
              size={12}
              color={PremiumColors.text.tertiary}
            />
            <Text style={styles.distanceText}>
              {item.distance_text}
            </Text>
          </View>
          {item.description && (
            <Text style={styles.placeDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        
        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={PremiumColors.accent.secondary}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Don't show anything if no user city
  if (!userCity) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Places Near You</Text>
        </View>
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="small" color={PremiumColors.accent.secondary} />
           <Text style={styles.loadingText}>Loading places in {userCity}...</Text>
         </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Places Near You</Text>
        </View>
         <View style={styles.errorContainer}>
           <Ionicons name="alert-circle" size={24} color={PremiumColors.error} />
           <Text style={styles.errorText}>{error}</Text>
           <TouchableOpacity style={styles.retryButton} onPress={loadCityPlaces}>
             <Text style={styles.retryText}>Retry</Text>
           </TouchableOpacity>
         </View>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Places Near You</Text>
        </View>
         <View style={styles.emptyContainer}>
           <Ionicons name="location-outline" size={48} color={PremiumColors.text.muted} />
           <Text style={styles.emptyText}>No places in {userCity}</Text>
           <Text style={styles.emptySubtext}>
             Places will appear here once they are added for this city
           </Text>
         </View>
      </View>
    );
  }

     return (
       <View style={styles.container}>
         <View style={styles.header}>
           <Text style={styles.sectionTitle}>Places in {userCity}</Text>
           <Text style={styles.sectionCount}>{places.length} places</Text>
         </View>
      
      <FlatList
        data={places}
        renderItem={renderPlaceCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll since this will be inside a parent ScrollView
        columnWrapperStyle={styles.row}
        // ✅ Performance Optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={6}
        windowSize={7}
        initialNumToRender={6}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  sectionCount: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  grid: {
    paddingHorizontal: 16,
  },
  gridContent: {
    paddingBottom: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  placeCard: {
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12, 
  
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  placeCardSelected: {
    borderColor: PremiumColors.accent.secondary,
    borderWidth: 2,
  },
  imageContainer: {
    height: 100,
    position: 'relative',
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    color: PremiumColors.text.tertiary,
    marginLeft: 4,
    fontWeight: '500',
  },
  placeDescription: {
    fontSize: 11,
    color: PremiumColors.text.secondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginLeft: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: PremiumColors.error,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  retryText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
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
  },
});
