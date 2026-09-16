/**
 * Japa — a counting aid for a repeated phrase.
 *
 * Why it is not "a religious app": the mechanic is a counter and a haptic. Many traditions
 * count a repeated phrase on a mala of 108 beads, and a phone can hold the count, buzz at
 * each round and stay silent. It does not instruct anyone in a practice, does not choose
 * a phrase, and does not claim spiritual authority — you set the phrase, it counts.
 *
 * The counting rules that matter: a tap anywhere on the pad counts (eyes closed, one
 * thumb), the 108th tap is a different buzz, and rounds are kept so a long practice does
 * not have to be remembered.
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Text } from "@/components/ui";
import { WellnessShell } from "@/components/wellness-shell";
import { useWellnessStore } from "@/lib/session";
import { useProductUI } from "@/lib/product-ui";

const MALA = 108;

export default function Japa() {
  const ui = useProductUI("japa");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("japa");
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [phrase, setPhrase] = useState("");
  const [editing, setEditing] = useState(false);

  const beadsPct = Math.min(1, count / MALA);

  async function tap() {
    const next = count + 1;
    setCount(next);
    if (next >= MALA) {
      setRounds((r) => {
        const rt = r + 1;
        store.save({ at: Date.now(), screen: "japa", minutes: 0, units: 1, label: `Round ${rt} of ${MALA}` });
        return rt;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCount(0);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }

  return (
    <WellnessShell product="japa" title="Japa" lead="A counter for a repeated phrase. 108 beads a round, one buzz each, a different buzz at the end of a round." tabBar={false}>
      {/* The pad is the product: it fills the space a hand covers so the screen can be
          used without looking at it. */}
      <Pressable
        onPress={tap}
        accessibilityRole="button"
        accessibilityLabel={`Count one. Bead ${count + 1} of ${MALA}`}
        style={[s.pad, { borderColor: ui.accent }]}
      >
        <Text variant="hero" style={{ color: ui.accent }}>{count}</Text>
        <Text variant="meta" tone="ink2">{count === 0 ? "Tap anywhere to count" : `bead ${count} of ${MALA}`}</Text>
        <View style={s.bar}><View style={[s.fill, { width: `${Math.round(beadsPct * 100)}%` }]} /></View>
        <Text variant="meta" tone="ink3">{rounds > 0 ? `${rounds} round${rounds > 1 ? "s" : ""} done today` : "no round finished yet"}</Text>
      </Pressable>

      <View style={s.row}>
        <Button title="Reset bead" variant="ghost" onPress={() => setCount(0)} />
        <Button title={editing ? "Done" : "Set phrase"} variant="ghost" onPress={() => setEditing((v) => !v)} />
      </View>

      {editing ? (
        <Card style={s.card}>
          <Text variant="meta" tone="ink2">Your phrase, kept on this device only:</Text>
          <TextInput
            value={phrase}
            onChangeText={setPhrase}
            placeholder="the words you repeat"
            placeholderTextColor={ui.faint}
            onSubmitEditing={() => {
              AsyncStorage.setItem("dropby-japa-phrase", phrase.trim()).catch(() => {});
              setEditing(false);
            }}
            style={[s.input, { color: ui.ink, borderColor: ui.hairline }]}
          />
        </Card>
      ) : phrase ? (
        <Text variant="callout" tone="ink2" style={s.phrase}>{phrase}</Text>
      ) : null}

      <Card style={s.card}>
        <Text variant="title3">What this is</Text>
        <Text variant="meta" tone="ink2">
          A counter with a haptic, and nothing else. It does not teach a practice, choose words
          for you, or speak for any tradition. Nothing is uploaded: the phrase and the count
          stay on this phone.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>
    </WellnessShell>
  );
}

function makeStyles(ui: ReturnType<typeof useProductUI>) {
  return StyleSheet.create({
    pad: {
      borderWidth: 2,
      borderRadius: radius.xl,
      paddingVertical: space.xxl,
      paddingHorizontal: space.base,
      alignItems: "center",
      gap: 6,
      minHeight: 240,
      justifyContent: "center",
    },
    bar: { height: 4, width: "80%", borderRadius: 2, backgroundColor: ui.hairline, overflow: "hidden", marginTop: space.sm },
    fill: { height: 4, backgroundColor: ui.accent },
    row: { flexDirection: "row", gap: space.sm, marginTop: space.base },
    card: { marginTop: space.base, gap: 6 },
    input: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, marginTop: 6 },
    phrase: { marginTop: space.base },
  });
}
