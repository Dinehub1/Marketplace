import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Linking,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { FadeInView } from '../../components/FadeInView';
import GuestSelectorModal from '../../components/GuestSelectorModal';
import { RestaurantDetailSkeleton } from '../../components/RestaurantDetailSkeleton';
import RestaurantEventCard from '../../components/RestaurantEventCard';
import RestaurantImageViewer, { ImageItem, MenuCategory } from '../../components/RestaurantImageViewer';
import { getEventsByRestaurantId, getRestaurantById, getRestaurantMenuCategories, getRestaurantOffers, getUserActiveRestaurantBooking } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { useCurrentTheme, useThemeColors } from '../../hooks/useThemeColors';
import { haversineDistanceMeters } from '../../utils/haversine';

const { width, height } = Dimensions.get('window');

// Removed defaultImages - now shows "no images" message when restaurant has no images

export default function RestaurantDetailScreen() {
  const { user } = useAuth();
  const { locationData } = useLocation();
  const { id } = useLocalSearchParams();
  
  // Dynamic theme colors
  const theme = useThemeColors();
  const currentTheme = useCurrentTheme();
  
  // Green colors for restaurant theme (same in both modes)
  const greenTheme = {
    primary: '#10B981',
    secondary: '#34D399',
    dark: '#059669',
    background: 'rgba(16, 185, 129, 0.1)',
  };
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [userActiveBooking, setUserActiveBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('offers');
  const [isTabBarSticky, setIsTabBarSticky] = useState(false);
  const [showOpeningHoursPopup, setShowOpeningHoursPopup] = useState(false);
  const [restaurantDistance, setRestaurantDistance] = useState<string>('Loading...');
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  
  // Image Viewer States
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerMode, setImageViewerMode] = useState<'gallery' | 'menu'>('gallery');
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'food' | 'ambience'>('all');
  const [currentMenuIndex, setCurrentMenuIndex] = useState(0);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageSliderRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<{[key: string]: number}>({});

  // Create styles with dynamic theme
  const styles = createStyles(theme, greenTheme);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadRestaurantData(id);
    }
  }, [id]);

  useEffect(() => {
    if (restaurant && locationData && restaurant.latitude && restaurant.longitude) {
      calculateDistance();
    }
  }, [restaurant, locationData]);

  useEffect(() => {
    if (user && restaurant?.id) {
      checkUserActiveBooking();
    }
  }, [user, restaurant]);


  const calculateDistance = () => {
    if (!restaurant || !locationData?.latitude || !locationData?.longitude || !restaurant.latitude || !restaurant.longitude) {
      setRestaurantDistance('Distance unavailable');
      return;
    }

    try {
      const distanceInMeters = haversineDistanceMeters(
        locationData.latitude,
        locationData.longitude,
        parseFloat(restaurant.latitude),
        parseFloat(restaurant.longitude)
      );

      const distanceInKm = distanceInMeters / 1000;

      if (distanceInKm < 1) {
        setRestaurantDistance(`${Math.round(distanceInMeters)} m away`);
      } else {
        setRestaurantDistance(`${distanceInKm.toFixed(1)} km away`);
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      setRestaurantDistance('Distance unavailable');
    }
  };

  const loadRestaurantData = async (restaurantId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add minimum loading time for smooth skeleton display
      const [restaurantResult, menuResult, offersResult, eventsResult] = await Promise.all([
        getRestaurantById(restaurantId),
        getRestaurantMenuCategories(restaurantId),
        getRestaurantOffers(restaurantId),
        getEventsByRestaurantId(restaurantId),
        new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms
      ]);
      
      if (restaurantResult.error) {
        console.error('Error fetching restaurant:', restaurantResult.error);
        setError('Failed to load restaurant details');
        return;
      }

      if (!restaurantResult.data) {
        setError('Restaurant not found');
        return;
      }

      const data = restaurantResult.data;

      const mappedRestaurant = {
        id: data.id,
        name: data.name,
        cuisines: data.cuisines || (data.cuisine_type ? [data.cuisine_type] : ['Restaurant']),
        rating: data.rating || 4.1,
        description: data.description || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        priceRange: data.price_range || '500-800',
        isOpen: data.is_active || true,
        image: data.cover_image_url || data.gallery_images?.[0] || '',
        gallery_images: data.gallery_images || [],
        food_image: data.food_image || [],
        phone_number: data.phone_number || '',
        email: data.email || '',
        website: data.website || '',
        google_maps_place_id: data.google_maps_place_id || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        opening_hours: data.opening_hours || {},
        more_info: data.more_info || {},
        is_verified: data.is_verified || false,
        total_reviews: data.total_reviews || 0
      };

      setRestaurant(mappedRestaurant);
      
      if (menuResult.data) {
        setMenuCategories(menuResult.data);
      }
      
      if (offersResult.data) {
        setOffers(offersResult.data);
        console.log('Loaded offers:', offersResult.data);
      } else if (offersResult.error) {
        console.error('Error fetching offers:', offersResult.error);
      }
      
      if (eventsResult.data) {
        setEvents(eventsResult.data);
        console.log('Loaded events:', eventsResult.data);
      } else if (eventsResult.error) {
        console.error('Error fetching events:', eventsResult.error);
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error loading restaurant:', error);
      setError('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format offers from database
  const formatOfferForDisplay = (offer: any) => {
    const isPercentage = offer.discount_type === 'percentage';
    const isBogo = offer.discount_type === 'bogo';
    
    let title = String(offer.title || 'Special Offer');
    let subtitle = String(offer.description || '');
    let color = '#FF6B35';
    let bgColor = '#FFF4F0';
    
    if (isPercentage) {
      color = '#4CAF50';
      bgColor = '#F0FFF4';
    } else if (isBogo) {
      color = '#2196F3';
      bgColor = '#F0F8FF';
    } else if (offer.discount_type === 'flat') {
      color = '#FF6B35';
      bgColor = '#FFF4F0';
    }

    return {
      id: String(offer.id ?? `${title}-${subtitle}`),
      type: 'discount',
      title,
      subtitle,
      description: String(offer.description || ''),
      color,
      bgColor,
      originalOffer: offer
    };
  };

  // Opening Hours Utility Functions
  const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getCurrentDaySchedule = () => {
    if (!restaurant?.opening_hours || typeof restaurant.opening_hours !== 'object') {
      return { open: '11:00', close: '23:00', is_closed: false };
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    return restaurant.opening_hours[today] || { open: '11:00', close: '23:00', is_closed: false };
  };

  const getOpeningStatus = () => {
    const schedule = getCurrentDaySchedule();
    if (schedule.is_closed) {
      return { isOpen: false, status: 'Closed', timeInfo: 'Closed today' };
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const openTime = schedule.open;
    const closeTime = schedule.close;
    
    const isOvernight = closeTime < openTime;
    
    let isOpen = false;
    let timeInfo = '';
    
    if (isOvernight) {
      isOpen = currentTime >= openTime || currentTime <= closeTime;
    } else {
      isOpen = currentTime >= openTime && currentTime <= closeTime;
    }
    
    if (isOpen) {
      const closeFormatted = formatTime(closeTime);
      timeInfo = `Closes at ${closeFormatted}`;
    } else {
      const openFormatted = formatTime(openTime);
      timeInfo = `Opens at ${openFormatted}`;
    }
    
    return {
      isOpen,
      status: isOpen ? 'Open now' : 'Closed',
      timeInfo
    };
  };

  const getWeeklySchedule = () => {
    if (!restaurant?.opening_hours || typeof restaurant.opening_hours !== 'object') {
      return [];
    }
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return dayNames.map((dayName, index) => {
      const dayKey = dayKeys[index];
      const schedule = restaurant.opening_hours[dayKey] || { is_closed: true };
      
      return {
        day: dayName,
        ...schedule,
        openFormatted: schedule.open ? formatTime(schedule.open) : '',
        closeFormatted: schedule.close ? formatTime(schedule.close) : '',
      };
    });
  };

  // Auto-slide functionality (only when restaurant has images)
  useEffect(() => {
    if (!restaurant || !restaurant.gallery_images || restaurant.gallery_images.length === 0) return;
    
    const currentImages = restaurant.gallery_images;
    const interval = setInterval(() => {
      if (imageSliderRef.current && currentImages.length > 1) {
        const nextIndex = (currentImageIndex + 1) % currentImages.length;
        imageSliderRef.current.scrollToIndex({ 
          index: nextIndex, 
          animated: true 
        });
        setCurrentImageIndex(nextIndex);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentImageIndex, restaurant]);

  const handleShare = async () => {
    if (!restaurant) return;
    
    try {
      await Share.share({
        message: `Check out ${restaurant.name} - ${restaurant.cuisines.join(', ')} cuisine at ${restaurant.address}. Rated ${restaurant.rating} stars!`,
        url: `DropBy://restaurant/${restaurant.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCallNow = () => {
    if (!restaurant?.phone_number) return;
    
    const phoneUrl = `tel:${restaurant.phone_number}`;
    Linking.openURL(phoneUrl).catch((err) => 
      console.error('Error opening phone dialer:', err)
    );
  };

  const handleViewOnMap = async () => {
    if (!restaurant) return;
    
    let mapUrl = '';
    let deepLinkUrl = '';
    
    // Prioritize Google Maps Place ID for accurate location
    if (restaurant.google_maps_place_id) {
      // Use correct Place ID format with query_place_id parameter
      const restaurantName = encodeURIComponent(restaurant.name || 'Restaurant');
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${restaurantName}&query_place_id=${restaurant.google_maps_place_id}`;
      // For deep link, use the place_id directly
      deepLinkUrl = `comgooglemaps://?q=${restaurantName}&query_place_id=${restaurant.google_maps_place_id}`;
      
      console.log('📍 Opening Google Maps with Place ID:', restaurant.google_maps_place_id);
    } else if (restaurant.latitude && restaurant.longitude) {
      // Fallback to coordinates if Place ID not available
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
      deepLinkUrl = `comgooglemaps://?center=${restaurant.latitude},${restaurant.longitude}&q=${restaurant.latitude},${restaurant.longitude}`;
      
      console.log('📍 Opening Google Maps with coordinates:', restaurant.latitude, restaurant.longitude);
    } else if (restaurant.address) {
      // Final fallback to address search
      const address = `${restaurant.address}${restaurant.city ? `, ${restaurant.city}` : ''}${restaurant.state ? `, ${restaurant.state}` : ''}`;
      const encodedAddress = encodeURIComponent(address);
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      deepLinkUrl = `comgooglemaps://?q=${encodedAddress}`;
      
      console.log('📍 Opening Google Maps with address:', address);
    } else {
      console.warn('⚠️ No location data available for restaurant');
      Alert.alert('Location Unavailable', 'This restaurant does not have location information available.');
      return;
    }
    
    try {
      // Try to open in Google Maps app first
      const canOpen = await Linking.canOpenURL(deepLinkUrl);
      if (canOpen) {
        await Linking.openURL(deepLinkUrl);
      } else {
        // Fallback to web browser
        await Linking.openURL(mapUrl);
      }
    } catch (error) {
      // Final fallback to web URL
      console.log('📱 Opening in browser instead of app');
      Linking.openURL(mapUrl).catch((err) => 
        console.error('❌ Error opening maps:', err)
      );
    }
  };

  const handleBookTablePress = () => {
    setShowGuestSelector(true);
  };

  const handleGuestSelectorConfirm = (guestCount: number) => {
    router.push({
      pathname: `/book-table/${restaurant.id}` as any,
      params: { guestCount: guestCount.toString() }
    });
  };

  // Image Viewer Handlers
  const handleGalleryImagePress = (imageUrl: string, index: number) => {
    setCurrentGalleryIndex(index);
    setImageViewerMode('gallery');
    setShowImageViewer(true);
  };

  const handleMenuImagePress = (categoryName: string, imageIndex: number = 0) => {
    setSelectedMenuCategory(categoryName);
    setCurrentMenuIndex(imageIndex);
    setImageViewerMode('menu');
    setShowImageViewer(true);
  };

  const handleImageViewerClose = () => {
    setShowImageViewer(false);
  };

  // Helper function to get formatted gallery images
  const getFormattedGalleryImages = (): ImageItem[] => {
    const galleryImages = (restaurant?.gallery_images || []).map((url: string) => ({
      url,
      type: 'ambience' as const
    }));
    
    const foodImages = (restaurant?.food_image || []).map((url: string) => ({
      url,
      type: 'food' as const
    }));
    
    return [...galleryImages, ...foodImages];
  };

  // Helper function to get formatted menu categories
  const getFormattedMenuCategories = (): MenuCategory[] => {
    return menuCategories.map(category => ({
      id: category.id,
      name: category.name,
      images: category.images || []
    }));
  };

  const checkUserActiveBooking = async () => {
    if (!user || !restaurant?.id) return;
    
    try {
      const { data } = await getUserActiveRestaurantBooking(user.id, restaurant.id);
      setUserActiveBooking(data);
    } catch (error) {
      console.error('Error checking active booking:', error);
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date();
    const [hours, minutes] = endTime.split(':');
    end.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const remaining = end.getTime() - now.getTime();
    if (remaining <= 0) return null;
    
    const hoursRemaining = Math.floor(remaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m left`;
    }
    return `${minutesRemaining}m left`;
  };

  const tabs = [
    { id: 'offers', title: 'All offers' },
    { id: 'menu', title: 'Menu' },
    { id: 'gallery', title: 'Gallery' },
    { id: 'about', title: 'About' }  
  ];

  const scrollToSection = (sectionId: string) => {
    const yOffset = sectionRefs.current[sectionId];
    if (yOffset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: yOffset - 100,
        animated: true
      });
      setActiveTab(sectionId);
    }
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    
    setIsTabBarSticky(scrollY > 400);
    
    let currentSection = 'offers';
    Object.entries(sectionRefs.current).forEach(([sectionId, offset]) => {
      if (scrollY >= offset - 150) {
        currentSection = sectionId;
      }
    });
    
    if (currentSection !== activeTab) {
      setActiveTab(currentSection);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent" 
          translucent 
        />
        <RestaurantDetailSkeleton />
      </View>
    );
  }

  // Error state
  if (error || !restaurant) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent" 
          translucent 
        />
        <FadeInView duration={400} style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <Ionicons name="restaurant-outline" size={64} color={theme.text.tertiary} />
            <Text style={styles.errorText}>{error || 'Restaurant not found'}</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </View>
    );
  }

  // Check if restaurant has images
  const hasImages = restaurant && restaurant.gallery_images && restaurant.gallery_images.length > 0;
  const currentImages = hasImages ? restaurant.gallery_images : [];

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <FadeInView duration={400} style={{ flex: 1 }}>
        {/* Sticky Tab Bar */}
      {isTabBarSticky && (
        <View style={styles.stickyTabBar}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickyTabContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.stickyTab,
                  activeTab === tab.id && styles.activeStickyTab
                ]}
                onPress={() => scrollToSection(tab.id)}
              >
                <Text style={[
                  styles.stickyTabText,
                  activeTab === tab.id && styles.activeStickyTabText
                ]}>
                  {tab.title}
                </Text>
                {activeTab === tab.id && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.imageCarousel}>
            {hasImages ? (
              <>
                <FlatList
                  ref={imageSliderRef}
                  data={currentImages}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={styles.headerImage} />
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentImageIndex(index);
                  }}
                />

                {/* Image Indicators */}
                {currentImages.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {currentImages.map((_: string, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentImageIndex && styles.activeIndicator,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              /* No Images Available */
              <View style={styles.noImagesContainer}>
                <Ionicons name="camera-outline" size={64} color={theme.text.tertiary} />
                <Text style={styles.noImagesTitle}>Images not available</Text>
                <Text style={styles.noImagesSubtitle}>This restaurant hasn't added photos yet</Text>
              </View>
            )}

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShare}
              style={styles.shareButton}
            >
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Restaurant Info */}
          <View style={styles.restaurantInfo}>
            <View style={styles.infoHeader}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{restaurant.rating}</Text>
                <Ionicons name="star" size={12} color="#FFFFFF" />
              </View>
            </View>
            
            <Text style={styles.restaurantAddress}>
              {restaurant.address}, {restaurant.city}, {restaurant.state}
            </Text>
            
            <View style={styles.metaInfo}>
              <Text style={styles.distanceText}>{restaurantDistance}</Text>
              <Text style={styles.divider}>•</Text>
              <Text style={styles.priceText}>₹{restaurant.priceRange} for two</Text>
            </View>

            <TouchableOpacity 
              style={styles.timingInfo}
              onPress={() => setShowOpeningHoursPopup(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.openStatus,
                { color: getOpeningStatus().isOpen ? greenTheme.primary : '#EF4444' }
              ]}>
                {getOpeningStatus().status}
              </Text>
              <Text style={styles.timingText}>
                • {getOpeningStatus().timeInfo}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.text.secondary} />
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleViewOnMap}>
                <Ionicons name="navigate-outline" size={20} color={theme.text.primary} />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallNow}>
                <Ionicons name="call-outline" size={20} color={theme.text.primary} />
                <Text style={styles.actionButtonText}>Call now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={theme.text.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab
                ]}
                onPress={() => scrollToSection(tab.id)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.title}
                </Text>
                {activeTab === tab.id && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Offers Section */}
        <View 
          style={styles.section}
          onLayout={(event) => {
            sectionRefs.current['offers'] = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Offers</Text>
            {offers.length > 0 && (
              <Text style={styles.offersCount}>{offers.length} available</Text>
            )}
          </View>
          
          {offers.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offersScrollContainer}
            >
              {offers.map((offer, index) => {
                const displayOffer = formatOfferForDisplay(offer);
                
                return (
                  <TouchableOpacity 
                    key={offer.id || index}
                    style={[styles.offerCard, { backgroundColor: displayOffer.bgColor }]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.offerContent}>
                      <View style={styles.offerHeader}>
                        <Text style={[styles.offerTitle, { color: displayOffer.color }]} numberOfLines={1}>
                          {displayOffer.title}
                        </Text>
                        <View style={[styles.offerBadge, { backgroundColor: displayOffer.color }]}>
                          <Ionicons name="time" size={8} color="#FFFFFF" />
          </View>
        </View>

                      <Text style={styles.offerDescription} numberOfLines={2}>
                        {displayOffer.subtitle}
                      </Text>
                      
                      <View style={styles.offerFooter}>
                        <Text style={styles.offerValidText}>Valid now</Text>
                        <TouchableOpacity style={[styles.offerButton, { backgroundColor: displayOffer.color }]}>
                          <Text style={styles.offerButtonText}>VIEW</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noOffersContainer}>
              <Ionicons name="pricetag-outline" size={48} color={theme.text.tertiary} />
              <Text style={styles.noOffersText}>No offers available</Text>
            </View>
          )}
        </View>

        {/* Menu Section - Only show if menu exists */}
        {menuCategories && menuCategories.length > 0 && (
          <View 
            style={styles.section}
            onLayout={(event) => {
              sectionRefs.current['menu'] = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Menu</Text>
              <TouchableOpacity>
                <Ionicons name="search-outline" size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={menuCategories}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuContainer}
              renderItem={({ item: menuItem }) => (
                <TouchableOpacity 
                  style={styles.menuCard}
                  onPress={() => handleMenuImagePress(menuItem.name, 0)}
                  activeOpacity={0.8}
                >
                  {menuItem.images && menuItem.images.length > 0 && (
                    <Image
                      source={{ uri: menuItem.images[0] }}
                      style={styles.menuImage}
                    />
                  )}
                  <Text style={styles.menuCategoryName}>{menuItem.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(menuItem) => menuItem.id}
            />
          </View>
        )}

        {/* Gallery Section */}
        <View 
          style={styles.section}
          onLayout={(event) => {
            sectionRefs.current['gallery'] = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gallery</Text>
          </View>
          
          {((restaurant?.gallery_images && restaurant.gallery_images.length > 0) || 
            (restaurant?.food_image && restaurant.food_image.length > 0)) && (
            <View style={styles.galleryGrid}>
              {(() => {
                const allImages = [
                  ...(restaurant.gallery_images || []),
                  ...(restaurant.food_image || [])
                ];

                return allImages.slice(0, 6).map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.galleryImageCard}
                    onPress={() => handleGalleryImagePress(imageUrl, index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: imageUrl }} style={styles.galleryImage} />
                    {index === 5 && allImages.length > 6 && (
                      <View style={styles.galleryOverlay}>
                        <Text style={styles.galleryMoreText}>+{allImages.length - 6}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ));
              })()}
            </View>
          )}
        </View>

        {/* Events Section */}
        {events && events.length > 0 && (
          <View 
            style={styles.section}
            onLayout={(event) => {
              sectionRefs.current['events'] = event.nativeEvent.layout.y;
            }}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
            </View>
            
            <FlatList
              data={events}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsScrollContainer}
              keyExtractor={(event) => event.id}
              renderItem={({ item, index }) => (
                <View style={index === 0 ? styles.firstEventCard : null}>
                  <RestaurantEventCard event={item} />
                </View>
              )}
            />
          </View>
        )}

        {/* About Restaurant Section */}
        <View 
          style={styles.section}
          onLayout={(event) => {
            sectionRefs.current['about'] = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About Restaurant</Text>
          </View>
          
          {/* Description Card */}
          <View style={styles.aboutDescriptionCard}>
            <Text style={styles.aboutDescription}>
              Welcome to {restaurant.name}, where culinary excellence meets exceptional hospitality. 
              Experience our carefully crafted dishes in a warm and inviting atmosphere.
            </Text>
          </View>

          {/* Info Grid */}
          <View style={styles.aboutInfoGrid}>
            {/* Opening Hours Card */}
            <TouchableOpacity 
              style={styles.aboutInfoCard}
              onPress={() => setShowOpeningHoursPopup(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.aboutIconCircle, { backgroundColor: greenTheme.background }]}>
                <Ionicons name="time-outline" size={24} color={greenTheme.primary} />
              </View>
              <Text style={styles.aboutInfoLabel}>Opening Hours</Text>
              <View style={styles.aboutInfoValueContainer}>
                <Text style={[
                  styles.aboutInfoStatus,
                  { color: getOpeningStatus().isOpen ? greenTheme.primary : '#EF4444' }
                ]}>
                  {getOpeningStatus().status}
                </Text>
                <Text style={styles.aboutInfoValue}>
                  {getOpeningStatus().timeInfo}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} style={styles.aboutCardArrow} />
            </TouchableOpacity>

            {/* Cuisine Card */}
            <View style={styles.aboutInfoCard}>
              <View style={[styles.aboutIconCircle, { backgroundColor: greenTheme.background }]}>
                <Ionicons name="restaurant-outline" size={24} color={greenTheme.primary} />
              </View>
              <Text style={styles.aboutInfoLabel}>Cuisine</Text>
              <Text style={styles.aboutInfoValue} numberOfLines={2}>
                {restaurant.cuisines && restaurant.cuisines.length > 0 
                  ? restaurant.cuisines.join(', ') 
                  : 'Multi-cuisine'}
              </Text>
            </View>

            {/* Cost Card */}
            <View style={styles.aboutInfoCard}>
              <View style={[styles.aboutIconCircle, { backgroundColor: greenTheme.background }]}>
                <Ionicons name="card-outline" size={24} color={greenTheme.primary} />
              </View>
              <Text style={styles.aboutInfoLabel}>Cost for Two</Text>
              <Text style={styles.aboutInfoPrice}>₹{restaurant.priceRange}</Text>
            </View>

            {/* Rating Card */}
            <View style={styles.aboutInfoCard}>
              <View style={[styles.aboutIconCircle, { backgroundColor: greenTheme.background }]}>
                <Ionicons name="star" size={24} color={greenTheme.primary} />
              </View>
              <Text style={styles.aboutInfoLabel}>Rating</Text>
              <View style={styles.ratingValueContainer}>
                <Text style={styles.aboutInfoRating}>{restaurant.rating}</Text>
                <Text style={styles.aboutInfoRatingText}>Excellent</Text>
              </View>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactDetailsCard}>
            <Text style={styles.contactDetailsTitle}>Contact Details</Text>
            
            <View style={styles.contactDetailRow}>
              <View style={[styles.contactIconCircle, { backgroundColor: greenTheme.background }]}>
                <Ionicons name="location" size={20} color={greenTheme.primary} />
              </View>
              <View style={styles.contactDetailText}>
                <Text style={styles.contactDetailLabel}>Address</Text>
                <Text style={styles.contactDetailValue}>
                  {restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ''}{restaurant.state ? `, ${restaurant.state}` : ''}
                </Text>
              </View>
            </View>

            {restaurant.phone_number && (
              <TouchableOpacity 
                style={styles.contactDetailRow}
                onPress={handleCallNow}
                activeOpacity={0.7}
              >
                <View style={[styles.contactIconCircle, { backgroundColor: greenTheme.background }]}>
                  <Ionicons name="call" size={20} color={greenTheme.primary} />
                </View>
                <View style={styles.contactDetailText}>
                  <Text style={styles.contactDetailLabel}>Phone</Text>
                  <Text style={[styles.contactDetailValue, { color: greenTheme.primary }]}>
                    {restaurant.phone_number}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Features & Amenities */}
          {restaurant.more_info && Array.isArray(restaurant.more_info) && restaurant.more_info.length > 0 && (
            <View style={styles.featuresCard}>
              <View style={styles.featuresHeader}>
                <Ionicons name="checkmark-circle" size={24} color={greenTheme.primary} />
                <Text style={styles.featuresTitle}>Features & Amenities</Text>
              </View>
              <View style={styles.featuresGrid}>
                {restaurant.more_info.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureChip}>
                    <Ionicons name="checkmark" size={16} color={greenTheme.primary} />
                    <Text style={styles.featureChipText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom CTA - Always show, but adapt based on booking status */}
      <View style={styles.stickyFooter}>
        {userActiveBooking ? (
          /* User has active booking - show both buttons */
          <View style={styles.dualButtonContainer}>
            {/* Active Booking Info */}
            <View style={styles.bookingInfoCard}>
              <View style={styles.bookingInfoHeader}>
                <Ionicons name="restaurant" size={14} color={greenTheme.primary} />
                <Text style={styles.bookingInfoText}>
                  Table for {userActiveBooking.party_size} • {formatTimeRemaining(userActiveBooking.booking_end_time) || 'Active'}
                </Text>
              </View>
            </View>
            
            {/* Dual Buttons */}
            <View style={styles.buttonsRow}>
                        <TouchableOpacity
                onPress={handleBookTablePress}
                style={styles.secondaryButton}
                        >
                <Ionicons name="add" size={18} color={greenTheme.primary} />
                <Text style={styles.secondaryButtonText}>Book Another</Text>
                        </TouchableOpacity>
              
                <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => router.push(`/pay-bill/${userActiveBooking.id}` as any)}
              >
                <Ionicons name="card" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Pay Bill</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
        ) : (
          /* No active booking - show single book table button */
        <TouchableOpacity
          onPress={handleBookTablePress}
          style={styles.bookTableCTA}
        >
          <Text style={styles.bookTableCTAText}>Book A Table</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        )}
          </View>

      {/* Opening Hours Popup */}
      {showOpeningHoursPopup && (
        <View style={styles.openingHoursModal}>
          <TouchableOpacity 
            style={styles.openingHoursOverlay}
            onPress={() => setShowOpeningHoursPopup(false)}
            activeOpacity={1}
          />
          <View style={styles.openingHoursPopup}>
            <View style={styles.openingHoursHeader}>
              <Text style={styles.openingHoursTitle}>Opening Hours</Text>
              <TouchableOpacity
                onPress={() => setShowOpeningHoursPopup(false)}
                style={styles.openingHoursCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.openingHoursCurrentStatus}>
              <View style={styles.openingHoursStatusBadge}>
                <View style={[
                  styles.openingHoursStatusDot,
                  { backgroundColor: getOpeningStatus().isOpen ? greenTheme.primary : '#EF4444' }
                ]} />
                <Text style={[
                  styles.openingHoursStatusBadgeText,
                  { color: getOpeningStatus().isOpen ? greenTheme.primary : '#EF4444' }
                ]}>
                  {getOpeningStatus().status}
                </Text>
              </View>
              <Text style={styles.openingHoursStatusSubtext}>
                {getOpeningStatus().timeInfo}
              </Text>
            </View>

            <View style={styles.openingHoursSchedule}>
              {getWeeklySchedule().map((day, index) => {
                const isToday = new Date().getDay() === (index + 1) % 7;
                return (
                  <View key={day.day} style={styles.openingHoursDayRow}>
                    <Text style={[
                      styles.openingHoursDayName,
                      isToday && styles.openingHoursTodayText
                    ]}>
                      {day.day}
                    </Text>
                    <Text style={[
                      styles.openingHoursDayTime,
                      isToday && styles.openingHoursTodayText
                    ]}>
                      {day.is_closed 
                        ? 'Closed' 
                        : `${day.openFormatted} - ${day.closeFormatted}`
                      }
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Guest Selector Modal */}
      <GuestSelectorModal
        visible={showGuestSelector}
        onClose={() => setShowGuestSelector(false)}
        onConfirm={handleGuestSelectorConfirm}
        initialGuestCount={2}
      />

      {/* Restaurant Image Viewer */}
      <RestaurantImageViewer
        visible={showImageViewer}
        onClose={handleImageViewerClose}
        restaurantName={restaurant?.name || ''}
        priceRange={restaurant?.priceRange || ''}
        mode={imageViewerMode}
        galleryImages={getFormattedGalleryImages()}
        activeGalleryTab={activeGalleryTab}
        onGalleryTabChange={setActiveGalleryTab}
        currentGalleryIndex={currentGalleryIndex}
        onGalleryIndexChange={setCurrentGalleryIndex}
        menuCategories={getFormattedMenuCategories()}
        selectedMenuCategory={selectedMenuCategory}
        onMenuCategoryChange={setSelectedMenuCategory}
        currentMenuIndex={currentMenuIndex}
        onMenuIndexChange={setCurrentMenuIndex}
      />
      </FadeInView>
    </View>
  );
}

// Styles moved inside component to use dynamic theme
function createStyles(theme: any, greenTheme: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: theme.background.primary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sticky Tab Bar
  stickyTabBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  stickyTabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stickyTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 24,
    position: 'relative',
  },
  stickyTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text.secondary,
  },
  activeStickyTab: {},
  activeStickyTabText: {
    color: greenTheme.primary,
    fontWeight: '600',
  },

  // Header Section
  headerSection: {
    backgroundColor: theme.background.primary,
  },
  imageCarousel: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeIndicator: {
    backgroundColor: theme.background.primary,
  },

  // Restaurant Info
  restaurantInfo: {
    backgroundColor: theme.background.primary,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.primary,
    flex: 1,
    marginRight: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restaurantAddress: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 14,
    color: theme.text.tertiary,
  },
  divider: {
    fontSize: 14,
    color: theme.text.tertiary,
    marginHorizontal: 8,
  },
  priceText: {
    fontSize: 14,
    color: theme.text.tertiary,
  },
  timingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  openStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  timingText: {
    fontSize: 14,
    color: theme.text.tertiary,
    marginLeft: 4,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background.secondary,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text.primary,
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: theme.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 24,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text.secondary,
  },
  activeTab: {},
  activeTabText: {
    color: theme.text.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: greenTheme.primary,
    borderRadius: 2,
  },

  // Sections
  section: {
    backgroundColor: theme.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  offersCount: {
    fontSize: 12,
    fontWeight: '500',
    color: greenTheme.primary,
    backgroundColor: greenTheme.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  menuUpdated: {
    fontSize: 12,
    color: theme.text.tertiary,
    flex: 1,
    marginLeft: 16,
  },

  // Offers
  offersScrollContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  offerCard: {
    width: width * 0.75,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  offerContent: {
    flex: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  offerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerDescription: {
    fontSize: 12,
    color: theme.text.secondary,
    marginBottom: 12,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerValidText: {
    fontSize: 10,
    fontWeight: '500',
    color: greenTheme.primary,
    flex: 1,
  },
  offerButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noOffersContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noOffersText: {
    fontSize: 14,
    color: theme.text.tertiary,
    marginTop: 12,
  },

  // Menu
  menuContainer: {
    paddingVertical: 8,
    gap: 16,
  },
  menuCard: {
    width: 200,
    backgroundColor: theme.background.secondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  menuCategoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    padding: 12,
  },
  noMenuContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noMenuText: {
    fontSize: 14,
    color: theme.text.tertiary,
    marginTop: 12,
  },

  // Gallery
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryImageCard: {
    width: (width - 56) / 3,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryMoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Events
  eventsScrollContainer: {
    paddingRight: 20,
    paddingTop: 8,
  },
  firstEventCard: {
    marginLeft: 20,
  },

  // About
  aboutCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutRow: {
    marginBottom: 20,
  },
  aboutDescription: {
    fontSize: 16,
    color: theme.text.secondary,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  aboutIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
  },
  aboutValue: {
    fontSize: 15,
    color: theme.text.secondary,
    lineHeight: 22,
    marginLeft: 32,
  },
  aboutValueHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: greenTheme.primary,
    marginLeft: 32,
  },
  aboutContact: {
    fontSize: 15,
    color: greenTheme.primary,
    fontWeight: '500',
    marginLeft: 32,
    textDecorationLine: 'underline',
  },
  openingHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 32,
    flex: 1,
  },
  openingHoursStatus: {
    flex: 1,
  },
  openingHoursStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bookTableCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: greenTheme.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bookTableCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Opening Hours Popup
  openingHoursModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openingHoursOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  openingHoursPopup: {
    backgroundColor: theme.background.primary,
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  openingHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  openingHoursTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text.primary,
  },
  openingHoursCloseButton: {
    padding: 4,
  },
  openingHoursCurrentStatus: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  openingHoursStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  openingHoursStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  openingHoursStatusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  openingHoursStatusSubtext: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  openingHoursSchedule: {
    padding: 20,
  },
  openingHoursDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  openingHoursDayName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text.primary,
    flex: 1,
  },
  openingHoursDayTime: {
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'right',
  },
  openingHoursTodayText: {
    fontWeight: '700',
    color: greenTheme.primary,
  },

  // Dual Button Layout Styles
  dualButtonContainer: {
    gap: 12,
  },
  bookingInfoCard: {
    backgroundColor: greenTheme.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: greenTheme.primary,
  },
  bookingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: greenTheme.primary,
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background.primary,
    borderWidth: 2,
    borderColor: greenTheme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: greenTheme.primary,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: greenTheme.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // No Images Container
  noImagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background.secondary,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noImagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  noImagesSubtitle: {
    fontSize: 14,
    color: theme.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Features Section
  featuresContainer: {
    marginLeft: 32,
    marginTop: 8,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureBullet: {
    fontSize: 16,
    fontWeight: '700',
    color: greenTheme.primary,
    lineHeight: 22,
  },
  featureText: {
    fontSize: 15,
    color: theme.text.secondary,
    lineHeight: 22,
    flex: 1,
  },

  // New About Section Styles
  aboutDescriptionCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  aboutInfoCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    minHeight: 140,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  aboutIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutInfoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text.tertiary,
    marginBottom: 8,
  },
  aboutInfoValueContainer: {
    flex: 1,
  },
  aboutInfoStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  aboutInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text.primary,
    lineHeight: 20,
  },
  aboutInfoPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: greenTheme.primary,
    marginTop: 4,
  },
  ratingValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  aboutInfoRating: {
    fontSize: 28,
    fontWeight: '700',
    color: greenTheme.primary,
  },
  aboutInfoRatingText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text.secondary,
  },
  aboutCardArrow: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  contactDetailsCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  contactDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 16,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactDetailText: {
    flex: 1,
  },
  contactDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text.tertiary,
    marginBottom: 4,
  },
  contactDetailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text.primary,
    lineHeight: 20,
  },
  featuresCard: {
    backgroundColor: theme.background.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: greenTheme.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.text.primary,
  },
  });
}