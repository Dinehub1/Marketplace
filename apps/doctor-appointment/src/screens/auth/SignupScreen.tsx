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
import { Colors, Fonts, Spacing, SCREEN_NAMES, USER_TYPES } from '../../constants';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Header } from '../../components/common/Header';
import { useAuth } from '../../contexts/AuthContext';

interface SignupForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'patient' | 'doctor';
  phone: string;
}

export const SignupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { signup } = useAuth();
  
  const [form, setForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'patient',
    phone: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupForm>>({});

  const updateForm = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<SignupForm> = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signup(form);
    } catch (error) {
      Alert.alert('Signup Failed', 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Header
        title="Create Account"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.sectionTitle}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  form.userType === 'patient' && styles.userTypeButtonActive,
                ]}
                onPress={() => updateForm('userType', 'patient')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  form.userType === 'patient' && styles.userTypeButtonTextActive,
                ]}>
                  Patient
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  form.userType === 'doctor' && styles.userTypeButtonActive,
                ]}
                onPress={() => updateForm('userType', 'doctor')}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  form.userType === 'doctor' && styles.userTypeButtonTextActive,
                ]}>
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <Input
                label="First Name"
                placeholder="First name"
                value={form.firstName}
                onChangeText={(value) => updateForm('firstName', value)}
                containerStyle={styles.nameInput}
                error={errors.firstName}
              />
              <Input
                label="Last Name"
                placeholder="Last name"
                value={form.lastName}
                onChangeText={(value) => updateForm('lastName', value)}
                containerStyle={styles.nameInput}
                error={errors.lastName}
              />
            </View>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(value) => updateForm('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
            />

            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={form.phone}
              onChangeText={(value) => updateForm('phone', value)}
              keyboardType="phone-pad"
              leftIcon="call-outline"
              error={errors.phone}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={form.password}
              onChangeText={(value) => updateForm('password', value)}
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChangeText={(value) => updateForm('confirmPassword', value)}
              isPassword
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              style={styles.signupButton}
            />
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xl,
  },
  userTypeSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
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
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  userTypeButtonText: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  userTypeButtonTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.weight.semibold,
  },
  form: {
    marginBottom: Spacing['3xl'],
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameInput: {
    flex: 1,
  },
  signupButton: {
    marginTop: Spacing.md,
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
