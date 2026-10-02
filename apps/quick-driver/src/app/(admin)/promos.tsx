import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PROMOS } from '@/lib/data';

export default function AdminPromosScreen() {
  const theme = useTheme();
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(PROMOS.map((p) => [p.code, true]))
  );
  const [newCode, setNewCode] = useState('');
  const [created, setCreated] = useState<string[]>([]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Pricing & promos</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            FARE CONFIG
          </ThemedText>
          <Card>
            <Row>
              <ThemedText type="small">Instant Ride base / per km</ThemedText>
              <ThemedText type="smallBold">₹99 + ₹32/km</ThemedText>
            </Row>
            <Row>
              <ThemedText type="small">Hourly rate (min 2 hr)</ThemedText>
              <ThemedText type="smallBold">₹149/hr</ThemedText>
            </Row>
            <Row>
              <ThemedText type="small">Daily (12 hr)</ThemedText>
              <ThemedText type="smallBold">₹1,099</ThemedText>
            </Row>
            <Row>
              <ThemedText type="small">Outstation per km + allowance</ThemedText>
              <ThemedText type="smallBold">₹14/km + ₹300</ThemedText>
            </Row>
            <Row>
              <ThemedText type="small">Night surcharge (10 PM – 6 AM)</ThemedText>
              <ThemedText type="smallBold">₹150</ThemedText>
            </Row>
            <Row>
              <ThemedText type="small">Trip insurance</ThemedText>
              <ThemedText type="smallBold">₹100</ThemedText>
            </Row>
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            PROMO CAMPAIGNS
          </ThemedText>
          {PROMOS.map((p) => (
            <Card key={p.code}>
              <Row>
                <View style={styles.flexOne}>
                  <ThemedText type="smallBold" style={{ color: BRAND }}>{p.code}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{p.title} — {p.detail}</ThemedText>
                </View>
                <Switch
                  value={active[p.code]}
                  onValueChange={(v) => setActive((a) => ({ ...a, [p.code]: v }))}
                  trackColor={{ true: BRAND }}
                />
              </Row>
            </Card>
          ))}

          <Card>
            <ThemedText type="smallBold">Create promo code</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
              placeholder="e.g. DIWALI25"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="characters"
              value={newCode}
              onChangeText={(v) => setNewCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            />
            <Button
              title="Launch campaign"
              disabled={newCode.length < 4}
              onPress={() => {
                setCreated((c) => [newCode, ...c]);
                setNewCode('');
              }}
            />
            {created.map((c) => (
              <ThemedText key={c} type="small" style={{ color: SUCCESS }}>
                ✓ {c} launched — visible to customers in Rewards
              </ThemedText>
            ))}
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
  label: { letterSpacing: 1, marginTop: Spacing.two },
  flexOne: { flex: 1 },
  input: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
});
