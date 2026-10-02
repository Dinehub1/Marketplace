import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColors } from '../constants/Colors';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    event_date: string;
    start_time: string;
    end_time?: string;
    cover_image_url?: string;
    event_type?: string;
    ticket_type?: string;
    event_categories?: {
      id: string;
      name: string;
      icon?: string;
    };
    event_ticket_types?: Array<{
      id: string;
      price: number;
      is_active: boolean;
    }>;
  };
}

const RestaurantEventCard: React.FC<EventCardProps> = ({ event }) => {
  const handleEventPress = () => {
    if (event.ticket_type === 'free') {
      router.push(`/booking/free/${event.id}`);
    } else {
      router.push(`/events/${event.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getLowestPrice = () => {
    if (!event.event_ticket_types || event.event_ticket_types.length === 0) {
      return null;
    }

    const activePrices = event.event_ticket_types
      .filter(ticket => ticket.is_active && ticket.price > 0)
      .map(ticket => ticket.price);

    if (activePrices.length === 0) {
      return null;
    }

    return Math.min(...activePrices);
  };

  const lowestPrice = getLowestPrice();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleEventPress}
      activeOpacity={0.9}
    >
      {/* Cover Image on Left */}
      <View style={styles.imageContainer}>
        {event.cover_image_url ? (
          <Image
            source={{ uri: event.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={28} color={AppColors.gray[500]} />
          </View>
        )}
      </View>

      {/* Event Details */}
      <View style={styles.detailsContainer}>
        {/* Category */}
        {event.event_categories && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.event_categories.name}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={14} color={AppColors.gray[300]} />
            <Text style={styles.dateTimeText}>{formatDate(event.event_date)}</Text>
          </View>

          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={14} color={AppColors.gray[300]} />
            <Text style={styles.dateTimeText}>{formatTime(event.start_time)}</Text>
          </View>
        </View>

        {/* Price */}
        {lowestPrice && event.ticket_type !== 'free' && (
          <Text style={styles.priceText}>₹{lowestPrice} onwards</Text>
        )}
        {event.ticket_type === 'free' && (
          <Text style={styles.freeText}>Free Entry</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#111', // dark background
    borderRadius: 14,
    marginRight: 16,
    width: 280,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    overflow: 'hidden',
  },
  imageContainer: {
    width: 90,
    height: 100,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#00FF8833',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00FF88',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 18,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 11,
    color: '#ccc',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00FF88',
    marginTop: 4,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
    marginTop: 4,
  },
});

export default RestaurantEventCard;
