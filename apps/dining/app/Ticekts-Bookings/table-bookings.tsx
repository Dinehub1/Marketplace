import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import RestaurantBookingCard from '../../components/Booking-Tickets/RestaurantBookingCard';
import { supabase } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

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

export default function TableBookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<RestaurantBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch bookings from database with restaurant and offer details
      const { data: bookingsData, error } = await supabase
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
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      // Transform data to match interface
      const transformedBookings: RestaurantBooking[] = bookingsData.map((booking: any) => ({
        id: booking.id,
        restaurant_name: booking.restaurants.name,
        cover_image_url: booking.restaurants.cover_image_url,
        address: booking.restaurants.address,
        city: booking.restaurants.city,
        state: booking.restaurants.state,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        party_size: booking.party_size,
        status: booking.status,
        total_cover_charge: booking.total_cover_charge,
        offer_title: booking.dinein_offers?.title,
        discount_value: booking.dinein_offers?.discount_value,
        discount_type: booking.dinein_offers?.discount_type,
      }));
      
      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingPress = (booking: RestaurantBooking) => {
    router.push(`/Ticekts-Bookings/booking-details/${booking.id}` as any);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="restaurant-outline" size={80} color="#666666" />
      </View>
      <Text style={styles.emptyTitle}>No Table Bookings</Text>
      <Text style={styles.emptyDescription}>
        You haven't made any restaurant bookings yet. Start exploring restaurants and make your first reservation!
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/' as any)}
      >
        <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
        <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Table Bookings</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {bookings.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.bookingsContainer}>
              <Text style={styles.sectionTitle}>
                Your Bookings ({bookings.length})
              </Text>
              
              {bookings.map((booking) => (
                <RestaurantBookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={handleBookingPress}
                />
              ))}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
  backButton: {
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
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 16,
  },
  bookingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: PremiumColors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
