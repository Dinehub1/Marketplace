import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

interface RestaurantBooking {
  id: string;
  restaurant_name: string;
  cover_image_url: string;
  address: string;
  city: string;
  state: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_cover_charge: string;
  offer_title?: string;
  discount_value?: string;
  discount_type?: string;
}

interface RestaurantBookingCardProps {
  booking: RestaurantBooking;
  onPress: (booking: RestaurantBooking) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return '#4CAF50';
    case 'pending':
      return '#FF9800';
    case 'cancelled':
      return '#F44336';
    case 'completed':
      return '#2196F3';
    case 'no_show':
      return '#9E9E9E';
    default:
      return '#FF9800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
      return 'Pending';
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    case 'no_show':
      return 'No Show';
    default:
      return 'Pending';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function RestaurantBookingCard({ booking, onPress }: RestaurantBookingCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(booking)}
      activeOpacity={0.7}
    >
      {/* Header with Restaurant Name and Status */}
      <View style={styles.header}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {booking.restaurant_name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {getStatusText(booking.status)}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Left Side - Details */}
        <View style={styles.leftContent}>
          {/* Party Size */}
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color="#AAAAAA" />
            <Text style={styles.detailText}>
              {booking.party_size} {booking.party_size === 1 ? 'Guest' : 'Guests'}
            </Text>
          </View>

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
            <Text style={styles.detailText}>
              {formatDate(booking.booking_date)} • {formatTime(booking.booking_time)}
            </Text>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#AAAAAA" />
            <Text style={styles.locationText} numberOfLines={1}>
              {booking.address}, {booking.city}
            </Text>
          </View>

          {/* Offer (if available) */}
          {booking.offer_title && (
            <View style={styles.offerContainer}>
              <Ionicons name="pricetag" size={14} color="#4CAF50" />
              <Text style={styles.offerText} numberOfLines={1}>
                {booking.offer_title}
              </Text>
            </View>
          )}
        </View>

        {/* Right Side - Restaurant Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: booking.cover_image_url }} 
            style={styles.restaurantImage}
            defaultSource={require('../../assets/default-image.jpg')}
          />
        </View>
      </View>

      {/* Footer with Booking ID */}
      <View style={styles.footer}>
        <Text style={styles.bookingId}>T1-{booking.id.slice(-8).toUpperCase()}</Text>
        <Ionicons name="chevron-forward" size={20} color="#666666" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 8,
    flex: 1,
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  offerText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
    flex: 1,
  },
  imageContainer: {
    width: 80,
    height: 80,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  bookingId: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
});
