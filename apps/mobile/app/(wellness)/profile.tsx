/**
 * Profile — goals, your data, and the honest list of what this does not do.
 *
 * Every reference app in this category has this page and it is always the same three
 * things: the settings that change the numbers above (goals), the data (export, erase),
 * and the small print. The version of it that earns trust names the things that are NOT
 * built — reminders, Health, a watch app — instead of showing a dead switch for each.
 *
 * It is also the one screen that can explain where the data actually goes, because it is the
 * screen a person opens when they want to know. So it says the split out loud: sessions and
 * daily counts are in the main database, keyed to a random string this phone generated;
 * goals and the phrase never leave the device. And it says the consequence of that choice —
 * lose the phone, lose the key, and the rows become unreachable — rather than implying a
 * backup that can be restored to an account that does not exist.
 */
import { useMemo, useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Press, Text } from "@/components/ui";
import { WellnessShell } from "@/components/wellness-shell";
import { SyncBadge } from "@/components/sync-badge";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { resetSettings, useSettings } from "@/lib/settings";
import { eraseWellnessData, useWellnessOverview } from "@/lib/session";
import { whenLabel } from "@/lib/stats";

const WATER_OPTIONS = [4, 6, 8, 10];
const WEEK_OPTIONS = [3, 5, 7];

function Choice({
  ui,
  options,
  value,
  onChange,
  suffix,
}: {
  ui: ProductUI;
  options: number[];
  value: number;
  onChange: (n: number) => void;
  suffix: string;
}) {
  return (
    <View style={s.choiceRow}>
      {options.map((n) => {
        const on = n === value;
        return (
          <Press
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[
              s.chip,
              { borderColor: on ? ui.accent : ui.hairline, backgroundColor: on ? ui.accentTint : "transparent" },
            ]}
          >
            <Text variant="callout" tone={on ? "ink" : "ink2"}>
              {n} {suffix}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}

export default function Profile() {
  const ui = useProductUI("water");
  const { settings, update } = useSettings();
  const overview = useWellnessOverview();

  const [confirmErase, setConfirmErase] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  /** What is actually stored, counted from the store rather than from an idea of it. */
  const summary = useMemo(() => {
    const practices = new Set(overview.sessions.map((session) => session.screen));
    const countedDays = Object.values(overview.counts).reduce(
      (total, days) => total + Object.keys(days).length,
      0,
    );
    if (!overview.sessions.length && !countedDays) return "Nothing stored yet.";
    const last = overview.sessions[0];
    return [
      `${overview.sessions.length} session${overview.sessions.length === 1 ? "" : "s"} across ${practices.size} practice${practices.size === 1 ? "" : "s"}`,
      `${countedDays} counted day${countedDays === 1 ? "" : "s"}`,
      last ? `most recent ${whenLabel(last.at)}` : null,
    ]
      .filter(Boolean)
      .join(" · ") + ".";
  }, [overview.sessions, overview.counts]);

  /** The whole record, as a file the person can keep. Shared through the OS, not uploaded. */
  async function exportData() {
    setStatus(null);
    try {
      const payload = {
        app: "DropBy Wellness",
        exportedAt: new Date().toISOString(),
        sessions: overview.sessions.map((session) => ({
          practice: session.screen,
          at: new Date(session.at).toISOString(),
          minutes: session.minutes,
          units: session.units,
          label: session.label,
        })),
        dailyCounts: overview.counts,
      };
      await Share.share({
        title: "DropBy Wellness data",
        message: JSON.stringify(payload, null, 2),
      });
      setStatus("Exported through your share sheet. Nothing was sent to us.");
    } catch {
      setStatus("Your device declined the share. Nothing left the app.");
    }
  }

  async function syncNow() {
    setBusy(true);
    setStatus(null);
    await overview.refresh();
    setBusy(false);
  }

  async function erase() {
    setBusy(true);
    setStatus(null);
    const { remote } = await eraseWellnessData();
    await resetSettings();
    setBusy(false);
    setConfirmErase(false);
    // The database half is reported separately, because "deleted" and "deleted as far as this
    // phone can tell" are different claims and only one of them is always true.
    setStatus(
      remote
        ? "Deleted from this phone and from the database. Counting starts again from zero."
        : "Deleted from this phone. The database could not be reached — delete again when you have a signal.",
    );
  }

  return (
    <WellnessShell
      product="water"
      title="Profile"
      lead="Your goals, your data, and exactly where each one lives."
      status={<SyncBadge sync={overview.sync} pending={overview.pending} lastSyncedAt={overview.lastSyncedAt} />}
    >
      <Card style={s.card}>
        <Text variant="caption" tone="ink3">YOUR GOALS · ON THIS DEVICE</Text>
        <Text variant="meta" tone="ink2" style={s.p}>
          Glasses a day. This is a target you set for yourself, not a medical recommendation.
        </Text>
        <Choice ui={ui} options={WATER_OPTIONS} value={settings.waterGoal} onChange={(n) => update({ waterGoal: n })} suffix="glasses" />
        <Text variant="meta" tone="ink2" style={[s.p, s.spaced]}>
          Sessions a week for the timed practices.
        </Text>
        <Choice ui={ui} options={WEEK_OPTIONS} value={settings.weeklyGoal} onChange={(n) => update({ weeklyGoal: n })} suffix="a week" />
        <Text variant="caption" tone="ink3" style={s.spaced}>THE PHRASE · ON THIS DEVICE</Text>
        <Text variant="meta" tone="ink2" style={s.p}>
          {settings.phrase
            ? `Your phrase: “${settings.phrase}”`
            : "No phrase set. Add one on the Breathe screen and it is kept here."}
        </Text>
      </Card>

      <Card style={s.card}>
        <Text variant="caption" tone="ink3">YOUR DATA</Text>
        <Text variant="meta" tone="ink2" style={s.p}>
          Sessions and daily counts are kept in a private row in our database, keyed to a random
          string this phone made the first time the app opened. There is no account and no email.
          If the app is uninstalled or the phone is lost, that key goes with it and the rows can no
          longer be reached — which is the trade for never asking you to sign up.
        </Text>
        <Text variant="meta" tone="ink2" style={s.p}>{summary}</Text>
        <View style={s.actions}>
          <Button title={busy ? "Working…" : "Sync now"} onPress={syncNow} disabled={busy} />
          <Button title="Export as JSON" variant="secondary" onPress={exportData} disabled={busy} />
        </View>
        <View style={s.actions}>
          {confirmErase ? (
            <Button title="Tap again to delete everything" variant="secondary" onPress={erase} disabled={busy} />
          ) : (
            <Button title="Delete my data" variant="ghost" onPress={() => setConfirmErase(true)} disabled={busy} />
          )}
        </View>
        {status ? <Text variant="meta" tone="ink2" style={s.p}>{status}</Text> : null}
        <Text variant="caption" tone="ink3" style={s.spaced}>WHAT LEAVES THE PHONE</Text>
        <Text variant="meta" tone="ink3" style={s.p}>
          Sessions (practice, time, minutes, units) and daily counter totals. Not the goals, not
          the phrase, not any identifier that could be traced back to you — the sync key is random
          and belongs to this install alone.
        </Text>
      </Card>

      <Card style={s.card}>
        <Text variant="caption" tone="ink3">NOT BUILT YET</Text>
        <Text variant="meta" tone="ink2" style={s.p}>
          Named rather than silently missing: reminders and notifications, Apple Health and
          Google Fit, a widget or Live Activity, and a watch app. Each one needs a native build
          and a permission this preview does not have, so there is no switch here pretending
          otherwise. Moving to a new phone is also not built: the sync key does not travel, so a
          new install starts its own record.
        </Text>
      </Card>

      <Card style={s.card}>
        <Text variant="caption" tone="ink3">ABOUT</Text>
        <Text variant="meta" tone="ink2" style={s.p}>
          DropBy Wellness · version 0.1 · six practices: breathe, stretch, walk, water, japa,
          sleep. These are timers and counters. They are not medical devices and they do not
          diagnose or treat anything. If you have a condition that affects your breathing,
          hydration or sleep, ask a clinician — not an app.
        </Text>
      </Card>
    </WellnessShell>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: space.sm, gap: 4 },
  p: { lineHeight: 19, marginTop: 6 },
  spaced: { marginTop: space.lg },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.md, flexWrap: "wrap" },
  choiceRow: { flexDirection: "row", gap: space.sm, flexWrap: "wrap", marginTop: 6 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 84,
  },
});
