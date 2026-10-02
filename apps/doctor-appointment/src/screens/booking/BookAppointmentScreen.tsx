import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Colors, Fonts, Spacing } from '../../constants';
import { CreateAppointmentData } from '../../services/appointmentsService';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

// Remove local interface and use the service type
type BookingData = CreateAppointmentData & {
  doctorName: string;
  specialization: string;
  consultationFee: number;
};

export const BookAppointmentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'follow_up' | 'emergency'>('consultation');
  const [symptoms, setSymptoms] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Get doctor info from route params
  const doctorInfo = (route.params as any) || {};
  const { doctorId, doctorName, specialization, consultationFee } = doctorInfo;

  useEffect(() => {
    generateTimeSlots();
    setTodayAsDefault();
  }, []);

  const setTodayAsDefault = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    setSelectedDate(dateString);
  };

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [
      { id: '1', time: '09:00', isAvailable: true },
      { id: '2', time: '09:30', isAvailable: true },
      { id: '3', time: '10:00', isAvailable: false },
      { id: '4', time: '10:30', isAvailable: true },
      { id: '5', time: '11:00', isAvailable: true },
      { id: '6', time: '11:30', isAvailable: false },
      { id: '7', time: '14:00', isAvailable: true },
      { id: '8', time: '14:30', isAvailable: true },
      { id: '9', time: '15:00', isAvailable: true },
      { id: '10', time: '15:30', isAvailable: true },
      { id: '11', time: '16:00', isAvailable: false },
      { id: '12', time: '16:30', isAvailable: true },
    ];
    setAvailableSlots(slots);
  };

  const appointmentTypes = [
    { id: 'consultation', label: 'Consultation', icon: 'medical-outline' },
    { id: 'follow_up', label: 'Follow-up', icon: 'repeat-outline' },
    { id: 'emergency', label: 'Emergency', icon: 'alert-circle-outline' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select date and time for your appointment.');
      return;
    }

    if (!symptoms.trim()) {
      Alert.alert('Missing Information', 'Please describe your symptoms or reason for visit.');
      return;
    }

    // Navigate to patient details form first
    navigation.navigate('PatientDetailsForm' as never, {
      appointmentData: {
        doctorId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        appointmentType,
        symptoms: symptoms.trim(),
        notes: notes.trim(),
        doctorName,
        specialization,
        consultationFee,
      },
    });
  };

  const getDatesArray = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      });
    }
    
    return dates;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Book Appointment" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Info */}
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <Text style={styles.specialization}>{specialization}</Text>
          <Text style={styles.consultationFee}>Consultation Fee: ${consultationFee}</Text>
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <View style={styles.appointmentTypeContainer}>
            {appointmentTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.appointmentTypeCard,
                  appointmentType === type.id && styles.selectedTypeCard,
                ]}
                onPress={() => setAppointmentType(type.id as any)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={24} 
                  color={appointmentType === type.id ? Colors.white : Colors.primary} 
                />
                <Text style={[
                  styles.appointmentTypeText,
                  appointmentType === type.id && styles.selectedTypeText,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.dateScroll}
          >
            {getDatesArray().map((dateObj) => (
              <TouchableOpacity
                key={dateObj.date}
                style={[
                  styles.dateCard,
                  selectedDate === dateObj.date && styles.selectedDateCard,
                ]}
                onPress={() => setSelectedDate(dateObj.date)}
              >
                <Text style={[
                  styles.dateText,
                  selectedDate === dateObj.date && styles.selectedDateText,
                ]}>
                  {dateObj.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedDate && (
            <Text style={styles.selectedDateDisplay}>
              {formatDate(selectedDate)}
            </Text>
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeSlotContainer}>
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  !slot.isAvailable && styles.unavailableSlot,
                  selectedTime === slot.time && styles.selectedTimeSlot,
                ]}
                onPress={() => slot.isAvailable && setSelectedTime(slot.time)}
                disabled={!slot.isAvailable}
              >
                <Text style={[
                  styles.timeSlotText,
                  !slot.isAvailable && styles.unavailableSlotText,
                  selectedTime === slot.time && styles.selectedTimeSlotText,
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms / Reason for Visit *</Text>
          <Input
            placeholder="Describe your symptoms or reason for visit..."
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <Input
            placeholder="Any additional information you'd like to share..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? "Booking..." : "Book Appointment"}
            onPress={handleBookAppointment}
            loading={isLoading}
          />
        </View>
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
  doctorInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  doctorName: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  specialization: {
    fontSize: Fonts.size.base,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  consultationFee: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  appointmentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  selectedTypeCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  appointmentTypeText: {
    marginTop: Spacing.xs,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  selectedTypeText: {
    color: Colors.white,
  },
  dateScroll: {
    marginBottom: Spacing.md,
  },
  dateCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  selectedDateCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  selectedDateText: {
    color: Colors.white,
  },
  selectedDateDisplay: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unavailableSlot: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray300,
  },
  timeSlotText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  selectedTimeSlotText: {
    color: Colors.white,
  },
  unavailableSlotText: {
    color: Colors.gray400,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomSection: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
  },
});
