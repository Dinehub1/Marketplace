import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  createEventPayment,
  createPaidEventVenuePayment,
  getEventBookingById,
  processSuccessfulEventPayment,
  supabase
} from '../../config/supabase';
import { AppColors, PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { calculateEventT2Breakdown } from '../../utils/feeCalculator';
import {
  formatCurrency,
  PAYMENT_METHODS,
  processFinalBillPayment,
  validatePaymentAmount
} from '../../utils/mockPaymentGateway';

const { width } = Dimensions.get('window');

const EventPayBillScreen = () => {
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [event, setEvent] = useState<any>(null); // ✅ Store event with fee settings
  const [loading, setLoading] = useState(true);
  const [billAmount, setBillAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    // Keyboard event listeners for iOS
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (billAmount && parseFloat(billAmount) > 0 && event) {
      setIsCalculating(true);
      
      const timeoutId = setTimeout(() => {
        calculatePaymentBreakdownHandler(parseFloat(billAmount));
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowBreakdown(false);
      setPaymentBreakdown(null);
    }
  }, [billAmount, booking, event]);

  const loadBookingDetails = async () => {
    try {
      console.log('📋 Loading event booking details for:', bookingId);
      
      // Get real booking data from database by booking ID
      const { data: targetBooking, error } = await getEventBookingById(bookingId);
      
      if (error) throw error;
      
      if (!targetBooking) {
        throw new Error('Event booking not found');
      }

      // Get existing payment record for paid events with T1/T2 tracking
      let existingPayment = null;
      if (targetBooking.booking_type === 'paid' || targetBooking.events?.ticket_type === 'paid') {
        const { data: paymentData, error: paymentError } = await supabase
          .from('event_payments')
          .select(`
            ticket_cover_amount, 
            ticket_price, 
            convenience_fee_amount, 
            commission_amount, 
            organizer_due, 
            platform_earnings,
            t1_commission_amount,
            t2_commission_amount,
            t1_convenience_fee,
            t2_convenience_fee,
            customer_total_paid,
            t1_organizer_due,
            t2_organizer_due,
            t1_status,
            t2_status,
            transaction_status
          `)
          .eq('event_booking_id', bookingId)
          .single();
        
        if (!paymentError && paymentData) {
          existingPayment = paymentData;
          console.log('📋 Existing payment record with T1/T2 tracking loaded:', existingPayment);
        }
      }

      // Format the booking data
      const formattedBooking = {
        id: targetBooking.id,
        event: {
          title: targetBooking.events?.title || 'Event',
          cover_image_url: targetBooking.events?.cover_image_url || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop',
          venue: 'Event Venue', // Default venue name since venue is in separate table
          ticket_type: targetBooking.events?.ticket_type || 'free'
        },
        party_size: targetBooking.party_size,
        booking_date: targetBooking.booking_date,
        booking_time: targetBooking.booking_time,
        booking_type: targetBooking.booking_type || 'free',
        total_cover_charge: parseFloat(targetBooking.total_cover_charge) || 0,
        existingPayment: existingPayment, // Add existing payment data for paid events
        offer: targetBooking.event_offers ? {
          id: targetBooking.event_offers.id,
          title: targetBooking.event_offers.title,
          discount_type: targetBooking.event_offers.discount_type,
          discount_value: targetBooking.event_offers.discount_value
        } : null
      };

      console.log('✅ Loaded event booking details:', formattedBooking);
      setBooking(formattedBooking);

      // ✅ Fetch event with T2 fee settings
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          commission_rate,
          t2_convenience_fee_enabled,
          t2_convenience_fee_type,
          t2_convenience_fee_value,
          t2_convenience_fee_rules,
          t2_min_fee_enabled,
          t2_min_convenience_fee,
          t2_max_fee_enabled,
          t2_max_convenience_fee
        `)
        .eq('id', targetBooking.event_id)
        .single();

      if (eventError) {
        console.error('❌ Failed to fetch event T2 fee settings:', eventError);
      } else {
        console.log('✅ Loaded event T2 fee settings:', eventData);
        setEvent(eventData);
      }
    } catch (error) {
      console.error('Error loading event booking:', error);
      Alert.alert('Error', 'Failed to load event booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentBreakdownHandler = (amount: number) => {
    if (!booking || !event) return;
    
    // Calculate discount if offer exists
    const discountAmount = booking.offer ? 
      (booking.offer.discount_type === 'percentage' ? 
        (amount * parseFloat(booking.offer.discount_value)) / 100 :
        parseFloat(booking.offer.discount_value)
      ) : 0;

    console.log('💰 Calculating T2 Breakdown with Dynamic Fees');
    
    // ✅ Get cover amount based on event type
    const isPaidEvent = booking?.event?.ticket_type === 'paid' || booking?.booking_type === 'paid';
    const coverAmount = isPaidEvent 
      ? parseFloat(booking.existingPayment?.ticket_cover_amount || '0') // PAID: from ticket cover
      : parseFloat(booking.total_cover_charge || '0'); // FREE: from booking cover charge
    
    console.log('🎫 Event Type:', isPaidEvent ? 'PAID' : 'FREE');
    console.log('🎫 T2 Cover Amount to Deduct:', coverAmount);
    
        // ✅ Use dynamic T2 fee calculation WITH cover amount deduction AND event type
    const breakdown = calculateEventT2Breakdown(
      amount,
      event,
      discountAmount,
      coverAmount, // ✅ Pass cover amount to deduct from bill
      isPaidEvent  // ✅ Pass event type to determine fee calculation logic
    );

    // Add extra fields for UI display
    const uiBreakdown = {
      grossBillAmount: breakdown.billAmount,
      coverAmount: breakdown.coverAmount,
      discountAmount: breakdown.discountAmount,
      afterDiscount: breakdown.afterCoverAndDiscount, // ✅ Updated field name
      convenienceFee: breakdown.convenienceFee,
      commission: breakdown.commission,
      finalPayable: breakdown.customerPays,
      organizerDue: breakdown.organizerGets,
      platformEarnings: breakdown.platformEarns,
      // Include cover based on event type
      ticketCoverAmount: isPaidEvent ? coverAmount : 0,
      coverCharge: isPaidEvent ? 0 : coverAmount,
      // For reference in payment record
      t1Data: booking.existingPayment ? {
        t1_commission_amount: parseFloat(booking.existingPayment.t1_commission_amount || '0'),
        t1_convenience_fee: parseFloat(booking.existingPayment.t1_convenience_fee || '0'),
        t1_organizer_due: parseFloat(booking.existingPayment.t1_organizer_due || '0'),
        customer_total_paid_t1: parseFloat(booking.existingPayment.customer_total_paid || '0')
      } : null
    };
    
    setPaymentBreakdown(uiBreakdown);
    setIsCalculating(false);
    
    // Beautiful animation reveal
    Animated.spring(animationValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    setShowBreakdown(true);
    
    // Scroll to show the breakdown after a short delay
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const handlePayment = async () => {
    if (!paymentBreakdown || !booking) return;

    // Validate amount
    const validation = validatePaymentAmount(billAmount, 100, 50000);
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error);
      return;
    }

    setIsProcessingPayment(true);

    // Start pulse animation for processing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    try {
      // Detect if this is a paid event or free event
      const isPaidEvent = booking.event?.ticket_type === 'paid' || booking.booking_type === 'paid';
      
      // Create payment record in database using appropriate function
      let paymentData, paymentError;
      if (isPaidEvent) {
        const result = await createPaidEventVenuePayment(bookingId, paymentBreakdown);
        paymentData = result.data;
        paymentError = result.error;
      } else {
        const result = await createEventPayment(bookingId, paymentBreakdown);
        paymentData = result.data;
        paymentError = result.error;
      }

      if (paymentError) throw paymentError;

      // Process payment through mock gateway
      const paymentResult = await processFinalBillPayment({
        amount: paymentBreakdown.finalPayable,
        paymentMethod: selectedPaymentMethod,
        userId: user?.id,
        eventId: booking.event_id,
        bookingId: bookingId,
        paymentBreakdown
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || 'Payment failed');
      }

      // Update transaction status
      if (!paymentData) {
        throw new Error('Payment data not found');
      }
      
      const { error: statusError } = await processSuccessfulEventPayment(
        paymentData.transaction.id,
        paymentResult.data || {}
      );

      if (statusError) throw statusError;

      // Stop pulse animation
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      // Navigate to success page
      router.replace({
        pathname: '/payment-success',
        params: {
          type: 'venue_payment',
          paymentType: 'venue_payment',
          amount: paymentBreakdown.finalPayable,
          transactionId: paymentResult.data?.transaction_id || '',
          eventTitle: booking.event.title,
          bookingId: bookingId
        }
      });

    } catch (error: any) {
      console.error('Event payment error:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
      
      // Stop pulse animation
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading event booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={AppColors.gray[400]} />
        <Text style={styles.errorText}>Event booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Event Bill</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isKeyboardVisible ? keyboardHeight + 100 : 120 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

      {/* Event Info */}
      <View style={styles.eventCard}>
        <Image source={{ uri: booking.event.cover_image_url }} style={styles.eventImage} />
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{booking.event.title}</Text>
          <Text style={styles.bookingDetails}>
            {booking.party_size} guests • Booking {booking.id.slice(0, 8)}
          </Text>
          <Text style={styles.bookingTime}>
            {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
          </Text>
          <Text style={styles.eventVenue}>
            📍 {booking.event.venue}
          </Text>
          {/* Show T1/T2 status for paid events */}
          {(booking.event?.ticket_type === 'paid' || booking.booking_type === 'paid') && booking.existingPayment && (
            <View style={styles.transactionStatusContainer}>
              <View style={styles.transactionStatusItem}>
                <Text style={styles.transactionStatusLabel}>T1 (Ticket):</Text>
                <Text style={[
                  styles.transactionStatusValue,
                  booking.existingPayment.t1_status === 'paid' ? styles.statusPaid : styles.statusPending
                ]}>
                  {booking.existingPayment.t1_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                </Text>
              </View>
              <View style={styles.transactionStatusItem}>
                <Text style={styles.transactionStatusLabel}>T2 (Venue):</Text>
                <Text style={[
                  styles.transactionStatusValue,
                  booking.existingPayment.t2_status === 'paid' ? styles.statusPaid : styles.statusPending
                ]}>
                  {booking.existingPayment.t2_status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

        {/* Bill Amount Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Enter your bill amount</Text>
            {isKeyboardVisible && (
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={() => Keyboard.dismiss()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={billAmount}
              onChangeText={setBillAmount}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        
        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {[500, 1000, 1500, 2000].map(amount => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAmountButton}
              onPress={() => setBillAmount(amount.toString())}
            >
              <Text style={styles.quickAmountText}>₹{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading Indicator */}
      {isCalculating && (
        <View style={styles.calculatingContainer}>
          <ActivityIndicator size="small" color={PremiumColors.accent.primary} />
          <Text style={styles.calculatingText}>Calculating...</Text>
        </View>
      )}

      {/* Payment Breakdown with Animation */}
      {showBreakdown && paymentBreakdown && (
        <Animated.View 
          style={[
            styles.breakdownContainer,
            {
              opacity: animationValue,
              transform: [{
                translateY: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Payment Breakdown</Text>
            
            {/* Applied Offer */}
            {booking.offer && (
              <View style={styles.offerAppliedContainer}>
                <Ionicons name="pricetag" size={16} color={PremiumColors.success} />
                <Text style={styles.offerAppliedText}>
                  {booking.offer.title} Applied
                </Text>
                <Text style={styles.offerSavings}>
                  You save ₹{paymentBreakdown.discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            
            {/* Breakdown Items */}
            <View style={styles.breakdownItems}>
              <BreakdownItem 
                label="Bill Amount" 
                amount={paymentBreakdown.grossBillAmount}
                icon="receipt"
              />
              
              {/* Show different cover types based on event type */}
              {(() => {
                const isPaidEvent = booking?.event?.ticket_type === 'paid' || booking?.booking_type === 'paid';
                
                if (isPaidEvent) {
                  // For paid events, show ticket cover amount if it exists
                  const ticketCoverAmount = paymentBreakdown.ticketCoverAmount || 0;
                  if (ticketCoverAmount > 0) {
                    return (
                      <BreakdownItem 
                        label="Cover Amount (Already Paid)" 
                        amount={-ticketCoverAmount}
                        icon="ticket"
                        isPaid
                      />
                    );
                  }
                } else {
                  // For free events, show cover charge if it exists
                  const coverCharge = paymentBreakdown.coverCharge || 0;
                  if (coverCharge > 0) {
                    return (
                      <BreakdownItem 
                        label="Cover Charge (Paid)" 
                        amount={-coverCharge}
                        icon="checkmark-circle"
                        isPaid
                      />
                    );
                  }
                }
                return null;
              })()}
              
              {paymentBreakdown.discountAmount > 0 && (
                <BreakdownItem 
                  label="Discount" 
                  amount={-paymentBreakdown.discountAmount}
                  icon="pricetag"
                  isDiscount
                />
              )}
              
              {/* Show subtotal if cover or discount exists */}
              {(paymentBreakdown.coverAmount > 0 || paymentBreakdown.discountAmount > 0) && (
                <BreakdownItem 
                  label="Subtotal" 
                  amount={paymentBreakdown.afterDiscount}
                  icon="calculator"
                />
              )}
              
              <BreakdownItem 
                label="Convenience Fee" 
                amount={paymentBreakdown.convenienceFee}
                icon="card"
              />
              
              <View style={styles.divider} />
              
              <View style={styles.finalAmountContainer}>
                <Text style={styles.finalAmountLabel}>Amount to Pay</Text>
                <Text style={styles.finalAmount}>
                  ₹{paymentBreakdown.finalPayable.toFixed(2)}
                </Text>
              </View>
            </View>
            
            {/* Payment Methods */}
            <View style={styles.paymentMethodsSection}>
              <Text style={styles.paymentMethodsTitle}>Select Payment Method</Text>
              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.slice(0, 4).map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodButton,
                      selectedPaymentMethod === method.id && styles.selectedPaymentMethod
                    ]}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                  >
                     <Ionicons 
                       name={method.icon as any} 
                       size={20} 
                       color={selectedPaymentMethod === method.id ? PremiumColors.text.primary : PremiumColors.text.secondary} 
                     />
                    <Text style={[
                      styles.paymentMethodText,
                      selectedPaymentMethod === method.id && styles.selectedPaymentMethodText
                    ]}>
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      )}

        {/* Pay Button - Inside ScrollView */}
        {showBreakdown && (
          <View style={styles.payButtonContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.payButton,
                  isProcessingPayment && styles.processingButton
                ]}
                onPress={handlePayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.payButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.payButtonText}>
                      Pay {formatCurrency(paymentBreakdown.finalPayable)}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Extra spacing for keyboard */}
        <View style={{ height: 50 }} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const BreakdownItem = ({ label, amount, icon, isDiscount = false, isPaid = false, showPlusSign = false }: any) => (
  <View style={styles.breakdownItem}>
    <View style={styles.breakdownItemLeft}>
      <Ionicons 
        name={icon} 
        size={16} 
        color={isDiscount ? '#4CAF50' : isPaid ? '#007AFF' : '#666'} 
      />
      <Text style={styles.breakdownItemLabel}>{label}</Text>
    </View>
    <Text style={[
      styles.breakdownItemAmount,
      isDiscount && styles.discountAmount,
      isPaid && styles.paidAmount
    ]}>
      {amount < 0 ? '-' : (showPlusSign && amount > 0 ? '+' : '')}₹{Math.abs(amount).toFixed(0)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PremiumColors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.primary,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: PremiumColors.text.secondary,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: PremiumColors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: PremiumColors.text.primary,
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  eventCard: {
    backgroundColor: PremiumColors.background.secondary,
    margin: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  bookingDetails: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginBottom: 2,
  },
  bookingTime: {
    fontSize: 14,
    color: PremiumColors.accent.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    fontStyle: 'italic',
  },
  transactionStatusContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  transactionStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionStatusLabel: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  transactionStatusValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusPaid: {
    color: PremiumColors.success,
  },
  statusPending: {
    color: PremiumColors.warning || '#FFA500',
  },
  inputSection: {
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  doneButton: {
    backgroundColor: PremiumColors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PremiumColors.border,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.secondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    paddingVertical: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: PremiumColors.background.tertiary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  calculatingText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  breakdownContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  breakdownCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 16,
  },
  offerAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  offerAppliedText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.success,
    flex: 1,
  },
  offerSavings: {
    fontSize: 12,
    fontWeight: '700',
    color: PremiumColors.success,
  },
  breakdownItems: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownItemLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  breakdownItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  discountAmount: {
    color: PremiumColors.success,
  },
  paidAmount: {
    color: PremiumColors.info,
  },
  divider: {
    height: 1,
    backgroundColor: PremiumColors.border,
    marginVertical: 8,
  },
  finalAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    padding: 16,
    borderRadius: 12,
  },
  finalAmountLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  finalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.accent.primary,
  },
  paymentMethodsSection: {
    marginTop: 20,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  selectedPaymentMethod: {
    backgroundColor: PremiumColors.accent.primary,
    borderColor: PremiumColors.accent.primary,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
  },
  selectedPaymentMethodText: {
    color: PremiumColors.text.primary,
  },
  payButtonContainer: {
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.accent.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: PremiumColors.accent.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processingButton: {
    backgroundColor: PremiumColors.text.muted,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
});

export default EventPayBillScreen;
