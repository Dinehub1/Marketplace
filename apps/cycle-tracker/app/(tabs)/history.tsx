import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCycleData } from '@/hooks/use-storage';
import { CycleEntry, MoodType } from '@/types';

const moodEmojis: Record<MoodType, string> = {
    happy: '😊', calm: '😌', tired: '😴',
    anxious: '😰', irritated: '😤', sad: '😢',
};

const flowLabels: Record<string, { label: string; color: (c: any) => string }> = {
    none: { label: 'No Flow', color: (c) => c.textTertiary },
    light: { label: 'Light', color: (c) => c.fertile },
    medium: { label: 'Medium', color: (c) => c.ovulation },
    heavy: { label: 'Heavy', color: (c) => c.period },
};

const FILTERS = ['All', 'Symptoms', 'Flow', 'Mood', 'Notes'];

export default function HistoryScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { cycleData, loading, refresh } = useCycleData();
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    }, [refresh]);

    // Sort newest first + filter
    const filteredData = useMemo(() => {
        const sorted = [...cycleData.entries].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        return sorted.filter(entry => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Symptoms') return entry.symptoms && entry.symptoms.length > 0;
            if (activeFilter === 'Flow') return entry.flow && entry.flow !== 'none';
            if (activeFilter === 'Mood') return !!entry.mood;
            if (activeFilter === 'Notes') return !!entry.notes;
            return true;
        });
    }, [cycleData.entries, activeFilter]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            day: isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'long' }),
            isToday,
        };
    };

    const getFlowLevel = (flow: string | undefined): number => {
        if (!flow || flow === 'none') return 0;
        if (flow === 'light') return 1;
        if (flow === 'medium') return 2;
        if (flow === 'heavy') return 3;
        return 0;
    };

    const renderItem = ({ item, index }: { item: CycleEntry; index: number }) => {
        const { date, day, isToday } = formatDate(item.date);
        const flowLevel = getFlowLevel(item.flow);
        const flowInfo = flowLabels[item.flow ?? 'none'];

        return (
            <Animated.View
                entering={FadeInDown.delay(Math.min(index * 50, 300)).duration(400)}
                style={styles.timelineItem}
            >
                {/* Timeline Visuals */}
                <View style={styles.timelineLeft}>
                    <View style={[
                        styles.timelineDot,
                        {
                            backgroundColor: isToday ? colors.primary : colors.cardBackground,
                            borderColor: isToday ? colors.primary : colors.border,
                        }
                    ]} />
                    {index !== filteredData.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                    )}
                </View>

                {/* Entry Card */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.dateText, { color: colors.text }]}>{date}</Text>
                                {isToday && (
                                    <View style={[styles.todayBadge, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[styles.todayBadgeText, { color: colors.primary }]}>Today</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.dayText, { color: colors.textSecondary }]}>{day}</Text>
                        </View>
                        {item.mood && (
                            <Text style={styles.moodEmoji}>{moodEmojis[item.mood]}</Text>
                        )}
                    </View>

                    {/* Flow + Stats Row */}
                    <View style={styles.statsRow}>
                        {/* Flow Indicator */}
                        <View style={[styles.statChip, { backgroundColor: (flowInfo.color(colors)) + '15' }]}>
                            <View style={styles.flowDotsInline}>
                                {[1, 2, 3].map((dot) => (
                                    <View
                                        key={dot}
                                        style={[
                                            styles.flowDot,
                                            dot <= flowLevel
                                                ? { backgroundColor: flowInfo.color(colors) }
                                                : { backgroundColor: colors.border }
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.statChipText, { color: flowInfo.color(colors) }]}>
                                {flowInfo.label}
                            </Text>
                        </View>

                        {/* BBT */}
                        {item.bbt && (
                            <View style={[styles.statChip, { backgroundColor: colors.ovulation + '15' }]}>
                                <Ionicons name="thermometer-outline" size={12} color={colors.ovulation} ></Ionicons>
                                <Text style={[styles.statChipText, { color: colors.ovulation }]}>
                                    {item.bbt}°C
                                </Text>
                            </View>
                        )}

                        {/* Water */}
                        {item.waterIntake && item.waterIntake > 0 && (
                            <View style={[styles.statChip, { backgroundColor: colors.info + '15' }]}>
                                <Ionicons name="water-outline" size={12} color={colors.info} ></Ionicons>
                                <Text style={[styles.statChipText, { color: colors.info }]}>
                                    {item.waterIntake >= 1000 ? `${(item.waterIntake / 1000).toFixed(1)}L` : `${item.waterIntake}ml`}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Symptoms */}
                    <View style={styles.symptomContainer}>
                        {item.symptoms?.map((s, i) => (
                            <View key={i} style={[styles.symptomPill, { backgroundColor: colors.primary + '12' }]}>
                                <Text style={[styles.symptomText, { color: colors.primary }]}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </Text>
                            </View>
                        ))}
                        {(!item.symptoms || item.symptoms.length === 0) && (
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No symptoms logged</Text>
                        )}
                    </View>

                    {/* Notes Preview */}
                    {item.notes && (
                        <View style={[styles.notesPreview, { backgroundColor: colors.backgroundSecondary }]}>
                            <Ionicons name="chatbubble-outline" size={12} color={colors.textTertiary} ></Ionicons>
                            <Text style={[styles.notesText, { color: colors.textSecondary }]} numberOfLines={2}>
                                {item.notes}
                            </Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    const totalEntries = cycleData.entries.length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title, { color: colors.text }]}>History</Text>
                    {totalEntries > 0 && (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} logged
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.logButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/log-symptoms')}
                    accessibilityLabel="Log today's symptoms"
                >
                    <Ionicons name="add" size={20} color="#fff" ></Ionicons>
                    <Text style={styles.logButtonText}>Log</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Section */}
            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            onPress={() => setActiveFilter(filter)}
                            style={[
                                styles.filterPill,
                                {
                                    backgroundColor: activeFilter === filter ? colors.primary : colors.backgroundSecondary,
                                    borderColor: activeFilter === filter ? colors.primary : colors.border,
                                }
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: activeFilter === filter ? '#FFFFFF' : colors.textSecondary }
                                ]}
                            >
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    filteredData.length === 0 && styles.listContentEmpty,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="calendar-outline" size={48} color={colors.primary} ></Ionicons>
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {activeFilter === 'All' ? 'No entries yet' : `No ${activeFilter.toLowerCase()} logged`}
                        </Text>
                        <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                            {activeFilter === 'All'
                                ? 'Start tracking your cycle by logging your first entry. It takes less than a minute!'
                                : 'Try adjusting your filters or log a new entry.'}
                        </Text>
                        {activeFilter === 'All' && (
                            <TouchableOpacity
                                style={[styles.emptyCTA, { backgroundColor: colors.primary }]}
                                onPress={() => router.push('/log-symptoms')}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff" ></Ionicons>
                                <Text style={styles.emptyCTAText}>Log Your First Day</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        ...Typography.h2,
    },
    subtitle: {
        ...Typography.caption,
        marginTop: 2,
    },
    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    logButtonText: {
        color: '#fff',
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 14,
    },
    filterWrapper: { marginBottom: Spacing.sm },
    filterScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 8 },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        marginRight: 8,
        borderWidth: 1,
    },
    filterText: {
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 13,
    },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
    listContentEmpty: { flexGrow: 1 },
    timelineItem: { flexDirection: 'row', marginBottom: 16 },
    timelineLeft: { width: 28, alignItems: 'center', paddingTop: 16 },
    timelineDot: {
        width: 12, height: 12, borderRadius: 6, zIndex: 2, borderWidth: 2,
    },
    timelineLine: { position: 'absolute', top: 24, bottom: -32, width: 2 },
    card: {
        flex: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginLeft: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    dateText: {
        ...Typography.bodyMedium,
        fontFamily: 'Manrope_700Bold',
    },
    dayText: {
        ...Typography.caption,
        marginTop: 1,
    },
    todayBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    todayBadgeText: {
        fontSize: 10,
        fontFamily: 'Manrope_700Bold',
    },
    moodEmoji: { fontSize: 24 },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    statChipText: {
        fontSize: 11,
        fontFamily: 'Manrope_600SemiBold',
    },
    flowDotsInline: {
        flexDirection: 'row',
        gap: 3,
    },
    cardBody: {
        justifyContent: 'space-between',
        gap: 10,
    },
    symptomContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    symptomPill: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
    },
    symptomText: {
        fontSize: 11,
        fontFamily: 'Manrope_600SemiBold',
    },
    emptyText: {
        ...Typography.caption,
        fontStyle: 'italic',
    },
    flowContainer: {
        flexDirection: 'row',
        gap: 4,
        alignSelf: 'flex-start',
        padding: 4,
        borderRadius: BorderRadius.md,
    },
    flowDot: { width: 6, height: 6, borderRadius: 3 },
    notesPreview: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 6,
        padding: 10,
        borderRadius: BorderRadius.md,
    },
    notesText: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 17,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingBottom: 60,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        ...Typography.h3,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    emptyDescription: {
        ...Typography.body,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    emptyCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    emptyCTAText: {
        color: '#fff',
        fontFamily: 'Manrope_600SemiBold',
        fontSize: 16,
    },
});
