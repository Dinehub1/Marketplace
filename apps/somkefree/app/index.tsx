import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  
  useEffect(() => {
    // Check if onboarding has been completed
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('onboardingCompleted');
        setOnboardingCompleted(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to not completed if there's an error
        setOnboardingCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOnboarding();
  }, []);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }
  
  // Redirect based on onboarding status
  return onboardingCompleted ? 
    <Redirect href="/(tabs)/dashboard" /> : 
    <Redirect href="/onboarding" />;
}