/**
 * Water — today's glasses, counted in taps.
 *
 * A counter, not a coach. The honest version of a hydration app says what it measures and
 * refuses to invent a medical target: there is no single "right" number of glasses that
 * applies to everybody, so the target here is a setting, not a prescription.
 *
 * Works with no signal, costs nothing, and resets with the date — because "glasses today"
 * is the only number that ever changes anyone's behaviour.
 *
 * ── Sound and motion (this version) ───────────────────────────────────────────────────
 *
 * The two taps sound different on purpose. Adding a glass is a **drop landing in water** — a
 * physical effect with no melody in it, because a tally is not an achievement. Taking one
 * back is the **tick**, the lower and quieter of the two, because an undo is a correction
 * and dressing it up as a win would be a small lie. Both cues are synthesized in this repo
 * (`lib/sound.ts`), so they need no network and no permission, and they obey the ringer
 * switch rather than playing over somebody's silence.
 *
 * The motion is calibrated to the same idea: the number pops once when it changes, the bar
 * eases to its new width, and a newly filled square fades in. Each of those says *this*
 * glass arrived rather than that the screen redrew. Under Reduce Motion every value still
 * changes; none of them travel.
 */
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import { alpha, radius, space } from "@hermes/tokens";
import Svg, { Path as SvgPath } from "react-native-svg";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Button, Card, Press, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { useSettings } from "@/lib/settings";
import { ProfileAction, WellnessShell } from "@/components/wellness-shell";
import { useReduceMotion } from "@/lib/motion";
import { useWellnessStore } from "@/lib/session";
import { WELLNESS_CUES, isMuted, makeWellnessAudio, setMuted, useSoundPrefs } from "@/lib/sound";
import { useProductUI } from "@/lib/product-ui";

// The default, used until the Profile page's setting loads. One number, one owner:
// the setting, so the screen, the glasses and the chart always agree.
const DEFAULT_TARGET = 8;

export default function Water() {
  const ui = useProductUI("water");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("water");
  const { settings, update } = useSettings();
  const reduceMotion = useReduceMotion();
  const done = store.countToday;
  const target = settings.waterGoal || DEFAULT_TARGET;
  const pct = Math.min(1, done / target);

  /**
   * The cue players, one literal `useAudioPlayer` call each.
   *
   * Two calls rather than a list, because a hook's call count has to be fixed for the life of
   * the screen — `WELLNESS_CUES` is data, so loading it in a loop is the rules-of-hooks
   * violation `lib/sound.ts` documents at length. `drop` is the glass landing; `tick` is the
   * lower cue the undo uses below.
   */
  const prefs = useSoundPrefs();
  /** All three sound layers off. What the header speaker draws itself from. */
  const muted = isMuted(prefs);
  const cueDrop = useAudioPlayer(WELLNESS_CUES.drop);
  const cueTick = useAudioPlayer(WELLNESS_CUES.tick);

  /**
   * The audio bank, built once from the players and kept current by the effect under it.
   *
   * `useMemo` depends on the *players* (stable) and not on `prefs` (a fresh object every
   * render), so the bank is not rebuilt on a toggle — which is what lets a press handler hold
   * `audio.cue` without it changing identity. The preferences are pushed in instead.
   */
  const audio = useMemo(
    () => makeWellnessAudio({ cues: { drop: cueDrop, tick: cueTick } }, prefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefs is pushed in via syncPrefs
    [cueDrop, cueTick],
  );

  useEffect(() => {
    audio.syncPrefs(prefs);
  }, [audio, prefs]);

  /* ── The motion ─────────────────────────────────────────────────────────────────────
     Three values, each answering one question: did the number change (and is it allowed to
     move), where is the bar, and where is the press. All of them are dropped to their end
     values under Reduce Motion — the screen keeps telling the truth, it just does not move
     to say it.                                                                          */
  const countPop = useSharedValue(1);
  const barW = useSharedValue(pct);

  /**
   * A change in the count, from whichever direction.
   *
   * The number is animated from the count rather than from the button, so the pop describes
   * the glass and not the tap: it fires for a change however it arrived. The first value the
   * store settles on is the one it read from the device cache, and adopting that without
   * motion is what keeps the pop meaning "a glass just landed" rather than "the screen
   * finished loading".
   */
  const settled = useRef(false);
  const prevDone = useRef(done);

  useEffect(() => {
    if (!store.ready) return;
    const first = !settled.current;
    settled.current = true;

    // The bar is the element that must never lie, so under Reduce Motion it is set outright
    // rather than left in flight. 320ms is long enough to read as travel and short enough to
    // be finished before the next tap on any thumb.
    barW.value =
      first || reduceMotion
        ? pct
        : withTiming(pct, { duration: 320, easing: Easing.out(Easing.cubic) });

    if (!first && !reduceMotion && done > prevDone.current) {
      // 1.12 and back, on a timing curve rather than a spring: the number is confirming a tap,
      // not celebrating one, and a spring here is what would make it bounce.
      countPop.value = withSequence(
        withTiming(1.12, { duration: 110, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
      );
    }
    prevDone.current = done;
  }, [done, pct, store.ready, reduceMotion, barW, countPop]);

  const countStyle = useAnimatedStyle(() => ({ transform: [{ scale: countPop.value }] }));

  /**
   * The bar's fill, as a percentage of its track.
   *
   * A percentage rather than a pixel width because the track's width is a layout fact this
   * screen never measures: the fill is correct at every frame and on every screen size, and a
   * rotation recomputes it without the screen knowing anything about it. The cast is only
   * because a worklet's interpolation is typed as plain `string` while `width` wants the
   * literal `\`${number}%\`` shape.
   */
  const fillStyle = useAnimatedStyle(() => ({
    width: `${barW.value * 100}%` as `${number}%`,
  }));

  /* The count moves first so the ring, the squares and the number all redraw on the frame the
     sound arrives; the cue is feedback for a tap that has already happened. `bump` is
     fire-and-forget by contract — awaiting it would put a write to storage between the tap and
     the screen's response. */
  function addGlass() {
    void store.bump(1);
    audio.cue("drop");
  }

  function removeGlass() {
    void store.bump(-1);
    // The same gesture, the other direction: the tick, not the drop. Removing a glass is an
    // undo, so it gets the cue with no rise in it.
    audio.cue("tick");
  }

  return (
    <WellnessShell
      product="water"
      title="Water"
      lead="Tap once per glass. The count resets when the date does."
      tabBar={false}
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
      headerAction={
        <View style={s.headActions}>
          {/* In the header, not only in settings: the moment somebody wants this screen quiet is
              the moment they are using it. It is a master mute rather than a cue switch, so it
              silences the voice and the bed on the other screens too — one speaker icon that means
              one thing across the family. */}
          <SoundToggle muted={muted} onPress={() => setMuted(update, !muted)} />
          <ProfileAction />
        </View>
      }
    >
      <Card style={s.big}>
        <Text variant="caption" tone="ink3">TODAY</Text>
        {/* The wrapper does not stretch: a transform on a full-width row would scale around
            the card's centre and slide the number sideways as it pops. */}
        <Animated.View style={[s.countWrap, countStyle]}>
          <Text variant="hero" style={{ color: ui.accent }}>{done}</Text>
        </Animated.View>
        <Text variant="meta" tone="ink2">of {target} glasses — a setting you can keep to yourself</Text>
        <View style={s.bar}>
          <Animated.View style={[s.fill, fillStyle]} />
        </View>
        <View style={s.glasses}>
          {/* No hook in this loop — the rule `lib/sound.ts` was written around. Mounting is the
              animation: a square that becomes filled is a new element, so its fade starts from
              nothing instead of the style change having already painted once at full strength.
              `entering` is a prop, and `reduceMotion` decides whether there is any at all. */}
          {Array.from({ length: target }).map((_, i) =>
            i < done ? (
              <Animated.View
                key={i}
                entering={reduceMotion ? undefined : FadeIn.duration(240)}
                style={[s.glass, { backgroundColor: ui.accent, borderColor: ui.accent }]}
              />
            ) : (
              <View key={i} style={[s.glass, { borderColor: ui.hairline }]} />
            ),
          )}
        </View>
      </Card>

      {/* Two 64-point targets, side by side: the thumb is the input device, so the
          buttons are the size of a thumb, not the size of the label. `Press` is the shared
          pressable, so the plus and the minus give the same 0.965 press-in as every other
          control in the app instead of a second, slightly different one. */}
      <View style={s.actions}>
        <Press
          onPress={removeGlass}
          accessibilityRole="button"
          accessibilityLabel="Remove one glass"
          style={[s.step, { borderColor: ui.hairline }]}
        >
          <Text variant="title1" tone="ink2">−</Text>
        </Press>
        <Press
          onPress={addGlass}
          accessibilityRole="button"
          accessibilityLabel="Add one glass"
          style={[s.step, s.stepMain, { backgroundColor: ui.accent }]}
        >
          <Text variant="title2" style={{ color: "#fff" }}>Add a glass</Text>
        </Press>
      </View>

      <Card style={s.info}>
        <Text variant="title3">What this is not</Text>
        <Text variant="meta" tone="ink2">
          Not medical advice. There is no single correct number of glasses for everyone — age,
          weather, activity and health conditions all change it. If you have a heart or kidney
          condition, follow your doctor&apos;s number instead of this one.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>
      <InsightPanel screen="water" unitsLabel="glasses" counts={store.countHistory} dailyGoal={target} />
    </WellnessShell>
  );
}

/* ── The sound control ───────────────────────────────────────────────────────────────── */

/**
 * The header's one-tap mute.
 *
 * It toggles *cues* and nothing else, because cues are all this screen plays — there is no
 * voice and no bed here, so a settings card with three switches would be two switches that do
 * nothing. The label states the state and the action, since a switch whose only readout is a
 * small glyph is a switch somebody has to guess at.
 */
function SoundToggle({ muted, onPress }: { muted: boolean; onPress: () => void }) {
  const ui = useProductUI("water");
  return (
    <Press
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: muted }}
      accessibilityLabel={
        muted
          ? "Sound is muted. Tap to turn the glass sound back on."
          : "Sound is on. Tap to mute the glass sound."
      }
      hitSlop={10}
      style={[
        s0.toggle,
        {
          borderColor: muted ? ui.hairline : alpha(ui.accent, 0.5),
          backgroundColor: muted ? "transparent" : ui.accentTint,
        },
      ]}
    >
      <SpeakerGlyph color={muted ? ui.faint : ui.accent} muted={muted} />
    </Press>
  );
}

/**
 * A speaker mark: a cone and two arcs, or a cone and a stroke through it when muted.
 *
 * Hand-drawn here rather than imported from the Breathe screen because a screen reaching into
 * another screen's internals is a dependency between two products, and rather than added to
 * `components/icons.tsx` because that set is deliberately small — a glyph moves into it when a
 * third screen needs it, which is the moment it stops being one product's mark.
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
    big: { gap: 6, marginBottom: space.base },
    countWrap: { alignSelf: "flex-start" },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: space.sm },
    fill: { height: 4, backgroundColor: ui.accent },
    glasses: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: space.sm },
    glass: { width: 22, height: 28, borderRadius: radius.xs, borderWidth: 1 },
    headActions: { flexDirection: "row", alignItems: "center", gap: 4 },
    actions: { flexDirection: "row", gap: space.sm },
    step: { minWidth: 64, minHeight: 64, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: space.base },
    stepMain: { flex: 1, borderWidth: 0 },
    info: { marginTop: space.base, gap: 6 },
  });
}

/**
 * The styles for the control atoms, kept outside `makeStyles` because they do not depend on
 * the palette — which is why they are not rebuilt on a theme change.
 */
const s0 = StyleSheet.create({
  // 40 + 10 of hitSlop is the thumb target; the visible mark stays the size of the header's
  // other glyphs so the row does not become a toolbar.
  toggle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
