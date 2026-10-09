import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAddToRoutine } from '@/components/AddToRoutine';
import { ExerciseBrowser } from '@/components/ExerciseBrowser';
import { Pill } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { EXERCISES } from '@/lib/exercises';
import { MEDIA_CREDIT, MEDIA_ENABLED } from '@/lib/media';

export default function Exercises() {
  const t = useTheme();
  const add = useAddToRoutine();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      <ExerciseBrowser
        header={
          <View style={{ paddingTop: 8, marginBottom: 18 }}>
            <Text style={{ color: t.text, fontSize: 36, fontWeight: '800', letterSpacing: -0.8 }}>Exercises</Text>
            <Text style={{ color: t.textMuted, fontSize: 17, marginTop: 2 }}>
              {EXERCISES.length} exercises{MEDIA_ENABLED ? ' with animations' : ''}
            </Text>
            {MEDIA_ENABLED ? <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>Images {MEDIA_CREDIT}</Text> : null}
          </View>
        }
        onOpen={(e) => router.push(`/exercise/${e.id}`)}
        action={(e) => <Pill title="Plan" icon="add" onPress={() => add.open(e)} />}
      />
      {add.ui}
    </SafeAreaView>
  );
}
