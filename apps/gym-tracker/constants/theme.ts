import { useColorScheme } from 'react-native';

/**
 * openGym-style palette: true-black ground, grouped grey cards, one green accent. Light mode
 * mirrors it on an iOS-grouped grey.
 */
const palette = {
  light: {
    background: '#f2f2f7',
    surface: '#ffffff',
    surfaceAlt: '#e9e9ee',
    border: '#d8d8de',
    text: '#0b0b0c',
    textMuted: '#6c6c72',
    accent: '#22c55e',
    accentText: '#03140a',
    accentSoft: '#dcfce7',
    accentInk: '#15803d',
    danger: '#dc2626',
    gold: '#ca8a04',
    orange: '#f59e0b',
    media: '#ffffff',
  },
  dark: {
    background: '#000000',
    surface: '#1c1c1e',
    surfaceAlt: '#2c2c2e',
    border: '#2c2c2e',
    text: '#ffffff',
    textMuted: '#8e8e93',
    accent: '#30d158',
    accentText: '#03140a',
    accentSoft: '#12351d',
    accentInk: '#30d158',
    danger: '#ff453a',
    gold: '#facc15',
    orange: '#ff9f0a',
    media: '#ffffff',
  },
};

export type Palette = typeof palette.light;

export function useTheme(): Palette {
  return palette[useColorScheme() === 'light' ? 'light' : 'dark'];
}

export const radius = { sm: 10, md: 16, lg: 22 };
