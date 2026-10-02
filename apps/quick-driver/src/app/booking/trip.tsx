import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, Chip, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Trip, useApp } from '@/lib/app-context';
import { inr } from '@/lib/data';

const TIP_OPTIONS = [0, 20, 50, 100];

function StatusHeader({ trip }: { trip: Trip }) {
  switch (trip.status) {
    case 'finding':
      return (
        <Card style={styles.statusCard}>
          <ThemedText style={styles.bigIcon}>📡</ThemedText>
          <ThemedText type="smallBold">Finding your driver…</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            We auto-match the nearest verified driver.{'\n'}Assigned within minutes — usually
            seconds.
          </ThemedText>
        </Card>
      );
    case 'assigned':
      return (
        <Card style={styles.statusCard}>
          <ThemedText style={styles.bigIcon}>🚗</ThemedText>
          <ThemedText type="smallBold">Driver on the way — {trip.etaMin} min</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Share this OTP with your driver to start the trip.
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: BRAND, letterSpacing: 6 }}>
            {trip.otp}
          </ThemedText>
        </Card>
      );
    case 'arrived':
      return (
        <Card style={styles.statusCard}>
          <ThemedText style={styles.bigIcon}>📍</ThemedText>
          <ThemedText type="smallBold">Your driver has arrived</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            🎥 {trip.driver?.name.split(' ')[0]} is recording the 30-sec pre-trip video of your car.
            {'\n'}Start OTP: <ThemedText type="smallBold" style={{ color: BRAND }}>{trip.otp}</ThemedText>
          </ThemedText>
        </Card>
      );
    case 'ongoing':
      return (
        <Card style={styles.statusCard}>
          <ThemedText style={styles.bigIcon}>🛣</ThemedText>
          <ThemedText type="smallBold">Trip in progress</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Live location is being tracked. Sit back and relax.
          </ThemedText>
        </Card>
      );
    default:
      return null;
  }
}

export default function TripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trips, cancelTrip, finishTrip } = useApp();
  const trip = trips.find((t) => t.id === id);

  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState(0);
  const [sosSent, setSosSent] = useState(false);
  const [shared, setShared] = useState(false);

  if (!trip) {
    return (
      <ThemedView style={[styles.container, styles.centerAll]}>
        <ThemedText themeColor="textSecondary">Trip not found.</ThemedText>
        <Button title="Go home" onPress={() => router.replace('/')} />
      </ThemedView>
    );
  }

  const isLive = ['finding', 'assigned', 'arrived', 'ongoing'].includes(trip.status);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {trip.status === 'cancelled' ? (
          <Card style={styles.statusCard}>
            <ThemedText style={styles.bigIcon}>❌</ThemedText>
            <ThemedText type="smallBold">Booking cancelled</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              No charge — the driver wasn’t dispatched yet.
            </ThemedText>
            <Button title="Back to home" onPress={() => router.replace('/')} />
          </Card>
        ) : trip.status === 'completed' ? (
          <>
            <Card style={styles.statusCard}>
              <ThemedText style={styles.bigIcon}>🎉</ThemedText>
              <ThemedText type="smallBold">Trip completed</ThemedText>
              <ThemedText type="subtitle" style={{ color: BRAND }}>
                {inr(trip.fare.total + tip)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Pay by cash, UPI or wallet
              </ThemedText>
              <ThemedText type="small" style={{ color: SUCCESS }}>
                🎥 Before & after car videos saved to this trip
              </ThemedText>
            </Card>

            <Card>
              <ThemedText type="smallBold">Rate {trip.driver?.name ?? 'your driver'}</ThemedText>
              <Row style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRating(star)}>
                    <ThemedText style={styles.star}>{star <= rating ? '⭐️' : '☆'}</ThemedText>
                  </Pressable>
                ))}
              </Row>
              <ThemedText type="smallBold">Add a tip</ThemedText>
              <View style={styles.chipRow}>
                {TIP_OPTIONS.map((t) => (
                  <Chip
                    key={t}
                    label={t === 0 ? 'No tip' : `₹${t}`}
                    selected={tip === t}
                    onPress={() => setTip(t)}
                  />
                ))}
              </View>
              <Button
                title="Done"
                disabled={rating === 0}
                onPress={() => {
                  finishTrip(trip.id, rating, tip);
                  router.replace('/');
                }}
              />
            </Card>
          </>
        ) : (
          <>
            <StatusHeader trip={trip} />

            {trip.driver && (
              <Card>
                <Row>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>
                      {trip.driver.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')}
                    </ThemedText>
                  </View>
                  <View style={styles.driverInfo}>
                    <ThemedText type="smallBold">{trip.driver.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      ⭐️ {trip.driver.rating} · {trip.driver.trips.toLocaleString('en-IN')} trips ·{' '}
                      {trip.driver.years} yrs exp
                    </ThemedText>
                    <ThemedText type="small" style={{ color: SUCCESS }}>
                      ✅ Police-verified · 🎥 records car videos
                    </ThemedText>
                  </View>
                </Row>
                <Row>
                  <Button title="📞 Call" small variant="secondary" onPress={() => {}} />
                  <Button title="💬 Chat" small variant="secondary" onPress={() => {}} />
                  <Button
                    title={shared ? 'Link copied ✓' : '📤 Share trip'}
                    small
                    variant="secondary"
                    onPress={() => setShared(true)}
                  />
                </Row>
              </Card>
            )}

            <Card>
              <ThemedText type="smallBold">Route</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                🟢 {trip.pickup}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                🔴 {trip.drop}
              </ThemedText>
              <Row>
                <ThemedText type="smallBold">Estimated fare</ThemedText>
                <ThemedText type="smallBold" style={{ color: BRAND }}>
                  {inr(trip.fare.total)}
                </ThemedText>
              </Row>
            </Card>

            {sosSent ? (
              <Card style={styles.sosCard}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  🆘 SOS sent — QuickDriver control room and your emergency contact have your live
                  location. Help is on the way.
                </ThemedText>
              </Card>
            ) : (
              <Button title="🆘 SOS — emergency" variant="danger" onPress={() => setSosSent(true)} />
            )}

            {isLive && trip.status === 'finding' && (
              <Button
                title="Cancel booking (free before dispatch)"
                variant="ghost"
                onPress={() => cancelTrip(trip.id)}
              />
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  centerAll: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  scrollView: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scroll: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  statusCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  bigIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  center: {
    textAlign: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  driverInfo: {
    flex: 1,
    gap: 2,
  },
  starRow: {
    justifyContent: 'center',
  },
  star: {
    fontSize: 32,
    lineHeight: 40,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sosCard: {
    backgroundColor: '#E92D3D',
  },
});
