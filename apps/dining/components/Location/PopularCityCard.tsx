import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { City, getPopularCities } from '../../utils/locationService';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with margins

interface PopularCityCardProps {
  onCitySelect: (city: City) => void;
  selectedCityId?: string;
}

export default function PopularCityCard({ onCitySelect, selectedCityId }: PopularCityCardProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPopularCities();
  }, []);

  const loadPopularCities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getPopularCities();
      
      if (fetchError) {
        setError('Failed to load popular cities');
        console.error('Error loading popular cities:', fetchError);
        return;
      }
      
      if (data) {
        setCities(data);
      }
    } catch (err) {
      setError('Failed to load popular cities');
      console.error('Error loading popular cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCityCard = ({ item }: { item: City }) => {
    const isSelected = selectedCityId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.cityCard,
          isSelected && styles.cityCardSelected
        ]}
        onPress={() => onCitySelect(item)}
        activeOpacity={0.8}
      >
        {/* City Image */}
        <View style={styles.imageContainer}>
          {item.cover_image_url ? (
            <Image
              source={{ uri: item.cover_image_url }}
              style={styles.cityImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="location"
                size={32}
                color={PremiumColors.text.muted}
              />
            </View>
          )}
          
          {/* Overlay gradient */}
          <View style={styles.imageOverlay} />
          
          {/* City name on top of image */}
          <View style={styles.cityNameContainer}>
            <Text style={styles.cityName} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          
          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={PremiumColors.accent.secondary}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={PremiumColors.accent.secondary} />
          <Text style={styles.loadingText}>Loading popular cities...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={PremiumColors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPopularCities}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Popular Cities</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={48} color={PremiumColors.text.muted} />
          <Text style={styles.emptyText}>No popular cities</Text>
          <Text style={styles.emptySubtext}>
            Popular cities will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Popular Cities</Text>
        <Text style={styles.sectionCount}>{cities.length} cities</Text>
      </View>
      
      <FlatList
        data={cities}
        renderItem={renderCityCard}
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
  cityCard: {
    width: cardWidth,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityCardSelected: {
    borderColor: PremiumColors.accent.secondary,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  cityImage: {
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
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cityNameContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
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
