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

interface EventTransactionCardProps {
  transaction: EventTransaction;
  onPress: (transaction: EventTransaction) => void;
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
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'pending':
      return 'Pending';
    default:
      return 'Pending';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function EventTransactionCard({ transaction, onPress }: EventTransactionCardProps) {
  const hasDiscount = parseFloat(transaction.discount_amount) > 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      {/* Header with Event Name and Status */}
      <View style={styles.header}>
        <Text style={styles.eventName} numberOfLines={1}>
          {transaction.event_name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {getStatusText(transaction.status)}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Left Side - Details */}
        <View style={styles.leftContent}>
          {/* Event Date */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
            <Text style={styles.detailText}>
              {formatDate(transaction.event_date)}
            </Text>
          </View>

          {/* Amount Paid */}
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color="#AAAAAA" />
            <Text style={styles.amountText}>
              {`₹${(() => {
                // Determine which final payable amount to show based on transaction status
                const transactionStatus = transaction.transaction_status || 'T1';
                if (transactionStatus.includes('T2')) {
                  // For T2 or T1,T2 transactions, show T2 final payable amount
                  return transaction.t2_final_payable_amount || '0';
                } else {
                  // For T1 only transactions, show T1 final payable amount
                  return transaction.t1_final_payable_amount || '0';
                }
              })()} Paid`}
            </Text>
          </View>

          {/* Savings (if available) */}
          {hasDiscount && (
            <View style={styles.savingsContainer}>
              <Ionicons name="pricetag" size={14} color="#4CAF50" />
              <Text style={styles.savingsText}>
                {`₹${transaction.discount_amount} Saved`}
              </Text>
            </View>
          )}
        </View>

        {/* Right Side - Event Image (3:4 Vertical) */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: transaction.cover_image_url }} 
            style={styles.eventImage}
            defaultSource={require('../../assets/default-image.jpg')}
          />
        </View>
      </View>

      {/* Footer with Transaction ID */}
      <View style={styles.footer}>
        <Text style={styles.transactionId}>
          {`T2-${transaction.transaction_id.slice(-8).toUpperCase()}`}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
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
  eventName: {
    fontSize: 17,
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
    justifyContent: 'center',
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
  amountText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  imageContainer: {
    width: 60,
    height: 80, // 3:4 aspect ratio
  },
  eventImage: {
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
  transactionId: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
});

