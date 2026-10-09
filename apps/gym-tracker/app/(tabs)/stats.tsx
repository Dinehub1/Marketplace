import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { BodyWeightCard } from '@/components/BodyWeightCard';
import { AreaChart, Heatmap } from '@/components/Charts';
import { ExerciseThumb } from '@/components/ExerciseMedia';
import { Card, Empty, RoundButton, Screen, Sheet, SheetRow, T } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { exerciseById, exerciseName } from '@/lib/exercises';
import { useStore } from '@/lib/store';
import { bestByExercise, dateKey, e1rmSeries, formatWeight, minutesByDate, toDisplay, weekStreak } from '@/lib/training';

function Tile({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color?: string }) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, marginBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={15} color={t.textMuted} />
        <T muted size={15}>
          {label}
        </T>
      </View>
      <T size={30} weight="800" color={color} style={{ marginTop: 6 }}>
        {value}
      </T>
    </Card>
  );
}

export default function Stats() {
  const t = useTheme();
  const { sessions, weights, settings } = useStore();
  const unit = settings.unit;
  const minutes = useMemo(() => minutesByDate(sessions), [sessions]);
  const bests = useMemo(
    () => [...bestByExercise(sessions).entries()].filter(([, b]) => b.weight > 0).sort((a, b) => b[1].e1rm - a[1].e1rm),
    [sessions],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const exerciseId = picked ?? bests[0]?.[0] ?? null;
  const series = useMemo(() => (exerciseId ? e1rmSeries(exerciseId, sessions) : []), [exerciseId, sessions]);

  const monthKey = dateKey().slice(0, 7);
  const thisMonth = sessions.filter((s) => s.date.startsWith(monthKey)).length;
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const recent = weights.filter((w) => w.date >= dateKey(monthAgo));
  const change = recent.length > 1 ? recent[recent.length - 1].kg - recent[0].kg : null;

  return (
    <Screen
      title="Stats"
      subtitle="Progress & history"
      action={<RoundButton icon="time-outline" label="History" onPress={() => router.push('/history')} />}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Tile icon="barbell-outline" label="Workouts" value={String(sessions.length)} />
        <Tile icon="calendar-outline" label="This month" value={String(thisMonth)} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
        <Tile icon="flame-outline" label="Week streak" value={String(weekStreak(sessions))} />
        <Tile
          icon="scale-outline"
          label="Weight 30d"
          value={change === null ? '—' : `${change > 0 ? '+' : change < 0 ? '-' : ''}${formatWeight(Math.abs(change), unit)} ${unit}`}
          color={change === null ? undefined : change <= 0 ? t.accent : t.orange}
        />
      </View>

      <Card>
        <T muted size={15} style={{ marginBottom: 12 }}>
          Activity — last 12 months · by time trained
        </T>
        <Heatmap minutes={minutes} />
      </Card>

      <BodyWeightCard ranges />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <T muted size={15} style={{ flex: 1 }}>
            Exercise progress · est. 1RM
          </T>
        </View>
        {exerciseId ? (
          <>
            <Pressable
              onPress={() => setChoosing(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.surfaceAlt, borderRadius: 14, padding: 10, marginBottom: 12 }}>
              <ExerciseThumb exercise={exerciseById(exerciseId)} size={44} />
              <T size={17} weight="600" style={{ flex: 1 }}>
                {exerciseName(exerciseId)}
              </T>
              <Ionicons name="chevron-down" size={18} color={t.textMuted} />
            </Pressable>
            <AreaChart
              points={series.map((p) => ({ date: p.date, value: toDisplay(p.value, unit) }))}
              empty="Train this exercise on two days to see a curve."
            />
          </>
        ) : (
          <Empty>Finish a workout with weights to track progress.</Empty>
        )}
      </Card>

      {bests.length ? (
        <Card>
          <T muted size={15} style={{ marginBottom: 8 }}>
            Personal records
          </T>
          {bests.slice(0, 10).map(([id, b]) => (
            <Pressable
              key={id}
              onPress={() => router.push(`/exercise/${id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <Ionicons name="trophy" size={16} color={t.gold} />
              <T style={{ flex: 1 }} numberOfLines={1}>
                {exerciseName(id)}
              </T>
              <T weight="700">
                {formatWeight(b.weight, unit)} {unit}
              </T>
              <T muted style={{ width: 92, textAlign: 'right' }}>
                1RM ~{formatWeight(b.e1rm, unit)}
              </T>
            </Pressable>
          ))}
        </Card>
      ) : null}

      <Sheet visible={choosing} title="Exercise progress" onClose={() => setChoosing(false)}>
        {bests.map(([id]) => (
          <SheetRow
            key={id}
            title={exerciseName(id)}
            left={<ExerciseThumb exercise={exerciseById(id)} size={40} />}
            selected={id === exerciseId}
            onPress={() => {
              setPicked(id);
              setChoosing(false);
            }}
          />
        ))}
      </Sheet>
    </Screen>
  );
}
