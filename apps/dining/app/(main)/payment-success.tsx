import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AppColors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function PaymentSuccessScreen() {
  const { type, amount, transactionId, restaurantName, bookingId } = useLocalSearchParams();
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Beautiful success animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (type === 'final_bill') {
      // For final bill payment, go to home
      router.push('/(tabs)');
    } else {
      // For advance payment, go to booking confirmation
      router.push({
        pathname: '/booking-confirmation',
        params: {
          bookingId,
          restaurantName,
          transactionId,
          amount
        }
      });
    }
  };

  const handleViewBooking = () => {
    // Navigate to booking details or user's bookings
    router.push('/Ticekts-Bookings/event-tickets');
  };

  const getSuccessMessage = () => {
    if (type === 'final_bill') {
      return {
        title: 'Payment Successful!',
        subtitle: 'Your bill has been paid successfully',
        description: `Payment of ₹${amount} has been processed. Thank you for dining with us!`
      };
    }
    return {
      title: 'Booking Confirmed!',
      subtitle: 'Your table has been reserved',
      description: `Cover charge of ₹${amount} has been paid. Get ready for a great dining experience!`
    };
  };

  const successMessage = getSuccessMessage();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={AppColors.white} />
        </TouchableOpacity>
      </View>

      {/* Success Animation */}
      <View style={styles.successContainer}>
        <Animated.View style={[
          styles.successIconContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={60} color={AppColors.white} />
          </View>
        </Animated.View>

        <Animated.View style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.successTitle}>{successMessage.title}</Text>
          <Text style={styles.successSubtitle}>{successMessage.subtitle}</Text>
          <Text style={styles.successDescription}>
            {successMessage.description}
          </Text>
        </Animated.View>
      </View>

      {/* Transaction Details */}
      <Animated.View style={[
        styles.detailsCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={styles.detailsHeader}>
          <Ionicons name="receipt-outline" size={24} color={AppColors.primary} />
          <Text style={styles.detailsTitle}>Transaction Details</Text>
        </View>
        
        <View style={styles.detailsContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>₹{amount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValueSmall}>{transactionId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Restaurant</Text>
            <Text style={styles.detailValue}>{restaurantName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View style={[
        styles.actionsContainer,
        { opacity: fadeAnim }
      ]}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>
            {type === 'final_bill' ? 'Go to Home' : 'View Booking'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={AppColors.white} />
        </TouchableOpacity>

        {type !== 'final_bill' && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewBooking}
          >
            <Text style={styles.secondaryButtonText}>View All Bookings</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.green[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.green[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: AppColors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    color: AppColors.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black,
  },
  detailsContent: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: AppColors.gray[600],
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.black,
    textAlign: 'right',
    flex: 1,
  },
  detailValueSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.gray[700],
    textAlign: 'right',
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
  },
});
