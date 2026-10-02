import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing } from '../../constants';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FadeInView } from '../../components/common/FadeInView';
import { useAuth } from '../../contexts/AuthContext';
import { useValidation, ValidationRules } from '../../hooks/useValidation';
import { errorService } from '../../services/errorService';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);

  const {
    errors,
    validate,
    validateSingle,
    getFieldError,
  } = useValidation({
    firstName: ValidationRules.name,
    lastName: ValidationRules.name,
    email: ValidationRules.email,
    password: ValidationRules.password,
    confirmPassword: {
      required: true,
      custom: (value: string) => {
        if (value !== password) {
          return 'Passwords do not match';
        }
        return null;
      },
    },
  });

  const handleRegister = async () => {
    if (!validate({ firstName, lastName, email, password, confirmPassword })) return;

    try {
      setLoading(true);
      await register({
        email,
        password,
        firstName,
        lastName,
        userType,
      });
      // Navigation will be handled automatically by AuthContext
    } catch (error: any) {
      const appError = errorService.handleError(error, {
        screen: 'RegisterScreen',
        action: 'register',
      });
      errorService.showErrorAlert(appError);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login' as never);
  };

  const handleFieldChange = (field: string, value: string, setter: (value: string) => void) => {
    setter(value);
    if (errors[field]) {
      validateSingle(field, value);
    }
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to access quality healthcare</Text>
          </View>
        </FadeInView>

        {/* Form */}
        <FadeInView delay={200} animationType="slideUp">
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <Input
                label="First Name"
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={(value) => handleFieldChange('firstName', value, setFirstName)}
                leftIcon="person-outline"
                error={getFieldError('firstName')}
                containerStyle={styles.halfInput}
              />
              <Input
                label="Last Name"
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={(value) => handleFieldChange('lastName', value, setLastName)}
                leftIcon="person-outline"
                error={getFieldError('lastName')}
                containerStyle={styles.halfInput}
              />
            </View>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => handleFieldChange('email', value, setEmail)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={getFieldError('email')}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(value) => handleFieldChange('password', value, setPassword)}
              isPassword
              leftIcon="lock-closed-outline"
              error={getFieldError('password')}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(value) => handleFieldChange('confirmPassword', value, setConfirmPassword)}
              isPassword
              leftIcon="lock-closed-outline"
              error={getFieldError('confirmPassword')}
            />

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.userTypeLabel}>I am a:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'patient' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('patient')}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'patient' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Patient
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'doctor' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('doctor')}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'doctor' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Doctor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>
        </FadeInView>

        {/* Login Link */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLoginPress}>
            <Text style={styles.loginLink}>Sign In</Text>
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
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['3xl'],
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 24,
  },
  title: {
    fontSize: Fonts.size['3xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  form: {
    marginBottom: Spacing['2xl'],
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  userTypeContainer: {
    marginBottom: Spacing.lg,
  },
  userTypeLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  userTypeButtonText: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textSecondary,
  },
  userTypeButtonTextActive: {
    color: Colors.white,
  },
  registerButton: {
    marginTop: Spacing.lg,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing['3xl'],
  },
  loginText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: Fonts.size.base,
    color: Colors.primary,
    fontWeight: Fonts.weight.semibold,
  },
});
