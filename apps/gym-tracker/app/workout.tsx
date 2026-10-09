import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseDemo } from '@/components/ExerciseMedia';
import { Button, Empty, RoundButton, Stepper, T, Tag } from '@/components/ui';
import { radius, useTheme } from '@/constants/theme';
import { confirm, notify } from '@/lib/confirm';
import { exerciseById, exerciseName, titleCase } from '@/lib/exercises';
import { useStore } from '@/lib/store';
import { bestByExercise, formatWeight, fromDisplay, lastPerformance, suggestion, toDisplay, type SetLog } from '@/lib/training';

const KEEP_AWAKE_TAG = 'workout';

function useNow(ms = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

export default function Workout() {
  const t = useTheme();
  const { active, sessions, settings, updateActive, finishWorkout, discardWorkout } = useStore();
  const now = useNow();
  const unit = settings.unit;
  const bests = useMemo(() => bestByExercise(sessions), [sessions]);

  // The screen stays on while a workout is open, so the phone is not unlocked between every set.
  useEffect(() => {
    if (!settings.keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [settings.keepAwake]);

  const restLeft = active?.restUntil ? active.restUntil - now : 0;
  useEffect(() => {
    if (active?.restUntil && restLeft <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      updateActive((w) => ({ ...w, restUntil: null }));
    }
  }, [active?.restUntil, restLeft, updateActive]);

  if (!active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background, justifyContent: 'center', padding: 24 }}>
        <Empty>No workout in progress.</Empty>
        <Button title="Back" kind="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const n = active.entries.length;
  const index = Math.min(active.index ?? 0, Math.max(0, n - 1));
  const entry = active.entries[index];
  const ex = entry ? exerciseById(entry.exerciseId) : undefined;
  const done = active.entries.reduce((c, e) => c + e.sets.filter((s) => s.done).length, 0);
  const total = active.entries.reduce((c, e) => c + e.sets.length, 0);
  const last = entry ? lastPerformance(entry.exerciseId, sessions) : null;
  const hint = entry ? suggestion(last, entry.targetReps) : null;
  const best = entry ? bests.get(entry.exerciseId) : undefined;
  const weightStep = unit === 'kg' ? 2.5 : 5;

  const go = (i: number) => updateActive((w) => ({ ...w, index: Math.max(0, Math.min(w.entries.length - 1, i)) }));
  const setSet = (si: number, patch: Partial<SetLog>) =>
    updateActive((w) => ({
      ...w,
      entries: w.entries.map((e, i) =>
        i === index ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    }));
  const toggleDone = (si: number) => {
    const wasDone = entry.sets[si].done;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const rest = settings.restSeconds * 1000;
    updateActive((w) => ({
      ...w,
      restUntil: wasDone ? w.restUntil : Date.now() + rest,
      restTotal: wasDone ? w.restTotal : rest,
      entries: w.entries.map((e, i) =>
        i === index ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, done: !s.done } : s)) } : e,
      ),
    }));
  };
  const addSet = () =>
    updateActive((w) => ({
      ...w,
      entries: w.entries.map((e, i) => {
        if (i !== index) return e;
        const prev = e.sets[e.sets.length - 1] ?? { weight: 0, reps: e.targetReps, done: false };
        return { ...e, sets: [...e.sets, { weight: prev.weight, reps: prev.reps, done: false }] };
      }),
    }));
  const removeSet = () =>
    updateActive((w) => ({
      ...w,
      entries: w.entries.map((e, i) => (i === index && e.sets.length > 1 ? { ...e, sets: e.sets.slice(0, -1) } : e)),
    }));
  const removeExercise = () =>
    confirm('Remove exercise?', exerciseName(entry.exerciseId), {
      text: 'Remove',
      destructive: true,
      onPress: () =>
        updateActive((w) => ({ ...w, entries: w.entries.filter((_, i) => i !== index), index: Math.max(0, index - 1) })),
    });

  const finish = () => {
    const complete = () => {
      const result = finishWorkout();
      if (!result || !result.session.entries.length) {
        router.back();
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const lines = result.records.map(
        (r) => `${exerciseName(r.exerciseId)}: ${formatWeight(r.value, unit)} ${unit}${r.kind === 'e1rm' ? ' est. 1RM' : ` × ${r.reps}`}`,
      );
      router.replace(`/session/${result.session.id}`);
      if (lines.length) notify(`New record${lines.length > 1 ? 's' : ''}! 🏆`, lines.join('\n'));
    };
    if (done === 0) {
      confirm(
        'Nothing logged',
        'No set is ticked off, so there is nothing to save.',
        { text: 'Discard workout', destructive: true, onPress: () => (discardWorkout(), router.back()) },
        'Keep training',
      );
    } else if (done < total) {
      confirm(
        'Finish workout?',
        `${total - done} set${total - done === 1 ? '' : 's'} not ticked off will not be saved.`,
        { text: 'Finish', onPress: complete },
        'Keep training',
      );
    } else {
      complete();
    }
  };

  const lastLine = last
    ? `Last time (${new Date(`${sessions.find((s) => s.entries.includes(last))?.date ?? ''}T12:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}): ${last.sets
        .filter((s) => s.done)
        .map((s) => `${formatWeight(s.weight, unit)}×${s.reps}`)
        .join(', ')}`
    : null;
  const hintText =
    !hint || !entry
      ? null
      : hint.reason === 'up'
        ? `Last time you hit all reps — try ${formatWeight(hint.weight, unit)} ${unit}`
        : hint.reason === 'repeat'
          ? `Missed reps last time — stay at ${formatWeight(hint.weight, unit)} ${unit}`
          : hint.reason === 'first'
            ? `First time — pick a weight you can lift ${entry.targetReps} times`
            : `Bodyweight — add reps when it gets easy`;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: t.background }}>
      <View style={styles.top}>
        <RoundButton icon="close" label="Minimise workout" onPress={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T size={20} weight="700" numberOfLines={1}>
            {active.title}
          </T>
          <T muted size={16} style={{ fontVariant: ['tabular-nums'] }}>
            {clock(now - active.startedAt)} · {done}/{total} sets
          </T>
        </View>
        <RoundButton icon="checkmark" label="Finish workout" tint={t.accent} filled onPress={finish} />
      </View>
      <View style={[styles.progress, { backgroundColor: t.surfaceAlt }]}>
        <View style={{ width: `${total ? (done / total) * 100 : 0}%`, height: '100%', backgroundColor: t.accent, borderRadius: 3 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        {!entry ? (
          <View style={{ paddingTop: 40 }}>
            <Empty>No exercises in this workout yet.</Empty>
            <Button title="Add exercise" icon="add" onPress={() => router.push('/add-exercise?to=workout')} />
          </View>
        ) : (
          <>
            <T muted size={16} style={{ marginBottom: 10 }}>
              Exercise {index + 1} / {n}
            </T>
            <ExerciseDemo exercise={ex} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18 }}>
              <T size={26} weight="800" style={{ flex: 1 }}>
                {exerciseName(entry.exerciseId)}
              </T>
              <RoundButton icon="information-circle-outline" label="Exercise details" onPress={() => router.push(`/exercise/${entry.exerciseId}`)} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {ex ? <Tag>{titleCase(ex.target)}</Tag> : null}
              {ex ? <Tag>{titleCase(ex.equipment)}</Tag> : null}
              {best && best.weight > 0 ? <Tag>{`Best: ${formatWeight(best.weight, unit)} ${unit}`}</Tag> : null}
            </View>
            {lastLine ? (
              <T muted size={15} style={{ marginTop: 12 }}>
                {lastLine}
              </T>
            ) : null}
            {hintText ? (
              <View style={[styles.hint, { backgroundColor: t.accentSoft }]}>
                <Ionicons name="bulb-outline" size={15} color={t.accentInk} />
                <T color={t.accentInk} size={14} style={{ flexShrink: 1 }}>
                  {hintText}
                </T>
              </View>
            ) : null}

            <View style={[styles.sets, { backgroundColor: t.surface }]}>
              <View style={styles.setHead}>
                <View style={{ width: 28 }} />
                <T muted size={13} weight="600" style={{ flex: 1, textAlign: 'center' }}>
                  WEIGHT ({unit.toUpperCase()})
                </T>
                <T muted size={13} weight="600" style={{ flex: 1, textAlign: 'center' }}>
                  REPS
                </T>
                <View style={{ width: 40 }} />
              </View>
              {entry.sets.map((s, si) => (
                <View key={si} style={styles.setRow}>
                  <View style={[styles.setNum, { backgroundColor: s.done ? t.accentSoft : t.surfaceAlt }]}>
                    <Text style={{ color: s.done ? t.accentInk : t.textMuted, fontWeight: '700' }}>{si + 1}</Text>
                  </View>
                  <Stepper
                    label={`set ${si + 1} weight`}
                    value={Math.round(toDisplay(s.weight, unit) * 100) / 100}
                    step={weightStep}
                    max={2000}
                    format={(v) => formatWeight(fromDisplay(v, unit), unit)}
                    onChange={(v) => setSet(si, { weight: fromDisplay(v, unit) })}
                  />
                  <Stepper
                    label={`set ${si + 1} reps`}
                    value={s.reps}
                    max={200}
                    parse={(x) => parseInt(x, 10)}
                    onChange={(v) => setSet(si, { reps: Math.round(v) })}
                  />
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: s.done }}
                    accessibilityLabel={`Set ${si + 1} done`}
                    onPress={() => toggleDone(si)}
                    style={[styles.check, s.done ? { backgroundColor: t.accent } : { borderWidth: 2, borderColor: t.border }]}>
                    <Ionicons name="checkmark" size={22} color={s.done ? t.accentText : t.textMuted} />
                  </Pressable>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 6 }}>
                <Pressable onPress={addSet} hitSlop={8}>
                  <T color={t.accent} weight="700">
                    + Add set
                  </T>
                </Pressable>
                {entry.sets.length > 1 ? (
                  <Pressable onPress={removeSet} hitSlop={8}>
                    <T muted weight="600">
                      Remove set
                    </T>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button title="Previous" kind="secondary" icon="chevron-back" disabled={index === 0} onPress={() => go(index - 1)} style={{ flex: 1 }} />
              {index < n - 1 ? (
                <Button title="Next" kind="soft" onPress={() => go(index + 1)} style={{ flex: 1 }} />
              ) : (
                <Button title="Finish" icon="checkmark" onPress={finish} style={{ flex: 1 }} />
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 4 }}>
              <Pressable onPress={() => router.push('/add-exercise?to=workout')} hitSlop={8}>
                <T color={t.accent} weight="600">
                  + Add exercise
                </T>
              </Pressable>
              <Pressable onPress={removeExercise} hitSlop={8}>
                <T muted weight="600">
                  Remove exercise
                </T>
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  confirm('Discard workout?', 'Nothing from this session will be saved.', {
                    text: 'Discard',
                    destructive: true,
                    onPress: () => (discardWorkout(), router.back()),
                  })
                }>
                <T color={t.danger} weight="600">
                  Discard
                </T>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {active.restUntil && restLeft > 0 ? (
        <View style={[styles.rest, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'], width: 92 }}>{clock(restLeft)}</Text>
          <View style={[styles.restTrack, { backgroundColor: t.surfaceAlt }]}>
            <View
              style={{
                width: `${Math.max(0, Math.min(1, restLeft / (active.restTotal || settings.restSeconds * 1000))) * 100}%`,
                height: '100%',
                backgroundColor: t.accent,
                borderRadius: 3,
              }}
            />
          </View>
          <Pressable
            accessibilityLabel="Add 15 seconds"
            hitSlop={6}
            onPress={() =>
              updateActive((w) => ({ ...w, restUntil: (w.restUntil ?? Date.now()) + 15000, restTotal: w.restTotal + 15000 }))
            }
            style={{ paddingHorizontal: 8 }}>
            <T color={t.accent} size={18} weight="600">
              + 15s
            </T>
          </Pressable>
          <Pressable
            accessibilityLabel="Skip rest"
            onPress={() => updateActive((w) => ({ ...w, restUntil: null }))}
            style={[styles.skip, { backgroundColor: t.accent }]}>
            <Text style={{ color: t.accentText, fontWeight: '800', fontSize: 17 }}>Skip</Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  progress: { height: 5, borderRadius: 3, marginHorizontal: 16, marginTop: 12, overflow: 'hidden' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9, marginTop: 8 },
  sets: { borderRadius: radius.lg, padding: 12, marginTop: 16 },
  setHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  setNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  check: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rest: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 28,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  restTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  skip: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
});
