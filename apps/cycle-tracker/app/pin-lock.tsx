import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Animated,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearPin, updateUserProfile, verifyPin } from '@/services/storage';

export default function PinLockScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shakeAnim] = useState(new Animated.Value(0));

    const handleNumberPress = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError(false);

            if (newPin.length === 4) {
                verifyPin(newPin).then(isCorrect => {
                    if (isCorrect) {
                        router.replace('/(tabs)');
                    } else {
                        setError(true);
                        Animated.sequence([
                            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                        ]).start(() => {
                            setTimeout(() => {
                                setPin('');
                                setError(false);
                            }, 300);
                        });
                    }
                });
            }
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            setPin(pin.slice(0, -1));
            setError(false);
        }
    };

    const handleBiometric = () => {
        Alert.alert(
            'Biometric Unlock',
            'Biometric authentication is not yet configured. Please enter your PIN.',
        );
    };

    const handleForgotPin = () => {
        Alert.alert(
            'Forgot PIN?',
            'This will remove your PIN lock and take you to the app. You can set a new PIN in Privacy & Security settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove PIN',
                    style: 'destructive',
                    onPress: async () => {
                        await clearPin();
                        await updateUserProfile({ pinEnabled: false });
                        router.replace('/(tabs)');
                    },
                },
            ]
        );
    };

    const renderPinDots = () => {
        return (
            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
                {[0, 1, 2, 3].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: pin.length > index
                                    ? (error ? colors.error : colors.primary)
                                    : colors.border,
                                borderColor: error ? colors.error : colors.primary,
                            },
                        ]}
                    />
                ))}
            </Animated.View>
        );
    };

    const renderNumberPad = () => {
        const numbers = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['biometric', '0', 'delete'],
        ];

        return (
            <View style={styles.numberPad}>
                {numbers.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numberRow}>
                        {row.map((item) => {
                            if (item === 'biometric') {
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.numberButton}
                                        onPress={handleBiometric}
                                    >
                                        <Ionicons name="finger-print" size={28} color={colors.primary} ></Ionicons>
                                    </TouchableOpacity>
                                );
                            }
                            if (item === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.numberButton}
                                        onPress={handleDelete}
                                    >
                                        <Ionicons name="backspace-outline" size={28} color={colors.text} ></Ionicons>
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.numberButton, { backgroundColor: colors.backgroundSecondary }]}
                                    onPress={() => handleNumberPress(item)}
                                >
                                    <Text style={[styles.numberText, { color: colors.text }]}>{item}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Logo/Icon */}
                <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                    <Ionicons name="flower-outline" size={40} color="#fff" ></Ionicons>
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Please enter your PIN to continue
                </Text>

                {/* PIN Dots */}
                {renderPinDots()}

                {error && (
                    <Text style={[styles.errorText, { color: colors.error }]}>
                        Incorrect PIN. Please try again.
                    </Text>
                )}
            </View>

            {/* Number Pad */}
            {renderNumberPad()}

            {/* Forgot PIN Link */}
            <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPin}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot PIN?</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.xxl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        ...Typography.h2,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.body,
        marginBottom: Spacing.xl,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.md,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
    },
    errorText: {
        ...Typography.bodySm,
        marginTop: Spacing.sm,
    },
    numberPad: {
        paddingHorizontal: Spacing.xxl,
        paddingBottom: Spacing.lg,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    numberButton: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberText: {
        fontSize: 28,
        fontWeight: '500',
    },
    forgotButton: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    forgotText: {
        ...Typography.bodyMedium,
    },
});
