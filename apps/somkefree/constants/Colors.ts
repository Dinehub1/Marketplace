/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#809bce'; // Muted Blue
const tintColorDark = '#95b8d1'; // Lighter, airy blue

export const Colors = {
  light: {
    text: '#000',
    secondaryText: '#5A5A5A',
    background: '#f0f0f0',
    tint: tintColorLight,
    icon: '#687076',
    surface: '#ffffff', // Cards
    surfaceVariant: '#eac4d5', // Dusty Pink for accents
    secondaryButton: '#d6eadf', // Light Green
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    progressRingSecondary: '#e0e0e0', // Added for progress bar background
  },
  dark: {
    text: '#fff',
    secondaryText: '#A9A9A9',
    background: '#121212',
    tint: tintColorDark,
    icon: '#9BA1A6',
    surface: '#1e1e1e', // Cards
    surfaceVariant: '#b8e0d2', // Honeydew Green for accents
    secondaryButton: '#333333',
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    progressRingSecondary: '#3a3a3a', // Added for progress bar background
  },
};
