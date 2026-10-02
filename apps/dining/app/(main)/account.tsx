import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

// Menu section data
const menuSections = {
  bookings: [
    { id: 'table-booking', title: 'Table bookings', icon: 'restaurant-outline', action: 'tableBooking' },
    { id: 'event-tickets', title: 'Event tickets', icon: 'ticket-outline', action: 'eventTickets' },
  ],
  vouchers: [
    { id: 'collected-vouchers', title: 'Collected vouchers', icon: 'gift-outline', action: 'vouchers' },
  ],
  payments: [
    { id: 'transactions', title: 'Dining transactions', icon: 'receipt-outline', action: 'transactions' },
    { id: 'event-transactions', title: 'Event transactions', icon: 'ticket', action: 'eventTransactions' },
    { id: 'dropby-coins', title: 'DropBy Coins', icon: 'wallet-outline', action: 'coins' },
    { id: 'gift-card', title: 'Claim a Gift Card', icon: 'card-outline', action: 'giftCard' },
  ],
  manage: [
    { id: 'favorites', title: 'Favourites', icon: 'heart-outline', action: 'favorites' },
    { id: 'payment-settings', title: 'Payment Settings', icon: 'settings-outline', action: 'paymentSettings' },
    { id: 'appearance', title: 'Appearance', icon: 'color-palette-outline', action: 'appearance' },
  ],
  support: [
    { id: 'faq', title: 'Frequently Asked Questions', icon: 'help-circle-outline', action: 'faq' },
    { id: 'chat', title: 'Chat With Us', icon: 'chatbubble-outline', action: 'chat' },
    { id: 'feedback', title: 'Share Feedback', icon: 'star-outline', action: 'feedback' },
  ],
  more: [
    { id: 'account-settings', title: 'Account Settings', icon: 'person-outline', action: 'accountSettings' },
    { id: 'about', title: 'About Us', icon: 'information-circle-outline', action: 'about' },
  ],
};

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const [showAppUpdate, setShowAppUpdate] = useState(true);

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'tableBooking':
        router.push('/Ticekts-Bookings/table-bookings');
        break;
      case 'eventTickets':
        router.push('/Ticekts-Bookings/event-tickets' as any);
        break;
      case 'vouchers':
        router.push('/profile pages/collected-vouchers');
        break;
      case 'transactions':
        router.push('/Ticekts-Bookings/dining-transactions');
        break;
      case 'eventTransactions':
        router.push('/Ticekts-Bookings/event-transactions');
        break;
      case 'coins':
        router.push('/profile pages/dropby-coins');
        break;
      case 'giftCard':
        Alert.alert('Gift Card', 'Gift card feature coming soon!');
        break;
      case 'favorites':
        router.push('/favorites');
        break;
      case 'paymentSettings':
        Alert.alert('Payment Settings', 'Payment settings feature coming soon!');
        break;
      case 'appearance':
        Alert.alert('Appearance', 'Appearance settings feature coming soon!');
        break;
      case 'faq':
        Alert.alert('FAQ', 'FAQ feature coming soon!');
        break;
      case 'chat':
        Alert.alert('Chat', 'Chat feature coming soon!');
        break;
      case 'feedback':
        Alert.alert('Feedback', 'Feedback feature coming soon!');
        break;
      case 'accountSettings':
        Alert.alert('Account Settings', 'Account settings feature coming soon!');
        break;
      case 'about':
        Alert.alert('About Us', 'About us feature coming soon!');
        break;
      default:
        break;
    }
  };

  const handleAppUpdate = () => {
    Alert.alert('App Update', 'You are using the latest version of DropBy!');
    setShowAppUpdate(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: signOut 
        }
      ]
    );
  };

  const renderBookingSection = () => (
    <View style={styles.bookingSection}>
      <Text style={styles.sectionTitle}>All bookings</Text>
      <View style={styles.bookingGrid}>
        <TouchableOpacity style={styles.bookingCard} onPress={() => handleMenuPress('tableBooking')}>
          <Ionicons name="restaurant-outline" size={24} color="#FFFFFF" />
          <Text style={styles.bookingTitle}>Table bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookingCard} onPress={() => handleMenuPress('eventTickets')}>
          <Ionicons name="ticket-outline" size={24} color="#FFFFFF" />
          <Text style={styles.bookingTitle}>Event tickets</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMenuSection = (title: string, items: any[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menuContainer}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.menuItemLast
            ]}
            onPress={() => handleMenuPress(item.action)}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={PremiumColors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={PremiumColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ 
                uri: user?.profile_image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' 
              }} 
              style={styles.profileImage}
            />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <Text style={styles.userPhone}>{user?.phone_number}</Text>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => handleMenuPress('accountSettings')}>
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* All Bookings Section */}
        {renderBookingSection()}

        {/* App Update Section */}
        {showAppUpdate && (
          <TouchableOpacity style={styles.updateSection} onPress={handleAppUpdate}>
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            <Text style={styles.updateText}>App update available</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        )}

        {/* Vouchers Section */}
        {renderMenuSection('Vouchers', menuSections.vouchers)}

        {/* Payments Section */}
        {renderMenuSection('Payments', menuSections.payments)}

        {/* Manage Section */}
        {renderMenuSection('Manage', menuSections.manage)}

        {/* Support Section */}
        {renderMenuSection('Support', menuSections.support)}

        {/* More Section */}
        {renderMenuSection('More', menuSections.more)}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#131315',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#131315',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#131315',
  },
  
  // Profile Section
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Booking Section
  bookingSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bookingGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bookingCard: {
    flex: 1,
    backgroundColor: '#1e1e20',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },

  // Menu Sections
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuContainer: {
    backgroundColor: '#1b1b1c',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
  },

  // App Update Section
  updateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  updateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#171717',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

