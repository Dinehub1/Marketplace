/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // `useColorScheme()` returns `ColorSchemeName`, which in RN 0.86 is
  // `'light' | 'dark' | null | undefined` — so `props[theme]` was an index error under
  // `strict`. Narrowing to the two keys the palettes actually have is the fix; a cast
  // would have hidden the same mistake at the `Colors[theme]` lookup below.
  const theme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
