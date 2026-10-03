import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
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
import { ProgressStepper } from '../../components/common/ProgressStepper';
import { TestPackageCard } from '../../components/medical/TestPackageCard';
import { Colors, Fonts, Spacing } from '../../constants';
import { DiagnosticPackage, mockDiagnosticPackages, PatientDetails } from '../../services/mockData';

interface BookingStep {
  id: string;
  title: string;
  description?: string;
}

const bookingSteps: BookingStep[] = [
  { id: 'package', title: 'Select Package', description: 'Choose health package' },
  { id: 'patient', title: 'Patient Details', description: 'Enter patient info' },
  { id: 'schedule', title: 'Schedule', description: 'Date & time' },
  { id: 'payment', title: 'Payment', description: 'Complete booking' },
];

export const DiagnosticsBookingScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<DiagnosticPackage | null>(null);
  const [patientDetails, setPatientDetails] = useState<Partial<PatientDetails>>({
    relationship: 'self',
    firstName: '',
    lastName: '',
    age: 0,
    gender: 'male',
    phone: '',
    email: '',
    address: '',
  });
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleNext = () => {
    if (currentStep < bookingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteBooking();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCompleteBooking = () => {
    Alert.alert(
      'Booking Confirmed!',
      'Your diagnostic test has been booked successfully. You will receive a confirmation shortly.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Package selection
        return selectedPackage !== null;
      case 1: // Patient details
        return patientDetails.firstName && patientDetails.lastName && patientDetails.phone;
      case 2: // Schedule
        return scheduledDate && scheduledTime;
      case 3: // Payment
        return paymentMethod;
      default:
        return false;
    }
  };

  const renderPackageStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Health Package</Text>
      <Text style={styles.stepDescription}>
        Choose a comprehensive health checkup package that suits your needs.
      </Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {mockDiagnosticPackages.map((pkg) => (
          <TestPackageCard
            key={pkg.id}
            package={pkg}
            isSelected={selectedPackage?.id === pkg.id}
            showBookButton={false}
            onViewDetails={() => setSelectedPackage(pkg)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderPatientStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Patient Details</Text>
      <Text style={styles.stepDescription}>
        Please provide the patient&apos;s information for the health checkup.
      </Text>
      
      <View style={styles.relationshipContainer}>
        <Text style={styles.inputLabel}>This test is for:</Text>
        <View style={styles.relationshipOptions}>
          {[
            { value: 'self', label: 'Myself' },
            { value: 'spouse', label: 'Spouse' },
            { value: 'child', label: 'Child' },
            { value: 'parent', label: 'Parent' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.relationshipOption,
                patientDetails.relationship === option.value && styles.relationshipOptionSelected,
              ]}
              onPress={() => setPatientDetails({ ...patientDetails, relationship: option.value as any })}
            >
              <Text style={[
                styles.relationshipOptionText,
                patientDetails.relationship === option.value && styles.relationshipOptionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.nameRow}>
          <Input
            label="First Name"
            value={patientDetails.firstName || ''}
            onChangeText={(text) => setPatientDetails({ ...patientDetails, firstName: text })}
            placeholder="Enter first name"
            style={styles.nameInput}
          />
          <Input
            label="Last Name"
            value={patientDetails.lastName || ''}
            onChangeText={(text) => setPatientDetails({ ...patientDetails, lastName: text })}
            placeholder="Enter last name"
            style={styles.nameInput}
          />
        </View>
        
        <View style={styles.ageGenderRow}>
          <Input
            label="Age"
            value={patientDetails.age?.toString() || ''}
            onChangeText={(text) => setPatientDetails({ ...patientDetails, age: parseInt(text) || 0 })}
            placeholder="Age"
            keyboardType="numeric"
            style={styles.ageInput}
          />
          <View style={styles.genderContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderOptions}>
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    patientDetails.gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => setPatientDetails({ ...patientDetails, gender: option.value as any })}
                >
                  <Text style={[
                    styles.genderOptionText,
                    patientDetails.gender === option.value && styles.genderOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <Input
          label="Phone Number"
          value={patientDetails.phone || ''}
          onChangeText={(text) => setPatientDetails({ ...patientDetails, phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        
        <Input
          label="Email Address"
          value={patientDetails.email || ''}
          onChangeText={(text) => setPatientDetails({ ...patientDetails, email: text })}
          placeholder="Enter email address"
          keyboardType="email-address"
        />
        
        <Input
          label="Address"
          value={patientDetails.address || ''}
          onChangeText={(text) => setPatientDetails({ ...patientDetails, address: text })}
          placeholder="Enter full address"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderScheduleStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Schedule Your Test</Text>
      <Text style={styles.stepDescription}>
        Choose your preferred date and time for the health checkup.
      </Text>
      
      <View style={styles.scheduleContainer}>
        <TouchableOpacity
          style={styles.scheduleInput}
          onPress={() => setScheduledDate('January 30, 2025')}
        >
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <View style={styles.scheduleInputContent}>
            <Text style={styles.scheduleInputLabel}>Select Date</Text>
            <Text style={[
              styles.scheduleInputValue,
              !scheduledDate && styles.scheduleInputPlaceholder,
            ]}>
              {scheduledDate || 'Choose date'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.scheduleInput}
          onPress={() => setScheduledTime('09:00 AM')}
        >
          <Ionicons name="time" size={20} color={Colors.primary} />
          <View style={styles.scheduleInputContent}>
            <Text style={styles.scheduleInputLabel}>Select Time</Text>
            <Text style={[
              styles.scheduleInputValue,
              !scheduledTime && styles.scheduleInputPlaceholder,
            ]}>
              {scheduledTime || 'Choose time'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timeSlots}>
        <Text style={styles.timeSlotsTitle}>Available Time Slots</Text>
        <View style={styles.timeSlotsGrid}>
          {['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                scheduledTime === time && styles.timeSlotSelected,
              ]}
              onPress={() => setScheduledTime(time)}
            >
              <Text style={[
                styles.timeSlotText,
                scheduledTime === time && styles.timeSlotTextSelected,
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.sampleCollection}>
        <View style={styles.sampleCollectionHeader}>
          <Ionicons name="home" size={24} color={Colors.primary} />
          <Text style={styles.sampleCollectionTitle}>Home Sample Collection</Text>
        </View>
        <Text style={styles.sampleCollectionDescription}>
          Our certified phlebotomist will visit your home to collect samples at your scheduled time.
        </Text>
      </View>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment & Confirmation</Text>
      
      {selectedPackage && (
        <View style={styles.bookingSummary}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Package:</Text>
            <Text style={styles.summaryValue}>{selectedPackage.title}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Patient:</Text>
            <Text style={styles.summaryValue}>
              {patientDetails.firstName} {patientDetails.lastName}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Date & Time:</Text>
            <Text style={styles.summaryValue}>
              {scheduledDate} at {scheduledTime}
            </Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Package Cost:</Text>
            <Text style={styles.summaryValue}>${selectedPackage.originalPrice}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Discount ({selectedPackage.discount}%):</Text>
            <Text style={[styles.summaryValue, styles.discountValue]}>
              -${selectedPackage.originalPrice - selectedPackage.discountedPrice}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>${selectedPackage.discountedPrice}</Text>
          </View>
        </View>
      )}
      
      <View style={styles.paymentMethods}>
        <Text style={styles.paymentTitle}>Payment Method</Text>
        
        {[
          { id: 'card', name: 'Credit/Debit Card', icon: 'card' },
          { id: 'wallet', name: 'Digital Wallet', icon: 'wallet' },
          { id: 'upi', name: 'UPI Payment', icon: 'phone-portrait' },
        ].map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentOption,
              paymentMethod === method.name && styles.paymentOptionSelected,
            ]}
            onPress={() => setPaymentMethod(method.name)}
          >
            <Ionicons name={method.icon as any} size={24} color={Colors.primary} />
            <Text style={styles.paymentOptionText}>{method.name}</Text>
            <Ionicons 
              name={paymentMethod === method.name ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={paymentMethod === method.name ? Colors.primary : Colors.gray400} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPackageStep();
      case 1:
        return renderPatientStep();
      case 2:
        return renderScheduleStep();
      case 3:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Book Diagnostic Test" 
        showBackButton 
        onBackPress={handleBack}
      />
      
      <View style={styles.progressContainer}>
        <ProgressStepper
          steps={bookingSteps}
          currentStep={currentStep}
          variant="horizontal"
          showLabels={false}
        />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title={currentStep === bookingSteps.length - 1 ? 'Confirm Booking' : 'Continue'}
          onPress={handleNext}
          disabled={!canProceed()}
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
  progressContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: Spacing.screenPadding,
  },
  stepTitle: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
    marginBottom: Spacing.lg,
  },
  relationshipContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  relationshipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  relationshipOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  relationshipOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  relationshipOptionText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  relationshipOptionTextSelected: {
    color: Colors.primary,
  },
  formContainer: {
    gap: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameInput: {
    flex: 1,
  },
  ageGenderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  ageInput: {
    width: 100,
  },
  genderContainer: {
    flex: 1,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  genderOptionText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  genderOptionTextSelected: {
    color: Colors.primary,
  },
  scheduleContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scheduleInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.md,
  },
  scheduleInputContent: {
    flex: 1,
  },
  scheduleInputLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  scheduleInputValue: {
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
    fontWeight: Fonts.weight.medium,
  },
  scheduleInputPlaceholder: {
    color: Colors.gray400,
    fontWeight: Fonts.weight.normal,
  },
  timeSlots: {
    marginBottom: Spacing.lg,
  },
  timeSlotsTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  timeSlotSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    fontWeight: Fonts.weight.medium,
  },
  timeSlotTextSelected: {
    color: Colors.white,
  },
  sampleCollection: {
    backgroundColor: Colors.primary + '10',
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
  },
  sampleCollectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sampleCollectionTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.primary,
  },
  sampleCollectionDescription: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
  },
  bookingSummary: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    fontWeight: Fonts.weight.medium,
    flex: 1,
    textAlign: 'right',
  },
  discountValue: {
    color: Colors.success,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
  },
  paymentMethods: {
    gap: Spacing.md,
  },
  paymentTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.md,
  },
  paymentOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  paymentOptionText: {
    flex: 1,
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
  },
  footer: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});
