import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { addDays, amountToInput, categoriesFor, dayLabel, newId, parseAmount, today, type Kind } from '@/lib/money';
import { useMoney } from '@/lib/store';

/** Add a transaction, or edit one when opened with `?id=`. */
export default function AddTransaction() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { transactions, saveTransaction, removeTransaction } = useMoney();
  const existing = id ? transactions.find((t) => t.id === id) : undefined;

  const [kind, setKind] = useState<Kind>(existing?.kind ?? 'expense');
  const [amount, setAmount] = useState(existing ? amountToInput(existing.amount) : '');
  const [category, setCategory] = useState(existing?.category ?? 'food');
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? today());

  const paise = parseAmount(amount);
  const categories = categoriesFor(kind);
  const isToday = date >= today();

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const switchKind = (next: Kind) => {
    setKind(next);
    // A category from the other side (Salary on an expense) would be a wrong default, not a choice.
    if (!categoriesFor(next).some((cat) => cat.id === category)) setCategory(categoriesFor(next)[0].id);
  };

  const save = () => {
    if (paise === null) return;
    saveTransaction({
      id: existing?.id ?? newId(),
      kind,
      amount: paise,
      category,
      note: note.trim(),
      date,
      createdAt: existing?.createdAt ?? Date.now(),
    });
    close();
  };

  const remove = () => {
    if (!existing) return;
    const doRemove = () => {
      removeTransaction(existing.id);
      close();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this transaction?')) doRemove();
      return;
    }
    Alert.alert('Delete this transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doRemove },
    ]);
  };

  const accent = kind === 'income' ? c.income : c.expense;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Save lives in the top bar, not a footer: on an iOS page sheet the keyboard covers the bottom of the sheet. */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'ios' ? 14 : insets.top + 10, borderBottomColor: c.border }]}>
        <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={styles.topSide}>
          <MaterialIcons name="close" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.text }]}>{existing ? 'Edit transaction' : 'New transaction'}</Text>
        <View style={[styles.topSide, { alignItems: 'flex-end' }]}>
          <Pressable
            onPress={save}
            disabled={paise === null}
            hitSlop={10}
            accessibilityRole="button"
            style={({ pressed }) => [styles.saveButton, { backgroundColor: c.tint, opacity: paise === null ? 0.4 : pressed ? 0.85 : 1 }]}>
            <Text style={[styles.saveText, { color: c.onTint }]}>Save</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={[styles.segment, { backgroundColor: c.track }]}>
          {(['expense', 'income'] as const).map((k) => {
            const on = k === kind;
            return (
              <Pressable
                key={k}
                onPress={() => switchKind(k)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.segmentItem, on && { backgroundColor: c.card }]}>
                <Text style={[styles.segmentText, { color: on ? (k === 'income' ? c.income : c.expense) : c.muted }]}>
                  {k === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.rupee, { color: accent }]}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={c.muted}
            keyboardType="decimal-pad"
            autoFocus={!existing}
            style={[styles.amountInput, { color: c.text }]}
            accessibilityLabel="Amount in rupees"
          />
        </View>
        {amount && paise === null ? (
          <Text style={[styles.hint, { color: c.expense }]}>Enter an amount like 250 or 99.50</Text>
        ) : null}

        <Text style={[styles.label, { color: c.muted }]}>Category</Text>
        <View style={styles.grid}>
          {categories.map((cat) => {
            const on = cat.id === category;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  styles.catChip,
                  { backgroundColor: on ? cat.color + '22' : c.card, borderColor: on ? cat.color : c.border },
                ]}>
                <MaterialIcons name={cat.icon} size={18} color={cat.color} />
                <Text style={[styles.catText, { color: c.text }]} numberOfLines={1}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: c.muted }]}>Date</Text>
        <View style={[styles.dateRow, { backgroundColor: c.card, borderColor: c.border }]}>
          <Pressable onPress={() => setDate((d) => addDays(d, -1))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Previous day">
            <MaterialIcons name="chevron-left" size={26} color={c.text} />
          </Pressable>
          <Text style={[styles.dateText, { color: c.text }]}>{dayLabel(date)}</Text>
          <Pressable
            onPress={() => setDate((d) => addDays(d, 1))}
            disabled={isToday}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Next day">
            <MaterialIcons name="chevron-right" size={26} color={c.text} style={{ opacity: isToday ? 0.3 : 1 }} />
          </Pressable>
        </View>

        <Text style={[styles.label, { color: c.muted }]}>Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={kind === 'expense' ? 'e.g. Lunch with team' : 'e.g. October salary'}
          placeholderTextColor={c.muted}
          maxLength={80}
          returnKeyType="done"
          onSubmitEditing={save}
          style={[styles.noteInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
        />

        {existing ? (
          <Pressable onPress={remove} accessibilityRole="button" style={[styles.deleteButton, { borderColor: c.border }]}>
            <MaterialIcons name="delete-outline" size={20} color={c.expense} />
            <Text style={[styles.deleteText, { color: c.expense }]}>Delete transaction</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topSide: { width: 76 },
  topTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 16 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentText: { fontSize: 15, fontWeight: '700' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  rupee: { fontSize: 40, fontWeight: '700', marginRight: 6 },
  amountInput: { fontSize: 52, fontWeight: '800', minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'], padding: 0 },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 6 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 26, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  catText: { fontSize: 14, fontWeight: '600' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dateText: { fontSize: 16, fontWeight: '600' },
  noteInput: { fontSize: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12 },
  saveButton: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  saveText: { fontSize: 15, fontWeight: '700' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  deleteText: { fontSize: 15, fontWeight: '700' },
});
