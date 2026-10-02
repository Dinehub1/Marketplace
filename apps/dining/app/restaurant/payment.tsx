import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { sendBookingTestNotification } from '../../utils/testNotifications';
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
import { createOfferRedemption, createRestaurantBooking, processSuccessfulPayment } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTheme, useThemeColors } from '../../hooks/useThemeColors';
import { metaAnalytics } from '../../utils/metaAnalytics';
import { processAdvancePayment } from '../../utils/mockPaymentGateway';

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

export default function PaymentScreen() {
  const theme = useThemeColors();
  const currentTheme = useCurrentTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Green theme colors (consistent across themes)
  const greenTheme = {
    primary: '#10B981',
    secondary: '#34D399',
    dark: '#059669',
    background: currentTheme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
  };

  const {
    restaurantId,
    restaurantName,
    tableName,
    tablePrice,
    date,
    timeSlot,
    mealPeriod,
    guests,
    specialRequests,
    bookingType,
    selectedOfferId,
    selectedOfferTitle,
  } = params;

  // For dine-in, use the correct cover charge passed from booking page
  const guestCountNum = parseInt(guests?.toString() || '2');
  const totalAmount = bookingType === 'dine-in' ? Number(tablePrice) : Number(tablePrice) + Math.round(Number(tablePrice) * 0.15);
  const bookingDate = new Date(date as string);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePayment = async () => {
    setIsProcessing(true);
    
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

    try {
      if (bookingType === 'dine-in') {
        console.log('💳 Payment params received:', { restaurantId, restaurantName, timeSlot, totalAmount });
        
        // Create dine-in booking with new system
        const bookingData = {
          user_id: user?.id,
          restaurant_id: restaurantId,
          booking_date: date,
          booking_time: timeSlot,
          party_size: guestCountNum,
          customer_name: user?.full_name || 'Test Customer',
          customer_phone: user?.phone_number || '+1234567890',
          customer_email: user?.email || 'test@example.com',
          special_requests: specialRequests || null,
          meal_period: mealPeriod,
          advance_payment: totalAmount,
          total_cover_charge: totalAmount,
          cover_charge_per_person: totalAmount / guestCountNum,
          duration_minutes: 120,
          offer_id: selectedOfferId || null,
        };

        console.log('📝 Creating booking with new system:', bookingData);
        const { data: bookingResult, error: bookingError } = await createRestaurantBooking(bookingData);
        
        if (bookingError) {
          throw new Error(`Booking creation failed: ${bookingError.message}`);
        }

        const { booking, transaction } = bookingResult;

        // Process payment through mock gateway
        const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
        const paymentResult = await processAdvancePayment({
          amount: totalAmount,
          paymentMethod: selectedPaymentMethod,
          userId: user?.id,
          restaurantId: restaurantId,
          bookingId: booking.id
        });

        if (!paymentResult.success) {
          throw new Error(paymentResult.error.message);
        }

        // Update transaction status
        await processSuccessfulPayment(transaction.id, paymentResult.data);

        // Track successful purchase in Meta (MOST IMPORTANT EVENT!)
        metaAnalytics.logPurchase(
          booking.id,
          'restaurant_booking',
          totalAmount,
          'INR',
          {
            restaurant_id: restaurantId,
            restaurant_name: restaurantName,
            party_size: guestCountNum,
            booking_date: date,
            booking_time: timeSlot,
            payment_method: selectedMethod?.name || 'unknown',
          }
        );

        // If booking has an offer, create redemption record
        if (selectedOfferId) {
          console.log('🎁 Processing offer redemption for offer:', selectedOfferId);
          
          const { error: redemptionError } = await createOfferRedemption(
            selectedOfferId,
            user.id,
            date,
            'All Day'
          );
          
          if (redemptionError) {
            console.error('Offer redemption creation failed:', redemptionError);
          } else {
            console.log('✅ Offer redemption record created');
          }
        }

        // 🔔 Send test notification for the booking
        await sendBookingTestNotification({
          bookingId: booking.id,
          restaurantName: restaurantName as string,
          bookingDate: date as string,
          bookingTime: timeSlot as string,
          partySize: guestCountNum,
          customerName: user?.full_name || 'Guest',
        }, 60); // Send notification after 60 seconds for testing

        // Navigate to confirmation with booking ID
        router.push({
          pathname: '/restaurant/booking-confirmation',
          params: {
            restaurantName,
            tableName,
            tablePrice: totalAmount.toString(),
            date,
            timeSlot,
            guests,
            specialRequests,
            totalAmount: totalAmount.toString(),
            paymentMethod: selectedMethod?.name,
            bookingId: booking.id,
            bookingType: 'dine-in',
            transactionId: paymentResult.data.transaction_id,
          }
        });
      } else {
        // Simulate regular table booking (legacy flow)
        setTimeout(() => {
          setIsProcessing(false);
          router.push({
            pathname: '/restaurant/booking-confirmation',
            params: {
              restaurantName,
              tableName,
              tablePrice,
              date,
              timeSlot,
              guests,
              specialRequests,
              totalAmount: totalAmount.toString(),
              paymentMethod: paymentMethods.find(m => m.id === selectedPaymentMethod)?.name,
              bookingId: `BK${Date.now()}`,
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert(
        'Payment Failed',
        'There was an error processing your payment. Please try again.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
    }
  };

  const getPaymentIcon = (iconName: string) => {
    switch (iconName) {
      case 'qr-code': return 'qr-code-outline';
      case 'card': return 'card-outline';
      case 'wallet': return 'wallet-outline';
      default: return 'card-outline';
    }
  };

  // Dynamic styles based on theme
  const styles = createStyles(theme, greenTheme, currentTheme);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background.primary} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {/* Amount Summary */}
        <View style={styles.amountCard}>
          <View style={styles.amountHeader}>
            <Ionicons name="receipt-outline" size={24} color={greenTheme.primary} />
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>₹{totalAmount}</Text>
            </View>
            <View style={styles.amountBadge}>
              <Text style={styles.badgeText}>Pay Now</Text>
            </View>
          </View>
          
          <View style={styles.bookingSummary}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>
              {tableName} at {restaurantName} • {timeSlot} • {guests} guest{Number(guests) > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summaryDate}>
              {bookingDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentMethodsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color={greenTheme.primary} />
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
                      color={selectedPaymentMethod === method.id ? '#FFFFFF' : greenTheme.primary}
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
            <Ionicons name="shield-checkmark" size={20} color={greenTheme.primary} />
            <Text style={styles.securityTitle}>Secure Payment</Text>
          </View>
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
          </Text>
          <View style={styles.securityFeatures}>
            <View style={styles.securityFeature}>
              <Ionicons name="checkmark-circle" size={16} color={greenTheme.primary} />
              <Text style={styles.featureText}>256-bit SSL encryption</Text>
            </View>
            <View style={styles.securityFeature}>
              <Ionicons name="checkmark-circle" size={16} color={greenTheme.primary} />
              <Text style={styles.featureText}>PCI DSS compliant</Text>
            </View>
            <View style={styles.securityFeature}>
              <Ionicons name="checkmark-circle" size={16} color={greenTheme.primary} />
              <Text style={styles.featureText}>No card details stored</Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsCard}>
          <Text style={styles.termsText}>
            By proceeding with the payment, you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
            <Text style={styles.termsLink}>Cancellation Policy</Text>.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Payment Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalValue}>₹{totalAmount}</Text>
        </View>
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            onPress={handlePayment} 
            style={[styles.payButton, isProcessing && styles.processingButton]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <Animated.View style={styles.loadingSpinner}>
                  <Ionicons name="sync" size={20} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.payButtonText}>Processing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>Pay ₹{totalAmount}</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// Styles function to create dynamic styles based on theme
function createStyles(theme: any, greenTheme: any, currentTheme: string) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: theme.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  amountCard: {
    backgroundColor: theme.background.secondary,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: theme.text.secondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text.primary,
  },
  amountBadge: {
    backgroundColor: greenTheme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bookingSummary: {
    backgroundColor: theme.background.tertiary,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: theme.text.secondary,
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 13,
    color: greenTheme.primary,
    fontWeight: '500',
  },
  paymentMethodsCard: {
    backgroundColor: theme.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text.primary,
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
    borderColor: theme.border,
    backgroundColor: theme.background.tertiary,
  },
  selectedMethod: {
    borderColor: greenTheme.primary,
    backgroundColor: greenTheme.background,
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
    backgroundColor: greenTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedMethodIcon: {
    backgroundColor: greenTheme.primary,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 2,
  },
  selectedMethodText: {
    color: greenTheme.primary,
  },
  methodDetails: {
    fontSize: 12,
    color: theme.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: greenTheme.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: greenTheme.primary,
  },
  securityCard: {
    backgroundColor: theme.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text.primary,
  },
  securityText: {
    fontSize: 14,
    color: theme.text.secondary,
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
    color: theme.text.secondary,
  },
  termsCard: {
    backgroundColor: theme.background.secondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  termsText: {
    fontSize: 12,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: greenTheme.primary,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: theme.background.secondary,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: theme.background.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.secondary,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: greenTheme.primary,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: greenTheme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  processingButton: {
    backgroundColor: theme.text.tertiary,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingSpinner: {
    // Add rotation animation here if needed
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  });
}
