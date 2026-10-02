import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { validateEnv } from '@/lib/env';

// Validate environment on app start
validateEnv();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, currentRole } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but still in auth screens
      if (currentRole) {
        // Redirect based on role
        switch (currentRole.role) {
          case 'guard':
            router.replace('/(guard)');
            break;
          case 'resident':
          case 'owner':
          case 'tenant':
            router.replace('/(resident)');
            break;
          case 'manager':
            router.replace('/(manager)');
            break;
          case 'admin':
            router.replace('/(admin)');
            break;
          default:
            router.replace('/(resident)');
        }
      }
    }
  }, [isAuthenticated, isLoading, currentRole, segments, router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(guard)" />
        <Stack.Screen name="(resident)" />
        <Stack.Screen name="(manager)" />
        <Stack.Screen name="(admin)" />

        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
