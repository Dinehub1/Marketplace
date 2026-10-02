import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { useUserProfile } from '@/hooks/use-storage';

interface ReminderSetting {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
}

const REMINDER_STORAGE_KEY = '@cycle_tracker/reminder_settings';

export default function NotificationsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { profile, updateProfile } = useUserProfile();

    const [cycleReminders, setCycleReminders] = useState<ReminderSetting[]>([
        {
            id: 'period',
            title: 'Period Reminder',
            description: 'Get notified before your period starts.',
            enabled: true,
        },
        {
            id: 'fertile',
            title: 'Fertile Window Alert',
            description: 'Stay informed about your most fertile days.',
            enabled: true,
        },
        {
            id: 'ovulation',
            title: 'Ovulation Day',
            description: 'A gentle nudge on your ovulation day.',
            enabled: false,
        },
    ]);

    const [healthReminders, setHealthReminders] = useState<ReminderSetting[]>([
        {
            id: 'daily',
            title: 'Daily Symptom Log',
            description: 'Remind me to log my symptoms and mood.',
            enabled: true,
        },
    ]);

    const [reminderTime, setReminderTime] = useState(profile.reminderTime || '9:00 AM');

    // Sync notificationsEnabled from profile
    useEffect(() => {
        setReminderTime(profile.reminderTime || '9:00 AM');
    }, [profile.reminderTime]);

    const toggleCycleReminder = (id: string) => {
        setCycleReminders(prev =>
            prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
        );
    };

    const toggleHealthReminder = (id: string) => {
        setHealthReminders(prev =>
            prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
        );
    };

    const cycleReminderTime = () => {
        const times = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '6:00 PM', '8:00 PM'];
        const currentIndex = times.indexOf(reminderTime);
        const nextIndex = (currentIndex + 1) % times.length;
        const newTime = times[nextIndex];
        setReminderTime(newTime);
        updateProfile({ reminderTime: newTime });
    };

    const ReminderItem = ({
        item,
        onToggle
    }: {
        item: ReminderSetting;
        onToggle: () => void;
    }) => (
        <View style={[styles.reminderItem, { borderColor: colors.cardBorder }]}>
            <View style={styles.reminderContent}>
                <Text style={[styles.reminderTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.reminderDescription, { color: colors.textSecondary }]}>
                    {item.description}
                </Text>
            </View>
            <Switch
                value={item.enabled}
                onValueChange={onToggle}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={item.enabled ? colors.primary : colors.textTertiary}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Notifications',
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
                {/* Cycle Reminders */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="sync-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cycle Reminders</Text>
                    </View>
                    <View style={[styles.reminderCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        {cycleReminders.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <ReminderItem item={item} onToggle={() => toggleCycleReminder(item.id)} />
                                {index < cycleReminders.length - 1 && (
                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Daily Health */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="heart-outline" size={20} color={colors.primary} ></Ionicons>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Health</Text>
                    </View>
                    <View style={[styles.reminderCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        {healthReminders.map((item) => (
                            <ReminderItem
                                key={item.id}
                                item={item}
                                onToggle={() => toggleHealthReminder(item.id)}
                            />
                        ))}

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity style={styles.timePickerRow} onPress={cycleReminderTime}>
                            <Text style={[styles.reminderTitle, { color: colors.text }]}>Reminder Time</Text>
                            <View style={styles.timeValue}>
                                <Text style={[styles.timeText, { color: colors.primary }]}>{reminderTime}</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} ></Ionicons>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Note */}
                <View style={[styles.infoCard, { backgroundColor: colors.backgroundTertiary }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} ></Ionicons>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Notifications help you stay on top of your health journey. Tap on Reminder Time to cycle through time options.
                    </Text>
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
    reminderCard: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    reminderContent: {
        flex: 1,
        marginRight: Spacing.md,
    },
    reminderTitle: {
        ...Typography.bodyMedium,
        marginBottom: Spacing.xs,
    },
    reminderDescription: {
        ...Typography.caption,
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.md,
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
    },
    timeValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    timeText: {
        ...Typography.bodyMedium,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    infoText: {
        ...Typography.bodySm,
        flex: 1,
    },
});
