import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MoneyProvider, useMoney } from '@/lib/store';

// Keep the splash up until saved transactions are read, so the dashboard never flashes ₹0.
SplashScreen.preventAutoHideAsync();

function navTheme(dark: boolean): Theme {
  const base = dark ? DarkTheme : DefaultTheme;
  const c = dark ? Colors.dark : Colors.light;
  return {
    ...base,
    colors: { ...base.colors, primary: c.tint, background: c.background, card: c.card, text: c.text, border: c.border },
  };
}

function Screens() {
  const { ready } = useMoney();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';

  return (
    <ThemeProvider value={navTheme(dark)}>
      <MoneyProvider>
        <Screens />
      </MoneyProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
