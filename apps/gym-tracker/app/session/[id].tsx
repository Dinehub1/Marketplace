import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ExerciseThumb } from '@/components/ExerciseMedia';
import { Button, Card, Empty, Screen, T } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { exerciseById, exerciseName } from '@/lib/exercises';
import { useStore } from '@/lib/store';
import { completedSetCount, formatWeight, volume } from '@/lib/training';

export default function SessionDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, settings, deleteSession } = useStore();
  const unit = settings.unit;
  const s = sessions.find((x) => x.id === id);
  if (!s) return <Empty>This workout was deleted.</Empty>;

  const minutes = Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000));
  const sets = completedSetCount(s);
  const stat = (value: string, label: string) => (
    <Card style={{ flex: 1, marginBottom: 0, padding: 14 }}>
      <T size={22} weight="800">
        {value}
      </T>
      <T muted size={13}>
        {label}
      </T>
    </Card>
  );

  return (
    <Screen
      title={s.title}
      subtitle={new Date(`${s.date}T12:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {stat(`${minutes} min`, 'duration')}
        {stat(String(sets), sets === 1 ? 'set' : 'sets')}
        {stat(`${formatWeight(volume(s), unit)}`, `${unit} moved`)}
      </View>
      {s.entries.map((e, i) => (
        <Pressable key={`${e.exerciseId}-${i}`} onPress={() => router.push(`/exercise/${e.exerciseId}`)}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <ExerciseThumb exercise={exerciseById(e.exerciseId)} size={48} />
              <T size={17} weight="700" style={{ flex: 1 }}>
                {exerciseName(e.exerciseId)}
              </T>
            </View>
            {e.sets
              .filter((x) => x.done)
              .map((x, j) => (
                <View key={j} style={{ flexDirection: 'row', paddingVertical: 4, borderTopWidth: j ? 1 : 0, borderTopColor: t.border }}>
                  <T muted>Set {j + 1}</T>
                  <T weight="600" style={{ marginLeft: 'auto' }}>
                    {formatWeight(x.weight, unit)} {unit} × {x.reps}
                  </T>
                </View>
              ))}
          </Card>
        </Pressable>
      ))}
      <Button
        title="Delete workout"
        kind="danger"
        style={{ marginTop: 8 }}
        onPress={() =>
          confirm('Delete this workout?', 'It will be removed from your history and records.', {
            text: 'Delete',
            destructive: true,
            onPress: () => {
              deleteSession(s.id);
              router.back();
            },
          })
        }
      />
    </Screen>
  );
}
