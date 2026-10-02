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
import { ImagePicker } from '../../components/common/ImagePicker';
import { ProgressStepper } from '../../components/common/ProgressStepper';
import { OrderSummary } from '../../components/medical/OrderSummary';
import { Colors, Fonts, Spacing } from '../../constants';
import { MedicineItem, mockMedicineItems } from '../../services/mockData';

interface OrderStep {
  id: string;
  title: string;
  description?: string;
}

const orderSteps: OrderStep[] = [
  { id: 'prescription', title: 'Upload Prescription', description: 'Add your prescription' },
  { id: 'medicines', title: 'Select Medicines', description: 'Choose medicines' },
  { id: 'delivery', title: 'Delivery Details', description: 'Address & timing' },
  { id: 'payment', title: 'Payment', description: 'Complete order' },
];

export const MedicineOrderFlowScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [prescriptionImages, setPrescriptionImages] = useState<string[]>([]);
  const [selectedMedicines, setSelectedMedicines] = useState<MedicineItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const handleNext = () => {
    if (currentStep < orderSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOrder();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCompleteOrder = () => {
    Alert.alert(
      'Order Placed Successfully!',
      'Your medicine order has been placed. You will receive a confirmation shortly.',
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
      case 0: // Prescription
        return prescriptionImages.length > 0;
      case 1: // Medicines
        return selectedMedicines.length > 0;
      case 2: // Delivery
        return deliveryAddress.length > 0 && deliveryDate.length > 0;
      case 3: // Payment
        return paymentMethod.length > 0;
      default:
        return false;
    }
  };

  const toggleMedicineSelection = (medicine: MedicineItem) => {
    const isSelected = selectedMedicines.find(m => m.id === medicine.id);
    if (isSelected) {
      setSelectedMedicines(selectedMedicines.filter(m => m.id !== medicine.id));
    } else {
      setSelectedMedicines([...selectedMedicines, medicine]);
    }
  };

  const renderPrescriptionStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Your Prescription</Text>
      <Text style={styles.stepDescription}>
        Please upload a clear photo of your prescription. Make sure all text is readable.
      </Text>
      
      <ImagePicker
        images={prescriptionImages}
        onImagesChange={setPrescriptionImages}
        title="Prescription Images"
        placeholder="Take a photo or select from gallery"
        maxImages={3}
      />
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Our pharmacists will verify your prescription before processing your order.
        </Text>
      </View>
    </View>
  );

  const renderMedicinesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Medicines</Text>
      <Text style={styles.stepDescription}>
        Based on your prescription, please select the medicines you need.
      </Text>
      
      <View style={styles.medicinesGrid}>
        {mockMedicineItems.map((medicine) => {
          const isSelected = selectedMedicines.find(m => m.id === medicine.id);
          
          return (
            <TouchableOpacity
              key={medicine.id}
              style={[
                styles.medicineCard,
                isSelected && styles.medicineCardSelected,
              ]}
              onPress={() => toggleMedicineSelection(medicine)}
            >
              <View style={styles.medicineIcon}>
                <Text style={styles.medicineEmoji}>{medicine.imageUrl}</Text>
              </View>
              
              <Text style={styles.medicineName}>{medicine.name}</Text>
              <Text style={styles.medicineGeneric}>{medicine.genericName}</Text>
              <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
              <Text style={styles.medicinePrice}>${medicine.unitPrice}</Text>
              
              {medicine.prescriptionRequired && (
                <View style={styles.rxBadge}>
                  <Text style={styles.rxText}>Rx</Text>
                </View>
              )}
              
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderDeliveryStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Delivery Details</Text>
      <Text style={styles.stepDescription}>
        Enter your delivery address and preferred delivery date.
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Delivery Address</Text>
        <TouchableOpacity
          style={styles.addressInput}
          onPress={() => setDeliveryAddress('123 Main St, City, State 12345')}
        >
          <Ionicons name="location" size={20} color={Colors.primary} />
          <Text style={[
            styles.addressText,
            !deliveryAddress && styles.addressPlaceholder,
          ]}>
            {deliveryAddress || 'Select delivery address'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Preferred Delivery Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setDeliveryDate('January 28, 2025')}
        >
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <Text style={[
            styles.dateText,
            !deliveryDate && styles.datePlaceholder,
          ]}>
            {deliveryDate || 'Select delivery date'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.deliveryOptions}>
        <TouchableOpacity style={styles.deliveryOption}>
          <Ionicons name="bicycle" size={24} color={Colors.primary} />
          <View style={styles.deliveryOptionContent}>
            <Text style={styles.deliveryOptionTitle}>Express Delivery</Text>
            <Text style={styles.deliveryOptionSubtitle}>Within 2-4 hours • $9.99</Text>
          </View>
          <Ionicons name="radio-button-on" size={20} color={Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deliveryOption}>
          <Ionicons name="car" size={24} color={Colors.textSecondary} />
          <View style={styles.deliveryOptionContent}>
            <Text style={styles.deliveryOptionTitle}>Standard Delivery</Text>
            <Text style={styles.deliveryOptionSubtitle}>Next day delivery • Free</Text>
          </View>
          <Ionicons name="radio-button-off" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPaymentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment & Order Summary</Text>
      
      <OrderSummary
        order={{
          deliveryAddress,
          deliveryDate,
          paymentMethod,
          orderNumber: 'MED-2025-001',
        }}
        items={selectedMedicines}
        showHeader={false}
      />
      
      <View style={styles.paymentMethods}>
        <Text style={styles.paymentTitle}>Payment Method</Text>
        
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'Credit Card' && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod('Credit Card')}
        >
          <Ionicons name="card" size={24} color={Colors.primary} />
          <Text style={styles.paymentOptionText}>Credit Card</Text>
          <Ionicons 
            name={paymentMethod === 'Credit Card' ? 'radio-button-on' : 'radio-button-off'} 
            size={20} 
            color={paymentMethod === 'Credit Card' ? Colors.primary : Colors.gray400} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'Digital Wallet' && styles.paymentOptionSelected,
          ]}
          onPress={() => setPaymentMethod('Digital Wallet')}
        >
          <Ionicons name="wallet" size={24} color={Colors.primary} />
          <Text style={styles.paymentOptionText}>Digital Wallet</Text>
          <Ionicons 
            name={paymentMethod === 'Digital Wallet' ? 'radio-button-on' : 'radio-button-off'} 
            size={20} 
            color={paymentMethod === 'Digital Wallet' ? Colors.primary : Colors.gray400} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPrescriptionStep();
      case 1:
        return renderMedicinesStep();
      case 2:
        return renderDeliveryStep();
      case 3:
        return renderPaymentStep();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Order Medicines" 
        showBackButton 
        onBackPress={handleBack}
      />
      
      <View style={styles.progressContainer}>
        <ProgressStepper
          steps={orderSteps}
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
          title={currentStep === orderSteps.length - 1 ? 'Place Order' : 'Continue'}
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
  medicinesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  medicineCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gray200,
    position: 'relative',
  },
  medicineCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  medicineIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  medicineEmoji: {
    fontSize: 20,
  },
  medicineName: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  medicineGeneric: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  medicineDosage: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  medicinePrice: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.semibold,
    color: Colors.primary,
  },
  rxBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  rxText: {
    fontSize: Fonts.size.xs,
    fontWeight: Fonts.weight.bold,
    color: Colors.white,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
  },
  addressPlaceholder: {
    color: Colors.gray400,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
  },
  datePlaceholder: {
    color: Colors.gray400,
  },
  deliveryOptions: {
    gap: Spacing.md,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: Spacing.md,
  },
  deliveryOptionContent: {
    flex: 1,
  },
  deliveryOptionTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  deliveryOptionSubtitle: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  paymentMethods: {
    marginTop: Spacing.lg,
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
    marginBottom: Spacing.md,
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
