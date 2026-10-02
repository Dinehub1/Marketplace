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

interface QuickActionItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
}

const quickActions: QuickActionItem[] = [
  {
    id: '1',
    title: 'Find Doctor',
    icon: 'search-outline',
    color: Colors.primary,
    screen: SCREEN_NAMES.DOCTORS,
  },
  {
    id: '2',
    title: 'Book Appointment',
    icon: 'calendar-outline',
    color: Colors.secondary,
    screen: SCREEN_NAMES.DOCTORS,
  },
  {
    id: '3',
    title: 'My Appointments',
    icon: 'time-outline',
    color: Colors.info,
    screen: SCREEN_NAMES.APPOINTMENTS,
  },
  {
    id: '4',
    title: 'Emergency',
    icon: 'medical-outline',
    color: Colors.error,
    screen: SCREEN_NAMES.DOCTORS,
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  
  console.info('🏠 HomeScreen rendered successfully!', {
    userEmail: user?.email,
    userName: `${user?.firstName} ${user?.lastName}`,
    timestamp: new Date().toISOString()
  });

  const handleQuickAction = (screen: string) => {
    console.info('🔄 Navigating to:', screen);
    navigation.navigate(screen as never);
  };

  const handleTestLogout = async () => {
    console.info('🚪 Test logout pressed');
    await logout();
  };

  const renderQuickAction = (item: QuickActionItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.quickActionItem}
      onPress={() => handleQuickAction(item.screen)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.quickActionText}>{item.title}</Text>
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
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate(SCREEN_NAMES.NOTIFICATIONS as never)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate(SCREEN_NAMES.DOCTORS as never)}
        >
          <Ionicons name="search-outline" size={20} color={Colors.gray400} />
          <Text style={styles.searchPlaceholder}>Search doctors, specialties...</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate(SCREEN_NAMES.APPOINTMENTS as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>Dr. Sarah Johnson</Text>
              <Text style={styles.appointmentSpecialty}>Dermatologist</Text>
              <View style={styles.appointmentDateTime}>
                <Ionicons name="calendar-outline" size={16} color={Colors.gray400} />
                <Text style={styles.appointmentDateText}>Today, 2:30 PM</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.appointmentAction}>
              <Text style={styles.appointmentActionText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Tips</Text>
          <View style={styles.healthTipCard}>
            <View style={styles.healthTipIcon}>
              <Text style={styles.healthTipEmoji}>💡</Text>
            </View>
            <View style={styles.healthTipContent}>
              <Text style={styles.healthTipTitle}>Stay Hydrated</Text>
              <Text style={styles.healthTipDescription}>
                Drink at least 8 glasses of water daily to maintain good health.
              </Text>
            </View>
          </View>
        </View>

        {/* Test Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleTestLogout}>
            <Text style={styles.logoutButtonText}>🚪 Test Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencySection}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Ionicons name="call" size={20} color={Colors.white} />
            <Text style={styles.emergencyText}>Emergency: 911</Text>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
  },
  notificationButton: {
    position: 'relative',
    padding: Spacing.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: Fonts.size.base,
    color: Colors.gray400,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  appointmentSpecialty: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDateText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  appointmentAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
  },
  appointmentActionText: {
    fontSize: Fonts.size.sm,
    color: Colors.white,
    fontWeight: Fonts.weight.medium,
  },
  healthTipCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    flexDirection: 'row',
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthTipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  healthTipEmoji: {
    fontSize: 24,
  },
  healthTipContent: {
    flex: 1,
  },
  healthTipTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  healthTipDescription: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.normal * Fonts.size.sm,
  },
  emergencySection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  emergencyButton: {
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.full,
  },
  emergencyText: {
    fontSize: Fonts.size.base,
    color: Colors.white,
    fontWeight: Fonts.weight.semibold,
    marginLeft: Spacing.sm,
  },
  logoutButton: {
    backgroundColor: Colors.warning,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.white,
    fontWeight: Fonts.weight.semibold,
    fontSize: Fonts.size.base,
  },
});
