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

interface PaidEventSummaryProps {
  eventImage: string;
  eventTitle: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  eventEndTime?: string;
  startTimestamp?: string;
  endTimestamp?: string;
  eventVenue?: string;
  tickets: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    ticket_cover_amount?: number;
    ticket_cover_enabled?: boolean;
  }>;
  totalAmount: number;
  convenienceFee?: number; // ✅ Add optional convenience fee prop
  specialRequests: string;
  onSpecialRequestsChange: (text: string) => void;
  onModifyBooking: () => void;
  onProceed: () => void;
  isProcessing?: boolean;
}

export default function PaidEventSummary({
  eventImage,
  eventTitle,
  eventLocation,
  eventDate,
  eventTime,
  eventEndTime,
  startTimestamp,
  endTimestamp,
  eventVenue,
  tickets,
  totalAmount,
  convenienceFee: propConvenienceFee, // ✅ Receive convenience fee from parent
  specialRequests,
  onSpecialRequestsChange,
  onModifyBooking,
  onProceed,
  isProcessing = false,
}: PaidEventSummaryProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Convert Unix timestamp to readable time
  const formatTimestampToTime = (timestamp: string | number) => {
    if (!timestamp) return '';
    const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    const date = new Date(timestampNum * 1000); // Convert Unix timestamp to milliseconds
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  // Use timestamps if available, otherwise fall back to eventTime
  const displayStartTime = startTimestamp ? formatTimestampToTime(startTimestamp) : formatTime(eventTime);
  const displayEndTime = endTimestamp ? formatTimestampToTime(endTimestamp) : (eventEndTime ? formatTime(eventEndTime) : '');

  // ✅ Use dynamic convenience fee from parent, fallback to 5% calculation if not provided
  const ticketSubtotal = tickets.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity), 0);
  const convenienceFee = propConvenienceFee !== undefined ? propConvenienceFee : Math.round(ticketSubtotal * 0.05);
  const calculatedTotal = ticketSubtotal + convenienceFee;

  // Calculate total redeemable cover amount
  const totalCoverAmount = tickets.reduce((sum, ticket) => {
    if (ticket.ticket_cover_enabled && ticket.ticket_cover_amount) {
      return sum + (ticket.ticket_cover_amount * ticket.quantity);
    }
    return sum;
  }, 0);

  const hasCoverAmount = totalCoverAmount > 0;

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
            {eventVenue && eventVenue !== 'TBD' && (
              <Text style={styles.venueName} numberOfLines={1}>{eventVenue}</Text>
            )}
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={PremiumColors.text.secondary} />
              <Text style={styles.venueAddress} numberOfLines={1}>{eventLocation}</Text>
            </View>
          </View>
          <Image 
            source={{ uri: eventImage }} 
            style={styles.eventImage}
            defaultSource={require('../../assets/default-image.jpg')}
          />
        </View>

        {/* Date & Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Schedule</Text>
          <View style={styles.card}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="calendar-outline" size={18} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>{formatDate(eventDate)}</Text>
              </View>
            </View>
            
            <View style={styles.scheduleDivider} />
            
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Ionicons name="time-outline" size={18} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {displayStartTime}
                  {displayEndTime && ` - ${displayEndTime}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Redeemable Cover Amount - Only show if tickets have cover */}
        {hasCoverAmount && (
          <View style={styles.section}>
            <View style={styles.coverAmountCard}>
              <View style={styles.coverAmountIcon}>
                <Ionicons name="gift" size={24} color={PremiumColors.accent.secondary} />
              </View>
              <View style={styles.coverAmountContent}>
                <Text style={styles.coverAmountTitle}>Redeemable Cover Amount</Text>
                <Text style={styles.coverAmountValue}>₹{totalCoverAmount}</Text>
                <Text style={styles.coverAmountNote}>
                  This amount will be adjusted against your final bill at the venue
                </Text>
              </View>
            </View>
          </View>
        )}



        {/* Tickets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Details</Text>
          <View style={styles.card}>
            {tickets.map((ticket, index) => (
              <View key={index} style={[styles.ticketRow, index < tickets.length - 1 && styles.ticketRowBorder]}>
                <View style={styles.ticketLeft}>
                  <Text style={styles.ticketName}>{ticket.name}</Text>
                  <View style={styles.ticketMetaRow}>
                    <Text style={styles.ticketQuantity}>{ticket.quantity}x Ticket</Text>
                    {ticket.ticket_cover_enabled && ticket.ticket_cover_amount && ticket.ticket_cover_amount > 0 && (
                      <View style={styles.coverBadge}>
                        <Ionicons name="gift" size={10} color={PremiumColors.accent.secondary} />
                        <Text style={styles.coverBadgeText}>
                          +₹{ticket.ticket_cover_amount * ticket.quantity} Cover
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.ticketPrice}>₹{ticket.price * ticket.quantity}</Text>
              </View>
            ))}
            
            {/* M-Ticket Info */}
            <View style={styles.mTicketInfo}>
              <Ionicons name="qr-code-outline" size={20} color={PremiumColors.accent.secondary} />
              <Text style={styles.mTicketText}>
                M-Tickets will be generated after payment. Use QR codes for entry at the venue.
              </Text>
            </View>
          </View>
        </View>

        {/* Offers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Offers</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <View style={styles.offerCard}>
            <View style={styles.offerIcon}>
              <Ionicons name="pricetag" size={20} color="#FF9800" />
            </View>
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>No offers available</Text>
              <Text style={styles.offerDescription}>Check back later for special deals</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Amount</Text>
              <Text style={styles.summaryValue}>₹{ticketSubtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Convenience Fee</Text>
              <Text style={styles.summaryValue}>₹{convenienceFee}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{calculatedTotal}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.card}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Customer Name</Text>
              <Text style={styles.invoiceValue}>John Doe</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Phone Number</Text>
              <Text style={styles.invoiceValue}>+91 98765 43210</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Email Address</Text>
              <Text style={styles.invoiceValue}>john.doe@example.com</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View>
            <Text style={styles.footerLabel}>Total Payable</Text>
            <Text style={styles.footerAmount}>₹{calculatedTotal}</Text>
          </View>
          <TouchableOpacity 
            onPress={onProceed} 
            style={[styles.payButton, isProcessing && styles.processingButton]}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={styles.payButtonText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
                <Text style={styles.payButtonText}>Proceed to Pay</Text>
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
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueAddress: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    lineHeight: 16,
    flex: 1,
  },
  eventImage: {
    width: 80,
    height: 107, // 3:4 ratio (smaller)
    borderRadius: 12,
    backgroundColor: PremiumColors.background.tertiary,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 0,
  },
  scheduleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 10,
    color: PremiumColors.text.secondary,
    marginBottom: 3,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: PremiumColors.divider,
    marginVertical: 12,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  card: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  ticketRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.divider,
  },
  ticketLeft: {
    flex: 1,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketQuantity: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  coverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  coverBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  mTicketInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 10,
  },
  mTicketText: {
    flex: 1,
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
  offerCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
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
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  invoiceLabel: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  invoiceValue: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '600',
  },
  coverAmountCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.33)',
    borderRadius: 16, 
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: PremiumColors.accent.secondary,
  },
  coverAmountIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverAmountContent: {
    flex: 1,
  },
  coverAmountTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginBottom: 4,
  },
  coverAmountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.accent.secondary,
    marginBottom: 4,
  },
  coverAmountNote: {
    fontSize: 10,
    color: PremiumColors.text.tertiary,
    lineHeight: 12,
    fontStyle: 'italic',
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
  payButton: {
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
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
});


