/**
 * Walk — an interval timer for a walk that is actually a workout.
 *
 * Why: "walk for thirty minutes" is easy to skip and impossible to feel. A timer that
 * says FAST for a minute and EASY for two turns the same walk into something with a
 * shape. It needs no sensors, no GPS and no account — a person walking with one earbud
 * in is the whole user interface.
 *
 * Honest scope: an interval timer. It does not measure distance, steps or heart rate,
 * and it does not claim a training effect it cannot see.
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { WellnessShell } from "@/components/wellness-shell";
import { usePhases, useWellnessStore, type Phase } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { useProductUI } from "@/lib/product-ui";

const ROUND_OPTIONS = [3, 5, 8];
const FAST = 60;
const EASY = 120;
const WARM = 180;
const COOL = 180;

function buildPhases(rounds: number): Phase[] {
  const out: Phase[] = [{ key: "warm", label: "Warm up", seconds: WARM }];
  for (let i = 0; i < rounds; i++) {
    out.push({ key: `fast-${i}`, label: "Fast", seconds: FAST });
    out.push({ key: `easy-${i}`, label: "Easy", seconds: EASY });
  }
  out.push({ key: "cool", label: "Cool down", seconds: COOL });
  return out;
}

export default function Walk() {
  const ui = useProductUI("walk");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const [rounds, setRounds] = useState(5);
  const [finished, setFinished] = useState(false);
  const phases = useMemo(() => buildPhases(rounds), [rounds]);
  const store = useWellnessStore("walk");
  const { settings } = useSettings();

  const session = usePhases(phases, {
    onComplete: () => {
      setFinished(true);
      store.save({
        at: Date.now(),
        screen: "walk",
        minutes: Math.round(phases.reduce((n, p) => n + p.seconds, 0) / 60),
        units: rounds,
        label: `${rounds} fast/easy rounds`,
      });
    },
  });

  const totalMin = Math.round(phases.reduce((n, p) => n + p.seconds, 0) / 60);
  const isFast = session.phase?.label === "Fast";

  return (
    <WellnessShell
      product="walk"
      title="Walk"
      lead="Fast for a minute, easy for two. The timer keeps the shape, you keep walking."
      tabBar={false}
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
    >
      <Card style={[s.big, isFast && session.running ? { borderColor: ui.accent } : null]}>
        <Text variant="caption" tone="ink3">
          {session.running ? (isFast ? "NOW — FAST" : session.phase?.label.toUpperCase()) : "THE SESSION"}
        </Text>
        <Text variant="title1" style={session.running && isFast ? { color: ui.accent } : undefined}>
          {session.running ? session.phase?.label ?? "" : `${totalMin} minutes`}
        </Text>
        <Text variant="title2" style={{ color: ui.accent }}>
          {session.running ? `${session.secondsLeft}s` : `${rounds} fast/easy rounds`}
        </Text>
        {session.running ? (
          <View style={s.bar}><View style={[s.fill, { width: `${Math.round(session.progress * 100)}%` }]} /></View>
        ) : null}
        {session.running ? <Text variant="meta" tone="ink3">{session.clock} elapsed</Text> : null}
      </Card>

      <Button title={session.running ? "Finish" : finished ? "Go again" : "Start walking"} onPress={session.running ? session.stop : session.start} />

      {!session.running ? (
        <>
          <Text variant="caption" tone="ink3" style={s.section}>ROUNDS</Text>
          <View style={s.row}>
            {ROUND_OPTIONS.map((r) => (
              <Button
                key={r}
                title={`${r}×`}
                variant={r === rounds ? "secondary" : "ghost"}
                onPress={() => { setRounds(r); setFinished(false); }}
              />
            ))}
          </View>
          <Card style={s.info}>
            <Text variant="title3">How the session is built</Text>
            <Text variant="meta" tone="ink2">
              3 minutes warm up · {rounds} × ({FAST}s fast + {EASY}s easy) · 3 minutes cool down.
              It stops when the last round ends; nothing to remember.
            </Text>
          </Card>
        </>
      ) : null}

      {store.last ? (
        <Text variant="meta" tone="ink3" style={s.note}>
          Last session: {store.last.minutes} min · {store.last.label}
        </Text>
      ) : null}
          <InsightPanel screen="walk" unitsLabel="intervals" weeklyGoal={settings.weeklyGoal} />
    </WellnessShell>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    big: { gap: 6, marginBottom: space.base, borderWidth: 1, borderColor: "transparent" },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: 6 },
    fill: { height: 4, backgroundColor: ui.accent },
    section: { marginTop: space.lg, marginBottom: space.sm, letterSpacing: 1.1 },
    row: { flexDirection: "row", gap: space.sm },
    info: { marginTop: space.base, gap: 6 },
    note: { marginTop: space.md },
  });
}
