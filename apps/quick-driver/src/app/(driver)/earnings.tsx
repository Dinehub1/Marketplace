import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Card, NAVY, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { inr } from '@/lib/data';

const WEEK = [
  { day: 'Mon', amount: 940 },
  { day: 'Tue', amount: 1180 },
  { day: 'Wed', amount: 760 },
  { day: 'Thu', amount: 1420 },
  { day: 'Fri', amount: 1615 },
  { day: 'Sat', amount: 2140 },
  { day: 'Sun', amount: 1240 },
];

const PAYOUTS = [
  { label: 'Weekly payout · UPI', date: '8 Jul 2026', amount: 8320 },
  { label: 'Weekly payout · UPI', date: '1 Jul 2026', amount: 7150 },
  { label: 'Night-shift incentive', date: '1 Jul 2026', amount: 500 },
];

export default function EarningsScreen() {
  const weekTotal = WEEK.reduce((sum, d) => sum + d.amount, 0);
  const max = Math.max(...WEEK.map((d) => d.amount));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Earnings</ThemedText>

          <Card style={styles.heroCard}>
            <ThemedText type="smallBold" style={styles.heroLabel}>
              TODAY
            </ThemedText>
            <ThemedText type="subtitle" style={{ color: BRAND }}>
              {inr(1240)}
            </ThemedText>
            <ThemedText type="small" style={styles.heroLabel}>
              6 trips · 5h 20m online · {inr(40)} tips
            </ThemedText>
          </Card>

          <Card>
            <Row>
              <ThemedText type="smallBold">This week</ThemedText>
              <ThemedText type="smallBold" style={{ color: SUCCESS }}>
                {inr(weekTotal)}
              </ThemedText>
            </Row>
            <View style={styles.chart}>
              {WEEK.map((d) => (
                <View key={d.day} style={styles.chartCol}>
                  <View style={[styles.bar, { height: 12 + (d.amount / max) * 68 }]} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {d.day}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <ThemedText type="smallBold">🎯 Weekend incentive</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Complete 20 trips Sat–Sun and earn a ₹500 bonus. 14 of 20 done.
            </ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '70%' }]} />
            </View>
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            PAYOUTS
          </ThemedText>
          {PAYOUTS.map((p) => (
            <Card key={`${p.label}-${p.date}`}>
              <Row>
                <View>
                  <ThemedText type="smallBold">{p.label}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {p.date}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={{ color: SUCCESS }}>
                  +{inr(p.amount)}
                </ThemedText>
              </Row>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  heroCard: {
    backgroundColor: NAVY,
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.four,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  chartCol: {
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  bar: {
    width: 18,
    borderRadius: 6,
    backgroundColor: BRAND,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: SUCCESS,
  },
  label: {
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
});
