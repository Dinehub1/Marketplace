import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Animated,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

interface PaidEventConfirmationProps {
  eventId: string;
  eventTitle: string;
  eventSubtitle?: string;
  eventImage: string;
  eventVenue: string;
  eventDate: string;
  eventTime: string;
  ticketDetails: string;
  totalAmount: string;
  ticketSubtotal?: string;
  convenienceFee?: string;
  orderId: string;
  paymentMethod?: string;
  paymentStatus?: string;
  bookingIds?: string;
  ticketNumbers?: string;
  fadeAnim: Animated.Value;
}

export default function PaidEventConfirmation({
  eventId,
  eventTitle,
  eventSubtitle,
  eventImage,
  eventVenue,
  eventDate,
  eventTime,
  ticketDetails,
  totalAmount,
  ticketSubtotal,
  convenienceFee,
  orderId,
  paymentMethod = 'UPI',
  paymentStatus = 'Confirmed',
  bookingIds,
  ticketNumbers,
  fadeAnim,
}: PaidEventConfirmationProps) {
  
  const tickets = ticketDetails ? JSON.parse(ticketDetails) : [];
  const ticketNumbersList = ticketNumbers ? JSON.parse(ticketNumbers as string) : [];
  const subtotal = ticketSubtotal ? parseFloat(ticketSubtotal) : 0;
  const fee = convenienceFee ? parseFloat(convenienceFee) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

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

  const { fullDate, day, month } = formatDate(eventDate);

  const handleShare = async () => {
    try {
      const message = `🎫 I've got tickets for ${eventTitle}!\n\nVenue: ${eventVenue}\nDate: ${fullDate}\nTime: ${formatTime(eventTime)}\n\nSee you there! 🎉`;
      
      await Share.share({
        message,
        title: 'Event Tickets',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewOrders = () => {
    router.push('/Ticekts-Bookings/event-tickets');
  };

  const handleBookAnother = () => {
    router.replace('/(tabs)/showtime');
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
          <Text style={styles.successTitle}>Tickets Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your tickets have been sent to your email
          </Text>
        </Animated.View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={[styles.scrollView, { opacity: fadeAnim }]}
      >
        {/* Ticket Card */}
        <View style={styles.section}>
          <View style={styles.ticketCard}>
            {/* Event Header */}
            <View style={styles.ticketHeader}>
              <Image source={{ uri: eventImage }} style={styles.eventImage} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>{eventTitle}</Text>
                {eventVenue && eventVenue !== 'TBD' && (
                  <View style={styles.venueRow}>
                    <Ionicons name="location" size={14} color={PremiumColors.text.secondary} />
                    <Text style={styles.eventVenue} numberOfLines={1}>{eventVenue}</Text>
                  </View>
                )}
                <View style={styles.dateTimeRow}>
                  <Ionicons name="calendar" size={14} color={PremiumColors.text.secondary} />
                  <Text style={styles.eventDateTime}>{fullDate}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Tickets List */}
            <View style={styles.ticketsSection}>
              <Text style={styles.sectionLabel}>Your Tickets</Text>
              {tickets.map((ticket: any, index: number) => (
                <View key={index} style={styles.ticketItem}>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketName}>{ticket.name}</Text>
                    <Text style={styles.ticketQuantity}>{ticket.quantity} {ticket.quantity > 1 ? 'Tickets' : 'Ticket'}</Text>
                  </View>
                  <Text style={styles.ticketPrice}>₹{ticket.price * ticket.quantity}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Payment Details */}
            <View style={styles.paymentSection}>
              {subtotal > 0 && fee > 0 && (
                <>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Subtotal</Text>
                    <Text style={styles.paymentSubValue}>₹{subtotal}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Convenience Fee</Text>
                    <Text style={styles.paymentSubValue}>₹{fee}</Text>
                  </View>
                  <View style={styles.paymentDivider} />
                </>
              )}
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Total Paid</Text>
                <Text style={styles.paymentValue}>₹{totalAmount}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Method</Text>
                <View style={styles.paymentMethodBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={PremiumColors.accent.secondary} />
                  <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <View style={styles.actionIcon}>
                <Ionicons name="share-social" size={20} color={PremiumColors.accent.secondary} />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="download" size={20} color={PremiumColors.accent.secondary} />
              </View>
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Ionicons name="calendar" size={20} color={PremiumColors.accent.secondary} />
              </View>
              <Text style={styles.actionText}>Add to Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Important Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={PremiumColors.info} />
              <Text style={styles.infoTitle}>Important</Text>
            </View>
            <Text style={styles.infoText}>
              • Present this ticket at the venue entrance{'\n'}
              • Arrive 15 minutes before the event starts{'\n'}
              • Carry a valid ID for verification
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleViewOrders} style={styles.secondaryButton}>
          <Ionicons name="ticket" size={20} color={PremiumColors.text.primary} />
          <Text style={styles.secondaryButtonText}>My Tickets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleBookAnother} style={styles.primaryButton}>
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
  ticketCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    padding: 20,
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
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  eventVenue: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDateTime: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginHorizontal: 20,
  },
  ticketsSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 12,
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  ticketQuantity: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  paymentSection: {
    padding: 20,
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 15,
    color: PremiumColors.text.secondary,
  },
  paymentSubValue: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  paymentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginVertical: 8,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  actionsCard: {
    flexDirection: 'row',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: PremiumColors.info,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  infoText: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    lineHeight: 22,
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
