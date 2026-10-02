import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AnimatedProgressProps {
  progress: number; // 0 to 100
  barColor: string;
  backgroundColor: string;
}

const AnimatedProgress: React.FC<AnimatedProgressProps> = ({ progress, barColor, backgroundColor }) => {
  const width = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
  }, [progress, width]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.progressBar, { backgroundColor: barColor }, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
});

export default AnimatedProgress; 