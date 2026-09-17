/**
 * Progress — the charts page: what the six practices add up to.
 *
 * This is the page every reference app has and we did not: a single place that answers
 * "am I getting anywhere?" across all of it, not one screen at a time. It is deliberately
 * one page with a picker rather than six near-identical pages, because six copies of the
 * same chart is how an app starts feeling like a demo.
 *
 * Apple's own guidance (and the illustration of it) is what sets the frame: iOS 26 tab
 * bars hold at most five items, so the practices are picked from a grid and the analytics
 * live here.
 *
 * ── What changed ──────────────────────────────────────────────────────────────────────
 *
 * The old page put a six-row list in a card, then the ring and the chart in a second card,
 * then a third card explaining the first two. On a 6.1" phone that pushed "LAST 7 DAYS" —
 * the one thing anyone opens this page for — below the fold, and it spent an entire card on
 * prose. The chart is now in the same card as the numbers it belongs to, and the prose is
 * one line at the bottom. Nothing was recomputed: every figure still comes from the shared
 * store, so the screen cannot invent a number the rest of the app disagrees with.
 *
 * The six-practice summary is read with six store subscriptions at this level rather than
 * one per row inside a child component. Same number of hooks, but the rows become pure
 * presentational components — which is what stops a re-render of one practice from
 * re-rendering five others.
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { radius, space } from "@hermes/tokens";
import { Card, Press, Text } from "@/components/ui";
import { BarChart, HeatStrip, Ring } from "@/components/charts";
import { ProfileAction, WellnessShell } from "@/components/wellness-shell";
import { SyncBadge } from "@/components/sync-badge";
import { useProductUI } from "@/lib/product-ui";
import { useSettings } from "@/lib/settings";
import { useWellnessStore } from "@/lib/session";
import {
  dailyBuckets,
  dailyBucketsFromCounts,
  streak,
  streakFromCounts,
  totals,
  weekOverWeek,
} from "@/lib/stats";

/** The six practices, with the label the person sees and what one unit is called. */
export const FAMILY = [
  { key: "breathe", label: "Breathe", unit: "cycles", counting: false, goal: 5, route: "/breathe" },
  { key: "stretch", label: "Stretch", unit: "moves", counting: false, goal: 5, route: "/stretch" },
  { key: "walk", label: "Walk", unit: "intervals", counting: false, goal: 4, route: "/walk" },
  { key: "water", label: "Water", unit: "glasses", counting: true, goal: 8, route: "/water" },
  { key: "japa", label: "Japa", unit: "beads", counting: true, goal: 108, route: "/japa" },
  { key: "sleep", label: "Sleep", unit: "rounds", counting: false, goal: 7, route: "/sleep" },
] as const;

type FamilyEntry = (typeof FAMILY)[number];
type FamilyKey = FamilyEntry["key"];

/**
 * One practice, summarised for the picker.
 *
 * A hook, called six times from the screen's own body — never from inside a `.map` over
 * JSX, which would be a hooks-order bug waiting for the list to change length.
 */
function usePractice(entry: FamilyEntry) {
  const store = useWellnessStore(entry.key);
  const counts = entry.counting ? store.countHistory : undefined;

  const thisWeek = useMemo(
    () =>
      entry.counting
        ? dailyBucketsFromCounts(counts ?? {}, 7).reduce((n, b) => n + b.count, 0)
        : weekOverWeek(store.sessions).thisWeek,
    [entry.counting, counts, store.sessions],
  );

  const current = entry.counting
    ? streakFromCounts(counts ?? {}).current
    : streak(store.sessions).current;

  return { store, counts, thisWeek, currentStreak: current };
}

function WeekRow({
  entry,
  week,
  currentStreak,
  selected,
  onPress,
}: {
  entry: FamilyEntry;
  week: number;
  currentStreak: number;
  selected: boolean;
  onPress: () => void;
}) {
  const ui = useProductUI("breathe");
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${entry.label}, ${week} this week, ${currentStreak} day streak`}
      style={[
        styles.row,
        selected && { backgroundColor: ui.accentTint, borderColor: ui.accent },
      ]}
    >
      <Text variant="callout" style={styles.rowLabel} numberOfLines={1}>
        {entry.label}
      </Text>
      {/* The week count is the headline on this row, so it carries the weight and the
          colour; the streak is secondary. The reverse made the eye land on the streak of
          five practices the person is not looking at. */}
      <Text variant="callout" style={{ color: selected ? ui.accent : ui.muted, fontWeight: "700" }}>
        {week}
      </Text>
      <Text variant="meta" tone="ink3" style={styles.rowStreak}>
        {currentStreak > 0 ? `${currentStreak}d` : "—"}
      </Text>
    </Press>
  );
}

export default function Progress() {
  const ui = useProductUI("breathe");
  const { settings } = useSettings();
  const [selected, setSelected] = useState<FamilyKey>("breathe");
  const entry: FamilyEntry = FAMILY.find((f) => f.key === selected) ?? FAMILY[0];

  /**
   * All six, read unconditionally. Six `useWellnessStore` calls in a fixed order — the
   * point is that the order never depends on `selected`, so switching practice is a state
   * change and not a hook-order change.
   */
  const breathe = usePractice(FAMILY[0]);
  const stretch = usePractice(FAMILY[1]);
  const walk = usePractice(FAMILY[2]);
  const water = usePractice(FAMILY[3]);
  const japa = usePractice(FAMILY[4]);
  const sleep = usePractice(FAMILY[5]);
  const summaries = useMemo(
    () => [breathe, stretch, walk, water, japa, sleep],
    [breathe, stretch, walk, water, japa, sleep],
  );
  const active = summaries[FAMILY.findIndex((f) => f.key === selected)] ?? summaries[0];

  // Only the selected practice is charted in full.
  const store = active.store;
  const counts = entry.counting ? active.counts : undefined;

  const week = useMemo(
    () => (entry.counting ? dailyBucketsFromCounts(counts ?? {}, 7) : dailyBuckets(store.sessions, 7)),
    [entry.counting, counts, store.sessions],
  );
  const month = useMemo(
    () => (entry.counting ? dailyBucketsFromCounts(counts ?? {}, 30) : dailyBuckets(store.sessions, 30)),
    [entry.counting, counts, store.sessions],
  );
  const st = useMemo(
    () => (entry.counting ? streakFromCounts(counts ?? {}) : streak(store.sessions)),
    [entry.counting, counts, store.sessions],
  );
  const all = useMemo(() => totals(store.sessions), [store.sessions]);

  const todayKey = store.todayKey;
  const done = entry.counting ? (counts?.[todayKey] ?? 0) : active.thisWeek;
  // The goal comes from the Profile page where it is a setting, and from the roster where it
  // is a property of the practice. Water is the one counter whose target a person chooses;
  // Japa's 108 is not a preference, and reading `waterGoal` for it drew an 8-bead ring.
  const goal = entry.counting
    ? entry.key === "water"
      ? settings.waterGoal
      : entry.goal
    : settings.weeklyGoal;

  const router = useRouter();
  const practicesUsed = summaries.filter((s) => s.store.sessions.length > 0).length;

  return (
    <WellnessShell
      product="breathe"
      title="Progress"
      lead="Your wellness activity"
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
      headerAction={<ProfileAction />}
    >
      {/* One card for the numbers, immediately followed by the week — so the chart is on the
          first screenful instead of below a card of prose. */}
      <Card style={styles.card}>
        <View style={styles.pickerHead}>
          <Text variant="caption" tone="ink3">
            SELECTED
          </Text>
          <Text variant="caption" tone="ink3">
            {practicesUsed} OF 6 PRACTISED
          </Text>
        </View>

        <View style={styles.rows}>
          {FAMILY.map((f, i) => (
            <WeekRow
              key={f.key}
              entry={f}
              week={summaries[i].thisWeek}
              currentStreak={summaries[i].currentStreak}
              selected={f.key === selected}
              onPress={() => setSelected(f.key)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.heroRow}>
          <Ring
            progress={goal ? done / goal : 0}
            accent={ui.accent}
            track={ui.accentTint}
            center={entry.counting ? String(done) : `${done}/${goal}`}
            caption={goal ? (done >= goal ? "goal met" : `${Math.max(0, goal - done)} to go`) : "today"}
          />
          <View style={styles.heroText}>
            <Text variant="title3">{entry.label}</Text>
            <Text variant="meta" tone="ink2">
              {entry.counting ? `${goal} ${entry.unit} a day` : `${goal} sessions a week`}
            </Text>
            <View style={styles.metrics}>
              <Metric value={String(st.current)} label="day streak" />
              {!entry.counting ? (
                <Metric value={`${all.minutes}m`} label="practised" />
              ) : null}
              {!entry.counting ? <Metric value={String(all.count)} label="sessions" /> : null}
              {entry.counting ? <Metric value={String(all.count)} label="logged" /> : null}
            </View>
            {st.best > st.current && st.current > 0 ? (
              <Text variant="meta" tone="ink3">
                Best run: {st.best} days
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.chartBlock}>
          <View style={styles.chartHead}>
            <Text variant="caption" tone="ink3">
              LAST 7 DAYS
            </Text>
            <Text variant="caption" tone="ink3">
              {entry.counting ? entry.unit.toUpperCase() : "SESSIONS"}
            </Text>
          </View>
          <BarChart buckets={week} accent={ui.accent} track={ui.accentTint} />
        </View>

        <View style={styles.chartBlock}>
          <Text variant="caption" tone="ink3">
            LAST 30 DAYS · {month.filter((b) => b.count > 0).length} ACTIVE
          </Text>
          <HeatStrip buckets={month} accent={ui.accent} track={ui.accentTint} />
        </View>
      </Card>

      <Press
        onPress={() => router.push(entry.route)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${entry.label}`}
        style={styles.openRow}
      >
        <Text variant="callout" style={{ color: ui.accent }}>
          Open {entry.label}
        </Text>
        <Text variant="callout" tone="ink3">
          ›
        </Text>
      </Press>

      {/* One line, not a card. It is a footnote about how the numbers are drawn, and a
          footnote that occupies a card reads as a feature. */}
      <Text variant="meta" tone="ink3" style={styles.footNote}>
        Streaks count days with at least one session. Bars are days, not effort: a heavy day
        and a light day draw the same height.
      </Text>
    </WellnessShell>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text variant="title3">{value}</Text>
      <Text variant="caption" tone="ink3">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.sm, gap: space.sm },
  pickerHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rows: { gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 9,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 44,
  },
  rowLabel: { flex: 1, fontWeight: "600" },
  rowStreak: { width: 34, textAlign: "right" },
  heroRow: { flexDirection: "row", alignItems: "center", gap: space.base },
  heroText: { flex: 1, gap: 3 },
  metrics: { flexDirection: "row", gap: space.base, marginTop: 2 },
  metric: { gap: 0 },
  chartBlock: { gap: space.sm, marginTop: space.sm },
  chartHead: { flexDirection: "row", justifyContent: "space-between" },
  openRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: space.sm,
  },
  footNote: { marginTop: space.xs, marginBottom: space.lg, lineHeight: 18 },
});
