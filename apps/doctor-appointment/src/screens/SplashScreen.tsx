import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { APP_NAME, Colors, Fonts, Spacing } from '../constants';

export const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🏥</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.tagline}>Your Health, Our Priority</Text>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Medical Care</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  logoContainer: {
    marginBottom: Spacing['4xl'],
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: Fonts.size['4xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing['5xl'],
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  footer: {
    paddingBottom: Spacing['3xl'],
  },
  footerText: {
    fontSize: Fonts.size.sm,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
