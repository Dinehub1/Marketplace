/**
 * Profile — goals, your data, and the honest list of what this does not do.
 *
 * Every reference app in this category has this page and it is always the same three
 * things: the settings that change the numbers above (goals), the data (export, erase),
 * and the small print. The version of it that earns trust names the things that are NOT
 * built — reminders, Health, a watch app — instead of showing a dead switch for each.
 */
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Press, Text } from "@/components/ui";
import { WellnessShell } from "@/components/wellness-shell";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { useSettings } from "@/lib/settings";

const WATER_OPTIONS = [4, 6, 8, 10];
const WEEK_OPTIONS = [3, 5, 7];

function Choice({ options, value, onChange, suffix }: { options: number[]; value: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
      {options.map((n) => (
        <Press
          key={n}
          onPress={() => onChange(n)}
          accessibilityRole="button"
          accessibilityState={{ selected: n === value }}
          style={[styles.chip, n === value && styles.chipOn, { minWidth: 72 }]}
        >
          <Text variant="callout" tone={n === value ? "ink" : "ink2"}>{n} {suffix}</Text>
        </Press>
      ))}
    </View>
  );
}

export default function Profile() {
  const ui = useProductUI("water");
  const { settings, update } = useSettings();
  const [confirmErase, setConfirmErase] = useState(false);
  const [erased, setErased] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  /** What is stored, in the person's words. Read, never invented. */
  async function summarise() {
    try {
      const raw = await AsyncStorage.getItem("dropby-wellness");
      const parsed = raw ? JSON.parse(raw) : {};
      const sessions = (parsed.sessions ?? []) as { screen: string }[];
      const counts = (parsed.counts ?? {}) as Record<string, Record<string, number>>;
      const byScreen = new Map<string, number>();
      for (const s of sessions) byScreen.set(s.screen, (byScreen.get(s.screen) ?? 0) + 1);
      const days = Object.values(counts).reduce((n, m) => n + Object.keys(m ?? {}).length, 0);
      setSummary(`${sessions.length} sessions and ${days} counted days stored on this phone.`);
    } catch {
      setSummary("Nothing stored yet.");
    }
  }

  async function erase() {
    try {
      await AsyncStorage.multiRemove(["dropby-wellness", "dropby-breathe", "dropby-wellness-settings"]);
      setErased(true);
      setSummary("Everything deleted from this phone.");
    } catch {
      setSummary("The device refused the delete. Nothing was removed.");
    }
  }

  return (
    <WellnessShell
      product="water"
      title="Profile"
      lead="Your goals, your data. There is no account, because there is no server holding anything."
    >
      <Card>
        <Text variant="caption" tone="ink3">YOUR GOALS</Text>
        <Text variant="meta" tone="ink2" style={styles.p}>Glasses a day. This is a target you set for yourself, not a medical recommendation.</Text>
        <Choice options={WATER_OPTIONS} value={settings.waterGoal} onChange={(n) => update({ waterGoal: n })} suffix="glasses" />
        <Text variant="meta" tone="ink2" style={[styles.p, { marginTop: space.lg }]}>Sessions a week for the timed practices.</Text>
        <Choice options={WEEK_OPTIONS} value={settings.weeklyGoal} onChange={(n) => update({ weeklyGoal: n })} suffix="a week" />
        <Text variant="caption" tone="ink3" style={{ marginTop: space.lg }}>THE PHRASE</Text>
        <Text variant="meta" tone="ink2" style={styles.p}>
          {settings.phrase ? `Your phrase: “${settings.phrase}”` : "No phrase set. Add one on the Breathe or Japa screen and it is kept here."}
        </Text>
      </Card>

      <Card>
        <Text variant="caption" tone="ink3">YOUR DATA</Text>
        <Text variant="meta" tone="ink2" style={styles.p}>
          Sessions and daily counts live in this phone's own storage. Nothing is uploaded, and
          nothing is shared with anyone — not even us.
        </Text>
        <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md, flexWrap: "wrap" }}>
          <Button label="What is stored" onPress={summarise} />
          {confirmErase ? (
            <Button label="Tap again to delete everything" onPress={erase} />
          ) : (
            <Button label="Delete my data" onPress={() => setConfirmErase(true)} />
          )}
        </View>
        {summary ? <Text variant="meta" tone="ink2" style={{ marginTop: space.sm }}>{summary}</Text> : null}
        {erased ? <Text variant="meta" tone="ink3" style={{ marginTop: space.sm }}>Deleted. The apps start counting again from zero.</Text> : null}
      </Card>

      <Card>
        <Text variant="caption" tone="ink3">NOT BUILT YET</Text>
        <Text variant="meta" tone="ink2" style={styles.p}>
          Named rather than silently missing: reminders and notifications, Apple Health and
          Google Fit, a widget or Live Activity, and a watch app. Each one needs a native build
          and a permission this preview does not have, so there is no switch here pretending
          otherwise.
        </Text>
      </Card>

      <Card>
        <Text variant="caption" tone="ink3">ABOUT</Text>
        <Text variant="meta" tone="ink2" style={styles.p}>
          DropBy Wellness · version 0.1 · six practices: breathe, stretch, walk, water, japa,
          sleep. These are timers and counters. They are not medical devices and they do not
          diagnose or treat anything. If you have a condition that affects your breathing,
          hydration or sleep, ask a clinician — not an app.
        </Text>
      </Card>
    </WellnessShell>
  );
}

const styles = StyleSheet.create({
  p: { lineHeight: 19, marginTop: 6 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#D4D4D8",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  chipOn: { borderColor: "#111827", backgroundColor: "#F4F4F5" },
});
