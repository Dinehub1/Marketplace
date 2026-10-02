import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../../constants/Colors';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'offer' | 'event' | 'general';
  time: string;
  read: boolean;
  icon: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Table Booking Confirmed',
    message: 'Your table at Bella Buono has been confirmed for today at 7:30 PM',
    type: 'booking',
    time: '2 hours ago',
    read: false,
    icon: 'restaurant',
  },
  {
    id: '2',
    title: 'Special Offer Available!',
    message: '20% off on your next event booking. Limited time offer!',
    type: 'offer',
    time: '4 hours ago',
    read: false,
    icon: 'pricetag',
  },
  {
    id: '3',
    title: 'Event Reminder',
    message: 'Live Jazz Night is tomorrow at 8:00 PM. Don\'t forget!',
    type: 'event',
    time: '1 day ago',
    read: true,
    icon: 'calendar',
  },
  {
    id: '4',
    title: 'New Restaurant Added',
    message: 'Check out The Golden Spoon - now available for booking',
    type: 'general',
    time: '2 days ago',
    read: true,
    icon: 'add-circle',
  },
  {
    id: '5',
    title: 'Payment Successful',
    message: 'Your payment of ₹2,500 for Wine Tasting Evening has been processed',
    type: 'booking',
    time: '3 days ago',
    read: true,
    icon: 'checkmark-circle',
  },
];

export default function NotificationsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return 'restaurant';
      case 'offer': return 'pricetag';
      case 'event': return 'calendar';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return AppColors.primary;
      case 'offer': return AppColors.orange[500];
      case 'event': return AppColors.blue[500];
      default: return AppColors.gray[500];
    }
  };

  const renderNotificationItem = ({ item, index }: { item: Notification; index: number }) => (
    <Animated.View
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 30 + index * 10],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor(item.type)}20` }]}>
          <Ionicons 
            name={getNotificationIcon(item.type) as any} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>

        <View style={styles.notificationText}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </Animated.View>
  );

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppColors.black} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.markAllButton}>
          <Ionicons name="checkmark-done" size={20} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {mockNotifications.length > 0 ? (
          <FlatList
            data={mockNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off" size={64} color={AppColors.gray[400]} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You&apos;re all caught up! New notifications will appear here.
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.black,
  },
  headerBadge: {
    backgroundColor: AppColors.red[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.white,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  notificationsList: {
    padding: 20,
    paddingBottom: 100,
  },
  notificationItem: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    position: 'relative',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.black,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: AppColors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
});
