import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Wait for auth context to finish loading
        if (loading) {
          console.log('🔄 Index: Auth context still loading...');
          return;
        }

        console.log('🔍 Index: Checking auth state and navigation...');
        
        // Check if user is authenticated
        if (user) {
          console.log('✅ Index: User is authenticated, navigating to home');
          router.replace('/(tabs)');
          return;
        }

        // Check if onboarding was completed
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        
        if (onboardingCompleted === 'true') {
          console.log('✅ Index: Onboarding completed, navigating to welcome');
          router.replace('/(auth)/welcome');
        } else {
          console.log('📱 Index: First time user, navigating to splash/onboarding');
          router.replace('/(auth)/splash');
        }
      } catch (error) {
        console.error('❌ Index: Error checking auth state:', error);
        // Fallback to splash screen
        router.replace('/(auth)/splash');
      }
    };

    checkAuthAndNavigate();
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});
