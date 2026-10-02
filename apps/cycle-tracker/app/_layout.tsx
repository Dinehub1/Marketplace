import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboarding, useUserProfile } from '@/hooks/use-storage';
import { getPin } from '@/services/storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen may already be hidden
});

// Custom light theme matching Stitch design
const CycleTrackerLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.cardBackground,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.primary,
  },
};

const CycleTrackerDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.cardBackground,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.primary,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  const segments = useSegments();

  const { isComplete: onboardingComplete, loading: onboardingLoading } = useOnboarding();
  const { profile, loading: profileLoading } = useUserProfile();
  const [pinChecked, setPinChecked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  // Navigation guard: redirect based on onboarding/PIN state
  useEffect(() => {
    if (onboardingLoading || profileLoading || (!fontsLoaded && !fontError)) return;
    // Wait for isComplete to actually load (null = still loading)
    if (onboardingComplete === null) return;

    const currentSegment = segments[0];

    // If onboarding not complete, redirect there (unless already on it)
    if (!onboardingComplete && currentSegment !== 'onboarding') {
      router.replace('/onboarding');
      return;
    }

    // If onboarding complete and we're on the onboarding screen, go to tabs
    if (onboardingComplete && currentSegment === 'onboarding') {
      // Allow — user is finishing onboarding, handleFinish will navigate them
      return;
    }

    // Check PIN lock on first load (not on every segment change)
    if (onboardingComplete && profile.pinEnabled && !pinChecked && currentSegment !== 'pin-lock') {
      let isMounted = true;
      getPin().then(pin => {
        if (!isMounted) return;
        if (pin) {
          router.replace('/pin-lock');
        }
        setPinChecked(true);
      });
      return () => { isMounted = false; };
    }
  }, [onboardingComplete, onboardingLoading, profileLoading, fontsLoaded, fontError, segments, profile.pinEnabled, pinChecked, router]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Adaptive header style based on color scheme
  const headerStyle = { backgroundColor: colors.background };
  const headerTintColor = colors.primary;

  return (
    <ThemeProvider value={isDark ? CycleTrackerDarkTheme : CycleTrackerLightTheme}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="pin-lock"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="log-symptoms"
            options={{
              title: 'Log Symptoms',
              presentation: 'modal',
              headerStyle,
              headerTintColor,
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              title: 'Notifications',
              headerStyle,
              headerTintColor,
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="privacy"
            options={{
              title: 'Privacy & Security',
              headerStyle,
              headerTintColor,
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="partner-sync"
            options={{
              title: 'Partner Sync',
              headerStyle,
              headerTintColor,
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="article"
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </Stack>
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
