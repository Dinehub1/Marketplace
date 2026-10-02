import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface ForYouScreenProps {
  scrollY?: Animated.Value;
}

export default function ForYouScreen({ scrollY }: ForYouScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={80} color={PremiumColors.accent.primary} />
        </View>

        {/* Title */}
        <Text style={styles.title}>For You</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Under Development</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          We're crafting a personalized experience just for you. This section will feature curated recommendations based on your preferences and activity.
        </Text>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: PremiumColors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: PremiumColors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.accent.primary,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: PremiumColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: PremiumColors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: PremiumColors.accent.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: PremiumColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

