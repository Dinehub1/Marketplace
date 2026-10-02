/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** QuickDriver brand (from quickdriver.in): amber + dark navy, Outfit font */
export const Brand = {
  amber: '#F1B021',
  amberBright: '#FFB515',
  navy: '#172238',
  navyDeep: '#0C111C',
  navyLight: '#1C2840',
  success: '#10B981',
  danger: '#E92D3D',
} as const;

export const Colors = {
  light: {
    text: '#0C111C',
    background: '#ffffff',
    backgroundElement: '#F7F8FA',
    backgroundSelected: '#EEF0F3',
    textSecondary: '#5B6472',
  },
  dark: {
    text: '#ffffff',
    background: '#0C111C',
    backgroundElement: '#172238',
    backgroundSelected: '#1C2840',
    textSecondary: '#A8B0BD',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
