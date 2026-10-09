import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import AllCityList from '../../components/Location/AllCityList';
import AreaSelectionModal from '../../components/Location/AreaSelectionModal';
import PlacesNearMe from '../../components/Location/PlacesNearMe';
import PopularCityCard from '../../components/Location/PopularCityCard';
import {
    getUserLocation,
    updateLocationPreference,
    updateUserLocation,
} from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import {
  generateSessionToken,
  getCurrentLocation,
  getPlaceDetails,
  isRestaurantPlace,
  PlacePrediction,
  searchPlaces,
} from '../../utils/googlePlaces';

import {
  City,
  CityArea,
  cityHasAreas,
  cityHasPlaces,
  getCityById,
  PlaceWithDistance,
} from '../../utils/locationService';
// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function LocationSearchScreen() {
  const { user } = useAuth();
  const { refreshLocation, setCurrentLocation: setGlobalLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [sessionToken] = useState(generateSessionToken());
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [savedLocation, setSavedLocation] = useState<{
    city: string | null;
    area: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null>(null);

  // New state for location components
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [selectedCityForAreas, setSelectedCityForAreas] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showPlaces, setShowPlaces] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Load saved location when screen opens
  useEffect(() => {
    loadSavedLocation();
  }, [user]);

  // Check if current city has places
  useEffect(() => {
    checkCityPlaces();
  }, [savedLocation?.city]);

  const checkCityPlaces = async () => {
    if (!savedLocation?.city) {
      setShowPlaces(false);
      return;
    }

    try {
      const hasPlaces = await cityHasPlaces(savedLocation.city);
      setShowPlaces(hasPlaces);
    } catch (error) {
      console.error('Error checking city places:', error);
      setShowPlaces(false);
    }
  };

  const loadSavedLocation = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getUserLocation(user.id);
      
      if (!error && data && data.latitude && data.longitude) {
        setSavedLocation({
          city: data.city,
          area: data.area,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
        });
        console.log('✅ Loaded saved location:', data);
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  // Search places when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleSearch(debouncedQuery);
    } else {
      setPredictions([]);
    }
  }, [debouncedQuery]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const { predictions: results, error } = await searchPlaces(
        query,
        sessionToken
      );

      if (error) {
        console.error('Search error:', error);
      } else {
        setPredictions(results);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    Keyboard.dismiss();
    setLoading(true);

    try {
      // Get place details
      const { place, error } = await getPlaceDetails(
        prediction.place_id,
        sessionToken
      );

      if (error || !place) {
        Alert.alert('Error', 'Failed to get location details');
        setLoading(false);
        return;
      }

      // Extract location data with detailed components
      const { city, area, state } = extractLocationDetails(place.address_components);
      
      const locationData = {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        city,
        area,
        state,
        fullAddress: place.formatted_address,
        name: place.name,
      };

      console.log('📍 Extracted location:', locationData);

      // Save to database if user is logged in
      if (user) {
        console.log('💾 Saving location to database...');
        await updateUserLocation(user.id, locationData);
        await updateLocationPreference(user.id, 'manual');
        
        // Update global location context with filtered full address
        const mainLocation = area || city || 'Selected Location';
        // Filter full address to remove postal code and country
        const filteredAddress = filterAddressForDisplay(locationData.fullAddress || '');
        setGlobalLocation(mainLocation, filteredAddress);
        await refreshLocation();
      }

      // Show success
      setSelectedLocation(prediction.description);
      
      // Navigate back with location data
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Failed to select location');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoadingCurrent(true);

    try {
      const { location, error } = await getCurrentLocation();

      if (error || !location) {
        Alert.alert(
          'Location Error',
          'Failed to get your current location. Please check your location permissions.'
        );
        setLoadingCurrent(false);
        return;
      }

      // Save to database if user is logged in
      if (user) {
        console.log('💾 Saving GPS location to database...');
        await updateUserLocation(user.id, {
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city || '',
          area: location.area || '',
          state: location.state || '',
          fullAddress: location.address || '',
        });
        await updateLocationPreference(user.id, 'gps');
        
        // Update global location context with filtered full address
        const mainLocation = location.area || location.city || 'Current Location';
        const filteredAddress = filterAddressForDisplay(location.address || '');
        setGlobalLocation(mainLocation, filteredAddress);
        await refreshLocation();
      }

      // Show success
      const displayLocation = location.city
        ? `${location.city}, ${location.state || ''}`
        : location.address || 'Current Location';
      
      setSelectedLocation(displayLocation);

      // Navigate back
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoadingCurrent(false);
    }
  };

  const extractLocationDetails = (addressComponents: any[]) => {
    let city = '';
    let area = '';
    let state = '';
    
    for (const component of addressComponents) {
      const types = component.types;
      
      // Extract city/locality
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
      }
      
      // Extract area/sublocality (neighborhood)
      if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        area = component.long_name;
      } else if (types.includes('neighborhood') && !area) {
        area = component.long_name;
      } else if (types.includes('route') && !area) {
        // If no area found, use route/street name as area
        area = component.long_name;
      }
      
      // Extract state
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
    }
    
    return { city, area, state };
  };

  // Helper function to filter full address for display
  // Removes postal code (6 digits) and "India" from the address
  const filterAddressForDisplay = (fullAddress: string): string => {
    if (!fullAddress) return '';
    
    let filtered = fullAddress;
    
    // Remove postal code (6 digits with optional space before)
    filtered = filtered.replace(/\s*\d{6}\s*/g, ' ');
    
    // Remove ", India" or " India" at the end
    filtered = filtered.replace(/,?\s*India\s*$/i, '');
    
    // Clean up multiple commas and extra spaces
    filtered = filtered.replace(/\s*,\s*,\s*/g, ', ');
    filtered = filtered.replace(/\s+/g, ' ');
    filtered = filtered.trim();
    
    // Remove trailing comma if any
    filtered = filtered.replace(/,\s*$/, '');
    
    return filtered;
  };

  // Handler for city selection
  const handleCitySelect = async (city: City) => {
    setSelectedCityId(city.id);
    setSelectedPlaceId(null);
    
    try {
      // Check if city has areas
      const hasAreas = await cityHasAreas(city.id);
      
      if (hasAreas) {
        // Show area selection modal
        setSelectedCityForAreas({ id: city.id, name: city.name });
        setShowAreaModal(true);
      } else {
        // Update user coordinates directly to city location
        await updateLocationFromCity(city);
      }
    } catch (error) {
      console.error('Error checking city areas:', error);
      // Fallback to updating city location directly
      await updateLocationFromCity(city);
    }
  };

  // Handler for area selection
  const handleAreaSelect = async (area: CityArea) => {
    setShowAreaModal(false);
    setSelectedCityForAreas(null);
    
    await updateLocationFromArea(area);
  };

  // Handler for place selection
  const handlePlaceSelect = (place: PlaceWithDistance) => {
    setSelectedPlaceId(place.id);
    // The component already shows "Coming Soon" alert
  };

  // Update location from city
  const updateLocationFromCity = async (city: City) => {
    if (!user || !city.latitude || !city.longitude) return;

    try {
      const locationData = {
        latitude: Number(city.latitude),
        longitude: Number(city.longitude),
        city: city.name,
        area: null,
        state: null,
        fullAddress: city.description || city.name,
        name: city.name,
      };

      console.log('💾 Saving city location to database...');
      await updateUserLocation(user.id, locationData);
      await updateLocationPreference(user.id, 'manual');
      
      // Update global location context
      setGlobalLocation(city.name, city.description || '');
      await refreshLocation();

      // Show success
      setSelectedLocation(city.name);
      
      // Navigate back
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error updating city location:', error);
      Alert.alert('Error', 'Failed to update location');
    }
  };

  // Update location from area
  const updateLocationFromArea = async (area: CityArea) => {
    if (!user || !area.latitude || !area.longitude) return;

    try {
      // Get city details
      const { data: cityData } = await getCityById(area.city_id);
      
      const locationData = {
        latitude: Number(area.latitude),
        longitude: Number(area.longitude),
        city: cityData?.name || '',
        area: area.name,
        state: null,
        fullAddress: `${area.name}, ${cityData?.name || ''}`,
        name: area.name,
      };

      console.log('💾 Saving area location to database...');
      await updateUserLocation(user.id, locationData);
      await updateLocationPreference(user.id, 'manual');
      
      // Update global location context
      setGlobalLocation(area.name, cityData?.name || '');
      await refreshLocation();

      // Show success
      setSelectedLocation(`${area.name}, ${cityData?.name || ''}`);
      
      // Navigate back
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error updating area location:', error);
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const renderPrediction = ({ item }: { item: PlacePrediction }) => {
    const isRestaurant = isRestaurantPlace(item.types);

    return (
      <TouchableOpacity
        style={styles.predictionItem}
        onPress={() => handleSelectPlace(item)}
        activeOpacity={0.7}
      >
        <View style={styles.predictionIcon}>
          <Ionicons
            name={isRestaurant ? 'restaurant' : 'location'}
            size={20}
            color={isRestaurant ? PremiumColors.accent.secondary : PremiumColors.text.secondary}
          />
        </View>
        <View style={styles.predictionText}>
          <Text style={styles.predictionMain} numberOfLines={1}>
            {item.structured_formatting.main_text}
          </Text>
          <Text style={styles.predictionSecondary} numberOfLines={1}>
            {item.structured_formatting.secondary_text}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={PremiumColors.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search Box */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={PremiumColors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, area, locality..."
            placeholderTextColor={PremiumColors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {(loading || searchQuery.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setPredictions([]);
              }}
              style={styles.clearButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={PremiumColors.text.tertiary} />
              ) : (
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={PremiumColors.text.tertiary}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
        disabled={loadingCurrent}
        activeOpacity={0.7}
      >
        <View style={styles.currentLocationContent}>
          {loadingCurrent ? (
            <ActivityIndicator size="small" color={PremiumColors.accent.secondary} />
          ) : (
            <Ionicons
              name="navigate"
              size={24}
              color={PremiumColors.accent.secondary}
            />
          )}
          <View style={styles.currentLocationText}>
            <Text style={styles.currentLocationTitle}>
              {loadingCurrent ? 'Getting your location...' : 'Use Current Location'}
            </Text>
            <Text style={styles.currentLocationSubtitle}>
              {loadingCurrent 
                ? 'Please wait' 
                : savedLocation 
                  ? `Current: ${savedLocation.area || savedLocation.city || 'Location'}${savedLocation.city && savedLocation.area ? `, ${savedLocation.city}` : ''}` 
                  : 'Automatically detect your location'}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={PremiumColors.text.tertiary}
        />
      </TouchableOpacity>

      {/* Success Message */}
      {selectedLocation ? (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={24} color={PremiumColors.success} />
          <Text style={styles.successText}>
            Location set to: {selectedLocation}
          </Text>
        </View>
      ) : null}

      {/* Search Results */}
      {predictions.length > 0 ? (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            <Text style={styles.resultsCount}>{predictions.length} found</Text>
          </View>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.place_id}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : searchQuery.trim().length >= 2 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={PremiumColors.text.muted} />
          <Text style={styles.emptyStateText}>No results found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try searching for a city, area, or locality
          </Text>
        </View>
      ) : !searchQuery ? (
        <ScrollView 
          style={styles.contentScrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Places Near You - Show first if user has city and places are available */}
          {showPlaces && savedLocation?.city && (
            <PlacesNearMe
              userLocation={savedLocation.latitude && savedLocation.longitude ? {
                latitude: savedLocation.latitude,
                longitude: savedLocation.longitude,
              } : null}
              userCity={savedLocation.city}
              onPlaceSelect={handlePlaceSelect}
              // State holds `string | null`; the cards declare `?: string`. Normalising
              // at the call site keeps the components' public API free of `null`.
              selectedPlaceId={selectedPlaceId ?? undefined}
            />
          )}

          {/* Popular Cities */}
          <PopularCityCard
            onCitySelect={handleCitySelect}
            selectedCityId={selectedCityId ?? undefined}
          />

          {/* All Cities */}
          <AllCityList
            onCitySelect={handleCitySelect}
            selectedCityId={selectedCityId ?? undefined}
          />

          {/* Bottom spacing for better scrolling */}
          <View style={{ height: 32 }} />
        </ScrollView>
      ) : null}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Area Selection Modal */}
      <AreaSelectionModal
        visible={showAreaModal}
        cityId={selectedCityForAreas?.id || null}
        cityName={selectedCityForAreas?.name || ''}
        onAreaSelect={handleAreaSelect}
        onClose={() => {
          setShowAreaModal(false);
          setSelectedCityForAreas(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: PremiumColors.text.primary,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  currentLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentLocationText: {
    marginLeft: 12,
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  currentLocationSubtitle: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PremiumColors.success,
  },
  successText: {
    fontSize: 14,
    color: PremiumColors.success,
    marginLeft: 12,
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  resultsCount: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  resultsList: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.divider,
  },
  predictionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 15,
    fontWeight: '500',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
  },
});

