import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ExerciseThumb } from '@/components/ExerciseMedia';
import { Button, Card, Empty, Field, Pill, ROUTINE_ICONS, RoutineBadge, Screen, Section, Stepper, T } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { exerciseById, exerciseName } from '@/lib/exercises';
import { useStore, WEEKDAYS } from '@/lib/store';
import type { PlanItem } from '@/lib/training';

export default function RoutineEdit() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routineById, saveRoutine, deleteRoutine, schedule, active, startWorkout } = useStore();
  const r = routineById(id);
  if (!r) return <Empty>This routine was deleted.</Empty>;

  const days = schedule.map((d, i) => (d === r.id ? WEEKDAYS[i] : null)).filter(Boolean);
  const setItems = (items: PlanItem[]) => saveRoutine({ ...r, items });
  const patch = (i: number, p: Partial<PlanItem>) => setItems(r.items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= r.items.length) return;
    const next = [...r.items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: r.name || 'Routine' }} />
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <RoutineBadge icon={r.icon} size={52} />
        <Field
          style={{ flex: 1 }}
          value={r.name}
          onChangeText={(name) => saveRoutine({ ...r, name })}
          placeholder="Routine name"
          accessibilityLabel="Routine name"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        {ROUTINE_ICONS.map((icon) => (
          <Pressable
            key={icon}
            accessibilityLabel={`Icon ${icon}`}
            onPress={() => saveRoutine({ ...r, icon })}
            style={{ opacity: r.icon === icon ? 1 : 0.35 }}>
            <RoutineBadge icon={icon} size={38} />
          </Pressable>
        ))}
      </View>
      <T muted style={{ marginTop: 10 }}>
        {days.length ? `Scheduled on ${days.join(', ')}` : 'Not on the week schedule yet. Set a day in Plan.'}
      </T>

      <Section right={<Pill title="Add" icon="add" onPress={() => router.push(`/add-exercise?routine=${r.id}`)} />}>
        {`${r.items.length} exercise${r.items.length === 1 ? '' : 's'}`}
      </Section>
      {r.items.length ? (
        r.items.map((item, i) => (
          <Card key={`${item.exerciseId}-${i}`} style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => router.push(`/exercise/${item.exerciseId}`)}>
                <ExerciseThumb exercise={exerciseById(item.exerciseId)} size={52} />
              </Pressable>
              <T size={17} weight="600" style={{ flex: 1 }}>
                {exerciseName(item.exerciseId)}
              </T>
              <Pressable accessibilityLabel="Move up" hitSlop={8} onPress={() => move(i, -1)} disabled={i === 0}>
                <Ionicons name="arrow-up" size={20} color={i === 0 ? t.border : t.textMuted} />
              </Pressable>
              <Pressable accessibilityLabel="Move down" hitSlop={8} onPress={() => move(i, 1)} disabled={i === r.items.length - 1}>
                <Ionicons name="arrow-down" size={20} color={i === r.items.length - 1 ? t.border : t.textMuted} />
              </Pressable>
              <Pressable accessibilityLabel="Remove" hitSlop={8} onPress={() => setItems(r.items.filter((_, j) => j !== i))}>
                <Ionicons name="trash-outline" size={20} color={t.danger} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <T muted size={12} weight="600" style={{ marginBottom: 6 }}>
                  SETS
                </T>
                <Stepper compact label="sets" value={item.sets} min={1} max={10} onChange={(sets) => patch(i, { sets: Math.round(sets) || 1 })} />
              </View>
              <View style={{ flex: 1 }}>
                <T muted size={12} weight="600" style={{ marginBottom: 6 }}>
                  REPS
                </T>
                <Stepper compact label="reps" value={item.reps} min={1} max={50} onChange={(reps) => patch(i, { reps: Math.round(reps) || 1 })} />
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Empty>No exercises yet. Add some from the library.</Empty>
      )}

      {r.items.length && !active ? (
        <Button
          title={`Start ${r.name}`}
          icon="play"
          onPress={() => {
            startWorkout(r.id);
            router.push('/workout');
          }}
          style={{ marginTop: 8 }}
        />
      ) : null}
      <Button
        title="Delete routine"
        kind="danger"
        style={{ marginTop: 12 }}
        onPress={() =>
          confirm('Delete this routine?', 'Days that use it become rest days. Past workouts stay in your history.', {
            text: 'Delete',
            destructive: true,
            onPress: () => {
              deleteRoutine(r.id);
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
