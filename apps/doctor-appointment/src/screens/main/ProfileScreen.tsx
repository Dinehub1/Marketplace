import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts, SCREEN_NAMES, Spacing } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen?: string;
  action?: () => void;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const profileMenuItems: ProfileMenuItem[] = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: 'person-outline',
      screen: SCREEN_NAMES.EDIT_PROFILE,
    },
    {
      id: '2',
      title: 'Medical Records',
      icon: 'document-text-outline',
      screen: SCREEN_NAMES.MEDICAL_RECORDS,
    },
    {
      id: '3',
      title: 'Notifications',
      icon: 'notifications-outline',
      screen: SCREEN_NAMES.NOTIFICATIONS,
    },
    {
      id: '4',
      title: 'Favorite Doctors',
      icon: 'heart-outline',
      screen: SCREEN_NAMES.FAVORITE_DOCTORS,
    },
    {
      id: '5',
      title: 'Medicine Orders',
      icon: 'medical-outline',
      screen: SCREEN_NAMES.MEDICINE_ORDERS,
    },
    {
      id: '6',
      title: 'Diagnostics Tests',
      icon: 'flask-outline',
      screen: SCREEN_NAMES.DIAGNOSTICS_TESTS,
    },
    {
      id: '7',
      title: 'Contact Clinic',
      icon: 'call-outline',
      screen: SCREEN_NAMES.CONTACT_CLINIC,
    },
    {
      id: '8',
      title: 'Help Center',
      icon: 'help-circle-outline',
      screen: SCREEN_NAMES.HELP_CENTER,
    },
    {
      id: '9',
      title: 'Terms & Conditions',
      icon: 'document-outline',
      screen: SCREEN_NAMES.TERMS,
    },
    {
      id: '10',
      title: 'Privacy Policy',
      icon: 'shield-outline',
      screen: SCREEN_NAMES.PRIVACY,
    },
    {
      id: '11',
      title: 'Logout',
      icon: 'log-out-outline',
      action: logout,
    },
  ];

  const handleMenuItemPress = (item: ProfileMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  const renderMenuItem = (item: ProfileMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleMenuItemPress(item)}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.id === '7' ? Colors.error : Colors.textSecondary}
          />
        </View>
        <Text style={[
          styles.menuItemText,
          item.id === '7' && styles.logoutText,
        ]}>
          {item.title}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.gray400}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {user?.userType === 'patient' ? 'Patient' : 'Doctor'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {profileMenuItems.map(renderMenuItem)}
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing['3xl'],
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.white,
  },
  userName: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  userTypeBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  userTypeText: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  menuSection: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.screenPadding,
    borderRadius: Spacing.borderRadius.lg,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuItemText: {
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
    fontWeight: Fonts.weight.medium,
  },
  logoutText: {
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  versionText: {
    fontSize: Fonts.size.sm,
    color: Colors.textLight,
  },
});
