import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Card, Row } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApp } from '@/lib/app-context';
import { inr, SAVED_PLACES } from '@/lib/data';

export default function ProfileScreen() {
  const { phone, walletBalance, signOut } = useApp();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Profile</ThemedText>

          <Card>
            <Row>
              <View>
                <ThemedText type="smallBold">+91 {phone}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Member since July 2026
                </ThemedText>
              </View>
              <ThemedText type="smallBold">{inr(walletBalance)} wallet</ThemedText>
            </Row>
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            SAVED PLACES
          </ThemedText>
          <Card>
            {SAVED_PLACES.map((place) => (
              <Row key={place.label}>
                <ThemedText type="smallBold">
                  {place.label === 'Home' ? '🏠' : '🏢'} {place.label}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {place.address}
                </ThemedText>
              </Row>
            ))}
          </Card>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
            SUPPORT
          </ThemedText>
          <Card>
            <ThemedText type="smallBold">📞 24/7 helpline</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              +91 88890 91011 · WhatsApp support available
            </ThemedText>
          </Card>
          <Card>
            <ThemedText type="smallBold">💼 Corporate billing</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Monthly invoicing for teams — ask us for a custom quote.
            </ThemedText>
          </Card>
          <Card>
            <ThemedText type="smallBold">🎥 Car video policy</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Every QuickDriver partner records a 30-second video of your car before starting and
              after finishing the trip. Both videos are attached to your trip record, so any damage
              dispute is settled with evidence — not arguments.
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
});
