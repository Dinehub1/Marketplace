import { Button, FormSection, TextInput } from '@/components';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'gated://reset-password',
            });

            if (error) throw error;

            setEmailSent(true);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <View style={styles.container}>
                <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="mail-outline" size={64} color="#10b981" />
                    </View>
                    <Text style={styles.successTitle}>Check Your Email</Text>
                    <Text style={styles.successMessage}>
                        We&apos;ve sent password reset instructions to{'\n'}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>
                    <Button
                        title="Back to Login"
                        variant="primary"
                        fullWidth
                        onPress={() => router.replace('/(auth)/login')}
                        style={styles.backButton}
                    />
                    <TouchableOpacity onPress={() => setEmailSent(false)}>
                        <Text style={styles.tryAgain}>Try a different email</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity
                    style={styles.backArrow}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-closed-outline" size={48} color="#3b82f6" />
                    </View>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        No worries! Enter your email and we&apos;ll send you reset instructions.
                    </Text>
                </View>

                <FormSection>
                    <TextInput
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Button
                        title={isLoading ? 'Sending...' : 'Send Reset Link'}
                        variant="primary"
                        fullWidth
                        disabled={isLoading}
                        onPress={handleResetPassword}
                        style={styles.submitButton}
                    />
                </FormSection>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => router.replace('/(auth)/login')}
                >
                    <Ionicons name="arrow-back" size={16} color="#3b82f6" />
                    <Text style={styles.loginLinkText}>Back to Login</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    backArrow: {
        position: 'absolute',
        top: 60,
        left: 24,
        padding: 8,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#dbeafe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    submitButton: {
        marginTop: 8,
    },
    loginLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    loginLinkText: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '500',
        marginLeft: 6,
    },
    // Success state styles
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    emailHighlight: {
        color: '#1e293b',
        fontWeight: '600',
    },
    backButton: {
        width: '100%',
        marginBottom: 16,
    },
    tryAgain: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
    },
});
