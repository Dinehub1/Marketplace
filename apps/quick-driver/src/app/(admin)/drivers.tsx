import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, DANGER, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { DRIVER_POOL } from '@/lib/data';

const APPLICANTS = [
  { id: 'a1', name: 'Mohan Yadav', docs: 'Licence ✓ · Aadhaar ✓ · Police cert ✓', exp: '5 yrs' },
  { id: 'a2', name: 'Irfan Khan', docs: 'Licence ✓ · Aadhaar ✓ · Police cert pending', exp: '3 yrs' },
];

export default function AdminDriversScreen() {
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({});

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Drivers</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            VERIFICATION QUEUE
          </ThemedText>
          {APPLICANTS.map((a) => (
            <Card key={a.id}>
              <Row>
                <ThemedText type="smallBold">{a.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{a.exp} experience</ThemedText>
              </Row>
              <ThemedText type="small" themeColor="textSecondary">{a.docs}</ThemedText>
              {decisions[a.id] ? (
                <ThemedText
                  type="smallBold"
                  style={{ color: decisions[a.id] === 'approved' ? SUCCESS : DANGER }}>
                  {decisions[a.id] === 'approved' ? '✓ Approved & onboarded' : '✗ Rejected'}
                </ThemedText>
              ) : (
                <Row>
                  <View style={styles.flexOne}>
                    <Button
                      title="Reject"
                      variant="secondary"
                      small
                      onPress={() => setDecisions((d) => ({ ...d, [a.id]: 'rejected' }))}
                    />
                  </View>
                  <View style={styles.flexOne}>
                    <Button
                      title="Approve"
                      small
                      onPress={() => setDecisions((d) => ({ ...d, [a.id]: 'approved' }))}
                    />
                  </View>
                </Row>
              )}
            </Card>
          ))}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            ACTIVE FLEET
          </ThemedText>
          {DRIVER_POOL.map((d) => (
            <Card key={d.name}>
              <Row>
                <ThemedText type="smallBold">{d.name}</ThemedText>
                <ThemedText type="smallBold" style={{ color: BRAND }}>⭐️ {d.rating}</ThemedText>
              </Row>
              <ThemedText type="small" themeColor="textSecondary">
                {d.trips.toLocaleString('en-IN')} trips · {d.years} yrs · Police-verified ✓ · Car
                videos compliant 🎥
              </ThemedText>
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
  label: { letterSpacing: 1, marginTop: Spacing.two },
  flexOne: { flex: 1 },
});
