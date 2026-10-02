import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendImmediateTestNotification } from '../utils/testNotifications';
import { getFCMToken } from '../utils/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Test button component for FCM notifications
 * Use this for manual testing during development
 */
export default function NotificationTestButton() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);

  const handleTestNotification = async () => {
    if (testing) return;

    setTesting(true);
    try {
      console.log('🧪 Testing notification system...');

      // Check if user is logged in
      if (!user) {
        Alert.alert('Error', 'Please login first to test notifications');
        return;
      }

      // Check FCM token
      const token = await getFCMToken();
      if (!token) {
        Alert.alert(
          'Notification Permission Required',
          'Please enable notifications in your device settings to receive test notifications.'
        );
        return;
      }

      console.log('✅ FCM Token exists:', token.substring(0, 20) + '...');

      // Send test notification
      await sendImmediateTestNotification();

      Alert.alert(
        '🔔 Test Notification Scheduled',
        'You should receive a test notification in 5 seconds. Make sure your device volume is on!',
        [{ text: 'OK' }]
      );

      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.error('❌ Error testing notification:', error);
      Alert.alert('Error', 'Failed to send test notification: ' + (error as Error).message);
    } finally {
      setTimeout(() => setTesting(false), 1000);
    }
  };

  // Only show in development mode
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={handleTestNotification}
        disabled={testing}
      >
        <Ionicons name="notifications-outline" size={20} color="#FFF" />
        <Text style={styles.buttonText}>
          {testing ? 'Sending...' : 'Test Notification'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

