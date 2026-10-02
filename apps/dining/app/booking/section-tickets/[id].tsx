import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { EventTicketType, TicketCard } from '../../../components/Tickets';
import { ReservationTimer } from '../../../components/ReservationTimer';
import { useAuth } from '../../../contexts/AuthContext';
import { getEventById, getOccurrenceById, getTicketsForSection, supabase } from '../../../config/supabase';
import { PremiumColors } from '../../../constants/Colors';
import { calculateEventT1Breakdown } from '../../../utils/feeCalculator';
import { 
  createTicketReservation, 
  cancelUserReservations, 
  confirmReservations,
  getEarliestReservationExpiry,
  getUserEventReservations,
  updateReservationQuantity
} from '../../../utils/reservationManager';

const { width } = Dimensions.get('window');

export default function SectionTicketsScreen() {
  const { 
    id, 
    occurrenceId, 
    sectionId, 
    sectionName,
    eventTitle,
    eventImage,
    eventVenue,
    eventDate,
    eventTime,
  } = useLocalSearchParams();

  const { user } = useAuth(); // Get user from AuthContext
  const [tickets, setTickets] = useState<EventTicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
  const [event, setEvent] = useState<any>(null);
  const [occurrence, setOccurrence] = useState<any>(null);
  
  // Reservation management
  const [reservations, setReservations] = useState<{[ticketId: string]: string}>({});
  const [reservationExpiry, setReservationExpiry] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id, sectionId, occurrenceId]);

  // Load existing reservations when user and event are available
  useEffect(() => {
    if (user?.id && id) {
      loadExistingReservations();
    }
  }, [user?.id, id]);

  const loadData = async () => {
    if (!sectionId || !occurrenceId || !id) {
      console.warn('⚠️ Cannot load data: missing required parameters');
      return;
    }

    try {
      setLoading(true);
      console.log('📥 Loading event and ticket data...');

      // Load event data to get venue information
      const eventResult = await getEventById(id as string);
      if (eventResult.error || !eventResult.data) {
        console.error('❌ Error loading event:', eventResult.error);
        Alert.alert('Error', 'Failed to load event details');
        return;
      }
      setEvent(eventResult.data);
      console.log('✅ Event loaded:', eventResult.data.title);

      // Load occurrence data
      const occurrenceResult = await getOccurrenceById(occurrenceId as string);
      if (occurrenceResult.error || !occurrenceResult.data) {
        console.error('❌ Error loading occurrence:', occurrenceResult.error);
        Alert.alert('Error', 'Failed to load event occurrence');
        return;
      }
      setOccurrence(occurrenceResult.data);
      console.log('✅ Occurrence loaded:', occurrenceResult.data.occurrence_date);

      // Load tickets for section
      console.log('🎫 Loading tickets for section:', sectionName);
      const ticketsResult = await getTicketsForSection(sectionId as string, occurrenceId as string);
      
      if (ticketsResult.error) {
        console.error('❌ Error loading tickets:', ticketsResult.error);
        Alert.alert('Error', 'Failed to load tickets for this section.');
        setTickets([]);
      } else if (ticketsResult.data) {
        console.log('✅ Tickets loaded:', ticketsResult.data.length);
        setTickets(ticketsResult.data);
      }
    } catch (error) {
      console.error('❌ Exception loading data:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingReservations = async () => {
    if (!user?.id || !id) return;

    try {
      console.log('🔄 Loading existing reservations for event:', id);
      
      const existingReservations = await getUserEventReservations(user.id, id as string);
      
      if (existingReservations.length > 0) {
        console.log('✅ Found existing reservations:', existingReservations.length);
        
        // Restore selected tickets state
        const ticketQuantities: {[key: string]: number} = {};
        const reservationIds: {[key: string]: string} = {};
        let earliestExpiry: string | null = null;
        
        existingReservations.forEach((res: any) => {
          // Accumulate quantities for same ticket type
          ticketQuantities[res.ticket_type_id] = 
            (ticketQuantities[res.ticket_type_id] || 0) + res.quantity;
          
          // Store reservation ID (last one for each ticket type)
          reservationIds[res.ticket_type_id] = res.id;
          
          // Track earliest expiry
          if (!earliestExpiry || res.expires_at < earliestExpiry) {
            earliestExpiry = res.expires_at;
          }
        });
        
        setSelectedTickets(ticketQuantities);
        setReservations(reservationIds);
        setReservationExpiry(earliestExpiry);
        
        console.log('✅ Restored reservation state:', {
          tickets: ticketQuantities,
          expiry: earliestExpiry
        });
      } else {
        console.log('ℹ️ No existing reservations found');
      }
    } catch (error) {
      console.error('❌ Error loading existing reservations:', error);
    }
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, count]) => {
      const ticket = tickets.find((t: any) => t.id === ticketId);
      const price = ticket?.price ? (typeof ticket.price === 'string' ? parseFloat(ticket.price) : ticket.price) : 0;
      return total + (price * count);
    }, 0);
  };

  const getTotalTicketsCount = () => {
    return Object.values(selectedTickets).reduce((total, count) => total + count, 0);
  };

  // Handle ticket quantity change with reservation
  const handleTicketQuantityChange = async (ticketId: string, newQuantity: number) => {
    if (!user?.id || !id) {
      Alert.alert('Error', 'Please log in to book tickets');
      return;
    }

    const currentQuantity = selectedTickets[ticketId] || 0;
    const quantityDiff = newQuantity - currentQuantity;

    if (quantityDiff === 0) return;

    try {
      const existingReservationId = reservations[ticketId];

      if (quantityDiff > 0) {
        // User is adding tickets - update existing or create new
        let result;
        if (existingReservationId) {
          console.log('🔄 Updating existing reservation:', existingReservationId);
          result = await updateReservationQuantity(existingReservationId, newQuantity);
        } else {
          console.log('🆕 Creating new reservation');
          result = await createTicketReservation(
            user.id,
            id as string,
            ticketId,
            newQuantity,
            occurrenceId as string
          );
        }

        if (!result.success) {
          Alert.alert('Unavailable', result.error || 'Could not reserve tickets');
          return;
        }

        setReservations(prev => ({
          ...prev,
          [ticketId]: result.data!.id
        }));

        if (result.data?.expires_at) {
          setReservationExpiry(result.data.expires_at);
        }

        setSelectedTickets(prev => ({
          ...prev,
          [ticketId]: newQuantity
        }));
      } else {
        // User is removing tickets
        if (newQuantity === 0) {
          // Remove all - cancel reservation
          if (existingReservationId) {
            await cancelUserReservations(user.id, id as string);
            setReservations(prev => {
              const newReservations = { ...prev };
              delete newReservations[ticketId];
              return newReservations;
            });
          }
          
          setSelectedTickets(prev => {
            const newTickets = { ...prev };
            delete newTickets[ticketId];
            return newTickets;
          });
        } else {
          // Partial removal - update existing reservation
          if (existingReservationId) {
            console.log('🔄 Updating reservation quantity to:', newQuantity);
            const result = await updateReservationQuantity(existingReservationId, newQuantity);
            
            if (result.success && result.data) {
              setReservationExpiry(result.data.expires_at);
            }
          }

          setSelectedTickets(prev => ({
            ...prev,
            [ticketId]: newQuantity
          }));
        }
      }

      if (id && user?.id) {
        const expiry = await getEarliestReservationExpiry(user.id, id as string);
        setReservationExpiry(expiry);
      }
    } catch (error) {
      console.error('❌ Error handling ticket quantity change:', error);
      Alert.alert('Error', 'Failed to update ticket selection');
    }
  };

  const handleReservationExpire = () => {
    Alert.alert(
      'Reservation Expired',
      'Your ticket reservation has expired. Please select your tickets again.',
      [{ text: 'OK', onPress: () => {
        setSelectedTickets({});
        setReservations({});
        setReservationExpiry(null);
      }}]
    );
  };

  const getVenueInfo = () => {
    console.log('🏢 Getting venue info...');
    console.log('🏢 Event data:', event);
    console.log('🏢 Event venue:', event?.event_venue);
    
    // Check if event_venue is an array (from join) or object
    const eventVenue = Array.isArray(event?.event_venue) ? event.event_venue[0] : event?.event_venue;
    
    if (eventVenue?.venue_data) {
      const venueData = eventVenue.venue_data;
      console.log('🏢 Venue data found:', venueData);
      
      if (venueData.name && venueData.city) {
        return `${venueData.name}, ${venueData.city}`;
      }
      if (venueData.name) {
        return venueData.name;
      }
      if (venueData.city) {
        return venueData.city;
      }
    }
    
    // Fallback to restaurant if no venue_data
    if (eventVenue?.restaurants) {
      const restaurant = eventVenue.restaurants;
      console.log('🏢 Using restaurant data:', restaurant);
      
      if (restaurant.name && restaurant.city) {
        return `${restaurant.name}, ${restaurant.city}`;
      }
      if (restaurant.name) {
        return restaurant.name;
      }
    }
    
    console.log('🏢 No venue data found, using fallback');
    return 'Venue details not available';
  };

  const formatOccurrenceDate = () => {
    if (!occurrence?.occurrence_date) {
      return eventDate as string || 'Date not available';
    }
    
    const date = new Date(occurrence.occurrence_date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = () => {
    // Get time from event, not occurrence (occurrence doesn't have time fields)
    if (event?.start_time) {
      return event.start_time;
    }
    return eventTime as string || '';
  };

  const handleContinue = async () => {
    const totalTickets = getTotalTicketsCount();
    if (totalTickets === 0) {
      Alert.alert('No Tickets Selected', 'Please select at least one ticket to continue.');
      return;
    }

    // Prepare ticket details for the summary page
    const selectedTicketDetails = Object.entries(selectedTickets)
      .filter(([_, count]) => count > 0)
      .map(([ticketId, count]) => {
        const ticket = tickets.find((t: any) => t.id === ticketId);
        const price = ticket?.price ? (typeof ticket.price === 'string' ? parseFloat(ticket.price) : ticket.price) : 0;
        return {
          id: ticketId,
          name: ticket?.name || '',
          price: price,
          quantity: count,
          ticket_cover_amount: ticket?.ticket_cover_amount || 0,
          ticket_cover_enabled: ticket?.ticket_cover_enabled || false,
          section_name: sectionName as string,
          section_id: sectionId as string,
        };
      });

    const totalAmount = getTotalAmount();

    // ✅ Calculate convenience fee dynamically before navigation
    let convenienceFee = Math.round(totalAmount * 0.05); // Default 5%
    
    try {
      // Fetch event fee settings
      const { data: eventData, error } = await supabase
        .from('events')
        .select(`
          commission_rate,
          t1_convenience_fee_enabled,
          t1_convenience_fee_type,
          t1_convenience_fee_value,
          t1_convenience_fee_rules,
          t1_min_fee_enabled,
          t1_min_convenience_fee,
          t1_max_fee_enabled,
          t1_max_convenience_fee
        `)
        .eq('id', id)
        .single();

      if (!error && eventData) {
        console.log('✅ Fetched event fee settings for section tickets:', eventData);
        
        // Calculate dynamic convenience fee - pass event object
        const breakdown = calculateEventT1Breakdown(totalAmount, eventData);
        
        convenienceFee = breakdown.convenienceFee;
        console.log('✅ Calculated dynamic convenience fee for section tickets:', convenienceFee);
      }
    } catch (error) {
      console.error('❌ Error calculating convenience fee:', error);
      // Use default 5% fallback
    }

    // Navigate to event summary
    router.push({
      pathname: '/events/event-summary',
      params: {
        eventId: id as string,
        eventTitle: event?.title || eventTitle as string,
        eventSubtitle: `${sectionName} Section`,
        eventImage: event?.cover_image_url || eventImage as string,
        eventVenue: getVenueInfo(),
        eventLocation: getVenueInfo(), // Same as venue for consistency
        eventDate: occurrence?.occurrence_date || eventDate as string, // Pass raw date string
        eventTime: event?.start_time || eventTime as string, // Fallback to event time
        eventEndTime: event?.end_time || '', // Fallback to event end time
        startTimestamp: occurrence?.start_utc_timestamp?.toString() || '', // Pass Unix timestamp
        endTimestamp: occurrence?.end_utc_timestamp?.toString() || '', // Pass Unix timestamp
        ticketDetails: JSON.stringify(selectedTicketDetails),
        totalAmount: totalAmount.toString(),
        convenienceFee: convenienceFee.toString(), // ✅ Pass calculated convenience fee
        orderId: `ORD${Date.now()}`,
        occurrenceId: occurrenceId as string,
        bookingType: 'layout',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
        <Text style={styles.loadingText}>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{sectionName}</Text>
          <Text style={styles.headerSubtitle}>Select your tickets</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Info Card */}
        {event && (
          <View style={styles.eventInfoCard}>
            <View style={styles.eventInfoContent}>
              <View style={styles.eventTextInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {event.title || eventTitle}
                </Text>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location" size={16} color={PremiumColors.accent.secondary} />
                  <Text style={styles.eventDetailText} numberOfLines={1}>
                    {getVenueInfo()}
                  </Text>
                </View>
                <View style={styles.eventDetailRow}>
                  <Ionicons name="calendar" size={16} color={PremiumColors.accent.secondary} />
                  <Text style={styles.eventDetailText}>
                    {formatOccurrenceDate()}
                  </Text>
                </View>
              </View>
              <View style={styles.eventImageContainer}>
                <Image
                  source={{ 
                    uri: event.cover_image_url || eventImage as string || 'https://via.placeholder.com/150'
                  }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        )}

        {/* Tickets List */}
        <View style={styles.ticketsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Tickets</Text>
            {reservationExpiry && (
              <ReservationTimer 
                expiresAt={reservationExpiry} 
                onExpire={handleReservationExpire}
                compact={false}
              />
            )}
          </View>
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                selectedQuantity={selectedTickets[ticket.id] || 0}
                onQuantityChange={handleTicketQuantityChange}
                showQuantitySelector={true}
                compact={false}
              />
            ))
          ) : (
            <View style={styles.noTicketsContainer}>
              <Ionicons name="ticket-outline" size={48} color={PremiumColors.text.tertiary} style={{ marginBottom: 12 }} />
              <Text style={styles.noTicketsText}>No tickets available for this section.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      {tickets.length > 0 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            onPress={handleContinue}
            style={[
              styles.continueButton,
              (getTotalTicketsCount() === 0 || getTotalAmount() === 0) && styles.disabledContinueButton
            ]}
            disabled={getTotalTicketsCount() === 0 || getTotalAmount() === 0}
          >
            <LinearGradient
              colors={[PremiumColors.accent.secondary, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                Continue ({getTotalTicketsCount()}) • ₹{getTotalAmount().toFixed(0)}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PremiumColors.text.secondary,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  eventInfoCard: {
    margin: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventInfoContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  eventTextInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventImageContainer: {
    width: 80,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.tertiary,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 12,
    lineHeight: 22,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  ticketsContainer: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  noTicketsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  noTicketsText: {
    fontSize: 15,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: PremiumColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  disabledContinueButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

