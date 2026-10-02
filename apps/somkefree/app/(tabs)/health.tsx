import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ProgressData } from '@/constants/Challenges';
import { Colors } from '@/constants/Colors';
import { HealthBenefit, healthBenefits } from '@/constants/HealthBenefits';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, Svg } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Helper component for Progress Ring
const ProgressRing = ({ percentage, size = 60, strokeWidth = 6, color, secondaryColor }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  secondaryColor: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const isComplete = percentage >= 100;
  
  const strokeOffset = useSharedValue(circumference);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withTiming(circumference - (percentage / 100) * circumference, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    }),
  }));
  
  useEffect(() => {
    strokeOffset.value = circumference - (percentage / 100) * circumference;
  }, [percentage, circumference, strokeOffset]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          stroke={secondaryColor}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          stroke={color}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        {isComplete ? (
          <IconSymbol name="checkmark" color={color} size={size * 0.4} style={styles.progressRingIcon} />
        ) : (
          <ThemedText style={[styles.progressRingText, { color }]}>
            {Math.floor(percentage)}%
          </ThemedText>
        )}
      </View>
    </View>
  );
};

interface HealthBenefitWithProgress extends HealthBenefit {
  percentage: number;
}

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const cardBackgroundColor = Colors[colorScheme ?? 'light'].surface;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const secondaryTextColor = Colors[colorScheme ?? 'light'].secondaryText;
  const accentColor = Colors[colorScheme ?? 'light'].tint;
  const progressRingSecondaryColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  const [benefitsWithProgress, setBenefitsWithProgress] = useState<HealthBenefitWithProgress[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadProgressData = async () => {
        try {
          const storedProgress = await AsyncStorage.getItem('userProgress');
          const progress: ProgressData | null = storedProgress ? JSON.parse(storedProgress) : null;
          
          if (progress) {
            const updatedBenefits = healthBenefits.map(benefit => {
              const percentage = Math.min(100, (progress.totalHours / benefit.timeToAchieveHours) * 100);
              return { ...benefit, percentage };
            });
            setBenefitsWithProgress(updatedBenefits);
          }
        } catch (e) {
          console.error('Failed to load progress data in Health:', e);
        }
      };

      loadProgressData();
    }, [])
  );

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: Colors[colorScheme ?? 'light'].background }]} contentContainerStyle={{ paddingBottom: insets.bottom }}>
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.headerText}>Health Recovery</ThemedText>
        
        {benefitsWithProgress.map((benefit) => (
          <View key={benefit.id} style={[styles.benefitCard, { backgroundColor: cardBackgroundColor }]}>
            <IconSymbol name={benefit.icon} size={28} color={accentColor} style={styles.benefitIcon} />
            <View style={styles.benefitTextContainer}>
              <ThemedText style={[styles.benefitTitle, { color: textColor }]}>{benefit.title}</ThemedText>
              <ThemedText style={[styles.benefitDescription, { color: secondaryTextColor }]}>{benefit.description}</ThemedText>
            </View>
            <ProgressRing
              percentage={benefit.percentage}
              color={accentColor}
              secondaryColor={progressRingSecondaryColor}
            />
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    marginBottom: 25,
    textAlign: 'left',
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  benefitIcon: {
    marginRight: 15,
  },
  benefitTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressRingText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressRingIcon: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center'
  },
});