import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../config/supabase';
import { PremiumColors } from '../../../constants/Colors';
import { useAuth } from '../../../contexts/AuthContext';

interface BookingDetails {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  cover_image_url: string;
  address: string;
  city: string;
  state: string;
  booking_date: string;
  booking_time: string;
  booking_end_time: string;
  party_size: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_cover_charge: string;
  cover_charge_per_person: string;
  customer_name: string;
  customer_phone: string;
  offer_title?: string;
  discount_value?: string;
  discount_type?: string;
  created_at: string;
  updated_at: string;
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
      return 'Pending Confirmation';
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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

const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const maskPhoneNumber = (phone: string) => {
  if (phone.length >= 10) {
    const lastFour = phone.slice(-4);
    const masked = phone.slice(0, -4).replace(/\d/g, 'X');
    return masked + lastFour;
  }
  return phone;
};

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch booking details from database with restaurant and offer details
      const { data: bookingData, error } = await supabase
        .from('restaurant_booking')
        .select(`
          *,
          restaurants!inner(
            id,
            name,
            cover_image_url,
            address,
            city,
            state
          ),
          dinein_offers(
            title,
            discount_value,
            discount_type
          ),
          users!inner(
            full_name,
            phone_number
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching booking details:', error);
        setBooking(null);
        return;
      }

      if (bookingData) {
        // Transform data to match interface
        const transformedBooking: BookingDetails = {
          id: bookingData.id,
          restaurant_id: bookingData.restaurant_id,
          restaurant_name: bookingData.restaurants.name,
          cover_image_url: bookingData.restaurants.cover_image_url,
          address: bookingData.restaurants.address,
          city: bookingData.restaurants.city,
          state: bookingData.restaurants.state,
          booking_date: bookingData.booking_date,
          booking_time: bookingData.booking_time,
          booking_end_time: bookingData.booking_end_time,
          party_size: bookingData.party_size,
          status: bookingData.status,
          total_cover_charge: bookingData.total_cover_charge,
          cover_charge_per_person: bookingData.cover_charge_per_person,
          customer_name: bookingData.users.full_name || bookingData.customer_name,
          customer_phone: bookingData.users.phone_number || bookingData.customer_phone,
          offer_title: bookingData.dinein_offers?.title,
          discount_value: bookingData.dinein_offers?.discount_value,
          discount_type: bookingData.dinein_offers?.discount_type,
          created_at: bookingData.created_at,
          updated_at: bookingData.updated_at,
        };
        
        setBooking(transformedBooking);
      } else {
        setBooking(null);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.wrapper}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Ionicons 
              name={booking.status === 'confirmed' ? 'checkmark-circle' : 'time-outline'} 
              size={20} 
              color={getStatusColor(booking.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {getStatusText(booking.status)}
            </Text>
          </View>
        </View>

        {/* Restaurant Info Section */}
        <View style={styles.restaurantSection}>
          <TouchableOpacity 
            style={styles.restaurantInfo}
            onPress={() => router.push(`/restaurant/${booking.restaurant_id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.restaurantName}>{booking.restaurant_name}</Text>
            <Text style={styles.restaurantAddress}>
              {booking.address}, {booking.city}, {booking.state}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push(`/restaurant/${booking.restaurant_id}` as any)}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: booking.cover_image_url }} 
              style={styles.restaurantImage}
              defaultSource={require('../../../assets/default-image.jpg')}
            />
          </TouchableOpacity>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(booking.booking_date)}
                </Text>
                <Text style={styles.detailValue}>
                  {formatTime(booking.booking_time)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={20} color="#FFFFFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Number of Guests</Text>
                <Text style={styles.detailValue}>
                  {booking.party_size} {booking.party_size === 1 ? 'Guest' : 'Guests'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {booking.address}, {booking.city}, {booking.state}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Offer Section */}
        {booking.offer_title && (
          <View style={styles.offerSection}>
            <Text style={styles.sectionTitle}>Offer Applied</Text>
            <View style={styles.offerCard}>
              <View style={styles.offerIcon}>
                <Ionicons name="pricetag" size={20} color="#4CAF50" />
              </View>
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>{booking.offer_title}</Text>
                <Text style={styles.offerDescription}>
                  {booking.discount_type === 'percentage' ? `${booking.discount_value}% off` : `₹${booking.discount_value} off`} on your total bill
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Cover Charge Section */}
        <View style={styles.coverChargeSection}>
          <Text style={styles.sectionTitle}>Cover Charge Paid</Text>
          <View style={styles.coverChargeCard}>
            <View style={styles.coverChargeRow}>
              <Text style={styles.coverChargeLabel}>Total Amount Paid (T1)</Text>
              <Text style={styles.coverChargeTotalValue}>₹{booking.total_cover_charge}</Text>
            </View>
          </View>
        </View>

        {/* Your Details Section */}
        <View style={styles.userDetailsSection}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <View style={styles.userDetailsCard}>
            <View style={styles.userDetailRow}>
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              <View style={styles.userDetailContent}>
                <Text style={styles.userDetailLabel}>Name</Text>
                <Text style={styles.userDetailValue}>{booking.customer_name}</Text>
              </View>
            </View>
            <View style={styles.userDetailRow}>
              <Ionicons name="call-outline" size={20} color="#FFFFFF" />
              <View style={styles.userDetailContent}>
                <Text style={styles.userDetailLabel}>Phone Number</Text>
                <Text style={styles.userDetailValue}>{maskPhoneNumber(booking.customer_phone)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.transactionCard}>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Booking ID</Text>
              <Text style={styles.transactionValue}>T1-{booking.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Transaction Date</Text>
              <Text style={styles.transactionValue}>{formatDateTime(booking.updated_at)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: PremiumColors.background.primary,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  restaurantSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  restaurantAddress: {
    fontSize: 16,
    color: '#AAAAAA',
    lineHeight: 22,
  },
  restaurantImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#333333',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  offerSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50' + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4CAF50' + '30',
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: '#4CAF50',
    opacity: 0.8,
  },
  coverChargeSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  coverChargeCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  coverChargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coverChargeLabel: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  coverChargeValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  coverChargeTotalValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coverChargeSubLabel: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  userDetailsSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  userDetailsCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  userDetailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userDetailContent: {
    marginLeft: 12,
    flex: 1,
  },
  userDetailLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  userDetailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  transactionSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  transactionValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
