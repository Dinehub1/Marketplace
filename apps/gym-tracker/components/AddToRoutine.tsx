import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { RoutineBadge, Sheet, SheetRow } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { Exercise } from '@/lib/exercises';
import { titleCase } from '@/lib/exercises';
import { useStore } from '@/lib/store';

/** "+ Plan": choose a routine for an exercise, then confirm with a short toast. */
export function useAddToRoutine() {
  const t = useTheme();
  const { routines, addToRoutine } = useStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const ui = (
    <>
      <Sheet visible={!!exercise} title={exercise ? `Add ${titleCase(exercise.name)} to…` : ''} onClose={() => setExercise(null)}>
        {routines.map((r) => {
          const has = !!exercise && r.items.some((i) => i.exerciseId === exercise.id);
          return (
            <SheetRow
              key={r.id}
              title={r.name}
              subtitle={has ? 'Already in this routine' : `${r.items.length} exercises`}
              left={<RoutineBadge icon={r.icon} size={40} />}
              selected={has}
              onPress={() => {
                if (exercise && !has) {
                  addToRoutine(r.id, exercise.id);
                  setToast(`Added to ${r.name}`);
                }
                setExercise(null);
              }}
            />
          );
        })}
        {!routines.length ? <Text style={{ color: t.textMuted }}>Create a routine in Plan first.</Text> : null}
      </Sheet>
      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            bottom: 110,
            backgroundColor: t.accent,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 18,
          }}>
          <Text style={{ color: t.accentText, fontWeight: '700' }}>{toast}</Text>
        </View>
      ) : null}
    </>
  );
  return { open: setExercise, ui };
}
