import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCycleData, useDayEntry } from '@/hooks/use-storage';
import { CycleEntry, FlowLevel, MoodType, SymptomType } from '@/types';

const flowOptions: { id: FlowLevel; label: string; icon: string; color: (c: any) => string }[] = [
    { id: 'none', label: 'None', icon: 'remove-circle-outline', color: (c) => c.textTertiary },
    { id: 'light', label: 'Light', icon: 'water-outline', color: (c) => c.fertile },
    { id: 'medium', label: 'Medium', icon: 'water', color: (c) => c.ovulation },
    { id: 'heavy', label: 'Heavy', icon: 'water', color: (c) => c.period },
];

const moodOptions: { id: MoodType; label: string; emoji: string }[] = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'calm', label: 'Calm', emoji: '😌' },
    { id: 'tired', label: 'Tired', emoji: '😴' },
    { id: 'anxious', label: 'Anxious', emoji: '😰' },
    { id: 'irritated', label: 'Irritated', emoji: '😤' },
    { id: 'sad', label: 'Sad', emoji: '😢' },
];

const symptomOptions: { id: SymptomType; label: string; icon: string }[] = [
    { id: 'cramps', label: 'Cramps', icon: 'flash-outline' },
    { id: 'headache', label: 'Headache', icon: 'medical-outline' },
    { id: 'bloating', label: 'Bloating', icon: 'water-outline' },
    { id: 'fatigue', label: 'Fatigue', icon: 'battery-half-outline' },
    { id: 'acne', label: 'Acne', icon: 'ellipse-outline' },
    { id: 'insomnia', label: 'Insomnia', icon: 'moon-outline' },
    { id: 'backpain', label: 'Back Pain', icon: 'body-outline' },
    { id: 'nausea', label: 'Nausea', icon: 'pulse-outline' },
];

const WATER_PRESETS = [250, 500, 750, 1000];

const SLEEP_OPTIONS: { id: string; label: string; emoji: string }[] = [
    { id: 'great', label: 'Great', emoji: '💤' },
    { id: 'good', label: 'Good', emoji: '😴' },
    { id: 'fair', label: 'Fair', emoji: '😐' },
    { id: 'poor', label: 'Poor', emoji: '😫' },
];

function getDateISO(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayISO(): string {
    return getDateISO(new Date());
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getFormattedToday(): string {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

export default function LogSymptomsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateISO = getDateISO(selectedDate);
    const isToday = dateISO === getTodayISO();
    const { addEntry } = useCycleData();
    const { entry: existingEntry, loading } = useDayEntry(dateISO);

    const [selectedFlow, setSelectedFlow] = useState<FlowLevel | null>(null);
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [symptoms, setSymptoms] = useState<SymptomType[]>([]);
    const [notes, setNotes] = useState('');
    const [bbt, setBbt] = useState('');
    const [bbtError, setBbtError] = useState('');
    const [waterIntake, setWaterIntake] = useState(0);
    const [sleepQuality, setSleepQuality] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (existingEntry) {
            setSelectedFlow(existingEntry.flow ?? null);
            setSelectedMood(existingEntry.mood ?? null);
            setSymptoms(existingEntry.symptoms ?? []);
            setNotes(existingEntry.notes ?? '');
            setBbt(existingEntry.bbt?.toString() ?? '');
            setWaterIntake(existingEntry.waterIntake ?? 0);
        }
    }, [existingEntry]);

    const toggleSymptom = useCallback((id: SymptomType) => {
        Haptics.selectionAsync();
        setSymptoms(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    }, []);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        const bbtValue = parseFloat(bbt);
        let bbtValid: number | undefined = undefined;
        if (!isNaN(bbtValue) && bbtValue > 0) {
            if (bbtValue < 35 || bbtValue > 42) {
                setBbtError('BBT must be between 35°C and 42°C.');
                setSaving(false);
                return;
            }
            bbtValid = bbtValue;
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const entry: CycleEntry = {
            id: existingEntry?.id ?? generateId(),
            date: dateISO,
            flow: selectedFlow ?? undefined,
            mood: selectedMood ?? undefined,
            symptoms: symptoms.length > 0 ? symptoms : undefined,
            notes: notes.trim() || undefined,
            bbt: bbtValid,
            waterIntake: waterIntake > 0 ? waterIntake : undefined,
            createdAt: existingEntry?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const success = await addEntry(entry);
        setSaving(false);

        if (success) {
            Alert.alert('Saved! ✅', 'Your entry has been saved.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Error', 'Failed to save entry. Please try again.');
        }
    };

    // Count how many sections have been filled
    const filledSections = [
        selectedFlow && selectedFlow !== 'none',
        selectedMood,
        symptoms.length > 0,
        bbt.length > 0,
        waterIntake > 0,
        notes.trim().length > 0,
        sleepQuality,
    ].filter(Boolean).length;

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Date Banner with Navigation */}
                <View style={[styles.dateBanner, { backgroundColor: colors.primary + '10' }]}>
                    <TouchableOpacity
                        style={[styles.dateNavBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => {
                            const prev = new Date(selectedDate);
                            prev.setDate(prev.getDate() - 1);
                            const maxPast = new Date();
                            maxPast.setDate(maxPast.getDate() - 90);
                            if (prev >= maxPast) setSelectedDate(prev);
                        }}
                    >
                        <Ionicons name="chevron-back" size={18} color={colors.primary} ></Ionicons>
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.dateBannerTitle, { color: colors.text }]}>
                            {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long', month: 'long', day: 'numeric',
                            })}
                        </Text>
                        <Text style={[styles.dateBannerSub, { color: colors.textSecondary }]}>
                            {existingEntry ? 'Editing existing entry' : 'New entry'}
                            {isToday ? ' · Today' : ''}
                            {filledSections > 0 && ` · ${filledSections} section${filledSections > 1 ? 's' : ''} filled`}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.dateNavBtn, {
                            backgroundColor: isToday ? colors.backgroundSecondary : colors.primary + '15',
                            opacity: isToday ? 0.4 : 1,
                        }]}
                        disabled={isToday}
                        onPress={() => {
                            const next = new Date(selectedDate);
                            next.setDate(next.getDate() + 1);
                            if (next <= new Date()) setSelectedDate(next);
                        }}
                    >
                        <Ionicons name="chevron-forward" size={18} color={isToday ? colors.textTertiary : colors.primary} ></Ionicons>
                    </TouchableOpacity>
                </View>

                {/* Flow Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.period + '20' }]}>
                            <Ionicons name="water" size={20} color={colors.period} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Flow</Text>
                    </View>
                    <View style={styles.flowOptions}>
                        {flowOptions.map((flow) => {
                            const isSelected = selectedFlow === flow.id;
                            const flowColor = flow.color(colors);
                            return (
                                <TouchableOpacity
                                    key={flow.id}
                                    style={[
                                        styles.flowOption,
                                        {
                                            backgroundColor: isSelected ? flowColor + '20' : colors.backgroundSecondary,
                                            borderColor: isSelected ? flowColor : colors.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedFlow(flow.id);
                                    }}
                                    accessibilityLabel={`Flow: ${flow.label}`}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <Ionicons
                                        name={flow.icon as any}
                                        size={20}
                                        color={isSelected ? flowColor : colors.textTertiary}
                                    />
                                    <Text style={[
                                        styles.flowText,
                                        { color: isSelected ? flowColor : colors.textSecondary }
                                    ]}>
                                        {flow.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Mood Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.ovulation + '20' }]}>
                            <Ionicons name="happy" size={20} color={colors.ovulation} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood</Text>
                    </View>
                    <View style={styles.moodGrid}>
                        {moodOptions.map((mood) => {
                            const isSelected = selectedMood === mood.id;
                            return (
                                <TouchableOpacity
                                    key={mood.id}
                                    style={[
                                        styles.moodOption,
                                        {
                                            backgroundColor: isSelected ? colors.primary + '15' : colors.backgroundSecondary,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedMood(mood.id);
                                    }}
                                    accessibilityLabel={`Mood: ${mood.label}`}
                                    accessibilityRole="radio"
                                >
                                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                    <Text style={[styles.moodLabel, { color: isSelected ? colors.primary : colors.text }]}>{mood.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Symptoms Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="medical" size={20} color={colors.info} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Symptoms</Text>
                        {symptoms.length > 0 && (
                            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.countBadgeText}>{symptoms.length}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.symptomsGrid}>
                        {symptomOptions.map((symptom) => {
                            const isSelected = symptoms.includes(symptom.id);
                            return (
                                <TouchableOpacity
                                    key={symptom.id}
                                    style={[
                                        styles.symptomOption,
                                        {
                                            backgroundColor: isSelected ? colors.primary + '15' : colors.backgroundSecondary,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                        }
                                    ]}
                                    onPress={() => toggleSymptom(symptom.id)}
                                    accessibilityLabel={`Symptom: ${symptom.label}`}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: isSelected }}
                                >
                                    <Ionicons
                                        name={symptom.icon as any}
                                        size={18}
                                        color={isSelected ? colors.primary : colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.symptomLabel,
                                        { color: isSelected ? colors.primary : colors.text }
                                    ]}>
                                        {symptom.label}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 2 }} ></Ionicons>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Sleep Quality Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.luteal + '20' }]}>
                            <Ionicons name="bed-outline" size={20} color={colors.luteal} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sleep Quality</Text>
                        <Text style={[styles.optionalLabel, { color: colors.textTertiary }]}> (optional)</Text>
                    </View>
                    <View style={styles.sleepGrid}>
                        {SLEEP_OPTIONS.map(opt => {
                            const isSelected = sleepQuality === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.sleepOption,
                                        {
                                            backgroundColor: isSelected ? colors.luteal + '15' : colors.backgroundSecondary,
                                            borderColor: isSelected ? colors.luteal : colors.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSleepQuality(prev => prev === opt.id ? null : opt.id);
                                    }}
                                >
                                    <Text style={styles.sleepEmoji}>{opt.emoji}</Text>
                                    <Text style={[styles.sleepLabel, { color: isSelected ? colors.luteal : colors.text }]}>{opt.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* BBT Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.ovulation + '20' }]}>
                            <Ionicons name="thermometer-outline" size={20} color={colors.ovulation} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Basal Body Temp</Text>
                        <Text style={[styles.optionalLabel, { color: colors.textTertiary }]}> (optional)</Text>
                    </View>
                    <TextInput
                        style={[
                            styles.bbtInput,
                            {
                                backgroundColor: colors.backgroundSecondary,
                                color: colors.text,
                                borderColor: bbtError ? colors.error : colors.border,
                            }
                        ]}
                        placeholder="e.g. 36.5"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="decimal-pad"
                        value={bbt}
                        onChangeText={(text) => { setBbt(text); setBbtError(''); }}
                        accessibilityLabel="Basal body temperature in Celsius"
                    />
                    <Text style={[styles.fieldHint, { color: bbtError ? colors.error : colors.textTertiary }]}>
                        {bbtError || 'Measure before getting out of bed · 35–42°C'}
                    </Text>
                </View>

                {/* Water Intake Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="water-outline" size={20} color={colors.info} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Water Intake</Text>
                    </View>
                    <Text style={[styles.waterAmount, { color: colors.primary }]}>
                        {waterIntake > 0 ? `${waterIntake} ml` : 'Not logged'}
                    </Text>
                    <View style={styles.waterPresets}>
                        {WATER_PRESETS.map(ml => (
                            <TouchableOpacity
                                key={ml}
                                style={[
                                    styles.waterPreset,
                                    {
                                        backgroundColor: waterIntake === ml ? colors.info : colors.backgroundSecondary,
                                        borderColor: waterIntake === ml ? colors.info : colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setWaterIntake(prev => prev === ml ? 0 : ml);
                                }}
                                accessibilityLabel={`Set water intake to ${ml} ml`}
                            >
                                <Text style={[
                                    styles.waterPresetText,
                                    { color: waterIntake === ml ? '#fff' : colors.textSecondary }
                                ]}>
                                    {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.waterCustomRow}>
                        <TouchableOpacity
                            style={[styles.waterBtn, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                            onPress={() => setWaterIntake(prev => Math.max(0, prev - 250))}
                            accessibilityLabel="Decrease water intake by 250ml"
                        >
                            <Ionicons name="remove" size={20} color={colors.text} ></Ionicons>
                        </TouchableOpacity>
                        <Text style={[styles.waterCustomLabel, { color: colors.textSecondary }]}>
                            Adjust by 250ml
                        </Text>
                        <TouchableOpacity
                            style={[styles.waterBtn, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
                            onPress={() => setWaterIntake(prev => Math.min(5000, prev + 250))}
                            accessibilityLabel="Increase water intake by 250ml"
                        >
                            <Ionicons name="add" size={20} color={colors.text} ></Ionicons>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Daily Notes Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIcon, { backgroundColor: colors.backgroundTertiary }]}>
                            <Ionicons name="create" size={20} color={colors.primary} ></Ionicons>
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Notes</Text>
                    </View>
                    <TextInput
                        style={[
                            styles.notesInput,
                            {
                                backgroundColor: colors.backgroundSecondary,
                                color: colors.text,
                                borderColor: colors.border,
                            }
                        ]}
                        placeholder="How are you feeling today? Any observations..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                        accessibilityLabel="Daily notes"
                    />
                    <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
                        {notes.length}/500
                    </Text>
                </View>
            </ScrollView>

            {/* Save Button */}
            <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                    accessibilityLabel="Save today's entry"
                    accessibilityRole="button"
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={24} color="#fff" ></Ionicons>
                            <Text style={styles.saveButtonText}>
                                {existingEntry ? 'Update Entry' : 'Save Entry'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100,
        paddingTop: Spacing.sm,
    },
    dateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
        gap: Spacing.md,
    },
    dateBannerIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateNavBtn: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateBannerTitle: {
        ...Typography.bodyMedium,
        fontFamily: 'Manrope_700Bold',
    },
    dateBannerSub: {
        ...Typography.caption,
        marginTop: 1,
    },
    section: { marginBottom: Spacing.xl },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    sectionTitle: { ...Typography.h4 },
    optionalLabel: { ...Typography.caption, marginLeft: 4 },
    countBadge: {
        marginLeft: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'Manrope_700Bold',
    },
    flowOptions: { flexDirection: 'row', gap: Spacing.sm },
    flowOption: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        gap: 6,
        minHeight: 52,
    },
    flowText: {
        fontSize: 12,
        fontFamily: 'Manrope_600SemiBold',
    },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    moodOption: {
        width: '31%',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: Spacing.xs,
        minHeight: 80,
    },
    moodEmoji: { fontSize: 28, marginBottom: Spacing.xs },
    moodLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold' },
    symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    symptomOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: 6,
        minHeight: 44,
    },
    symptomLabel: { fontSize: 13, fontFamily: 'Manrope_500Medium' },
    sleepGrid: { flexDirection: 'row', gap: Spacing.sm },
    sleepOption: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        gap: 4,
        minHeight: 64,
    },
    sleepEmoji: { fontSize: 24 },
    sleepLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold' },
    bbtInput: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        ...Typography.body,
        minHeight: 52,
    },
    fieldHint: { ...Typography.caption, marginTop: 6 },
    waterAmount: { ...Typography.h3, textAlign: 'center', marginBottom: Spacing.md },
    waterPresets: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    waterPreset: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        minHeight: 44,
        justifyContent: 'center',
    },
    waterPresetText: { ...Typography.bodyMedium, fontSize: 13 },
    waterCustomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    waterBtn: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waterCustomLabel: { ...Typography.caption },
    notesInput: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        minHeight: 100,
        ...Typography.body,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        minHeight: 56,
    },
    saveButtonText: {
        ...Typography.bodyMedium,
        color: '#fff',
        fontSize: 16,
    },
});
