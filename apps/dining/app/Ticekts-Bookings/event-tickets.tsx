import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import EventTicketCard, { EventTicket } from '../../components/Booking-Tickets/EventTicketCard';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function EventTicketsScreen() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
       const { data: ticketsData, error } = await supabase
         .from('event_bookings')
         .select(`
           *,
           events!inner(
             id,
             title,
             event_date,
             start_time,
             end_time,
             cover_image_url,
             ticket_type,
             city,
             state,
             restaurant_id,
             restaurants(
               name,
               address
             )
           ),
           event_ticket_types(
             name,
             price,
             ticket_cover_enabled,
             ticket_cover_amount,
             entry_fee_amount
           ),
           event_payments(
              ticket_price,
              convenience_fee_amount,
              ticket_cover_amount,
             discount_amount,
             gross_amount,
             t1_commission_amount,
             t2_commission_amount,
             t1_convenience_fee,
             t2_convenience_fee,
             customer_total_paid,
             t1_organizer_due,
             t2_organizer_due,
             t1_status,
             t2_status,
             transaction_status,
             t1_final_payable_amount,
             t2_final_payable_amount
           ),
           event_offers(
             title,
             discount_value,
             discount_type
           )
         `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event tickets:', error);
        return;
      }

      const transformedTickets: EventTicket[] = ticketsData.map((booking: any) => {
         // Calculate total amount paid based on transaction type
         let totalAmountPaid = '0';
         let transactionType = 'T1'; // Default to T1 for ticket purchases
         let transactionDetails = '';
         
         if (booking.booking_type === 'paid' && booking.event_payments?.length > 0) {
           const payment = booking.event_payments[0];
           
           // For paid events, use T1 final payable amount
           const t1FinalAmount = parseFloat(payment.t1_final_payable_amount || '0');
           const ticketPrice = parseFloat(payment.ticket_price || '0');
           const t1ConvenienceFee = parseFloat(payment.t1_convenience_fee || '0');
           const ticketsCount = booking.tickets_count || 1;
           
           totalAmountPaid = t1FinalAmount > 0 ? t1FinalAmount.toString() : '0';
           
           transactionType = 'T1 (Ticket)';
           transactionDetails = `₹${ticketPrice.toFixed(0)} × ${ticketsCount} + ₹${t1ConvenienceFee.toFixed(0)} fee`;
         } else if (booking.booking_type === 'free' && booking.event_payments?.length > 0) {
           const payment = booking.event_payments[0];
           
           // For free events with venue payment, use T2 final payable amount
           if (payment.gross_amount && parseFloat(payment.gross_amount) > 0) {
             const t2FinalAmount = parseFloat(payment.t2_final_payable_amount || '0');
             const grossAmount = parseFloat(payment.gross_amount || '0');
             const coverAmount = parseFloat(payment.ticket_cover_amount || '0');
             const t2ConvenienceFee = parseFloat(payment.t2_convenience_fee || '0');
             
             totalAmountPaid = t2FinalAmount > 0 ? t2FinalAmount.toString() : '0';
             
             transactionType = 'T2 (Venue)';
             transactionDetails = `₹${grossAmount.toFixed(0)} bill - ₹${coverAmount.toFixed(0)} cover + ₹${t2ConvenienceFee.toFixed(0)} fee`;
           } else {
              // Just cover charge payment - use T2 final payable amount
              const t2FinalAmount = parseFloat(payment.t2_final_payable_amount || '0');
              totalAmountPaid = t2FinalAmount > 0 ? t2FinalAmount.toString() : '0';
             transactionType = 'T1 (Cover)';
             transactionDetails = 'Cover charge payment';
           }
         }

         // Get venue information
         let venueName = '';
         let venueAddress = '';
         if (booking.events.restaurants) {
           venueName = booking.events.restaurants.name;
           venueAddress = booking.events.restaurants.address;
         }

        // Get offer information
        let offerTitle = '';
        if (booking.event_offers) {
          const offer = booking.event_offers;
          if (offer.discount_type === 'percentage') {
            offerTitle = `${offer.discount_value}% Off`;
          } else if (offer.discount_type === 'flat') {
            offerTitle = `₹${offer.discount_value} Off`;
          } else {
            offerTitle = offer.title;
          }
        }

        return {
          id: booking.id,
          event_id: booking.event_id,
          event_title: booking.events.title,
          event_date: booking.events.event_date,
          start_time: booking.events.start_time,
          end_time: booking.events.end_time,
          cover_image_url: booking.events.cover_image_url,
          booking_type: booking.booking_type,
          ticket_number: booking.ticket_number,
          status: booking.status,
          party_size: booking.party_size,
          venue_name: venueName,
          venue_address: venueAddress,
          city: booking.events.city,
          state: booking.events.state,
          total_amount_paid: totalAmountPaid,
          ticket_price: booking.event_payments?.[0]?.ticket_price,
          convenience_fee: booking.event_payments?.[0]?.t1_convenience_fee || booking.event_payments?.[0]?.convenience_fee_amount,
          cover_amount: booking.event_payments?.[0]?.ticket_cover_amount,
          discount_amount: booking.event_payments?.[0]?.discount_amount,
          offer_title: offerTitle,
          transaction_type: transactionType,
          transaction_details: transactionDetails,
          // T2 specific data for venue payments
          gross_amount: booking.event_payments?.[0]?.gross_amount,
          t2_convenience_fee: booking.event_payments?.[0]?.t2_convenience_fee,
          is_checked_in: booking.is_checked_in,
          checked_in_at: booking.checked_in_at,
          created_at: booking.created_at,
        };
      });

      setTickets(transformedTickets);
    } catch (error) {
      console.error('Error fetching event tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const renderTicket = ({ item }: { item: EventTicket }) => (
    <EventTicketCard ticket={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="ticket-outline" size={64} color="#666666" />
      </View>
      <Text style={styles.emptyTitle}>No Event Tickets Found</Text>
      <Text style={styles.emptySubtitle}>
        You haven't booked any events yet. Explore exciting events and book your tickets!
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/search')}
        activeOpacity={0.7}
      >
        <Text style={styles.exploreButtonText}>Explore Events</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerSubtitle}>
        {tickets.length} {tickets.length === 1 ? 'Ticket' : 'Tickets'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#131315" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Tickets</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your tickets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor="#131315" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Tickets</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <View style={styles.container}>
        {tickets.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={tickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#FFFFFF']}
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#131315',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#131315',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#131315',
  },
  headerContainer: {
    paddingBottom: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e1e20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#131315',
  },
});
