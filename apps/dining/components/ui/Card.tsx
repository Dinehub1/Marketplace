import React, { useRef } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animationEnabled?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
  animationEnabled = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animationEnabled && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animationEnabled && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }
  };

  const getPaddingStyle = () => {
    const paddingStyles = {
      none: styles.paddingNone,
      sm: styles.paddingSm,
      md: styles.paddingMd,
      lg: styles.paddingLg,
    };
    return paddingStyles[padding];
  };

  const getCardStyle = () => [
    styles.card,
    styles[variant],
    getPaddingStyle(),
    style,
  ];

  const CardContent = (
    <Animated.View
      style={[
        ...getCardStyle(),
        animationEnabled && onPress ? { transform: [{ scale: scaleAnim }] } : {},
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

export const CardHeader: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ 
  children, 
  style 
}) => (
  <View style={[styles.cardHeader, style]}>
    {children}
  </View>
);

export const CardContent: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ 
  children, 
  style 
}) => (
  <View style={[styles.cardContent, style]}>
    {children}
  </View>
);

export const CardFooter: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ 
  children, 
  style 
}) => (
  <View style={[styles.cardFooter, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16, // rounded-2xl
    overflow: 'hidden',
  },

  // Variants
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, // shadow-lg equivalent
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f4f4f5', // zinc-100
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 0,
  },
  outlined: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#d4d4d8', // zinc-300
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: 12, // p-3
  },
  paddingMd: {
    padding: 16, // p-4
  },
  paddingLg: {
    padding: 24, // p-6
  },

  // Card sections
  cardHeader: {
    paddingBottom: 16, // pb-4
  },
  cardContent: {
    paddingVertical: 8, // py-2
  },
  cardFooter: {
    paddingTop: 16, // pt-4
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

