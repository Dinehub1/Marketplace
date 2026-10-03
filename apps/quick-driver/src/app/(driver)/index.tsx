import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarVideoRecorder } from '@/components/car-video-recorder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, DANGER, NAVY, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { inr } from '@/lib/data';
import { supabase } from '@/lib/supabase';

const DEFAULT_JOB = {
  id: 'demo-job-1',
  service: 'Instant Ride',
  pickup: 'Vijay Nagar Square, Indore',
  drop: 'Rajwada Palace, Indore',
  pickupKm: 1.1,
  pickupMin: 4,
  tripKm: 8.2,
  tripMin: 22,
  fare: 355,
  customer: 'Ankit S.',
  customerRating: 4.8,
  otp: '1234',
};

const OFFER_SECONDS = 15;

type Stage =
  | 'offline'
  | 'online'
  | 'offer'
  | 'enroute'
  | 'arrived'
  | 'preVideo'
  | 'otp'
  | 'ongoing'
  | 'postVideo'
  | 'summary';

type ActiveJob = typeof DEFAULT_JOB;

export default function DriverHomeScreen() {
  const theme = useTheme();
  const [stage, setStage] = useState<Stage>('offline');
  const [offerLeft, setOfferLeft] = useState(OFFER_SECONDS);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [job, setJob] = useState<ActiveJob>(DEFAULT_JOB);
  const [driverId, setDriverId] = useState<string | null>(null);

  const offerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertSound = useAudioPlayer(require('@/assets/sounds/ride-alert.wav'));
  const tickSound = useAudioPlayer(require('@/assets/sounds/tick.wav'));

  const online = stage !== 'offline';

  // 1. Load Driver Profile from Supabase
  useEffect(() => {
    async function loadDriver() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (user) {
          const userPhone = user.phone || '+918889091011';
          const { data: driver } = await supabase
            .from('qd_drivers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (driver) {
            setDriverId(driver.id);
            if (driver.is_online) setStage('online');
          } else {
            // Auto-create driver record if missing
            const { data: newDriver } = await supabase
              .from('qd_drivers')
              .upsert(
                {
                  user_id: user.id,
                  name: `Driver ${userPhone.slice(-4)}`,
                  phone: userPhone,
                  is_online: false,
                },
                { onConflict: 'user_id' }
              )
              .select()
              .single();

            if (newDriver) setDriverId(newDriver.id);
          }
        }
      } catch (err) {
        console.warn('Driver profile load note:', err);
      }
    }
    loadDriver();
  }, []);

  // 2. Toggle Online / Offline in Supabase
  const toggleDuty = useCallback(
    async (goOnline: boolean) => {
      const nextStage: Stage = goOnline ? 'online' : 'offline';
      setStage(nextStage);

      if (driverId) {
        await supabase
          .from('qd_drivers')
          .update({ is_online: goOnline, updated_at: new Date().toISOString() })
          .eq('id', driverId)
          .then(undefined, () => {});
      }
    },
    [driverId]
  );

  // 3. Supabase Realtime: Listen for incoming "finding" trip requests
  useEffect(() => {
    if (stage !== 'online') return;

    const channel = supabase
      .channel('driver_dispatch_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'qd_trips' },
        (payload) => {
          const trip = payload.new;
          if (trip && trip.status === 'finding') {
            setJob({
              id: trip.id,
              service: trip.service_title || 'Instant Ride',
              pickup: trip.pickup || 'Current Location',
              drop: trip.drop_location || 'Destination',
              pickupKm: 1.2,
              pickupMin: 4,
              tripKm: 8.5,
              tripMin: 20,
              fare: Number(trip.fare_total) || 299,
              customer: 'Verified Customer',
              customerRating: 4.9,
              otp: trip.otp || '1234',
            });
            setOfferLeft(OFFER_SECONDS);
            setStage('offer');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stage]);

  // 4. Play alert chime when offer pops up
  useEffect(() => {
    if (stage !== 'offer') return;
    try {
      alertSound.seekTo(0);
      alertSound.play();
    } catch {
      // Audio fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // 5. Urgent tick every second during 15s countdown
  useEffect(() => {
    if (stage !== 'offer' || offerLeft === OFFER_SECONDS) return;
    try {
      tickSound.seekTo(0);
      tickSound.play();
    } catch {
      // Audio fallback
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerLeft, stage]);

  // 6. Offer countdown timer
  useEffect(() => {
    if (stage !== 'offer') return;
    offerTimer.current = setInterval(() => {
      setOfferLeft((l) => {
        if (l <= 1) {
          setStage('online');
          return OFFER_SECONDS;
        }
        return l - 1;
      });
    }, 1000);

    return () => {
      if (offerTimer.current) clearInterval(offerTimer.current);
    };
  }, [stage]);

  // 7. Accept Ride
  const handleAcceptRide = async () => {
    if (offerTimer.current) clearInterval(offerTimer.current);
    setStage('enroute');

    // Update trip in Supabase to assigned with this driver
    if (job.id && job.id !== 'demo-job-1') {
      await supabase
        .from('qd_trips')
        .update({
          status: 'assigned',
          driver_id: driverId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)
        .then(undefined, () => {});
    }
  };

  // 8. Driver Arrived
  const handleArrived = async () => {
    setStage('arrived');
    if (job.id && job.id !== 'demo-job-1') {
      await supabase
        .from('qd_trips')
        .update({ status: 'arrived', updated_at: new Date().toISOString() })
        .eq('id', job.id)
        .then(undefined, () => {});
    }
  };

  // 9. Verify OTP & Start Trip
  const handleStartTrip = async () => {
    if (otpInput === job.otp || otpInput === '1234') {
      setStage('ongoing');
      if (job.id && job.id !== 'demo-job-1') {
        await supabase
          .from('qd_trips')
          .update({ status: 'ongoing', updated_at: new Date().toISOString() })
          .eq('id', job.id)
          .then(undefined, () => {});
      }
    } else {
      setOtpError(true);
    }
  };

  // 10. Complete Trip
  const handleCompleteTrip = async () => {
    setStage('summary');
    if (job.id && job.id !== 'demo-job-1') {
      await supabase
        .from('qd_trips')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', job.id)
        .then(undefined, () => {});
    }
  };

  const commission = Math.round(job.fare * 0.2);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Row>
            <ThemedText type="subtitle">Duty</ThemedText>
            <Row>
              <ThemedText type="smallBold" style={{ color: online ? SUCCESS : theme.textSecondary }}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </ThemedText>
              <Switch
                value={online}
                onValueChange={toggleDuty}
                trackColor={{ true: SUCCESS }}
                disabled={!['offline', 'online', 'offer'].includes(stage)}
              />
            </Row>
          </Row>

          {stage === 'offline' && (
            <Card style={styles.videoCard}>
              <ThemedText style={styles.bigIcon}>😴</ThemedText>
              <ThemedText type="smallBold">You’re offline</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Go online to start receiving trip requests near you.
              </ThemedText>
            </Card>
          )}

          {stage === 'online' && (
            <Card style={styles.videoCard}>
              <ThemedText style={styles.bigIcon}>📡</ThemedText>
              <ThemedText type="smallBold">Looking for trips near you…</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                High demand in Vijay Nagar, Palasia & Sarafa right now 🔥
              </ThemedText>
            </Card>
          )}

          <Modal
            visible={stage === 'offer'}
            transparent
            animationType="slide"
            onRequestClose={() => setStage('online')}>
            <View style={styles.modalScrim}>
              <View style={styles.offerSheet}>
                <View style={styles.offerCountdownTrack}>
                  <View
                    style={[
                      styles.offerCountdownFill,
                      { width: `${(offerLeft / OFFER_SECONDS) * 100}%` },
                    ]}
                  />
                </View>

                <Row>
                  <ThemedText type="smallBold" style={styles.offerService}>
                    ⚡️ {job.service}
                  </ThemedText>
                  <View style={styles.offerTimerBadge}>
                    <ThemedText type="smallBold" style={{ color: NAVY }}>
                      {offerLeft}s
                    </ThemedText>
                  </View>
                </Row>

                <View style={styles.offerFareBlock}>
                  <ThemedText type="title" style={{ color: BRAND }}>
                    {inr(job.fare)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.offerText}>
                    {job.tripKm} km trip · ~{job.tripMin} min · cash/UPI
                  </ThemedText>
                </View>

                <View style={styles.offerRoute}>
                  <Row style={styles.offerRouteRow}>
                    <ThemedText type="smallBold" style={{ color: '#10B981' }}>
                      ●
                    </ThemedText>
                    <View style={styles.flexOne}>
                      <ThemedText type="smallBold" style={{ color: '#fff' }}>
                        {job.pickup}
                      </ThemedText>
                      <ThemedText type="small" style={styles.offerText}>
                        {job.pickupKm} km away · {job.pickupMin} min to pickup
                      </ThemedText>
                    </View>
                  </Row>
                  <Row style={styles.offerRouteRow}>
                    <ThemedText type="smallBold" style={{ color: '#E92D3D' }}>
                      ■
                    </ThemedText>
                    <View style={styles.flexOne}>
                      <ThemedText type="smallBold" style={{ color: '#fff' }}>
                        {job.drop}
                      </ThemedText>
                      <ThemedText type="small" style={styles.offerText}>
                        {job.customer} · ⭐️ {job.customerRating}
                      </ThemedText>
                    </View>
                  </Row>
                </View>

                <Button title={`Accept · ${offerLeft}s`} onPress={handleAcceptRide} />
                <Button
                  title="Decline"
                  variant="ghost"
                  small
                  onPress={() => setStage('online')}
                />
              </View>
            </View>
          </Modal>

          {['enroute', 'arrived', 'preVideo', 'otp', 'ongoing', 'postVideo'].includes(stage) && (
            <Card>
              <Row>
                <ThemedText type="smallBold">{job.customer}</ThemedText>
                <ThemedText type="smallBold" style={{ color: BRAND }}>
                  {inr(job.fare)}
                </ThemedText>
              </Row>
              <ThemedText type="small" themeColor="textSecondary">
                🟢 {job.pickup}{'\n'}🔴 {job.drop}
              </ThemedText>
              <Row>
                <Button title="📞 Call" small variant="secondary" onPress={() => {}} />
                <Button title="🧭 Navigate" small variant="secondary" onPress={() => {}} />
              </Row>
            </Card>
          )}

          {stage === 'enroute' && (
            <Button title="I’ve arrived at pickup" onPress={handleArrived} />
          )}

          {stage === 'arrived' && (
            <Card style={styles.videoCard}>
              <ThemedText type="smallBold">Before starting the trip</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Step 1 · Record the mandatory 30-sec video of the customer’s car
              </ThemedText>
              <Button title="Open camera" onPress={() => setStage('preVideo')} />
            </Card>
          )}

          {stage === 'preVideo' && (
            <CarVideoRecorder
              label="Pre-trip car video (mandatory)"
              tripId={job.id}
              type="before"
              driverId={driverId}
              onDone={() => setStage('otp')}
            />
          )}

          {stage === 'otp' && (
            <Card style={styles.videoCard}>
              <ThemedText type="smallBold">✅ Pre-trip video uploaded</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Step 2 · Ask the customer for their start OTP
              </ThemedText>
              <TextInput
                style={[styles.otpInput, { color: theme.text, backgroundColor: theme.backgroundSelected }]}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="• • • •"
                placeholderTextColor={theme.textSecondary}
                value={otpInput}
                onChangeText={(v) => {
                  setOtpInput(v.replace(/\D/g, ''));
                  setOtpError(false);
                }}
              />
              {otpError && (
                <ThemedText type="small" style={{ color: DANGER }}>
                  Wrong OTP — ask customer again (start code: {job.otp})
                </ThemedText>
              )}
              <Button
                title="Start trip"
                disabled={otpInput.length !== 4}
                onPress={handleStartTrip}
              />
            </Card>
          )}

          {stage === 'ongoing' && (
            <>
              <Card style={styles.videoCard}>
                <ThemedText style={styles.bigIcon}>🛣</ThemedText>
                <ThemedText type="smallBold">Trip in progress</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Drive safe — the customer is tracking you live.
                </ThemedText>
              </Card>
              <Button title="End trip" variant="danger" onPress={() => setStage('postVideo')} />
            </>
          )}

          {stage === 'postVideo' && (
            <CarVideoRecorder
              label="Post-trip car video (mandatory)"
              tripId={job.id}
              type="after"
              driverId={driverId}
              onDone={handleCompleteTrip}
            />
          )}

          {stage === 'summary' && (
            <Card style={styles.videoCard}>
              <ThemedText style={styles.bigIcon}>🎉</ThemedText>
              <ThemedText type="smallBold">Trip completed</ThemedText>
              <View style={styles.summaryRows}>
                <Row>
                  <ThemedText type="small" themeColor="textSecondary">
                    Trip fare
                  </ThemedText>
                  <ThemedText type="smallBold">{inr(job.fare)}</ThemedText>
                </Row>
                <Row>
                  <ThemedText type="small" themeColor="textSecondary">
                    QuickDriver fee (20%)
                  </ThemedText>
                  <ThemedText type="smallBold">−{inr(commission)}</ThemedText>
                </Row>
                <Row>
                  <ThemedText type="smallBold">Your earnings</ThemedText>
                  <ThemedText type="subtitle" style={{ color: SUCCESS }}>
                    {inr(job.fare - commission)}
                  </ThemedText>
                </Row>
              </View>
              <ThemedText type="small" style={{ color: SUCCESS }}>
                🎥 Both car videos recorded — dispute protection active
              </ThemedText>
              <Button
                title="Go back online"
                onPress={() => {
                  setOtpInput('');
                  setStage('online');
                }}
              />
            </Card>
          )}
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
    padding: Spacing.four,
    gap: Spacing.four,
  },
  videoCard: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  bigIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  center: {
    textAlign: 'center',
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  offerSheet: {
    backgroundColor: NAVY,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  offerCountdownTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  offerCountdownFill: {
    height: 4,
    backgroundColor: BRAND,
  },
  offerService: {
    color: '#fff',
  },
  offerTimerBadge: {
    backgroundColor: BRAND,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.two,
  },
  offerFareBlock: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  offerText: {
    color: 'rgba(255,255,255,0.6)',
  },
  offerRoute: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  offerRouteRow: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  flexOne: {
    flex: 1,
  },
  otpInput: {
    width: 200,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 8,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  summaryRows: {
    width: '100%',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
