import { Colors, type Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
