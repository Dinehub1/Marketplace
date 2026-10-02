import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { City, getAllCities } from '../../utils/locationService';

interface AllCityListProps {
  onCitySelect: (city: City) => void;
  selectedCityId?: string;
}

export default function AllCityList({ onCitySelect, selectedCityId }: AllCityListProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getAllCities();
      
      if (fetchError) {
        setError('Failed to load cities');
        console.error('Error loading cities:', fetchError);
        return;
      }
      
      if (data) {
        setCities(data);
      }
    } catch (err) {
      setError('Failed to load cities');
      console.error('Error loading cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCityItem = ({ item }: { item: City }) => {
    const isSelected = selectedCityId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.cityItem,
          isSelected && styles.cityItemSelected
        ]}
        onPress={() => onCitySelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cityIcon}>
          <Ionicons
            name="location"
            size={20}
            color={isSelected ? PremiumColors.accent.secondary : PremiumColors.text.secondary}
          />
        </View>
        
        <View style={styles.cityInfo}>
          <Text style={[
            styles.cityName,
            isSelected && styles.cityNameSelected
          ]}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.cityDescription}>
              {item.description}
            </Text>
          )}
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isSelected ? PremiumColors.accent.secondary : PremiumColors.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={PremiumColors.accent.secondary} />
        <Text style={styles.loadingText}>Loading cities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={24} color={PremiumColors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCities}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cities.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="location-outline" size={48} color={PremiumColors.text.muted} />
        <Text style={styles.emptyText}>No cities available</Text>
        <Text style={styles.emptySubtext}>
          Cities will appear here once they are added
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>All Cities</Text>
        <Text style={styles.sectionCount}>{cities.length} cities</Text>
      </View>
      
      <FlatList
        data={cities}
        renderItem={renderCityItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Disable scroll since this will be inside a parent ScrollView
        // ✅ Performance Optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={11}
        initialNumToRender={10}
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
  list: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.divider,
  },
  cityItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderBottomColor: PremiumColors.accent.secondary,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '500',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  cityNameSelected: {
    color: PremiumColors.accent.secondary,
  },
  cityDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
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
