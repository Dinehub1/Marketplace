import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from '@/hooks/useThemeColor';

export default function OnboardingWelcome() {
  const router = useRouter();
  const buttonColor = useThemeColor({ light: '#3498db', dark: '#2980b9' }, 'tint');

  const handleGetStarted = async () => {
    // Navigate to the next onboarding screen
    router.push('/onboarding/habits');
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="auto" />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.contentContainer}>
        <ThemedText type="title" style={styles.title}>Welcome to Quit Now</ThemedText>
        <ThemedText style={styles.description}>
          Your journey to a smoke-free life starts here. This app will help you track your progress, 
          unlock achievements, and improve your health as you quit smoking.
        </ThemedText>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: buttonColor }]}
          onPress={handleGetStarted}
        >
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});