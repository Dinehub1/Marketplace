import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, Chip, DANGER } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Role, useApp } from '@/lib/app-context';

const DEMO_OTP = '1234';

export default function AuthScreen() {
  const { signIn } = useApp();
  const theme = useTheme();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');

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
                />
                <Button
                  title="Send OTP"
                  disabled={phone.length !== 10}
                  onPress={() => setStep('otp')}
                />
              </>
            ) : (
              <>
                <ThemedText type="smallBold">Enter the 4-digit OTP sent to {phone}</ThemedText>
                <TextInput
                  style={[inputStyle, styles.otpInput]}
                  placeholder="• • • •"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={(v) => {
                    setOtp(v.replace(/\D/g, ''));
                    setError('');
                  }}
                />
                {error ? (
                  <ThemedText type="small" style={{ color: DANGER }}>
                    {error}
                  </ThemedText>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    Demo build — use OTP {DEMO_OTP}
                  </ThemedText>
                )}
                <Button
                  title={role === 'driver' ? 'Verify & go online' : 'Verify & continue'}
                  disabled={otp.length !== 4}
                  onPress={() => {
                    if (otp === DEMO_OTP) signIn(phone, role);
                    else setError('Incorrect OTP, try again.');
                  }}
                />
                <Button title="Change number" variant="ghost" small onPress={() => setStep('phone')} />
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
});
