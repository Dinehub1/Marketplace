import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { FreeEventSummary, PaidEventSummary } from '../../components/Events';
import { createFreeEventBooking, supabase } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { calculateEventT1Breakdown } from '../../utils/feeCalculator';

export default function EventSummaryScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [specialRequests, setSpecialRequests] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Detect event type based on params
  const ticketDetails = params.ticketDetails;
  const isPaidEvent = !!ticketDetails || (params.totalAmount && parseFloat(params.totalAmount as string) > 0 && !params.date);
  const isFreeEvent = !isPaidEvent;

  console.log('📋 Event Summary Screen - Type:', isPaidEvent ? 'PAID' : 'FREE');
  console.log('📋 All Params:', params);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleModifyBooking = () => {
    router.back();
  };

  // Handle Free Event Booking
  const handleFreeEventProceed = async () => {
    if (!user) {
      alert('Please login to continue with booking');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🚀 Creating Free Event Booking from Unified Summary Page');

      const {
        eventId,
        eventTitle,
        eventImage,
        eventLocation,
        date,
        occurrenceId,
        timeSlot,
        timeSection,
        guests,
        selectedOfferId,
        selectedOfferTitle,
        coverChargePerPerson,
        totalCoverCharge,
      } = params;

      const partySize = parseInt(guests?.toString() || '2');
      const coverChargeAmount = parseFloat(coverChargePerPerson?.toString() || '0');
      const totalCoverChargeAmount = parseFloat(totalCoverCharge?.toString() || '0');

      const bookingData = {
        user_id: user.id,
        event_id: eventId,
        occurrence_id: occurrenceId || null,
        gross_amount: null,
        customer_name: user.full_name || user.phone_number,
        customer_phone: user.phone_number,
        customer_email: user.email,
        booking_date: new Date(date as string).toISOString().split('T')[0],
        booking_time: timeSlot,
        time_section: timeSection,
        party_size: partySize,
        special_requests: specialRequests || null,
        offer_id: selectedOfferId || null,
        cover_charge_per_person: coverChargeAmount,
        total_cover_charge: totalCoverChargeAmount,
        advance_payment: totalCoverChargeAmount,
      };

      console.log('📋 Free Event Booking Data:', bookingData);

      const { data, error } = await createFreeEventBooking(bookingData);

      if (error) {
        console.error('❌ Booking Error:', error);
        alert('Failed to create booking. Please try again.');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Booking Created Successfully:', data);

      // `error` and `data` are independent optional fields, so the check above does not
      // narrow `data`. Without this the reads below were on a possibly-null value.
      if (!data) {
        alert('Failed to create booking. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (totalCoverChargeAmount === 0 || data.autoConfirmed) {
        // No payment needed, booking confirmed
        console.log('🎉 No payment required - redirecting to confirmation');
        router.replace({
          pathname: '/events/event-confirmation',
          params: {
            bookingId: data.booking?.id || `BK${Date.now()}`,
            eventTitle,
            eventImage,
            eventLocation,
            date,
            timeSlot,
            timeSection,
            guests,
            selectedOfferTitle: selectedOfferTitle || '',
            bookingStatus: 'confirmed'
          }
        });
      } else {
        // Payment required, redirect to payment
        console.log('💳 Payment required - redirecting to payment page');
        router.push({
          pathname: '/events/event-payment',
          params: {
            transactionId: data.transaction?.id,
            amount: totalCoverChargeAmount,
            eventTitle: eventTitle,
            bookingId: data.booking?.id,
            eventId: eventId,
            eventImage: eventImage,
            eventLocation: eventLocation,
          }
        });
      }
    } catch (error) {
      console.error('❌ Booking Creation Error:', error);
      alert('Failed to create booking. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle Paid Event (Ticket Purchase)
  const handlePaidEventProceed = async () => {
    console.log('💳 Proceeding to payment for paid event tickets');
    
    const {
      eventId,
      eventTitle,
      eventSubtitle,
      eventImage,
      eventVenue,
      eventDate,
      eventTime,
      occurrenceId,
      ticketDetails,
      totalAmount,
      orderId,
    } = params;

    try {
      // ✅ Fetch event with T1 fee settings
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          id,
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
        .eq('id', eventId)
        .single();

      if (error || !event) {
        console.error('❌ Failed to fetch event fee settings:', error);
        // Fallback to default 5% if fetch fails
        const parsedTickets = JSON.parse(ticketDetails as string);
        const ticketSubtotal = parsedTickets.reduce((sum: number, ticket: any) => 
          sum + (ticket.price * ticket.quantity), 0
        );
        const convenienceFee = Math.round(ticketSubtotal * 0.05);
        
        router.push({
          pathname: '/events/event-payment',
          params: {
            eventId,
            eventTitle,
            eventSubtitle,
            eventImage,
            eventVenue,
            eventDate,
            eventTime,
            occurrenceId,
            ticketDetails,
            totalAmount,
            ticketSubtotal: ticketSubtotal.toString(),
            convenienceFee: convenienceFee.toString(),
            orderId,
          }
        });
        return;
      }

      // Parse ticket details to calculate subtotal
      const parsedTickets = JSON.parse(ticketDetails as string);
      const ticketSubtotal = parsedTickets.reduce((sum: number, ticket: any) => 
        sum + (ticket.price * ticket.quantity), 0
      );

      // ✅ Calculate T1 breakdown using dynamic fees
      const breakdown = calculateEventT1Breakdown(ticketSubtotal, event);

      console.log('💰 T1 Dynamic Fee Calculation:', {
        ticketSubtotal,
        convenienceFee: breakdown.convenienceFee,
        commission: breakdown.commission,
        customerPays: breakdown.customerPays,
        organizerGets: breakdown.organizerGets,
        platformEarns: breakdown.platformEarns
      });

      router.push({
        pathname: '/events/event-payment',
        params: {
          eventId,
          eventTitle,
          eventSubtitle,
          eventImage,
          eventVenue,
          eventDate,
          eventTime,
          occurrenceId,
          ticketDetails,
          totalAmount: breakdown.customerPays.toString(),
          ticketSubtotal: ticketSubtotal.toString(),
          convenienceFee: breakdown.convenienceFee.toString(),
          commissionRate: (event.commission_rate || 5).toString(),
          orderId,
        }
      });
    } catch (error) {
      console.error('❌ Error calculating T1 fees:', error);
      alert('Failed to calculate payment breakdown. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131315" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Conditional Rendering based on Event Type */}
      {isFreeEvent ? (
        <FreeEventSummary
          eventImage={params.eventImage as string}
          eventTitle={params.eventTitle as string}
          eventLocation={params.eventLocation as string}
          date={params.date as string}
          timeSlot={params.timeSlot as string}
          timeSection={params.timeSection as string}
          guests={params.guests as string}
          selectedOfferId={params.selectedOfferId as string}
          selectedOfferTitle={params.selectedOfferTitle as string}
          coverChargePerPerson={params.coverChargePerPerson as string}
          totalCoverCharge={params.totalCoverCharge as string}
          specialRequests={specialRequests}
          onSpecialRequestsChange={setSpecialRequests}
          onModifyBooking={handleModifyBooking}
          onProceed={handleFreeEventProceed}
          isProcessing={isProcessing}
        />
      ) : (
        <PaidEventSummary
          eventImage={params.eventImage as string}
          eventTitle={params.eventTitle as string}
          eventLocation={params.eventLocation as string}
          eventDate={params.eventDate as string}
          eventTime={params.eventTime as string}
          eventEndTime={params.eventEndTime as string}
          startTimestamp={params.startTimestamp as string}
          endTimestamp={params.endTimestamp as string}
          eventVenue={params.eventVenue as string}
          tickets={ticketDetails ? JSON.parse(ticketDetails as string) : []}
          totalAmount={parseFloat(params.totalAmount as string || '0')}
          convenienceFee={params.convenienceFee ? parseFloat(params.convenienceFee as string) : undefined} // ✅ Pass convenience fee
          specialRequests={specialRequests}
          onSpecialRequestsChange={setSpecialRequests}
          onModifyBooking={handleModifyBooking}
          onProceed={handlePaidEventProceed}
          isProcessing={isProcessing}
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
    backgroundColor: PremiumColors.background.primary,
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
    color: PremiumColors.text.primary,
  },
  headerRight: {
    width: 40,
  },
});

