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
 *
 * Two bugs are fixed in this version, and both were the difference between a demo and a tool:
 *
 *   * the bead count only lived in component state, so it was never written anywhere — the
 *     Progress page's Japa chart was empty no matter how many rounds were counted, and
 *     leaving the screen threw the round away. Beads now go through the shared store's
 *     counter, one bump per tap, and the bead position is *derived* from today's total
 *     (`countToday % 108`) rather than kept beside it, so there is only one number to trust.
 *   * the phrase was never read back — it was written to storage on submit and then shown as
 *     an empty string on the next launch. It now lives in settings, shared with the Profile
 *     page's "Your phrase", which is the same string.
 *
 * The phrase stays on the device. The counts and the finished rounds go to the database under
 * the install's random key — see the Profile page, which says so in full.
 */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Text } from "@/components/ui";
import { InsightPanel } from "@/components/charts";
import { SyncBadge } from "@/components/sync-badge";
import { WellnessShell } from "@/components/wellness-shell";
import { useWellnessStore } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { useProductUI } from "@/lib/product-ui";

const MALA = 108;

export default function Japa() {
  const ui = useProductUI("japa");
  const s = useMemo(() => makeStyles(ui), [ui]);
  const router = useRouter();
  const store = useWellnessStore("japa");
  const { settings, update } = useSettings();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // One stored number, two readings of it: where we are in this round, and how many rounds.
  const count = store.countToday % MALA;
  const rounds = Math.floor(store.countToday / MALA);
  const beadsPct = Math.min(1, count / MALA);

  async function tap() {
    // The next value comes back from the store, not from this render, so a fast sequence of
    // taps still lands the 108th bead on the click and not three taps later.
    const next = await store.bump(1);
    if (next > 0 && next % MALA === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await store.save({
        at: Date.now(),
        screen: "japa",
        minutes: 0,
        units: 1,
        label: `Round ${next / MALA} of ${MALA}`,
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }

  /** Back to the start of this round — the beads already counted today are not thrown away. */
  async function resetBead() {
    if (count > 0) await store.bump(-count);
  }

  return (
    <WellnessShell
      product="japa"
      title="Japa"
      lead="A counter for a repeated phrase. 108 beads a round, one buzz each, a different buzz at the end of a round."
      tabBar={false}
      status={<SyncBadge sync={store.sync} pending={store.pending} lastSyncedAt={store.lastSyncedAt} />}
    >
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
        <Text variant="meta" tone="ink3">
          {rounds > 0
            ? `${rounds} round${rounds > 1 ? "s" : ""} done today · ${store.countToday} beads`
            : `${store.countToday} bead${store.countToday === 1 ? "" : "s"} today`}
        </Text>
      </Pressable>

      <View style={s.row}>
        <Button title="Reset bead" variant="ghost" onPress={resetBead} />
        <Button
          title={editing ? "Done" : "Set phrase"}
          variant="ghost"
          onPress={() => {
            setDraft(settings.phrase);
            setEditing((v) => !v);
          }}
        />
      </View>

      {editing ? (
        <Card style={s.card}>
          <Text variant="meta" tone="ink2">Your phrase, kept on this device only:</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="the words you repeat"
            placeholderTextColor={ui.faint}
            onSubmitEditing={() => {
              update({ phrase: draft.trim() });
              setEditing(false);
            }}
            style={[s.input, { color: ui.ink, borderColor: ui.hairline }]}
          />
        </Card>
      ) : settings.phrase ? (
        <Text variant="callout" tone="ink2" style={s.phrase}>{settings.phrase}</Text>
      ) : null}

      <Card style={s.card}>
        <Text variant="title3">What this is</Text>
        <Text variant="meta" tone="ink2">
          A counter with a haptic, and nothing else. It does not teach a practice, choose words
          for you, or speak for any tradition. Your phrase never leaves this phone; the bead
          count and the rounds you finish are backed up under a random key this phone made, with
          no account attached to it.
        </Text>
        <Button title="Back to the wellness hub" variant="ghost" onPress={() => router.push("/habits")} />
      </Card>
      <InsightPanel screen="japa" unitsLabel="beads" counts={store.countHistory} dailyGoal={MALA} />
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
