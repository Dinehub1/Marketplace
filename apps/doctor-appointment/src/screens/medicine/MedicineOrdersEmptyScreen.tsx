import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Colors, Fonts, Spacing } from '../../constants';

export const MedicineOrdersEmptyScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleOrderMedicines = () => {
    // Navigate to medicine ordering flow
    navigation.navigate('MedicineOrderFlow' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Medicine Orders" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.content}>
        {/* Empty State Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationIcon}>📋</Text>
            <View style={styles.checkmarks}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.title}>No orders placed yet</Text>
        <Text style={styles.description}>Place your first order now.</Text>

        {/* Action Button */}
        <Button
          title="Order medicines"
          onPress={handleOrderMedicines}
          style={styles.orderButton}
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
  illustrationIcon: {
    fontSize: 60,
    marginBottom: Spacing.sm,
  },
  checkmarks: {
    position: 'absolute',
    right: 10,
    bottom: 20,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.success,
    lineHeight: 14,
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
    marginBottom: Spacing['4xl'],
  },
  orderButton: {
    width: '100%',
    maxWidth: 300,
  },
});
