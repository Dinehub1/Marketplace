import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SharingOption {
    id: string;
    title: string;
    description: string;
    icon: any;
    enabled: boolean;
}

interface Partner {
    id: string;
    name: string;
    email: string;
    syncingSince: string;
}

export default function PartnerSyncScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [sharingOptions, setSharingOptions] = useState<SharingOption[]>([
        {
            id: 'period',
            title: 'Period Status',
            description: 'Current day and cycle length',
            icon: 'water-outline',
            enabled: true,
        },
        {
            id: 'fertile',
            title: 'Fertile Window',
            description: 'Ovulation and fertility chances',
            icon: 'leaf-outline',
            enabled: true,
        },
        {
            id: 'mood',
            title: 'Moods & Symptoms',
            description: "How you're feeling daily",
            icon: 'happy-outline',
            enabled: false,
        },
    ]);

    const [partners] = useState<Partner[]>([
        {
            id: '1',
            name: 'Alex Johnson',
            email: 'alex.j@email.com',
            syncingSince: 'Jan 12, 2024',
        },
    ]);

    const toggleSharing = (id: string) => {
        setSharingOptions(prev =>
            prev.map(opt => opt.id === id ? { ...opt, enabled: !opt.enabled } : opt)
        );
    };

    const handleInvitePartner = () => {
        Alert.alert(
            'Invite Partner',
            'Send an invitation link to your partner to start sharing your cycle information.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send Invite', onPress: () => console.log('Send invite') },
            ]
        );
    };

    const handleRemovePartner = (partnerId: string) => {
        Alert.alert(
            'Remove Partner',
            'Are you sure you want to stop sharing with this partner? They will no longer have access to your data history.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => console.log('Remove partner') },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Partner Sync',
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
                {/* Hero Section */}
                <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
                    <Ionicons name="heart-circle" size={48} color="#fff" ></Ionicons>
                    <Text style={styles.heroTitle}>Share the Journey</Text>
                    <Text style={styles.heroDescription}>
                        Syncing your cycle info helps your partner understand your needs and offer the right support at the right time.
                    </Text>
                </View>

                {/* What to Share */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="share-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>What to Share</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        {sharingOptions.map((option, index) => (
                            <React.Fragment key={option.id}>
                                <View style={styles.sharingRow}>
                                    <View style={[styles.sharingIcon, { backgroundColor: colors.backgroundTertiary }]}>
                                        <Ionicons name={option.icon} size={20} color={colors.primary} ></Ionicons>
                                    </View>
                                    <View style={styles.sharingInfo}>
                                        <Text style={[styles.sharingTitle, { color: colors.text }]}>{option.title}</Text>
                                        <Text style={[styles.sharingDescription, { color: colors.textSecondary }]}>
                                            {option.description}
                                        </Text>
                                    </View>
                                    <Switch
                                        value={option.enabled}
                                        onValueChange={() => toggleSharing(option.id)}
                                        trackColor={{ false: colors.border, true: colors.primary + '60' }}
                                        thumbColor={option.enabled ? colors.primary : colors.textTertiary}
                                    />
                                </View>
                                {index < sharingOptions.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Privacy Info */}
                <View style={[styles.infoCard, { backgroundColor: colors.backgroundTertiary }]}>
                    <Ionicons name="lock-closed" size={20} color={colors.primary} ></Ionicons>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Your data is end-to-end encrypted. You can stop sharing at any time and your partner will no longer have access to your data history.
                    </Text>
                </View>

                {/* Connected Partners */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="people-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Partners</Text>
                    </View>

                    {partners.map((partner) => (
                        <View
                            key={partner.id}
                            style={[styles.partnerCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                        >
                            <View style={[styles.partnerAvatar, { backgroundColor: colors.primary }]}>
                                <Text style={styles.partnerInitials}>
                                    {partner.name.split(' ').map(n => n[0]).join('')}
                                </Text>
                            </View>
                            <View style={styles.partnerInfo}>
                                <Text style={[styles.partnerName, { color: colors.text }]}>{partner.name}</Text>
                                <Text style={[styles.partnerMeta, { color: colors.textSecondary }]}>
                                    Syncing since {partner.syncingSince}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemovePartner(partner.id)}
                            >
                                <Ionicons name="close-circle" size={24} color={colors.error} ></Ionicons>
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.inviteButton, { borderColor: colors.primary }]}
                        onPress={handleInvitePartner}
                    >
                        <Ionicons name="person-add-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.inviteText, { color: colors.primary }]}>Invite Partner</Text>
                    </TouchableOpacity>
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
    heroCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroTitle: {
        ...Typography.h2,
        color: '#fff',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    heroDescription: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
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
    sharingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    sharingIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    sharingInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    sharingTitle: {
        ...Typography.bodyMedium,
        marginBottom: Spacing.xs,
    },
    sharingDescription: {
        ...Typography.caption,
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.md,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    infoText: {
        ...Typography.bodySm,
        flex: 1,
        lineHeight: 20,
    },
    partnerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    partnerAvatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    partnerInitials: {
        ...Typography.bodyMedium,
        color: '#fff',
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        ...Typography.bodyMedium,
        marginBottom: Spacing.xs,
    },
    partnerMeta: {
        ...Typography.caption,
    },
    removeButton: {
        padding: Spacing.xs,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    inviteText: {
        ...Typography.bodyMedium,
    },
});
