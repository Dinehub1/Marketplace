import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { useAddToRoutine } from '@/components/AddToRoutine';
import { AreaChart } from '@/components/Charts';
import { ExerciseDemo } from '@/components/ExerciseMedia';
import { Button, Card, Empty, Screen, T, Tag } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { exerciseById, titleCase } from '@/lib/exercises';
import { useStore } from '@/lib/store';
import { bestByExercise, e1rmSeries, formatWeight, toDisplay } from '@/lib/training';

export default function ExerciseDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, settings } = useStore();
  const add = useAddToRoutine();
  const unit = settings.unit;
  const ex = exerciseById(id);

  const history = useMemo(
    () =>
      sessions
        .filter((s) => s.entries.some((e) => e.exerciseId === id))
        .sort((a, b) => b.endedAt - a.endedAt)
        .slice(0, 10)
        .map((s) => ({ s, sets: s.entries.filter((e) => e.exerciseId === id).flatMap((e) => e.sets.filter((x) => x.done)) })),
    [sessions, id],
  );
  const series = useMemo(() => e1rmSeries(id, sessions), [id, sessions]);
  const best = bestByExercise(sessions).get(id);

  if (!ex) return <Empty>Exercise not found.</Empty>;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Stack.Screen options={{ title: '' }} />
        <ExerciseDemo exercise={ex} />
        <T size={28} weight="800" style={{ marginTop: 18 }}>
          {titleCase(ex.name)}
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 16 }}>
          <Tag>{titleCase(ex.target)}</Tag>
          <Tag>{titleCase(ex.equipment)}</Tag>
          <Tag>{titleCase(ex.bodyPart)}</Tag>
          {best && best.weight > 0 ? <Tag active>{`Best: ${formatWeight(best.weight, unit)} ${unit}`}</Tag> : null}
        </View>

        <Button title="Add to a routine" icon="add" kind="soft" onPress={() => add.open(ex)} style={{ marginBottom: 12 }} />

        <Card>
          <T muted size={15} style={{ marginBottom: 8 }}>
            Muscles
          </T>
          <T>
            <T weight="700">{titleCase(ex.target)}</T>
            {ex.secondary.length ? `, with ${ex.secondary.join(', ')}` : ''}
          </T>
        </Card>

        <Card>
          <T muted size={15} style={{ marginBottom: 10 }}>
            How to
          </T>
          {ex.steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
              <T color={t.accent} weight="800" style={{ width: 18 }}>
                {i + 1}
              </T>
              <T style={{ flex: 1, lineHeight: 22 }}>{step}</T>
            </View>
          ))}
        </Card>

        {series.length > 1 ? (
          <Card>
            <T muted size={15} style={{ marginBottom: 10 }}>
              Estimated 1RM ({unit})
            </T>
            <AreaChart points={series.map((p) => ({ date: p.date, value: toDisplay(p.value, unit) }))} empty="" />
          </Card>
        ) : null}

        <Card>
          <T muted size={15} style={{ marginBottom: 6 }}>
            Your history
          </T>
          {history.length ? (
            history.map(({ s, sets }) => (
              <View key={s.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
                <T weight="600">{s.date}</T>
                <T muted>{sets.map((x) => `${formatWeight(x.weight, unit)}×${x.reps}`).join(', ')}</T>
              </View>
            ))
          ) : (
            <Empty>Not done yet.</Empty>
          )}
        </Card>

        <T muted size={12} style={{ textAlign: 'center' }}>
          Instructions: exercises-dataset (MIT). Animation © Gym visual.
        </T>
      </Screen>
      {add.ui}
    </View>
  );
}
