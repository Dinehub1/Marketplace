import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, NAVY, Row } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApp } from '@/lib/app-context';
import { inr, PROMOS } from '@/lib/data';

const PASSES = [
  { name: 'Commute Pass', detail: '10 instant rides · valid 30 days', price: 899, save: 'Save ₹200' },
  { name: 'Weekend Pass', detail: '4 hourly bookings (3 hrs each)', price: 1599, save: 'Save ₹190' },
  { name: 'Corporate Monthly', detail: 'Unlimited booking, single invoice', price: 0, save: 'Custom quote' },
];

export default function RewardsScreen() {
  const { phone, walletBalance } = useApp();
  const [copied, setCopied] = useState(false);
  const referralCode = `QD${(phone ?? '0000').slice(-4)}`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Rewards</ThemedText>

          <Card style={styles.walletCard}>
            <ThemedText type="smallBold" style={styles.walletLabel}>
              QD WALLET
            </ThemedText>
            <ThemedText type="subtitle" style={styles.walletAmount}>
              {inr(walletBalance)}
            </ThemedText>
            <ThemedText type="small" style={styles.walletLabel}>
              Use it on any trip · top up with UPI (GPay / PhonePe / Paytm)
            </ThemedText>
          </Card>

          <Card>
            <ThemedText type="smallBold">🎁 Refer & earn ₹100</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your friend gets ₹100 off their first ride, you get ₹100 in your wallet when they
              complete it.
            </ThemedText>
            <Row>
              <ThemedText type="code" style={styles.referralCode}>
                {referralCode}
              </ThemedText>
              <Button
                title={copied ? 'Copied ✓' : 'Share code'}
                small
                variant="secondary"
                onPress={() => setCopied(true)}
              />
            </Row>
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            PROMO CODES
          </ThemedText>
          {PROMOS.map((promo) => (
            <Card key={promo.code}>
              <Row>
                <View style={styles.promoInfo}>
                  <ThemedText type="smallBold" style={{ color: BRAND }}>
                    {promo.code}
                  </ThemedText>
                  <ThemedText type="smallBold">{promo.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {promo.detail} Apply it on the booking screen.
                  </ThemedText>
                </View>
              </Row>
            </Card>
          ))}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            RIDE PASSES
          </ThemedText>
          {PASSES.map((pass) => (
            <Card key={pass.name}>
              <Row>
                <View style={styles.promoInfo}>
                  <ThemedText type="smallBold">{pass.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {pass.detail}
                  </ThemedText>
                </View>
                <View style={styles.passPrice}>
                  <ThemedText type="smallBold">{pass.price ? inr(pass.price) : '—'}</ThemedText>
                  <ThemedText type="small" style={{ color: BRAND }}>
                    {pass.save}
                  </ThemedText>
                </View>
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
  walletCard: {
    backgroundColor: NAVY,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  walletAmount: {
    color: BRAND,
  },
  referralCode: {
    fontSize: 18,
    letterSpacing: 2,
  },
  label: {
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  promoInfo: {
    flex: 1,
    gap: 2,
  },
  passPrice: {
    alignItems: 'flex-end',
  },
});
