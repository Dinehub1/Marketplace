import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOnboarding, useUserProfile } from '@/hooks/use-storage';
import { clearPin, setPin } from '@/services/storage';

export default function PrivacyScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { profile, updateProfile } = useUserProfile();
    const { clearData } = useOnboarding();

    const [pinEnabled, setPinEnabled] = useState(profile.pinEnabled);
    const [biometricEnabled, setBiometricEnabled] = useState(profile.biometricEnabled);
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [newPin, setNewPin] = useState('');

    // Sync from profile when it loads
    useEffect(() => {
        setPinEnabled(profile.pinEnabled);
        setBiometricEnabled(profile.biometricEnabled);
    }, [profile.pinEnabled, profile.biometricEnabled]);

    const handlePinToggle = async (enabled: boolean) => {
        if (enabled) {
            setShowPinSetup(true);
        } else {
            Alert.alert(
                'Disable PIN Lock',
                'Are you sure you want to remove your PIN lock? Your data will no longer be protected on app launch.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove PIN',
                        style: 'destructive',
                        onPress: async () => {
                            await clearPin();
                            await updateProfile({ pinEnabled: false });
                            setPinEnabled(false);
                            setShowPinSetup(false);
                        },
                    },
                ]
            );
        }
    };

    const handleSavePin = async () => {
        if (newPin.length !== 4) {
            Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
            return;
        }
        try {
            const success = await setPin(newPin);
            if (success) {
                await updateProfile({ pinEnabled: true });
                setPinEnabled(true);
                setShowPinSetup(false);
                setNewPin('');
                Alert.alert('PIN Set', 'Your PIN has been saved successfully.');
            } else {
                Alert.alert('Error', 'Failed to save PIN. Please try again.');
            }
        } catch (e) {
            Alert.alert('Error', 'An unexpected error occurred while saving the PIN.');
        }
    };

    const handleBiometricToggle = async (enabled: boolean) => {
        await updateProfile({ biometricEnabled: enabled });
        setBiometricEnabled(enabled);
    };

    const handleChangePin = () => {
        setShowPinSetup(true);
        setNewPin('');
    };

    const handleExportData = () => {
        Alert.alert(
            'Export Data',
            'Your cycle data will be exported as a JSON file you can share.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Export JSON',
                    onPress: async () => {
                        // TODO: implement Share sheet with JSON data
                        Alert.alert('Coming Soon', 'Data export will be available in a future update.');
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete All Data',
            'Are you sure? This will permanently remove all your cycle data, settings, and profile. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await clearData();
                        if (success) {
                            router.replace('/onboarding');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Privacy & Security',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.primary,
                    headerBackTitle: 'Back',
                }}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Access Security */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Access Security</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>PIN Lock</Text>
                                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                    Secure access to your health data
                                </Text>
                            </View>
                            <Switch
                                value={pinEnabled}
                                onValueChange={handlePinToggle}
                                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                thumbColor={pinEnabled ? colors.primary : colors.textTertiary}
                            />
                        </View>

                        {showPinSetup && (
                            <>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <View style={styles.pinSetupRow}>
                                    <TextInput
                                        style={[styles.pinInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                                        placeholder="Enter 4-digit PIN"
                                        placeholderTextColor={colors.textTertiary}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        secureTextEntry
                                        value={newPin}
                                        onChangeText={setNewPin}
                                    />
                                    <TouchableOpacity
                                        style={[styles.pinSaveButton, { backgroundColor: colors.primary }]}
                                        onPress={handleSavePin}
                                    >
                                        <Text style={styles.pinSaveText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {pinEnabled && !showPinSetup && (
                            <>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <TouchableOpacity style={styles.actionRow} onPress={handleChangePin}>
                                    <Text style={[styles.actionText, { color: colors.primary }]}>Change PIN</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.primary} ></Ionicons>
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <Text style={[styles.settingTitle, { color: colors.text }]}>Biometric Unlock</Text>
                                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                    Use Face ID or Touch ID
                                </Text>
                            </View>
                            <Switch
                                value={biometricEnabled}
                                onValueChange={handleBiometricToggle}
                                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                thumbColor={biometricEnabled ? colors.primary : colors.textTertiary}
                            />
                        </View>
                    </View>
                </View>

                {/* Data Management */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="folder-open-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Management</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.exportButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                        onPress={handleExportData}
                    >
                        <View style={[styles.exportIcon, { backgroundColor: colors.backgroundTertiary }]}>
                            <Ionicons name="download-outline" size={24} color={colors.primary} ></Ionicons>
                        </View>
                        <View style={styles.exportContent}>
                            <Text style={[styles.exportTitle, { color: colors.text }]}>Export All Data</Text>
                            <Text style={[styles.exportDescription, { color: colors.textSecondary }]}>
                                Download your history as JSON
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} ></Ionicons>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="warning-outline" size={20} color={colors.error} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.dangerButton, { borderColor: colors.error }]}
                        onPress={handleDeleteAccount}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.error} ></Ionicons>
                        <View style={styles.dangerContent}>
                            <Text style={[styles.dangerTitle, { color: colors.error }]}>Delete Account & Data</Text>
                            <Text style={[styles.dangerDescription, { color: colors.textSecondary }]}>
                                This action cannot be undone
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Privacy Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.backgroundTertiary }]}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} ></Ionicons>
                    <View style={styles.infoContent}>
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            Your health data is encrypted and stored locally on your device. We never collect or sell your personal information.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
        paddingTop: Spacing.md,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.h4,
    },
    card: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    settingInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    settingTitle: {
        ...Typography.bodyMedium,
        marginBottom: Spacing.xs,
    },
    settingDescription: {
        ...Typography.caption,
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
    },
    actionText: {
        ...Typography.bodyMedium,
    },
    pinSetupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    pinInput: {
        flex: 1,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        padding: Spacing.md,
        ...Typography.body,
        textAlign: 'center',
        letterSpacing: 8,
        fontSize: 24,
    },
    pinSaveButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    pinSaveText: {
        ...Typography.bodyMedium,
        color: '#fff',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    exportIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    exportContent: {
        flex: 1,
    },
    exportTitle: {
        ...Typography.bodyMedium,
        marginBottom: Spacing.xs,
    },
    exportDescription: {
        ...Typography.caption,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.md,
    },
    dangerContent: {
        flex: 1,
    },
    dangerTitle: {
        ...Typography.bodyMedium,
        marginBottom: Spacing.xs,
    },
    dangerDescription: {
        ...Typography.caption,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    infoContent: {
        flex: 1,
    },
    infoText: {
        ...Typography.bodySm,
        marginBottom: Spacing.sm,
    },
});
