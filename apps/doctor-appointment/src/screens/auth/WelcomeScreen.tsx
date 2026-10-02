import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing } from '../../constants';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { demoLogin } = useAuth();

  console.info('👋 WelcomeScreen rendered');

  const handleLoginPress = () => {
    console.info('🔑 Login button pressed');
    navigation.navigate('Login' as never);
  };

  const handleRegisterPress = () => {
    console.info('📝 Register button pressed');
    navigation.navigate('Register' as never);
  };

  const handleDebugPress = () => {
    console.info('🔍 Debug button pressed');
    navigation.navigate('Debug' as never);
  };

  const handleSkipLogin = async () => {
    try {
      console.info('🚀 Skip Login pressed - starting demo login');
      await demoLogin();
      console.info('✅ Skip Login successful - should navigate to Home');
    } catch (error) {
      console.error('❌ Skip Login failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🏥</Text>
          </View>
          <Text style={styles.title}>MEDICAL APP</Text>
          <Text style={styles.subtitle}>
            Your health, our priority. Book appointments with trusted doctors.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👨‍⚕️</Text>
            <Text style={styles.featureText}>Expert Doctors</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureText}>Easy Booking</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💊</Text>
            <Text style={styles.featureText}>Health Records</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            onPress={handleLoginPress}
            fullWidth
            style={styles.loginButton}
          />
          <Button
            title="Create Account"
            onPress={handleRegisterPress}
            variant="outline"
            fullWidth
            style={styles.registerButton}
          />
          <Button
            title="🚀 Skip Login (Demo)"
            onPress={handleSkipLogin}
            variant="text"
            fullWidth
            style={styles.skipButton}
          />
          <Button
            title="🔍 Debug Auth"
            onPress={handleDebugPress}
            variant="text"
            fullWidth
            style={styles.debugButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['5xl'],
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: Fonts.size['4xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.lg,
    paddingHorizontal: Spacing.lg,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing['4xl'],
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: Fonts.weight.medium,
  },
  buttonContainer: {
    paddingBottom: Spacing['3xl'],
  },
  loginButton: {
    marginBottom: Spacing.md,
  },
  registerButton: {
    marginBottom: Spacing.md,
  },
  skipButton: {
    marginBottom: Spacing.sm,
  },
  debugButton: {
    marginBottom: Spacing.xl,
  },
  footer: {
    paddingBottom: Spacing['3xl'],
  },
  footerText: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.xs,
  },
  link: {
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
});
