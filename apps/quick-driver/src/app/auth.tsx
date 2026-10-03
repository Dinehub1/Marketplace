import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, Chip, DANGER, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Role, useApp } from '@/lib/app-context';
import { authApi, supabase } from '@/lib/supabase';

const DEMO_OTP = '1234';

export default function AuthScreen() {
  const { signIn } = useApp();
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(45);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setError('');

    try {
      const res = await authApi.sendOtp(phone);
      setStep('otp');
      startCountdown();

      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }

      if (res.sent_whatsapp) {
        Alert.alert('WhatsApp Sent', `A 6-digit OTP has been sent to +91 ${phone} via WhatsApp.`);
      } else if (res.dev_otp) {
        Alert.alert('Dev Mode', `Use OTP: ${res.dev_otp}`);
      }
    } catch (err: any) {
      console.warn('sendOtp error:', err);
      // Allow fallback to dev/demo mode even if network fails
      setError(err.message || 'Failed to send OTP. You can use demo code 1234.');
      setStep('otp');
      startCountdown();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;
    setLoading(true);
    setError('');

    try {
      // 1. Support demo OTP
      if (otp === DEMO_OTP) {
        signIn(phone, role);
        return;
      }

      // 2. Real WhatsApp OTP verification through Supabase Edge Function
      const result = await authApi.verifyOtp(phone, otp);

      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        const userId = result.session.user?.id;
        if (userId) {
          // Sync user profile & selected role in Supabase
          await supabase.from('qd_profiles').upsert(
            {
              id: userId,
              phone: `+91${phone}`,
              role: role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );

          if (role === 'driver') {
            await supabase.from('qd_drivers').upsert(
              {
                user_id: userId,
                name: `Driver ${phone.slice(-4)}`,
                phone: `+91${phone}`,
                is_online: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
          }
        }
      }

      signIn(phone, role);
    } catch (err: any) {
      console.warn('verifyOtp error:', err);
      setError(err.message || 'Incorrect or expired OTP, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/qd-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Safe Drive, EveryTime.{'\n'}Indore · Bhopal · Ujjain
            </ThemedText>
          </View>

          <Card style={styles.form}>
            {step === 'phone' ? (
              <>
                <View style={styles.roleRow}>
                  <Chip
                    label="🚘 Book a driver"
                    selected={role === 'customer'}
                    onPress={() => setRole('customer')}
                  />
                  <Chip
                    label="🧑‍✈️ Driver partner"
                    selected={role === 'driver'}
                    onPress={() => setRole('driver')}
                  />
                  <Chip
                    label="🛠 Admin"
                    selected={role === 'admin'}
                    onPress={() => setRole('admin')}
                  />
                </View>
                <ThemedText type="smallBold">Enter your mobile number</ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v.replace(/\D/g, ''));
                    setError('');
                  }}
                  onSubmitEditing={handleSendOtp}
                />
                {error ? (
                  <ThemedText type="small" style={{ color: DANGER }}>
                    {error}
                  </ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    We will send a 6-digit WhatsApp code to your number.
                  </ThemedText>
                )}
                <Button
                  title={loading ? 'Sending code...' : 'Send WhatsApp OTP'}
                  disabled={phone.length !== 10 || loading}
                  onPress={handleSendOtp}
                />
              </>
            ) : (
              <>
                <ThemedText type="smallBold">
                  Enter the code sent to +91 {phone}
                </ThemedText>
                <TextInput
                  style={[inputStyle, styles.otpInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(v) => {
                    setOtp(v.replace(/\D/g, ''));
                    setError('');
                  }}
                  onSubmitEditing={handleVerifyOtp}
                />
                {error ? (
                  <ThemedText type="small" style={{ color: DANGER }}>
                    {error}
                  </ThemedText>
                ) : devOtp ? (
                  <ThemedText type="small" style={{ color: SUCCESS }}>
                    WhatsApp OTP: {devOtp} (Demo fallback: {DEMO_OTP})
                  </ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Check your WhatsApp for the verification code.
                  </ThemedText>
                )}

                <Button
                  title={
                    loading
                      ? 'Verifying...'
                      : role === 'driver'
                      ? 'Verify & go online'
                      : 'Verify & continue'
                  }
                  disabled={otp.length < 4 || loading}
                  onPress={handleVerifyOtp}
                />

                <View style={styles.footerRow}>
                  {countdown > 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Resend in {countdown}s
                    </ThemedText>
                  ) : (
                    <Button
                      title="Resend Code"
                      variant="ghost"
                      small
                      disabled={loading}
                      onPress={handleSendOtp}
                    />
                  )}
                  <Button
                    title="Change number"
                    variant="ghost"
                    small
                    onPress={() => {
                      setStep('phone');
                      setOtp('');
                      setError('');
                    }}
                  />
                </View>
              </>
            )}
          </Card>

          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            By continuing you agree to our Terms & Privacy Policy.
          </ThemedText>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoWrap: {
    backgroundColor: '#fff',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    shadowColor: BRAND,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logo: {
    width: 240,
    height: 125,
  },
  center: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  input: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 24,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
