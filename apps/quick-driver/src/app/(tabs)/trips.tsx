import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Trip, TripStatus, useApp } from '@/lib/app-context';
import { inr } from '@/lib/data';

const STATUS_LABEL: Record<TripStatus, string> = {
  finding: 'Finding driver',
  assigned: 'Driver on the way',
  arrived: 'Driver arrived',
  ongoing: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function statusColor(status: TripStatus) {
  if (status === 'completed') return SUCCESS;
  if (status === 'cancelled') return '#E92D3D';
  return '#F5A623';
}

function TripCard({ trip, onPress }: { trip: Trip; onPress?: () => void }) {
  const date = new Date(trip.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card>
        <Row>
          <ThemedText type="smallBold">{trip.serviceTitle}</ThemedText>
          <ThemedText type="smallBold" style={{ color: statusColor(trip.status) }}>
            {STATUS_LABEL[trip.status]}
          </ThemedText>
        </Row>
        <ThemedText type="small" themeColor="textSecondary">
          {trip.pickup} → {trip.drop}
        </ThemedText>
        <Row>
          <ThemedText type="small" themeColor="textSecondary">
            {date}
            {trip.driver ? ` · ${trip.driver.name}` : ''}
            {trip.rating ? ` · ${'⭐️'.repeat(trip.rating)}` : ''}
          </ThemedText>
          <ThemedText type="smallBold">{inr(trip.fare.total)}</ThemedText>
        </Row>
        {trip.status === 'completed' && trip.videoBefore && trip.videoAfter && (
          <ThemedText type="small" themeColor="textSecondary">
            🎥 Car condition videos on file (before & after trip)
          </ThemedText>
        )}
      </Card>
    </Pressable>
  );
}

export default function TripsScreen() {
  const router = useRouter();
  const { trips, activeTrip } = useApp();
  const past = trips.filter((t) => t.id !== activeTrip?.id);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedText type="subtitle">Your trips</ThemedText>

          {activeTrip && (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                ACTIVE
              </ThemedText>
              <TripCard
                trip={activeTrip}
                onPress={() =>
                  router.push({ pathname: '/booking/trip', params: { id: activeTrip.id } })
                }
              />
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              HISTORY
            </ThemedText>
            {past.length === 0 ? (
              <ThemedText themeColor="textSecondary">No past trips yet.</ThemedText>
            ) : (
              past.map((trip) => <TripCard key={trip.id} trip={trip} />)
            )}
          </View>
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
  section: {
    gap: Spacing.two,
  },
  label: {
    letterSpacing: 1,
  },
});
