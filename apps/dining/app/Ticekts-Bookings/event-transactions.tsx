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
import EventTransactionCard from '../../components/Booking-Tickets/EventTransactionCard';
import { supabase } from '../../config/supabase';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

interface EventTransaction {
  id: string;
  event_name: string;
  cover_image_url: string;
  event_date: string;
  t1_final_payable_amount?: string;
  t2_final_payable_amount?: string;
  transaction_status?: string;
  discount_amount: string;
  status: 'paid' | 'failed' | 'pending';
  transaction_id: string;
}

export default function EventTransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EventTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch transactions from event_payments table with event and transaction details
      // Only fetch payments where gross_amount is NOT NULL (T2 - final transaction completed)
      // This matches dining transaction pattern where gross_amount indicates final bill payment
      const { data: transactionsData, error } = await supabase
        .from('event_payments')
        .select(`
          *,
          event_transactions(
            transaction_id,
            status
          ),
          event_bookings!inner(
            events!inner(
              title,
              cover_image_url,
              event_date
            )
          )
        `)
        .eq('user_id', user.id)
        .not('gross_amount', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event transactions:', error);
        return;
      }

      // Transform data to match interface
      const transformedTransactions: EventTransaction[] = transactionsData.map((payment: any) => ({
        id: payment.id,
        event_name: payment.event_bookings.events.title,
        cover_image_url: payment.event_bookings.events.cover_image_url,
        event_date: payment.event_bookings.events.event_date,
        t1_final_payable_amount: payment.t1_final_payable_amount,
        t2_final_payable_amount: payment.t2_final_payable_amount,
        transaction_status: payment.transaction_status,
        discount_amount: payment.discount_amount || '0',
        status: payment.event_transactions?.status || payment.status,
        transaction_id: payment.event_transactions?.transaction_id || payment.id,
      }));
      
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching event transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionPress = (transaction: EventTransaction) => {
    router.push(`/Ticekts-Bookings/event-transaction-details/${transaction.id}` as any);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={64} color="#666666" />
      <Text style={styles.emptyTitle}>No Transactions Found</Text>
      <Text style={styles.emptyDescription}>
        Your event ticket transactions will appear here once you purchase tickets.
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.exploreButtonText}>Explore Events</Text>
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
        <Text style={styles.headerTitle}>Event Transactions</Text>
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
            <EventTransactionCard 
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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.primary,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  exploreButton: {
    backgroundColor: PremiumColors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

