import AsyncStorage from '@react-native-async-storage/async-storage';
type ConfirmationResult = any;
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { metaAnalytics } from '../../utils/metaAnalytics';

export default function OTPVerificationScreen() {
  const { phoneNumber, confirmationId } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputs = useRef<Array<TextInput | null>>([]);
  const { confirmCode, sendPhoneVerification } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      console.log('🔥 Verifying OTP:', code, 'for phone:', phoneNumber);
      
      await confirmCode(String(phoneNumber || ''), code);
      console.log('✅ OTP authentication successful');
      
      // Track successful registration in Meta
      metaAnalytics.logCompleteRegistration('phone');
      
      Alert.alert('Success', 'Phone number verified successfully! 🎉', [
        { 
          text: 'Continue', 
          onPress: () => {
            console.log('✅ User clicked Continue, navigating to home...');
            router.replace('/(tabs)');
          }
        }
      ]);
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new one.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !phoneNumber) return;

    setLoading(true);
    try {
      await sendPhoneVerification(phoneNumber as string);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verify Phone Number</Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a 6-digit code to{'\n'}
            <Text style={styles.phoneText}>{phoneNumber}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <Text style={styles.label}>Enter the 6-digit OTP sent to your phone</Text>
          <View style={styles.otpInputContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) {
                    otpInputs.current[index] = ref;
                  }
                }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : {},
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>
        </View>

        {/* Timer and Resend */}
        <View style={styles.resendContainer}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend OTP in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton, 
              loading && styles.disabledButton,
              { 
                marginBottom: Math.max(insets.bottom, 20) + 32,
                minHeight: 48,
                zIndex: 10
              }
            ]}
            onPress={() => handleVerifyOTP()}
            disabled={loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Change Phone Number</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#162328',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfbfbf',
    textAlign: 'center',
    lineHeight: 24,
  },
  phoneText: {
    color: '#3fc060',
    fontWeight: '600',
  },
  otpContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3fc060',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    backgroundColor: '#F7FAFC',
  },
  otpInputFilled: {
    borderColor: '#3fc060',
    backgroundColor: '#FFFFFF',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 14,
    color: '#718096',
  },
  resendText: {
    fontSize: 16,
    color: '#3fc060',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#3fc060',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3fc060',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: '#3fc060',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3fc060',
    fontWeight: '500',
  },
});
