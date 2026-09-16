/**
 * Sleep — a wind-down, in two parts: 4·7·8 rounds, then a "lights out" countdown.
 *
 * Why this and not "sleep sounds": the part a phone can genuinely help with is the last
 * ten minutes — slowing the breath down and then getting out of the way. So the screen
 * does the breathing rounds, then counts down to lights-out while the screen stays dim
 * and still.
 *
 * Honest scope: no claims about curing insomnia or improving sleep stages. It is a
 * wind-down routine with a timer, and it says so.
 */
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { space } from "@hermes/tokens";
import { Button, Card, Text } from "@/components/ui";
import { WellnessShell } from "@/components/wellness-shell";
import { usePhases, useWellnessStore, type Phase } from "@/lib/session";
import { useProductUI } from "@/lib/product-ui";

const ROUNDS = 4;
const LIGHTS_OUT_MIN = 20;

function buildPhases(): Phase[] {
  const out: Phase[] = [];
  for (let i = 0; i < ROUNDS; i++) {
    out.push({ key: `in-${i}`, label: "Breathe in", seconds: 4 });
    out.push({ key: `hold-${i}`, label: "Hold", seconds: 7 });
    out.push({ key: `out-${i}`, label: "Breathe out", seconds: 8 });
  }
  return out;
}

export default function Sleep() {
  const ui = useProductUI("sleep");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("sleep");
  const phases = useMemo(buildPhases, []);
  const [lightsOut, setLightsOut] = useState(false);
  const [leftMs, setLeftMs] = useState(LIGHTS_OUT_MIN * 60_000);

  const session = usePhases(phases, {
    onComplete: () => {
      setLightsOut(true);
      store.save({ at: Date.now(), screen: "sleep", minutes: 2, units: ROUNDS, label: `${ROUNDS} rounds of 4·7·8` });
    },
  });

  /* The lights-out clock: one interval, armed once, exactly like the phase clock — the
     bug that broke Breathe's counters was an effect that depended on its own output. */
  useEffect(() => {
    if (!lightsOut) return;
    const id = setInterval(() => {
      setLeftMs((ms) => {
        const next = ms - 1000;
        if (next <= 0) clearInterval(id);
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lightsOut]);

  const mm = Math.floor(leftMs / 60_000);
  const ss = String(Math.floor((leftMs % 60_000) / 1000)).padStart(2, "0");

  return (
    <WellnessShell product="sleep" title="Sleep" lead={`${ROUNDS} rounds of 4·7·8, then a ${LIGHTS_OUT_MIN}-minute countdown to lights out.`}>
      {!lightsOut ? (
        <Card style={s.big}>
          <Text variant="caption" tone="ink3">4 IN · 7 HOLD · 8 OUT</Text>
          <Text variant="title1">{session.running ? session.phase?.label ?? "" : "Wind down"}</Text>
          <Text variant="title2" style={{ color: ui.accent }}>
            {session.running ? `${session.secondsLeft}s` : `${ROUNDS} rounds · about 2 minutes`}
          </Text>
          {session.running ? (
            <View style={s.bar}><View style={[s.fill, { width: `${Math.round(session.progress * 100)}%` }]} /></View>
          ) : null}
          <Text variant="meta" tone="ink2">
            Longer out than in. If the holds feel tight, shorten them — the point is the slow
            exhale, not the number.
          </Text>
        </Card>
      ) : (
        <Card style={s.big}>
          <Text variant="caption" tone="ink3">LIGHTS OUT IN</Text>
          <Text variant="hero" style={{ color: ui.accent }}>{mm}:{ss}</Text>
          <Text variant="meta" tone="ink2">
            Put the phone face down. The countdown keeps running; nothing needs your attention.
          </Text>
          <Button
            title={leftMs > 0 ? "Skip to lights out" : "Reset the countdown"}
            variant="ghost"
            onPress={() => setLeftMs(leftMs > 0 ? 0 : LIGHTS_OUT_MIN * 60_000)}
          />
        </Card>
      )}

      {!lightsOut ? (
        <Button title={session.running ? "Finish" : "Start the rounds"} onPress={session.running ? session.stop : session.start} />
      ) : null}

      {store.last ? (
        <Text variant="meta" tone="ink3" style={s.note}>Last wind-down: {store.last.label}</Text>
      ) : null}

      <Card style={s.info}>
        <Text variant="title3">What this is not</Text>
        <Text variant="meta" tone="ink2">
          Not a treatment for insomnia and not a promise about sleep quality. It is a
          wind-down with a timer. Don't practise breath-holds in water or while driving, and
          if you feel dizzy, stop. Persistent sleep problems are worth a doctor's time, not an app's.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>
    </WellnessShell>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    big: { gap: 6, marginBottom: space.base },
    bar: { height: 4, borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: space.sm },
    fill: { height: 4, backgroundColor: ui.accent },
    note: { marginTop: space.md },
    info: { marginTop: space.base, gap: 6 },
  });
}
