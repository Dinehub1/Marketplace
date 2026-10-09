import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BodyWeightCard } from '@/components/BodyWeightCard';
import { Card, Pill, RoundButton, RoutineBadge, Screen, T } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useStore, WEEKDAYS } from '@/lib/store';
import { dateKey, sessionsThisWeek, weekStreak } from '@/lib/training';

const SHORT = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export default function Home() {
  const t = useTheme();
  const { schedule, sessions, active, routineById, startWorkout } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const todayKey = dateKey();
  const [selected, setSelected] = useState(todayKey);

  const days = useMemo(() => {
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);
  const trained = useMemo(() => new Set(sessions.map((s) => s.date)), [sessions]);

  const selDate = new Date(`${selected}T12:00`);
  const selRoutine = routineById(schedule[selDate.getDay()]);
  const isToday = selected === todayKey;
  const doneThatDay = trained.has(selected);

  const week = sessionsThisWeek(sessions);
  const planned = schedule.filter(Boolean).length;
  const streak = weekStreak(sessions);

  const start = () => {
    if (!active) startWorkout(selRoutine?.id ?? null);
    router.push('/workout');
  };

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const weekLabel =
    weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : weekOffset === 1 ? 'Next week' : `${fmt(days[0])} – ${fmt(days[6])}`;

  return (
    <Screen
      title="Gym Tracker"
      subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      action={<RoundButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />}>
      <Card>
        <View style={styles.weekHead}>
          <Pressable accessibilityLabel="Previous week" hitSlop={10} onPress={() => setWeekOffset((w) => w - 1)}>
            <Ionicons name="chevron-back" size={20} color={t.text} />
          </Pressable>
          <Pressable onPress={() => (setWeekOffset(0), setSelected(todayKey))}>
            <T muted size={16}>
              {weekLabel}
            </T>
          </Pressable>
          <Pressable accessibilityLabel="Next week" hitSlop={10} onPress={() => setWeekOffset((w) => w + 1)}>
            <Ionicons name="chevron-forward" size={20} color={t.text} />
          </Pressable>
        </View>
        <View style={styles.days}>
          {days.map((d) => {
            const k = dateKey(d);
            const today = k === todayKey;
            const sel = k === selected;
            const did = trained.has(k);
            const plannedDay = !!schedule[d.getDay()] && k >= todayKey;
            return (
              <Pressable key={k} onPress={() => setSelected(k)} style={styles.day} accessibilityLabel={d.toDateString()}>
                <T muted size={12} weight="600">
                  {SHORT[d.getDay()]}
                </T>
                <View
                  style={[
                    styles.dayNum,
                    today && { backgroundColor: t.accent },
                    sel && !today && { borderWidth: 2, borderColor: t.accent },
                  ]}>
                  <Text style={{ color: today ? t.accentText : t.text, fontSize: 20, fontWeight: today ? '800' : '500' }}>
                    {d.getDate()}
                  </Text>
                </View>
                <View style={[styles.dot, { backgroundColor: did ? t.accent : plannedDay ? t.textMuted : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.todayRow, { backgroundColor: t.surfaceAlt }]}>
          {selRoutine ? (
            <RoutineBadge icon={selRoutine.icon} size={40} />
          ) : (
            <View style={[styles.restIcon, { backgroundColor: t.border }]}>
              <Ionicons name="moon" size={20} color={t.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <T muted size={12} weight="600" style={{ letterSpacing: 0.6 }}>
              {isToday ? 'TODAY' : WEEKDAYS[selDate.getDay()].toUpperCase()}
            </T>
            <T size={20} weight="500">
              {selRoutine ? selRoutine.name : 'Rest day'}
            </T>
          </View>
          {active ? (
            <Pill title="Resume" onPress={() => router.push('/workout')} />
          ) : isToday && selRoutine ? (
            <Pill title={doneThatDay ? 'Again' : 'Start'} onPress={start} />
          ) : selRoutine ? (
            <Pill title="View" onPress={() => router.push(`/routine/${selRoutine.id}`)} />
          ) : null}
        </View>
      </Card>

      <BodyWeightCard />

      <Pressable onPress={() => router.push('/history')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flame-outline" size={24} color={t.orange} />
              <T size={26} weight="800">
                {streak} week streak
              </T>
            </View>
            <T muted size={15} style={{ marginTop: 4 }}>
              {week.length} / {planned} this week · {sessions.length} workout{sessions.length === 1 ? '' : 's'} total
            </T>
          </View>
          <Ionicons name="calendar-outline" size={22} color={t.textMuted} />
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 14 },
  days: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  day: { alignItems: 'center', gap: 6, flex: 1 },
  dayNum: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 14 },
  restIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
