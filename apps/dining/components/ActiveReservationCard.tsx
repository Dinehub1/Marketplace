import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PremiumColors } from '../constants/Colors';
import { ReservationTimer } from './ReservationTimer';

interface ActiveReservationCardProps {
  reservation: {
    id: string;
    quantity: number;
    expires_at: string;
    event_id: string;
    occurrence_id: string | null;
    ticket_type_id: string;
    events: {
      id: string;
      title: string;
      cover_image_url: string;
      event_date: string;
      start_time: string;
      city: string;
    };
    event_ticket_types: {
      id: string;
      name: string;
      price: number;
    };
    event_occurrences?: {
      id: string;
      occurrence_date: string;
      start_utc_timestamp: number;
    } | null;
  };
  onExpire?: () => void;
}

export const ActiveReservationCard: React.FC<ActiveReservationCardProps> = ({
  reservation,
  onExpire,
}) => {
  const handlePress = () => {
    // Navigate directly to summary page with reservation details
    const eventId = reservation.event_id;
    const occurrenceId = reservation.occurrence_id;
    const eventData = reservation.events;
    const ticketData = reservation.event_ticket_types;
    const occurrenceData = reservation.event_occurrences;

    // Format ticket details for summary page
    const ticketDetails = JSON.stringify([{
      id: ticketData.id,
      name: ticketData.name,
      price: Number(ticketData.price),
      quantity: reservation.quantity,
    }]);

    const totalAmount = reservation.quantity * Number(ticketData.price);

    // Determine event date and time
    const eventDate = occurrenceData?.occurrence_date || eventData.event_date;
    const eventTime = eventData.start_time;

    // Navigate to summary page
    router.push({
      pathname: '/events/event-summary',
      params: {
        eventId: eventId,
        eventTitle: eventData.title,
        eventImage: eventData.cover_image_url,
        eventLocation: eventData.city,
        eventVenue: eventData.city,
        eventDate: eventDate,
        eventTime: eventTime,
        occurrenceId: occurrenceId || '',
        ticketDetails: ticketDetails,
        totalAmount: totalAmount.toString(),
      }
    } as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalAmount = reservation.quantity * Number(reservation.event_ticket_types.price);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: reservation.events.cover_image_url || 'https://via.placeholder.com/150' }}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{reservation.quantity}x</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Event Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {reservation.events.title}
        </Text>

        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <Ionicons name="ticket" size={14} color={PremiumColors.accent.secondary} />
          <Text style={styles.ticketName} numberOfLines={1}>
            {reservation.event_ticket_types.name}
          </Text>
        </View>

        {/* Event Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={12} color={PremiumColors.text.tertiary} />
            <Text style={styles.detailText}>
              {formatDate(
                reservation.event_occurrences?.occurrence_date || reservation.events.event_date
              )}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={12} color={PremiumColors.text.tertiary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {reservation.events.city}
            </Text>
          </View>
        </View>

        {/* Timer and Amount */}
        <View style={styles.footer}>
          <ReservationTimer
            expiresAt={reservation.expires_at}
            onExpire={onExpire}
            compact={true}
          />
          <Text style={styles.amount}>₹{totalAmount.toFixed(0)}</Text>
        </View>
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={PremiumColors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: PremiumColors.background.tertiary,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  quantityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: PremiumColors.accent.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ticketName: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 11,
    color: PremiumColors.text.tertiary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    marginLeft: 8,
  },
});

