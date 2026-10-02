import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

/**
 * Smart Notification Service
 * Uses expo-notifications for local and push notification support.
 * Firebase has been removed in favor of Supabase + Expo.
 */

let Notifications: any = null;
let Device: any = null;

let hasExpoNotifications = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Device = require('expo-device');
  hasExpoNotifications = true;

  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch {
  // Native notification module not available (e.g. running in certain web/Expo environments)
}

const useExpo = hasExpoNotifications;

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!useExpo || !Notifications) return false;

    if (Device && !Device.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get Expo Push token
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!useExpo || !Notifications) return null;

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    if (Device && !Device.isDevice) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
}

/**
 * Setup notification channels (Android only)
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || !useExpo || !Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync('booking-updates', {
      name: 'Booking Updates',
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      description: 'Notifications about your restaurant bookings',
    });

    await Notifications.setNotificationChannelAsync('event-updates', {
      name: 'Event Updates',
      importance: Notifications.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
      description: 'Notifications about your event tickets',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions & Offers',
      importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      description: 'Special offers and promotional notifications',
    });
  } catch (error) {
    console.error('❌ Error setting up notification channels:', error);
  }
}

/**
 * Add notification received listener (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: any) => void
): () => void {
  if (useExpo && Notifications?.addNotificationReceivedListener) {
    const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
      callback(notification);
    });
    return () => subscription.remove();
  }

  return () => {};
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: any) => void
): () => void {
  if (useExpo && Notifications?.addNotificationResponseReceivedListener) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      callback(response);
    });
    return () => subscription.remove();
  }

  return () => {};
}

/**
 * Get initial notification (app opened from notification)
 */
export async function getInitialNotification(): Promise<any> {
  try {
    if (useExpo && Notifications?.getLastNotificationResponseAsync) {
      return await Notifications.getLastNotificationResponseAsync();
    }
  } catch (error) {
    console.error('❌ Error getting initial notification:', error);
  }
  return null;
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data: any = {},
  triggerSeconds: number = 5
): Promise<string> {
  try {
    if (useExpo && Notifications?.scheduleNotificationAsync) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.HIGH,
        },
        trigger: {
          seconds: triggerSeconds,
        },
      });
      return notificationId;
    }

    // Fallback alert for testing
    setTimeout(() => {
      Alert.alert(title, body);
    }, triggerSeconds * 1000);

    return 'test-' + Date.now();
  } catch (error) {
    console.error('❌ Error scheduling local notification:', error);
    throw error;
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  try {
    if (useExpo && Notifications?.cancelScheduledNotificationAsync) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch (error) {
    console.error('❌ Error cancelling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    if (useExpo && Notifications?.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    if (useExpo && Notifications?.setBadgeCountAsync) {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch (error) {
    console.error('❌ Error setting badge count:', error);
  }
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0);
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    if (useExpo && Notifications?.getBadgeCountAsync) {
      return await Notifications.getBadgeCountAsync();
    }
  } catch (error) {
    console.error('❌ Error getting badge count:', error);
  }
  return 0;
}

/**
 * Initialize notification service
 */
export async function initializeNotificationService(): Promise<string | null> {
  try {
    await setupNotificationChannels();
    return await getFCMToken();
  } catch (error) {
    console.error('❌ Error initializing notification service:', error);
    return null;
  }
}

/**
 * Get current notification mode
 */
export function getNotificationMode(): 'expo' | 'none' {
  if (useExpo) return 'expo';
  return 'none';
}
