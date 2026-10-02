import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Card } from './Card';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  margin?: 'none' | 'sm' | 'md' | 'lg';
  animationType?: 'scale' | 'fade' | 'slideUp';
  delay?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
  margin = 'none',
  animationType = 'scale',
  delay = 0,
}) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'fade':
        return {
          opacity: opacity.value,
        };
      case 'slideUp':
        return {
          opacity: opacity.value,
          transform: [{ translateY: translateY.value }],
        };
      default: // scale
        return {
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
        };
    }
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  if (onPress) {
    return (
      <AnimatedTouchableOpacity
        style={[animatedStyle, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Card
          variant={variant}
          padding={padding}
          margin={margin}
          style={{ margin: 0 }} // Remove margin from inner Card to avoid double margins
        >
          {children}
        </Card>
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Card
        variant={variant}
        padding={padding}
        margin={margin}
        style={{ margin: 0 }}
      >
        {children}
      </Card>
    </Animated.View>
  );
};
