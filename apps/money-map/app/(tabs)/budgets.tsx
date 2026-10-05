import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CategoryIcon, ProgressBar } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { amountToInput, categoriesFor, currentMonth, formatMoney, inMonth, monthLabel, parseAmount, spendByCategory } from '@/lib/money';
import { useMoney } from '@/lib/store';

/**
 * A budget is a monthly limit per spending category; it applies to every month, and this
 * screen always measures it against the current one.
 */
export default function BudgetsScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { transactions, budgets, setBudget } = useMoney();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const month = currentMonth();
  const spent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of spendByCategory(inMonth(transactions, month))) map[s.category.id] = s.amount;
    return map;
  }, [transactions, month]);

  const categories = categoriesFor('expense');
  const budgeted = categories.filter((cat) => budgets[cat.id]);
  const limit = budgeted.reduce((a, cat) => a + budgets[cat.id], 0);
  const used = budgeted.reduce((a, cat) => a + (spent[cat.id] ?? 0), 0);
  const draftValue = parseAmount(draft);

  const open = (id: string) => {
    setEditing(id);
    setDraft(budgets[id] ? amountToInput(budgets[id]) : '');
  };

  const save = () => {
    if (!editing || draftValue === null) return;
    setBudget(editing, draftValue);
    setEditing(null);
  };

  const colorFor = (ratio: number) => (ratio > 1 ? c.expense : ratio > 0.8 ? c.warning : c.tint);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
        <Text style={[styles.title, { color: c.text }]}>Budgets</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>Monthly limits, measured against {monthLabel(month)}.</Text>

        <Card style={styles.summary}>
          {limit ? (
            <>
              <Text style={[styles.summaryLabel, { color: c.muted }]}>{used > limit ? 'Over budget by' : 'Left to spend'}</Text>
              <Text style={[styles.summaryAmount, { color: used > limit ? c.expense : c.text }]}>{formatMoney(Math.abs(limit - used))}</Text>
              <View style={{ marginTop: 12 }}>
                <ProgressBar value={used / limit} color={colorFor(used / limit)} height={10} />
              </View>
              <Text style={[styles.summaryFoot, { color: c.muted }]}>
                {formatMoney(used)} spent of {formatMoney(limit)} across {budgeted.length} {budgeted.length === 1 ? 'category' : 'categories'}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.summaryTitle, { color: c.text }]}>No budgets yet</Text>
              <Text style={[styles.summaryFoot, { color: c.muted }]}>
                Tap a category below and set how much you want to spend on it each month.
              </Text>
            </>
          )}
        </Card>

        <Card style={{ paddingVertical: 4 }}>
          {categories.map((cat, i) => {
            const cap = budgets[cat.id];
            const s = spent[cat.id] ?? 0;
            const isEditing = editing === cat.id;
            return (
              <View key={cat.id} style={[i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                <Pressable
                  onPress={() => (isEditing ? setEditing(null) : open(cat.id))}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.label} budget`}
                  style={styles.row}>
                  <CategoryIcon id={cat.id} size={36} />
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.rowTitle, { color: c.text }]}>{cat.label}</Text>
                      <Text style={[styles.rowValue, { color: cap && s > cap ? c.expense : c.muted }]}>
                        {cap ? `${formatMoney(s)} / ${formatMoney(cap)}` : s ? `${formatMoney(s)} · no limit` : 'Set limit'}
                      </Text>
                    </View>
                    {cap ? (
                      <View style={{ marginTop: 8 }}>
                        <ProgressBar value={s / cap} color={colorFor(s / cap)} height={6} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                {isEditing ? (
                  <View style={styles.editor}>
                    {/* Save sits beside the field: anything below it would be under the keyboard. */}
                    <View style={styles.editorRow}>
                      <View style={[styles.inputWrap, { borderColor: c.border, backgroundColor: c.background }]}>
                        <Text style={[styles.rupee, { color: c.muted }]}>₹</Text>
                        <TextInput
                          value={draft}
                          onChangeText={setDraft}
                          placeholder="Monthly limit"
                          placeholderTextColor={c.muted}
                          keyboardType="decimal-pad"
                          autoFocus
                          returnKeyType="done"
                          onSubmitEditing={save}
                          style={[styles.input, { color: c.text }]}
                        />
                      </View>
                      <Pressable
                        onPress={save}
                        disabled={draftValue === null}
                        accessibilityRole="button"
                        style={[styles.primary, { backgroundColor: c.tint, opacity: draftValue === null ? 0.4 : 1 }]}>
                        <Text style={[styles.primaryText, { color: c.onTint }]}>Save</Text>
                      </Pressable>
                    </View>
                    {cap ? (
                      <Pressable
                        onPress={() => {
                          setBudget(cat.id, null);
                          setEditing(null);
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        style={styles.removeLink}>
                        <Text style={[styles.removeText, { color: c.expense }]}>Remove limit</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  summary: { marginTop: 16, marginBottom: 16 },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryAmount: { fontSize: 30, fontWeight: '800', marginTop: 2, fontVariant: ['tabular-nums'] },
  summaryTitle: { fontSize: 17, fontWeight: '700' },
  summaryFoot: { fontSize: 13, marginTop: 10, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  editor: { paddingBottom: 14, paddingLeft: 48 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  rupee: { fontSize: 17, marginRight: 4 },
  input: { flex: 1, fontSize: 17, paddingVertical: 10 },
  editorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primary: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  primaryText: { fontSize: 15, fontWeight: '700' },
  removeLink: { alignSelf: 'flex-start', marginTop: 10 },
  removeText: { fontSize: 14, fontWeight: '600' },
});
