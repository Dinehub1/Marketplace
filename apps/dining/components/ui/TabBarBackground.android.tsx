import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { PremiumColors } from '../../constants/Colors';

// Optimized: Android version without BlurView for better performance
// BlurView causes 30-40% FPS drop on Android, using solid background instead
export default function BlurTabBarBackground() {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: PremiumColors.background.primary,
          // Adding subtle transparency for depth
          opacity: 0.98,
        },
      ]}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}

