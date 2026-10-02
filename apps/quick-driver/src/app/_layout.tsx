import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppProvider, useApp } from '@/lib/app-context';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { phone, role } = useApp();

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: 'Outfit_700Bold' },
      }}>
      <Stack.Protected guard={!!phone && role === 'customer'}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="booking/new" options={{ title: 'Book a driver' }} />
        <Stack.Screen
          name="booking/trip"
          options={{ title: 'Your trip', headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!!phone && role === 'driver'}>
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!phone && role === 'admin'}>
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!phone}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProvider>
        <AnimatedSplashOverlay />
        <RootStack />
      </AppProvider>
    </ThemeProvider>
  );
}
