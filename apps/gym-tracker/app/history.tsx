import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Empty, Row, Screen, Section, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { completedSetCount, formatWeight, volume } from '@/lib/training';

export default function History() {
  const { sessions, settings } = useStore();
  const unit = settings.unit;
  const byMonth = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.endedAt - a.endedAt);
    const groups = new Map<string, typeof sorted>();
    for (const s of sorted) {
      const label = new Date(`${s.date}T12:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      groups.set(label, [...(groups.get(label) ?? []), s]);
    }
    return [...groups.entries()];
  }, [sessions]);

  return (
    <Screen>
      {byMonth.length ? (
        byMonth.map(([month, list]) => (
          <View key={month}>
            <Section>{`${month} · ${list.length}`}</Section>
            {list.map((s) => {
              const sets = completedSetCount(s);
              return (
                <Row key={s.id} onPress={() => router.push(`/session/${s.id}`)} style={{ paddingVertical: 16 }}>
                  <View>
                    <T size={18} weight="600">
                      {s.title}
                    </T>
                    <T muted>
                      {new Date(`${s.date}T12:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                      {Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000))} min · {sets} set{sets === 1 ? '' : 's'} ·{' '}
                      {formatWeight(volume(s), unit)} {unit}
                    </T>
                  </View>
                </Row>
              );
            })}
          </View>
        ))
      ) : (
        <Empty>No workouts yet. Tap Start to begin one.</Empty>
      )}
    </Screen>
  );
}
