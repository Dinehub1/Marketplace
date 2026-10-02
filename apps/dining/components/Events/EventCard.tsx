import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { EventVideoPlayer } from '../EventVideoPlayer';
import { Card, H3, OptimizedImage } from '../ui';

const { width } = Dimensions.get('window');

interface EventCardProps {
  event: {
    id: string;
    title: string;
    image: string;
    video?: string;
    date: string;
    time: string;
    venue?: string;
    description?: string;
    category: string;
    ticket_type?: string;
    min_price?: number;
    is_free?: boolean;
    price_display_string?: string;
  };
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatPrice = () => {
    // Use price_display_string from database if available
    if (event.price_display_string !== undefined && event.price_display_string !== null) {
      const priceValue = parseFloat(event.price_display_string);
      if (priceValue === 0 || event.price_display_string === '0') {
        return 'Free';
      }
      return `₹${event.price_display_string} Onwards`;
    }
    
    // Fallback to old logic if price_display_string is not available
    if (event.is_free || event.ticket_type === 'free') {
      return 'Free';
    }
    
    if (event.min_price && event.min_price > 0) {
      return `₹${event.min_price} Onwards`;
    }
    
    return 'Free';
  };

  return (
    <Card 
      variant="elevated"
      padding="none"
      style={styles.eventCard}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.eventImageContainer}>
        {event.video ? (
          <EventVideoPlayer 
            videoUrl={event.video}
            coverImageUrl={event.image}
            aspectRatio="4:5"
            style={styles.eventVideo}
          />
        ) : (
          <OptimizedImage 
            source={{ uri: event.image }} 
            style={styles.eventImage}
            contentFit="cover"
            priority="normal"
            transition={300}
            cachePolicy="memory-disk"
          />
        )}
        {/* Category Badge on Image */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryChipText}>{event.category}</Text>
        </View>
      </View>

      <View style={styles.eventContent}>
        {/* Date and Time - Highlighted */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
          <Text style={styles.dateSeparator}> • </Text>
          <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
        </View>

        <H3 style={styles.eventTitle}>{event.title}</H3>

        {/* Venue with City */}
        {event.venue && (
          <Text style={styles.venueText}>{event.venue}</Text>
        )}

        {/* Ticket Price */}
        <Text style={styles.priceText}>{formatPrice()}</Text>

        {/* Description - 2 lines max */}
        {event.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderWidth: 1,
    borderColor: PremiumColors.border,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: (width - 32) * 1.25,
    backgroundColor: PremiumColors.background.tertiary,
  },
  eventVideo: {
    width: '100%',
    height: (width - 32) * 1.25,
    backgroundColor: '#000',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 10,
    lineHeight: 24,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  dateSeparator: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: PremiumColors.accent.secondary,
  },
  venueText: {
    fontSize: 13,
    fontWeight: '500',
    color: PremiumColors.text.secondary,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: PremiumColors.accent.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
    lineHeight: 18,
  },
});

export default EventCard;

