/**
 * Today — the wellness hub: what you did today, and the way to everything else.
 *
 * Why a hub exists at all: iOS tab bars hold five items before the system buries the rest
 * behind "More", so Water and Japa cannot both be tabs. They are real screens with real
 * jobs, so they live one push away from here — and this is also the one screen that can
 * show today's progress for all six without opening any of them.
 *
 * ── What changed ──────────────────────────────────────────────────────────────────────
 *
 * It was two counters and three rows of prose. Stretch, Walk and Sleep each got a card
 * whose body was a sentence about what the practice is, with the *progress* — the only
 * reason to open this screen — reduced to an aside in the middle of it. Breathe was not on
 * the page at all, despite being a tab, so the hub did not list the six practices it claims
 * to summarise.
 *
 * Now every practice is one card with the same shape: what it is, where you are against
 * today's goal, and one tap to start. The count that a person actually opens this screen
 * for ("3 of 6 done") is the second thing on the page, above the cards.
 *
 * The numbers come from the shared store (lib/session.ts), which reads the device cache
 * first and the main database second, so this page is right with no signal and still right
 * after a reinstall. The badge under the title is which of the two is currently true.
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { radius, space } from "@hermes/tokens";
import { Card, Press, Text } from "@/components/ui";
import { ProfileAction, WellnessShell } from "@/components/wellness-shell";
import { SyncBadge } from "@/components/sync-badge";
import { useWellnessStore, type SessionRecord } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { streak, weekOverWeek, dayKeyOf } from "@/lib/stats";

/** A full japa mala. Duplicated from the Japa screen's own constant on purpose: this is a
 *  display rule for the hub's card, and importing a screen's internals to get it would
 *  couple the hub to that screen's implementation. */
const JAPA_MALA = 108;

/**
 * The greeting, from the device's own clock.
 *
 * Boundaries are the conventional ones and the three cases are exhaustive, so there is no
 * fourth state to fall through to. It reads local time, which is the time the person
 * looking at the phone is living in.
 */
function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** One practice's state today, in the shape the card renders. */
type CardState = {
  key: string;
  label: string;
  /** What one unit is, for the progress line. */
  unit: string;
  /** Progress toward today's target. */
  done: number;
  goal: number;
  /** The one-line answer to "what is this?", shown before the progress. */
  blurb: string;
  route: string;
  /** True when the practice is something you do once, not a number you accumulate. */
  once: boolean;
};

function PracticeCard({
  state,
  ui,
  onPress,
  last,
}: {
  state: CardState;
  ui: ProductUI;
  onPress: () => void;
  last: SessionRecord | null;
}) {
  const complete = state.goal > 0 && state.done >= state.goal;
  const pct = state.goal > 0 ? Math.min(1, state.done / state.goal) : 0;

  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${state.label}. ${state.blurb} ${state.done} of ${state.goal} ${state.unit} today.`}
      accessibilityHint={`Opens the ${state.label} screen`}
      style={[s.card, { borderColor: ui.hairline }]}
    >
      <View style={s.cardTop}>
        <Text variant="title3" style={s.cardTitle}>
          {state.label}
        </Text>
        {/* The completion mark is a word, not only a colour: colour alone is not an
            accessible way to say "done". */}
        {complete ? (
          <Text variant="caption" style={{ color: ui.accent }}>
            DONE
          </Text>
        ) : (
          <Text variant="caption" tone="ink3">
            {state.goal - state.done} TO GO
          </Text>
        )}
      </View>

      <Text variant="meta" tone="ink2">
        {state.blurb}
      </Text>

      <View
        style={[s.track, { backgroundColor: ui.hairline }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: state.goal || 1, now: Math.min(state.done, state.goal || 1) }}
      >
        <View style={[s.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: ui.accent }]} />
      </View>

      <View style={s.cardFoot}>
        <Text variant="callout" style={{ color: complete ? ui.accent : ui.ink }}>
          {state.done} / {state.goal} {state.unit}
        </Text>
        <Text variant="meta" tone="ink3">
          {last ? `last ${last.minutes > 0 ? `${last.minutes}m` : `${last.units} ${state.unit}`}` : "not yet"}
        </Text>
      </View>
    </Press>
  );
}

export default function Habits() {
  const ui = useProductUI("habits");
  const router = useRouter();
  const { settings } = useSettings();

  /**
   * Six subscriptions, in a fixed order, at the top level.
   *
   * The alternative — a child component that calls `useWellnessStore` per card — reads
   * better and is the same number of hooks, but it puts a subscription between the card and
   * the screen for no benefit. Reading them here means the hub's summary line and the cards
   * below it are computed from one snapshot and cannot disagree by a frame.
   */
  const breathe = useWellnessStore("breathe");
  const stretch = useWellnessStore("stretch");
  const walk = useWellnessStore("walk");
  const water = useWellnessStore("water");
  const japa = useWellnessStore("japa");
  const sleep = useWellnessStore("sleep");

  const today = breathe.todayKey;

  const states = useMemo<CardState[]>(() => {
    /** How many of a timer practice's sessions landed on the local day currently showing. */
    const didToday = (sessions: SessionRecord[]) =>
      sessions.filter((s) => dayKeyOf(s.at) === today).length;

    return [
      {
        key: "breathe",
        label: "Breathe",
        unit: "session",
        done: Math.min(1, didToday(breathe.sessions)),
        goal: 1,
        blurb: "Slow breathing with a pacer and four patterns.",
        route: "/breathe",
        once: true,
      },
      {
        key: "stretch",
        label: "Stretch",
        unit: "session",
        done: Math.min(1, didToday(stretch.sessions)),
        goal: 1,
        blurb: "A five-minute desk mobility class, eight movements.",
        route: "/stretch",
        once: true,
      },
      {
        key: "water",
        label: "Water",
        unit: "glasses",
        done: water.countToday,
        goal: settings.waterGoal,
        blurb: "Tap once per glass. Resets when the date does.",
        route: "/water",
        once: false,
      },
      {
        key: "walk",
        label: "Walk",
        unit: "session",
        done: Math.min(1, didToday(walk.sessions)),
        goal: 1,
        blurb: "Fast a minute, easy two — an interval timer for a walk.",
        route: "/walk",
        once: true,
      },
      {
        key: "sleep",
        label: "Sleep",
        unit: "wind-down",
        done: Math.min(1, didToday(sleep.sessions)),
        goal: 1,
        blurb: "Four rounds of 4·7·8, then a countdown to lights out.",
        route: "/sleep",
        once: true,
      },
      {
        // Japa is counted in rounds here, not beads: "3 / 108 beads" reads as a failure for
        // the whole first mala, while "1 round done" is the thing that actually happened.
        key: "japa",
        label: "Japa",
        unit: "round",
        done: Math.floor(japa.countToday / JAPA_MALA),
        goal: 1,
        blurb: "A tap counter for a repeated phrase. 108 beads a round.",
        route: "/japa",
        once: true,
      },
    ];
  }, [
    today,
    breathe.sessions,
    stretch.sessions,
    walk.sessions,
    sleep.sessions,
    water.countToday,
    japa.countToday,
    settings.waterGoal,
  ]);

  const lasts: Record<string, SessionRecord | null> = {
    breathe: breathe.last,
    stretch: stretch.last,
    water: water.last,
    walk: walk.last,
    sleep: sleep.last,
    japa: japa.last,
  };

  const doneCount = states.filter((s) => s.done >= s.goal).length;

  /** The best current run across every practice — the reason to come back tomorrow. */
  const bestStreak = useMemo(() => {
    const all = [
      ...breathe.sessions,
      ...stretch.sessions,
      ...walk.sessions,
      ...sleep.sessions,
    ];
    return streak(all).current;
  }, [breathe.sessions, stretch.sessions, walk.sessions, sleep.sessions]);

  const thisWeek = useMemo(
    () =>
      [breathe, stretch, walk, sleep].reduce((n, store) => n + weekOverWeek(store.sessions).thisWeek, 0),
    [breathe, stretch, walk, sleep],
  );

  return (
    <WellnessShell
      product="habits"
      title={greeting()}
      lead="Today's progress, and the way to all six practices."
      status={<SyncBadge sync={water.sync} pending={water.pending} lastSyncedAt={water.lastSyncedAt} />}
      headerAction={<ProfileAction />}
    >
      <Card style={s.summary}>
        <View style={s.summaryRow}>
          <View style={s.summaryMain}>
            <Text variant="title1" style={{ color: ui.accent }}>
              {doneCount} of {states.length}
            </Text>
            <Text variant="meta" tone="ink2">
              practices done today
            </Text>
          </View>
          <View style={s.summarySide}>
            <Text variant="title3">{bestStreak}</Text>
            <Text variant="caption" tone="ink3">
              day streak
            </Text>
            <Text variant="meta" tone="ink3" style={s.summaryWeek}>
              {thisWeek} this week
            </Text>
          </View>
        </View>
        <View
          style={[s.track, { backgroundColor: ui.hairline, marginTop: space.md }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: states.length, now: doneCount }}
        >
          <View
            style={[s.fill, { width: `${Math.round((doneCount / states.length) * 100)}%`, backgroundColor: ui.accent }]}
          />
        </View>
      </Card>

      {states.map((state) => (
        <PracticeCard
          key={state.key}
          state={state}
          ui={ui}
          last={lasts[state.key]}
          onPress={() => router.push(state.route as never)}
        />
      ))}

      <Text variant="meta" tone="ink3" style={s.footNote}>
        Everything here works with no signal, costs nothing to run, and asks for no account.
        Nothing on these screens is medical advice.
      </Text>
    </WellnessShell>
  );
}

const s = StyleSheet.create({
  summary: { marginBottom: space.sm, paddingVertical: space.base, gap: 0 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: space.base },
  summaryMain: { flex: 1, gap: 0 },
  summarySide: { alignItems: "flex-end" },
  summaryWeek: { marginTop: 2 },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.base,
    gap: space.sm,
    marginBottom: space.sm,
    minHeight: 44,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { flex: 1 },
  track: { height: 5, borderRadius: 3, overflow: "hidden" },
  fill: { height: 5, borderRadius: 3 },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 22 },
  footNote: { marginTop: space.sm, marginBottom: space.lg, lineHeight: 18 },
});
