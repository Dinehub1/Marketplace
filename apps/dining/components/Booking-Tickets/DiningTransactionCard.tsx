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

interface DiningTransactionCardProps {
  transaction: DiningTransaction;
  onPress: (transaction: DiningTransaction) => void;
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
      return 'Successful';
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

export default function DiningTransactionCard({ transaction, onPress }: DiningTransactionCardProps) {
  const hasDiscount = parseFloat(transaction.discount_amount) > 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      {/* Header with Restaurant Name and Status */}
      <View style={styles.header}>
        <Text style={styles.restaurantName} numberOfLines={1}>
          {transaction.restaurant_name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {getStatusText(transaction.status)}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Left Side - Details */}
        <View style={styles.leftContent}>
          {/* Address */}
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#AAAAAA" />
            <Text style={styles.addressText} numberOfLines={1}>
              {transaction.address}, {transaction.city}
            </Text>
          </View>

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#AAAAAA" />
            <Text style={styles.detailText}>
              {formatDate(transaction.booking_date)} • {formatTime(transaction.booking_time)}
            </Text>
          </View>

          {/* Amount Paid */}
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color="#AAAAAA" />
            <Text style={styles.amountText}>
              ₹{transaction.final_payable_amount} Paid
            </Text>
          </View>

          {/* Savings (if available) */}
          {hasDiscount && (
            <View style={styles.savingsContainer}>
              <Ionicons name="pricetag" size={14} color="#4CAF50" />
              <Text style={styles.savingsText}>
                ₹{transaction.discount_amount} Saved on this bill
              </Text>
            </View>
          )}
        </View>

        {/* Right Side - Restaurant Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: transaction.cover_image_url }} 
            style={styles.restaurantImage}
            defaultSource={require('../../assets/default-image.jpg')}
          />
        </View>
      </View>

      {/* Footer with Transaction ID */}
      <View style={styles.footer}>
        <Text style={styles.transactionId}>T2-{transaction.id.slice(-8).toUpperCase()}</Text>
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
  addressText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 8,
    flex: 1,
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
    backgroundColor: '#4CAF50' + '15',
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
    flex: 1,
  },
  imageContainer: {
    width: 70,
    height: 70,
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
  transactionId: {
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
});
