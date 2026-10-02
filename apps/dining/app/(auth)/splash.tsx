import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      // If user is authenticated, go to home instead of onboarding
      if (user && !loading) {
        console.log('✅ Splash: User is authenticated, navigating to home');
        router.replace('/(tabs)');
      } else {
        console.log('📱 Splash: No user, navigating to onboarding');
        router.replace('/(auth)/onboarding');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoEmoji}>🍽️</Text>
        </View>
        <Text style={styles.title}>DropBy</Text>
        <Text style={styles.subtitle}>Book Your Perfect Dining Experience</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Welcome to the future of dining</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35', // Modern orange gradient base
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  logoEmoji: {
    fontSize: 56,
    color: '#FF6B35',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '500',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
});
