import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import EventOrganizerCard from '../../../components/EventOrganizerCard';
import EventOrganizerModal from '../../../components/EventOrganizerModal';
import { getEventById, getEventOccurrences, getEventOffers, validateEventOffer } from '../../../config/supabase';
import { PremiumColors } from '../../../constants/Colors';

const { width, height } = Dimensions.get('window');

interface TimeSlot {
  id: string;
  time: string; // Display time (12-hour format)
  timeString?: string; // Database time (24-hour format)
  available: boolean;
  price?: number;
  status?: 'available' | 'full' | 'blocked';
  reason?: string;
}

interface TimeSection {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  timeRange: string;
  timeSlots: TimeSlot[];
}

export default function BookFreeEventScreen() {
  const { id, guestCount, occurrenceId } = useLocalSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSection, setSelectedTimeSection] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableTimeSections, setAvailableTimeSections] = useState<TimeSection[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [validOffers, setValidOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [showOffers, setShowOffers] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Animation effect
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (event?.id) {
      loadOccurrences();
    }
  }, [event]);

  useEffect(() => {
    if (selectedOccurrence) {
      loadTimeSections();
      loadOffers();
    }
  }, [selectedOccurrence, selectedTimeSection]);

  useEffect(() => {
    if (selectedTimeSlot) {
      loadValidOffers();
    }
  }, [selectedTimeSlot, offers]);

  const loadEvent = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const result = await getEventById(id as string);
      
      if (result.data) {
        setEvent(result.data);
      } else {
        console.error('Event not found:', result.error);
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
      console.log('📅 Loading occurrences for free event:', event.id);
      
      const { data, error } = await getEventOccurrences(event.id);
      
      if (error) {
        console.error('❌ Error loading occurrences:', error);
        setOccurrences([]);
        setSelectedOccurrence(null);
      } else if (data && data.length > 0) {
        console.log('✅ Loaded occurrences for free event:', data.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 ALL OCCURRENCES FOR THIS EVENT:');
        data.forEach((occ: any, index: number) => {
          console.log(`\n[${index + 1}] Occurrence ID: ${occ.id}`);
          console.log(`   📆 Date: ${occ.occurrence_date}`);
          console.log(`   🔢 Start UTC: ${occ.start_utc_timestamp}`);
          console.log(`   🔢 End UTC: ${occ.end_utc_timestamp}`);
          console.log(`   🇮🇳 Start IST: ${new Date(occ.start_utc_timestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
          console.log(`   🇮🇳 End IST: ${new Date(occ.end_utc_timestamp * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        setOccurrences(data);
        
        // If occurrenceId is passed from events page, use it, otherwise use first occurrence
        if (occurrenceId) {
          const preSelectedOccurrence = data.find((occ: any) => occ.id === occurrenceId);
          setSelectedOccurrence(preSelectedOccurrence || data[0]);
          if (preSelectedOccurrence) {
            setSelectedDate(new Date(preSelectedOccurrence.occurrence_date));
          }
        } else {
          setSelectedOccurrence(data[0]);
          setSelectedDate(new Date(data[0].occurrence_date));
        }
      } else {
        console.log('ℹ️ No occurrences found for free event');
        setOccurrences([]);
        setSelectedOccurrence(null);
      }
    } catch (error) {
      console.error('❌ Exception loading occurrences:', error);
      setOccurrences([]);
      setSelectedOccurrence(null);
    }
  };

  const loadOffers = async () => {
    if (!event?.id) return;
    
    try {
      console.log('🎁 Loading offers for event:', event.id);
      const result = await getEventOffers(event.id);
      if (result.data) {
        console.log('✅ Loaded', result.data.length, 'offers');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 ALL OFFERS FOR THIS EVENT:');
        result.data.forEach((offer: any, index: number) => {
          console.log(`\n[${index + 1}] Offer ID: ${offer.id}`);
          console.log(`   📝 Title: ${offer.title}`);
          console.log(`   🎯 Type: ${offer.discount_type}`);
          console.log(`   ✅ Active: ${offer.is_active}`);
          console.log(`   📅 Valid From: ${offer.valid_from || 'N/A'}`);
          console.log(`   📅 Valid Until: ${offer.valid_until || 'N/A'}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        setOffers(result.data);
        
        // Check for specific offer
        const specificOffer = result.data.find((offer: any) => offer.id === 'dcb6d9fb-b586-4de6-917b-8dbf5b0767b8');
        if (specificOffer) {
          console.log('✅ Found requested offer:', specificOffer.title);
        } else {
          console.log('❌ Requested offer dcb6d9fb-b586-4de6-917b-8dbf5b0767b8 not found in results');
        }
      } else {
        console.log('⚠️ No offers found for event');
      }
    } catch (error) {
      console.error('❌ Error loading event offers:', error);
    }
  };

  const loadTimeSections = async () => {
    if (!event) return;
    
    setLoadingSlots(true);
    
    // Generate time sections based on event type and times
    const timeSections = generateTimeSections();
    setAvailableTimeSections(timeSections);
    
    // Auto-select first available section
    if (timeSections.length > 0 && !selectedTimeSection) {
      setSelectedTimeSection(timeSections[0].id);
    }
    
    setLoadingSlots(false);
  };

  const generateTimeSections = (): TimeSection[] => {
    // Safety check: return empty array if occurrence is not selected
    if (!selectedOccurrence || !selectedOccurrence.start_utc_timestamp || !selectedOccurrence.end_utc_timestamp) {
      console.log('⚠️ No occurrence selected or missing timestamps');
      return [];
    }
    
    // Convert UTC timestamps to Date objects
    const startTime = new Date(selectedOccurrence.start_utc_timestamp * 1000);
    const endTime = new Date(selectedOccurrence.end_utc_timestamp * 1000);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 OCCURRENCE TIMING DEBUG');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🆔 Occurrence ID:', selectedOccurrence.id);
    console.log('📆 Occurrence Date:', selectedOccurrence.occurrence_date);
    console.log('🔢 Start UTC Timestamp:', selectedOccurrence.start_utc_timestamp);
    console.log('🔢 End UTC Timestamp:', selectedOccurrence.end_utc_timestamp);
    console.log('🌍 Start Time (UTC):', new Date(selectedOccurrence.start_utc_timestamp * 1000).toUTCString());
    console.log('🌍 End Time (UTC):', new Date(selectedOccurrence.end_utc_timestamp * 1000).toUTCString());
    console.log('🇮🇳 Start Time (IST/Local):', startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('🇮🇳 End Time (IST/Local):', endTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    console.log('🕐 Display Time:', startTime.toLocaleTimeString(), 'to', endTime.toLocaleTimeString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Determine which time section this event falls into and create appropriate section
    const sections: TimeSection[] = [];
    
    // Convert to hours for easy comparison
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    
    // Define section based on event time
    let sectionId: string;
    let displayName: string;
    let icon: string;
    
    if (startHour >= 6 && startHour < 12) {
      sectionId = 'morning';
      displayName = 'Morning';
      icon = '🌅';
    } else if (startHour >= 12 && startHour < 18) {
      sectionId = 'afternoon';
      displayName = 'Afternoon';
      icon = '🌆';
    } else {
      sectionId = 'evening';
      displayName = 'Evening';
      icon = '🌙';
    }
    
    // Format time range for display
    const startTimeFormatted = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTimeFormatted = endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    sections.push({
      id: sectionId,
      name: sectionId,
      displayName: displayName,
      icon: icon,
      timeRange: `${startTimeFormatted} - ${endTimeFormatted}`,
      timeSlots: generateTimeSlots(
        startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), 
        endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), 
        sectionId
      )
    });
    
    return sections;
  };

  const generateTimeSlots = (startTime: string, endTime: string, sectionId: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    // Get current time for filtering past slots
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    let current = new Date(start);
    let slotId = 1;
    
    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5); // "09:00"
      const slotTimeInMinutes = current.getHours() * 60 + current.getMinutes();
      
      // Skip past time slots if this is today
      if (isToday && slotTimeInMinutes <= currentTime) {
        current.setMinutes(current.getMinutes() + 30);
        continue;
      }
      
      const displayTime = current.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      slots.push({
        id: `${sectionId}-${slotId}`,
        time: displayTime,
        timeString: timeString,
        available: true,
        status: 'available'
      });
      
      // Add 30 minutes
      current.setMinutes(current.getMinutes() + 30);
      slotId++;
    }
    
    return slots;
  };

  // Generate date options for the event
  const generateDateOptions = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    // Safety check: return empty array if event is not loaded yet
    if (!event) {
      return dates;
    }
    
    if (event.event_type === 'one_day') {
      // Single day event - only show if it's today or in the future
      const eventDate = new Date(event.event_date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate >= today) {
        dates.push(new Date(event.event_date));
      }
    } else if (event.event_type === 'multi_day' && event.event_end_date) {
      // Multi-day event - show days from today until end date
      const startDate = new Date(event.event_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(event.event_end_date);
      endDate.setHours(0, 0, 0, 0);
      
      // Start from today if event has already started, otherwise from event start date
      const actualStartDate = startDate >= today ? startDate : today;
      
      let currentDate = new Date(actualStartDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (event.event_type === 'daily_event') {
      // Daily event - show next 30 days starting from today
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
    }
    return dates;
  };

  // Use occurrences from database instead of generating dates
  const dateOptions = useMemo(() => {
    return occurrences.map(occ => new Date(occ.occurrence_date));
  }, [occurrences]);

  // Helper function to format offers for display  
  const formatOfferForDisplay = (offer: any) => {
    const isPercentage = offer.discount_type === 'percentage';
    const isBogo = offer.discount_type === 'bogo';
    const isFlat = offer.discount_type === 'flat';
    
    // Use title from database instead of generating it
    let title = offer.title || '';
    let subtitle = '';
    let color = '#FF6B35';
    let bgColor = '#FFF4F0';
    
    // Get cover charge and guest requirements from conditions
    const coverCharge = offer.conditions?.[offer.discount_type]?.cover_charge || 0;
    const guestRequired = offer.conditions?.[offer.discount_type]?.guest_required || 0;
    
    if (isPercentage) {
      if (coverCharge > 0) {
        subtitle = `Cover charge ₹${coverCharge}/guest (redeemable)`;
      } else {
        subtitle = guestRequired > 0 ? `Minimum ${guestRequired} guests required` : 'On total bill amount';
      }
      color = '#4CAF50';
      bgColor = '#F0FFF4';
    } else if (isBogo) {
      subtitle = offer.description || 'On selected items';
      if (guestRequired > 0) {
        subtitle += ` • Min ${guestRequired} guests`;
      }
      color = '#2196F3';
      bgColor = '#F0F8FF';
    } else if (isFlat) {
      const minOrderValue = offer.conditions?.flat?.min_order_value;
      subtitle = minOrderValue 
        ? `Above ₹${minOrderValue}` 
        : 'On your order';
      if (guestRequired > 0) {
        subtitle += ` • Min ${guestRequired} guests`;
      }
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
    
    // Use local date string to avoid timezone issues
    const bookingDate = selectedDate.getFullYear() + '-' + 
                       String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(selectedDate.getDate()).padStart(2, '0');
    
    console.log('🔍 Loading valid event offers DEBUG:', {
      selectedDate: selectedDate.toString(),
      selectedDateISO: selectedDate.toISOString().split('T')[0],
      bookingDateLocal: bookingDate,
      dayOfWeek: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][selectedDate.getDay()],
      time: selectedTimeSlot.timeString || selectedTimeSlot.time,
      partySize: guestCount
    });
    const bookingTime = selectedTimeSlot.timeString || selectedTimeSlot.time;
    const partySize = parseInt(guestCount?.toString() || '2');
    
    const validatedOffers = [];
    for (const offer of offers) {
      console.log('🎯 Validating event offer:', offer.title);
      const { valid, reason } = await validateEventOffer(offer.id, bookingDate, bookingTime, partySize);
      
      if (valid) {
        console.log('✅ Event offer valid:', offer.title);
        validatedOffers.push(formatOfferForDisplay(offer));
      } else {
        console.log('❌ Event offer invalid:', offer.title, reason);
      }
    }
    
    console.log('📋 Valid event offers found:', validatedOffers.length);
    setValidOffers(validatedOffers);
    
    // Clear selected offer if it's no longer valid
    if (selectedOffer && !validatedOffers.find(offer => offer.id === selectedOffer.id)) {
      setSelectedOffer(null);
    }
  };

  const handleContinue = () => {
    if (!selectedTimeSlot || !event || !selectedOccurrence) {
      console.log('⚠️ Cannot continue: Missing required data');
      return;
    }

    console.log('🚀 HandleContinue - Event Info:', { id: event?.id, name: event?.title });
    console.log('📅 Selected Occurrence:', selectedOccurrence);
    console.log('🎯 Selected Time Slot:', selectedTimeSlot);
    console.log('🎁 Selected Offer:', selectedOffer);

    const partySize = parseInt(guestCount?.toString() || '2');
    const coverChargePerPerson = selectedOffer?.coverChargePerPerson || 0;
    const totalCoverCharge = coverChargePerPerson * partySize;

    router.push({
      pathname: '/events/event-summary',
      params: {
        eventId: event.id,
        eventTitle: event.title,
        eventImage: event.cover_image_url,
        eventLocation: event.venue || 'Event Location',
        date: selectedDate.toISOString(),
        occurrenceId: selectedOccurrence.id,
        timeSlot: selectedTimeSlot.timeString || selectedTimeSlot.time,
        timeSection: selectedTimeSection,
        guests: guestCount?.toString() || '2',
        selectedOfferId: selectedOffer?.originalOffer?.id || '',
        selectedOfferTitle: selectedOffer?.title || '',
        coverChargePerPerson: coverChargePerPerson,
        totalCoverCharge: totalCoverCharge,
        offerDetails: JSON.stringify(selectedOffer || {})
      }
    });
  };

  // Helper function to check if all time slots are sold out for a date
  const isDateSoldOut = (date: Date): boolean => {
    if (!event) return false;
    
    const now = new Date();
    const isDateToday = date.toDateString() === now.toDateString();
    
    // Only check sold out status for today
    if (!isDateToday) return false;
    
    // Check if all time slots would be filtered out (past times)
    const eventStartTime = event.start_time; // "07:00:00"
    const eventEndTime = event.end_time; // "20:30:00"
    
    const start = new Date(`2000-01-01T${eventStartTime}`);
    const end = new Date(`2000-01-01T${eventEndTime}`);
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    let hasAvailableSlots = false;
    let current = new Date(start);
    
    while (current < end) {
      const slotTimeInMinutes = current.getHours() * 60 + current.getMinutes();
      
      // If we find any slot that's not in the past, it's not sold out
      if (slotTimeInMinutes > currentTime) {
        hasAvailableSlots = true;
        break;
      }
      
      current.setMinutes(current.getMinutes() + 30);
    }
    
    return !hasAvailableSlots;
  };

  const renderDateItem = ({ item: date }: { item: Date }) => {
    const isSelected = selectedDate.toDateString() === date.toDateString();
    const isToday = new Date().toDateString() === date.toDateString();
    const isSoldOut = isDateSoldOut(date);
    
    // Find the corresponding occurrence for this date
    const occurrence = occurrences.find(occ => 
      new Date(occ.occurrence_date).toDateString() === date.toDateString()
    );
    
    // Show month for dates in different month
    const today = new Date();
    const showMonth = date.getMonth() !== today.getMonth();

    return (
      <TouchableOpacity
        style={[
          styles.dateItem, 
          isSelected && styles.selectedDateItem,
          isSoldOut && styles.soldOutDateItem
        ]}
        onPress={() => {
          if (!isSoldOut && occurrence) {
            setSelectedDate(date);
            setSelectedOccurrence(occurrence);
            console.log('📅 Selected occurrence:', occurrence.id, 'Date:', date.toDateString());
          }
        }}
        disabled={isSoldOut}
      >
        <Text style={[
          styles.dateDay, 
          isSelected && styles.selectedDateText,
          isSoldOut && styles.soldOutDateText
        ]}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </Text>
        <Text style={[
          styles.dateNumber, 
          isSelected && styles.selectedDateText,
          isSoldOut && styles.soldOutDateText
        ]}>
          {date.getDate()}
        </Text>
        {showMonth && (
          <Text style={[
            styles.monthLabel, 
            isSelected && styles.selectedDateText,
            isSoldOut && styles.soldOutDateText
          ]}>
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
        )}
        {isToday && !isSoldOut && (
          <Text style={[styles.todayLabel, isSelected && styles.selectedTodayLabel]}>
            Today
          </Text>
        )}
        {isSoldOut && (
          <Text style={styles.soldOutLabel}>
            Sold Out
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = ({ item: slot }: { item: TimeSlot }) => {
    const isSelected = selectedTimeSlot?.id === slot.id;
    const isAvailable = slot.status === 'available';

    return (
      <TouchableOpacity
        style={[
          styles.timeSlot,
          isSelected && styles.selectedTimeSlot,
          !isAvailable && styles.unavailableTimeSlot,
        ]}
        onPress={() => isAvailable && setSelectedTimeSlot(slot)}
        disabled={!isAvailable}
      >
        <Text style={[
          styles.timeSlotText,
          isSelected && styles.selectedTimeSlotText,
          !isAvailable && styles.unavailableTimeSlotText,
        ]}>
          {slot.time}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </View>
    );
  }

  const currentTimeSection = availableTimeSections.find(section => section.id === selectedTimeSection);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Event</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <Image source={{ uri: event.cover_image_url }} style={styles.eventImage} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>{event.title}</Text>
            <View style={styles.eventTypeContainer}>
              <Text style={styles.eventType}>
                {event.event_type === 'daily_event' ? 'Daily Event' : 
                 event.event_type === 'multi_day' ? 'Multi-Day Event' : 'One Day Event'}
              </Text>
              <Text style={styles.freeLabel}>FREE</Text>
            </View>
            <Text style={styles.eventDescription}>{event.description}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <FlatList
            data={dateOptions}
            renderItem={renderDateItem}
            keyExtractor={(item) => item.toISOString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dateList}
            contentContainerStyle={styles.dateListContent}
          />
        </View>

        {/* Event Time Info */}
        {availableTimeSections.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Event Time</Text>
            <View style={styles.eventTimeContainer}>
              <Text style={styles.eventTimeIcon}>{availableTimeSections[0].icon}</Text>
              <View style={styles.eventTimeInfo}>
                <Text style={styles.eventTimeName}>{availableTimeSections[0].displayName}</Text>
                <Text style={styles.eventTimeRange}>{availableTimeSections[0].timeRange}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Time Slot Selection */}
        {currentTimeSection && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Time Slot</Text>
            {currentTimeSection.timeSlots.length > 0 ? (
              <FlatList
                data={currentTimeSection.timeSlots}
                renderItem={renderTimeSlot}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.timeSlotsGrid}
              />
            ) : (
              <View style={styles.soldOutContainer}>
                <Text style={styles.soldOutMessage}>All time slots are sold out for today</Text>
                <Text style={styles.soldOutSubMessage}>Please select a different date</Text>
              </View>
            )}
          </View>
        )}

        {/* Offers Section */}
        {selectedTimeSlot && validOffers.length > 0 && (
          <Animated.View 
            style={[styles.sectionCard, { opacity: fadeAnim }]}
          >
            <TouchableOpacity 
              style={styles.offersHeader}
              onPress={() => setShowOffers(!showOffers)}
            >
              <Text style={styles.sectionTitle}>Available Offers ({validOffers.length})</Text>
              <Ionicons 
                name={showOffers ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={PremiumColors.text.secondary} 
              />
            </TouchableOpacity>

            {showOffers && (
              <View style={styles.offersContainer}>
                {validOffers.map((displayOffer) => {
                  const isSelected = selectedOffer?.id === displayOffer.id;

                  return (
                    <TouchableOpacity
                      key={displayOffer.id}
                      style={[
                        styles.offerItem,
                        { backgroundColor: displayOffer.bgColor },
                        isSelected && styles.selectedOfferItem,
                      ]}
                      onPress={() => setSelectedOffer(isSelected ? null : displayOffer)}
                    >
                      <View style={styles.offerContent}>
                        <Text style={[styles.offerTitle, { color: displayOffer.color }]}>
                          {displayOffer.title}
                        </Text>
                        <View style={[styles.offerCheckbox, isSelected && styles.offerCheckboxSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={16} color={PremiumColors.background.primary} />}
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

        {/* Organizer Section */}
        {event?.organizer_id && (
          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <EventOrganizerCard
              organizerId={event.organizer_id}
              onPress={() => setShowOrganizerModal(true)}
            />
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Continue Button */}
      {selectedTimeSlot && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={PremiumColors.background.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Organizer Modal */}
      {event?.organizer_id && (
        <EventOrganizerModal
          visible={showOrganizerModal}
          organizerId={event.organizer_id}
          onClose={() => setShowOrganizerModal(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: PremiumColors.error,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: PremiumColors.background.secondary,
    margin: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventType: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    backgroundColor: PremiumColors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeLabel: {
    fontSize: 12,
    color: PremiumColors.success,
    backgroundColor: 'rgba(62, 193, 98, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  dateList: {
    marginHorizontal: -20,
  },
  dateListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dateItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: PremiumColors.background.tertiary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    minWidth: 70,
  },
  selectedDateItem: {
    backgroundColor: PremiumColors.accent.primary,
    borderColor: PremiumColors.accent.primary,
  },
  dateDay: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  selectedDateText: {
    color: PremiumColors.background.primary,
  },
  todayLabel: {
    fontSize: 10,
    color: PremiumColors.accent.primary,
    marginTop: 2,
  },
  selectedTodayLabel: {
    color: PremiumColors.background.primary,
  },
  eventTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: PremiumColors.background.tertiary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  eventTimeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  eventTimeInfo: {
    flex: 1,
  },
  eventTimeName: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  eventTimeRange: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  timeSlotsGrid: {
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    aspectRatio: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  selectedTimeSlot: {
    backgroundColor: PremiumColors.accent.primary,
    borderColor: PremiumColors.accent.primary,
  },
  unavailableTimeSlot: {
    backgroundColor: PremiumColors.background.tertiary,
    borderColor: PremiumColors.border,
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  selectedTimeSlotText: {
    color: PremiumColors.background.primary,
  },
  unavailableTimeSlotText: {
    color: PremiumColors.text.tertiary,
  },
  availabilityText: {
    fontSize: 10,
    color: PremiumColors.text.tertiary,
    marginTop: 2,
  },
  selectedAvailabilityText: {
    color: PremiumColors.background.primary,
  },
  unavailableAvailabilityText: {
    color: PremiumColors.text.tertiary,
  },
  offersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offersContainer: {
    gap: 12,
  },
  offerItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOfferItem: {
    borderColor: PremiumColors.accent.primary,
  },
  offerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  offerSubtitle: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 12,
    color: PremiumColors.text.tertiary,
    marginBottom: 4,
  },
  offerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PremiumColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerCheckboxSelected: {
    backgroundColor: PremiumColors.accent.primary,
    borderColor: PremiumColors.accent.primary,
  },
  footer: {
    backgroundColor: PremiumColors.background.secondary,
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.background.primary,
  },
  // Sold out styles
  soldOutDateItem: {
    backgroundColor: PremiumColors.background.tertiary,
    borderColor: PremiumColors.border,
    opacity: 0.5,
  },
  soldOutDateText: {
    color: PremiumColors.text.tertiary,
  },
  monthLabel: {
    fontSize: 10,
    color: PremiumColors.text.tertiary,
    marginTop: 2,
  },
  soldOutLabel: {
    fontSize: 10,
    color: PremiumColors.error,
    marginTop: 2,
    fontWeight: '600',
  },
  soldOutContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  soldOutMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  soldOutSubMessage: {
    fontSize: 14,
    color: PremiumColors.text.tertiary,
    textAlign: 'center',
  },
});
