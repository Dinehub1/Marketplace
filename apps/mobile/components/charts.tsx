/**
 * The analytics every wellness screen was missing: a ring, a week, a month, a streak.
 *
 * Why these four and nothing else: the reference apps people actually keep (audited in
 * docs/wellness-app-reference.md) all lead with the same trio — how far along today
 * (ring/progress), the last week (bars), and the year-to-date (dots/heatmap) — plus a
 * streak as the reason to come back tomorrow. Charts nobody reads are worse than no
 * charts, so this file deliberately stops there.
 *
 * All of it is derived from the sessions the screen already saved, on the device. Nothing
 * here is uploaded, and nothing is stored twice.
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { radius, space } from "@hermes/tokens";
import { Card, Text } from "@/components/ui";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { useWellnessStore, type SessionRecord } from "@/lib/session";
import {
  dailyBuckets,
  dailyBucketsFromCounts,
  recent,
  streak,
  streakFromCounts,
  totals,
  weekOverWeek,
  whenLabel,
} from "@/lib/stats";

/** An SVG donut. One number against a goal, which is the whole point of a ring. */
export function Ring({
  progress,
  size = 132,
  thickness = 12,
  accent,
  track,
  center,
  caption,
}: {
  progress: number;
  size?: number;
  thickness?: number;
  accent: string;
  track: string;
  center: string;
  caption?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={thickness} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={accent}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * p} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text variant="title2">{center}</Text>
      {caption ? <Text variant="caption" tone="ink3">{caption}</Text> : null}
    </View>
  );
}

/** Seven days, oldest first. Bar height is honest — zero days are drawn as a hairline. */
export function BarChart({ buckets, accent, track, height = 72 }: { buckets: { day: string; count: number }[]; accent: string; track: string; height?: number }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const label = (day: string) => "SMTWTFS"[new Date(`${day}T00:00:00Z`).getUTCDay()];
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height }}>
        {buckets.map((b, i) => (
          <View key={b.day} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: "100%",
                height: b.count ? Math.max(6, (b.count / max) * (height - 18)) : 2,
                backgroundColor: b.count ? accent : track,
                borderRadius: radius.xs,
                opacity: i === buckets.length - 1 ? 1 : 0.85,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
        {buckets.map((b, i) => (
          <Text key={b.day} variant="caption" tone={i === buckets.length - 1 ? "ink2" : "ink3"} style={{ flex: 1, textAlign: "center" }}>
            {label(b.day)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Thirty days as dots. Denser than bars, so it can hold a month in one row of the screen. */
export function HeatStrip({ buckets, accent, track }: { buckets: { day: string; count: number }[]; accent: string; track: string }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {buckets.map((b) => (
        <View
          key={b.day}
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            backgroundColor: b.count === 0 ? track : accent,
            opacity: b.count === 0 ? 1 : b.count === 1 ? 0.55 : 1,
          }}
        />
      ))}
    </View>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="title3">{value}</Text>
      <Text variant="caption" tone="ink3">{label}</Text>
    </View>
  );
}

/**
 * The panel itself. Drop it on any wellness screen and that screen gains an analytics
 * section without knowing anything about how the numbers are computed.
 */
export function InsightPanel({
  screen,
  accentKey,
  unitsLabel,
  weeklyGoal = 5,
  countToday,
  counts,
  dailyGoal,
  sessions: given,
}: {
  screen: string;
  /** Which product accent to draw with; defaults to the screen's own. */
  accentKey?: string;
  unitsLabel: string;
  /** Sessions per week, for the timer screens. */
  weeklyGoal?: number;
  countToday?: number;
  /** day → count, for the counter screens (Water, Japa). Turns the panel count-based. */
  counts?: Record<string, number>;
  /** Units a day, for the counter screens. */
  dailyGoal?: number;
  /**
   * Sessions to draw, for a screen that keeps its own history (Breathe stores under
   * `dropby-breathe` from before this store existed). Passing them beats duplicating the
   * write. Consolidating that key is queued.
   */
  sessions?: SessionRecord[];
}) {
  const ui = useProductUI(accentKey ?? screen);
  const store = useWellnessStore(screen);
  const sessions = given ?? store.sessions;

  const counting = !!counts;
  const week = useMemo(() => (counting ? dailyBucketsFromCounts(counts!, 7) : dailyBuckets(sessions, 7)), [counting, counts, sessions]);
  const month = useMemo(() => (counting ? dailyBucketsFromCounts(counts!, 30) : dailyBuckets(sessions, 30)), [counting, counts, sessions]);
  const st = useMemo(() => (counting ? streakFromCounts(counts!) : streak(sessions)), [counting, counts, sessions]);
  const all = useMemo(() => totals(sessions), [sessions]);
  const wow = useMemo(() => weekOverWeek(sessions), [sessions]);
  const last = useMemo(() => recent(sessions, 3), [sessions]);

  const totalUnits = counting ? week.reduce((n, b) => n + b.count, 0) : all.count;
  const todayUnits = counting ? (counts![new Date().toISOString().slice(0, 10)] ?? 0) : all.count;
  const goal = counting ? (dailyGoal ?? 0) : weeklyGoal;
  const done = counting ? todayUnits : wow.thisWeek;
  const untilGoal = Math.max(0, goal - done);
  const deltaText = counting
    ? `${totalUnits} ${unitsLabel} in the last 7 days`
    : wow.lastWeek === 0 && wow.thisWeek === 0
      ? "No sessions yet — the first bar is the hard one."
      : wow.delta > 0
        ? `${wow.delta} more than last week`
        : wow.delta < 0
          ? `${Math.abs(wow.delta)} fewer than last week`
          : `Same as last week (${wow.thisWeek})`;

  return (
    <Card>
      <Text variant="caption" tone="ink3">YOUR PROGRESS</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg, marginTop: space.md }}>
        <Ring
          progress={goal ? done / goal : 0}
          accent={ui.accent}
          track={ui.accentTint}
          center={String(done)}
          caption={goal ? (done >= goal ? "goal met" : `${untilGoal} to go`) : "today"}
        />
        <View style={{ flex: 1, gap: space.sm }}>
          <Tile value={`${st.current}${st.best > st.current ? ` (best ${st.best})` : ""}`} label="day streak" />
          {/* Units are units: a tile labelled "moves" must not be counting sessions. */}
          <Tile
            value={counting ? String(totalUnits) : String(all.units)}
            label={counting ? `${unitsLabel} this week` : `${unitsLabel} all time`}
          />
          {/* A counter never records minutes, so it does not get a minutes tile. */}
          {counting ? <Tile value={String(all.count)} label="sessions logged" /> : <Tile value={`${all.minutes}m`} label="time practised" />}
          {typeof countToday === "number" ? <Tile value={String(countToday)} label={`${unitsLabel} today`} /> : null}
        </View>
      </View>

      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <Text variant="caption" tone="ink3">LAST 7 DAYS</Text>
        <BarChart buckets={week} accent={ui.accent} track={ui.accentTint} />
        <Text variant="meta" tone="ink2">{deltaText}</Text>
      </View>

      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <Text variant="caption" tone="ink3">LAST 30 DAYS</Text>
        <HeatStrip buckets={month} accent={ui.accent} track={ui.accentTint} />
      </View>

      {last.length ? (
        <View style={{ marginTop: space.lg, gap: space.xs }}>
          <Text variant="caption" tone="ink3">RECENT</Text>
          {last.map((s) => (
            <View key={s.at} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text variant="meta" tone="ink2">{whenLabel(s.at)}</Text>
              <Text variant="meta" tone="ink3">{s.units} {unitsLabel}{s.minutes ? ` · ${s.minutes}m` : ""}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text variant="caption" tone="ink3" style={{ marginTop: space.md }}>
        Counted on this phone. Nothing is uploaded.
      </Text>
    </Card>
  );
}
