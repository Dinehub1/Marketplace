import { authApi, supabase } from '@/lib/supabase';
import { colors, radii, spacing } from '@/lib/theme';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpRefs = useRef<TextInput[]>([]);

    const sendOtp = async () => {
        if (phone.length < 10) return Alert.alert('Enter a valid 10-digit number');
        setLoading(true);
        try {
            const result = await authApi.sendOtp(phone);
            setStep('otp');
            startCountdown();
            // If WhatsApp delivery failed, show the dev OTP for testing
            if (result.dev_otp) {
                Alert.alert('Dev Mode', `OTP: ${result.dev_otp}\n\n${result.warning}`);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        const code = otp.join('');
        if (code.length < 6) return Alert.alert('Enter the full 6-digit OTP');
        setLoading(true);
        try {
            const result = await authApi.verifyOtp(phone, code);
            // Set the Supabase client session so AuthGuard picks it up
            await supabase.auth.setSession({
                access_token: result.session.access_token,
                refresh_token: result.session.refresh_token,
            });
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const startCountdown = () => {
        setCountdown(45);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) otpRefs.current[index + 1]?.focus();
    };

    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={s.content}>
                {/* Logo */}
                <View style={s.logoWrap}>
                    <Text style={s.logoIcon}>🛣️</Text>
                    <Text style={s.logoText}>HighwayPass</Text>
                    <Text style={s.tagline}>Buy your Annual Toll Pass in 60 seconds</Text>
                </View>

                {step === 'phone' ? (
                    <View style={s.card}>
                        <Text style={s.label}>Mobile Number</Text>
                        <View style={s.phoneRow}>
                            <Text style={s.prefix}>+91</Text>
                            <TextInput
                                style={s.phoneInput}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Enter mobile number"
                                placeholderTextColor={colors.gray500}
                                keyboardType="phone-pad"
                                maxLength={10}
                            />
                        </View>
                        <TouchableOpacity style={s.btn} onPress={sendOtp} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={s.card}>
                        <Text style={s.label}>Enter OTP</Text>
                        <Text style={s.sublabel}>Sent to +91 {phone.slice(0, 2)}XXX XXX{phone.slice(-2)}</Text>
                        <View style={s.otpRow}>
                            {otp.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={(ref) => { if (ref) otpRefs.current[i] = ref; }}
                                    style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, i)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                />
                            ))}
                        </View>
                        {countdown > 0 ? (
                            <Text style={s.countdown}>Resend in 00:{countdown.toString().padStart(2, '0')}</Text>
                        ) : (
                            <TouchableOpacity onPress={sendOtp}>
                                <Text style={s.resendLink}>Resend Code</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={s.btn} onPress={verifyOtp} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify & Continue</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={s.footer}>By continuing, you agree to our Terms & Privacy Policy</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
    logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
    logoIcon: { fontSize: 64, marginBottom: spacing.sm },
    logoText: { fontSize: 32, fontWeight: '700', color: colors.white },
    tagline: { fontSize: 14, color: colors.gray400, marginTop: spacing.xs, textAlign: 'center' },
    card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.bgCardBorder },
    label: { fontSize: 16, fontWeight: '600', color: colors.white, marginBottom: spacing.sm },
    sublabel: { fontSize: 13, color: colors.gray400, marginBottom: spacing.lg },
    phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray800, borderRadius: radii.md, marginBottom: spacing.lg },
    prefix: { color: colors.gray300, paddingLeft: spacing.md, fontSize: 16, fontWeight: '500' },
    phoneInput: { flex: 1, color: colors.white, fontSize: 16, padding: spacing.md },
    otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
    otpBox: { width: 48, height: 56, backgroundColor: colors.gray800, borderRadius: radii.md, textAlign: 'center', fontSize: 20, color: colors.white, fontWeight: '700', borderWidth: 1.5, borderColor: colors.gray700 },
    otpBoxFilled: { borderColor: colors.green },
    countdown: { textAlign: 'center', color: colors.gray400, marginBottom: spacing.lg, fontSize: 13 },
    resendLink: { textAlign: 'center', color: colors.green, fontWeight: '600', marginBottom: spacing.lg, fontSize: 14 },
    btn: { backgroundColor: colors.green, borderRadius: radii.md, paddingVertical: 16, alignItems: 'center' },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
    footer: { textAlign: 'center', color: colors.gray500, fontSize: 12, marginTop: spacing.lg },
});
