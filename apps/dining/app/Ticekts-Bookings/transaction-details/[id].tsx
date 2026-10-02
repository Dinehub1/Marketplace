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

interface TransactionDetails {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  cover_image_url: string;
  address: string;
  city: string;
  state: string;
  booking_date: string;
  booking_time: string;
  gross_bill_amount: string;
  discount_amount: string;
  cover_charge: string;
  convenience_fee: string;
  final_payable_amount: string;
  status: 'paid' | 'failed' | 'pending';
  transaction_id: string;
  payment_id: string;
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return '#4CAF50';
    case 'failed':
      return '#F44336';
    case 'pending':
      return '#FF9800';
    default:
      return '#FF9800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Payment Successful';
    case 'failed':
      return 'Payment Failed';
    case 'pending':
      return 'Payment Pending';
    default:
      return 'Payment Pending';
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

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionDetails();
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);

      const { data: transactionData, error } = await supabase
        .from('restaurant_payments')
        .select(`
          *,
          restaurant_transactions!inner(
            transaction_id,
            status
          ),
          restaurants!inner(
            id,
            name,
            cover_image_url,
            address,
            city,
            state
          ),
          restaurant_booking!inner(
            booking_date,
            booking_time
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching transaction details:', error);
        setTransaction(null);
        return;
      }

      if (transactionData) {
        const transformedTransaction: TransactionDetails = {
          id: transactionData.id,
          restaurant_id: transactionData.restaurants.id,
          restaurant_name: transactionData.restaurants.name,
          cover_image_url: transactionData.restaurants.cover_image_url,
          address: transactionData.restaurants.address,
          city: transactionData.restaurants.city,
          state: transactionData.restaurants.state,
          booking_date: transactionData.restaurant_booking.booking_date,
          booking_time: transactionData.restaurant_booking.booking_time,
          gross_bill_amount: transactionData.gross_bill_amount,
          discount_amount: transactionData.discount_amount || '0',
          cover_charge: transactionData.cover_charge || '0',
          convenience_fee: transactionData.convenience_fee || '0',
          final_payable_amount: transactionData.final_payable_amount,
          status: transactionData.status,
          transaction_id: transactionData.restaurant_transactions.transaction_id,
          payment_id: transactionData.payment_id || '',
          created_at: transactionData.created_at,
        };

        setTransaction(transformedTransaction);
      } else {
        setTransaction(null);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setTransaction(null);
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
          <Text style={styles.loadingText}>Loading transaction details...</Text>
        </View>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.wrapper}>
        <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Transaction not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hasDiscount = parseFloat(transaction.discount_amount) > 0;
  const statusColor = getStatusColor(transaction.status);

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: statusColor + '15' }]}>
          <View style={styles.statusContent}>
            <Ionicons
              name={transaction.status === 'paid' ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={statusColor}
            />
            <Text style={[styles.statusTitle, { color: statusColor }]}>{getStatusText(transaction.status)}</Text>
            <Text style={styles.amountPaid}>₹{transaction.final_payable_amount}</Text>

            {hasDiscount && (
              <TouchableOpacity style={styles.savingsButton} activeOpacity={0.8}>
                <Ionicons name="pricetag" size={16} color="#4CAF50" />
                <Text style={styles.savingsButtonText}>You Saved ₹{transaction.discount_amount} on this bill</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Restaurant Details */}
        <View style={styles.restaurantSection}>
          <TouchableOpacity
            style={styles.restaurantInfo}
            onPress={() => router.push(`/restaurant/${transaction.restaurant_id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.restaurantName}>{transaction.restaurant_name}</Text>
            <Text style={styles.restaurantAddress}>
              {transaction.address}, {transaction.city}, {transaction.state}
            </Text>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
              <Text style={styles.dateTimeText}>
                {formatDate(transaction.booking_date)} • {formatTime(transaction.booking_time)}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/restaurant/${transaction.restaurant_id}` as any)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: transaction.cover_image_url }}
              style={styles.restaurantImage}
              defaultSource={require('../../../assets/default-image.jpg')}
            />
          </TouchableOpacity>
        </View>

        {/* Bill Summary */}
        <View style={styles.billSection}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Bill Amount</Text>
              <Text style={styles.billValue}>₹{transaction.gross_bill_amount}</Text>
            </View>

            {hasDiscount && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, { color: '#4CAF50' }]}>-₹{transaction.discount_amount}</Text>
              </View>
            )}

            {parseFloat(transaction.cover_charge) > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Cover Charges Paid</Text>
                <Text style={[styles.billValue, { color: '#4CAF50' }]}>-₹{transaction.cover_charge}</Text>
              </View>
            )}

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Convenience Fee</Text>
              <Text style={styles.billValue}>₹{transaction.convenience_fee}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.finalAmountRow}>
              <View style={styles.finalAmountLeft}>
                <Text style={styles.finalAmountLabel}>You Paid</Text>
                {hasDiscount && <Text style={styles.originalAmount}>₹{transaction.gross_bill_amount}</Text>}
              </View>
              <Text style={styles.finalAmountValue}>₹{transaction.final_payable_amount}</Text>
            </View>

            {hasDiscount && (
              <View style={styles.finalSavings}>
                <Ionicons name="pricetag" size={16} color="#4CAF50" />
                <Text style={styles.finalSavingsText}>You saved ₹{transaction.discount_amount} on this order</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.idsSection}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.idsCard}>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Booking Reference</Text>
              <Text style={styles.idValue}>T2-{transaction.id.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Payment Status</Text>
              <Text style={[styles.idValue, { color: getStatusColor(transaction.status) }]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Text>
            </View>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Transaction Date</Text>
              <Text style={styles.idValue}>{formatDateTime(transaction.created_at)}</Text>
            </View>
          </View>
        </View>

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
  statusHeader: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  statusContent: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  amountPaid: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  savingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50' + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50' + '40',
  },
  savingsButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
  restaurantSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 16,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  idsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  idsCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  idRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  idValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  billSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  billCard: {
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  billValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  finalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  finalAmountLeft: {
    flex: 1,
  },
  finalAmountLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  originalAmount: {
    fontSize: 14,
    color: '#AAAAAA',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  finalAmountValue: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  finalSavings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50' + '15',
    paddingVertical: 8,
    borderRadius: 8,
  },
  finalSavingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
});
