import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants';
import { Header } from '../../components/common/Header';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'promotion' | 'update';
  timestamp: string;
  isRead: boolean;
}

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [promotionalOffers, setPromotionalOffers] = useState(false);

  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 2:30 PM',
      type: 'reminder',
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: '2',
      title: 'Appointment Confirmed',
      message: 'Your appointment has been confirmed for Dec 25, 2024',
      type: 'appointment',
      timestamp: '1 day ago',
      isRead: true,
    },
    {
      id: '3',
      title: 'Health Tip',
      message: 'Remember to stay hydrated and take your vitamins daily',
      type: 'update',
      timestamp: '3 days ago',
      isRead: true,
    },
    {
      id: '4',
      title: 'Special Offer',
      message: '20% off on preventive health checkups this month',
      type: 'promotion',
      timestamp: '1 week ago',
      isRead: false,
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return 'calendar-outline';
      case 'reminder': return 'alarm-outline';
      case 'promotion': return 'gift-outline';
      case 'update': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment': return Colors.primary;
      case 'reminder': return Colors.warning;
      case 'promotion': return Colors.success;
      case 'update': return Colors.info;
      default: return Colors.gray400;
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadNotification,
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(notification.type) + '20' }
        ]}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={20}
            color={getNotificationColor(notification.type)}
          />
        </View>
        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle,
            !notification.isRead && styles.unreadTitle,
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {notification.timestamp}
          </Text>
        </View>
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Notifications" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
              thumbColor={pushNotifications ? Colors.primary : Colors.gray400}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingText}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
              thumbColor={emailNotifications ? Colors.primary : Colors.gray400}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="alarm-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingText}>Appointment Reminders</Text>
            </View>
            <Switch
              value={appointmentReminders}
              onValueChange={setAppointmentReminders}
              trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
              thumbColor={appointmentReminders ? Colors.primary : Colors.gray400}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="gift-outline" size={20} color={Colors.primary} />
              <Text style={styles.settingText}>Promotional Offers</Text>
            </View>
            <Switch
              value={promotionalOffers}
              onValueChange={setPromotionalOffers}
              trackColor={{ false: Colors.gray300, true: Colors.primary + '40' }}
              thumbColor={promotionalOffers ? Colors.primary : Colors.gray400}
            />
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <TouchableOpacity>
              <Text style={styles.markAllRead}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
          
          {notifications.length > 0 ? (
            notifications.map(renderNotification)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyDescription}>
                You'll see your notifications here when you receive them
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  settingsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
  },
  notificationsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  markAllRead: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  notificationCard: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  unreadNotification: {
    backgroundColor: Colors.primaryLight + '10',
    marginHorizontal: -Spacing.screenPadding,
    paddingHorizontal: Spacing.screenPadding,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  unreadTitle: {
    fontWeight: Fonts.weight.semibold,
  },
  notificationMessage: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: Fonts.size.xs,
    color: Colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});