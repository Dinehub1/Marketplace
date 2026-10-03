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
import { Colors, Fonts, Spacing } from '../../constants';
import { PatientDetails } from '../../services/mockData';

interface FormStep {
  id: string;
  title: string;
  description?: string;
}

const formSteps: FormStep[] = [
  { id: 'relationship', title: 'Relationship', description: 'Who is this for?' },
  { id: 'basic', title: 'Basic Info', description: 'Personal details' },
  { id: 'contact', title: 'Contact', description: 'Contact information' },
  { id: 'emergency', title: 'Emergency', description: 'Emergency contact' },
];

export const PatientDetailsFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<PatientDetails>>({
    relationship: 'self',
    firstName: '',
    lastName: '',
    age: 0,
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  const handleNext = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = () => {
    Alert.alert(
      'Patient Details Saved',
      'Patient information has been saved successfully.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const updateFormData = (field: keyof PatientDetails, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateEmergencyContact = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact!,
        [field]: value,
      },
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Relationship
        return formData.relationship;
      case 1: // Basic Info
        return formData.firstName && formData.lastName && formData.age;
      case 2: // Contact
        return formData.phone && formData.email && formData.address;
      case 3: // Emergency
        return formData.emergencyContact?.name && formData.emergencyContact?.phone;
      default:
        return false;
    }
  };

  const renderRelationshipStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Who is this appointment for?</Text>
      <Text style={styles.stepDescription}>
        Select the relationship to help us provide better care.
      </Text>
      
      <View style={styles.relationshipGrid}>
        {[
          { value: 'self', label: 'Myself', icon: 'person', description: 'Book for yourself' },
          { value: 'spouse', label: 'Spouse', icon: 'heart', description: 'Book for your partner' },
          { value: 'child', label: 'Child', icon: 'happy', description: 'Book for your child' },
          { value: 'parent', label: 'Parent', icon: 'people', description: 'Book for your parent' },
          { value: 'other', label: 'Other', icon: 'person-add', description: 'Book for someone else' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.relationshipCard,
              formData.relationship === option.value && styles.relationshipCardSelected,
            ]}
            onPress={() => updateFormData('relationship', option.value)}
          >
            <View style={[
              styles.relationshipIcon,
              formData.relationship === option.value && styles.relationshipIconSelected,
            ]}>
              <Ionicons 
                name={option.icon as any} 
                size={32} 
                color={formData.relationship === option.value ? Colors.white : Colors.primary} 
              />
            </View>
            <Text style={[
              styles.relationshipLabel,
              formData.relationship === option.value && styles.relationshipLabelSelected,
            ]}>
              {option.label}
            </Text>
            <Text style={styles.relationshipDescription}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Please provide the patient&apos;s basic information.
      </Text>
      
      <View style={styles.formContainer}>
        <View style={styles.nameRow}>
          <Input
            label="First Name *"
            value={formData.firstName || ''}
            onChangeText={(text) => updateFormData('firstName', text)}
            placeholder="Enter first name"
            style={styles.nameInput}
          />
          <Input
            label="Last Name *"
            value={formData.lastName || ''}
            onChangeText={(text) => updateFormData('lastName', text)}
            placeholder="Enter last name"
            style={styles.nameInput}
          />
        </View>
        
        <View style={styles.ageGenderRow}>
          <Input
            label="Age *"
            value={formData.age?.toString() || ''}
            onChangeText={(text) => updateFormData('age', parseInt(text) || 0)}
            placeholder="Age"
            keyboardType="numeric"
            style={styles.ageInput}
          />
          <View style={styles.genderContainer}>
            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.genderOptions}>
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    formData.gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => updateFormData('gender', option.value)}
                >
                  <Text style={[
                    styles.genderOptionText,
                    formData.gender === option.value && styles.genderOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContactStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepDescription}>
        Provide contact details for appointment confirmations and updates.
      </Text>
      
      <View style={styles.formContainer}>
        <Input
          label="Phone Number *"
          value={formData.phone || ''}
          onChangeText={(text) => updateFormData('phone', text)}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        
        <Input
          label="Email Address *"
          value={formData.email || ''}
          onChangeText={(text) => updateFormData('email', text)}
          placeholder="Enter email address"
          keyboardType="email-address"
        />
        
        <Input
          label="Address *"
          value={formData.address || ''}
          onChangeText={(text) => updateFormData('address', text)}
          placeholder="Enter full address"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderEmergencyStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Emergency Contact</Text>
      <Text style={styles.stepDescription}>
        Provide emergency contact information for safety purposes.
      </Text>
      
      <View style={styles.formContainer}>
        <Input
          label="Emergency Contact Name *"
          value={formData.emergencyContact?.name || ''}
          onChangeText={(text) => updateEmergencyContact('name', text)}
          placeholder="Enter contact name"
        />
        
        <Input
          label="Emergency Contact Phone *"
          value={formData.emergencyContact?.phone || ''}
          onChangeText={(text) => updateEmergencyContact('phone', text)}
          placeholder="Enter contact phone"
          keyboardType="phone-pad"
        />
        
        <Input
          label="Relationship to Patient *"
          value={formData.emergencyContact?.relationship || ''}
          onChangeText={(text) => updateEmergencyContact('relationship', text)}
          placeholder="e.g., Spouse, Parent, Sibling"
        />
      </View>
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          This information will only be used in case of emergencies during your appointment.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderRelationshipStep();
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderContactStep();
      case 3:
        return renderEmergencyStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Patient Details" 
        showBackButton 
        onBackPress={handleBack}
      />
      
      <View style={styles.progressContainer}>
        <ProgressStepper
          steps={formSteps}
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
          title={currentStep === formSteps.length - 1 ? 'Save Details' : 'Continue'}
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
  relationshipGrid: {
    gap: Spacing.md,
  },
  relationshipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  relationshipCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  relationshipIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  relationshipIconSelected: {
    backgroundColor: Colors.primary,
  },
  relationshipLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    flex: 1,
  },
  relationshipLabelSelected: {
    color: Colors.primary,
  },
  relationshipDescription: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
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
  inputLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
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
    backgroundColor: Colors.primary,
  },
  genderOptionText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  genderOptionTextSelected: {
    color: Colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '10',
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Fonts.size.sm,
    color: Colors.info,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
  },
  footer: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});
