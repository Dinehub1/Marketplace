import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DiningTransactionCard from '../../components/Booking-Tickets/DiningTransactionCard';
import { supabase } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

interface DiningTransaction {
  id: string;
  restaurant_name: string;
  address: string;
  city: string;
  state: string;
  cover_image_url: string;
  booking_date: string;
  booking_time: string;
  final_payable_amount: string;
  discount_amount: string;
  status: 'paid' | 'failed' | 'pending';
  transaction_id: string;
}

export default function DiningTransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DiningTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch transactions from database with restaurant and booking details
      const { data: transactionsData, error } = await supabase
        .from('restaurant_payments')
        .select(`
          *,
          restaurant_transactions!inner(
            transaction_id,
            status
          ),
          restaurants!inner(
            name,
            address,
            city,
            state,
            cover_image_url
          ),
          restaurant_booking!inner(
            booking_date,
            booking_time
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      // Transform data to match interface
      const transformedTransactions: DiningTransaction[] = transactionsData.map((payment: any) => ({
        id: payment.id,
        restaurant_name: payment.restaurants.name,
        address: payment.restaurants.address,
        city: payment.restaurants.city,
        state: payment.restaurants.state,
        cover_image_url: payment.restaurants.cover_image_url,
        booking_date: payment.restaurant_booking.booking_date,
        booking_time: payment.restaurant_booking.booking_time,
        final_payable_amount: payment.final_payable_amount,
        discount_amount: payment.discount_amount || '0',
        status: payment.status,
        transaction_id: payment.restaurant_transactions.transaction_id,
      }));
      
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionPress = (transaction: DiningTransaction) => {
    router.push(`/Ticekts-Bookings/transaction-details/${transaction.id}` as any);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#666666" />
      <Text style={styles.emptyTitle}>No Transactions Found</Text>
      <Text style={styles.emptyDescription}>
        Your dining transactions will appear here once you make payments at restaurants.
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/' as any)}
        activeOpacity={0.7}
      >
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
          style={styles.headerBackButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dining Transactions</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={({ item }) => (
            <DiningTransactionCard 
              transaction={item} 
              onPress={handleTransactionPress} 
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
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
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
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
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
