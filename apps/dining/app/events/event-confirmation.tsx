import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef } from 'react';
import {
    Animated,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { FreeEventConfirmation, PaidEventConfirmation } from '../../components/Events';
import { PremiumColors } from '../../constants/Colors';

export default function EventConfirmationScreen() {
  const params = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Detect confirmation type based on params
  const isPaidEvent = params.ticketDetails !== undefined || params.totalAmount !== undefined;
  const isFreeEvent = !isPaidEvent;

  console.log('🎉 Event Confirmation Screen - Type:', isPaidEvent ? 'PAID' : 'FREE');
  console.log('📋 All Params:', params);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/showtime')} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmation</Text>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Conditional Rendering based on Event Type */}
      {isFreeEvent ? (
        <FreeEventConfirmation
          bookingId={params.bookingId as string}
          eventTitle={params.eventTitle as string}
          eventImage={params.eventImage as string}
          eventLocation={params.eventLocation as string}
          date={params.date as string}
          timeSlot={params.timeSlot as string}
          timeSection={params.timeSection as string}
          guests={params.guests as string}
          selectedOfferTitle={params.selectedOfferTitle as string}
          bookingStatus={params.bookingStatus as string}
          fadeAnim={fadeAnim}
        />
      ) : (
        <PaidEventConfirmation
          eventId={params.eventId as string}
          eventTitle={params.eventTitle as string}
          eventSubtitle={params.eventSubtitle as string}
          eventImage={params.eventImage as string}
          eventVenue={params.eventVenue as string}
          eventDate={params.eventDate as string}
          eventTime={params.eventTime as string}
          ticketDetails={params.ticketDetails as string}
          totalAmount={params.totalAmount as string}
          ticketSubtotal={params.ticketSubtotal as string}
          convenienceFee={params.convenienceFee as string}
          orderId={params.orderId as string}
          paymentMethod={params.paymentMethod as string}
          paymentStatus={params.paymentStatus as string}
          bookingIds={params.bookingIds as string}
          ticketNumbers={params.ticketNumbers as string}
          fadeAnim={fadeAnim}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: PremiumColors.background.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PremiumColors.text.primary,
  },
  headerRight: {
    width: 40,
  },
});

