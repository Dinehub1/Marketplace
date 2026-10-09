import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ExerciseThumb } from '@/components/ExerciseMedia';
import { Chip } from '@/components/ui';
import { radius, useTheme } from '@/constants/theme';
import { BODY_PARTS, EQUIPMENT, searchExercises, titleCase, type Exercise } from '@/lib/exercises';

/** The searchable library: query, body-part and equipment chips, and picture cards. */
export function ExerciseBrowser({
  header,
  onOpen,
  action,
}: {
  header?: ReactNode;
  onOpen: (e: Exercise) => void;
  /** The button on the right of each card ("+ Plan", "Add"). */
  action?: (e: Exercise) => ReactNode;
}) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [part, setPart] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const results = useMemo(() => searchExercises(query, part, equipment), [query, part, equipment]);
  // Equipment chips only offer what exists under the chosen body part, so no chip leads to an empty list.
  const equipmentChoices = useMemo(
    () => (part ? EQUIPMENT.filter((q) => searchExercises('', part, q).length) : EQUIPMENT),
    [part],
  );

  return (
    <FlatList
      data={results}
      keyExtractor={(e) => e.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      initialNumToRender={12}
      windowSize={7}
      ListHeaderComponent={
        <View style={{ marginBottom: 6 }}>
          {header}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: radius.md, paddingHorizontal: 14 }}>
            <Ionicons name="search" size={20} color={t.textMuted} />
            <TextInputSearch value={query} onChange={setQuery} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 14 }}>
            <Chip label="All" active={!part} onPress={() => (setPart(null), setEquipment(null))} />
            {BODY_PARTS.map((p) => (
              <Chip key={p} label={titleCase(p)} active={part === p} onPress={() => (setPart(part === p ? null : p), setEquipment(null))} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
            <Chip label="Any Equipment" active={!equipment} onPress={() => setEquipment(null)} />
            {equipmentChoices.map((q) => (
              <Chip key={q} label={titleCase(q)} active={equipment === q} onPress={() => setEquipment(equipment === q ? null : q)} />
            ))}
          </ScrollView>
          <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 6 }}>
            {results.length} exercise{results.length === 1 ? '' : 's'}
          </Text>
        </View>
      }
      ListEmptyComponent={<Text style={{ color: t.textMuted, textAlign: 'center', padding: 24 }}>No exercise matches.</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpen(item)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: t.surface,
            borderRadius: radius.lg,
            padding: 12,
            marginBottom: 10,
            opacity: pressed ? 0.75 : 1,
          })}>
          <ExerciseThumb exercise={item} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontSize: 17, fontWeight: '500' }}>{titleCase(item.name)}</Text>
            <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 2 }}>
              {titleCase(item.target)} · {titleCase(item.equipment)}
            </Text>
          </View>
          {action?.(item)}
        </Pressable>
      )}
    />
  );
}

function TextInputSearch({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const t = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search..."
      placeholderTextColor={t.textMuted}
      autoCorrect={false}
      clearButtonMode="while-editing"
      accessibilityLabel="Search exercises"
      style={{ flex: 1, minWidth: 0, color: t.text, fontSize: 17, paddingVertical: 14, paddingHorizontal: 10 }}
    />
  );
}
