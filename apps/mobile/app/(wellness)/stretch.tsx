/**
 * Stretch — a five-minute desk mobility routine, stepped through like a class.
 *
 * Why this shape: a person who sits all day does not need a catalogue of stretches, they
 * need to be told what to do next for the next forty seconds. So it is one routine, with
 * a countdown per movement, and a "next" that works while the phone is on the desk.
 *
 * Honest scope: general mobility movement, not physiotherapy. The screen says so.
 */
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { radius, space } from "@hermes/tokens";
import { Button, Card } from "@/components/ui";
import { WellnessShell, styles as shell } from "@/components/wellness-shell";
import { usePhases, useWellnessStore, type Phase } from "@/lib/session";
import { useProductUI } from "@/lib/product-ui";
import { Text } from "@/components/ui";

const MOVES: { label: string; seconds: number; how: string }[] = [
  { label: "Neck rolls", seconds: 30, how: "Slow half-circles, chin down to each shoulder. Stop short of pain." },
  { label: "Shoulder rolls", seconds: 30, how: "Ten backwards, ten forwards. Keep the arms loose." },
  { label: "Chest opener", seconds: 40, how: "Hands behind the back, lift the chest, breathe out as you open." },
  { label: "Seated twist", seconds: 40, how: "Right hand on the left knee, turn from the ribs, both sides equally." },
  { label: "Wrist & finger stretch", seconds: 30, how: "Palms down, then palms up. This is the one that saves a typing day." },
  { label: "Standing hip stretch", seconds: 45, how: "One foot forward, back heel down, press the hips forward. Swap halfway." },
  { label: "Hamstring reach", seconds: 45, how: "Hinge at the hips, soft knees, let the head hang." },
  { label: "Slow breathing", seconds: 60, how: "Longer out than in. This is the last minute, not a warm-up." },
];

export default function Stretch() {
  const ui = useProductUI("stretch");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("stretch");
  const phases: Phase[] = useMemo(
    () => MOVES.map((m, i) => ({ key: `move-${i}`, label: m.label, seconds: m.seconds })),
    [],
  );
  const [finished, setFinished] = useState(false);

  const session = usePhases(phases, {
    onComplete: () => {
      setFinished(true);
      store.save({
        at: Date.now(),
        screen: "stretch",
        minutes: Math.round(phases.reduce((n, p) => n + p.seconds, 0) / 60),
        units: MOVES.length,
        label: "Desk mobility",
      });
    },
  });

  const move = MOVES[Math.min(session.units === 0 ? 0 : 0, MOVES.length - 1)];
  const index = session.running || finished ? MOVES.findIndex((m) => m.label === session.phase?.label) : 0;
  const current = MOVES[Math.max(0, index)] ?? move;

  return (
    <WellnessShell product="stretch" title="Stretch" lead="One five-minute desk routine. Follow the countdown, swap sides on the cue.">
      <Card style={s.big}>
        <Text variant="caption" tone="ink3">{session.running || finished ? `MOVE ${index + 1} OF ${MOVES.length}` : "THE ROUTINE"}</Text>
        <Text variant="title1">{session.running || finished ? current.label : MOVES[0].label}</Text>
        <Text variant="body" tone="ink2">{session.running || finished ? current.how : MOVES[0].how}</Text>
        <Text variant="title2" style={{ color: ui.accent }}>
          {session.running ? `${session.secondsLeft}s` : `${Math.round(phases.reduce((n, p) => n + p.seconds, 0) / 60)} min · ${MOVES.length} moves`}
        </Text>
        {session.running ? <View style={s.bar}><View style={[s.fill, { width: `${Math.round(session.progress * 100)}%` }]} /></View> : null}
      </Card>

      <Button title={session.running ? "Finish" : finished ? "Do it again" : "Start the routine"} onPress={session.running ? session.stop : session.start} />

      {finished ? (
        <Card style={s.saved}>
          <Text variant="title3">Saved on this device</Text>
          <Text variant="meta" tone="ink2">
            {Math.round(phases.reduce((n, p) => n + p.seconds, 0) / 60)} minutes · {MOVES.length} moves
          </Text>
        </Card>
      ) : null}

      {!session.running ? (
        <Card style={s.list}>
          {MOVES.map((m) => (
            <View key={m.label} style={s.row}>
              <Text variant="callout">{m.label}</Text>
              <Text variant="meta" tone="ink3">{m.seconds}s</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={s.info}>
        <Text variant="title3">What this is</Text>
        <Text variant="meta" tone="ink2">
          General mobility for people who sit. Not physiotherapy, not a treatment for an injury —
          if a movement hurts, stop, and see someone who can examine you. This screen costs
          nothing to run and works with no signal.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>
    </WellnessShell>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    big: { gap: 6, marginBottom: space.base },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: 6 },
    fill: { height: 4, backgroundColor: ui.accent },
    saved: { marginTop: space.base, gap: 3 },
    list: { marginTop: space.base },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.hairline },
    info: { marginTop: space.base, gap: 6 },
  });
}
