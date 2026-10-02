import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { createEventPayment, createPaidEventBookingWithTickets, processPaidTicketPayment, processSuccessfulEventPayment, updateTicketSoldQuantity } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { metaAnalytics } from '../../utils/metaAnalytics';
import { confirmReservations } from '../../utils/reservationManager';

const { width } = Dimensions.get('window');

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  details?: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: '1',
    name: 'UPI',
    icon: 'qr-code',
    type: 'upi',
    details: 'Pay with any UPI app'
  },
  {
    id: '2',
    name: 'Credit/Debit Card',
    icon: 'card',
    type: 'card',
    details: 'Visa, Mastercard, RuPay'
  },
  {
    id: '3',
    name: 'Paytm Wallet',
    icon: 'wallet',
    type: 'wallet',
    details: 'Balance: ₹2,450'
  },
  {
    id: '4',
    name: 'Net Banking',
    icon: 'card-outline',
    type: 'netbanking',
    details: 'All major banks supported'
  },
];

export default function EventPaymentScreen() {
  const params = useLocalSearchParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const {
    eventId,
    eventTitle,
    eventSubtitle,
    eventImage,
    eventVenue,
    eventDate,
    eventTime,
    occurrenceId,  // ✅ Add occurrence ID
    ticketDetails,
    totalAmount,
    ticketSubtotal,
    convenienceFee,
    orderId,
    transactionId, // For T1 cover charge payments
    bookingId, // For T2 venue payments
    isVenuePayment, // Flag to indicate T2 venue payment
    amount, // Amount for T1/T2 payments
  } = params;

  const tickets = ticketDetails ? JSON.parse(ticketDetails as string) : [];

  // Calculate display amount based on payment type
  const displayAmount = amount || totalAmount;
  const subtotal = ticketSubtotal ? parseFloat(ticketSubtotal as string) : 0;
  const fee = convenienceFee ? parseFloat(convenienceFee as string) : 0;

  // Get auth state at component level (not inside function)
  const { user } = useAuth();
  console.log('🔍 EventPaymentScreen - Current user:', user ? { id: user.id, phone: user.phone_number } : null);
  console.log('🔍 EventPaymentScreen - Received occurrenceId:', occurrenceId);
  console.log('🔍 EventPaymentScreen - All params:', { eventId, occurrenceId, eventDate, eventTime });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePayment = async () => {
    console.log('🚀 handlePayment function called!');
    
    try {
      if (!user) {
        console.log('❌ No user found, showing alert');
        Alert.alert('Authentication Required', 'Please login to continue with payment');
        return;
      }

      console.log('✅ User authenticated, proceeding with payment for user:', user.id);
      
      setIsProcessing(true);
      console.log('⚡ Set processing to true');

      // Check if this is a venue payment (T2) or ticket purchase/cover charge (T1)
      if (isVenuePayment === 'true' && bookingId) {
        await handleVenuePayment();
      } else if (transactionId) {
        await handleCoverChargePayment();
      } else {
        await handleTicketPurchase();
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      Alert.alert('Payment Failed', 'Please try again later');
      setIsProcessing(false);
    }
  };

  const handleVenuePayment = async () => {
    console.log('💳 Processing venue payment (T2) for booking:', bookingId);
    
    // For venue payment, we need to collect bill details
    // This would typically come from a bill scanning or manual entry screen
    // For now, using example data
    const billData = {
      gross_amount: 1947, // This would come from actual bill
      discount_amount: 778.8, // From applied offer
      cover_charge: parseFloat(amount as string) || 0 // Cover charge already paid
    };

    const paymentData = {
      event_booking_id: bookingId,
      user_id: user.id,
      event_id: eventId,
      organizer_id: 'organizer-id', // Would come from booking data
      event_type: 'free',
      ticket_price: 0,
      cover_charge: billData.cover_charge,
      gross_amount: billData.gross_amount,
      discount_amount: billData.discount_amount,
    };

    const { data, error } = await createEventPayment(paymentData);
    
    if (error) {
      throw error;
    }

    // Simulate payment processing
    setTimeout(async () => {
      const mockGatewayResponse = {
        transaction_id: `TXN_${Date.now()}`,
        status: 'success',
        payment_method: 'card'
      };

      await processSuccessfulEventPayment(data.transaction.id, mockGatewayResponse);
      
      setIsProcessing(false);
      
      router.push({
        pathname: '/events/payment-success',
        params: {
          eventTitle: eventTitle,
          amount: data.payment.t2_final_payable_amount || '0',
          paymentType: 'venue_payment',
          bookingId: bookingId
        }
      });
    }, 2000);
  };

  const handleCoverChargePayment = async () => {
    console.log('💳 Processing cover charge payment (T1) for transaction:', transactionId);
    
    try {
      // Simulate payment processing
      setTimeout(async () => {
        try {
          const mockGatewayResponse = {
            transaction_id: `TXN_${Date.now()}`,
            status: 'success',
            payment_method: 'card'
          };

          const paymentResult = await processSuccessfulEventPayment(transactionId as string, mockGatewayResponse);
          
          if (paymentResult.error) {
            console.error('❌ Payment processing failed:', paymentResult.error);
            Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
            setIsProcessing(false);
            return;
          }
          
          // Get selected payment method
          const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
          
          // Track successful event ticket purchase in Meta
          try {
            metaAnalytics.logPurchase(
              bookingId as string,
              'event_ticket',
              parseFloat(amount as string),
              'INR',
              {
                event_id: eventId,
                event_title: eventTitle,
                payment_type: 'cover_charge',
                payment_method: selectedMethod?.name || 'unknown',
              }
            );
          } catch (analyticsError) {
            console.warn('⚠️ Analytics tracking failed:', analyticsError);
            // Don't block the flow for analytics errors
          }
          
          setIsProcessing(false);
          
          router.push({
            pathname: '/payment-success',
            params: {
              eventTitle: eventTitle,
              amount: amount,
              paymentType: 'cover_charge'
            }
          });
        } catch (error) {
          console.error('❌ Error in payment processing timeout:', error);
          Alert.alert('Payment Error', 'Something went wrong. Please try again.');
          setIsProcessing(false);
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error in handleCoverChargePayment:', error);
      Alert.alert('Payment Error', 'Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleTicketPurchase = async () => {
    console.log('🎫 Processing paid ticket purchase with new system');
    console.log('🎫 Tickets data:', tickets);
    console.log('📋 Event ID:', eventId);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    console.log('🎫 Creating paid event bookings for tickets:', tickets);
    
    // Create booking records for each ticket type using new paid event system
    const bookingPromises = tickets.map(async (ticket: any) => {
      const ticketData = {
        user_id: user.id,
        event_id: eventId,
        occurrence_id: occurrenceId || null,  // ✅ Add occurrence ID
        ticket_id: ticket.id,
        tickets_count: ticket.quantity,
        ticket_price: ticket.price * ticket.quantity,
        customer_name: user.full_name || user.phone_number,
        customer_phone: user.phone_number,
        customer_email: user.email,
        booking_date: eventDate || new Date().toISOString().split('T')[0], // Use occurrence date or today's date
        booking_time: eventTime || new Date().toTimeString().slice(0, 5), // Use event time or current time
        special_requests: null
      };

      console.log('📝 Creating paid event booking with individual tickets:', ticketData);
      console.log('📅 Occurrence ID for paid booking:', occurrenceId);
      console.log('🎟️ Creating', ticket.quantity, 'individual tickets');
      
      // Use new function that creates individual ticket records
      const bookingResult = await createPaidEventBookingWithTickets(ticketData);
      if (bookingResult.error) {
        console.error('❌ Paid booking creation error:', bookingResult.error);
        throw new Error(`Failed to create paid booking: ${JSON.stringify(bookingResult.error)}`);
      }
      console.log('✅ Paid event booking created:', bookingResult.data.booking.id);
      console.log('✅ Master Ticket:', bookingResult.data.booking.master_ticket);
      console.log('✅ Individual Tickets:', bookingResult.data.tickets.length);
      console.log('🎫 Ticket Numbers:', bookingResult.data.tickets.map(t => t.ticket_number).join(', '));
      return bookingResult.data;
    });

    const bookingResults = await Promise.all(bookingPromises);
    console.log('✅ All paid event bookings created:', bookingResults);
    
    // Process payments for each booking using new paid ticket system
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    console.log('💳 Processing paid ticket payments with method:', selectedMethod?.name);
    
    const paymentPromises = bookingResults.map(async (result) => {
      const { booking, transaction } = result;
      
      // Mock payment gateway response
      const paymentGatewayResponse = {
        transaction_id: `TXN${Date.now()}_${booking.id.slice(0, 8)}`,
        payment_method: selectedMethod?.name,
        payment_type: selectedMethod?.type,
        payment_status: 'success',
        transaction_time: new Date().toISOString(),
        amount: transaction.amount,
        currency: 'INR',
        mock_payment: true
      };

      console.log('💰 Processing paid ticket payment for transaction:', transaction.id);
      const paymentResult = await processPaidTicketPayment(transaction.id, paymentGatewayResponse);
      if (paymentResult.error) {
        console.error('❌ Paid ticket payment error:', paymentResult.error);
        throw new Error(`Failed to process paid ticket payment: ${JSON.stringify(paymentResult.error)}`);
      }
      console.log('✅ Paid ticket payment processed:', paymentResult.data);
      return { booking, paymentResult: paymentResult.data };
    });

    const paymentResults = await Promise.all(paymentPromises);
    console.log('✅ All paid ticket payments processed successfully');

    // Update ticket sold quantities
    console.log('🎫 Updating ticket sold quantities...');
    const ticketUpdatePromises = tickets.map((ticket: any) => 
      updateTicketSoldQuantity(ticket.id, ticket.quantity)
    );
    await Promise.all(ticketUpdatePromises);
    console.log('✅ All ticket quantities updated');

    // ✅ Confirm reservations - mark them as 'confirmed' and link to booking
    console.log('✅ Confirming ticket reservations...');
    try {
      const firstBooking = paymentResults[0]?.booking;
      if (firstBooking && user?.id && eventId) {
        const confirmResult = await confirmReservations(
          user.id,
          firstBooking.id,
          eventId as string
        );
        if (confirmResult.success) {
          console.log(`✅ Confirmed ${confirmResult.count} reservation(s)`);
        } else {
          console.warn('⚠️ Failed to confirm reservations, but payment succeeded');
        }
      }
    } catch (error) {
      console.error('❌ Error confirming reservations:', error);
      // Don't fail the payment if reservation confirmation fails
    }

    // Simulate payment processing delay
    console.log('⏳ Simulating payment processing delay...');
    setTimeout(() => {
      setIsProcessing(false);
      console.log('🎉 Paid ticket purchase completed, navigating to tickets page');
      
      // Navigate to event confirmation page
      router.push({
        pathname: '/events/event-confirmation',
        params: {
          eventId,
          eventTitle,
          eventSubtitle,
          eventImage,
          eventVenue,
          eventDate,
          eventTime,
          ticketDetails,
          totalAmount,
          ticketSubtotal: subtotal.toString(),
          convenienceFee: fee.toString(),
          orderId,
          paymentMethod: selectedMethod?.name,
          paymentStatus: 'success',
          bookingIds: JSON.stringify(paymentResults.map(p => p.booking.id)),
          ticketNumbers: JSON.stringify(paymentResults.map(p => p.booking.ticket_number)),
        }
      });
    }, 2000);
  };

  const getPaymentIcon = (iconName: string) => {
    switch (iconName) {
      case 'qr-code': return 'qr-code-outline';
      case 'card': return 'card-outline';
      case 'wallet': return 'wallet-outline';
      default: return 'card-outline';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {/* Event Summary */}
        <View style={styles.eventSummaryCard}>
          <View style={styles.eventSummaryHeader}>
            <Ionicons name="ticket-outline" size={24} color={PremiumColors.accent.secondary} />
            <View style={styles.eventSummaryInfo}>
              <Text style={styles.eventSummaryTitle}>{eventTitle}</Text>
              <Text style={styles.eventSummaryDetails}>
                {eventVenue} • {eventTime}
              </Text>
            </View>
            <Text style={styles.eventSummaryAmount}>₹{displayAmount}</Text>
          </View>
          
          <View style={styles.ticketsSummary}>
            {tickets.map((ticket: any, index: number) => (
              <View key={index} style={styles.ticketSummaryItem}>
                <Text style={styles.ticketSummaryName}>
                  {ticket.quantity}x {ticket.name}
                </Text>
                <Text style={styles.ticketSummaryPrice}>
                  ₹{ticket.price * ticket.quantity}
                </Text>
              </View>
            ))}
            
            {/* Show fee breakdown if available */}
            {subtotal > 0 && fee > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.ticketSummaryItem}>
                  <Text style={styles.ticketSummaryLabel}>Subtotal</Text>
                  <Text style={styles.ticketSummaryValue}>₹{subtotal}</Text>
                </View>
                <View style={styles.ticketSummaryItem}>
                  <Text style={styles.ticketSummaryLabel}>Convenience Fee</Text>
                  <Text style={styles.ticketSummaryValue}>₹{fee}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethodsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color={PremiumColors.accent.secondary} />
            <Text style={styles.cardTitle}>Choose Payment Method</Text>
          </View>

          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedPaymentMethod(method.id)}
                style={[
                  styles.methodItem,
                  selectedPaymentMethod === method.id && styles.selectedMethod
                ]}
              >
                <View style={styles.methodLeft}>
                  <View style={[
                    styles.methodIcon,
                    selectedPaymentMethod === method.id && styles.selectedMethodIcon
                  ]}>
                    <Ionicons 
                      name={getPaymentIcon(method.icon) as any} 
                      size={20} 
                      color={selectedPaymentMethod === method.id ? PremiumColors.text.primary : PremiumColors.accent.secondary}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={[
                      styles.methodName,
                      selectedPaymentMethod === method.id && styles.selectedMethodText
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={styles.methodDetails}>{method.details}</Text>
                  </View>
                </View>
                
                <View style={[
                  styles.radioButton,
                  selectedPaymentMethod === method.id && styles.selectedRadio
                ]}>
                  {selectedPaymentMethod === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Ionicons name="shield-checkmark" size={20} color={PremiumColors.accent.secondary} />
            <Text style={styles.securityTitle}>Secure Payment</Text>
          </View>
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. Tickets will be available immediately after successful payment.
          </Text>
          <View style={styles.securityFeatures}>
            <View style={styles.securityFeature}>
              <Ionicons name="checkmark-circle" size={16} color={PremiumColors.accent.secondary} />
              <Text style={styles.featureText}>Instant ticket delivery</Text>
            </View>
            <View style={styles.securityFeature}>
              <Ionicons name="checkmark-circle" size={16} color={PremiumColors.accent.secondary} />
              <Text style={styles.featureText}>Full refund if event is cancelled</Text>
            </View>
            <View style={styles.securityFeature}>
              <Ionicons name="checkmark-circle" size={16} color={PremiumColors.accent.secondary} />
              <Text style={styles.featureText}>24/7 customer support</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Payment Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalValue}>₹{displayAmount}</Text>
        </View>
        

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            onPress={() => {
              console.log('💳 Pay button pressed!');
              handlePayment();
            }} 
            style={[styles.payButton, isProcessing && styles.processingButton]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Text style={styles.payButtonText}>Processing Payment...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color={PremiumColors.text.primary} />
                <Text style={styles.payButtonText}>Pay ₹{displayAmount}</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.primary,
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
  eventSummaryCard: {
    backgroundColor: PremiumColors.background.secondary,
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  eventSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventSummaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  eventSummaryDetails: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  eventSummaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
  },
  ticketsSummary: {
    backgroundColor: PremiumColors.background.tertiary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  ticketSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSummaryName: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  ticketSummaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginVertical: 8,
  },
  ticketSummaryLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  ticketSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  paymentMethodsCard: {
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  methodsList: {
    gap: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PremiumColors.border,
    backgroundColor: PremiumColors.background.tertiary,
  },
  selectedMethod: {
    borderColor: PremiumColors.accent.secondary,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedMethodIcon: {
    backgroundColor: PremiumColors.accent.secondary,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  selectedMethodText: {
    color: PremiumColors.accent.secondary,
  },
  methodDetails: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PremiumColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: PremiumColors.accent.secondary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PremiumColors.accent.secondary,
  },
  securityCard: {
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  securityText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  securityFeatures: {
    gap: 8,
  },
  securityFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  footer: {
    backgroundColor: PremiumColors.background.secondary,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: PremiumColors.background.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.accent.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  processingButton: {
    backgroundColor: PremiumColors.background.tertiary,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
});
