import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
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
import { getEventById, getEventOccurrences, getOccurrenceById, getTicketsForOccurrence, supabase } from '../../../config/supabase';
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

// Helper function to format time from UTC timestamp
const formatTimeFromTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to group occurrences by date
const groupOccurrencesByDate = (occurrences: any[]) => {
  const groups: {[key: string]: any[]} = {};
  occurrences.forEach((occ) => {
    const date = occ.occurrence_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(occ);
  });
  
  // Sort time slots within each date
  Object.keys(groups).forEach((date) => {
    groups[date].sort((a, b) => a.start_utc_timestamp - b.start_utc_timestamp);
  });
  
  return groups;
};

export default function BookTicketsScreen() {
  const { id, occurrenceId } = useLocalSearchParams();
  const { user } = useAuth(); // Get user from AuthContext
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [occurrence, setOccurrence] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateGroups, setDateGroups] = useState<{[key: string]: any[]}>({});
  
  // Reservation management
  const [reservations, setReservations] = useState<{[ticketId: string]: string}>({}); // ticketId -> reservationId
  const [reservationExpiry, setReservationExpiry] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  useEffect(() => {
    if (event?.id) {
      loadOccurrences();
    }
  }, [event]);

  useEffect(() => {
    if (selectedOccurrence?.id) {
      // Clear selected tickets when occurrence changes
      setSelectedTickets({});
      loadOccurrenceAndTickets(selectedOccurrence.id);
    }
  }, [selectedOccurrence]);

  // Load existing reservations when user and event are available
  useEffect(() => {
    if (user?.id && event?.id) {
      loadExistingReservations();
    }
  }, [user?.id, event?.id]);

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
      console.log('📅 Loading occurrences for booking page:', event.id);
      
      const { data, error } = await getEventOccurrences(event.id);
      
      if (error) {
        console.error('❌ Error loading occurrences:', error);
        setOccurrences([]);
        setDateGroups({});
        setSelectedDate(null);
        setSelectedOccurrence(null);
      } else if (data && data.length > 0) {
        console.log('✅ Loaded occurrences for booking:', data.length);
        setOccurrences(data);
        
        // Group occurrences by date
        const groups = groupOccurrencesByDate(data);
        setDateGroups(groups);
        
        // Only pre-select if occurrenceId is passed from events page
        if (occurrenceId) {
          const preSelectedOccurrence = data.find((occ: any) => occ.id === occurrenceId);
          if (preSelectedOccurrence) {
            setSelectedDate(preSelectedOccurrence.occurrence_date);
            setSelectedOccurrence(preSelectedOccurrence);
          } else {
            // If occurrenceId not found, don't auto-select anything
            setSelectedDate(null);
            setSelectedOccurrence(null);
          }
        } else {
          // No auto-selection - user must manually select date and time
          setSelectedDate(null);
          setSelectedOccurrence(null);
        }
      } else {
        console.log('ℹ️ No occurrences found for booking');
        setOccurrences([]);
        setDateGroups({});
        setSelectedDate(null);
        setSelectedOccurrence(null);
      }
    } catch (error) {
      console.error('❌ Exception loading occurrences:', error);
      setOccurrences([]);
      setDateGroups({});
      setSelectedDate(null);
      setSelectedOccurrence(null);
    }
  };

  const loadOccurrenceAndTickets = async (occId: string) => {
    if (!event?.id || !occId) return;
    
    try {
      console.log('🎟️ Loading occurrence and tickets for:', occId);
      
      // Load occurrence details
      const occurrenceResult = await getOccurrenceById(occId);
      if (occurrenceResult.data) {
        setOccurrence(occurrenceResult.data);
        console.log('✅ Loaded occurrence:', occurrenceResult.data);
      }
      
      // Load tickets for this occurrence
      const ticketsResult = await getTicketsForOccurrence(event.id, occId);
      if (ticketsResult.data) {
        setTickets(ticketsResult.data);
        console.log('✅ Loaded tickets:', ticketsResult.data.length);
      } else {
        console.log('⚠️ No tickets found for occurrence');
        setTickets([]);
      }
    } catch (error) {
      console.error('❌ Error loading occurrence and tickets:', error);
      setTickets([]);
    }
  };

  const loadExistingReservations = async () => {
    if (!user?.id || !event?.id) return;

    try {
      console.log('🔄 Loading existing reservations for event:', event.id);
      
      const existingReservations = await getUserEventReservations(user.id, event.id);
      
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
  
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});

  // Handle ticket quantity change with reservation
  const handleTicketQuantityChange = async (ticketId: string, newQuantity: number) => {
    if (!user?.id || !event?.id) {
      Alert.alert('Error', 'Please log in to book tickets');
      return;
    }

    const currentQuantity = selectedTickets[ticketId] || 0;
    const quantityDiff = newQuantity - currentQuantity;

    if (quantityDiff === 0) return; // No change

    try {
      const existingReservationId = reservations[ticketId];

      if (quantityDiff > 0) {
        // User is adding tickets - update existing or create new reservation
        console.log(`➕ Adding ${quantityDiff} ticket(s) for ${ticketId}`);
        
        let result;
        if (existingReservationId) {
          // Update existing reservation
          console.log('🔄 Updating existing reservation:', existingReservationId);
          result = await updateReservationQuantity(existingReservationId, newQuantity);
        } else {
          // Create new reservation
          console.log('🆕 Creating new reservation');
          result = await createTicketReservation(
            user.id,
            event.id,
            ticketId,
            newQuantity,
            selectedOccurrence?.id
          );
        }

        if (!result.success) {
          Alert.alert('Unavailable', result.error || 'Could not reserve tickets');
          return;
        }

        // Store reservation ID
        setReservations(prev => ({
          ...prev,
          [ticketId]: result.data!.id
        }));

        // Update expiry time
        if (result.data?.expires_at) {
          setReservationExpiry(result.data.expires_at);
        }

        // Update selected tickets
        setSelectedTickets(prev => ({
          ...prev,
          [ticketId]: newQuantity
        }));

        console.log('✅ Reservation updated/created:', result.data!.id);
      } else {
        // User is removing tickets - update or cancel reservation
        console.log(`➖ Removing ${Math.abs(quantityDiff)} ticket(s) for ${ticketId}`);
        
        if (newQuantity === 0) {
          // Remove all tickets - cancel reservation
          if (existingReservationId) {
            await cancelUserReservations(user.id, event.id);
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

      // Update reservation expiry time
      if (event?.id && user?.id) {
        const expiry = await getEarliestReservationExpiry(user.id, event.id);
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

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  // Helper function to calculate ticket price based on cover charge logic
  const getTicketPrice = (ticket: any) => {
    if (ticket.ticket_cover_enabled) {
      return parseFloat(ticket.entry_fee_amount || 0) + parseFloat(ticket.ticket_cover_amount || 0);
    }
    return parseFloat(ticket.price || 0);
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, count]) => {
      const ticket = tickets.find((t: any) => t.id === ticketId);
      return total + (ticket ? getTicketPrice(ticket) * count : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((total, count) => total + count, 0);
  };

  const handleBooking = async () => {
    const totalTickets = getTotalTickets();
    const totalAmount = getTotalAmount();
    
    if (totalTickets === 0 || totalAmount === 0) {
      Alert.alert('No Tickets Selected', 'Please select at least one ticket');
      return;
    }

    // Check if user has active reservations
    if (Object.keys(reservations).length === 0) {
      Alert.alert('No Reservations', 'Please select tickets to continue');
      return;
    }

    console.log('🎫 HandleBooking - Event:', event?.title, event?.event_type);
    console.log('📅 HandleBooking - Selected Occurrence:', selectedOccurrence);
    console.log('📅 HandleBooking - Occurrence ID:', selectedOccurrence?.id);
    console.log('🎟️ HandleBooking - Active Reservations:', Object.keys(reservations).length);

    // Prepare ticket details for the order summary
    const selectedTicketDetails = Object.entries(selectedTickets)
      .filter(([_, count]) => count > 0)
      .map(([ticketId, count]) => {
        const ticket = tickets.find((t: any) => t.id === ticketId);
        return {
          id: ticketId,
          name: ticket?.name || '',
          price: ticket ? getTicketPrice(ticket) : 0,
          quantity: count,
          ticket_cover_amount: ticket?.ticket_cover_amount || 0,
          ticket_cover_enabled: ticket?.ticket_cover_enabled || false,
        };
      });

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
        .eq('id', event.id)
        .single();

      if (!error && eventData) {
        console.log('✅ Fetched event fee settings:', eventData);
        
        // Calculate dynamic convenience fee - pass event object
        const breakdown = calculateEventT1Breakdown(totalAmount, eventData);
        
        convenienceFee = breakdown.convenienceFee;
        console.log('✅ Calculated dynamic convenience fee:', convenienceFee);
      }
    } catch (error) {
      console.error('❌ Error calculating convenience fee:', error);
      // Use default 5% fallback
    }

    const occId = selectedOccurrence?.id || '';
    console.log('🔍 HandleBooking - occurrenceId being passed:', occId);
    console.log('⚠️ HandleBooking - Is occurrence ID empty?', occId === '');

    // Navigate to unified event summary
    router.push({
      pathname: '/events/event-summary',
      params: {
        eventId: event.id,
        eventTitle: event.title,
        eventSubtitle: event.subtitle || event.description,
        eventImage: event.cover_image_url,
        eventVenue: event.venue || '',
        eventLocation: event.venue || '',
        eventDate: selectedOccurrence?.occurrence_date || event.event_date,
        eventTime: event.start_time,
        eventEndTime: event.end_time,
        startTimestamp: selectedOccurrence?.start_utc_timestamp?.toString() || '',
        endTimestamp: selectedOccurrence?.end_utc_timestamp?.toString() || '',
        ticketDetails: JSON.stringify(selectedTicketDetails),
        totalAmount: getTotalAmount().toString(),
        convenienceFee: convenienceFee.toString(), // ✅ Pass calculated convenience fee
        orderId: `ORD${Date.now()}`,
        occurrenceId: occId,
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{event.title || 'Event Tickets'}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(event.event_date).split(',')[0]}, {event.event_date?.split('-')[1] || ''} {event.event_date?.split('-')[2] || ''} | {event.start_time || '7:00 PM'}
          </Text>
          <Text style={styles.headerLocation}>{event.venue || 'Venue'}, {event.city || 'Indore'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Date Selector - Show if occurrences exist and event is not one_day */}
        {Object.keys(dateGroups).length > 0 && event.event_type !== 'one_day' && (
          <View style={styles.datesSelectorSection}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesScrollContainer}
            >
              {Object.keys(dateGroups).map((date) => {
                const occDate = new Date(date);
                const day = occDate.toLocaleDateString('en-US', { day: 'numeric' });
                const month = occDate.toLocaleDateString('en-US', { month: 'short' });
                const weekday = occDate.toLocaleDateString('en-US', { weekday: 'short' });
                const isSelected = selectedDate === date;
                
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateCard,
                      isSelected && styles.dateCardSelected
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      // Clear tickets when changing date
                      setSelectedTickets({});
                      
                      // Only auto-select time if there's exactly one slot for this date
                      if (dateGroups[date].length === 1) {
                        setSelectedOccurrence(dateGroups[date][0]);
                      } else {
                        // Don't auto-select when multiple time slots exist
                        setSelectedOccurrence(null);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dateDay,
                      isSelected && styles.dateDaySelected
                    ]}>
                      {day}
                    </Text>
                    <Text style={[
                      styles.dateMonth,
                      isSelected && styles.dateMonthSelected
                    ]}>
                      {month.toUpperCase()}
                    </Text>
                    <Text style={[
                      styles.dateWeekday,
                      isSelected && styles.dateWeekdaySelected
                    ]}>
                      {weekday.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Time Slot Selector - Show when date is selected and has multiple time slots */}
        {selectedDate && dateGroups[selectedDate] && dateGroups[selectedDate].length > 1 && (
          <View style={styles.timeSlotsSection}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timeSlotsScrollContainer}
            >
              {dateGroups[selectedDate].map((occ) => {
                const startTime = formatTimeFromTimestamp(occ.start_utc_timestamp);
                const isSelected = selectedOccurrence?.id === occ.id;
                
                return (
                  <TouchableOpacity
                    key={occ.id}
                    style={[
                      styles.timeSlotPill,
                      isSelected && styles.timeSlotPillSelected,
                      occ.sold_out && styles.timeSlotPillDisabled
                    ]}
                    onPress={() => {
                      if (!occ.sold_out) {
                        setSelectedOccurrence(occ);
                      }
                    }}
                    activeOpacity={0.7}
                    disabled={occ.sold_out}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                      occ.sold_out && styles.timeSlotTextDisabled
                    ]}>
                      {startTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Choose Tickets Section */}
        <View style={styles.ticketsSection}>
          <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose Your Tickets</Text>
            {reservationExpiry && (
              <ReservationTimer 
                expiresAt={reservationExpiry} 
                onExpire={handleReservationExpire}
                compact={false}
              />
            )}
          </View>
          
          {tickets.length > 0 ? (
            tickets
              .filter((ticket: any) => ticket.is_active)
              .map((ticket: any) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket as EventTicketType}
                  selectedQuantity={selectedTickets[ticket.id] || 0}
                  onQuantityChange={handleTicketQuantityChange}
                  showQuantitySelector={true}
                  compact={false}
                />
              ))
          ) : (
            <View style={styles.noTicketsContainer}>
              <Ionicons 
                name={!selectedDate ? "calendar-outline" : selectedDate && dateGroups[selectedDate]?.length > 1 && !selectedOccurrence ? "time-outline" : "ticket-outline"} 
                size={48} 
                color={PremiumColors.text.tertiary} 
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.noTicketsText}>
                {!selectedDate 
                  ? 'Please select a date above to continue' 
                  : dateGroups[selectedDate]?.length > 1 && !selectedOccurrence
                    ? 'Please select a time slot above to view tickets'
                    : 'No tickets available for this time slot'}
              </Text>
            </View>
          )}
        </View>

        {/* Ready Message */}
        <View style={styles.readySection}>
          <Text style={styles.readyText}>Ready to Join the Fun?</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bookingFooter}>
        <TouchableOpacity
          onPress={handleBooking}
          style={[
            styles.continueButton,
            (getTotalTickets() === 0 || getTotalAmount() === 0) && styles.disabledContinueButton
          ]}
          disabled={getTotalTickets() === 0 || getTotalAmount() === 0}
        >
          <LinearGradient
            colors={[PremiumColors.accent.secondary, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              Continue • ₹{getTotalAmount().toFixed(0)}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
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
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    marginBottom: 2,
  },
  headerLocation: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
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
  dateCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: PremiumColors.border,
  },
  dateCardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: PremiumColors.accent.secondary,
    borderWidth: 2,
  },
  dateDay: {
    fontSize: 28,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  dateDaySelected: {
    color: PremiumColors.accent.secondary,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    marginTop: 4,
  },
  dateMonthSelected: {
    color: PremiumColors.accent.secondary,
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: '500',
    color: PremiumColors.text.tertiary,
    marginTop: 2,
  },
  dateWeekdaySelected: {
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
  ticketsSection: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    letterSpacing: 0.3,
  },
  readySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  bookingFooter: {
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
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
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
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 50,
  },
  // Date Selector Styles
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    flex: 1,
  },
  noTicketsContainer: {
    padding: 24,
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
  // Time Slots Styles
  timeSlotsSection: {
    backgroundColor: PremiumColors.background.primary,
    paddingVertical: 20,
    paddingLeft: 20,
    marginBottom: 10,
  },
  timeSlotsScrollContainer: {
    paddingRight: 20,
    gap: 10,
    flexDirection: 'row',
  },
  timeSlotPill: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: PremiumColors.border,
  },
  timeSlotPillSelected: {
    backgroundColor: PremiumColors.accent.secondary,
    borderColor: PremiumColors.accent.secondary,
  },
  timeSlotPillDisabled: {
    opacity: 0.4,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: PremiumColors.text.tertiary,
  },
});
