import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../constants/Colors';
import { LiquidButton } from './LiquidButton';
import { ModernButton } from './ModernButton';
import { RippleButton } from './RippleButton';

export const ButtonShowcase: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Modern Button Components</Text>
      
      {/* Modern Button Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modern Button</Text>
        <View style={styles.buttonRow}>
          <ModernButton
            title="Primary"
            onPress={() => console.log('Primary pressed')}
            variant="primary"
            size="md"
          />
          <ModernButton
            title="Secondary"
            onPress={() => console.log('Secondary pressed')}
            variant="secondary"
            size="md"
          />
        </View>
        <View style={styles.buttonRow}>
          <ModernButton
            title="Outline"
            onPress={() => console.log('Outline pressed')}
            variant="outline"
            size="md"
          />
          <ModernButton
            title="Ghost"
            onPress={() => console.log('Ghost pressed')}
            variant="ghost"
            size="md"
          />
        </View>
      </View>

      {/* Liquid Button Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liquid Button</Text>
        <View style={styles.buttonRow}>
          <LiquidButton
            title="Primary Liquid"
            onPress={() => console.log('Liquid primary pressed')}
            variant="primary"
            size="md"
          />
          <LiquidButton
            title="Outline Liquid"
            onPress={() => console.log('Liquid outline pressed')}
            variant="outline"
            size="md"
          />
        </View>
        <LiquidButton
          title="Full Width Liquid"
          onPress={() => console.log('Full width pressed')}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.fullWidthButton}
        />
      </View>

      {/* Ripple Button Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ripple Button</Text>
        <View style={styles.buttonRow}>
          <RippleButton
            title="Primary Ripple"
            onPress={() => console.log('Ripple primary pressed')}
            variant="primary"
            size="md"
          />
          <RippleButton
            title="Secondary Ripple"
            onPress={() => console.log('Ripple secondary pressed')}
            variant="secondary"
            size="md"
          />
        </View>
        <RippleButton
          title="With Icon"
          onPress={() => console.log('Icon button pressed')}
          variant="primary"
          size="lg"
          icon={<Ionicons name="star" size={18} color={AppColors.white} />}
          style={styles.iconButton}
        />
      </View>

      {/* Size Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size Variants</Text>
        <View style={styles.buttonColumn}>
          <ModernButton
            title="Small"
            onPress={() => console.log('Small pressed')}
            variant="primary"
            size="sm"
          />
          <ModernButton
            title="Medium"
            onPress={() => console.log('Medium pressed')}
            variant="primary"
            size="md"
          />
          <ModernButton
            title="Large"
            onPress={() => console.log('Large pressed')}
            variant="primary"
            size="lg"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.gray[50],
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.black,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.black,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  buttonColumn: {
    alignItems: 'center',
    gap: 12,
  },
  fullWidthButton: {
    marginTop: 8,
  },
  iconButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
