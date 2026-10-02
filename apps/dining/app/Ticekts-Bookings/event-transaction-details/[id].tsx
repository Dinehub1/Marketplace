import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import "../../../components/QRCodeGenerator";
import { supabase } from '../../../config/supabase';
import { PremiumColors } from '../../../constants/Colors';
import { useAuth } from '../../../contexts/AuthContext';

interface EventTransactionDetails {
  id: string;
  event_id: string;
  event_name: string;
  event_date: string;
  event_type: 'free' | 'paid';
  ticket_type: string;
  tickets_count: number;
  // Payment breakdown
  ticket_price: string;
  ticket_cover_amount: string;
  cover_charge: string;
  convenience_fee_amount: string;
  discount_amount: string;
  // T1/T2 tracking data
  gross_amount: string;
  t1_convenience_fee: string;
  t2_convenience_fee: string;
  t1_status: string;
  t2_status: string;
  transaction_status: string;
  t1_final_payable_amount: string;
  t2_final_payable_amount: string;
  // Offer details
  offer_title?: string;
  offer_discount_value?: string;
  offer_discount_type?: string;
  // Transaction details
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

export default function EventTransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState<EventTransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionDetails();
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      setLoading(true);

      const { data: transactionData, error } = await supabase
        .from('event_payments')
        .select(`
          *,
          gross_amount,
          t1_convenience_fee,
          t2_convenience_fee,
          t1_status,
          t2_status,
          transaction_status,
          t1_final_payable_amount,
          t2_final_payable_amount,
          event_transactions(
            transaction_id,
            status
          ),
          event_bookings!inner(
            tickets_count,
            offer_id,
            events!inner(
              id,
              title,
              event_date,
              ticket_type
            ),
            event_ticket_types(
              name,
              price
            ),
            event_offers(
              title,
              discount_value,
              discount_type
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event transaction details:', error);
        setTransaction(null);
        return;
      }

      if (transactionData) {
        const eventType = transactionData.event_bookings.events.ticket_type;
        
        const transformedTransaction: EventTransactionDetails = {
          id: transactionData.id,
          event_id: transactionData.event_bookings.events.id,
          event_name: transactionData.event_bookings.events.title,
          event_date: transactionData.event_bookings.events.event_date,
          event_type: eventType,
          ticket_type: transactionData.event_bookings.event_ticket_types?.name || 'General Admission',
          tickets_count: transactionData.event_bookings.tickets_count || 1,
          // For T2 transactions, show gross_amount instead of ticket_price
          ticket_price: transactionData.gross_amount || transactionData.ticket_price || '0',
          ticket_cover_amount: transactionData.ticket_cover_amount || '0',
          cover_charge: transactionData.cover_charge || '0',
           // Use T2 convenience fee for T2 transactions
           convenience_fee_amount: transactionData.t2_convenience_fee || transactionData.convenience_fee_amount || '0',
           discount_amount: transactionData.discount_amount || '0',
          // T1/T2 tracking data
          gross_amount: transactionData.gross_amount || '0',
          t1_convenience_fee: transactionData.t1_convenience_fee || '0',
          t2_convenience_fee: transactionData.t2_convenience_fee || '0',
          t1_status: transactionData.t1_status || 'pending',
          t2_status: transactionData.t2_status || 'pending',
          transaction_status: transactionData.transaction_status || 'T1',
          t1_final_payable_amount: transactionData.t1_final_payable_amount || '0',
          t2_final_payable_amount: transactionData.t2_final_payable_amount || '0',
          offer_title: transactionData.event_bookings.event_offers?.title,
          offer_discount_value: transactionData.event_bookings.event_offers?.discount_value,
          offer_discount_type: transactionData.event_bookings.event_offers?.discount_type,
          status: transactionData.event_transactions?.status || transactionData.status,
          transaction_id: transactionData.event_transactions?.transaction_id || transactionData.id,
          payment_id: transactionData.payment_id || '',
          created_at: transactionData.created_at,
        };

        setTransaction(transformedTransaction);
      } else {
        setTransaction(null);
      }
    } catch (error) {
      console.error('Error fetching event transaction details:', error);
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
  const hasCoverAmount = parseFloat(transaction.ticket_cover_amount) > 0;
  const hasCoverCharge = parseFloat(transaction.cover_charge) > 0;
  const statusColor = getStatusColor(transaction.status);
  const isFreeEvent = transaction.event_type === 'free';

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
        <View style={[styles.statusHeader, { backgroundColor: `${statusColor}15` }]}>
          <View style={styles.statusContent}>
            <Ionicons
              name={transaction.status === 'paid' ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={statusColor}
            />
            <Text style={[styles.statusTitle, { color: statusColor }]}>{getStatusText(transaction.status)}</Text>
             <Text style={styles.amountPaid}>{`₹${(() => {
               // Determine which final payable amount to show based on transaction status
               const transactionStatus = transaction.transaction_status || 'T1';
               if (transactionStatus.includes('T2')) {
                 // For T2 or T1,T2 transactions, show T2 final payable amount
                 return transaction.t2_final_payable_amount || '0';
               } else {
                 // For T1 only transactions, show T1 final payable amount
                 return transaction.t1_final_payable_amount || '0';
               }
             })()}`}</Text>

            {hasDiscount && (
              <TouchableOpacity style={styles.savingsButton} activeOpacity={0.8}>
                <Ionicons name="pricetag" size={16} color="#4CAF50" />
                <Text style={styles.savingsButtonText}>
                  {`You Saved ₹${transaction.discount_amount}${transaction.offer_title ? ` with ${transaction.offer_title}` : ''}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.eventSection}>
          <TouchableOpacity
            style={styles.eventInfo}
            onPress={() => router.push(`/events/${transaction.event_id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.eventName}>{transaction.event_name}</Text>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
              <Text style={styles.eventDate}>{formatDate(transaction.event_date)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bill Details Section */}
        <View style={styles.billSection}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billCard}>
            {/* Bill Amount (from gross_amount) - Show for both Free and Paid Events */}
            {parseFloat(transaction.gross_amount) > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Bill Amount</Text>
                <Text style={styles.billValue}>
                  {`₹${parseFloat(transaction.gross_amount).toFixed(0)}`}
                </Text>
              </View>
            )}

            {/* Cover Charge (show as minus) - For Free Events */}
            {isFreeEvent && hasCoverCharge && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Cover Charge</Text>
                <Text style={[styles.billValue, styles.adjustedAmount]}>
                  {`-₹${parseFloat(transaction.cover_charge).toFixed(0)}`}
                </Text>
              </View>
            )}

            {/* Cover Amount (show as minus/adjusted) - For Paid Events */}
            {!isFreeEvent && hasCoverAmount && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Cover Amount (Already Adjusted)</Text>
                <Text style={[styles.billValue, styles.adjustedAmount]}>
                  {`-₹${parseFloat(transaction.ticket_cover_amount).toFixed(0)}`}
                </Text>
              </View>
            )}

            {/* Offer Discount */}
            {hasDiscount && (
              <View style={styles.billRow}>
                <View style={styles.offerLeft}>
                  <Ionicons name="gift" size={16} color="#4CAF50" />
                  <Text style={styles.offerLabel}>
                    {transaction.offer_title || 'Offer Applied'}
                  </Text>
                </View>
                <Text style={styles.offerValue}>{`-₹${parseFloat(transaction.discount_amount).toFixed(0)}`}</Text>
              </View>
            )}

            {/* T2 Convenience Fee - Show for both Free and Paid Events */}
            {parseFloat(transaction.t2_convenience_fee) > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Convenience Fee</Text>
                <Text style={styles.billValue}>{`₹${parseFloat(transaction.t2_convenience_fee).toFixed(0)}`}</Text>
              </View>
            )}

            {/* Total */}
            <View style={styles.billDivider} />
             <View style={styles.totalRow}>
               <Text style={styles.totalLabel}>You Paid</Text>
               <Text style={styles.totalValue}>{`₹${(() => {
                 // Determine which final payable amount to show based on transaction status
                 const transactionStatus = transaction.transaction_status || 'T1';
                 if (transactionStatus.includes('T2')) {
                   // For T2 or T1,T2 transactions, show T2 final payable amount
                   return parseFloat(transaction.t2_final_payable_amount || '0').toFixed(0);
                 } else {
                   // For T1 only transactions, show T1 final payable amount
                   return parseFloat(transaction.t1_final_payable_amount || '0').toFixed(0);
                 }
               })()}`}</Text>
             </View>

            {/* Cover Amount Note for Paid Events */}
            {!isFreeEvent && hasCoverAmount && (
              <View style={styles.noteContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.noteText, { color: '#4CAF50' }]}>
                  Your cover amount has already been adjusted against the bill
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Transaction Info Section */}
        <View style={styles.transactionSection}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>
          <View style={styles.transactionCard}>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Transaction ID</Text>
              <Text style={styles.transactionValue}>{`T2-${transaction.transaction_id.slice(-8).toUpperCase()}`}</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Payment ID</Text>
              <Text style={styles.transactionValue}>{transaction.payment_id || 'N/A'}</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Date & Time</Text>
              <Text style={styles.transactionValue}>{formatDateTime(transaction.created_at)}</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Status</Text>
              <View style={[styles.statusBadgeSmall, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {getStatusText(transaction.status)}
                </Text>
              </View>
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
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: PremiumColors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusHeader: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  amountPaid: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  savingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  savingsButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  eventSection: {
    backgroundColor: PremiumColors.background.secondary,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  eventInfo: {
    gap: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  billSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  billCard: {
    backgroundColor: PremiumColors.background.secondary,
    padding: 16,
    borderRadius: 12,
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
    fontWeight: '500',
  },
  billValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  adjustedAmount: {
    color: '#4CAF50',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 12,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  offerValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#333333',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#AAAAAA',
    flex: 1,
    lineHeight: 16,
  },
  transactionSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: PremiumColors.background.secondary,
    padding: 16,
    borderRadius: 12,
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
    fontWeight: '500',
  },
  transactionValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

