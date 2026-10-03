import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAIPrediction } from '@/hooks/use-ai';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPregnancyWeek, useCycleData, useUserProfile } from '@/hooks/use-storage';
import { CyclePhase } from '@/types';

const phaseInfo: Record<CyclePhase, { label: string; color: (colors: any) => string; description: string }> = {
  period: {
    label: 'Period Phase',
    color: (c) => c.period,
    description: 'Your body is shedding the uterine lining.',
  },
  follicular: {
    label: 'Follicular Phase',
    color: (c) => c.primary,
    description: 'Your energy levels are rising. Great time for new projects!',
  },
  ovulation: {
    label: 'Ovulation Phase',
    color: (c) => c.ovulation,
    description: 'Peak fertility window. You may feel more confident and social.',
  },
  luteal: {
    label: 'Luteal Phase',
    color: (c) => c.luteal,
    description: 'Time to slow down. Focus on self-care and rest.',
  },
};

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const { cycleData, cycleStatus, loading, refresh: refreshCycle } = useCycleData();
  const { profile, refresh: refreshProfile } = useUserProfile();
  const { prediction: aiPrediction, loading: aiLoading, error: aiError } = useAIPrediction(cycleData, profile);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshCycle();
      refreshProfile();
    }, [refreshCycle, refreshProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCycle();
    await refreshProfile();
    setRefreshing(false);
  }, [refreshCycle, refreshProfile]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const phase = cycleStatus?.phase ?? 'follicular';
  const currentPhase = phaseInfo[phase];
  const phaseColor = currentPhase.color(colors);

  const handleLogSymptoms = () => {
    router.push('/log-symptoms');
  };

  // Calculate fertility and pregnancy chance based on phase
  const getFertilityLevel = () => {
    if (!cycleStatus) return { pregnancy: 'Low', fertility: 'Low' };
    if (cycleStatus.ovulationDay) return { pregnancy: 'High', fertility: 'Peak' };
    if (cycleStatus.fertileWindow) return { pregnancy: 'Medium', fertility: 'High' };
    if (phase === 'period') return { pregnancy: 'Very Low', fertility: 'Low' };
    return { pregnancy: 'Low', fertility: 'Increasing' };
  };

  const fertility = getFertilityLevel();

  // Goal-based Content Logic
  const isTTC = profile.goal === 'pregnant';
  const isPregnancy = profile.goal === 'pregnancy';

  const getDailyInsight = () => {
    if (isTTC) {
      if (cycleStatus?.fertileWindow) return "You're in your fertile window! Good time to try.";
      if (cycleStatus?.ovulationDay) return "Peak fertility today! Best chance for conception.";
      return "Track your basal body temperature for better fertility predictions.";
    }
    if (isPregnancy) {
      const week = getPregnancyWeek(cycleData.lastPeriodStart);
      const weekLabel = week > 0 ? `Week ${week}` : 'Early pregnancy';
      const sizes: Record<number, string> = {
        4: 'a poppy seed', 5: 'a sesame seed', 6: 'a lentil', 7: 'a blueberry',
        8: 'a kidney bean', 9: 'a grape', 10: 'a strawberry', 12: 'a lime',
        16: 'an avocado', 20: 'a banana', 24: 'an ear of corn', 28: 'an eggplant',
      };
      const size = sizes[week] ?? sizes[Math.max(...Object.keys(sizes).map(Number).filter(k => k <= week))] ?? 'a tiny miracle';
      return `${weekLabel}: Baby is about the size of ${size}. \uD83C\uDF7C`;
    }
    return currentPhase.description;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,'; })()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{profile.name || 'there'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Open notifications settings"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} ></Ionicons>
          </TouchableOpacity>
        </View>

        {/* Cycle Status Card */}
        <View style={[styles.cycleCard, { backgroundColor: phaseColor }]}>
          <View style={styles.cycleCardContent}>
            <View style={styles.cycleDay}>
              <Text style={styles.cycleDayNumber}>{cycleStatus?.currentDay ?? 1}</Text>
              <Text style={styles.cycleDayLabel}>Day of Cycle</Text>
            </View>
            <View style={styles.cycleDivider} />
            <View style={styles.periodInfo}>
              <Text style={styles.periodLabel}>{isTTC ? 'Fertile in' : 'Period in'}</Text>
              <Text style={styles.periodDays}>
                {!isTTC ? (
                  `${cycleStatus?.daysUntilPeriod ?? 0} days`
                ) : (
                  cycleStatus?.fertileWindow ? 'Now' : 'Soon'
                )}
              </Text>
              {cycleData.lastPeriodStart && (
                <Text style={[styles.periodLabel, { marginTop: 4, fontSize: 10 }]}>
                  Last: {new Date(cycleData.lastPeriodStart).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(((cycleStatus?.currentDay ?? 1) / (cycleData.cycleLength || 28)) * 100, 100)}%` }
              ]}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.phaseLabel}>{currentPhase.label}</Text>
            {cycleData.lastPeriodStart && (
              <Text style={[styles.phaseLabel, { opacity: 0.8 }]}>
                Next: {new Date(new Date(cycleData.lastPeriodStart).getTime() + (cycleData.cycleLength * 24 * 60 * 60 * 1000)).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        {!isPregnancy && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.period + '20' }]}>
                <Ionicons name="heart" size={20} color={colors.period} ></Ionicons>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pregnancy</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{fertility.pregnancy} Chance</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={[styles.statIcon, { backgroundColor: colors.fertile + '20' }]}>
                <Ionicons name="leaf" size={20} color={colors.fertile} ></Ionicons>
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fertility</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{fertility.fertility}</Text>
            </View>
          </View>
        )}

        {/* Daily Insight — AI-powered when available */}
        <View style={[styles.insightCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={[styles.insightIcon, { backgroundColor: aiPrediction ? '#8b5cf620' : colors.ovulation + '20' }]}>
            <Ionicons name={aiPrediction ? 'sparkles' : isTTC ? 'heart-circle' : 'bulb'} size={24} color={aiPrediction ? '#8b5cf6' : colors.ovulation} ></Ionicons>
          </View>
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              {aiPrediction ? '✨ AI Insight' : isTTC ? 'TTC Tip of the Day' : 'Daily Insight'}
            </Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]}>
              {aiLoading 
                ? 'Loading prediction...'
                : aiError 
                  ? `AI: ${aiError}`
                  : (aiPrediction && aiPrediction.tips.length > 0
                      ? aiPrediction.tips[0]
                      : getDailyInsight())}
            </Text>
            {aiPrediction && (
              <Text style={[styles.insightText, { color: colors.primary, marginTop: 4, fontSize: 12 }]}>
                Next period: {new Date(aiPrediction.nextPeriodDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' · '}{aiPrediction.confidence}% confidence
              </Text>
            )}
          </View>
        </View>

        {/* Log Symptoms Button */}
        <TouchableOpacity
          style={[styles.logButton, { backgroundColor: colors.primary }]}
          onPress={handleLogSymptoms}
          accessibilityLabel="Log today's symptoms"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle" size={24} color="#fff" ></Ionicons>
          <Text style={styles.logButtonText}>Log Today&apos;s Symptoms</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            onPress={handleLogSymptoms}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.period + '20' }]}>
              <Ionicons name="water" size={24} color={colors.period} ></Ionicons>
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Log Flow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            onPress={handleLogSymptoms}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.ovulation + '20' }]}>
              <Ionicons name="happy" size={24} color={colors.ovulation} ></Ionicons>
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Log Mood</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
            onPress={handleLogSymptoms}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="medical" size={24} color={colors.info} ></Ionicons>
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Symptoms</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.body,
  },
  name: {
    ...Typography.h2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cycleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cycleDay: {
    flex: 1,
  },
  cycleDayNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  cycleDayLabel: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
  },
  cycleDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: Spacing.lg,
  },
  periodInfo: {
    alignItems: 'flex-end',
  },
  periodLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  periodDays: {
    ...Typography.h3,
    color: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
  },
  phaseLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.bodyMedium,
  },
  insightCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xs,
  },
  insightText: {
    ...Typography.bodySm,
    lineHeight: 20,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logButtonText: {
    ...Typography.bodyMedium,
    color: '#fff',
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
