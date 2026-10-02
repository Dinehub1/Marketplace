import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAIPrediction } from '@/hooks/use-ai';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCycleData, useUserProfile } from '@/hooks/use-storage';
import { CyclePhase, MoodType } from '@/types';

const moodEmojis: Record<MoodType, string> = {
    happy: '😊', calm: '😌', tired: '😴',
    anxious: '😰', irritated: '😤', sad: '😢',
};

const phaseConfig: Record<CyclePhase, {
    label: string; icon: string; iconPack: 'ion' | 'mci';
    color: (c: any) => string; tip: string; exercise: string; nutrition: string;
}> = {
    period: {
        label: 'Period', icon: 'water', iconPack: 'ion',
        color: (c) => c.period,
        tip: 'Focus on rest and gentle movement during your period.',
        exercise: 'Yoga, walking, stretching',
        nutrition: 'Iron-rich foods, dark chocolate, warm teas',
    },
    follicular: {
        label: 'Follicular', icon: 'lightning-bolt', iconPack: 'mci',
        color: (c) => c.primary,
        tip: 'Energy is rising! Great time for high-intensity workouts.',
        exercise: 'HIIT, running, strength training',
        nutrition: 'Lean proteins, fermented foods, leafy greens',
    },
    ovulation: {
        label: 'Ovulation', icon: 'star-outline', iconPack: 'mci',
        color: (c) => c.ovulation,
        tip: 'Peak energy and fertility. Social energy is high.',
        exercise: 'Group sports, dance, cycling',
        nutrition: 'Antioxidant-rich fruits, raw veggies, fibre',
    },
    luteal: {
        label: 'Luteal', icon: 'moon-waning-crescent', iconPack: 'mci',
        color: (c) => c.luteal,
        tip: 'Progesterone rises. Prioritise sleep and self-care.',
        exercise: 'Pilates, swimming, light weights',
        nutrition: 'Complex carbs, magnesium-rich foods, B6 vitamins',
    },
};

const HealthInsightsScreen = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { cycleData, cycleStats, cycleStatus } = useCycleData();
    const { profile } = useUserProfile();
    const { prediction, loading: aiLoading, error: aiError, refresh: refreshAI } = useAIPrediction(cycleData, profile);

    const phase = cycleStatus?.phase ?? 'follicular';
    const currentPhase = phaseConfig[phase];
    const phaseColor = currentPhase.color(colors);
    const hasEnoughForAI = cycleData.entries.length >= 1 && !!cycleData.lastPeriodStart;

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    };

    // ─── Symptom frequency analysis ──────────────────────────────────
    const symptomAnalysis = useMemo(() => {
        const counts: Record<string, number> = {};
        cycleData.entries.forEach(entry => {
            entry.symptoms?.forEach(s => {
                counts[s] = (counts[s] ?? 0) + 1;
            });
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);
        const max = sorted.length > 0 ? sorted[0][1] : 0;
        return { items: sorted, max };
    }, [cycleData.entries]);

    // ─── Mood distribution ──────────────────────────────────────────
    const moodAnalysis = useMemo(() => {
        const counts: Record<string, number> = {};
        let total = 0;
        cycleData.entries.forEach(entry => {
            if (entry.mood) {
                counts[entry.mood] = (counts[entry.mood] ?? 0) + 1;
                total++;
            }
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        return { items: sorted, total };
    }, [cycleData.entries]);

    // ─── Average water intake ───────────────────────────────────────
    const waterAvg = useMemo(() => {
        const waterEntries = cycleData.entries.filter(e => e.waterIntake && e.waterIntake > 0);
        if (waterEntries.length === 0) return 0;
        const sum = waterEntries.reduce((acc, e) => acc + (e.waterIntake ?? 0), 0);
        return Math.round(sum / waterEntries.length);
    }, [cycleData.entries]);

    // ─── BBT average ────────────────────────────────────────────────
    const bbtAvg = useMemo(() => {
        const bbtEntries = cycleData.entries.filter(e => e.bbt && e.bbt > 0);
        if (bbtEntries.length === 0) return 0;
        const sum = bbtEntries.reduce((acc, e) => acc + (e.bbt ?? 0), 0);
        return (sum / bbtEntries.length).toFixed(1);
    }, [cycleData.entries]);

    // ─── Logging streak ─────────────────────────────────────────────
    const loggingStreak = useMemo(() => {
        if (cycleData.entries.length === 0) return 0;
        const dates = [...new Set(cycleData.entries.map(e => e.date))].sort().reverse();
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < dates.length; i++) {
            const expected = new Date(today);
            expected.setDate(expected.getDate() - i);
            const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
            if (dates.includes(expectedStr)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }, [cycleData.entries]);

    const hasData = cycleStats.totalEntries > 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Insights</Text>
                {hasData && (
                    <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                        Based on {cycleStats.totalEntries} {cycleStats.totalEntries === 1 ? 'entry' : 'entries'}
                    </Text>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ─── AI Predictions Card ────────────────────────────── */}
                <View style={[styles.card, {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                    borderWidth: 1,
                }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={[styles.cardIcon, { backgroundColor: '#8b5cf620' }]}>
                                <Ionicons name="sparkles" size={18} color="#8b5cf6" ></Ionicons>
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>AI Predictions</Text>
                        </View>
                        {prediction && (
                            <TouchableOpacity onPress={refreshAI} disabled={aiLoading}>
                                <Ionicons
                                    name="refresh-outline"
                                    size={18}
                                    color={aiLoading ? colors.textTertiary : colors.primary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {!hasEnoughForAI ? (
                        <View style={styles.emptySection}>
                            <Ionicons name="sparkles-outline" size={32} color={colors.textTertiary} ></Ionicons>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                Log at least 1 entry with period data{'\n'}to unlock AI predictions
                            </Text>
                        </View>
                    ) : aiLoading && !prediction ? (
                        <View style={styles.aiLoadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={[styles.aiLoadingText, { color: colors.textSecondary }]}>
                                Analyzing your cycle data...
                            </Text>
                        </View>
                    ) : prediction ? (
                        <View style={styles.aiContent}>
                            {/* Confidence Badge */}
                            <View style={[styles.confidenceBadge, {
                                backgroundColor: prediction.confidence >= 70 ? colors.success + '15'
                                    : prediction.confidence >= 40 ? colors.warning + '15'
                                        : colors.textSecondary + '15',
                            }]}>
                                <Ionicons
                                    name="shield-checkmark"
                                    size={12}
                                    color={prediction.confidence >= 70 ? colors.success
                                        : prediction.confidence >= 40 ? colors.warning
                                            : colors.textSecondary}
                                />
                                <Text style={[styles.confidenceText, {
                                    color: prediction.confidence >= 70 ? colors.success
                                        : prediction.confidence >= 40 ? colors.warning
                                            : colors.textSecondary,
                                }]}>
                                    {prediction.confidence}% confidence
                                </Text>
                            </View>

                            {/* Prediction Stats */}
                            <View style={styles.aiStatsRow}>
                                <View style={[styles.aiStatBox, { backgroundColor: colors.period + '10' }]}>
                                    <Ionicons name="calendar" size={16} color={colors.period} ></Ionicons>
                                    <Text style={[styles.aiStatValue, { color: colors.text }]}>
                                        {formatDate(prediction.nextPeriodDate)}
                                    </Text>
                                    <Text style={[styles.aiStatLabel, { color: colors.textSecondary }]}>
                                        Next Period
                                    </Text>
                                </View>
                                <View style={[styles.aiStatBox, { backgroundColor: colors.primary + '10' }]}>
                                    <Ionicons name="sync" size={16} color={colors.primary} ></Ionicons>
                                    <Text style={[styles.aiStatValue, { color: colors.text }]}>
                                        {prediction.predictedCycleLength}d
                                    </Text>
                                    <Text style={[styles.aiStatLabel, { color: colors.textSecondary }]}>
                                        Cycle Length
                                    </Text>
                                </View>
                                <View style={[styles.aiStatBox, { backgroundColor: colors.fertile + '10' }]}>
                                    <Ionicons name="leaf" size={16} color={colors.fertile} ></Ionicons>
                                    <Text style={[styles.aiStatValue, { color: colors.text }]}>
                                        {formatDate(prediction.fertileWindowStart)}
                                    </Text>
                                    <Text style={[styles.aiStatLabel, { color: colors.textSecondary }]}>
                                        Fertile Start
                                    </Text>
                                </View>
                            </View>

                            {/* AI Insights */}
                            {prediction.insights.length > 0 && (
                                <View style={styles.aiInsightsList}>
                                    <Text style={[styles.aiSubTitle, { color: colors.text }]}>
                                        Pattern Insights
                                    </Text>
                                    {prediction.insights.map((insight, i) => (
                                        <View key={i} style={styles.aiInsightRow}>
                                            <View style={[styles.aiInsightDot, { backgroundColor: colors.primary }]} />
                                            <Text style={[styles.aiInsightText, { color: colors.textSecondary }]}>
                                                {insight}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* AI Tips */}
                            {prediction.tips.length > 0 && (
                                <View style={styles.aiInsightsList}>
                                    <Text style={[styles.aiSubTitle, { color: colors.text }]}>
                                        Personalized Tips
                                    </Text>
                                    {prediction.tips.map((tip, i) => (
                                        <View key={i} style={styles.aiInsightRow}>
                                            <Text style={styles.aiTipEmoji}>💡</Text>
                                            <Text style={[styles.aiInsightText, { color: colors.textSecondary }]}>
                                                {tip}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {aiLoading && (
                                <View style={styles.aiRefreshingRow}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.aiRefreshingText, { color: colors.textTertiary }]}>
                                        Refreshing...
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : aiError ? (
                        <View style={styles.emptySection}>
                            <Ionicons name="cloud-offline-outline" size={32} color={colors.textTertiary} ></Ionicons>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                Could not load predictions.{'\n'}Pull to refresh to try again.
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* ─── Current Phase Card ─────────────────────────────── */}
                <View style={[styles.phaseCard, { backgroundColor: phaseColor }]}>
                    <View style={styles.phaseCardTop}>
                        <View style={styles.phaseIconBg}>
                            {currentPhase.iconPack === 'mci' ? (
                                <MaterialCommunityIcons name={currentPhase.icon as any} size={28} color="#fff" />
                            ) : (
                                <Ionicons name={currentPhase.icon as any} size={28} color="#fff" ></Ionicons>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.phaseCardLabel}>Current Phase</Text>
                            <Text style={styles.phaseCardTitle}>{currentPhase.label} Phase</Text>
                        </View>
                        <View style={styles.phaseDayBadge}>
                            <Text style={styles.phaseDayNumber}>{cycleStatus?.currentDay ?? 1}</Text>
                            <Text style={styles.phaseDayLabel}>Day</Text>
                        </View>
                    </View>
                    <Text style={styles.phaseCardTip}>{currentPhase.tip}</Text>
                    <View style={styles.phaseDetails}>
                        <View style={styles.phaseDetail}>
                            <Ionicons name="fitness-outline" size={14} color="rgba(255,255,255,0.8)" ></Ionicons>
                            <Text style={styles.phaseDetailText}>{currentPhase.exercise}</Text>
                        </View>
                        <View style={styles.phaseDetail}>
                            <Ionicons name="nutrition-outline" size={14} color="rgba(255,255,255,0.8)" ></Ionicons>
                            <Text style={styles.phaseDetailText}>{currentPhase.nutrition}</Text>
                        </View>
                    </View>
                </View>

                {/* ─── Quick Stats Row ────────────────────────────────── */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <View style={[styles.statIconBg, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="sync-outline" size={18} color={colors.primary} ></Ionicons>
                        </View>
                        <Text style={[styles.statNumber, { color: colors.primary }]}>{cycleStats.avgLength}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Cycle</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <View style={[styles.statIconBg, { backgroundColor: colors.ovulation + '15' }]}>
                            <Ionicons name="flame-outline" size={18} color={colors.ovulation} ></Ionicons>
                        </View>
                        <Text style={[styles.statNumber, { color: colors.ovulation }]}>{loggingStreak}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <View style={[styles.statIconBg, { backgroundColor: colors.info + '15' }]}>
                            <Ionicons name="water-outline" size={18} color={colors.info} ></Ionicons>
                        </View>
                        <Text style={[styles.statNumber, { color: colors.info }]}>{waterAvg > 0 ? `${waterAvg}` : '—'}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{waterAvg > 0 ? 'Avg ml' : 'Water'}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                        <View style={[styles.statIconBg, { backgroundColor: colors.period + '15' }]}>
                            <Ionicons name="thermometer-outline" size={18} color={colors.period} ></Ionicons>
                        </View>
                        <Text style={[styles.statNumber, { color: colors.period }]}>{bbtAvg !== '0' ? `${bbtAvg}` : '—'}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{bbtAvg !== '0' ? 'Avg °C' : 'BBT'}</Text>
                    </View>
                </View>

                {/* ─── Cycle Range Card ───────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={[styles.cardIcon, { backgroundColor: colors.primary + '15' }]}>
                                <Ionicons name="analytics-outline" size={18} color={colors.primary} ></Ionicons>
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Cycle Range</Text>
                        </View>
                    </View>
                    <View style={styles.cycleRangeVisual}>
                        <View style={styles.cycleRangeRow}>
                            <Text style={[styles.cycleRangeLabel, { color: colors.textSecondary }]}>Shortest</Text>
                            <View style={[styles.cycleRangeBar, { backgroundColor: colors.backgroundSecondary }]}>
                                <View style={[
                                    styles.cycleRangeFill,
                                    {
                                        backgroundColor: colors.fertile,
                                        width: `${Math.min((cycleStats.shortestCycle / 60) * 100, 100)}%`,
                                    }
                                ]} />
                            </View>
                            <Text style={[styles.cycleRangeValue, { color: colors.fertile }]}>{cycleStats.shortestCycle}d</Text>
                        </View>
                        <View style={styles.cycleRangeRow}>
                            <Text style={[styles.cycleRangeLabel, { color: colors.textSecondary }]}>Average</Text>
                            <View style={[styles.cycleRangeBar, { backgroundColor: colors.backgroundSecondary }]}>
                                <View style={[
                                    styles.cycleRangeFill,
                                    {
                                        backgroundColor: colors.primary,
                                        width: `${Math.min((cycleStats.avgLength / 60) * 100, 100)}%`,
                                    }
                                ]} />
                            </View>
                            <Text style={[styles.cycleRangeValue, { color: colors.primary }]}>{cycleStats.avgLength}d</Text>
                        </View>
                        <View style={styles.cycleRangeRow}>
                            <Text style={[styles.cycleRangeLabel, { color: colors.textSecondary }]}>Longest</Text>
                            <View style={[styles.cycleRangeBar, { backgroundColor: colors.backgroundSecondary }]}>
                                <View style={[
                                    styles.cycleRangeFill,
                                    {
                                        backgroundColor: colors.period,
                                        width: `${Math.min((cycleStats.longestCycle / 60) * 100, 100)}%`,
                                    }
                                ]} />
                            </View>
                            <Text style={[styles.cycleRangeValue, { color: colors.period }]}>{cycleStats.longestCycle}d</Text>
                        </View>
                    </View>
                    {cycleStats.shortestCycle === cycleStats.longestCycle && hasData && (
                        <Text style={[styles.rangeNote, { color: colors.textTertiary }]}>
                            Log more cycles to see variation in your cycle length.
                        </Text>
                    )}
                </View>

                {/* ─── Symptom Frequency ──────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={[styles.cardIcon, { backgroundColor: colors.info + '15' }]}>
                                <Ionicons name="medical-outline" size={18} color={colors.info} ></Ionicons>
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Top Symptoms</Text>
                        </View>
                        {symptomAnalysis.items.length > 0 && (
                            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                                {cycleStats.totalEntries} entries
                            </Text>
                        )}
                    </View>

                    {symptomAnalysis.items.length > 0 ? (
                        <View style={styles.symptomBars}>
                            {symptomAnalysis.items.map(([name, count], i) => (
                                <View key={name} style={styles.symptomRow}>
                                    <Text style={[styles.symptomName, { color: colors.text }]}>
                                        {name.charAt(0).toUpperCase() + name.slice(1)}
                                    </Text>
                                    <View style={[styles.symptomBarBg, { backgroundColor: colors.backgroundSecondary }]}>
                                        <View style={[
                                            styles.symptomBarFill,
                                            {
                                                backgroundColor: i === 0 ? colors.primary : i === 1 ? colors.info : colors.primary + '80',
                                                width: `${(count / symptomAnalysis.max) * 100}%`,
                                            }
                                        ]} />
                                    </View>
                                    <Text style={[styles.symptomCount, { color: colors.textSecondary }]}>{count}×</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptySection}>
                            <Ionicons name="medical-outline" size={32} color={colors.textTertiary} ></Ionicons>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                Log symptoms to see your patterns here
                            </Text>
                        </View>
                    )}
                </View>

                {/* ─── Mood Distribution ──────────────────────────────── */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={[styles.cardIcon, { backgroundColor: colors.ovulation + '15' }]}>
                                <Ionicons name="happy-outline" size={18} color={colors.ovulation} ></Ionicons>
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Mood Patterns</Text>
                        </View>
                    </View>

                    {moodAnalysis.items.length > 0 ? (
                        <>
                            <View style={styles.moodRow}>
                                {moodAnalysis.items.slice(0, 4).map(([mood, count]) => {
                                    const pct = Math.round((count / moodAnalysis.total) * 100);
                                    return (
                                        <View key={mood} style={styles.moodItem}>
                                            <Text style={styles.moodEmoji}>{moodEmojis[mood as MoodType]}</Text>
                                            <View style={[styles.moodPctBar, { backgroundColor: colors.backgroundSecondary }]}>
                                                <View style={[styles.moodPctFill, {
                                                    backgroundColor: colors.primary,
                                                    height: `${pct}%`,
                                                }]} />
                                            </View>
                                            <Text style={[styles.moodPct, { color: colors.text }]}>{pct}%</Text>
                                            <Text style={[styles.moodName, { color: colors.textSecondary }]}>
                                                {mood.charAt(0).toUpperCase() + mood.slice(1)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                            <Text style={[styles.moodSummary, { color: colors.textSecondary }]}>
                                Most common: {moodEmojis[moodAnalysis.items[0][0] as MoodType]}{' '}
                                {moodAnalysis.items[0][0].charAt(0).toUpperCase() + moodAnalysis.items[0][0].slice(1)}
                                {' '}({Math.round((moodAnalysis.items[0][1] / moodAnalysis.total) * 100)}% of days)
                            </Text>
                        </>
                    ) : (
                        <View style={styles.emptySection}>
                            <Ionicons name="happy-outline" size={32} color={colors.textTertiary} ></Ionicons>
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                Log your mood daily to discover patterns
                            </Text>
                        </View>
                    )}
                </View>

                {/* ─── Personalized Tips ──────────────────────────────── */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>For You</Text>

                <View style={[styles.tipCard, { backgroundColor: phaseColor + '12', borderColor: phaseColor + '30' }]}>
                    <View style={[styles.tipIconContainer, { backgroundColor: phaseColor + '25' }]}>
                        {currentPhase.iconPack === 'mci' ? (
                            <MaterialCommunityIcons name={currentPhase.icon as any} size={22} color={phaseColor} />
                        ) : (
                            <Ionicons name={currentPhase.icon as any} size={22} color={phaseColor} ></Ionicons>
                        )}
                    </View>
                    <View style={styles.tipTextContainer}>
                        <Text style={[styles.tipTitle, { color: colors.text }]}>{currentPhase.label} Phase Tips</Text>
                        <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>{currentPhase.tip}</Text>
                    </View>
                </View>

                {waterAvg > 0 && waterAvg < 2000 && (
                    <View style={[styles.tipCard, { backgroundColor: colors.info + '10', borderColor: colors.info + '25' }]}>
                        <View style={[styles.tipIconContainer, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="water" size={22} color={colors.info} ></Ionicons>
                        </View>
                        <View style={styles.tipTextContainer}>
                            <Text style={[styles.tipTitle, { color: colors.text }]}>Hydration Goal</Text>
                            <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                                Your average is {waterAvg}ml. Try to reach 2000ml daily for better energy and skin.
                            </Text>
                        </View>
                    </View>
                )}

                {loggingStreak >= 3 && (
                    <View style={[styles.tipCard, { backgroundColor: colors.fertile + '10', borderColor: colors.fertile + '25' }]}>
                        <View style={[styles.tipIconContainer, { backgroundColor: colors.fertile + '20' }]}>
                            <Ionicons name="flame" size={22} color={colors.fertile} ></Ionicons>
                        </View>
                        <View style={styles.tipTextContainer}>
                            <Text style={[styles.tipTitle, { color: colors.text }]}>{loggingStreak}-Day Streak! 🎉</Text>
                            <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                                You've been logging consistently. Keep it up for better predictions!
                            </Text>
                        </View>
                    </View>
                )}

                {!hasData && (
                    <View style={[styles.tipCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                        <View style={[styles.tipIconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="sparkles" size={22} color={colors.primary} ></Ionicons>
                        </View>
                        <View style={styles.tipTextContainer}>
                            <Text style={[styles.tipTitle, { color: colors.text }]}>Start Logging</Text>
                            <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                                Log your first entry to unlock personalized insights, mood patterns, and symptom analysis.
                            </Text>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    headerTitle: {
        ...Typography.h2,
    },
    headerSub: {
        ...Typography.caption,
        marginTop: 2,
    },
    scrollContent: { paddingHorizontal: Spacing.lg },

    // ─── Phase Card ─────────────────────────────────────────────────
    phaseCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    phaseCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    phaseIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseCardLabel: {
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
        color: 'rgba(255,255,255,0.8)',
    },
    phaseCardTitle: {
        fontSize: 22,
        fontFamily: 'Manrope_700Bold',
        color: '#fff',
    },
    phaseDayBadge: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    phaseDayNumber: {
        fontSize: 20,
        fontFamily: 'Manrope_700Bold',
        color: '#fff',
    },
    phaseDayLabel: {
        fontSize: 10,
        fontFamily: 'Manrope_500Medium',
        color: 'rgba(255,255,255,0.8)',
    },
    phaseCardTip: {
        fontSize: 14,
        fontFamily: 'Manrope_400Regular',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
        marginBottom: 12,
    },
    phaseDetails: { gap: 6 },
    phaseDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    phaseDetailText: {
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
        color: 'rgba(255,255,255,0.85)',
        flex: 1,
    },

    // ─── Stats ──────────────────────────────────────────────────────
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        gap: 4,
    },
    statIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontFamily: 'Manrope_700Bold',
    },
    statLabel: {
        fontSize: 10,
        fontFamily: 'Manrope_500Medium',
        textAlign: 'center',
    },

    // ─── Cards ──────────────────────────────────────────────────────
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 17,
        fontFamily: 'Manrope_700Bold',
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
    },

    // ─── Cycle Range ────────────────────────────────────────────────
    cycleRangeVisual: { gap: 14 },
    cycleRangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cycleRangeLabel: {
        width: 60,
        fontSize: 12,
        fontFamily: 'Manrope_500Medium',
    },
    cycleRangeBar: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    cycleRangeFill: {
        height: '100%',
        borderRadius: 5,
    },
    cycleRangeValue: {
        width: 32,
        fontSize: 13,
        fontFamily: 'Manrope_700Bold',
        textAlign: 'right',
    },
    rangeNote: {
        fontSize: 12,
        fontFamily: 'Manrope_400Regular',
        marginTop: 12,
        textAlign: 'center',
    },

    // ─── Symptom Bars ───────────────────────────────────────────────
    symptomBars: { gap: 12 },
    symptomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    symptomName: {
        width: 75,
        fontSize: 13,
        fontFamily: 'Manrope_500Medium',
    },
    symptomBarBg: {
        flex: 1,
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    symptomBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    symptomCount: {
        width: 28,
        fontSize: 12,
        fontFamily: 'Manrope_600SemiBold',
        textAlign: 'right',
    },

    // ─── Mood ───────────────────────────────────────────────────────
    moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    moodItem: {
        alignItems: 'center',
        gap: 4,
    },
    moodEmoji: { fontSize: 24 },
    moodPctBar: {
        width: 28,
        height: 60,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    moodPctFill: {
        width: '100%',
        borderRadius: 14,
    },
    moodPct: {
        fontSize: 12,
        fontFamily: 'Manrope_700Bold',
    },
    moodName: {
        fontSize: 10,
        fontFamily: 'Manrope_500Medium',
    },
    moodSummary: {
        fontSize: 13,
        fontFamily: 'Manrope_400Regular',
        textAlign: 'center',
        lineHeight: 18,
    },

    // ─── Empty / Tips ───────────────────────────────────────────────
    emptySection: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: 'Manrope_500Medium',
        textAlign: 'center',
    },
    sectionTitle: {
        ...Typography.h4,
        marginBottom: Spacing.md,
    },
    tipCard: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: BorderRadius.lg,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    tipIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    tipTextContainer: { flex: 1 },
    tipTitle: {
        fontSize: 14,
        fontFamily: 'Manrope_700Bold',
    },
    tipDescription: {
        fontSize: 13,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 18,
        marginTop: 2,
    },

    // ─── AI Predictions ─────────────────────────────────────────────
    aiLoadingContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        gap: 10,
    },
    aiLoadingText: {
        fontSize: 13,
        fontFamily: 'Manrope_500Medium',
    },
    aiContent: { gap: 14 },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    confidenceText: {
        fontSize: 11,
        fontFamily: 'Manrope_600SemiBold',
    },
    aiStatsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    aiStatBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: BorderRadius.lg,
        gap: 4,
    },
    aiStatValue: {
        fontSize: 14,
        fontFamily: 'Manrope_700Bold',
    },
    aiStatLabel: {
        fontSize: 10,
        fontFamily: 'Manrope_500Medium',
        textAlign: 'center',
    },
    aiSubTitle: {
        fontSize: 13,
        fontFamily: 'Manrope_700Bold',
        marginBottom: 6,
    },
    aiInsightsList: { gap: 4 },
    aiInsightRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 2,
    },
    aiInsightDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    aiInsightText: {
        fontSize: 13,
        fontFamily: 'Manrope_400Regular',
        lineHeight: 18,
        flex: 1,
    },
    aiTipEmoji: {
        fontSize: 14,
        marginTop: 1,
    },
    aiRefreshingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 4,
    },
    aiRefreshingText: {
        fontSize: 11,
        fontFamily: 'Manrope_500Medium',
    },
});

export default HealthInsightsScreen;
