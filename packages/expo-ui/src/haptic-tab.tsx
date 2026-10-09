import React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * A tab button that ticks in the hand on iOS.
 *
 * Moved verbatim from five apps (gatted, dining, cycle-tracker, money-map, smokefree),
 * where the file was byte-identical. It takes `props: any` because it is spread straight
 * into `Pressable` and forwarded by React Navigation's `tabBarButton`, which does not
 * expose a useful prop type for this.
 *
 * `process.env.EXPO_OS` is inlined by Expo's bundler at build time, so this compiles to
 * a constant per platform rather than a runtime check.
 */
export function HapticTab(props: any) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev: GestureResponderEvent) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
