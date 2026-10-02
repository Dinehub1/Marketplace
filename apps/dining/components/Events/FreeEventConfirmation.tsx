import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

interface FreeEventConfirmationProps {
  bookingId: string;
  eventTitle: string;
  eventImage: string;
  eventLocation: string;
  date: string;
  timeSlot: string;
  timeSection?: string;
  guests: string;
  selectedOfferTitle?: string;
  bookingStatus?: string;
  fadeAnim: Animated.Value;
}

export default function FreeEventConfirmation({
  bookingId,
  eventTitle,
  eventImage,
  eventLocation,
  date,
  timeSlot,
  timeSection,
  guests,
  selectedOfferTitle,
  bookingStatus,
  fadeAnim,
}: FreeEventConfirmationProps) {
  
  const bookingDate = new Date(date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/showtime');
  };

  const handleViewBookings = () => {
    router.replace('/Ticekts-Bookings/event-tickets');
  };

  return (
    <>
      {/* Success Header */}
      <View style={styles.successHeader}>
        <Animated.View 
          style={[
            styles.successIconContainer,
            { 
              opacity: fadeAnim,
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={PremiumColors.accent.secondary} />
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.successTextContainer, { opacity: fadeAnim }]}>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            You're all set for the event
          </Text>
        </Animated.View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {/* Booking Details Card */}
        <View style={styles.section}>
          <View style={styles.card}>
            {/* Booking ID Header */}
            <View style={styles.bookingHeader}>
              <View>
                <Text style={styles.bookingIdLabel}>Booking ID</Text>
                <Text style={styles.bookingIdValue}>{bookingId}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={PremiumColors.accent.secondary} />
                <Text style={styles.statusText}>CONFIRMED</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Event Info */}
            <View style={styles.eventSection}>
              <Image source={{ uri: eventImage }} style={styles.eventImage} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={PremiumColors.text.secondary} />
                  <Text style={styles.location} numberOfLines={1}>{eventLocation}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Booking Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar-outline" size={18} color={PremiumColors.accent.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formattedDate}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time-outline" size={18} color={PremiumColors.accent.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{formatTime(timeSlot)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="people-outline" size={18} color={PremiumColors.accent.secondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Party Size</Text>
                  <Text style={styles.detailValue}>{guests} {Number(guests) > 1 ? 'Guests' : 'Guest'}</Text>
                </View>
              </View>

              {selectedOfferTitle && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="pricetag" size={18} color={PremiumColors.accent.secondary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Applied Offer</Text>
                    <Text style={[styles.detailValue, styles.offerValue]}>{selectedOfferTitle}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <View style={styles.card}>
            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Check your email for confirmation</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Arrive 10 minutes early</Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Have a great time!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Important Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={PremiumColors.info} />
              <Text style={styles.infoTitle}>Free Event</Text>
            </View>
            <Text style={styles.infoText}>
              No payment required. You can cancel anytime from your bookings.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleViewBookings} style={styles.secondaryButton}>
          <Ionicons name="ticket" size={20} color={PremiumColors.text.primary} />
          <Text style={styles.secondaryButtonText}>My Bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleGoHome} style={styles.primaryButton}>
          <Ionicons name="home" size={20} color={PremiumColors.text.primary} />
          <Text style={styles.primaryButtonText}>Explore More</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  successHeader: {
    backgroundColor: PremiumColors.background.primary,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTextContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 20,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    marginBottom: 4,
  },
  bookingIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginVertical: 16,
  },
  eventSection: {
    flexDirection: 'row',
    gap: 16,
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: PremiumColors.background.tertiary,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    flex: 1,
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
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  offerValue: {
    color: PremiumColors.accent.secondary,
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: PremiumColors.text.primary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: PremiumColors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  infoText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: PremiumColors.background.secondary,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.background.tertiary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.accent.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
});
