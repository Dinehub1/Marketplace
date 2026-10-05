import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddButton, EmptyState, MonthSwitcher, TransactionRow } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { addMonths, currentMonth, dayLabel, formatMoney, inMonth, sortNewest, totals, type Kind, type Transaction } from '@/lib/money';
import { useMoney } from '@/lib/store';

type Filter = 'all' | Kind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Spent' },
  { id: 'income', label: 'Income' },
];

export default function Activity() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions } = useMoney();
  const [month, setMonth] = useState(currentMonth);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    const list = inMonth(transactions, month);
    return sortNewest(filter === 'all' ? list : list.filter((t) => t.kind === filter));
  }, [transactions, month, filter]);

  const sections = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const t of visible) byDay.set(t.date, [...(byDay.get(t.date) ?? []), t]);
    return [...byDay.entries()].map(([day, data]) => ({ day, data, net: totals(data).net }));
  }, [visible]);

  const sum = totals(visible);
  const isCurrent = month === currentMonth();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: c.text }]}>Activity</Text>
        <MonthSwitcher month={month} onChange={(d) => setMonth((m) => addMonths(m, d))} canGoForward={!isCurrent} />
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const on = f.id === filter;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, { backgroundColor: on ? c.tint : c.card, borderColor: on ? c.tint : c.border }]}>
                <Text style={[styles.chipText, { color: on ? c.onTint : c.text }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {visible.length ? (
          <Text style={[styles.summary, { color: c.muted }]}>
            {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
            {filter !== 'income' ? ` · spent ${formatMoney(sum.expense)}` : ''}
            {filter !== 'expense' ? ` · earned ${formatMoney(sum.income)}` : ''}
          </Text>
        ) : null}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={[styles.dayLabel, { color: c.muted }]}>{dayLabel(section.day)}</Text>
            <Text style={[styles.dayLabel, { color: section.net >= 0 ? c.income : c.muted }]}>
              {section.net >= 0 ? '+' : '−'}
              {formatMoney(Math.abs(section.net))}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: c.card, borderColor: c.border },
              index === 0 && styles.itemFirst,
              index === section.data.length - 1 && styles.itemLast,
            ]}>
            <TransactionRow item={item} onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-long"
            title={filter === 'income' ? 'No income recorded' : filter === 'expense' ? 'No spending recorded' : 'Nothing here yet'}
            body={isCurrent ? 'Tap + to add a transaction. Everything stays on this phone.' : 'Nothing was recorded for this month.'}
          />
        }
      />
      <AddButton onPress={() => router.push('/add')} bottom={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 16 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 14 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 14, fontWeight: '600' },
  summary: { fontSize: 13, marginTop: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 6 },
  dayLabel: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  item: { paddingHorizontal: 14, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth },
  itemFirst: { borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 4 },
  itemLast: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingBottom: 4 },
});
