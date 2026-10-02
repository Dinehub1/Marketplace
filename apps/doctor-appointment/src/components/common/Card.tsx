import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Spacing } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  margin?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
  margin = 'none',
}) => {
  const cardStyle = getCardStyle(variant, padding, margin);

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

const getCardStyle = (
  variant: 'default' | 'elevated' | 'outlined',
  padding: 'none' | 'sm' | 'md' | 'lg',
  margin: 'none' | 'sm' | 'md' | 'lg'
): ViewStyle => {
  const baseStyle: ViewStyle = {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
  };

  // Padding
  switch (padding) {
    case 'sm':
      baseStyle.padding = Spacing.sm;
      break;
    case 'lg':
      baseStyle.padding = Spacing.xl;
      break;
    case 'none':
      baseStyle.padding = 0;
      break;
    default: // md
      baseStyle.padding = Spacing.lg;
  }

  // Margin
  switch (margin) {
    case 'sm':
      baseStyle.margin = Spacing.sm;
      break;
    case 'lg':
      baseStyle.margin = Spacing.xl;
      break;
    case 'none':
      baseStyle.margin = 0;
      break;
    default: // md
      baseStyle.margin = Spacing.md;
  }

  // Variant styles
  switch (variant) {
    case 'elevated':
      return {
        ...baseStyle,
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      };
    case 'outlined':
      return {
        ...baseStyle,
        borderWidth: 1,
        borderColor: Colors.gray200,
        backgroundColor: Colors.white,
      };
    default: // default
      return {
        ...baseStyle,
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      };
  }
};
