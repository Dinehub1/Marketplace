import { scheduleLocalNotification } from './notificationService';
import { supabase } from '../config/supabase';

/**
 * Test Notification System for Restaurant Bookings
 * This sends a test notification after a booking is created (for testing purposes)
 */

export interface BookingNotificationData {
  bookingId: string;
  restaurantName: string;
  bookingDate: string;
  bookingTime: string;
  partySize: number;
  customerName: string;
}

/**
 * Send a test notification after restaurant booking
 * @param bookingData - Booking information
 * @param delaySeconds - Delay in seconds before sending notification (default: 60 seconds for testing)
 */
export async function sendBookingTestNotification(
  bookingData: BookingNotificationData,
  delaySeconds: number = 60
): Promise<void> {
  try {
    console.log('🔔 Scheduling test notification for booking:', bookingData.bookingId);

    const title = '🎉 Booking Confirmed!';
    const body = `Your table for ${bookingData.partySize} at ${bookingData.restaurantName} is confirmed for ${bookingData.bookingTime} on ${bookingData.bookingDate}. See you soon!`;
    
    const notificationData = {
      type: 'booking',
      bookingId: bookingData.bookingId,
      restaurantName: bookingData.restaurantName,
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime,
    };

    await scheduleLocalNotification(
      title,
      body,
      notificationData,
      delaySeconds
    );

    console.log(`✅ Test notification scheduled for ${delaySeconds} seconds from now`);
  } catch (error) {
    console.error('❌ Error scheduling test notification:', error);
  }
}

/**
 * Send reminder notification for upcoming booking
 * @param bookingData - Booking information
 * @param delaySeconds - Delay in seconds (default: 120 seconds for testing)
 */
export async function sendBookingReminderNotification(
  bookingData: BookingNotificationData,
  delaySeconds: number = 120
): Promise<void> {
  try {
    console.log('🔔 Scheduling reminder notification for booking:', bookingData.bookingId);

    const title = '⏰ Booking Reminder';
    const body = `Don't forget! Your table at ${bookingData.restaurantName} is reserved for ${bookingData.bookingTime} today. We're looking forward to seeing you!`;
    
    const notificationData = {
      type: 'booking_reminder',
      bookingId: bookingData.bookingId,
      restaurantName: bookingData.restaurantName,
    };

    await scheduleLocalNotification(
      title,
      body,
      notificationData,
      delaySeconds
    );

    console.log(`✅ Reminder notification scheduled for ${delaySeconds} seconds from now`);
  } catch (error) {
    console.error('❌ Error scheduling reminder notification:', error);
  }
}

/**
 * Send event booking confirmation notification
 * @param eventData - Event booking information
 * @param delaySeconds - Delay in seconds (default: 60 seconds for testing)
 */
export async function sendEventBookingTestNotification(
  eventData: {
    bookingId: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    ticketCount: number;
  },
  delaySeconds: number = 60
): Promise<void> {
  try {
    console.log('🔔 Scheduling test notification for event booking:', eventData.bookingId);

    const title = '🎫 Event Tickets Confirmed!';
    const body = `Your ${eventData.ticketCount} ticket${eventData.ticketCount > 1 ? 's' : ''} for ${eventData.eventTitle} on ${eventData.eventDate} at ${eventData.eventTime} ${eventData.ticketCount > 1 ? 'are' : 'is'} confirmed!`;
    
    const notificationData = {
      type: 'event',
      bookingId: eventData.bookingId,
      eventTitle: eventData.eventTitle,
    };

    await scheduleLocalNotification(
      title,
      body,
      notificationData,
      delaySeconds
    );

    console.log(`✅ Event test notification scheduled for ${delaySeconds} seconds from now`);
  } catch (error) {
    console.error('❌ Error scheduling event test notification:', error);
  }
}

/**
 * Monitor new bookings and send test notifications
 * This is for development/testing purposes only
 */
export function setupBookingNotificationMonitor(userId: string): () => void {
  console.log('👀 Setting up booking notification monitor for user:', userId);

  // Subscribe to new bookings for this user
  const subscription = supabase
    .channel('booking-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'restaurant_booking',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        console.log('🆕 New booking detected:', payload.new);
        
        const booking = payload.new as any;
        
        // Send test notification after 1 minute
        await sendBookingTestNotification({
          bookingId: booking.id,
          restaurantName: 'Test Restaurant', // You'd fetch this from the restaurant table
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          partySize: booking.party_size,
          customerName: booking.customer_name,
        }, 60);

        // Send reminder notification after 2 minutes
        await sendBookingReminderNotification({
          bookingId: booking.id,
          restaurantName: 'Test Restaurant',
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          partySize: booking.party_size,
          customerName: booking.customer_name,
        }, 120);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up booking notification monitor');
    subscription.unsubscribe();
  };
}

/**
 * Send immediate test notification (for manual testing)
 */
export async function sendImmediateTestNotification(): Promise<void> {
  try {
    console.log('🔔 Sending immediate test notification');

    await scheduleLocalNotification(
      '🧪 Test Notification',
      'This is a test notification from DropBy app. Your notification system is working correctly!',
      { type: 'test', timestamp: new Date().toISOString() },
      5 // 5 seconds delay
    );

    console.log('✅ Immediate test notification scheduled');
  } catch (error) {
    console.error('❌ Error sending immediate test notification:', error);
  }
}

