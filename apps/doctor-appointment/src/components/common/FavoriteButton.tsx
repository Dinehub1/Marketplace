import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../constants';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: (isFavorite: boolean) => void;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
  animationDuration?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  size = 24,
  style,
  disabled = false,
  animationDuration = 300,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      // Scale up then back to normal
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: animationDuration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationDuration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    }
  }, [isAnimating, scaleAnim, animationDuration]);

  const handlePress = () => {
    if (disabled || isAnimating) return;
    
    setIsAnimating(true);
    onToggle(!isFavorite);
  };

  const getIconName = () => {
    return isFavorite ? 'heart' : 'heart-outline';
  };

  const getIconColor = () => {
    if (disabled) return Colors.gray400;
    return isFavorite ? Colors.error : Colors.gray500;
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={disabled || isAnimating}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={getIconName()}
          size={size}
          color={getIconColor()}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
