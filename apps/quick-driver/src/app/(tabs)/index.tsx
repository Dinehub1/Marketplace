import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Card, Row } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useApp } from '@/lib/app-context';
import { isNightNow, PROMOS, SERVICES } from '@/lib/data';

export default function HomeScreen() {
  const router = useRouter();
  const { phone, activeTrip } = useApp();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Row>
            <View>
              <ThemedText type="smallBold" themeColor="textSecondary">
                📍 Indore
              </ThemedText>
              <ThemedText type="subtitle">Namaste 👋</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              +91 {phone}
            </ThemedText>
          </Row>

          {activeTrip && (
            <Pressable onPress={() => router.push({ pathname: '/booking/trip', params: { id: activeTrip.id } })}>
              <Card style={[styles.activeBanner]}>
                <Row>
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    🟢 Trip in progress — tap to track
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: '#fff' }}>
                    →
                  </ThemedText>
                </Row>
              </Card>
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push({ pathname: '/booking/new', params: { service: 'instant' } })}>
            <Card style={styles.whereTo}>
              <ThemedText type="default" themeColor="textSecondary">
                🔍 Where do you need a driver?
              </ThemedText>
            </Card>
          </Pressable>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            CHOOSE A SERVICE
          </ThemedText>
          <View style={styles.grid}>
            {SERVICES.map((service) => (
              <Pressable
                key={service.id}
                style={styles.gridItem}
                onPress={() =>
                  router.push({ pathname: '/booking/new', params: { service: service.id } })
                }>
                <Card style={styles.serviceCard}>
                  <ThemedText style={styles.serviceIcon}>{service.icon}</ThemedText>
                  <ThemedText type="smallBold">{service.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {service.tagline}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: BRAND }}>
                    {service.priceFrom}
                  </ThemedText>
                </Card>
              </Pressable>
            ))}
          </View>

          {isNightNow() && (
            <ThemedText type="small" themeColor="textSecondary">
              🌙 Night surcharge ₹150 applies between 10 PM and 6 AM.
            </ThemedText>
          )}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            OFFERS FOR YOU
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoRow}>
            {PROMOS.map((promo) => (
              <Card key={promo.code} style={styles.promoCard}>
                <ThemedText type="smallBold" style={{ color: BRAND }}>
                  {promo.code}
                </ThemedText>
                <ThemedText type="smallBold">{promo.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {promo.detail}
                </ThemedText>
              </Card>
            ))}
          </ScrollView>

          <Card>
            <ThemedText type="smallBold">Your safety, covered</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ✅ 100% police-verified drivers{'\n'}
              🎥 30-sec car video recorded before & after every trip{'\n'}
              🆘 In-trip SOS button & live trip sharing{'\n'}
              ⭐️ 4.9 average rating · 1,000+ rides
            </ThemedText>
            <Link href="/trips" asChild>
              <Pressable>
                <ThemedText type="linkPrimary">See your trips →</ThemedText>
              </Pressable>
            </Link>
          </Card>
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
  activeBanner: {
    backgroundColor: '#10B981',
  },
  whereTo: {
    paddingVertical: Spacing.three,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginTop: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  serviceCard: {
    minHeight: 130,
  },
  serviceIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  promoRow: {
    gap: Spacing.two,
  },
  promoCard: {
    width: 230,
  },
});
