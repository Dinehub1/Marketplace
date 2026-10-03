import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing, SCREEN_NAMES } from '../../constants';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FadeInView } from '../../components/common/FadeInView';
import { useAuth } from '../../contexts/AuthContext';
import { useValidation, ValidationRules } from '../../hooks/useValidation';
import { errorService } from '../../services/errorService';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    errors,
    validate,
    validateSingle,
    clearFieldError,
    getFieldError,
  } = useValidation({
    email: ValidationRules.email,
    password: ValidationRules.password,
  });

  const handleLogin = async () => {
    console.log('🔑 Login button pressed with email:', email);
    
    if (!validate({ email, password })) {
      console.log('❌ Validation failed');
      return;
    }

    try {
      setLoading(true);
      console.log('🚀 Calling login function...');
      await login(email, password);
      console.log('✅ Login function completed successfully');
    } catch (error: any) {
      console.log('❌ Login failed with error:', error);
      const appError = errorService.handleError(error, {
        screen: 'LoginScreen',
        action: 'login',
      });
      errorService.showErrorAlert(appError);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      validateSingle('email', value);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      validateSingle('password', value);
    }
  };

  const handleSignupPress = () => {
    navigation.navigate('Register' as never);
  };

  const handleForgotPasswordPress = () => {
    navigation.navigate(SCREEN_NAMES.FORGOT_PASSWORD as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeInView delay={0} animationType="slideUp">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🏥</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>
        </FadeInView>

        {/* Form */}
        <FadeInView delay={200} animationType="slideUp">
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={getFieldError('email')}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordChange}
              isPassword
              leftIcon="lock-closed-outline"
              error={getFieldError('password')}
            />

            <TouchableOpacity
              onPress={handleForgotPasswordPress}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />
          </View>
        </FadeInView>

        {/* Social Login */}
        <View style={styles.socialSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>f</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupSection}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={handleSignupPress}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['4xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: Fonts.size['3xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
  },
  form: {
    marginBottom: Spacing['3xl'],
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotPasswordText: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  socialSection: {
    marginBottom: Spacing['3xl'],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray200,
  },
  dividerText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing['3xl'],
  },
  signupText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: Fonts.size.base,
    color: Colors.primary,
    fontWeight: Fonts.weight.semibold,
  },
});
