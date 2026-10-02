import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

interface FreeEventSummaryProps {
  eventImage: string;
  eventTitle: string;
  eventLocation: string;
  date: string;
  timeSlot: string;
  timeSection: string;
  guests: string | number;
  selectedOfferId?: string | null;
  selectedOfferTitle?: string | null;
  coverChargePerPerson?: string | number;
  totalCoverCharge?: string | number;
  specialRequests: string;
  onSpecialRequestsChange: (text: string) => void;
  onModifyBooking: () => void;
  onProceed: () => void;
  isProcessing?: boolean;
}

export default function FreeEventSummary({
  eventImage,
  eventTitle,
  eventLocation,
  date,
  timeSlot,
  timeSection,
  guests,
  selectedOfferId,
  selectedOfferTitle,
  coverChargePerPerson,
  totalCoverCharge,
  specialRequests,
  onSpecialRequestsChange,
  onModifyBooking,
  onProceed,
  isProcessing = false,
}: FreeEventSummaryProps) {
  
  const bookingDate = new Date(date);
  const formattedDate = bookingDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const coverChargePerPersonAmount = parseFloat(coverChargePerPerson?.toString() || '0');
  const coverCharge = parseFloat(totalCoverCharge?.toString() || '0');
  const hasCoverCharge = coverCharge > 0;
  const guestCount = Number(guests);

  // No taxes or fees on cover charge - direct amount only
  const totalPayable = coverCharge;

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // Check if time already has AM/PM
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  return (
    <>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
      >
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={styles.eventInfoSection}>
            <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={PremiumColors.text.secondary} />
              <Text style={styles.venueAddress} numberOfLines={1}>{eventLocation}</Text>
            </View>
            <View style={styles.freeEventBadge}>
              <Ionicons name="gift" size={12} color={PremiumColors.accent.secondary} />
              <Text style={styles.freeEventText}>Free Entry Event</Text>
            </View>
          </View>
          <Image 
            source={{ uri: eventImage }} 
            style={styles.eventImage}
            defaultSource={require('../../assets/default-image.jpg')}
          />
        </View>

        {/* Event Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Schedule</Text>
          <View style={styles.card}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="calendar-outline" size={18} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>{formattedDate}</Text>
              </View>
            </View>
            
            <View style={styles.scheduleDivider} />
            
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="time-outline" size={18} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>{formatTime(timeSlot)}</Text>
              </View>
            </View>

            <View style={styles.scheduleDivider} />
            
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="people-outline" size={18} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Party Size</Text>
                <Text style={styles.scheduleValue}>{guestCount} {guestCount > 1 ? 'Guests' : 'Guest'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Offers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Applied Offers</Text>
          </View>
          {selectedOfferId && selectedOfferTitle ? (
            <View style={styles.offerCard}>
              <View style={styles.offerIcon}>
                <Ionicons name="pricetag" size={20} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.offerContent}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerTitle}>{selectedOfferTitle}</Text>
                  <View style={styles.offerAppliedBadge}>
                    <Text style={styles.offerAppliedText}>APPLIED</Text>
                  </View>
                </View>
                {hasCoverCharge && (
                  <Text style={styles.offerDescription}>
                    Cover: ₹{coverChargePerPersonAmount}/person × {guestCount} = ₹{coverCharge}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.offerCard}>
              <View style={styles.offerIcon}>
                <Ionicons name="pricetag" size={20} color={PremiumColors.text.tertiary} />
              </View>
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>No offers available</Text>
                <Text style={styles.offerDescription}>Check back later for special deals</Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Summary */}
        {hasCoverCharge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cover Charge</Text>
                <Text style={styles.summaryValue}>₹{coverChargePerPersonAmount}/person × {guestCount}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>₹{totalPayable}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.card}>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Customer Name</Text>
              <Text style={styles.customerValue}>John Doe</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Phone Number</Text>
              <Text style={styles.customerValue}>+91 98765 43210</Text>
            </View>
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Email Address</Text>
              <Text style={styles.customerValue}>john.doe@example.com</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>
              {hasCoverCharge ? 'Total Payable' : 'Booking Status'}
            </Text>
            <Text style={styles.footerAmount}>
              {hasCoverCharge ? `₹${totalPayable}` : 'FREE'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onProceed} 
            style={[styles.proceedButton, isProcessing && styles.processingButton]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={styles.proceedButtonText}>Processing...</Text>
            ) : (
              <>
                {hasCoverCharge ? (
                  <>
                    <Ionicons name="lock-closed" size={18} color={PremiumColors.text.primary} />
                    <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={PremiumColors.text.primary} />
                    <Text style={styles.proceedButtonText}>Confirm Booking</Text>
                  </>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  eventHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  eventInfoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 6,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  venueAddress: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    lineHeight: 16,
    flex: 1,
  },
  freeEventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  freeEventText: {
    fontSize: 11,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  eventImage: {
    width: 80,
    height: 107,
    borderRadius: 12,
    backgroundColor: PremiumColors.background.tertiary,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    padding: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  scheduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    marginBottom: 3,
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginVertical: 12,
  },
  offerCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerContent: {
    flex: 1,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    flex: 1,
  },
  offerAppliedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offerAppliedText: {
    fontSize: 10,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
    letterSpacing: 0.5,
  },
  offerDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: PremiumColors.text.primary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    color: PremiumColors.text.primary,
    fontWeight: '700',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  customerLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  customerValue: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: PremiumColors.border,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    marginBottom: 4,
  },
  footerAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PremiumColors.accent.secondary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: PremiumColors.accent.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  processingButton: {
    backgroundColor: PremiumColors.text.tertiary,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
});

