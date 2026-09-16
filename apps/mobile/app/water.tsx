/**
 * Water — today's glasses, counted in taps.
 *
 * A counter, not a coach. The honest version of a hydration app says what it measures and
 * refuses to invent a medical target: there is no single "right" number of glasses that
 * applies to everybody, so the target here is a setting, not a prescription.
 *
 * Works with no signal, costs nothing, and resets with the date — because "glasses today"
 * is the only number that ever changes anyone's behaviour.
 */
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Text } from "@/components/ui";
import { WellnessShell } from "@/components/wellness-shell";
import { useWellnessStore } from "@/lib/session";
import { useProductUI } from "@/lib/product-ui";

const TARGET = 8;

export default function Water() {
  const ui = useProductUI("water");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("water");
  const done = store.countToday;
  const pct = Math.min(1, done / TARGET);

  return (
    <WellnessShell product="water" title="Water" lead="Tap once per glass. The count resets when the date does." tabBar={false}>
      <Card style={s.big}>
        <Text variant="caption" tone="ink3">TODAY</Text>
        <Text variant="hero" style={{ color: ui.accent }}>{done}</Text>
        <Text variant="meta" tone="ink2">of {TARGET} glasses — a setting you can keep to yourself</Text>
        <View style={s.bar}><View style={[s.fill, { width: `${Math.round(pct * 100)}%` }]} /></View>
        <View style={s.glasses}>
          {Array.from({ length: TARGET }).map((_, i) => (
            <View key={i} style={[s.glass, i < done ? { backgroundColor: ui.accent, borderColor: ui.accent } : null]} />
          ))}
        </View>
      </Card>

      {/* Two 64-point targets, side by side: the thumb is the input device, so the
          buttons are the size of a thumb, not the size of the label. */}
      <View style={s.actions}>
        <Pressable
          onPress={() => store.bump(-1)}
          accessibilityRole="button"
          accessibilityLabel="Remove one glass"
          style={[s.step, { borderColor: ui.hairline }]}
        >
          <Text variant="title1" tone="ink2">−</Text>
        </Pressable>
        <Pressable
          onPress={() => store.bump(1)}
          accessibilityRole="button"
          accessibilityLabel="Add one glass"
          style={[s.step, s.stepMain, { backgroundColor: ui.accent }]}
        >
          <Text variant="title2" style={{ color: "#fff" }}>Add a glass</Text>
        </Pressable>
      </View>

      <Card style={s.info}>
        <Text variant="title3">What this is not</Text>
        <Text variant="meta" tone="ink2">
          Not medical advice. There is no single correct number of glasses for everyone — age,
          weather, activity and health conditions all change it. If you have a heart or kidney
          condition, follow your doctor's number instead of this one.
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
    glasses: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: space.sm },
    glass: { width: 22, height: 28, borderRadius: radius.xs, borderWidth: 1, borderColor: ui.hairline },
    actions: { flexDirection: "row", gap: space.sm },
    step: { minWidth: 64, minHeight: 64, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: space.base },
    stepMain: { flex: 1, borderWidth: 0 },
    info: { marginTop: space.base, gap: 6 },
  });
}
