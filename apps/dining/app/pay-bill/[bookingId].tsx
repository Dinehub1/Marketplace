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
  calculatePaymentBreakdown,
  createRestaurantPayment,
  getBookingById,
  processSuccessfulPayment
} from '../../config/supabase';
import { AppColors, PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatCurrency,
  PAYMENT_METHODS,
  processFinalBillPayment,
  validatePaymentAmount
} from '../../utils/mockPaymentGateway';

const { width } = Dimensions.get('window');

export default function PayBillScreen() {
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams();
  const [booking, setBooking] = useState<any>(null);
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
    if (billAmount && parseFloat(billAmount) > 0) {
      setIsCalculating(true);
      
      const timeoutId = setTimeout(() => {
        calculatePaymentBreakdownHandler(parseFloat(billAmount));
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setShowBreakdown(false);
      setPaymentBreakdown(null);
    }
  }, [billAmount, booking]);

  const loadBookingDetails = async () => {
    try {
      console.log('📋 Loading booking details for:', bookingId);
      
      // Get real booking data from database by booking ID
      const { data: targetBooking, error } = await getBookingById(bookingId);
      
      if (error) throw error;
      
      if (!targetBooking) {
        throw new Error('Booking not found');
      }

      // Format the booking data with restaurant fee configuration
      const formattedBooking = {
        id: targetBooking.id,
        restaurant: {
          name: targetBooking.restaurants?.name || 'Nothing Before Coffee',
          image: targetBooking.restaurants?.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
        },
        restaurantData: targetBooking.restaurants, // Full restaurant data with fee config
        party_size: targetBooking.party_size,
        booking_date: targetBooking.booking_date,
        booking_time: targetBooking.booking_time,
        total_cover_charge: parseFloat(targetBooking.total_cover_charge) || 0,
        offer: targetBooking.dinein_offers ? {
          id: targetBooking.dinein_offers.id,
          title: targetBooking.dinein_offers.title,
          discount_type: targetBooking.dinein_offers.discount_type,
          discount_value: targetBooking.dinein_offers.discount_value
        } : null
      };

      console.log('✅ Loaded booking details:', formattedBooking);
      setBooking(formattedBooking);
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentBreakdownHandler = (amount: number) => {
    if (!booking) return;
    
    // Use dynamic fee calculation with restaurant data
    const breakdown = calculatePaymentBreakdown(
      amount,
      booking.offer,
      booking.total_cover_charge,
      booking.restaurantData // Pass restaurant data for dynamic fees
    );
    
    console.log('💰 Dynamic fee breakdown:', breakdown);
    
    setPaymentBreakdown(breakdown);
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
      // Create payment record in database
      const { data: paymentData, error: paymentError } = await createRestaurantPayment(
        bookingId,
        paymentBreakdown
      );

      if (paymentError) throw paymentError;

      // `error` and `data` are independent optional fields, so the line above does not
      // narrow `data`; this is what makes `paymentData.transaction.id` below safe.
      if (!paymentData) throw new Error('Payment record was not created');

      // Process payment through mock gateway
      const paymentResult = await processFinalBillPayment({
        amount: paymentBreakdown.finalPayable,
        paymentMethod: selectedPaymentMethod,
        userId: user?.id,
        restaurantId: booking.restaurant_id,
        bookingId: bookingId,
        paymentBreakdown
      });

      // `processFinalBillPayment` is a plain-JS union with no discriminant, so `success`
      // does not narrow `error`/`data`. Checking each before use also replaces the old
      // `paymentResult.error.message`, which would have thrown a bare TypeError had the
      // gateway ever failed without a `message`.
      if (!paymentResult.success) {
        throw new Error(paymentResult.error?.message || 'Payment failed. Please try again.');
      }
      if (!paymentResult.data) throw new Error('Payment gateway returned no data');
      const gatewayResponse = paymentResult.data;

      // Update transaction status
      const { error: statusError } = await processSuccessfulPayment(
        paymentData.transaction.id,
        gatewayResponse
      );

      if (statusError) throw statusError;

      // Stop pulse animation
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      // Navigate to success page
      router.replace({
        pathname: '/payment-success',
        params: {
          type: 'final_bill',
          amount: paymentBreakdown.finalPayable,
          transactionId: gatewayResponse.transaction_id,
          restaurantName: booking.restaurant.name,
          bookingId: bookingId
        }
      });

    } catch (error: any) {
      console.error('Payment error:', error);
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
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={AppColors.gray[400]} />
        <Text style={styles.errorText}>Booking not found</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Bill</Text>
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

      {/* Restaurant Info */}
      <View style={styles.restaurantCard}>
        <Image source={{ uri: booking.restaurant.image }} style={styles.restaurantImage} />
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{booking.restaurant.name}</Text>
          <Text style={styles.bookingDetails}>
            {booking.party_size} guests • Table {booking.id.slice(0, 8)}
          </Text>
          <Text style={styles.bookingTime}>
            {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
          </Text>
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
          <ActivityIndicator size="small" color="#007AFF" />
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
                <Ionicons name="pricetag" size={16} color="#4CAF50" />
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
              
              {paymentBreakdown.discountAmount > 0 && (
                <BreakdownItem 
                  label="Discount" 
                  amount={-paymentBreakdown.discountAmount}
                  icon="pricetag"
                  isDiscount
                />
              )}
              
              <BreakdownItem 
                label="After Discount" 
                amount={paymentBreakdown.afterDiscount}
                icon="calculator"
              />
              
              <BreakdownItem 
                label="Cover Charge (Paid)" 
                amount={-paymentBreakdown.coverCharge}
                icon="checkmark-circle"
                isPaid
              />
              
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
                       color={selectedPaymentMethod === method.id ? AppColors.white : AppColors.gray[600]} 
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
}

const BreakdownItem = ({ label, amount, icon, isDiscount = false, isPaid = false }: any) => (
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
      {amount > 0 ? '+' : ''}₹{Math.abs(amount).toFixed(2)}
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
  restaurantCard: {
    backgroundColor: PremiumColors.background.secondary,
    margin: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
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
    backgroundColor: PremiumColors.background.secondary,
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
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  selectedPaymentMethod: {
    backgroundColor: PremiumColors.accent.primary,
    borderColor: AppColors.primary,
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
    shadowOpacity: 0.1,
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
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  processingButton: {
    backgroundColor: AppColors.gray[400],
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
