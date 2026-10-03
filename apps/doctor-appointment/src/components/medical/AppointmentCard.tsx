import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, APPOINTMENT_STATUS } from '../../constants';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  appointmentTime: string;
  status: keyof typeof APPOINTMENT_STATUS | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | string;
  appointmentType: 'consultation' | 'follow_up' | 'emergency';
  symptoms?: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onReschedule,
  onCancel,
  showActions = true,
}) => {
  const {
    doctorName,
    doctorSpecialty,
    appointmentDate,
    appointmentTime,
    status,
    appointmentType,
    symptoms,
  } = appointment;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return Colors.warning;
      case 'confirmed':
        return Colors.info;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.gray400;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'alert-circle';
      case 'follow_up':
        return 'refresh-circle';
      default:
        return 'medical';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <Text style={styles.doctorSpecialty}>{doctorSpecialty}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {getStatusText(status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color={Colors.gray400} />
          <Text style={styles.detailText}>
            {formatDate(appointmentDate)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={Colors.gray400} />
          <Text style={styles.detailText}>
            {formatTime(appointmentTime)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons 
            name={getAppointmentTypeIcon(appointmentType) as keyof typeof Ionicons.glyphMap} 
            size={16} 
            color={Colors.gray400} 
          />
          <Text style={styles.detailText}>
            {appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>

      {symptoms && (
        <View style={styles.symptomsContainer}>
          <Text style={styles.symptomsLabel}>Symptoms:</Text>
          <Text style={styles.symptomsText}>{symptoms}</Text>
        </View>
      )}

      {showActions && (status.toLowerCase() === 'scheduled' || status === 'SCHEDULED') && (
        <View style={styles.actions}>
          {onReschedule && (
            <Button
              title="Reschedule"
              variant="outline"
              size="small"
              onPress={onReschedule}
              style={styles.actionButton}
            />
          )}
          {onCancel && (
            <Button
              title="Cancel"
              variant="text"
              size="small"
              onPress={onCancel}
              style={styles.actionButton}
              textStyle={{ color: Colors.error }}
            />
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  doctorSpecialty: {
    fontSize: Fonts.size.base,
    color: Colors.primary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
  },
  statusText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  symptomsContainer: {
    backgroundColor: Colors.gray100,
    padding: Spacing.sm,
    borderRadius: Spacing.borderRadius.sm,
    marginBottom: Spacing.md,
  },
  symptomsLabel: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  symptomsText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.normal * Fonts.size.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
  },
  actionButton: {
    marginLeft: Spacing.sm,
    minWidth: 80,
  },
});
