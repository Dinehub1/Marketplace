import { Branding } from '@/constants/branding';
import { useAuth } from '@/contexts/auth-context';
import { useAuthStore } from '@/stores/auth.store';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, InputAccessoryView, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [isLoading, setIsLoading] = useState(false);

    const { signInWithOTP, verifyOTP } = useAuth();
    const inputAccessoryViewID = 'uniqueID';

    const handleSendOTP = async () => {
        // Remove any spaces or dashes from phone
        const cleanPhone = phone.replace(/[\s-]/g, '');

        if (!cleanPhone || cleanPhone.length !== 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit phone number');
            return;
        }

        setIsLoading(true);

        // Format phone number with +91 prefix
        const formattedPhone = `+91${cleanPhone}`;

        const { error } = await signInWithOTP(formattedPhone);

        setIsLoading(false);

        if (error) {
            Alert.alert('Error', error.message || 'Failed to send OTP');
            return;
        }

        setStep('otp');
        Alert.alert('Success', 'OTP sent to your WhatsApp');
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);

        const cleanPhone = phone.replace(/[\s-]/g, '');
        const formattedPhone = `+91${cleanPhone}`;

        const { error } = await verifyOTP(formattedPhone, otp);

        setIsLoading(false);

        if (error) {
            Alert.alert('Error', error.message || 'Invalid OTP');
            return;
        }

        // Navigation will be handled by _layout after role is set
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <View style={styles.innerContent}>
                            {/* Logo Section */}
                            <View style={styles.logoContainer}>
                                <Image
                                    source={Branding.assets.icon}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                                <Text style={styles.logoText}>{Branding.appName}</Text>
                                <Text style={styles.tagline}>{Branding.tagline}</Text>
                            </View>

                            {/* Title */}
                            <Text style={styles.title}>
                                {step === 'phone' ? 'Welcome Back' : 'Verify OTP'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {step === 'phone'
                                    ? 'Enter your phone number to continue'
                                    : `Enter the 6-digit code sent to +91 ${phone}`}
                            </Text>

                            {step === 'phone' ? (
                                <>
                                    {/* Phone Input with +91 prefix */}
                                    <View style={styles.phoneInputContainer}>
                                        <View style={styles.prefixContainer}>
                                            <Text style={styles.flagEmoji}>🇮🇳</Text>
                                            <Text style={styles.prefixText}>+91</Text>
                                        </View>
                                        <TextInput
                                            style={styles.phoneInput}
                                            placeholder="Enter 10-digit number"
                                            placeholderTextColor="#5B6B85"
                                            value={phone}
                                            onChangeText={(text) => {
                                                const cleaned = text.replace(/[^0-9]/g, '');
                                                setPhone(cleaned);
                                                if (cleaned.length === 10) {
                                                    Keyboard.dismiss();
                                                }
                                            }}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            editable={!isLoading}
                                            returnKeyType="done"
                                            inputAccessoryViewID={inputAccessoryViewID}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.button, isLoading && styles.buttonDisabled]}
                                        onPress={handleSendOTP}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#0B1120" />
                                        ) : (
                                            <>
                                                <Ionicons name="send" size={20} color="#0B1120" style={{ marginRight: 8 }} />
                                                <Text style={styles.buttonText}>Send OTP via WhatsApp</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {/* OTP Input */}
                                    <TextInput
                                        style={styles.otpInput}
                                        placeholder="● ● ● ● ● ●"
                                        placeholderTextColor="#3D4A63"
                                        value={otp}
                                        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        editable={!isLoading}
                                        autoFocus
                                    />

                                    <TouchableOpacity
                                        style={[styles.button, isLoading && styles.buttonDisabled]}
                                        onPress={handleVerifyOTP}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#0B1120" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={20} color="#0B1120" style={{ marginRight: 8 }} />
                                                <Text style={styles.buttonText}>Verify & Continue</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.linkButton}
                                        onPress={() => {
                                            setStep('phone');
                                            setOtp('');
                                        }}
                                        disabled={isLoading}
                                    >
                                        <Ionicons name="arrow-back" size={16} color="#A3E635" />
                                        <Text style={styles.linkText}>Change Phone Number</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.resendButton}
                                        onPress={handleSendOTP}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.resendText}>Didn&apos;t receive OTP? Resend</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>

                {/* Developer Login Shortcuts - Only visible in development */}
                {__DEV__ && (
                    <View style={styles.devSection}>
                        <Text style={styles.devTitle}>Developer Access</Text>
                        <View style={styles.devButtons}>
                            <TouchableOpacity
                                style={[styles.devButton, { backgroundColor: '#10b981' }]}
                                onPress={() => useAuthStore.getState().devLogin('guard')}
                            >
                                <Text style={styles.devButtonText}>Guard</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.devButton, { backgroundColor: '#3b82f6' }]}
                                onPress={() => useAuthStore.getState().devLogin('resident')}
                            >
                                <Text style={styles.devButtonText}>Resident</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.devButton, { backgroundColor: '#8b5cf6' }]}
                                onPress={() => useAuthStore.getState().devLogin('manager')}
                            >
                                <Text style={styles.devButtonText}>Manager</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.devButton, { backgroundColor: '#f59e0b' }]}
                                onPress={() => useAuthStore.getState().devLogin('admin')}
                            >
                                <Text style={styles.devButtonText}>Admin</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.devNote}>Uses test credentials (email/password)</Text>
                    </View>
                )}
                {Platform.OS === 'ios' && (
                    <InputAccessoryView nativeID={inputAccessoryViewID}>
                        <View style={styles.accessory}>
                            <Button onPress={() => Keyboard.dismiss()} title="Done" />
                        </View>
                    </InputAccessoryView>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B1120',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    innerContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoImage: {
        width: 104,
        height: 104,
        borderRadius: 26,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(163, 230, 53, 0.35)',
        shadowColor: '#A3E635',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 12,
    },
    logoText: {
        fontSize: 30,
        fontWeight: '800',
        color: '#F1F5F9',
        letterSpacing: 6,
    },
    tagline: {
        fontSize: 13,
        color: '#8B97AD',
        marginTop: 6,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#F1F5F9',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#8B97AD',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#243150',
        borderRadius: 14,
        backgroundColor: '#121C33',
        marginBottom: 20,
        overflow: 'hidden',
    },
    prefixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#16213B',
        borderRightWidth: 1,
        borderRightColor: '#243150',
    },
    flagEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    prefixText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#CBD5E1',
    },
    phoneInput: {
        flex: 1,
        height: 56,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: '500',
        color: '#F1F5F9',
        letterSpacing: 1,
    },
    otpInput: {
        height: 64,
        borderWidth: 1.5,
        borderColor: '#243150',
        borderRadius: 14,
        paddingHorizontal: 20,
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: 12,
        textAlign: 'center',
        marginBottom: 20,
        backgroundColor: '#121C33',
        color: '#F1F5F9',
    },
    button: {
        height: 56,
        backgroundColor: '#A3E635',
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#A3E635',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#4D5A33',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#0B1120',
        fontSize: 16,
        fontWeight: '700',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    linkText: {
        color: '#A3E635',
        fontSize: 14,
        fontWeight: '500',
    },
    resendButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    resendText: {
        color: '#8B97AD',
        fontSize: 13,
    },
    devSection: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#1B2440',
        backgroundColor: '#0E1628',
    },
    devTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5B6B85',
        textTransform: 'uppercase',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 1,
    },
    devButtons: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 8,
    },
    devButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        minWidth: 75,
        alignItems: 'center',
    },
    devButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    devNote: {
        textAlign: 'center',
        fontSize: 10,
        color: '#5B6B85',
    },
    accessory: {
        width: '100%',
        height: 48,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#16213B',
        paddingHorizontal: 8,
    },
});
