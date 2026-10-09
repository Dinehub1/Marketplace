import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Pill, RoutineBadge, RoutineGlyph, Row, Screen, Section, Sheet, SheetRow, T, Tag } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useStore, WEEK_ORDER, WEEKDAYS } from '@/lib/store';

export default function Plan() {
  const t = useTheme();
  const { routines, schedule, routineById, setScheduleDay, createRoutine } = useStore();
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const newRoutine = () => {
    const id = createRoutine(`Routine ${routines.length + 1}`);
    router.push(`/routine/${id}`);
  };

  return (
    <Screen title="Plan" subtitle="Your weekly routine">
      <Section>Week schedule</Section>
      {WEEK_ORDER.map((d) => {
        const r = routineById(schedule[d]);
        return (
          <Row
            key={d}
            onPress={() => setEditingDay(d)}
            right={
              r ? (
                <Tag active>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RoutineGlyph icon={r.icon} color={t.accentInk} />
                    <T color={t.accentInk} size={15}>
                      {r.name}
                    </T>
                  </View>
                </Tag>
              ) : (
                <Tag>Rest</Tag>
              )
            }>
            <T size={19}>{WEEKDAYS[d]}</T>
          </Row>
        );
      })}

      <Section right={<Pill title="New" icon="add" onPress={newRoutine} />}>Routines</Section>
      {routines.map((r) => (
        <Row key={r.id} onPress={() => router.push(`/routine/${r.id}`)}>
          <RoutineBadge icon={r.icon} />
          <View>
            <T size={19}>{r.name}</T>
            <T muted size={15}>
              {r.items.length} exercise{r.items.length === 1 ? '' : 's'}
            </T>
          </View>
        </Row>
      ))}
      {!routines.length ? <Button title="Create your first routine" kind="soft" onPress={newRoutine} /> : null}

      <Sheet
        visible={editingDay !== null}
        title={editingDay !== null ? WEEKDAYS[editingDay] : ''}
        onClose={() => setEditingDay(null)}>
        {routines.map((r) => (
          <SheetRow
            key={r.id}
            title={r.name}
            subtitle={`${r.items.length} exercises`}
            left={<RoutineBadge icon={r.icon} size={40} />}
            selected={editingDay !== null && schedule[editingDay] === r.id}
            onPress={() => {
              setScheduleDay(editingDay!, r.id);
              setEditingDay(null);
            }}
          />
        ))}
        <SheetRow
          title="Rest"
          left={
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="moon" size={20} color={t.textMuted} />
            </View>
          }
          selected={editingDay !== null && !schedule[editingDay]}
          onPress={() => {
            setScheduleDay(editingDay!, null);
            setEditingDay(null);
          }}
        />
      </Sheet>
    </Screen>
  );
}
