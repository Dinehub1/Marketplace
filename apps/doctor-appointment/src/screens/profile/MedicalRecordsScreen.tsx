import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Colors, Fonts, Spacing } from '../../constants';

export const MedicalRecordsScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleAddRecord = () => {
    // Navigate to add medical record screen
    navigation.navigate('AddMedicalRecord' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Medical Records" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* Empty State Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <View style={styles.clipboard}>
              <Text style={styles.clipboardIcon}>📋</Text>
              <View style={styles.medicalCross}>
                <Text style={styles.crossIcon}>+</Text>
              </View>
            </View>
            <Text style={styles.pen}>🖊️</Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.title}>Add a medical record.</Text>
        <Text style={styles.description}>
          A detailed health history helps a doctor diagnose you btter.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Add a record"
            onPress={handleAddRecord}
            style={styles.addButton}
            fullWidth
          />
          <Button
            title="View All Records"
            onPress={() => navigation.navigate('AllMedicalRecords' as never)}
            variant="outline"
            style={styles.viewAllButton}
            fullWidth
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  illustrationContainer: {
    marginBottom: Spacing['4xl'],
  },
  illustration: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clipboard: {
    position: 'relative',
    alignItems: 'center',
  },
  clipboardIcon: {
    fontSize: 60,
  },
  medicalCross: {
    position: 'absolute',
    top: 20,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossIcon: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  pen: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    fontSize: 25,
  },
  title: {
    fontSize: Fonts.size.xl,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
    marginBottom: Spacing['4xl'],
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: Spacing.md,
  },
  addButton: {
    width: '100%',
  },
  viewAllButton: {
    width: '100%',
  },
});
