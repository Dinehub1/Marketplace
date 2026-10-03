import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing } from '../../constants';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Header } from '../../components/common/Header';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Implement actual password reset API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEmailSent(true);
      Alert.alert(
        'Reset Email Sent',
        'Please check your email for password reset instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Reset Password"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.innerContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔑</Text>
          </View>

          {/* Content */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.description}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              editable={!emailSent}
            />

            <Button
              title={emailSent ? 'Email Sent' : 'Send Reset Link'}
              onPress={handleResetPassword}
              loading={loading}
              disabled={emailSent}
              fullWidth
              style={styles.resetButton}
            />
          </View>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Remember your password?{' '}
            <Text
              style={styles.helpLink}
              onPress={() => navigation.goBack()}
            >
              Back to Sign In
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing['4xl'],
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing['3xl'],
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: Fonts.size['3xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
    marginBottom: Spacing['4xl'],
  },
  form: {
    marginBottom: Spacing['3xl'],
  },
  resetButton: {
    marginTop: Spacing.lg,
  },
  helpText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  helpLink: {
    color: Colors.primary,
    fontWeight: Fonts.weight.semibold,
  },
});
