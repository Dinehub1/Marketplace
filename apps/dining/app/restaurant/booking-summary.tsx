import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTheme, useThemeColors } from '../../hooks/useThemeColors';
import { bookTableWithRazorpay, toLocalDate } from '../../services/dineinCheckout';
import { sendBookingTestNotification } from '../../utils/testNotifications';

const { width } = Dimensions.get('window');

export default function BookingSummaryScreen() {
  const theme = useThemeColors();
  const currentTheme = useCurrentTheme();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [specialRequests, setSpecialRequests] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Green theme colors (consistent across themes)
  const greenTheme = {
    primary: '#10B981',
    secondary: '#34D399',
    dark: '#059669',
    background: currentTheme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
  };
  
  // Extract booking details from params
  const {
    restaurantId,
    restaurantName,
    restaurantImage,
    restaurantLocation,
    tableId,
    tableName,
    tablePrice,
    date,
    timeSlot,
    mealPeriod,
    guests,
    selectedOfferId,
    selectedOfferTitle,
  } = params;

  // Use the correct advance payment passed from booking page
  const guestCount = parseInt(guests?.toString() || '2');
  const totalAdvanceAmount = parseInt(tablePrice?.toString() || '0');

  const bookingDate = new Date(date as string);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleProceedToPayment = () => {
    // If advance amount is zero (no cover charge), skip payment and create booking directly
    if (Number(tablePrice) === 0) {
      console.log('📋 Zero advance payment - creating booking directly');
      handleDirectBookingCreation();
      return;
    }

    // Otherwise, proceed to payment gateway
    router.push({
      pathname: '/restaurant/payment',
      params: {
        restaurantId,
        restaurantName,
        restaurantImage,
        restaurantLocation,
        tableName,
        tablePrice: totalAdvanceAmount.toString(), // Use calculated advance amount
        date,
        timeSlot,
        mealPeriod,
        guests,
        specialRequests,
        bookingType: 'dine-in', // Add booking type identifier
        selectedOfferId,
        selectedOfferTitle,
      }
    });
  };

  // A booking with nothing to pay still goes through dinein-checkout: the server re-prices it
  // from the offer, and confirms it only if it really is free (otherwise Razorpay opens).
  const handleDirectBookingCreation = async () => {
    try {
      const result = await bookTableWithRazorpay(
        {
          user_id: user?.id ?? null,
          restaurant_id: String(restaurantId),
          booking_date: toLocalDate(String(date)),
          booking_time: String(timeSlot),
          party_size: parseInt(String(guests), 10),
          meal_period: mealPeriod ? String(mealPeriod) : null,
          special_requests: specialRequests ? String(specialRequests) : null,
          offer_id: selectedOfferId ? String(selectedOfferId) : null,
          customer_name: user?.full_name ?? null,
          customer_phone: user?.phone_number ?? null,
          customer_email: user?.email ?? null,
        },
        { restaurantName: String(restaurantName ?? '') }
      );
      if (result.status === 'cancelled') return;

      // 🔔 Send test notification for the booking
      await sendBookingTestNotification({
        bookingId: result.booking.id,
        restaurantName: restaurantName as string,
        bookingDate: date as string,
        bookingTime: timeSlot as string,
        partySize: parseInt(guests as string),
        customerName: user?.full_name || 'Guest',
      }, 60); // Send notification after 60 seconds for testing

      // Navigate to success page or orders
      router.push('/orders');
    } catch (error) {
      console.error('❌ Error creating direct booking:', error);
      Alert.alert('Booking failed', (error as Error).message);
    }
  };

  const handleModifyBooking = () => {
    router.back();
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
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {/* Restaurant Info Card */}
        <View style={styles.restaurantCard}>
          <Image source={{ uri: restaurantImage as string }} style={styles.restaurantImage} />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurantName}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={theme.text.tertiary} />
              <Text style={styles.location}>{restaurantLocation}</Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Open until 11:00 PM</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call" size={20} color={greenTheme.primary} />
          </TouchableOpacity>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color={greenTheme.primary} />
            <Text style={styles.cardTitle}>Booking Details</Text>
            <TouchableOpacity onPress={handleModifyBooking} style={styles.modifyButton}>
              <Text style={styles.modifyText}>Modify</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar-outline" size={16} color={greenTheme.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="time-outline" size={16} color={greenTheme.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{timeSlot}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="people-outline" size={16} color={greenTheme.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Guests</Text>
                <Text style={styles.detailValue}>{guests} guest{Number(guests) > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons name="restaurant-outline" size={16} color={greenTheme.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Table</Text>
                <Text style={styles.detailValue}>{tableName}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selected Offer Card */}
        {selectedOfferId && selectedOfferTitle && (
          <View style={styles.offerCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag" size={20} color={greenTheme.primary} />
              <Text style={styles.cardTitle}>Applied Offer</Text>
            </View>
            <View style={styles.offerDetails}>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>OFFER APPLIED</Text>
              </View>
              <Text style={styles.offerTitle}>{selectedOfferTitle}</Text>
              <Text style={styles.offerInfo}>
                This offer will be applied to your final bill upon payment.
              </Text>
            </View>
          </View>
        )}

        {/* Special Requests Card */}
        <View style={styles.requestsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubble-outline" size={20} color={greenTheme.primary} />
            <Text style={styles.cardTitle}>Special Requests</Text>
          </View>
          <TextInput
            style={styles.requestsInput}
            placeholder="Any special requests or dietary requirements? (Optional)"
            placeholderTextColor={theme.text.tertiary}
            multiline
            numberOfLines={4}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            textAlignVertical="top"
          />
          <Text style={styles.requestsHint}>
            Let the restaurant know about any allergies, celebrations, or special needs.
          </Text>
        </View>

        {/* Price Breakdown Card */}
        <View style={styles.priceCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color={greenTheme.primary} />
            <Text style={styles.cardTitle}>Price Breakdown</Text>
          </View>

          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {totalAdvanceAmount === 0 ? 'Cover Charge' : 'Advance Payment'}
              </Text>
              <Text style={styles.priceSubtext}>
                {totalAdvanceAmount === 0 
                  ? 'No cover charge required'
                  : `₹${Math.round(totalAdvanceAmount / guestCount)} × ${guestCount} guest${guestCount > 1 ? 's' : ''}`
                }
              </Text>
            </View>
            <View style={styles.priceRowRight}>
              <Text style={styles.priceValue}>
                {totalAdvanceAmount === 0 ? 'FREE' : `₹${totalAdvanceAmount}`}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Pay Now (Advance)</Text>
                <Text style={styles.totalSubtext}>Will be deducted from final bill</Text>
              </View>
              <Text style={styles.totalValue}>₹{totalAdvanceAmount}</Text>
            </View>
          </View>

          <View style={styles.refundPolicy}>
            <Ionicons name="information-circle-outline" size={16} color={greenTheme.primary} />
            <Text style={styles.refundText}>
              Free cancellation up to 2 hours before your reservation
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
            <Text style={styles.cardTitle}>Important Notes</Text>
          </View>
          <View style={styles.notesList}>
            <View style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>Please arrive on time. Table will be held for 15 minutes</Text>
            </View>
            <View style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>Dress code: Smart casual (no shorts or flip-flops)</Text>
            </View>
            <View style={styles.noteItem}>
              <Text style={styles.noteBullet}>•</Text>
              <Text style={styles.noteText}>Contact restaurant directly for special dietary requirements</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalSummary}>
          <Text style={styles.footerTotalLabel}>
            {Number(tablePrice) === 0 ? 'Booking Status' : 'Total Amount'}
          </Text>
          <Text style={styles.footerTotalValue}>
            {Number(tablePrice) === 0 
              ? 'FREE BOOKING' 
              : `₹${totalAdvanceAmount}`
            }
          </Text>
        </View>
        <TouchableOpacity onPress={handleProceedToPayment} style={styles.proceedButton}>
          <Text style={styles.proceedButtonText}>
            {Number(tablePrice) === 0 ? 'Confirm Booking' : 'Proceed to Payment'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: theme.background.secondary,
    margin: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text.primary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: theme.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: greenTheme.primary,
  },
  statusText: {
    fontSize: 12,
    color: greenTheme.primary,
    fontWeight: '500',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: greenTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
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
    flex: 1,
  },
  modifyButton: {
    backgroundColor: greenTheme.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modifyText: {
    fontSize: 12,
    fontWeight: '600',
    color: greenTheme.primary,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: greenTheme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.text.tertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
  },
  offerCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: greenTheme.primary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  offerDetails: {
    gap: 8,
  },
  offerBadge: {
    backgroundColor: greenTheme.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: greenTheme.primary,
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text.primary,
  },
  offerInfo: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontStyle: 'italic',
  },
  requestsCard: {
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
  requestsInput: {
    backgroundColor: theme.background.tertiary,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: theme.text.primary,
    minHeight: 80,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  requestsHint: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontStyle: 'italic',
  },
  priceCard: {
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
  priceBreakdown: {
    gap: 12,
  },
  priceRow: {
    flex: 1,
  },
  priceRowRight: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 14,
    color: theme.text.secondary,
    fontWeight: '600',
  },
  priceSubtext: {
    fontSize: 12,
    color: theme.text.tertiary,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text.primary,
  },
  totalSubtext: {
    fontSize: 12,
    color: theme.text.tertiary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: greenTheme.primary,
  },
  refundPolicy: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: greenTheme.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  refundText: {
    fontSize: 12,
    color: greenTheme.primary,
    flex: 1,
  },
  notesCard: {
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
  notesList: {
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteBullet: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 2,
  },
  noteText: {
    fontSize: 14,
    color: theme.text.secondary,
    flex: 1,
    lineHeight: 20,
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
  totalSummary: {
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
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: greenTheme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  });
}
