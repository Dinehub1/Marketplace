import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AreaChart } from '@/components/Charts';
import { Button, Card, Field, Segmented, Sheet, T } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { notify } from '@/lib/confirm';
import { useStore } from '@/lib/store';
import { dateKey, formatWeight, fromDisplay, toDisplay } from '@/lib/training';

type Range = '1M' | '3M' | '1Y' | 'All';
const DAYS: Record<Range, number> = { '1M': 31, '3M': 92, '1Y': 366, All: 100000 };

/**
 * Body weight: latest value and change, the goal and how far off it is, the trend chart, and a
 * Log button. `ranges` adds the 1M / 3M / 1Y / All switch used on the Stats tab.
 */
export function BodyWeightCard({ ranges }: { ranges?: boolean }) {
  const t = useTheme();
  const { weights, settings, logWeight } = useStore();
  const unit = settings.unit;
  const [range, setRange] = useState<Range>('3M');
  const [logging, setLogging] = useState(false);
  const [text, setText] = useState('');

  const last = weights[weights.length - 1];
  const prev = weights[weights.length - 2];
  const goal = settings.goalKg;
  const shown = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - DAYS[ranges ? range : '3M']);
    const k = dateKey(from);
    return weights.filter((w) => w.date >= k);
  }, [weights, range, ranges]);

  const save = () => {
    const v = Number(text.replace(',', '.'));
    if (!Number.isFinite(v) || v < 20 || v > 700) {
      notify('Check the number', `Enter your body weight in ${unit}.`);
      return;
    }
    logWeight(fromDisplay(v, unit));
    setText('');
    setLogging(false);
  };

  const delta = last && prev ? last.kg - prev.kg : null;
  // Green when the change moves toward the goal (or down, with no goal set).
  const good = delta === null ? true : goal && last ? Math.abs(last.kg - goal) < Math.abs(prev!.kg - goal) : delta <= 0;
  const toGo = goal && last ? last.kg - goal : null;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <T size={17} muted style={{ flex: 1 }}>
          Body weight
        </T>
        {goal ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 18 }}>
            <Ionicons name="locate" size={16} color={t.gold} />
            <T color={t.gold} size={17}>
              {formatWeight(goal, unit)}
            </T>
          </View>
        ) : null}
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setLogging(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Ionicons name="add" size={20} color={t.accent} />
          <T color={t.accent} size={17}>
            Log
          </T>
        </Pressable>
      </View>

      {ranges ? (
        <View style={{ marginBottom: 14 }}>
          <Segmented
            value={range}
            onChange={setRange}
            options={(['1M', '3M', '1Y', 'All'] as Range[]).map((r) => ({ value: r, label: r }))}
          />
        </View>
      ) : last ? (
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{ color: t.text, fontSize: 40, fontWeight: '800', letterSpacing: -1 }}>{formatWeight(last.kg, unit)}</Text>
            <T size={20} muted weight="600" style={{ marginLeft: 6 }}>
              {unit}
            </T>
            {delta !== null && Math.abs(delta) >= 0.05 ? (
              <T color={good ? t.accent : t.orange} size={15} style={{ marginLeft: 10 }}>
                {delta < 0 ? '↓' : '↑'} {formatWeight(Math.abs(delta), unit)}
              </T>
            ) : null}
            <T muted style={{ marginLeft: 'auto' }}>
              {new Date(`${last.date}T12:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </T>
          </View>
          {goal && toGo !== null ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="locate" size={15} color={t.gold} />
              <T color={t.gold}>
                Goal {formatWeight(goal, unit)} {unit} ·{' '}
                {Math.abs(toGo) < 0.05
                  ? 'reached'
                  : `${formatWeight(Math.abs(toGo), unit)} ${unit} to ${toGo > 0 ? 'lose' : 'gain'}`}
              </T>
            </View>
          ) : null}
        </View>
      ) : (
        <T muted style={{ marginBottom: 6 }}>
          Log your weight to start a trend.
        </T>
      )}

      <AreaChart
        points={shown.map((w) => ({ date: w.date, value: toDisplay(w.kg, unit) }))}
        goal={goal ? toDisplay(goal, unit) : null}
        format={(n) => (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1))}
        empty={weights.length ? 'Log on another day to see the trend.' : ''}
      />

      <Sheet visible={logging} title="Log body weight" onClose={() => setLogging(false)}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Field
            style={{ flex: 1, backgroundColor: t.surfaceAlt }}
            keyboardType="decimal-pad"
            autoFocus
            placeholder={last ? formatWeight(last.kg, unit) : `Weight in ${unit}`}
            value={text}
            onChangeText={setText}
            onSubmitEditing={save}
            accessibilityLabel={`Body weight in ${unit}`}
          />
          <Button title="Save" onPress={save} disabled={!text.trim()} />
        </View>
        <T muted style={{ marginTop: 10 }}>
          Saved for today. Logging again today replaces it.
        </T>
      </Sheet>
    </Card>
  );
}
