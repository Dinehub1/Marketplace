import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AppColors } from '../../constants/Colors';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 'low' | 'medium' | 'high';
  padding?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large';
  animationEnabled?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  style,
  onPress,
  elevation = 'medium',
  padding = 'medium',
  borderRadius = 'medium',
  animationEnabled = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animationEnabled && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animationEnabled && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getPaddingStyle = () => {
    const paddingStyles = {
      none: styles.paddingNone,
      small: styles.paddingSmall,
      medium: styles.paddingMedium,
      large: styles.paddingLarge,
    };
    return paddingStyles[padding];
  };

  const getRadiusStyle = () => {
    const radiusStyles = {
      small: styles.radiusSmall,
      medium: styles.radiusMedium,
      large: styles.radiusLarge,
    };
    return radiusStyles[borderRadius];
  };

  const getCardStyle = () => {
    let baseStyle = [
      styles.card,
      styles[elevation],
      getPaddingStyle(),
      getRadiusStyle(),
    ];

    return baseStyle;
  };

  const CardContent = (
    <Animated.View
      style={[
        ...getCardStyle(),
        animationEnabled && onPress ? { transform: [{ scale: scaleAnim }] } : {},
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        activeOpacity={1}
      >
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    overflow: 'hidden',
  },

  // Elevations
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  // Padding
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 8,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },

  // Border Radius
  radiusSmall: {
    borderRadius: 8,
  },
  radiusMedium: {
    borderRadius: 12,
  },
  radiusLarge: {
    borderRadius: 16,
  },
});
