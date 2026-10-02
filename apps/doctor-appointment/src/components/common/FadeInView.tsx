import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
  animationType?: 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale';
  distance?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 300,
  animationType = 'fade',
  distance = 30,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animationType === 'slideUp' ? distance : animationType === 'slideDown' ? -distance : 0);
  const translateX = useSharedValue(animationType === 'slideLeft' ? distance : animationType === 'slideRight' ? -distance : 0);
  const scale = useSharedValue(animationType === 'scale' ? 0.8 : 1);

  React.useEffect(() => {
    const startAnimation = () => {
      opacity.value = withTiming(1, { duration });
      
      if (animationType === 'slideUp' || animationType === 'slideDown') {
        translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      }
      
      if (animationType === 'slideLeft' || animationType === 'slideRight') {
        translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
      }
      
      if (animationType === 'scale') {
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      }
    };

    if (delay > 0) {
      opacity.value = withDelay(delay, withTiming(1, { duration }));
      
      if (animationType === 'slideUp' || animationType === 'slideDown') {
        translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
      }
      
      if (animationType === 'slideLeft' || animationType === 'slideRight') {
        translateX.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
      }
      
      if (animationType === 'scale') {
        scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
      }
    } else {
      startAnimation();
    }
  }, [opacity, translateY, translateX, scale, delay, duration, animationType]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};
