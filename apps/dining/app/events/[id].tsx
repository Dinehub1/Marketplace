import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import EventOrganizerCard from '../../components/EventOrganizerCard';
import EventOrganizerModal from '../../components/EventOrganizerModal';
import { EventArtists, EventExperiences, EventGuide, EventPartners, EventScheduleModal, EventVenueCard, EventVenueModal, ProhibitedItems } from '../../components/Events';
import { EventVideoPlayer } from '../../components/EventVideoPlayer';
import GuestSelectorModal from '../../components/GuestSelectorModal';
import { addToFavorites, checkIsFavorite, getEventById, getEventOccurrences, getTicketsForOccurrence, getUserActiveEventBooking, getUserActivePaidEventBooking, removeFromFavorites } from '../../config/supabase';
import { AppColors, PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import type { EventTicketRow } from '../../types/event';
import { shareEvent } from '../../utils/shareUtils';

const { width, height } = Dimensions.get('window');

export default function BookEventScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { locationData } = useLocation();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [activePaidBooking, setActivePaidBooking] = useState<any>(null);
  const [checkingBooking, setCheckingBooking] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Modal states
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Event Occurrences State
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [occurrenceTickets, setOccurrenceTickets] = useState<any[]>([]);
  const [loadingOccurrences, setLoadingOccurrences] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (user?.id && id) {
      checkFavoriteStatus();
    }
  }, [user?.id, id]);

  useEffect(() => {
    if (user?.id) {
      checkActiveBooking();
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (event?.id) {
      loadOccurrences();
    }
  }, [event]);

  useEffect(() => {
    if (selectedOccurrence?.id) {
      loadOccurrenceTickets();
    }
  }, [selectedOccurrence]);

  const checkActiveBooking = async () => {
    if (!id || !user?.id) {
      console.log('🔍 No event ID or user ID for checking active booking');
      return;
    }
    
    try {
      setCheckingBooking(true);
      console.log('🔍 Checking active bookings for user:', user.id, 'event:', id);
      
      // Check for active free event booking
      const { data: freeBooking, error: freeError } = await getUserActiveEventBooking(user.id, id as string);
      
      if (freeError) {
        console.error('❌ Error getting user active free event booking:', freeError);
      } else if (freeBooking) {
        setActiveBooking(freeBooking);
        console.log('🎫 Active free booking found:', freeBooking);
      } else {
        console.log('🔍 No active free booking found for user');
        setActiveBooking(null);
      }

      // Check for active paid event booking
      const { data: paidBooking, error: paidError } = await getUserActivePaidEventBooking(user.id, id as string);
      
      if (paidError) {
        console.error('❌ Error getting user active paid event booking:', paidError);
      } else if (paidBooking) {
        setActivePaidBooking(paidBooking);
        console.log('🎟️ Active paid booking found:', paidBooking);
      } else {
        console.log('🔍 No active paid booking found for user');
        setActivePaidBooking(null);
      }
    } catch (error) {
      console.error('❌ Error checking active bookings:', error);
    } finally {
      setCheckingBooking(false);
    }
  };

  const loadEvent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const result = await getEventById(id as string);
      if (result.data) {
        setEvent(result.data);
      } else {
        console.error('No event data found:', result.error);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOccurrences = async () => {
    if (!event?.id) return;
    
    try {
      setLoadingOccurrences(true);
      console.log('📅 Loading occurrences for event:', event.id);
      
      const { data, error } = await getEventOccurrences(event.id);
      
      if (error) {
        console.error('❌ Error loading occurrences:', error);
        console.error('❌ Error details:', error);
        setOccurrences([]);
        setSelectedOccurrence(null);
      } else if (data && data.length > 0) {
        console.log('✅ Loaded occurrences count:', data.length);
        console.log('✅ Occurrences data:', JSON.stringify(data, null, 2));
        setOccurrences(data);
        // Auto-select first occurrence
        setSelectedOccurrence(data[0]);
      } else {
        console.log('ℹ️ No occurrences found in database');
        console.log('ℹ️ Response data:', data);
        setOccurrences([]);
        setSelectedOccurrence(null);
      }
    } catch (error) {
      console.error('❌ Exception in loadOccurrences:', error);
      setOccurrences([]);
      setSelectedOccurrence(null);
    } finally {
      setLoadingOccurrences(false);
    }
  };

  const loadOccurrenceTickets = async () => {
    if (!event?.id || !selectedOccurrence?.id) return;
    
    try {
      console.log('🎟️ Loading tickets for occurrence:', selectedOccurrence.id);
      
      const { data, error } = await getTicketsForOccurrence(event.id, selectedOccurrence.id);
      
      if (error) {
        console.error('❌ Error loading occurrence tickets:', error);
        setOccurrenceTickets([]);
      } else {
        console.log('✅ Loaded occurrence tickets:', data?.length || 0);
        setOccurrenceTickets(data || []);
      }
    } catch (error) {
      console.error('❌ Error in loadOccurrenceTickets:', error);
      setOccurrenceTickets([]);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user?.id || !id) return;

    try {
      const { isFavorite: favStatus } = await checkIsFavorite(user.id, id as string, 'event');
      setIsFavorite(favStatus);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !id) {
      Alert.alert('Login Required', 'Please login to save favorites');
      return;
    }

    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        // Remove from favorites
        await removeFromFavorites(user.id, id as string, 'event');
        setIsFavorite(false);
      } else {
        // Add to favorites
        await addToFavorites(user.id, id as string, 'event');
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBookForFreePress = () => {
    setShowGuestSelector(true);
  };

  const handleGuestSelectorConfirm = (guestCount: number) => {
    router.push({
      pathname: `/booking/free/${event.id}` as any,
      params: { 
        guestCount: guestCount.toString(),
        occurrenceId: selectedOccurrence?.id || ''
      }
    });
  };

  const handleGetDirections = async (restaurant: any) => {
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
      Alert.alert('Location Unavailable', 'This venue does not have location information available.');
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
  
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showInclusionsModal, setShowInclusionsModal] = useState(false);
  const [selectedTicketForInclusions, setSelectedTicketForInclusions] = useState<any>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  // Animation values - Using React Native Animated
  // Removed parallax scroll animations - using simple ScrollView with fixed floating buttons

  // Check if description is long enough to show collapse button
  const isDescriptionLong = event?.description && event.description.length > 150;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  // Event Guide Data from database
  const getEventGuideData = () => {
    const guideData = event.event_guide?.[0]?.guide_data || {};
    const guideItems = [];

    // Only add items if they have meaningful data
    if (guideData.languages && guideData.languages.length > 0) {
      guideItems.push({
        icon: 'language-outline',
        title: 'Language',
        value: guideData.languages.join(', ')
      });
    }

    if (guideData.duration_minutes) {
      guideItems.push({
        icon: 'time-outline',
        title: 'Duration',
        value: `${Math.floor(guideData.duration_minutes / 60)} Hours and ${guideData.duration_minutes % 60} Minutes`
      });
    }

    if (guideData.gate_opens_at_enable && guideData.gate_open_at) {
      guideItems.push({
        icon: 'lock-open-outline',
        title: 'Gate Opens At',
        value: formatTime(guideData.gate_open_at)
      });
    }

    if (guideData.ticket_needed_for) {
      guideItems.push({
        icon: 'ticket-outline',
        title: 'Tickets Needed For',
        value: guideData.ticket_needed_for
      });
    }

    if (guideData.entry_allowed_for) {
      guideItems.push({
        icon: 'enter-outline',
        title: 'Entry Allowed For',
        value: guideData.entry_allowed_for
      });
    }

    if (guideData.layout) {
      guideItems.push({
        icon: 'home-outline',
        title: 'Layout',
        value: guideData.layout
      });
    }

    if (guideData.seating_arrangement) {
      guideItems.push({
        icon: 'people-outline',
        title: 'Seating Arrangement',
        value: guideData.seating_arrangement
      });
    }

    if (guideData.kid_friendly !== undefined) {
      guideItems.push({
        icon: 'happy-outline',
        title: 'Kid Friendly?',
        value: guideData.kid_friendly ? 'Yes' : 'No'
      });
    }

    if (guideData.pet_friendly !== undefined) {
      guideItems.push({
        icon: 'paw-outline',
        title: 'Pet Friendly?',
        value: guideData.pet_friendly ? 'Yes' : 'No'
      });
    }

    return guideItems;
  };

  // Prohibited Items Data from database
  const getProhibitedItems = (): any[] => {
    const itemsData = event.event_prohibited_items?.[0]?.items_data || [];
    return itemsData.length > 0 ? itemsData : [
      { name: 'No prohibited items specified', icon: 'information-circle-outline' }
    ];
  };

  // FAQ Data from database. `content_data` is a JSON column, so the rows are `any` —
  // typed as an array so the `.map((faq) => …)` callbacks below get a real parameter.
  const getFaqData = (): any[] => {
    const contentData = event.event_faq_terms?.[0]?.content_data || {};
    return contentData.faq || [];
  };

  // Terms Data from database
  const getTermsData = (): any[] => {
    const contentData = event.event_faq_terms?.[0]?.content_data || {};
    return contentData.terms || [];
  };

  // Venue data from database
  const getVenueData = () => {
    return event.event_venue?.[0]?.venue_data || {};
  };

  // Check if venue is linked to a restaurant
  const getRestaurantVenue = () => {
    return event.event_venue?.[0]?.restaurants || null;
  };

  // Check if venue has restaurant linked
  const isRestaurantVenue = () => {
    return !!event.event_venue?.[0]?.restaurant_id;
  };

  // Gallery functionality
  // The explicit return types below are load-bearing under `strict`. `event` is `any`,
  // so a bare `return event.x || []` infers the literal `never[]`, which makes every
  // `.map((img, index) => …)` callback parameter implicitly `any` again — the errors
  // pointed at the callbacks, but the cause was here.
  const getGalleryImages = (): string[] => {
    return event.gallery_images || [];
  };

  // Experiences data from database
  const getExperiences = (): any[] => {
    return event.event_experiences || [];
  };

  // Partners data from database
  const getPartners = (): any[] => {
    return event.event_partners || [];
  };

  // Artists data from database
  const getEventArtists = (): any[] => {
    return event.event_artists || [];
  };

  // Cover charge tickets - Use occurrence tickets if available, otherwise fallback to event tickets
  // Explicit return type for the same reason as getGalleryImages: without it the `return []`
  // branch infers `never[]` and the `.filter(ticket => …)` callbacks become implicit `any`.
  const getCoverChargeTickets = (): any[] => {
    // If we have occurrence tickets loaded, use those
    if (occurrenceTickets.length > 0) {
      return occurrenceTickets.filter(ticket => ticket.ticket_cover_enabled);
    }
    
    // Fallback to event tickets. Cast to the ticket row shape: `event` is `any`, so
    // without it every `.filter`/`.find` callback below is an implicit-`any` error and
    // `ticket.available` / `ticket.price` are unchecked.
    const eventTickets = (event.event_ticket_types || []) as EventTicketRow[];
    return eventTickets.filter(ticket => ticket.ticket_cover_enabled);
  };

  const handleGalleryImagePress = (imageUrl: string, index: number) => {
    setCurrentGalleryIndex(index);
    setShowFullScreenGallery(true);
  };

  const handleFullScreenClose = () => {
    setShowFullScreenGallery(false);
  };

  const updateTicketCount = (ticketId: string, change: number) => {
    const currentCount = selectedTickets[ticketId] || 0;
    const newCount = Math.max(0, currentCount + change);
    const ticket = ((event.event_ticket_types || []) as EventTicketRow[]).find(t => t.id === ticketId);
    
    if (ticket && newCount <= ticket.available) {
      setSelectedTickets(prev => ({
        ...prev,
        [ticketId]: newCount
      }));
    }
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, count]) => {
      const ticket = ((event.event_ticket_types || []) as EventTicketRow[]).find(t => t.id === ticketId);
      return total + (ticket ? ticket.price * count : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((total, count) => total + count, 0);
  };

  const handleBooking = () => {
    const totalTickets = getTotalTickets();
    if (totalTickets === 0) {
      Alert.alert('No Tickets Selected', 'Please select at least one ticket');
      return;
    }

    const ticketSummary = Object.entries(selectedTickets)
      .filter(([_, count]) => count > 0)
      .map(([ticketId, count]) => {
        const ticket = ((event.event_ticket_types || []) as EventTicketRow[]).find(t => t.id === ticketId);
        return `${count}x ${ticket?.name}`;
      })
      .join(', ');

    Alert.alert(
      'Booking Confirmed! 🎉',
      `Event: ${event.title}\nDate: ${event.event_date}\nTime: ${event.start_time || '7:00 PM'}\nVenue: ${event.venue || 'TBD'}\nTickets: ${ticketSummary}\nTotal: ₹${getTotalAmount()}`,
      [
        {
          text: 'View Orders',
          onPress: () => router.replace('/Ticekts-Bookings/event-tickets')
        },
        {
          text: 'Book Another',
          style: 'cancel'
        }
      ]
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) {
      // Default to current date if not provided
      const date = new Date();
      const day = date.toLocaleDateString('en-US', { day: 'numeric' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      return { day, month, weekday };
    }
    const date = new Date(dateString);
    const day = date.toLocaleDateString('en-US', { day: 'numeric' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    return { day, month, weekday };
  };

  const formatDateRange = () => {
    if (!event.event_date) return 'Date TBD';
    
    if (event.event_type === 'multi_day' && event.event_end_date) {
      const startDate = new Date(event.event_date);
      const endDate = new Date(event.event_end_date);
      
      const startDay = startDate.toLocaleDateString('en-US', { day: 'numeric' });
      const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
      const endDay = endDate.toLocaleDateString('en-US', { day: 'numeric' });
      const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
      }
    } else {
      const date = new Date(event.event_date);
      const day = date.toLocaleDateString('en-US', { day: 'numeric' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${weekday}, ${month} ${day}`;
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '7:00 PM'; // Default time if not provided
    
    // Handle 24-hour format (HH:MM:SS or HH:MM)
    if (timeString.includes(':') && !timeString.includes('AM') && !timeString.includes('PM')) {
      const [hours, minutes] = timeString.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
    
    // Handle already formatted times
    return timeString.replace(' PM', ' PM').replace(' AM', ' AM');
  };

  // Extract date components for the date card display
  const getDateComponents = () => {
    if (!event.event_date) {
      const date = new Date();
      return {
        day: date.toLocaleDateString('en-US', { day: 'numeric' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
      };
    }
    const date = new Date(event.event_date);
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const { day, month, weekday } = getDateComponents();

  // Calculate distance to venue using contact coordinates
  const calculateVenueDistance = () => {
    const venueData = getVenueData();
    const venueLat = venueData.contact?.latitude ? parseFloat(venueData.contact.latitude) : null;
    const venueLng = venueData.contact?.longitude ? parseFloat(venueData.contact.longitude) : null;
    
    if (!venueLat || !venueLng || !locationData?.latitude || !locationData?.longitude) {
      return undefined;
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (venueLat - locationData.latitude) * Math.PI / 180;
    const dLng = (venueLng - locationData.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(locationData.latitude * Math.PI / 180) * Math.cos(venueLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleShare = async () => {
    await shareEvent({
      title: event.title,
      subtitle: event.subtitle || event.description,
      date: event.event_date,
      time: event.start_time,
      venue: event.venue,
      price: event.price,
    });
  };

  // Get price display text based on event type and price_display_string
  const getPriceDisplayText = () => {
    if (event.booking_type === 'layout') {
      return 'Select Your Section';
    }
    
    if (event.ticket_type === 'free') {
      return 'Book for Free';
    }
    
    if (event.price_display_string && event.price_display_string !== '0') {
      return `₹${event.price_display_string} Onwards`;
    }
    
    return 'Book for Free';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent={false} />
      
      {/* Floating Header Buttons - Always Visible */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.floatingBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.floatingSaveButton,
            isFavorite && styles.floatingSaveButtonActive
          ]} 
          onPress={handleToggleFavorite}
          disabled={favoriteLoading}
        >
          <Ionicons 
            name={isFavorite ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isFavorite ? "#FF6B6B" : "#fff"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image/Video Section - Full 3:4 Ratio (1080x1350) */}
        <View style={styles.heroImageContainer}>
          {event.cover_video_url ? (
            <EventVideoPlayer 
              videoUrl={event.cover_video_url}
              coverImageUrl={event.cover_image_url}
              aspectRatio="3:4"
              style={styles.heroMedia}
            />
          ) : (
            <Image 
              source={{ uri: event.cover_image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&h=1350&fit=crop' }} 
              style={styles.heroImage} 
              resizeMode="cover"
            />
          )}
        </View>

        {/* Event Info Card - Updated Layout */}
        <Animated.View style={[styles.eventInfoCard]}>
          <View style={styles.eventInfoHeader}>
            <View style={styles.eventBasicInfo}>
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTag}>
                  {event.event_categories?.name || 'Event'}
                </Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDateTime}>
                {formatDateRange()} | {formatTime(event.start_time)}
              </Text>
            </View>

            <View style={styles.dateCard}>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateMonth}>{month.toUpperCase()}</Text>
              <Text style={styles.dateWeekday}>{weekday.toUpperCase()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Event Info Cards - Venue & Schedule (Stacked) */}
        {((getVenueData().name || getVenueData().address) || 
          (event?.event_guide?.[0]?.guide_data?.gate_opens_at_enable && event?.event_guide?.[0]?.guide_data?.gate_open_at)) && (
          <View style={styles.infoCardsSection}>
            {/* Venue Info Card */}
            {(getVenueData().name || getVenueData().address) && (
              <TouchableOpacity 
                style={styles.infoCard}
                onPress={() => setShowVenueModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.infoCardIcon}>
                  <Ionicons name="location-outline" size={20} color={PremiumColors.text.primary} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Venue</Text>
                  <Text style={styles.infoCardSubtitle} numberOfLines={1}>
                    {getVenueData().name || 'Event Venue'}
                  </Text>
                  {calculateVenueDistance() && (
                    <Text style={styles.infoCardDistance}>
                      {calculateVenueDistance()! < 1 
                        ? `${(calculateVenueDistance()! * 1000).toFixed(0)}m away` 
                        : `${calculateVenueDistance()!.toFixed(1)}km away`}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={PremiumColors.text.muted} />
              </TouchableOpacity>
            )}

            {/* Gates Open Info Card - Only show if enabled */}
            {event?.event_guide?.[0]?.guide_data?.gate_opens_at_enable && 
             event?.event_guide?.[0]?.guide_data?.gate_open_at && (
              <TouchableOpacity 
                style={styles.infoCard}
                onPress={() => setShowScheduleModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.infoCardIcon}>
                  <Ionicons name="time-outline" size={20} color={PremiumColors.text.primary} />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Gates Open</Text>
                  <Text style={styles.infoCardSubtitle}>
                    {formatTime(event.event_guide[0].guide_data.gate_open_at)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={PremiumColors.text.muted} />
              </TouchableOpacity>
            )}
          </View>
        )}
        

        {/* About Section - Smart Collapsible */}
        {event.description && (
          <View style={styles.aboutSection}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutTitle}>About</Text>
              {isDescriptionLong && (
                <TouchableOpacity 
                  onPress={() => setIsAboutExpanded(!isAboutExpanded)}
                  style={styles.expandButton}
                >
                  <Ionicons 
                    name={isAboutExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={AppColors.primary} 
                  />
                  <Text style={styles.expandButtonText}>
                    {isAboutExpanded ? 'Less' : 'More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text 
              style={styles.aboutText}
              numberOfLines={isDescriptionLong && !isAboutExpanded ? 3 : undefined}
            >
              {event.description}
            </Text>
            
          </View>
        )}
        
        {/* Event Artists Section */}
        <EventArtists artists={getEventArtists()} />

        {/* Enhanced Event Guide - Only show if has data */}
        <EventGuide guideItems={getEventGuideData()} />


        {/* Premium Gallery Section */}
        {getGalleryImages().length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <View style={styles.premiumGalleryContainer}>
              {/* Main large image */}
              <TouchableOpacity 
                style={styles.galleryMainImageContainer}
                onPress={() => handleGalleryImagePress(getGalleryImages()[0], 0)}
              >
                <Image source={{ uri: getGalleryImages()[0] }} style={styles.galleryMainImage} />
              </TouchableOpacity>

              {/* Fixed grid of only 2 smaller images */}
              {getGalleryImages().length > 1 && (
                <View style={styles.galleryGridContainer}>
                  {getGalleryImages().slice(1, 3).map((img, index) => (
                    <TouchableOpacity 
                      key={index + 1} 
                      style={styles.galleryGridImage}
                      onPress={() => handleGalleryImagePress(img, index + 1)}
                    >
                      <Image source={{ uri: img }} style={styles.galleryImage} />
                      {/* Show +N in bottom right corner of second image if more images exist */}
                      {index === 1 && getGalleryImages().length > 3 && (
                        <View style={styles.galleryCountBadge}>
                          <Text style={styles.galleryCountText}>+{getGalleryImages().length - 3}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}


        


        


        {/* Event Experiences Section */}
        <EventExperiences experiences={getExperiences()} />

        {/* Event Partners Section */}
        <EventPartners partners={getPartners()} />

        {/* Prohibited Items Section */}
        <ProhibitedItems items={getProhibitedItems()} />

        
        {/* Venue Details Section */}
        {(getVenueData().name || getVenueData().address) && (
          <View style={styles.venueSection}>
            <Text style={styles.sectionTitle}>Venue Details</Text>
            <EventVenueCard
              venueData={getVenueData()}
              distance={calculateVenueDistance()}
              onPress={() => setShowVenueModal(true)}
            />
          </View>
        )}


        {/* Organizer Section */}
        {event?.organizer_id && (
          <EventOrganizerCard
            organizerId={event.organizer_id}
            onPress={() => setShowOrganizerModal(true)}
          />
        )}

        {/* Premium FAQ and Terms Buttons */}
        <View style={styles.infoButtonsContainer}>
          {/* FAQ Button */}
          {getFaqData().length > 0 && (
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => setShowFAQModal(true)}
            >
              <View style={styles.buttonGradient}>
                <Ionicons name="help-circle-outline" size={24} color={PremiumColors.accent.secondary} />
                <Text style={styles.buttonText}>Frequently Asked Questions</Text>
                <Ionicons name="chevron-forward" size={20} color={PremiumColors.text.tertiary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Terms Button */}
          {getTermsData().length > 0 && (
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => setShowTermsModal(true)}
            >
              <View style={styles.buttonGradient}>
                <Ionicons name="document-text-outline" size={24} color={PremiumColors.accent.secondary} />
                <Text style={styles.buttonText}>Terms & Conditions</Text>
                <Ionicons name="chevron-forward" size={20} color={PremiumColors.text.tertiary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Conditional Booking Button */}
      <View style={styles.floatingBookingFooter}>
        {event.status === 'coming_soon' ? (
          // Coming Soon - Show non-clickable button with booking open date
          <TouchableOpacity
            style={[styles.bookButton, styles.comingSoonButton]}
            disabled={true}
          >
            <Text style={styles.bookButtonText}>Coming Soon</Text>
            <Text style={styles.bookButtonSubtext}>
              {event.booking_open_date 
                ? `Bookings open on ${new Date(event.booking_open_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : 'Bookings opening soon'}
            </Text>
          </TouchableOpacity>
        ) : event.ticket_type === 'free' ? (
          activeBooking && event.pay_bill_enabled ? (
            // Show both buttons when user has active booking AND pay bill is enabled
            <View style={styles.dualButtonContainer}>
              <TouchableOpacity
                onPress={handleBookForFreePress}
                style={[styles.bookButton, styles.freeBookButton, styles.halfWidthButton]}
              >
                <Text style={styles.bookButtonText} numberOfLines={1}>Book For Free</Text>
                <Text style={styles.bookButtonSubtext} numberOfLines={1}>Select guests & time</Text>
              </TouchableOpacity>
                 <TouchableOpacity
                   onPress={() => router.push({
                     pathname: `/event-pay-bill/${activeBooking.id}` as any,
                     params: {
                       eventTitle: event.title
                     }
                   })}
                   style={[styles.bookButton, styles.payBillButton, styles.halfWidthButton]}
                 >
                   <Text style={styles.bookButtonText} numberOfLines={1}>Pay Bill</Text>
                   <Text style={styles.bookButtonSubtext} numberOfLines={1}>
                     Valid till {formatTime(activeBooking.booking_end_time)}
                   </Text>
                 </TouchableOpacity>
            </View>
          ) : (
            // Show only Book For Free when no active booking OR pay bill disabled
            <TouchableOpacity
              onPress={handleBookForFreePress}
              style={[styles.bookButton, styles.freeBookButton]}
            >
              <Text style={styles.bookButtonText}>Book For Free</Text>
              <Text style={styles.bookButtonSubtext}>Select guests & time</Text>
            </TouchableOpacity>
          )
        ) : (
          // Paid events
          activePaidBooking && event.pay_bill_enabled ? (
            // Show both buttons when user has active paid booking AND pay bill is enabled
            <View style={styles.dualButtonContainer}>
              <TouchableOpacity
                onPress={() => {
                  // Check if event uses layout-based booking
                  if (event.booking_type === 'layout') {
                    // Navigate to venue layout selection page
                    router.push({
                      pathname: `/booking/venue-layout/${event.id}` as any,
                      params: {
                        occurrenceId: selectedOccurrence?.id || ''
                      }
                    });
                  } else {
                    // Normal ticket booking flow
                    router.push({
                      pathname: `/booking/paid/${event.id}` as any,
                      params: {
                        occurrenceId: selectedOccurrence?.id || ''
                      }
                    });
                  }
                }}
                style={[styles.bookButton, styles.ticketBookButton, styles.halfWidthButton]}
              >
                <Text style={styles.bookButtonText} numberOfLines={1}>Book Tickets</Text>
                <Text style={styles.bookButtonSubtext} numberOfLines={1}>
                  {getPriceDisplayText()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: `/event-pay-bill/${activePaidBooking.id}` as any,
                  params: {
                    eventTitle: event.title
                  }
                })}
                style={[styles.bookButton, styles.payBillButton, styles.halfWidthButton]}
              >
                <Text style={styles.bookButtonText} numberOfLines={1}>Pay Bill</Text>
                <Text style={styles.bookButtonSubtext} numberOfLines={1}>
                  Ticket #{activePaidBooking.ticket_number}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Show only Book Tickets when no active paid booking OR pay bill disabled
            <TouchableOpacity
              onPress={() => {
                // Check if event uses layout-based booking
                if (event.booking_type === 'layout') {
                  // Navigate to venue layout selection page
                  router.push({
                    pathname: `/booking/venue-layout/${event.id}` as any,
                    params: {
                      occurrenceId: selectedOccurrence?.id || ''
                    }
                  });
                } else {
                  // Normal ticket booking flow
                  router.push({
                    pathname: `/booking/paid/${event.id}` as any,
                    params: {
                      occurrenceId: selectedOccurrence?.id || ''
                    }
                  });
                }
              }}
              style={styles.bookButton}
            >
              <Text style={styles.bookButtonText}>Book Tickets</Text>
              <Text style={styles.bookButtonSubtext}>
                {getPriceDisplayText()}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Enhanced Gallery Full Screen Viewer */}
      {showFullScreenGallery && getGalleryImages().length > 0 && (
        <View style={styles.fullScreenModal}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
          {/* Header */}
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              onPress={handleFullScreenClose}
              style={styles.closeButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.galleryTitle}>Event Gallery</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          
          {/* Main Image Display */}
          <View style={styles.imageContainer}>
            <FlatList
              data={getGalleryImages()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentGalleryIndex}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentGalleryIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.imageSlide}>
                  <Image
                    source={{ uri: item }}
                    style={styles.fullScreenImageNew}
                    resizeMode="contain"
                  />
                </View>
              )}
              keyExtractor={(item, index) => `gallery_${index}`}
            />
            
            {/* Image Counter */}
            <View style={styles.imageCounter}>
              <Text style={styles.counterText}>
                {currentGalleryIndex + 1} / {getGalleryImages().length}
              </Text>
            </View>
          </View>
          
          {/* Bottom Thumbnail Strip */}
          <View style={styles.thumbnailsContainer}>
            <FlatList
              data={getGalleryImages()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailsList}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    index === currentGalleryIndex && styles.activeThumbnail
                  ]}
                  onPress={() => setCurrentGalleryIndex(index)}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `thumb_${index}`}
            />
          </View>
        </View>
      )}

      {/* FAQ Modal */}
      <Modal
        visible={showFAQModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity 
              onPress={() => setShowFAQModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {getFaqData().map((faq) => (
              <View key={faq.id} style={styles.modalFaqItem}>
                <TouchableOpacity 
                  style={styles.modalFaqHeader}
                  onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                >
                  <Text style={styles.modalFaqQuestion}>{faq.question}</Text>
                  <Ionicons 
                    name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={PremiumColors.text.tertiary} 
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.modalFaqAnswer}>
                    <Text style={styles.modalFaqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity 
              onPress={() => setShowTermsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {/* Handle structured terms (with titles) */}
            {getTermsData().filter(term => typeof term === 'object' && term.title).map((term) => (
              <View key={term.id} style={styles.modalTermItem}>
                <TouchableOpacity 
                  style={styles.modalTermHeader}
                  onPress={() => setExpandedTerms(expandedTerms === term.id ? null : term.id)}
                >
                  <Text style={styles.modalTermTitle}>{term.title}</Text>
                  <Ionicons 
                    name={expandedTerms === term.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={PremiumColors.text.tertiary} 
                  />
                </TouchableOpacity>
                {expandedTerms === term.id && (
                  <View style={styles.modalTermContent}>
                    <Text style={styles.modalTermContentText}>{term.content}</Text>
                  </View>
                )}
              </View>
            ))}
            
            {/* Handle simple terms (just strings) - display as bullet points */}
            {getTermsData().filter(term => typeof term === 'string').length > 0 && (
              <View style={styles.modalTermsListContainer}>
                {getTermsData().filter(term => typeof term === 'string').map((term, index) => (
                  <View key={index} style={styles.modalTermsBulletItem}>
                    <View style={styles.modalBulletPoint} />
                    <Text style={styles.modalTermsBulletText}>{term}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Inclusions Modal */}
      <Modal
        visible={showInclusionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedTicketForInclusions?.name || 'Ticket Details'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowInclusionsModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={AppColors.gray[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Inclusions Section */}
            <View style={styles.inclusionsSection}>
              <View style={styles.inclusionsSectionHeader}>
                <Text style={styles.inclusionsSectionTitle}>Inclusions</Text>
                <Ionicons name="chevron-up" size={20} color={AppColors.gray[600]} />
              </View>
              
              <View style={styles.inclusionsContent}>
                <View style={styles.inclusionBulletItem}>
                  <View style={styles.inclusionBulletPoint} />
                  <Text style={styles.inclusionBulletText}>
                    INR {parseFloat(selectedTicketForInclusions?.entry_fee_amount || 0).toFixed(0)} is the entry fee & INR {parseFloat(selectedTicketForInclusions?.ticket_cover_amount || 0).toFixed(0)} is fully redeemable via application
                  </Text>
                </View>
                
                {/* Additional inclusions from ticket features */}
                {selectedTicketForInclusions?.features?.map((feature: any, index: number) => (
                  <View key={index} style={styles.inclusionBulletItem}>
                    <View style={styles.inclusionBulletPoint} />
                    <Text style={styles.inclusionBulletText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Terms & Conditions Section */}
            <View style={styles.inclusionsSection}>
              <View style={styles.inclusionsSectionHeader}>
                <Text style={styles.inclusionsSectionTitle}>Terms & Conditions</Text>
                <Ionicons name="chevron-up" size={20} color={AppColors.gray[600]} />
              </View>
              
              <View style={styles.inclusionsContent}>
                {getTermsData().length > 0 ? (
                  getTermsData().map((term, index) => (
                    <View key={index} style={styles.inclusionBulletItem}>
                      <View style={styles.inclusionBulletPoint} />
                      <Text style={styles.inclusionBulletText}>
                        {typeof term === 'string' ? term : term.content || term.title}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.inclusionBulletItem}>
                    <View style={styles.inclusionBulletPoint} />
                    <Text style={styles.inclusionBulletText}>
                      Cancellation policy: All event bookings are non-refundable. No cancellation/refund will be allowed post booking.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Restaurant Details Modal */}
      <Modal
        visible={showRestaurantModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedRestaurant?.name || 'Restaurant Details'}
            </Text>
            <TouchableOpacity 
              onPress={() => setShowRestaurantModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={AppColors.gray[600]} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Restaurant Cover Image */}
            {selectedRestaurant?.cover_image_url && (
              <Image 
                source={{ uri: selectedRestaurant.cover_image_url }} 
                style={styles.restaurantModalImage}
              />
            )}
            
            {/* Restaurant Info */}
            <View style={styles.restaurantModalInfo}>
              <Text style={styles.restaurantModalName}>{selectedRestaurant?.name}</Text>
              
              {selectedRestaurant?.rating && (
                <View style={styles.restaurantModalRating}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.restaurantModalRatingText}>
                    {selectedRestaurant.rating} ({selectedRestaurant.total_reviews || 0} reviews)
                  </Text>
                </View>
              )}
              
              <Text style={styles.restaurantModalAddress}>
                📍 {selectedRestaurant?.address}
              </Text>
              
              {selectedRestaurant?.description && (
                <Text style={styles.restaurantModalDescription}>
                  {selectedRestaurant.description}
                </Text>
              )}
              
              {selectedRestaurant?.cuisines && selectedRestaurant.cuisines.length > 0 && (
                <View style={styles.restaurantModalCuisines}>
                  <Text style={styles.restaurantModalLabel}>Cuisines:</Text>
                  <Text style={styles.restaurantModalCuisineText}>
                    {selectedRestaurant.cuisines.join(', ')}
                  </Text>
                </View>
              )}
              
              {selectedRestaurant?.price_range && (
                <View style={styles.restaurantModalPriceRange}>
                  <Text style={styles.restaurantModalLabel}>Price Range:</Text>
                  <Text style={styles.restaurantModalPriceText}>
                    ₹{selectedRestaurant.price_range} for two
                  </Text>
                </View>
              )}
            </View>
            
            {/* Check Restaurant Button */}
            <TouchableOpacity 
              style={styles.checkRestaurantButton}
              onPress={() => {
                setShowRestaurantModal(false);
                // Navigate to restaurant page
                router.push(`/restaurant/${selectedRestaurant?.id}`);
              }}
            >
              <Text style={styles.checkRestaurantButtonText}>Check Restaurant</Text>
              <Ionicons name="arrow-forward" size={20} color={AppColors.white} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Guest Selector Modal */}
      <GuestSelectorModal
        visible={showGuestSelector}
        onClose={() => setShowGuestSelector(false)}
        onConfirm={handleGuestSelectorConfirm}
        initialGuestCount={2}
      />
      
      {/* Organizer Modal */}
      {event?.organizer_id && (
        <EventOrganizerModal
          visible={showOrganizerModal}
          organizerId={event.organizer_id}
          onClose={() => setShowOrganizerModal(false)}
        />
      )}

      {/* Venue Modal */}
      <EventVenueModal
        visible={showVenueModal}
        venueData={getVenueData()}
        distance={calculateVenueDistance()}
        onClose={() => setShowVenueModal(false)}
      />

      {/* Schedule Modal */}
      <EventScheduleModal
        visible={showScheduleModal}
        eventDate={event?.event_date}
        eventEndDate={event?.event_end_date}
        startTime={event?.start_time}
        endTime={event?.end_time}
        gateOpenTime={event?.event_guide?.[0]?.guide_data?.gate_open_at}
        eventType={event?.event_type}
        onClose={() => setShowScheduleModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131315', // Match ticket details dark background
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroImageContainer: {
    width: '100%',
    alignSelf: 'center',
    aspectRatio: 3 / 4, // 3:4 aspect ratio (1080x1350)
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroMedia: {
    width: '100%',
    height: '100%',
  },
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  floatingBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingSaveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingSaveButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  eventInfoCard: {
    backgroundColor: PremiumColors.background.primary,
    marginHorizontal: 0,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1,
  },
  eventInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  dateCard: {
    backgroundColor: PremiumColors.accent.secondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  dateWeekday: {
    fontSize: 8,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 2,
  },
  
  // Date Selector Section Styles
  datesSelectorSection: {
    backgroundColor: PremiumColors.background.primary,
    paddingVertical: 20,
    paddingLeft: 20,
    marginBottom: 10,
  },
  datesScrollContainer: {
    paddingRight: 20,
    gap: 12,
  },
  dateOccurrenceCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: PremiumColors.border,
  },
  dateOccurrenceCardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: PremiumColors.accent.secondary,
    borderWidth: 2,
  },
  dateOccurrenceDay: {
    fontSize: 28,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  dateOccurrenceDaySelected: {
    color: PremiumColors.accent.secondary,
  },
  dateOccurrenceMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    marginTop: 4,
  },
  dateOccurrenceMonthSelected: {
    color: PremiumColors.accent.secondary,
  },
  dateOccurrenceWeekday: {
    fontSize: 10,
    fontWeight: '500',
    color: PremiumColors.text.tertiary,
    marginTop: 2,
  },
  dateOccurrenceWeekdaySelected: {
    color: PremiumColors.accent.secondary,
  },
  soldOutBadge: {
    marginTop: 8,
    backgroundColor: PremiumColors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventBasicInfo: {
    flex: 1,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryTag: {
    fontSize: 12,
    color: PremiumColors.accent.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  eventDateTime: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
  },
  qrCode: {
    alignItems: 'center',
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  aboutSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 13,
    color: PremiumColors.accent.secondary,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
  },
  eventDetails: {
    gap: 12,
    marginTop: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
  },
  eventDate: {
    fontSize: 14,
    color: PremiumColors.text.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  guideIcon: {
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  guideText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
  },
  imagesSection: {
    backgroundColor: PremiumColors.background.primary,
    padding: 20,
    marginBottom: 10,
  },
  imagesScroll: {
    marginTop: 8,
  },
  locationSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
  mapButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  faqSection: {
    backgroundColor: PremiumColors.background.primary,
    padding: 20,
    marginBottom: 10,
  },
  termsSection: {
    backgroundColor: PremiumColors.background.primary,
    padding: 20,
    marginBottom: 10,
  },
  floatingBookingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PremiumColors.background.primary,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bookButton: {
    backgroundColor: PremiumColors.accent.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  freeBookButton: {
    backgroundColor: PremiumColors.accent.secondary,
    borderWidth: 2,
    borderColor: PremiumColors.accent.secondary,
  },
  dualButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthButton: {
    flex: 1,
    minHeight: 65,
    paddingHorizontal: 12,
  },
  payBillButton: {
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  ticketBookButton: {
    backgroundColor: PremiumColors.accent.secondary,
    borderWidth: 2,
    borderColor: PremiumColors.accent.secondary,
  },
  comingSoonButton: {
    backgroundColor: PremiumColors.text.muted,
    borderWidth: 2,
    borderColor: PremiumColors.text.muted,
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  bookButtonSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: PremiumColors.error,
    textAlign: 'center',
    marginTop: 50,
  },


  // Venue Details Styles
  venueSection: {
    backgroundColor: PremiumColors.background.primary,
    padding: 20,
    marginBottom: 10,
  },

  // Restaurant Modal Styles
  restaurantModalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 16,
  },
  restaurantModalInfo: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  restaurantModalName: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
  },
  restaurantModalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantModalRatingText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  restaurantModalAddress: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
    marginBottom: 12,
  },
  restaurantModalDescription: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  restaurantModalCuisines: {
    marginBottom: 12,
  },
  restaurantModalPriceRange: {
    marginBottom: 12,
  },
  restaurantModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  restaurantModalCuisineText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  restaurantModalPriceText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  checkRestaurantButton: {
    backgroundColor: PremiumColors.accent.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  checkRestaurantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Enhanced Image Styles
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 6,
  },

  // Enhanced FAQ Styles
  faqItem: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  faqAnswerText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    marginTop: 12,
  },

  // Enhanced Terms Styles
  termItem: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  termTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  termContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  termContentText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    marginTop: 12,
  },
  
  // Terms Bullet Points Styles
  termsListContainer: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  termsBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PremiumColors.accent.secondary,
    marginTop: 7,
    marginRight: 12,
  },
  termsBulletText: {
    flex: 1,
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
  },

  // Full Screen Image Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: PremiumColors.text.primary,
    fontWeight: '500',
  },
  
  // Premium Gallery Styles
  premiumGalleryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryMainImageContainer: {
    flex: 2,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryMainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryGridContainer: {
    flex: 1,
    gap: 8,
  },
  galleryGridImage: {
    height: 134, // Fixed height for exactly 2 images
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  galleryCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryImageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  galleryMoreOverlay: {
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noGalleryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noGalleryText: {
    marginTop: 12,
    fontSize: 16,
    color: PremiumColors.text.tertiary,
  },
  venueContact: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    marginTop: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: PremiumColors.text.muted,
  },
  noFeaturesText: {
    fontSize: 14,
    color: PremiumColors.text.tertiary,
    fontStyle: 'italic',
  },
  noDataContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: PremiumColors.text.tertiary,
    fontStyle: 'italic',
  },
  
  // Full Screen Gallery Modal Styles
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  galleryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  imageSlide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  fullScreenImageNew: {
    width: width - 20,
    height: '100%',
    maxHeight: height * 0.75,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  thumbnailsContainer: {
    height: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumbnailsList: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 70,
    height: 70,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  activeThumbnail: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },


  // Inclusions Modal Styles
  inclusionsSection: {
    marginBottom: 24,
  },
  inclusionsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 8,
    marginBottom: 12,
  },
  inclusionsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  inclusionsContent: {
    paddingHorizontal: 8,
  },
  inclusionBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 16,
  },
  inclusionBulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PremiumColors.accent.secondary,
    marginTop: 6,
    marginRight: 12,
    flexShrink: 0,
  },
  inclusionBulletText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },


  // Premium Info Buttons Styles
  infoButtonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: PremiumColors.background.primary,
    marginBottom: 8,
    gap: 12,
  },
  premiumButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonGradient: {
    backgroundColor: PremiumColors.background.glass,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Modal FAQ Styles
  modalFaqItem: {
    backgroundColor: PremiumColors.background.glass,
    borderRadius: 16,
    marginBottom: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalFaqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalFaqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  modalFaqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  modalFaqAnswerText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 22,
    marginTop: 12,
  },

  // Modal Terms Styles
  modalTermItem: {
    backgroundColor: PremiumColors.background.glass,
    borderRadius: 16,
    marginBottom: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  modalTermHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTermTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  modalTermContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  modalTermContentText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 22,
    marginTop: 12,
  },
  modalTermsListContainer: {
    backgroundColor: PremiumColors.background.glass,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  modalTermsBulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalBulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PremiumColors.accent.secondary,
    marginTop: 7,
    marginRight: 12,
  },
  modalTermsBulletText: {
    flex: 1,
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 22,
  },

  // Info Cards Section Styles (Stacked Vertically)
  infoCardsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: PremiumColors.background.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    minHeight: 68,
  },
  infoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  infoCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: PremiumColors.text.tertiary,
    marginBottom: 3,
  },
  infoCardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    lineHeight: 18,
  },
  infoCardDistance: {
    fontSize: 11,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
    marginTop: 2,
  },
});