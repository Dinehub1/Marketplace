import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, NAVY, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApp } from '@/lib/app-context';
import { inr } from '@/lib/data';

const LIVE_TRIPS = [
  { id: 'QD-4211', service: 'Instant Ride', route: 'Vijay Nagar → Rajwada', driver: 'Ramesh V.', status: 'In progress', fare: 355 },
  { id: 'QD-4212', service: 'Hourly (3h)', route: 'Palasia — city errands', driver: 'Sunil P.', status: 'In progress', fare: 447 },
  { id: 'QD-4213', service: 'Outstation', route: 'Indore → Ujjain', driver: 'Arjun S.', status: 'Driver enroute', fare: 1420 },
  { id: 'QD-4214', service: 'Instant Ride', route: 'Bhawarkua → Airport', driver: '— matching —', status: 'Finding driver', fare: 289 },
];

export default function AdminLiveOpsScreen() {
  const { signOut } = useApp();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Row>
            <ThemedText type="subtitle">Live ops</ThemedText>
            <Button title="Sign out" variant="ghost" small onPress={signOut} />
          </Row>

          <View style={styles.statRow}>
            <Card style={styles.stat}>
              <ThemedText type="subtitle" style={{ color: BRAND }}>4</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Active trips</ThemedText>
            </Card>
            <Card style={styles.stat}>
              <ThemedText type="subtitle" style={{ color: SUCCESS }}>12</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Drivers online</ThemedText>
            </Card>
            <Card style={styles.stat}>
              <ThemedText type="subtitle">{inr(18240)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Today&apos;s bookings</ThemedText>
            </Card>
          </View>

          <Card style={styles.alertCard}>
            <ThemedText type="smallBold" style={{ color: '#fff' }}>
              ⚠️ 1 unassigned trip &gt; 3 min — QD-4214 (Bhawarkua → Airport)
            </ThemedText>
            <Button title="Assign manually" small onPress={() => {}} />
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            ACTIVE TRIPS
          </ThemedText>
          {LIVE_TRIPS.map((t) => (
            <Card key={t.id}>
              <Row>
                <ThemedText type="smallBold">{t.id} · {t.service}</ThemedText>
                <ThemedText
                  type="smallBold"
                  style={{ color: t.status === 'Finding driver' ? '#F5A623' : SUCCESS }}>
                  {t.status}
                </ThemedText>
              </Row>
              <ThemedText type="small" themeColor="textSecondary">{t.route}</ThemedText>
              <Row>
                <ThemedText type="small" themeColor="textSecondary">🧑‍✈️ {t.driver}</ThemedText>
                <ThemedText type="smallBold">{inr(t.fare)}</ThemedText>
              </Row>
            </Card>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  statRow: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  alertCard: { backgroundColor: NAVY, gap: Spacing.two },
  label: { letterSpacing: 1, marginTop: Spacing.two },
});
