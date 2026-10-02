import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface AppointmentNotification {
  appointmentId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  title: string;
  body: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Get the token that uniquely identifies this device
      if (Device.isDevice) {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'your-expo-project-id', // Replace with your actual project ID
        });
        this.expoPushToken = token.data;
        console.log('Expo push token:', token.data);
      } else {
        console.warn('Must use physical device for Push Notifications');
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointment Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('general', {
          name: 'General Notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async scheduleAppointmentReminder(appointment: AppointmentNotification) {
    try {
      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      
      // Schedule reminder 24 hours before
      const reminder24h = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📅 Appointment Reminder',
            body: `You have an appointment with ${appointment.doctorName} tomorrow at ${this.formatTime(appointment.appointmentTime)}`,
            data: { 
              appointmentId: appointment.appointmentId,
              type: 'appointment_reminder_24h'
            },
            sound: true,
          },
          trigger: {
            date: reminder24h,
            channelId: 'appointments',
          },
        });
      }

      // Schedule reminder 1 hour before
      const reminder1h = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
      if (reminder1h > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ Appointment Starting Soon',
            body: `Your appointment with ${appointment.doctorName} is in 1 hour`,
            data: { 
              appointmentId: appointment.appointmentId,
              type: 'appointment_reminder_1h'
            },
            sound: true,
          },
          trigger: {
            date: reminder1h,
            channelId: 'appointments',
          },
        });
      }

      console.log('Appointment reminders scheduled successfully');
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
    }
  }

  async cancelAppointmentReminders(appointmentId: string) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const notificationData = notification.content.data as any;
        if (notificationData?.appointmentId === appointmentId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }

      console.log('Appointment reminders cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment reminders:', error);
    }
  }

  async sendInstantNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending instant notification:', error);
    }
  }

  async getAllScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  private formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Listen for notification responses
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen for notifications received while app is in foreground
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
