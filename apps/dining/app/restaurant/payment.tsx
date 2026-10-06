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
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTheme, useThemeColors } from '../../hooks/useThemeColors';
import { bookTableWithRazorpay, toLocalDate } from '../../services/dineinCheckout';
import { metaAnalytics } from '../../utils/metaAnalytics';

const { width } = Dimensions.get('window');

/**
 * What Razorpay's sheet offers. Shown for reassurance only: the customer picks inside Razorpay's
 * own sheet, so nothing here is selectable and nothing here holds a balance.
 */
const ACCEPTED_METHODS: { name: string; icon: keyof typeof Ionicons.glyphMap; details: string }[] = [
  { name: 'UPI', icon: 'qr-code-outline', details: 'Google Pay, PhonePe, Paytm and any UPI app' },
  { name: 'Credit / Debit Card', icon: 'card-outline', details: 'Visa, Mastercard, RuPay' },
  { name: 'Net Banking', icon: 'business-outline', details: 'All major banks' },
  { name: 'Wallets', icon: 'wallet-outline', details: 'Paytm, Mobikwik and more' },
];

export default function PaymentScreen() {
  const theme = useThemeColors();
  const currentTheme = useCurrentTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
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
    selectedOfferId,
    selectedOfferTitle,
  } = params;

  // For dine-in, use the correct cover charge passed from booking page
  const guestCountNum = parseInt(guests?.toString() || '2');
  // Display only: dinein-checkout prices the booking itself, and Razorpay's sheet shows that amount.
  const totalAmount = Number(tablePrice) || 0;
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
      const result = await bookTableWithRazorpay(
        {
          user_id: user?.id ?? null,
          restaurant_id: String(restaurantId),
          booking_date: toLocalDate(String(date)),
          booking_time: String(timeSlot),
          party_size: guestCountNum,
          meal_period: mealPeriod ? String(mealPeriod) : null,
          special_requests: specialRequests ? String(specialRequests) : null,
          offer_id: selectedOfferId ? String(selectedOfferId) : null,
          customer_name: user?.full_name ?? null,
          customer_phone: user?.phone_number ?? null,
          customer_email: user?.email ?? null,
        },
        { restaurantName: String(restaurantName ?? ''), themeColor: greenTheme.primary }
      );

      if (result.status === 'cancelled') {
        // The booking stays pending and unconfirmed; the customer can simply try again.
        setIsProcessing(false);
        return;
      }

      const paidAmount = result.amount;
      const { booking } = result;

      // Track successful purchase in Meta (MOST IMPORTANT EVENT!)
      metaAnalytics.logPurchase(
        booking.id,
        'restaurant_booking',
        paidAmount,
        'INR',
        {
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          party_size: guestCountNum,
          booking_date: date,
          booking_time: timeSlot,
          payment_method: 'razorpay',
        }
      );

      // 🔔 Send test notification for the booking
      await sendBookingTestNotification({
        bookingId: booking.id,
        restaurantName: restaurantName as string,
        bookingDate: date as string,
        bookingTime: timeSlot as string,
        partySize: guestCountNum,
        customerName: user?.full_name || 'Guest',
      }, 60); // Send notification after 60 seconds for testing

      if (result.status === 'confirming') {
        Alert.alert(
          'Payment received',
          'Your payment went through and your table is being confirmed. You will see it in My Bookings shortly.'
        );
      }

      // Navigate to confirmation with booking ID
      router.push({
        pathname: '/restaurant/booking-confirmation',
        params: {
          restaurantName,
          tableName,
          tablePrice: paidAmount.toString(),
          date,
          timeSlot,
          guests,
          specialRequests,
          totalAmount: paidAmount.toString(),
          paymentMethod: 'Razorpay',
          bookingId: booking.id,
          bookingType: 'dine-in',
          transactionId: result.paymentId ?? '',
        }
      });
    } catch (error: any) {
      console.error('Payment processing error:', error);
      Alert.alert(
        'Payment Failed',
        error?.message || 'There was an error processing your payment. Please try again.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
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
            <Text style={styles.cardTitle}>Pay securely with Razorpay</Text>
          </View>

          <View style={styles.methodsList}>
            {ACCEPTED_METHODS.map((method) => (
              <View key={method.name} style={styles.methodItem}>
                <View style={styles.methodLeft}>
                  <View style={styles.methodIcon}>
                    <Ionicons name={method.icon} size={20} color={greenTheme.primary} />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.name}</Text>
                    <Text style={styles.methodDetails}>{method.details}</Text>
                  </View>
                </View>
              </View>
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
            Payments are processed by Razorpay. Swaad Ghar never sees or stores your card, UPI or bank details.
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
