import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Button, Card, Field, Screen, Segmented, Stepper, T } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { confirm } from '@/lib/confirm';
import { MEDIA_ENABLED } from '@/lib/media';
import { useStore } from '@/lib/store';
import { formatWeight, fromDisplay } from '@/lib/training';

export default function Settings() {
  const t = useTheme();
  const { settings, updateSettings, resetAll } = useStore();
  const [goal, setGoal] = useState(settings.goalKg ? formatWeight(settings.goalKg, settings.unit) : '');

  const saveGoal = (text: string) => {
    setGoal(text);
    const v = Number(text.replace(',', '.'));
    updateSettings({ goalKg: text.trim() && Number.isFinite(v) && v > 0 ? fromDisplay(v, settings.unit) : null });
  };
  const setUnit = (unit: 'kg' | 'lb') => {
    updateSettings({ unit });
    if (settings.goalKg) setGoal(formatWeight(settings.goalKg, unit));
  };
  const label = (s: string) => (
    <T muted size={15} style={{ marginBottom: 10 }}>
      {s}
    </T>
  );

  return (
    <Screen>
      <Card>
        {label('Units')}
        <Segmented
          value={settings.unit}
          onChange={setUnit}
          options={[
            { value: 'kg', label: 'Kilograms' },
            { value: 'lb', label: 'Pounds' },
          ]}
        />
      </Card>

      <Card>
        {label('Rest timer (seconds)')}
        <View style={{ flexDirection: 'row' }}>
          <Stepper
            label="rest seconds"
            value={settings.restSeconds}
            step={15}
            min={15}
            max={600}
            parse={(s) => parseInt(s, 10)}
            onChange={(v) => updateSettings({ restSeconds: Math.round(v) })}
          />
        </View>
        <T muted style={{ marginTop: 8 }}>
          Starts after every ticked-off set.
        </T>
      </Card>

      <Card>
        {label(`Goal body weight (${settings.unit})`)}
        <Field
          style={{ backgroundColor: t.surfaceAlt }}
          keyboardType="decimal-pad"
          placeholder="Optional"
          value={goal}
          onChangeText={saveGoal}
          accessibilityLabel="Goal body weight"
        />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T weight="600">Keep screen on during workouts</T>
            <T muted>So you don’t unlock your phone between sets.</T>
          </View>
          <Switch
            value={settings.keepAwake}
            onValueChange={(keepAwake) => updateSettings({ keepAwake })}
            trackColor={{ true: t.accent, false: t.border }}
          />
        </View>
      </Card>

      <Card>
        {label('Your data')}
        <T muted style={{ marginBottom: 12 }}>
          Your plan, workouts and weights are stored only on this device. There is no account and nothing is uploaded.
        </T>
        <Button
          title="Erase everything"
          kind="danger"
          onPress={() =>
            confirm('Erase all data?', 'Your plan, workout history and weights will be deleted. This cannot be undone.', {
              text: 'Erase',
              destructive: true,
              onPress: resetAll,
            })
          }
        />
      </Card>

      <T muted size={12} style={{ textAlign: 'center', lineHeight: 18 }}>
        Exercise names and instructions: exercises-dataset by Hasan Emir Yıldırım, MIT License.
        {MEDIA_ENABLED ? '\nExercise images and animations © Gym visual (gymvisual.com).' : ''}
      </T>
    </Screen>
  );
}
