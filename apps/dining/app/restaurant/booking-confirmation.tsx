import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AppColors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const {
    restaurantName,
    tableName,
    tablePrice,
    date,
    timeSlot,
    guests,
    specialRequests,
    totalAmount,
    paymentMethod,
    bookingId,
  } = params;

  const bookingDate = new Date(date as string);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    // Success animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      const message = `🎉 Table booked successfully!\n\nRestaurant: ${restaurantName}\nTable: ${tableName}\nDate: ${formattedDate}\nTime: ${timeSlot}\nGuests: ${guests}\nBooking ID: ${bookingId}\n\nSee you there! 🍽️`;
      
      await Share.share({
        message,
        title: 'Table Booking Confirmation',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewBookings = () => {
    router.push('/Ticekts-Bookings/event-tickets');
  };

  const handleBookAnother = () => {
    router.push('/(tabs)/showtime' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      
      {/* Success Header */}
      <View style={styles.successHeader}>
        <Animated.View 
          style={[
            styles.successIconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={AppColors.white} />
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.successTextContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your table has been successfully reserved
          </Text>
        </Animated.View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={24} color={AppColors.primary} />
            <Text style={styles.cardTitle}>Booking Details</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color={AppColors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bookingInfo}>
            <View style={styles.bookingIdContainer}>
              <Text style={styles.bookingIdLabel}>Booking ID</Text>
              <Text style={styles.bookingIdValue}>{bookingId}</Text>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="restaurant-outline" size={18} color={AppColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Restaurant</Text>
                  <Text style={styles.detailValue}>{restaurantName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formattedDate}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time-outline" size={18} color={AppColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{timeSlot}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="people-outline" size={18} color={AppColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Guests</Text>
                  <Text style={styles.detailValue}>{guests} guest{Number(guests) > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="grid-outline" size={18} color={AppColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Table</Text>
                  <Text style={styles.detailValue}>{tableName}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="card-outline" size={18} color={AppColors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Payment</Text>
                  <Text style={styles.detailValue}>₹{totalAmount} via {paymentMethod}</Text>
                </View>
              </View>
            </View>

            {specialRequests && (
              <View style={styles.specialRequestsContainer}>
                <Text style={styles.specialRequestsLabel}>Special Requests</Text>
                <Text style={styles.specialRequestsText}>{specialRequests}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={24} color={AppColors.blue[500]} />
            <Text style={styles.cardTitle}>Important Information</Text>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet}>
                <Ionicons name="time" size={16} color={AppColors.blue[500]} />
              </View>
              <Text style={styles.infoText}>
                Please arrive on time. Your table will be held for 15 minutes past the reservation time.
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoBullet}>
                <Ionicons name="call" size={16} color={AppColors.blue[500]} />
              </View>
              <Text style={styles.infoText}>
                For any changes or cancellations, please contact the restaurant directly or use the app.
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoBullet}>
                <Ionicons name="shield-checkmark" size={16} color={AppColors.blue[500]} />
              </View>
              <Text style={styles.infoText}>
                Free cancellation available up to 2 hours before your reservation time.
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionButtonIcon}>
                <Ionicons name="call-outline" size={20} color={AppColors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Call Restaurant</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionButtonIcon}>
                <Ionicons name="location-outline" size={20} color={AppColors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionButtonIcon}>
                <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating Prompt */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingHeader}>
            <Ionicons name="star-outline" size={24} color={AppColors.yellow[500]} />
            <Text style={styles.ratingTitle}>Enjoying DropBy?</Text>
          </View>
          <Text style={styles.ratingText}>
            Rate us on the app store and help others discover great dining experiences!
          </Text>
          <TouchableOpacity style={styles.rateButton}>
            <Text style={styles.rateButtonText}>Rate App</Text>
            <Ionicons name="star" size={16} color={AppColors.yellow[500]} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity onPress={handleViewBookings} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleBookAnother} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Book Another Table</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray[50],
  },
  successHeader: {
    backgroundColor: AppColors.primary,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTextContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  detailsCard: {
    backgroundColor: AppColors.white,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    color: AppColors.black,
    flex: 1,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    gap: 20,
  },
  bookingIdContainer: {
    backgroundColor: AppColors.gray[50],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 12,
    color: AppColors.gray[600],
    marginBottom: 4,
  },
  bookingIdValue: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primary,
    letterSpacing: 1,
  },
  detailsGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
  },
  specialRequestsContainer: {
    backgroundColor: AppColors.gray[50],
    padding: 16,
    borderRadius: 12,
  },
  specialRequestsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
    marginBottom: 8,
  },
  specialRequestsText: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.blue[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.gray[700],
    flex: 1,
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: AppColors.gray[50],
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.black,
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
  },
  ratingText: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 20,
    marginBottom: 16,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.yellow[50],
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.yellow[600],
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: AppColors.gray[100],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.gray[700],
  },
  primaryButton: {
    flex: 1,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.white,
  },
});
