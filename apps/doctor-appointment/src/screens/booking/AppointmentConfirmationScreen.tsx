import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, SCREEN_NAMES } from '../../constants';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';

interface AppointmentData {
  appointmentId: string;
  doctorName: string;
  specialization: string;
  selectedDate: string;
  selectedTime: string;
  appointmentType: string;
  symptoms: string;
  notes?: string;
  consultationFee: number;
}

export const AppointmentConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  const appointmentData = (route.params as any) as AppointmentData;

  useEffect(() => {
    console.info('📅 Appointment confirmed with data:', appointmentData);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleViewAppointments = () => {
    // Navigate to Appointments tab
    navigation.navigate('MainTabs' as never, { screen: 'Appointments' } as never);
  };

  const handleGoHome = () => {
    // Navigate to Home tab
    navigation.navigate('MainTabs' as never, { screen: 'Home' } as never);
  };

  const handleAddToCalendar = () => {
    // TODO: Implement calendar integration
    console.log('Add to calendar functionality');
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'follow_up': return 'Follow-up';
      case 'emergency': return 'Emergency';
      default: return 'Consultation';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Appointment Confirmed" 
        showBackButton={false}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Appointment Booked!</Text>
          <Text style={styles.successMessage}>
            Your appointment has been successfully booked. You&apos;ll receive a confirmation shortly.
          </Text>
        </View>

        {/* Appointment Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          
          {/* Appointment ID */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="receipt-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Appointment ID</Text>
              <Text style={styles.detailValue}>{appointmentData.appointmentId}</Text>
            </View>
          </View>

          {/* Doctor */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Doctor</Text>
              <Text style={styles.detailValue}>{appointmentData.doctorName}</Text>
              <Text style={styles.detailSubValue}>{appointmentData.specialization}</Text>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {formatDate(appointmentData.selectedDate)}
              </Text>
              <Text style={styles.detailSubValue}>
                {formatTime(appointmentData.selectedTime)}
              </Text>
            </View>
          </View>

          {/* Appointment Type */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="medical-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {getAppointmentTypeLabel(appointmentData.appointmentType)}
              </Text>
            </View>
          </View>

          {/* Consultation Fee */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Consultation Fee</Text>
              <Text style={styles.detailValue}>${appointmentData.consultationFee}</Text>
            </View>
          </View>

          {/* Symptoms */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="clipboard-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Symptoms/Reason</Text>
              <Text style={styles.detailValue}>{appointmentData.symptoms}</Text>
            </View>
          </View>

          {/* Notes */}
          {appointmentData.notes && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Additional Notes</Text>
                <Text style={styles.detailValue}>{appointmentData.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddToCalendar}>
            <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Add to Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Important Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesSectionTitle}>Important Notes</Text>
          <View style={styles.noteItem}>
            <Ionicons name="time-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>
              Please arrive 15 minutes before your appointment time
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="card-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>
              Payment can be made at the clinic or online
            </Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="call-outline" size={16} color={Colors.warning} />
            <Text style={styles.noteText}>
              Contact the clinic if you need to reschedule
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <Button
          title="View My Appointments"
          onPress={handleViewAppointments}
          variant="outline"
          fullWidth
          style={styles.bottomButton}
        />
        <Button
          title="Go to Home"
          onPress={handleGoHome}
          fullWidth
        />
      </View>
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
  successSection: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.screenPadding,
    backgroundColor: Colors.white,
    marginBottom: Spacing.lg,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
  },
  detailsSection: {
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
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  detailSubValue: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  actionsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: (Colors as any).gray50 || '#F9FAFB',
  },
  actionButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Fonts.size.base,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  notesSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  notesSectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  noteText: {
    marginLeft: Spacing.sm,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
  },
  bottomSection: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: Spacing.md,
  },
  bottomButton: {
    marginBottom: 0,
  },
});
