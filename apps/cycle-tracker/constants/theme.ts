/**
 * Cycle Tracker App Theme
 * Based on Stitch Design: Light mode, Manrope font, #5e19e6 primary color
 */

import { Platform } from 'react-native';

// Primary brand color from Stitch design
export const primaryColor = '#5e19e6';
export const primaryLight = '#8b5cf6';
export const primaryDark = '#4c1d95';

export const Colors = {
  light: {
    // Brand colors
    primary: primaryColor,
    primaryLight: '#8b5cf6',
    primaryDark: '#4c1d95',

    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8f7fc',
    backgroundTertiary: '#f3f0ff',

    // Text colors
    text: '#1a1a2e',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',

    // Surface colors
    surface: '#ffffff',
    surfaceSecondary: '#f9fafb',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Cycle phase colors
    period: '#ef4444',
    fertile: '#22c55e',
    ovulation: '#f59e0b',
    luteal: '#8b5cf6',
    follicular: '#06b6d4',

    // UI colors
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: primaryColor,
    tint: primaryColor,

    // Card colors
    cardBackground: '#ffffff',
    cardBorder: '#f3f4f6',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    primary: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryDark: '#5e19e6',

    background: '#0f0f1a',
    backgroundSecondary: '#1a1a2e',
    backgroundTertiary: '#252542',

    text: '#f9fafb',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',
    textInverse: '#1a1a2e',

    surface: '#1a1a2e',
    surfaceSecondary: '#252542',

    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',

    period: '#f87171',
    fertile: '#4ade80',
    ovulation: '#fbbf24',
    luteal: '#a78bfa',
    follicular: '#22d3ee',

    border: '#374151',
    borderLight: '#4b5563',
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: '#8b5cf6',
    tint: '#8b5cf6',

    cardBackground: '#1a1a2e',
    cardBorder: '#374151',

    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const Fonts = Platform.select({
  ios: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    sans: 'Manrope_400Regular',
    mono: 'ui-monospace',
  },
  android: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    sans: 'Manrope_400Regular',
    mono: 'monospace',
  },
  default: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    sans: 'Manrope_400Regular',
    mono: 'monospace',
  },
  web: {
    regular: "'Manrope', system-ui, sans-serif",
    medium: "'Manrope', system-ui, sans-serif",
    semibold: "'Manrope', system-ui, sans-serif",
    bold: "'Manrope', system-ui, sans-serif",
    sans: "'Manrope', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
};
