/**
 * Japa — a counting aid for a repeated phrase.
 *
 * Why it is not "a religious app": the mechanic is a counter and a haptic. Many traditions
 * count a repeated phrase on a mala of 108 beads, and a phone can hold the count, buzz at
 * each round and stay silent. It does not instruct anyone in a practice, does not choose
 * a phrase, and does not claim spiritual authority — you set the phrase, it counts.
 *
 * The counting rules that matter: a tap anywhere on the pad counts (eyes closed, one
 * thumb), the 108th tap is a different buzz, and rounds are kept so a long practice does
 * not have to be remembered.
 *
 * Two bugs are fixed in this version, and both were the difference between a demo and a tool:
 *
 *   * the bead count only lived in component state, so it was never written anywhere — the
 *     Progress page's Japa chart was empty no matter how many rounds were counted, and
 *     leaving the screen threw the round away. Beads now go through the shared store's
 *     counter, one bump per tap, and the bead position is *derived* from today's total
 *     (`countToday % 108`) rather than kept beside it, so there is only one number to trust.
 *   * the phrase was never read back — it was written to storage on submit and then shown as
 *     an empty string on the next launch. It now lives in settings, shared with the Profile
 *     page's "Your phrase", which is the same string.
 *
 * The phrase stays on the device. The counts and the finished rounds go to the database under
 * the install's random key — see the Profile page, which says so in full.
 *
 * ── Sound (this version) ─────────────────────────────────────────────────────────────
 *
 * Every bead now has a sound as well as a buzz, and the reason is how the screen is actually
 * used: eyes closed, one thumb, no way to see whether the tap landed. The haptic answers that
 * on the thumb; the cue answers it on the ear, which is the difference between a counter and a
 * mala. The cue is deliberately the shortest file in the wellness set — `lib/sound.ts` says
 * why — because it fires up to 108 times in a row, and a sound with a tail does not stay a
 * bead, it accumulates into a drone.
 *
 * One sound per tap, and a different one at the end of a round. The 108th plays `round` — the bead
 * struck twice over a low fifth — so the round *closes* instead of landing one more hit on top of
 * the last bead. Two transients on one beat is a flam, not a chime.
 *
 * That cue replaced a synthesized voice saying "round done", which was removed for sounding robotic
 * on a real phone. The double strike is arguably the better signal here: it is the same object hit
 * differently, which is exactly how somebody counting on a real mala knows without looking.
 *
 * The sound is a courtesy, never a rule. Nothing here is awaited, no cue is on a path that can
 * delay the store's `bump`, and `lib/sound.ts` swallows a device with no audio route — a phone
 * on silent, or in a pocket, still counts the beads exactly as it did before.
 *
 * ── Motion (this version) ────────────────────────────────────────────────────────────
 *
 * The number and the bar are honest but they are not readable with your eyes shut, so the ring
 * is the glance: 108 dots, the counted ones filled along the way, the bead the counter is on in
 * the accent, so "where am I in this round" is a shape rather than a number. It is drawn from
 * `count` — the one number the store keeps — and both the counter and the current bead swell
 * briefly on a tap, on the same beat, so the eye can catch the tap it just heard.
 *
 * Under Reduce Motion the two pops and the bar's easing are dropped. The ring stays, because it
 * is a static drawing of the count rather than an animation, and hiding it would remove
 * information instead of removing motion.
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { alpha, radius, space } from "@hermes/tokens";
import Svg, { Circle as SvgCircle, Path as SvgPath } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Button, Card, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { ProfileAction, WellnessShell } from "@/components/wellness-shell";
import { useWellnessStore } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { useReduceMotion } from "@/lib/motion";
import { useProductUI } from "@/lib/product-ui";
import { WELLNESS_CUES, isMuted, makeWellnessAudio, setMuted, useSoundPrefs } from "@/lib/sound";

const MALA = 108;

/**
 * The ring's geometry, in one place so the drawing, the dots and the pop cannot disagree.
 *
 * 232 is what is left of the pad's inner width on a 320pt-wide phone — the smallest screen this
 * ships to — after the shell's 16pt gutter and the pad's own 16pt of padding, with room to
 * spare. `RING_R` keeps 8pt back from the edge so the current bead, which swells when it pops,
 * never touches the pad's border.
 */
const RING = 232;
const RING_C = RING / 2;
const RING_R = RING / 2 - 8;
/** A counted bead, and a bead still to come: the same size, told apart by colour alone. */
const DOT_R = 2;
/** The bead the counter is on, drawn larger than the rest so it reads at arm's length. */
const BEAD_R = 3.2;
/** How far that bead swells on a tap — enough to catch the eye, not enough to be a bounce. */
const BEAD_POP = 1.5;
const TAU = Math.PI * 2;

/**
 * The 108 dot positions, worked out once when the module loads.
 *
 * Bead 0 sits at twelve o'clock and the ring runs clockwise, which is the way a round is
 * actually walked and the way the count climbs. A plain module constant rather than a `useMemo`
 * because nothing here can change: `count` only decides which of these fixed points is filled,
 * so re-deriving 108 pairs of cosines on every tap would be work for no answer.
 */
const BEAD_DOTS = Array.from({ length: MALA }, (_, i) => {
  const angle = (i / MALA) * TAU - Math.PI / 2;
  return {
    i,
    x: RING_C + RING_R * Math.cos(angle),
    y: RING_C + RING_R * Math.sin(angle),
  };
});

/** How far the number swells. Smaller than the bead's, because type is read, not felt. */
const COUNTER_POP = 1.12;

/** `<Circle r>` is the whole of the bead's animation, so one SVG primitive becomes animatable. */
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

export default function Japa() {
  const ui = useProductUI("japa");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("japa");
  const { settings, update } = useSettings();
  const reduceMotion = useReduceMotion();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  /**
   * The three players this screen can make a sound with: two cues and one phrase.
   *
   * One literal `useAudioPlayer` call each, in the component body, never in a loop or a
   * callback. The list of sounds a screen can make is code and not data, for the reason
   * `lib/sound.ts` argues at length — `["bead", "round"].map(...)` is a rules-of-hooks
   * violation whatever it is hidden behind, and a hook count that varies with a preference is
   * exactly the bug React cannot recover from.
   */
  const cueBead = useAudioPlayer(WELLNESS_CUES.bead);
  /* The round-complete cue: the bead struck twice over a low fifth. This is where the
     removed voice used to say "round done". */
  const cueRoundDone = useAudioPlayer(WELLNESS_CUES.round);

  const prefs = useSoundPrefs();

  /** All three sound layers off. What the header speaker draws itself from. */

  const muted = isMuted(prefs);

  /**
   * The audio behaviour, built once from the players and kept current by the effect below.
   *
   * `prefs` is deliberately not a dependency. Rebuilding the bank whenever somebody flips the
   * switch would replace every method with a fresh one, and a `tap()` that is halfway through an
   * `await` would be holding the old set; `syncPrefs` is the mechanism that makes a stale
   * reference behave correctly instead, so the switch is read at fire time and takes effect on
   * the very next bead.
   */
  const audio = useMemo(
    () =>
      makeWellnessAudio(
        { cues: { bead: cueBead, round: cueRoundDone } },
        prefs,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefs is pushed in via syncPrefs
    [cueBead, cueRoundDone],
  );

  useEffect(() => {
    audio.syncPrefs(prefs);
  }, [audio, prefs]);

  // One stored number, two readings of it: where we are in this round, and how many rounds.
  const count = store.countToday % MALA;
  const rounds = Math.floor(store.countToday / MALA);
  const beadsPct = Math.min(1, count / MALA);

  /**
   * The dot the counter is on: the bead the *next* tap will land, since `count` is how many are
   * already done. Fallen back to bead 0 rather than trusted blindly — this is an index into a
   * fixed array, and a screen that throws is worse than a ring that is briefly wrong.
   */
  const beadAt = BEAD_DOTS[count] ?? BEAD_DOTS[0];

  /**
   * The pop, triggered by the count rather than by the tap.
   *
   * `count` is the store's answer to what happened, so hanging the animation on it means the
   * pop follows the truth: it fires on a fast tap, on a tap that lands the 108th bead, and
   * backwards on a reset (which is why the ring visibly returns to the start). Two shared values
   * from one effect, because a number and a bead that swell together read as one movement and
   * staggered by even 60 ms they read as a glitch.
   *
   * The values are set to 1 before each sequence so a pop always plays from rest. Without that,
   * a rapid second tap interrupts a pop already halfway out and the swell is nearly invisible —
   * precisely on the fast counting where the feedback matters most.
   */
  const counterPop = useSharedValue(1);
  const beadPop = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      counterPop.value = 1;
      beadPop.value = 1;
      return;
    }
    counterPop.value = 1;
    beadPop.value = 1;
    counterPop.value = withSequence(
      withTiming(COUNTER_POP, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
    );
    beadPop.value = withSequence(
      withTiming(BEAD_POP, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
    );
  }, [count, reduceMotion, counterPop, beadPop]);

  const counterStyle = useAnimatedStyle(() => ({ transform: [{ scale: counterPop.value }] }));
  const beadProps = useAnimatedProps(() => ({ r: BEAD_R * beadPop.value }));

  /**
   * The bar, measured rather than written as a percentage.
   *
   * The fill is animated on the UI thread, and a percentage is a string — a number in points is
   * what a timing curve can interpolate. The measurement is taken once (the bar is 80% of the
   * pad, which does not change while the screen is open) and only the fill moves, so a tap
   * eases the bar forward instead of snapping the round's progress on.
   */
  const [barW, setBarW] = useState(0);
  const fillW = useSharedValue(0);

  useEffect(() => {
    const to = barW * beadsPct;
    fillW.value = reduceMotion
      ? to
      : withTiming(to, { duration: 240, easing: Easing.out(Easing.cubic) });
  }, [barW, beadsPct, reduceMotion, fillW]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillW.value }));

  async function tap() {
    // The next value comes back from the store, not from this render, so a fast sequence of
    // taps still lands the 108th bead on the click and not three taps later.
    const next = await store.bump(1);
    if (next > 0 && next % MALA === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // The round closing, not a louder bead. Neither call is awaited and neither can throw, so
      // the save below owns the rest of this branch on its own — the count is already written by
      // the bump above whatever the audio does.
      // Two strikes over a low fifth, which is how somebody counting with their eyes closed knows
      // the round closed. This is what replaced the spoken "round done".
      audio.cue("round");
      await store.save({
        at: Date.now(),
        screen: "japa",
        minutes: 0,
        units: 1,
        label: `Round ${next / MALA} of ${MALA}`,
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      audio.cue("bead");
    }
  }

  /** Back to the start of this round — the beads already counted today are not thrown away. */
  async function resetBead() {
    if (count > 0) await store.bump(-count);
  }

  return (
    <WellnessShell
      product="japa"
      title="Japa"
      lead="A counter for a repeated phrase. 108 beads a round, one buzz each, a different buzz at the end of a round."
      tabBar={false}
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
      headerAction={
        <View style={s.headActions}>
          {/* The sound control sits in the header, in reach, rather than only on the Profile
              page: the moment somebody wants this screen quiet is the moment it is counting. It is
              a master mute — this screen speaks a round, so silencing only the beads would leave
              it talking, which is the bug the first version of this control shipped with. */}
          <SoundToggle
            muted={muted}
            onPress={() => {
              // Feedback for the control itself, and only when un-muting: confirming "muted" with
              // a sound is the one joke a mute button must not make.
              if (muted) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setMuted(update, !muted);
            }}
          />
          <ProfileAction />
        </View>
      }
    >
      {/* The pad is the product: it fills the space a hand covers so the screen can be
          used without looking at it. */}
      <Pressable
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel={`Count one. Bead ${count + 1} of ${MALA}`}
        style={[s.pad, { borderColor: ui.accent }]}
      >
        {/* The mala. Hidden from a screen reader because the pad above already says the position
            in words, and untouchable so no dot can ever eat a tap meant for the pad — the whole
            surface has to count, including the ring. */}
        <View style={s.ringWrap} pointerEvents="none">
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            {BEAD_DOTS.map((dot) => (
              <SvgCircle
                key={dot.i}
                cx={dot.x}
                cy={dot.y}
                r={DOT_R}
                // Faint for the beads still to come, a soft wash of the accent for the ones
                // counted. Two quiet greys would say "filled in" without saying "progress";
                // full accent on every counted bead would turn the ring into a decoration.
                fill={dot.i < count ? alpha(ui.accent, 0.45) : alpha(ui.faint, 0.55)}
              />
            ))}
            {/* The bead the counter is on, drawn last so it sits over its neighbours, and the
                only animated circle in the ring: 108 animated nodes would be 108 native drivers
                woken on every tap to move one dot. */}
            <AnimatedCircle
              cx={beadAt.x}
              cy={beadAt.y}
              r={BEAD_R}
              fill={ui.accent}
              animatedProps={beadProps}
            />
          </Svg>
          <Animated.View style={counterStyle}>
            <Text variant="hero" style={{ color: ui.accent }}>{count}</Text>
          </Animated.View>
        </View>

        <Text variant="meta" tone="ink2">{count === 0 ? "Tap anywhere to count" : `bead ${count} of ${MALA}`}</Text>
        <View style={s.bar} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
          <Animated.View style={[s.fill, fillStyle]} />
        </View>
        <Text variant="meta" tone="ink3">
          {rounds > 0
            ? `${rounds} round${rounds > 1 ? "s" : ""} done today · ${store.countToday} beads`
            : `${store.countToday} bead${store.countToday === 1 ? "" : "s"} today`}
        </Text>
      </Pressable>

      <View style={s.row}>
        <Button title="Reset bead" variant="ghost" onPress={resetBead} />
        <Button
          title={editing ? "Done" : "Set phrase"}
          variant="ghost"
          onPress={() => {
            setDraft(settings.phrase);
            setEditing((v) => !v);
          }}
        />
      </View>

      {editing ? (
        <Card style={s.card}>
          <Text variant="meta" tone="ink2">Your phrase, kept on this device only:</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="the words you repeat"
            placeholderTextColor={ui.faint}
            onSubmitEditing={() => {
              update({ phrase: draft.trim() });
              setEditing(false);
            }}
            style={[s.input, { color: ui.ink, borderColor: ui.hairline }]}
          />
        </Card>
      ) : settings.phrase ? (
        <Text variant="callout" tone="ink2" style={s.phrase}>{settings.phrase}</Text>
      ) : null}

      <Card style={s.card}>
        <Text variant="title3">What this is</Text>
        <Text variant="meta" tone="ink2">
          A counter with a haptic and a bead you can hear, and nothing else. It does not teach a
          practice, choose words for you, or speak for any tradition. Your phrase never leaves
          this phone; the bead count and the rounds you finish are backed up under a random key
          this phone made, with no account attached to it.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>
      <InsightPanel screen="japa" unitsLabel="beads" counts={store.countHistory} dailyGoal={MALA} />
    </WellnessShell>
  );
}

/* ── The sound control ───────────────────────────────────────────────────────────────── */

/**
 * The one-tap mute in the header.
 *
 * It toggles *cues* rather than every sound layer, because a cue is the layer that carries the
 * information — whether the tap landed — and it is the one somebody reaches for while the screen
 * is running. The full set of switches lives on the Profile page, which is the page that
 * explains them.
 */
function SoundToggle({ muted, onPress }: { muted: boolean; onPress: () => void }) {
  const ui = useProductUI("japa");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: muted }}
      accessibilityLabel={
        muted
          ? "Sound is muted. Tap to turn the bead sound back on."
          : "Sound is on. Tap to mute the bead sound."
      }
      hitSlop={10}
      style={[
        s0.toggle,
        { borderColor: muted ? ui.hairline : alpha(ui.accent, 0.5), backgroundColor: muted ? "transparent" : ui.accentTint },
      ]}
    >
      <SpeakerGlyph color={muted ? ui.faint : ui.accent} muted={muted} />
    </Pressable>
  );
}

/**
 * A speaker mark: a cone and two arcs, or a cone and a stroke through it when muted.
 *
 * Hand-drawn in this file rather than imported from the Breathe screen or added to
 * `components/icons.tsx`. Breathe has its own copy on purpose — it is the only other screen that
 * wants one — and a cross-screen import would make the two screens change together forever for
 * the sake of twelve lines of path. The shared icon set stays small; a shared icon nobody shares
 * is just a longer list to read.
 */
function SpeakerGlyph({ color, muted }: { color: string; muted: boolean }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The cone: one closed path, so the speaker reads at 20pt. */}
      <SvgPath d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z" />
      {muted ? (
        <SvgPath d="M16 9.5l4 5M20 9.5l-4 5" />
      ) : (
        <>
          <SvgPath d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          <SvgPath d="M18.2 6.8a7.6 7.6 0 0 1 0 10.4" />
        </>
      )}
    </Svg>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    pad: {
      borderWidth: 2,
      borderRadius: radius.xl,
      paddingVertical: space.xxl,
      paddingHorizontal: space.base,
      alignItems: "center",
      gap: 6,
      minHeight: 240,
      justifyContent: "center",
    },
    // A square the ring's own geometry fills: the SVG is absolutely positioned inside it and the
    // number is its one centred child, so the bead the counter is on and the digits share a
    // centre whatever the type scale does.
    ringWrap: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
    headActions: { flexDirection: "row", alignItems: "center", gap: space.xs },
    bar: { height: 4, width: "80%", borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: space.sm },
    fill: { height: 4, backgroundColor: ui.accent },
    row: { flexDirection: "row", gap: space.sm, marginTop: space.base },
    card: { marginTop: space.base, gap: 6 },
    input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
    phrase: { marginTop: space.base },
  });
}

/**
 * The styles that do not depend on the palette, kept out of `makeStyles` so they can live at
 * module scope and are not rebuilt on a theme change.
 */
const s0 = StyleSheet.create({
  // 40 is the floor the touch rules set here; `hitSlop` takes it past the 44pt platform minimum
  // without drawing a circle that is wider than the glyph inside it.
  toggle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
