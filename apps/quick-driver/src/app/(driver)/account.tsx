import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, NAVY, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApp } from '@/lib/app-context';

const KYC_ITEMS = [
  'Driving licence',
  'Aadhaar card',
  'Police verification certificate',
  'Bank account (UPI payouts)',
];

export default function DriverAccountScreen() {
  const { phone, signOut } = useApp();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Account</ThemedText>

          <Card>
            <Row>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>DP</ThemedText>
              </View>
              <View style={styles.info}>
                <ThemedText type="smallBold">Driver Partner</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  +91 {phone}
                </ThemedText>
                <ThemedText type="small" style={{ color: BRAND }}>
                  ⭐️ 4.9 · 1,240 trips · 8 yrs experience
                </ThemedText>
              </View>
            </Row>
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            VERIFICATION
          </ThemedText>
          <Card>
            {KYC_ITEMS.map((item) => (
              <Row key={item}>
                <ThemedText type="small">{item}</ThemedText>
                <ThemedText type="smallBold" style={{ color: SUCCESS }}>
                  Verified ✓
                </ThemedText>
              </Row>
            ))}
          </Card>

          <Card>
            <ThemedText type="smallBold">🎥 Car video rule</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Record a 30-second video of the customer’s car before starting and after ending every
              trip. Trips can’t be started or closed without it — it protects you from false damage
              claims.
            </ThemedText>
          </Card>

          <Card>
            <ThemedText type="smallBold">📞 Partner support</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              +91 88890 91011 · 24/7 · WhatsApp available
            </ThemedText>
          </Card>

          <Button title="Sign out" variant="secondary" onPress={signOut} />
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
  label: {
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#F1B021',
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
