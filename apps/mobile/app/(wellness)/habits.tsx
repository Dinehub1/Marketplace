/**
 * Habits — the wellness hub: what you did today, and the way to everything else.
 *
 * Why a hub exists at all: iOS tab bars hold five items before the system buries the rest
 * behind "More", so Water and Japa cannot both be tabs. They are real screens with real
 * jobs, so they live one push away from here — and this is also the one screen that can
 * show today's count for both without opening either.
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { radius, space } from "@hermes/tokens";
import { Card, Press, Text } from "@/components/ui";
import { WellnessShell } from "@/components/wellness-shell";
import { useWellnessStore } from "@/lib/session";
import { useProductUI } from "@/lib/product-ui";

export default function Habits() {
  const ui = useProductUI("habits");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const water = useWellnessStore("water");
  const japa = useWellnessStore("japa");
  const stretch = useWellnessStore("stretch");
  const walk = useWellnessStore("walk");

  return (
    <WellnessShell product="habits" title="Today" lead="Two counts, two routines, all kept on this phone. No account, no signal needed.">
      <View style={s.row}>
        <Counter
          ui={ui}
          label="GLASSES"
          value={String(water.countToday)}
          sub="tap to add"
          onPress={() => router.push("/water")}
        />
        <Counter
          ui={ui}
          label="BEADS"
          value={String(japa.countToday)}
          sub="108 a round"
          onPress={() => router.push("/japa")}
        />
      </View>

      <Press style={s.card} onPress={() => router.push("/stretch")} accessibilityRole="button">
        <Text variant="title3">Stretch</Text>
        <Text variant="meta" tone="ink2">
          Five minutes, eight moves{stretch.last ? ` · last done ${stretch.last.units} moves` : " · not done yet today"}
        </Text>
      </Press>

      <Press style={s.card} onPress={() => router.push("/walk")} accessibilityRole="button">
        <Text variant="title3">Walk</Text>
        <Text variant="meta" tone="ink2">
          Fast a minute, easy two{walk.last ? ` · last ${walk.last.minutes} min` : " · no session yet"}
        </Text>
      </Press>

      <Card style={s.info}>
        <Text variant="title3">Why these four</Text>
        <Text variant="meta" tone="ink2">
          Everything here works with no signal, costs nothing to run, and asks for no account —
          so it works on a walk, on a train, or on the cheapest phone. Nothing on these screens
          is medical advice, and each one says plainly what it is not.
        </Text>
      </Card>
    </WellnessShell>
  );
}

function Counter({
  ui,
  label,
  value,
  sub,
  onPress,
}: {
  ui: ReturnType<typeof useProductUI>;
  label: string;
  value: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${value}, ${sub}`}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: ui.hairline,
        borderRadius: radius.md,
        padding: space.base,
        gap: 2,
        minHeight: 96,
        justifyContent: "center",
      }}
    >
      <Text variant="caption" tone="ink3">{label}</Text>
      <Text variant="title1" style={{ color: ui.accent }}>{value}</Text>
      <Text variant="meta" tone="ink3">{sub}</Text>
    </Press>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    row: { flexDirection: "row", gap: space.sm, marginBottom: space.sm },
    card: {
      borderWidth: 1,
      borderColor: ui.hairline,
      borderRadius: radius.md,
      padding: space.base,
      gap: 3,
      marginBottom: space.sm,
    },
    info: { marginTop: space.sm, gap: 6 },
  });
}
