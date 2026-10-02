import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CarVideoRecorder } from '@/components/car-video-recorder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRAND, Button, Card, DANGER, NAVY, Row, SUCCESS } from '@/components/ui/primitives';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { inr } from '@/lib/data';

const JOB = {
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

export default function DriverHomeScreen() {
  const theme = useTheme();
  const [stage, setStage] = useState<Stage>('offline');
  const [offerLeft, setOfferLeft] = useState(OFFER_SECONDS);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);
  const offerTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const alertSound = useAudioPlayer(require('@/assets/sounds/ride-alert.wav'));
  const tickSound = useAudioPlayer(require('@/assets/sounds/tick.wav'));

  const online = stage !== 'offline';

  // Ride-alert chime when the offer pops up
  useEffect(() => {
    if (stage !== 'offer') return;
    alertSound.seekTo(0);
    alertSound.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Tick every second while the offer countdown runs (urgent, Uber-style)
  useEffect(() => {
    if (stage !== 'offer' || offerLeft === OFFER_SECONDS) return;
    tickSound.seekTo(0);
    tickSound.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerLeft, stage]);

  // When going online, a job offer arrives shortly (mock dispatch).
  useEffect(() => {
    if (stage !== 'online') return;
    const t = setTimeout(() => {
      setOfferLeft(OFFER_SECONDS);
      setStage('offer');
    }, 4000);
    return () => clearTimeout(t);
  }, [stage]);

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

  const commission = Math.round(JOB.fare * 0.2);

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
                onValueChange={(v) => setStage(v ? 'online' : 'offline')}
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
                High demand in Vijay Nagar & Palasia right now 🔥
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
                    ⚡️ {JOB.service}
                  </ThemedText>
                  <View style={styles.offerTimerBadge}>
                    <ThemedText type="smallBold" style={{ color: NAVY }}>
                      {offerLeft}s
                    </ThemedText>
                  </View>
                </Row>

                <View style={styles.offerFareBlock}>
                  <ThemedText type="title" style={{ color: BRAND }}>
                    {inr(JOB.fare)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.offerText}>
                    {JOB.tripKm} km trip · ~{JOB.tripMin} min · cash/UPI
                  </ThemedText>
                </View>

                <View style={styles.offerRoute}>
                  <Row style={styles.offerRouteRow}>
                    <ThemedText type="smallBold" style={{ color: '#10B981' }}>
                      ●
                    </ThemedText>
                    <View style={styles.flexOne}>
                      <ThemedText type="smallBold" style={{ color: '#fff' }}>
                        {JOB.pickup}
                      </ThemedText>
                      <ThemedText type="small" style={styles.offerText}>
                        {JOB.pickupKm} km away · {JOB.pickupMin} min to pickup
                      </ThemedText>
                    </View>
                  </Row>
                  <Row style={styles.offerRouteRow}>
                    <ThemedText type="smallBold" style={{ color: '#E92D3D' }}>
                      ■
                    </ThemedText>
                    <View style={styles.flexOne}>
                      <ThemedText type="smallBold" style={{ color: '#fff' }}>
                        {JOB.drop}
                      </ThemedText>
                      <ThemedText type="small" style={styles.offerText}>
                        {JOB.customer} · ⭐️ {JOB.customerRating}
                      </ThemedText>
                    </View>
                  </Row>
                </View>

                <Button title={`Accept · ${offerLeft}s`} onPress={() => setStage('enroute')} />
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
                <ThemedText type="smallBold">{JOB.customer}</ThemedText>
                <ThemedText type="smallBold" style={{ color: BRAND }}>
                  {inr(JOB.fare)}
                </ThemedText>
              </Row>
              <ThemedText type="small" themeColor="textSecondary">
                🟢 {JOB.pickup}{'\n'}🔴 {JOB.drop}
              </ThemedText>
              <Row>
                <Button title="📞 Call" small variant="secondary" onPress={() => {}} />
                <Button title="🧭 Navigate" small variant="secondary" onPress={() => {}} />
              </Row>
            </Card>
          )}

          {stage === 'enroute' && (
            <Button title="I’ve arrived at pickup" onPress={() => setStage('arrived')} />
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
                  Wrong OTP — ask the customer again (demo: {JOB.otp})
                </ThemedText>
              )}
              <Button
                title="Start trip"
                disabled={otpInput.length !== 4}
                onPress={() => {
                  if (otpInput === JOB.otp) setStage('ongoing');
                  else setOtpError(true);
                }}
              />
            </Card>
          )}

          {stage === 'ongoing' && (
            <>
              <Card style={styles.videoCard}>
                <ThemedText style={styles.bigIcon}>🛣</ThemedText>
                <ThemedText type="smallBold">Trip in progress</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Drive safe — the customer can track you live.
                </ThemedText>
              </Card>
              <Button title="End trip" variant="danger" onPress={() => setStage('postVideo')} />
            </>
          )}

          {stage === 'postVideo' && (
            <CarVideoRecorder
              label="Post-trip car video (mandatory)"
              onDone={() => setStage('summary')}
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
                  <ThemedText type="smallBold">{inr(JOB.fare)}</ThemedText>
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
                    {inr(JOB.fare - commission)}
                  </ThemedText>
                </Row>
              </View>
              <ThemedText type="small" style={{ color: SUCCESS }}>
                🎥 Both car videos uploaded — dispute protection active
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
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  videoCard: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(12,17,28,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  offerSheet: {
    backgroundColor: NAVY,
    borderTopLeftRadius: Spacing.five,
    borderTopRightRadius: Spacing.five,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    overflow: 'hidden',
  },
  offerCountdownTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  offerCountdownFill: {
    height: 5,
    backgroundColor: BRAND,
  },
  offerService: {
    color: '#fff',
    letterSpacing: 0.5,
  },
  offerTimerBadge: {
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    minWidth: 52,
    alignItems: 'center',
  },
  offerFareBlock: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  offerRoute: {
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  offerRouteRow: {
    justifyContent: 'flex-start',
  },
  offerText: {
    color: 'rgba(255,255,255,0.8)',
  },
  bigIcon: {
    fontSize: 40,
    lineHeight: 48,
  },
  center: {
    textAlign: 'center',
  },
  flexOne: {
    flex: 1,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: DANGER,
  },
  otpInput: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontFamily: 'Outfit_600SemiBold',
  },
  summaryRows: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
});
