import { DarkThemeColors, LightThemeColors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

/**
 * useThemeColors - Returns theme colors based on user's theme preference
 * 
 * Automatically switches between light and dark colors when user changes theme
 * 
 * @returns Theme colors object with background, text, accent, etc.
 */
export const useThemeColors = () => {
  const { currentTheme } = useTheme();
  
  return currentTheme === 'dark' ? DarkThemeColors : LightThemeColors;
};

/**
 * Hook to get the current theme mode ('light' or 'dark')
 * Useful for conditional logic based on theme
 */
export const useCurrentTheme = () => {
  const { currentTheme } = useTheme();
  return currentTheme;
};






