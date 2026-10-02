import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, H1, Input, Muted, P } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

export default function WelcomeScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const { sendPhoneVerification } = useAuth();
  const insets = useSafeAreaInsets();
  const otpInputs = React.useRef<any[]>([]);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length > 0 && !cleaned.startsWith('91')) {
      return '+91' + cleaned;
    } else if (cleaned.length > 0) {
      return '+' + cleaned;
    }
    return text;
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const fullPhoneNumber = `+91${phoneNumber}`;
    
    setLoading(true);
    try {
      console.log('🔥 Sending OTP to:', fullPhoneNumber);
      const confirmationResult: any = await sendPhoneVerification(fullPhoneNumber);
      console.log('✅ OTP sent successfully, confirmation:', confirmationResult.verificationId);
      
      // Keep confirmation in memory (DO NOT store in AsyncStorage!)
      setConfirmation(confirmationResult);
      setOtpSent(true);
      
      Alert.alert('Success', 'OTP sent to your phone number!');
    } catch (error: any) {
      console.error('❌ Phone auth error:', error);
      Alert.alert('Authentication Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    if (!confirmation) {
      Alert.alert('Error', 'Please request OTP first');
      return;
    }

    setVerifying(true);
    try {
      console.log('🔥 Verifying OTP:', code);
      
      // Use the confirmation object directly (no AsyncStorage!)
      await confirmation.confirm(code);
      console.log('✅ Firebase authentication successful');
      
      Alert.alert('Success', 'Phone number verified successfully! 🎉', [
        { 
          text: 'Continue', 
          onPress: () => {
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
        setOtpSent(false);
        setOtp(['', '', '', '', '', '']);
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
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
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <H1 style={styles.title}>Welcome to DropBy</H1>
            <P style={styles.subtitle}>
              Enter your phone number to get started
            </P>
          </View>

          {!otpSent ? (
            <>
              {/* Phone Input Section */}
              <Card padding="lg" style={styles.inputCard}>
                <Input
                  label="Phone Number"
                  placeholder="1234567890"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  leftIcon={<Text style={styles.countryCode}>🇮🇳 +91</Text>}
                  size="lg"
                />
                <Muted style={styles.helperText}>
                  We'll send you a verification code via SMS
                </Muted>
              </Card>

              {/* Send OTP Button */}
              <Button
                size="lg"
                onPress={handleSendOTP}
                disabled={loading}
                fullWidth
                style={[
                  styles.continueButton,
                  { 
                    marginBottom: Math.max(insets.bottom, 20) + 32,
                    minHeight: 48,
                    zIndex: 10
                  }
                ]}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              {/* OTP Input Section */}
              <Card padding="lg" style={styles.inputCard}>
                <Text style={styles.otpLabel}>Enter OTP</Text>
                <Text style={styles.otpSubtitle}>
                  Sent to +91{phoneNumber}
                </Text>
                <View style={styles.otpContainer}>
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
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>
              </Card>

              {/* Verify Button */}
              <Button
                size="lg"
                onPress={() => handleVerifyOTP()}
                disabled={verifying}
                fullWidth
                style={[
                  styles.continueButton,
                  { 
                    marginBottom: 16,
                    minHeight: 48,
                    zIndex: 10
                  }
                ]}
              >
                {verifying ? 'Verifying...' : 'Verify OTP'}
              </Button>

              {/* Resend Button */}
              <Button
                size="lg"
                variant="outline"
                onPress={handleResendOTP}
                disabled={loading}
                fullWidth
                style={[
                  styles.resendButton,
                  { 
                    marginBottom: Math.max(insets.bottom, 20) + 32,
                    minHeight: 48,
                  }
                ]}
              >
                {loading ? 'Resending...' : 'Resend OTP'}
              </Button>
            </>
          )}

          {/* Terms and Privacy */}
          <View style={styles.termsContainer}>
            <Muted style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Muted>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24, // px-6
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 80, // mt-20
    marginBottom: 64, // mb-16
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12, // mb-3
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20, // px-5
  },
  inputCard: {
    marginBottom: 32, // mb-8
  },
  countryCode: {
    fontSize: 16,
    color: '#18181b', // slate-900
    fontWeight: '500',
  },
  helperText: {
    marginTop: 12, // mt-3
    textAlign: 'center',
  },
  continueButton: {
    marginBottom: 32, // mb-8
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20, // px-5
    marginBottom: 40, // mb-10
  },
  termsText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#18181b', // slate-900
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  otpLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181b',
    marginBottom: 8,
    textAlign: 'center',
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
    color: '#18181b',
    backgroundColor: '#f8fafc',
  },
  otpInputFilled: {
    borderColor: '#22c55e',
    backgroundColor: '#ffffff',
  },
  resendButton: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
});
