import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { router, type Tabs } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoutineBadge, Sheet, SheetRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { useStore } from '@/lib/store';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  index: ['home-outline', 'home'],
  plan: ['calendar-outline', 'calendar'],
  stats: ['stats-chart-outline', 'stats-chart'],
  exercises: ['list-outline', 'list'],
};

/**
 * Four tabs around a raised Start button. Start opens today's routine; on a rest day it asks which
 * routine to run; while a workout is open it turns orange and resumes it.
 */
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { active, routines, schedule, routineById, startWorkout } = useStore();
  const [choosing, setChoosing] = useState(false);
  const today = routineById(schedule[new Date().getDay()]);

  const begin = (routineId: string | null) => {
    setChoosing(false);
    startWorkout(routineId);
    router.push('/workout');
  };
  const onStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (active) router.push('/workout');
    else if (today) begin(today.id);
    else setChoosing(true);
  };

  return (
    <View style={[styles.bar, { backgroundColor: t.surface, borderTopColor: t.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        if (route.name === 'start') {
          const tint = active ? t.orange : t.accent;
          return (
            <Pressable key={route.key} onPress={onStart} accessibilityRole="button" accessibilityLabel={active ? 'Resume workout' : 'Start workout'} style={styles.item}>
              <View style={[styles.fab, { backgroundColor: tint, borderColor: t.surface }]}>
                {active ? (
                  <Ionicons name="play" size={30} color="#1a1000" />
                ) : (
                  <MaterialCommunityIcons name="dumbbell" size={32} color={t.accentText} style={{ transform: [{ rotate: '-45deg' }] }} />
                )}
              </View>
              <Text style={[styles.label, { color: tint, fontWeight: '700' }]}>{active ? 'Resume' : 'Start'}</Text>
            </Pressable>
          );
        }
        const focused = state.index === i;
        const color = focused ? t.accent : t.textMuted;
        const title = descriptors[route.key].options.title ?? route.name;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.item}>
            <Ionicons name={ICONS[route.name]?.[focused ? 1 : 0] ?? 'ellipse'} size={26} color={color} />
            <Text style={[styles.label, { color }]}>{title}</Text>
          </Pressable>
        );
      })}

      <Sheet visible={choosing} title="Rest day — start which workout?" onClose={() => setChoosing(false)}>
        {routines.map((r) => (
          <SheetRow
            key={r.id}
            title={r.name}
            subtitle={`${r.items.length} exercise${r.items.length === 1 ? '' : 's'}`}
            left={<RoutineBadge icon={r.icon} size={40} />}
            onPress={() => begin(r.id)}
          />
        ))}
        <SheetRow title="Empty workout" subtitle="Add exercises as you go" onPress={() => begin(null)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  label: { fontSize: 12 },
  fab: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginTop: -36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
