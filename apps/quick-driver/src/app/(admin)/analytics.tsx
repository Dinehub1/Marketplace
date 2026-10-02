import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Card, NAVY, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { inr } from '@/lib/data';

const WEEK = [
  { day: 'Mon', rides: 34 },
  { day: 'Tue', rides: 41 },
  { day: 'Wed', rides: 29 },
  { day: 'Thu', rides: 47 },
  { day: 'Fri', rides: 58 },
  { day: 'Sat', rides: 72 },
  { day: 'Sun', rides: 51 },
];

const STATS = [
  { label: 'Rides this week', value: '332', delta: '+18% vs last week' },
  { label: 'Gross bookings', value: inr(128460), delta: '+22%' },
  { label: 'Avg driver rating', value: '4.9 ★', delta: '100% video compliant' },
  { label: 'Repeat customers', value: '61%', delta: '+6 pts' },
];

const SERVICE_MIX = [
  { name: 'Instant Ride', share: 42 },
  { name: 'Hourly', share: 27 },
  { name: 'Outstation', share: 17 },
  { name: 'Daily', share: 9 },
  { name: 'Corporate', share: 5 },
];

export default function AdminAnalyticsScreen() {
  const max = Math.max(...WEEK.map((d) => d.rides));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Analytics</ThemedText>

          <View style={styles.grid}>
            {STATS.map((s) => (
              <Card key={s.label} style={styles.stat}>
                <ThemedText type="subtitle">{s.value}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{s.label}</ThemedText>
                <ThemedText type="small" style={{ color: SUCCESS }}>{s.delta}</ThemedText>
              </Card>
            ))}
          </View>

          <Card>
            <ThemedText type="smallBold">Rides per day</ThemedText>
            <View style={styles.chart}>
              {WEEK.map((d) => (
                <View key={d.day} style={styles.chartCol}>
                  <ThemedText type="small" themeColor="textSecondary">{d.rides}</ThemedText>
                  <View style={[styles.bar, { height: 12 + (d.rides / max) * 80 }]} />
                  <ThemedText type="small" themeColor="textSecondary">{d.day}</ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <ThemedText type="smallBold">Service mix</ThemedText>
            {SERVICE_MIX.map((s) => (
              <View key={s.name} style={styles.mixRow}>
                <Row>
                  <ThemedText type="small">{s.name}</ThemedText>
                  <ThemedText type="smallBold">{s.share}%</ThemedText>
                </Row>
                <View style={styles.mixTrack}>
                  <View style={[styles.mixFill, { width: `${s.share}%` }]} />
                </View>
              </View>
            ))}
          </Card>

          <Card style={styles.videoCard}>
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              🎥 Car video compliance
            </ThemedText>
            <ThemedText type="small" style={styles.videoText}>
              332 / 332 trips this week have both before & after videos on file. 0 damage disputes
              escalated.
            </ThemedText>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { flexBasis: '48%', flexGrow: 1, gap: 2 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  chartCol: { alignItems: 'center', gap: Spacing.one, flex: 1 },
  bar: { width: 18, borderRadius: 6, backgroundColor: BRAND },
  mixRow: { gap: Spacing.one },
  mixTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  mixFill: { height: 6, backgroundColor: BRAND },
  videoCard: { backgroundColor: NAVY },
  videoText: { color: 'rgba(255,255,255,0.85)' },
});
