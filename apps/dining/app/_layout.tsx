import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../contexts/AuthContext';
import { LocationProvider } from '../contexts/LocationContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { metaAnalytics } from '../utils/metaAnalytics';
import { useImageCacheInit } from '../utils/image_cache_init';
import { logBuildEnvironment } from '../utils/platformDetection';
import { logFeatureStatus } from '../config/features';

function RootLayoutNav() {
  const { currentTheme } = useTheme();
  
  // Initialize image caching
  useImageCacheInit();
  
  return (
    <NavigationThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <LocationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/splash" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/otp-verification" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(main)/search" options={{ headerShown: false }} />
            <Stack.Screen name="restaurant/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(main)/account" options={{ headerShown: false }} />
            <Stack.Screen name="(main)/location-search" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
        </LocationProvider>
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize Meta Analytics & Log Build Environment
  useEffect(() => {
    metaAnalytics.initialize();
    
    // Log build environment and feature availability
    logBuildEnvironment();
    logFeatureStatus();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
