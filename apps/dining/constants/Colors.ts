/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * DropBy App Color Scheme with Premium Dark Theme
 */

const primaryGreen = '#4CAF50';
const primaryGreenDark = '#45A049';
const primaryGreenLight = '#E8F5E8';

// Premium Dark Theme Colors
export const PremiumColors = {
  // Backgrounds
  background: {
    primary: '#131315',      // Dark gray (main background)
    secondary: '#25252A',     // Card background (lighter gray)
    tertiary: '#2E2E35',      // Elevated cards (even lighter)
    glass: 'rgba(19, 19, 19, 0.85)',  // Glassmorphic
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#808080',
    muted: '#4D4D4D',
    inverse: '#1A1A1D', // Dark text for light backgrounds
  },
  
  // Accents
  accent: {
    primary: '#3ec162',       // Gold
    secondary: '#4CAF50',     // Green
    purple: '#9333EA',        // Purple gradient
    blue: '#3B82F6',          // Blue gradient
    pink: '#EC4899',          // Pink gradient
  },
  
  // Gradients
  gradients: {
    primary: ['#9333EA', '#EC4899'],
    secondary: ['#3B82F6', '#8B5CF6'],
    green: ['#10B981', '#059669'],
    gold: ['#F59E0B', '#D97706'],
  },
  
  // UI Elements
  border: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FAFAFA',
    tint: primaryGreen,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryGreen,
    primary: primaryGreen,
    primaryLight: primaryGreenLight,
    primaryDark: primaryGreenDark,
    secondary: '#FF6B35',
    accent: '#FFD700',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#FF4444',
    info: '#2196F3',
    card: '#FFFFFF',
    border: '#E0E0E0',
    placeholder: '#9E9E9E',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1A1A1D',
    tint: '#FFD700',
    icon: '#B3B3B3',
    tabIconDefault: '#808080',
    tabIconSelected: '#FFD700',
    primary: '#FFD700',
    primaryLight: '#2C5F30',
    primaryDark: primaryGreenDark,
    secondary: '#FF6B35',
    accent: '#FFD700',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    card: '#25252A',
    border: 'rgba(255, 255, 255, 0.1)',
    placeholder: '#808080',
  },
};

// Export individual colors for easy access
export const AppColors = {
  primary: primaryGreen,
  primaryLight: primaryGreenLight,
  primaryDark: primaryGreenDark,
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  green: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    500: primaryGreen,
    600: '#43A047',
    700: '#388E3C',
  },
  red: {
    50: '#FFEBEE',
    500: '#FF4444',
    600: '#E53935',
    700: '#D32F2F',
  },
  orange: {
    500: '#FF6B35',
    600: '#FF5722',
  },
  blue: {
    50: '#E3F2FD',
    500: '#2196F3',
    600: '#1976D2',
  },
  yellow: {
    50: '#FFFDE7',
    500: '#FFD700',
    600: '#FFC107',
  },
};

// Theme Colors for useThemeColors hook
export const DarkThemeColors = {
  background: {
    primary: PremiumColors.background.primary,
    secondary: PremiumColors.background.secondary,
    tertiary: PremiumColors.background.tertiary,
  },
  text: {
    primary: PremiumColors.text.primary,
    secondary: PremiumColors.text.secondary,
    tertiary: PremiumColors.text.tertiary,
  },
  border: PremiumColors.border,
  accent: PremiumColors.accent.secondary,
};

export const LightThemeColors = { 
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
  },
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
  },
  border: '#E0E0E0',
  accent: primaryGreen,
};