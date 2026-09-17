/**
 * Profile — goals, your data, and the honest list of what this does not do.
 *
 * Every reference app in this category has this page and it is always the same three
 * things: the settings that change the numbers above (goals), the data (export, erase),
 * and the small print. The version of it that earns trust names the things that are NOT
 * built — reminders, Health, a watch app — instead of showing a dead switch for each.
 *
 * ── What changed ──────────────────────────────────────────────────────────────────────
 *
 * It was a page of paragraphs. "Where your data lives" ran to five lines inside the same
 * card as the buttons that act on it, the goals each carried a sentence of preamble, and
 * the privacy explanation was a second wall of text under the actions. A settings page
 * that has to be read is a settings page nobody changes anything on.
 *
 * The facts are all still here — nothing was softened and nothing was dropped, because the
 * whole point of this screen is that it does not overstate what the app does. They moved
 * into disclosures that show one line while closed. The claim that matters most ("the key
 * is random, there is no account, lose the phone and the rows are unreachable") is the
 * closed-state summary, so it is still read by someone who opens nothing.
 *
 * The phrase is now editable here as well as on Breathe. It was always *shown* here, which
 * made this the screen that told you a thing you could only change somewhere else.
 */
import { useMemo, useState } from "react";
import { Share, StyleSheet, TextInput, View } from "react-native";
import { radius, space } from "@hermes/tokens";
import { Button, Card, Disclosure, Press, Text } from "@/components/ui";
import { SoundSwitchRow } from "@/components/sound-toggle";
import { WellnessShell } from "@/components/wellness-shell";
import { SyncBadge } from "@/components/sync-badge";
import { useProductUI, type ProductUI } from "@/lib/product-ui";
import { resetSettings, useSettings } from "@/lib/settings";
import { eraseWellnessData, useWellnessOverview } from "@/lib/session";
import { whenLabel } from "@/lib/stats";

const WATER_OPTIONS = [4, 6, 8, 10];
const WEEK_OPTIONS = [3, 5, 7];
const APP_VERSION = "0.1";

/** A row of mutually exclusive numbers. Selected state is color *and* weight *and* a
 *  border, so it does not depend on colour alone. */
function Choice({
  ui,
  options,
  value,
  onChange,
  suffix,
  label,
}: {
  ui: ProductUI;
  options: number[];
  value: number;
  onChange: (n: number) => void;
  suffix: string;
  label: string;
}) {
  return (
    <View style={s.choiceRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((n) => {
        const on = n === value;
        return (
          <Press
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${n} ${suffix}`}
            style={[
              s.chip,
              {
                borderColor: on ? ui.accent : ui.hairline,
                borderWidth: on ? 1.5 : 1,
                backgroundColor: on ? ui.accentTint : "transparent",
              },
            ]}
          >
            <Text variant="title3" style={{ color: on ? ui.accent : ui.muted }}>
              {n}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}

/**
 * The three sound layers, as switches, with the one limitation stated.
 *
 * Why two and not one master switch: a cue is *information* (it tells you the breath turned over
 * while your eyes are shut) and the bed is *atmosphere* (the layer most likely to be heard through
 * headphones in bed next to somebody asleep). One switch for both would mean turning off the thing
 * you want because of the thing you do not.
 *
 * There used to be a third switch, for a synthesized voice saying the phase words. It was removed
 * along with the voice itself, for sounding robotic on a real phone.
 *
 * The paragraph under them says plainly that there is no spoken voice, and it is here rather than
 * buried because the person most likely to wonder is the one who has just typed their own words into
 * the field directly above.
 */
function SoundSettings({ ui }: { ui: ProductUI }) {
  const { settings, update } = useSettings();
  return (
    <>
      <SoundSwitchRow
        label="Cues"
        hint="A rising tone in, a falling tone out, and a chime at the end"
        on={settings.cuesOn}
        onPress={() => update({ cuesOn: !settings.cuesOn })}
      />
      <SoundSwitchRow
        label="Backdrop"
        hint="A quiet drone under Breathe and Sleep"
        on={settings.droneOn}
        onPress={() => update({ droneOn: !settings.droneOn })}
      />
      <Text variant="meta" tone="ink2" style={s.p}>
        Generated inside the app, so it works with no signal and nothing is downloaded. There is no
        spoken voice — the rising and falling tones carry the phase, and the two lines above are yours
        to read at your own pace. The backdrop stops when the app is closed or the phone is locked:
        this app does not play audio in the background.
      </Text>
    </>
  );
}

/** The phrase, with an inline editor. */
function PhraseEditor({ ui }: { ui: ProductUI }) {
  const { settings, update } = useSettings();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(settings.phrase);

  function commit() {
    update({ phrase: text.trim() });
    setEditing(false);
  }

  if (editing) {
    return (
      <View style={s.phraseEdit}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={commit}
          placeholder="e.g. Breathe in"
          placeholderTextColor={ui.faint}
          returnKeyType="done"
          autoFocus
          accessibilityLabel="Your phrase"
          style={[
            s.input,
            { borderColor: ui.hairline, color: ui.ink, borderRadius: radius.sm },
          ]}
        />
        <View style={s.phraseButtons}>
          <Button title="Save" onPress={commit} style={s.phraseButton} />
          <Button
            title="Clear"
            variant="ghost"
            onPress={() => {
              setText("");
              update({ phrase: "" });
              setEditing(false);
            }}
            style={s.phraseButton}
          />
        </View>
      </View>
    );
  }

  return (
    <Press
      onPress={() => {
        setText(settings.phrase);
        setEditing(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={
        settings.phrase ? `Your phrase is ${settings.phrase}. Tap to change.` : "No phrase set. Tap to set one."
      }
      style={s.phraseCard}
    >
      <View style={{ flex: 1 }}>
        {settings.phrase ? (
          <Text variant="body">{settings.phrase}</Text>
        ) : (
          <Text variant="body" tone="ink3">
            No phrase set
          </Text>
        )}
        <Text variant="meta" tone="ink3">
          {settings.phrase
            ? "Shown on the Breathe screen"
            : "Add one and it appears on the Breathe screen"}
        </Text>
      </View>
      <Text variant="callout" tone="ink3">
        ›
      </Text>
    </Press>
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
  const totals = useMemo(() => {
    const practices = new Set(overview.sessions.map((session) => session.screen));
    const countedDays = Object.values(overview.counts).reduce(
      (total, days) => total + Object.keys(days).length,
      0,
    );
    return {
      sessions: overview.sessions.length,
      practices: practices.size,
      countedDays,
      last: overview.sessions[0] ?? null,
    };
  }, [overview.sessions, overview.counts]);

  const empty = totals.sessions === 0 && totals.countedDays === 0;

  /** The whole record, as a file the person can keep. Shared through the OS, not uploaded. */
  async function exportData() {
    setStatus(null);
    try {
      const payload = {
        app: "Dropby Wellness",
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
        title: "Dropby Wellness data",
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

  const lastSeen = totals.last ? whenLabel(totals.last.at) : null;

  return (
    <WellnessShell
      product="water"
      title="Profile"
      lead="Your goals, your data, and where each one lives."
      status={<SyncBadge sync={overview.sync} pending={overview.pending} lastSyncedAt={overview.lastSyncedAt} />}
      headerAction={null}
    >
      <Card style={s.card}>
        <Text variant="caption" tone="ink3">
          YOUR GOALS
        </Text>
        <View style={s.goalBlock}>
          <Text variant="callout">Daily water goal</Text>
          <Choice
            ui={ui}
            label="Daily water goal, in glasses"
            options={WATER_OPTIONS}
            value={settings.waterGoal}
            onChange={(n) => update({ waterGoal: n })}
            suffix="glasses"
          />
        </View>
        <View style={s.goalBlock}>
          <Text variant="callout">Weekly practice goal</Text>
          <Choice
            ui={ui}
            label="Weekly practice goal, in sessions"
            options={WEEK_OPTIONS}
            value={settings.weeklyGoal}
            onChange={(n) => update({ weeklyGoal: n })}
            suffix="sessions a week"
          />
        </View>
        <Text variant="meta" tone="ink3">
          Targets you set for yourself, kept on this device. Not medical advice.
        </Text>
      </Card>

      <Card style={s.card}>
        <Text variant="caption" tone="ink3">
          YOUR PHRASE
        </Text>
        <PhraseEditor ui={ui} />
      </Card>

      {/* Sound is a settings page concern because it is three different promises: a cue carries
          information, a voice is a character, and a bed is atmosphere. Somebody who wants the tones
          but not the voice, or the voice but not a drone in the room, can only be served by three
          switches — see `lib/settings.ts`. The limitation under them is stated because the person
          most likely to be surprised by it is the one who has just typed their own phrase. */}
      <Card style={s.card}>
        <Text variant="caption" tone="ink3">
          SOUND
        </Text>
        <SoundSettings ui={ui} />
      </Card>

      <Card style={s.card}>
        <Text variant="caption" tone="ink3">
          YOUR DATA
        </Text>
        {empty ? (
          <Text variant="meta" tone="ink2">
            Nothing stored yet. Finish a practice and it appears here and in Progress.
          </Text>
        ) : (
          <View style={s.dataRow}>
            <Stat value={String(totals.sessions)} label={totals.sessions === 1 ? "session" : "sessions"} />
            <Stat value={String(totals.practices)} label={totals.practices === 1 ? "practice" : "practices"} />
            <Stat
              value={String(totals.countedDays)}
              label={totals.countedDays === 1 ? "counted day" : "counted days"}
            />
          </View>
        )}
        {lastSeen ? (
          <Text variant="meta" tone="ink3">
            Most recent: {lastSeen}
          </Text>
        ) : null}

        <View style={s.actions}>
          <Button
            title={busy ? "Working…" : "Sync now"}
            onPress={syncNow}
            disabled={busy}
            style={s.action}
          />
          <Button
            title="Export data"
            variant="secondary"
            onPress={exportData}
            disabled={busy}
            style={s.action}
          />
        </View>
        {confirmErase ? (
          <Button
            title="Tap again to delete everything"
            variant="secondary"
            onPress={erase}
            disabled={busy}
            haptic="medium"
          />
        ) : (
          <Button
            title="Delete my data"
            variant="ghost"
            onPress={() => setConfirmErase(true)}
            disabled={busy}
          />
        )}
        {status ? (
          <Text variant="meta" tone="ink2" style={s.status}>
            {status}
          </Text>
        ) : null}
      </Card>

      <Card style={s.card}>
        <Disclosure
          title="Where your data lives"
          subtitle="A random key on this phone. No account, no email."
        >
          <Text variant="meta" tone="ink2" style={s.p}>
            Sessions and daily counts are kept in a private row in our database, keyed to a
            random string this phone made the first time the app opened. There is no account
            and no email. If the app is uninstalled or the phone is lost, that key goes with
            it and the rows can no longer be reached — which is the trade for never asking you
            to sign up.
          </Text>
        </Disclosure>

        <Disclosure title="What leaves the phone" subtitle="Sessions and daily totals only.">
          <Text variant="meta" tone="ink2" style={s.p}>
            Sessions (practice, time, minutes, units) and daily counter totals. Not the goals,
            not the phrase, not any identifier that could be traced back to you — the sync key
            is random and belongs to this install alone.
          </Text>
        </Disclosure>

        <Disclosure title="Works offline" subtitle="No signal needed to practise or to save.">
          <Text variant="meta" tone="ink2" style={s.p}>
            Every practice works with aeroplane mode on. A finished session is written to this
            phone first and queued; it reaches the database the next time there is a network.
            The badge at the top of every screen says which of those two is currently true.
          </Text>
        </Disclosure>
      </Card>

      <Card style={s.card}>
        <Disclosure title="Not built yet" subtitle="Reminders, Health, widget, watch app, new phone.">
          <Text variant="meta" tone="ink2" style={s.p}>
            Named rather than silently missing: reminders and notifications, Apple Health and
            Google Fit, a widget or Live Activity, and a watch app. Each one needs a native
            build and a permission this preview does not have, so there is no switch here
            pretending otherwise. Moving to a new phone is also not built: the sync key does
            not travel, so a new install starts its own record.
          </Text>
        </Disclosure>
      </Card>

      <Card style={s.card}>
        <Text variant="caption" tone="ink3">
          ABOUT
        </Text>
        <Text variant="meta" tone="ink2">
          Dropby Wellness {APP_VERSION} · six practices: breathe, stretch, walk, water, japa,
          sleep.
        </Text>
        <Text variant="meta" tone="ink3" style={s.p}>
          These are timers and counters. They are not medical devices and they do not diagnose
          or treat anything. If you have a condition that affects your breathing, hydration or
          sleep, ask a clinician — not an app.
        </Text>
      </Card>
    </WellnessShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text variant="title2">{value}</Text>
      <Text variant="caption" tone="ink3">
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: space.sm, gap: space.sm },
  p: { lineHeight: 19, marginTop: 2 },
  goalBlock: { gap: space.sm },
  dataRow: { flexDirection: "row", gap: space.lg },
  stat: { gap: 0 },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.xs },
  action: { flex: 1 },
  status: { marginTop: space.xs, lineHeight: 18 },
  phraseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    borderWidth: 1,
    borderColor: "transparent",
  },
  phraseEdit: { gap: space.sm },
  phraseButtons: { flexDirection: "row", gap: space.sm },
  phraseButton: { flex: 1 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  choiceRow: { flexDirection: "row", gap: space.sm },
  chip: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    minHeight: 44,
  },
  switchText: { flex: 1, gap: 1 },
  switchHint: { lineHeight: 15 },
  switchDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
});
