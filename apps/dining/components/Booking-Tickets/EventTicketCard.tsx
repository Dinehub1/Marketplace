import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Simple QR Code placeholder component
const QRCodePlaceholder = ({ value, size }: { value: string; size: number }) => (
  <View style={{
    width: size,
    height: size,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  }}>
    <View style={{
      width: size * 0.8,
      height: size * 0.8,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Ionicons name="qr-code-outline" size={size * 0.4} color="#000000" />
      <Text style={{
        fontSize: size * 0.08,
        color: '#000000',
        fontWeight: '600',
        marginTop: 2,
      }}>
        {value.slice(-4)}
      </Text>
    </View>
  </View>
);

export interface EventTicket {
  id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  cover_image_url: string;
  booking_type: 'free' | 'paid';
  ticket_number?: string;
  status: string;
  party_size: number;
  venue_name?: string;
  venue_address?: string;
  city: string;
  state: string;
  total_amount_paid?: string;
  ticket_price?: string;
  convenience_fee?: string;
  cover_amount?: string;
  discount_amount?: string;
  offer_title?: string;
  is_checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  // New T1/T2 transaction fields
  transaction_type?: string;
  transaction_details?: string;
  gross_amount?: string;
  t2_convenience_fee?: string;
}

interface EventTicketCardProps {
  ticket: EventTicket;
}

export default function EventTicketCard({ ticket }: EventTicketCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'help-circle';
    }
  };

  const generateQRData = () => {
    if (ticket.booking_type === 'paid' && ticket.ticket_number) {
      return ticket.ticket_number;
    } else {
      // For free events, generate booking reference
      return `BK-${ticket.id.slice(-8).toUpperCase()}`;
    }
  };

  const handleCardPress = () => {
    router.push(`/Ticekts-Bookings/ticket-details/${ticket.id}` as any);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
      {/* Event Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: ticket.cover_image_url }}
          style={styles.eventImage}
          defaultSource={require('../../assets/default-image.jpg')}
        />
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
          <Ionicons 
            name={getStatusIcon(ticket.status) as any} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.statusText}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Text>
        </View>

        {/* Check-in Badge */}
        {ticket.is_checked_in && (
          <View style={styles.checkedInBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
            <Text style={styles.checkedInText}>Checked In</Text>
          </View>
        )}
      </View>

      {/* Event Details */}
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {ticket.event_title}
        </Text>
        
        <View style={styles.dateTimeRow}>
          <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
          <Text style={styles.dateTimeText}>
            {formatDate(ticket.event_date)} • {formatTime(ticket.start_time)}
          </Text>
        </View>

        {ticket.venue_name && (
          <View style={styles.venueRow}>
            <Ionicons name="location-outline" size={16} color="#AAAAAA" />
            <Text style={styles.venueText} numberOfLines={1}>
              {ticket.venue_name}
            </Text>
          </View>
        )}

         {ticket.party_size && ticket.party_size > 0 && (
           <View style={styles.partyRow}>
             <Ionicons name="people-outline" size={16} color="#AAAAAA" />
             <Text style={styles.partyText}>
               {ticket.party_size} {ticket.party_size === 1 ? 'Guest' : 'Guests'}
             </Text>
           </View>
         )}
      </View>

       {/* QR Code Section */}
       <View style={styles.qrSection}>
         <View style={styles.qrContainer}>
           <QRCodePlaceholder value={generateQRData()} size={60} />
         </View>
         <View style={styles.ticketInfo}>
           <Text style={styles.ticketLabel}>
             {ticket.booking_type === 'paid' ? 'TICKET' : 'BOOKING REF'}
           </Text>
           <Text style={styles.ticketNumber}>
             {ticket.booking_type === 'paid' && ticket.ticket_number 
               ? ticket.ticket_number 
               : `BK-${ticket.id.slice(-8).toUpperCase()}`
             }
           </Text>
         </View>
       </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        {ticket.booking_type === 'free' ? (
          <View style={styles.freeSection}>
            <Text style={styles.freeLabel}>FREE ENTRY</Text>
            {ticket.offer_title && (
              <Text style={styles.offerText}>🎁 {ticket.offer_title}</Text>
            )}
          </View>
        ) : (
          <View style={styles.paidSection}>
            <View style={styles.transactionTypeContainer}>
              <Text style={styles.transactionTypeLabel}>{ticket.transaction_type || 'Payment'}</Text>
              {ticket.transaction_details && (
                <Text style={styles.transactionDetails}>{ticket.transaction_details}</Text>
              )}
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Paid</Text>
              <Text style={styles.amountValue}>₹{ticket.total_amount_paid || '0'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#666666" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e20',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 380, // 3:4 ratio for better vertical display
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333333',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkedInBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  checkedInText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventDetails: {
    padding: 16,
    paddingBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  venueText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
    flex: 1,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partyText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2a2a2c',
    gap: 16,
  },
   qrContainer: {
     padding: 8,
     borderRadius: 8,
   },
  ticketInfo: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '600',
    marginBottom: 2,
  },
  ticketNumber: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  amountSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  freeSection: {
    alignItems: 'flex-start',
  },
  freeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  offerText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  paidSection: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  transactionTypeContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  transactionTypeLabel: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDetails: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'right',
    lineHeight: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  arrowContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
