import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ExerciseBrowser } from '@/components/ExerciseBrowser';
import { Pill } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { Exercise } from '@/lib/exercises';
import { useStore } from '@/lib/store';
import { prefillSets } from '@/lib/training';

/**
 * Adds an exercise to a routine (`?routine=<id>`) or to the workout in progress (`?to=workout`),
 * then closes. Tapping a card opens its details; "Add" adds it.
 */
export default function AddExercise() {
  const t = useTheme();
  const { routine, to } = useLocalSearchParams<{ routine?: string; to?: string }>();
  const { sessions, addToRoutine, updateActive } = useStore();

  const add = (e: Exercise) => {
    if (to === 'workout') {
      const item = { exerciseId: e.id, sets: 3, reps: 10 };
      updateActive((w) => ({
        ...w,
        entries: [...w.entries, { exerciseId: e.id, targetReps: item.reps, sets: prefillSets(item, sessions) }],
        index: w.entries.length,
      }));
    } else if (routine) {
      addToRoutine(routine, e.id);
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background, paddingTop: 12 }}>
      <ExerciseBrowser
        onOpen={(e) => router.push(`/exercise/${e.id}`)}
        action={(e) => <Pill title="Add" icon="add" onPress={() => add(e)} />}
      />
    </View>
  );
}
