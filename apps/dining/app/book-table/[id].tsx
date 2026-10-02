import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { checkSlotAvailability, getRestaurantById, getRestaurantOffers, validateOffer } from '../../config/supabase';
import { useCurrentTheme, useThemeColors } from '../../hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

interface TimeSlot {
  id: string;
  time: string; // Display time (12-hour format)
  timeString?: string; // Database time (24-hour format)
  available: boolean;
  price?: number;
  status?: 'available' | 'full' | 'blocked';
  reason?: string;
  availableCovers?: number;
}

interface MealPeriod {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  timeRange: string;
  timeSlots: TimeSlot[];
}

export default function BookTableScreen() {
  const theme = useThemeColors();
  const currentTheme = useCurrentTheme();
  const { id, guestCount } = useLocalSearchParams();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealPeriod, setSelectedMealPeriod] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableMealPeriods, setAvailableMealPeriods] = useState<MealPeriod[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [validOffers, setValidOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Green theme colors (consistent across themes)
  const greenTheme = {
    primary: '#10B981',
    secondary: '#34D399',
    dark: '#059669',
    background: currentTheme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
  };

  // Debug route params
  console.log('📱 BookTable Screen - Route Params:', { id, guestCount });

  useEffect(() => {
    loadRestaurant();
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [id]);

  useEffect(() => {
    if (restaurant) {
      loadAvailableMealPeriods();
    }
  }, [restaurant, selectedDate]);

  useEffect(() => {
    if (selectedMealPeriod && restaurant) {
      loadTimeSlots();
    }
  }, [selectedMealPeriod, selectedDate, restaurant]);

  // Load valid offers when relevant data changes
  useEffect(() => {
    if (selectedTimeSlot && offers.length > 0) {
      loadValidOffers();
    }
  }, [selectedTimeSlot, selectedDate, offers, guestCount]);

  const loadRestaurant = async () => {
    if (!id) return;
    try {
      setLoading(true);
      console.log('🔍 Loading restaurant with ID:', id);
      const result = await getRestaurantById(id as string);
      console.log('🏪 Restaurant result:', result);
      
      if (result.data) {
        setRestaurant(result.data);
        console.log('✅ Restaurant loaded successfully:', result.data.name);
        // Load offers for this restaurant
        loadOffers(id as string);
      } else {
        console.error('❌ No restaurant data found');
      }
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async (restaurantId: string) => {
    try {
      setLoadingOffers(true);
      const result = await getRestaurantOffers(restaurantId);
      if (result.data) {
        setOffers(result.data);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoadingOffers(false);
    }
  };

  // Generate 7 days starting from today
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if a meal period should be shown based on current time
  const shouldShowMealPeriod = (period: string, date: Date): boolean => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (!isToday) return true; // Show all periods for future dates
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    switch (period) {
      case 'breakfast':
        return currentTime < 11.5; // Show until 11:30 AM
      case 'lunch':
        return currentTime < 16.5; // Show until 4:30 PM
      case 'dinner':
        return currentTime < 22.5; // Show until 10:30 PM
      default:
        return true;
    }
  };

  // Generate base time slots for each meal period
  const generateBaseTimeSlots = (period: string): { timeString: string, displayTime: string }[] => {
    const slots: { timeString: string, displayTime: string }[] = [];
    let startHour: number, endHour: number;

    switch (period) {
      case 'breakfast':
        startHour = 7;
        endHour = 11;
        break;
      case 'lunch':
        startHour = 12;
        endHour = 16;
        break;
      case 'dinner':
        startHour = 18;
        endHour = 22;
        break;
      default:
        startHour = 12;
        endHour = 16;
    }

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip past time slots for today
        if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
          continue;
        }

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        slots.push({ timeString, displayTime });
      }
    }

    return slots;
  };

  // Load available meal periods based on current time and blocking rules
  const loadAvailableMealPeriods = async () => {
    try {
      const baseMealPeriods = [
        {
          id: 'breakfast',
          name: 'breakfast',
          displayName: 'Breakfast',
          icon: 'sunny-outline',
          timeRange: '7:00 AM - 11:30 AM',
          timeSlots: [],
        },
        {
          id: 'lunch',
          name: 'lunch',
          displayName: 'Lunch',
          icon: 'restaurant-outline',
          timeRange: '12:00 PM - 4:30 PM',
          timeSlots: [],
        },
        {
          id: 'dinner',
          name: 'dinner',
          displayName: 'Dinner',
          icon: 'moon-outline',
          timeRange: '6:00 PM - 10:30 PM',
          timeSlots: [],
        },
      ];

      const availablePeriods: MealPeriod[] = [];

      for (const period of baseMealPeriods) {
        // Check if period should be shown based on current time
        if (!shouldShowMealPeriod(period.id, selectedDate)) {
          continue;
        }

        // Check if entire meal period is blocked
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        // Skip availability check if restaurant ID is not available
        if (!restaurant?.id) {
          availablePeriods.push(period);
          continue;
        }
        
        const availability = await checkSlotAvailability(
          restaurant.id,
          dateStr,
          '12:00', // Sample time for meal period check
          period.id,
          parseInt(guestCount?.toString() || '2')
        );

        if (availability.available || availability.status !== 'blocked') {
          availablePeriods.push(period);
        }
      }

      setAvailableMealPeriods(availablePeriods);
      
      // Auto-select first available meal period
      if (availablePeriods.length > 0 && !selectedMealPeriod) {
        setSelectedMealPeriod(availablePeriods[0].id);
      } else if (availablePeriods.length === 0) {
        setSelectedMealPeriod('');
      } else if (!availablePeriods.find(p => p.id === selectedMealPeriod)) {
        setSelectedMealPeriod(availablePeriods[0].id);
      }
    } catch (error) {
      console.error('Error loading meal periods:', error);
    }
  };

  // Load time slots with real availability checking
  const loadTimeSlots = async () => {
    try {
      setLoadingSlots(true);
      const baseSlots = generateBaseTimeSlots(selectedMealPeriod);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const partySize = parseInt(guestCount?.toString() || '2');

      const availableSlots: TimeSlot[] = [];

        // Skip availability check if restaurant ID is not available
        if (!restaurant?.id) {
          console.log('⚠️ Restaurant ID not available, using default slots. Restaurant state:', restaurant);
          // Generate default available slots
          for (const slot of baseSlots) {
            availableSlots.push({
              id: `${selectedMealPeriod}_${slot.timeString}`,
              time: slot.displayTime,
              timeString: slot.timeString,
              available: true,
              status: 'available',
            });
          }
        } else {
          console.log('🏪 Restaurant info for availability check:', { id: restaurant.id, name: restaurant.name });
          for (const slot of baseSlots) {
            const availability = await checkSlotAvailability(
              restaurant.id,
              dateStr,
              slot.timeString,
              selectedMealPeriod,
              partySize
            );

            availableSlots.push({
              id: `${selectedMealPeriod}_${slot.timeString}`,
              time: slot.displayTime,
              timeString: slot.timeString,
              available: availability.available,
              status: availability.status as 'available' | 'full' | 'blocked',
              reason: availability.reason || undefined,
              availableCovers: availability.availableCovers || undefined,
            });
          }
        }

      // Update the selected meal period with available slots
      setAvailableMealPeriods(prev => 
        prev.map(period => 
          period.id === selectedMealPeriod 
            ? { ...period, timeSlots: availableSlots }
            : period
        )
      );

      // Clear selected time slot if it's no longer available
      if (selectedTimeSlot && !availableSlots.find(slot => slot.id === selectedTimeSlot.id && slot.available)) {
        setSelectedTimeSlot(null);
      }

    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const mealPeriods: MealPeriod[] = availableMealPeriods;

  const currentMealPeriod = mealPeriods.find(period => period.id === selectedMealPeriod);

  // Helper function to format offers for display
  const formatOfferForDisplay = (offer: any) => {
    const isPercentage = offer.discount_type === 'percentage';
    const isBogo = offer.discount_type === 'bogo';
    const isFlat = offer.discount_type === 'flat';
    
    let title = '';
    let subtitle = '';
    let color = '#FF6B35';
    let bgColor = '#FFF4F0';
    
    // Get conditions for this offer type
    const offerConditions = offer.conditions?.[offer.discount_type] || {};
    const coverCharge = offerConditions.cover_charge || 0;
    const guestRequired = offerConditions.guest_required || 1;
    
    if (isPercentage) {
      title = `${offer.discount_value}% OFF`;
      
      // Build subtitle with guest requirements and cover charge
      let subtitleParts = [];
      
      if (guestRequired > 1) {
        subtitleParts.push(`Min ${guestRequired} guests`);
      }
      
      if (coverCharge > 0) {
        subtitleParts.push(`₹${coverCharge}/guest cover charge`);
      } else {
        subtitleParts.push('No cover charge');
      }
      
      subtitle = subtitleParts.join(' • ');
      color = '#4CAF50';
      bgColor = '#F0FFF4';
    } else if (isBogo) {
      title = 'BUY 1 GET 1';
      let subtitleParts = [];
      
      if (guestRequired > 1) {
        subtitleParts.push(`Min ${guestRequired} guests`);
      }
      
      if (coverCharge > 0) {
        subtitleParts.push(`₹${coverCharge}/guest cover charge`);
      } else {
        subtitleParts.push('No cover charge');
      }
      
      subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : (offer.description || 'On selected items');
      color = '#2196F3';
      bgColor = '#F0F8FF';
    } else if (isFlat) {
      title = `FLAT ₹${offer.discount_value} OFF`;
      let subtitleParts = [];
      
      if (guestRequired > 1) {
        subtitleParts.push(`Min ${guestRequired} guests`);
      }
      
      const minOrderValue = offerConditions.min_order_value;
      if (minOrderValue) {
        subtitleParts.push(`Above ₹${minOrderValue}`);
      }
      
      if (coverCharge > 0) {
        subtitleParts.push(`₹${coverCharge}/guest cover charge`);
      } else {
        subtitleParts.push('No cover charge');
      }
      
      subtitle = subtitleParts.join(' • ');
      color = '#FF6B35';
      bgColor = '#FFF4F0';
    }

    return {
      id: offer.id,
      type: 'discount',
      title,
      subtitle,
      description: offer.description || '',
      color,
      bgColor,
      originalOffer: offer,
      coverChargePerPerson: coverCharge,
      guestRequired: guestRequired
    };
  };

  // Get valid offers for current booking
  const loadValidOffers = async () => {
    if (!selectedTimeSlot || offers.length === 0) {
      setValidOffers([]);
      return;
    }
    
    console.log('🔍 Loading valid offers for:', {
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTimeSlot.timeString || selectedTimeSlot.time,
      partySize: guestCount
    });
    
    const bookingDate = selectedDate.toISOString().split('T')[0];
    const bookingTime = selectedTimeSlot.timeString || selectedTimeSlot.time;
    const partySize = parseInt(guestCount?.toString() || '2');
    
    const validatedOffers = [];
    for (const offer of offers) {
      console.log('🎯 Validating offer:', offer.title);
      const { valid, reason } = await validateOffer(offer.id, bookingDate, bookingTime, partySize);
      
      if (valid) {
        console.log('✅ Offer valid:', offer.title);
        validatedOffers.push(formatOfferForDisplay(offer));
      } else {
        console.log('❌ Offer invalid:', offer.title, reason);
      }
    }
    
    console.log('📋 Valid offers found:', validatedOffers.length);
    setValidOffers(validatedOffers);
    
    // Clear selected offer if it's no longer valid
    if (selectedOffer && !validatedOffers.find(offer => offer.id === selectedOffer.id)) {
      setSelectedOffer(null);
    }
  };

  const handleContinue = () => {
    if (!selectedTimeSlot) {
      return;
    }

    console.log('🚀 HandleContinue - Restaurant Info:', { id: restaurant?.id, name: restaurant?.name });
    console.log('🎯 Selected Time Slot:', selectedTimeSlot);
    console.log('🎁 Selected Offer:', selectedOffer);

    // Calculate dynamic cover charge based on selected offer
    const guestCountNum = parseInt(guestCount?.toString() || '2');
    const coverChargePerPerson = selectedOffer?.coverChargePerPerson || 0; // Default ₹0 if no offer
    const advanceAmount = guestCountNum * coverChargePerPerson;
    
    console.log('💰 Cover charge calculation:', {
      guestCount: guestCountNum,
      coverChargePerPerson,
      totalCoverCharge: advanceAmount,
      offerSelected: !!selectedOffer
    });

    router.push({
      pathname: '/restaurant/booking-summary',
      params: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantImage: restaurant.cover_image_url || restaurant.image,
        restaurantLocation: `${restaurant.address}, ${restaurant.city}`,
        tableId: 'guest-based',
        tableName: `Table for ${guestCount}`,
        tablePrice: advanceAmount.toString(),
        date: selectedDate.toISOString(),
        timeSlot: selectedTimeSlot.timeString || selectedTimeSlot.time, // Use 24-hour format
        mealPeriod: selectedMealPeriod,
        guests: guestCount?.toString() || '2',
        selectedOfferId: selectedOffer?.originalOffer?.id || '',
        selectedOfferTitle: selectedOffer?.title || ''
      }
    });
  };

  const renderDateItem = ({ item: date }: { item: Date }) => {
    const isSelected = selectedDate.toDateString() === date.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <TouchableOpacity
        style={[
          styles.dateItem,
          isSelected && styles.selectedDateItem,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[
          styles.dateItemDay,
          isSelected && styles.selectedDateText,
        ]}>
          {formatDate(date)}
        </Text>
        <Text style={[
          styles.dateItemNumber,
          isSelected && styles.selectedDateText,
          isToday && !isSelected && styles.todayText,
        ]}>
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = ({ item }: { item: TimeSlot }) => {
    const isSelected = selectedTimeSlot?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot,
          !item.available && styles.unavailableTimeSlot,
        ]}
        onPress={() => item.available && setSelectedTimeSlot(item)}
        disabled={!item.available}
      >
        <Text style={[
          styles.timeSlotText,
          isSelected && styles.selectedTimeSlotText,
          !item.available && styles.unavailableTimeSlotText,
        ]}>
          {item.time}
        </Text>
        {!item.available && (
          <Text style={styles.unavailableLabel}>
            {item.status === 'blocked' ? 'Blocked' : 'Full'}
          </Text>
        )}
        {item.available && item.availableCovers !== null && item.availableCovers !== undefined && (
          <Text style={styles.capacityLabel}>
            {item.availableCovers} left
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Dynamic styles based on theme
  const styles = createStyles(theme, greenTheme, currentTheme);

  if (loading || !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background.primary} 
      />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }],
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Book a Table</Text>
          <Text style={styles.headerSubtitle}>for {guestCount} {guestCount === '1' ? 'guest' : 'guests'}</Text>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Restaurant Card */}
        <Animated.View 
          style={[
            styles.restaurantCard,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }
          ]}
        >
          <Image 
            source={{ uri: restaurant.cover_image_url || restaurant.image }} 
            style={styles.restaurantImage} 
          />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.restaurantMeta}>
              <Ionicons name="location-outline" size={14} color={theme.text.tertiary} />
              <Text style={styles.restaurantLocation}>
                {restaurant.address}, {restaurant.city}
              </Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{restaurant.rating || '4.5'}</Text>
              <Text style={styles.ratingCount}>• {restaurant.total_reviews || '120'} reviews</Text>
            </View>
          </View>
        </Animated.View>

        {/* Date Selector */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Select Date</Text>
          <FlatList
            data={generateDates()}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesList}
          />
        </Animated.View>

        {/* Meal Period Selector */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Select Meal Period</Text>
          <View style={styles.mealPeriodContainer}>
            {mealPeriods.map((period) => {
              const isSelected = selectedMealPeriod === period.id;
              return (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.mealPeriodCard,
                    isSelected && styles.selectedMealPeriodCard,
                  ]}
                  onPress={() => {
                    setSelectedMealPeriod(period.id);
                    setSelectedTimeSlot(null); // Reset time selection
                  }}
                >
                  <View style={[
                    styles.mealPeriodIcon,
                    isSelected && styles.selectedMealPeriodIcon,
                  ]}>
                    <Ionicons 
                      name={period.icon as any} 
                      size={24} 
                      color={isSelected ? '#FFFFFF' : greenTheme.primary} 
                    />
                  </View>
                  <Text style={[
                    styles.mealPeriodName,
                    isSelected && styles.selectedMealPeriodName,
                  ]}>
                    {period.displayName}
                  </Text>
                  <Text style={[
                    styles.mealPeriodTime,
                    isSelected && styles.selectedMealPeriodTime,
                  ]}>
                    {period.timeRange}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Time Slots */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [60, 0],
                }),
              }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>
            Available Times for {currentMealPeriod?.displayName}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {formatDateForDisplay(selectedDate)}
          </Text>
          
          {loadingSlots ? (
            <View style={styles.loadingSlotsContainer}>
              <Text style={styles.loadingSlotsText}>Loading available times...</Text>
            </View>
          ) : currentMealPeriod?.timeSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Text style={styles.noSlotsText}>No available times for this meal period</Text>
            </View>
          ) : (
            <FlatList
              data={currentMealPeriod?.timeSlots || []}
              renderItem={renderTimeSlot}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.timeSlotsGrid}
              scrollEnabled={false}
            />
          )}
        </Animated.View>

        {/* Offers Section */}
        {selectedTimeSlot && (
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                }],
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Available Offers</Text>
            
            {loadingOffers ? (
              <View style={styles.offersLoadingContainer}>
                <Text style={styles.offersLoadingText}>Loading offers...</Text>
              </View>
            ) : (
              <View style={styles.offersContainer}>
                <TouchableOpacity
                  style={[
                    styles.offerCard,
                    !selectedOffer && styles.selectedOfferCard
                  ]}
                  onPress={() => setSelectedOffer(null)}
                >
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerTitle}>No Offer</Text>
                    <View style={[styles.offerCheckbox, !selectedOffer && styles.offerCheckboxSelected]}>
                      {!selectedOffer && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </View>
                  </View>
                  <Text style={styles.offerSubtitle}>No cover charge • No discount</Text>
                </TouchableOpacity>

                {validOffers.map(displayOffer => {
                  const isSelected = selectedOffer?.id === displayOffer.id;
                  
                  return (
                    <TouchableOpacity
                      key={displayOffer.id}
                      style={[
                        styles.offerCard,
                        { backgroundColor: displayOffer.bgColor },
                        isSelected && styles.selectedOfferCard
                      ]}
                      onPress={() => setSelectedOffer(displayOffer)}
                    >
                      <View style={styles.offerHeader}>
                        <Text style={[styles.offerTitle, { color: displayOffer.color }]}>
                          {displayOffer.title}
                        </Text>
                        <View style={[styles.offerCheckbox, isSelected && styles.offerCheckboxSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                      </View>
                      <Text style={styles.offerSubtitle}>{displayOffer.subtitle}</Text>
                      {displayOffer.description && (
                        <Text style={styles.offerDescription}>{displayOffer.description}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>  
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <Animated.View 
        style={[
          styles.floatingButton,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedTimeSlot && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedTimeSlot}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedTimeSlot && styles.disabledButtonText,
          ]}>
            {selectedTimeSlot ? 'Continue to Summary' : 'Select a Time Slot'}
          </Text>
          {selectedTimeSlot && (
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Styles function to create dynamic styles based on theme
function createStyles(theme: any, greenTheme: any, currentTheme: string) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: theme.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.primary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.text.secondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  restaurantCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  restaurantImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  restaurantInfo: {
    gap: 6,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restaurantLocation: {
    fontSize: 14,
    color: theme.text.tertiary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  ratingCount: {
    fontSize: 14,
    color: theme.text.tertiary,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 16,
  },
  datesList: {
    paddingVertical: 8,
    gap: 12,
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.background.secondary,
    borderWidth: 2,
    borderColor: theme.border,
    minWidth: 80,
  },
  selectedDateItem: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  dateItemDay: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.text.tertiary,
    marginBottom: 4,
  },
  dateItemNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  todayText: {
    color: greenTheme.primary,
  },
  mealPeriodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mealPeriodCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.background.secondary,
    borderWidth: 2,
    borderColor: theme.border,
  },
  selectedMealPeriodCard: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  mealPeriodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: greenTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedMealPeriodIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mealPeriodName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 4,
  },
  selectedMealPeriodName: {
    color: '#FFFFFF',
  },
  mealPeriodTime: {
    fontSize: 12,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  selectedMealPeriodTime: {
    color: '#FFFFFF',
  },
  timeSlotsGrid: {
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.background.secondary,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  selectedTimeSlot: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  unavailableTimeSlot: {
    backgroundColor: theme.background.tertiary,
    borderColor: theme.border,
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
  },
  unavailableTimeSlotText: {
    color: theme.text.tertiary,
  },
  unavailableLabel: {
    fontSize: 10,
    color: theme.text.tertiary,
    marginTop: 2,
  },
  capacityLabel: {
    fontSize: 10,
    color: '#F97316',
    marginTop: 2,
    fontWeight: '500',
  },
  loadingSlotsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingSlotsText: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  noSlotsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 14,
    color: theme.text.secondary,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background.secondary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34, // Safe area
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  continueButton: {
    backgroundColor: greenTheme.primary,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: theme.text.tertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: theme.text.tertiary,
  },
  // Offers Section Styles
  offersContainer: {
    gap: 12,
  },
  offersLoadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  offersLoadingText: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  offerCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.border,
  },
  selectedOfferCard: {
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.background,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
  },
  offerSubtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 12,
    color: theme.text.tertiary,
    marginBottom: 4,
  },
  offerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerCheckboxSelected: {
    backgroundColor: greenTheme.primary,
    borderColor: greenTheme.primary,
  },
  });
}