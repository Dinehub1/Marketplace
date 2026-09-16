/**
 * Progress — the charts page: what the six practices add up to.
 *
 * This is the page every reference app has and we did not: a single place that answers
 * "am I getting anywhere?" across all of it, not one screen at a time. It is deliberately
 * one page with a segmented switch rather than six near-identical pages, because six
 * copies of the same chart is how an app starts feeling like a demo.
 *
 * Apple's own guidance (and the illustration of it) is what sets the frame: iOS 26 tab
 * bars hold at most five items, so the practices are tabs and the analytics live here.
 */
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { radius, space } from "@hermes/tokens";
import { Press, Text, Card } from "@/components/ui";
import { BarChart, HeatStrip, Ring } from "@/components/charts";
import { WellnessShell } from "@/components/wellness-shell";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { useSettings } from "@/lib/settings";
import { useWellnessStore } from "@/lib/session";
import { dailyBuckets, dailyBucketsFromCounts, streak, streakFromCounts, totals, weekOverWeek } from "@/lib/stats";

/** The six practices, with the label the person sees and what one unit is called. */
export const FAMILY = [
  { key: "breathe", label: "Breathe", unit: "cycles", counting: false, goal: 5 },
  { key: "stretch", label: "Stretch", unit: "moves", counting: false, goal: 5 },
  { key: "walk", label: "Walk", unit: "intervals", counting: false, goal: 4 },
  { key: "water", label: "Water", unit: "glasses", counting: true, goal: 8 },
  { key: "japa", label: "Japa", unit: "beads", counting: true, goal: 108 },
  { key: "sleep", label: "Sleep", unit: "rounds", counting: false, goal: 7 },
] as const;

type FamilyKey = (typeof FAMILY)[number]["key"];

function FamilyRow({ entry, ui, onPress, selected }: { entry: (typeof FAMILY)[number]; ui: ProductUI; onPress: () => void; selected: boolean }) {
  const store = useWellnessStore(entry.key);
  const counts = entry.counting ? store.countHistory : undefined;
  const st = entry.counting ? streakFromCounts(counts ?? {}) : streak(store.sessions);
  const weekDays = entry.counting
    ? dailyBucketsFromCounts(counts ?? {}, 7).reduce((n, b) => n + b.count, 0)
    : weekOverWeek(store.sessions).thisWeek;
  return (
    <Press onPress={onPress} accessibilityRole="button" style={[styles.row, selected && { backgroundColor: ui.accentTint, borderColor: ui.accent }]}>
      <Text variant="callout" style={{ flex: 1 }}>{entry.label}</Text>
      <Text variant="meta" tone="ink2">{st.current}d streak</Text>
      <Text variant="meta" tone="ink3">{weekDays} this week</Text>
    </Press>
  );
}

export default function Progress() {
  const ui = useProductUI("breathe");
  const { settings } = useSettings();
  const [selected, setSelected] = useState<FamilyKey>("breathe");
  const entry = FAMILY.find((f) => f.key === selected)!;

  // Each practice reads its own store; only the selected one is charted in full.
  const store = useWellnessStore(entry.key);
  const counts = entry.counting ? store.countHistory : undefined;

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

  const todayKey = new Date().toISOString().slice(0, 10);
  const done = entry.counting ? (counts?.[todayKey] ?? 0) : weekOverWeek(store.sessions).thisWeek;
  // The goal comes from the Profile page, so the ring cannot disagree with the setting.
  const goal = entry.counting ? settings.waterGoal : settings.weeklyGoal;

  return (
    <WellnessShell
      product="breathe"
      title="Progress"
      lead="Six practices, counted on this phone. Nothing here is uploaded and nothing is shared."
    >
      <Card>
        <Text variant="caption" tone="ink3">ALL SIX</Text>
        <View style={{ marginTop: space.sm, gap: 6 }}>
          {FAMILY.map((f) => (
            <FamilyRow key={f.key} entry={f} ui={ui} selected={f.key === selected} onPress={() => setSelected(f.key)} />
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
          <Ring
            progress={goal ? done / goal : 0}
            accent={ui.accent}
            track={ui.accentTint}
            center={String(done)}
            caption={done >= goal ? "goal met" : `${Math.max(0, goal - done)} to go`}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="title3">{entry.label}</Text>
            <Text variant="meta" tone="ink2">
              {st.current} day streak{st.best > st.current ? ` · best ${st.best}` : ""}
            </Text>
            <Text variant="meta" tone="ink3">
              {entry.counting ? `${goal} ${entry.unit} a day` : `${goal} sessions a week`}
            </Text>
            {!entry.counting ? <Text variant="meta" tone="ink3">{all.minutes}m practised · {all.count} sessions</Text> : null}
          </View>
        </View>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <Text variant="caption" tone="ink3">LAST 7 DAYS</Text>
          <BarChart buckets={week} accent={ui.accent} track={ui.accentTint} />
        </View>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <Text variant="caption" tone="ink3">LAST 30 DAYS</Text>
          <HeatStrip buckets={month} accent={ui.accent} track={ui.accentTint} />
          <Text variant="meta" tone="ink3">
            {month.filter((b) => b.count > 0).length} of the last 30 days
          </Text>
        </View>
      </Card>

      <Card>
        <Text variant="caption" tone="ink3">WHAT THESE NUMBERS ARE</Text>
        <Text variant="meta" tone="ink2" style={{ lineHeight: 19, marginTop: 6 }}>
          Streaks count days with at least one session. Bars are days, not effort: a heavy day
          and a light day draw the same height, because counting minutes would flatter the app
          and mislead you. A day is not missed until a whole day has passed.
        </Text>
      </Card>
    </WellnessShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 44,
  },
});
