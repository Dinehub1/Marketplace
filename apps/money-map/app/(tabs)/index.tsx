import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddButton, Card, CategoryIcon, EmptyState, MonthSwitcher, ProgressBar, SectionTitle, TransactionRow } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import {
  addMonths,
  currentMonth,
  formatCompact,
  formatMoney,
  inMonth,
  monthlyTrend,
  shortMonthLabel,
  sortNewest,
  spendByCategory,
  totals,
} from '@/lib/money';
import { useMoney } from '@/lib/store';

export default function Overview() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, budgets } = useMoney();
  const [month, setMonth] = useState(currentMonth);

  const monthList = useMemo(() => inMonth(transactions, month), [transactions, month]);
  const sum = useMemo(() => totals(monthList), [monthList]);
  const byCategory = useMemo(() => spendByCategory(monthList), [monthList]);
  const trend = useMemo(() => monthlyTrend(transactions, month, 6), [transactions, month]);
  const recent = useMemo(() => sortNewest(monthList).slice(0, 5), [monthList]);

  const budgetTotal = Object.values(budgets).reduce((a, b) => a + b, 0);
  const budgetedSpend = byCategory.filter((s) => budgets[s.category.id]).reduce((a, s) => a + s.amount, 0);

  const add = () => router.push('/add');
  const isCurrent = month === currentMonth();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: c.text }]}>Money Map</Text>
        <MonthSwitcher month={month} onChange={(d) => setMonth((m) => addMonths(m, d))} canGoForward={!isCurrent} />

        <View style={[styles.hero, { backgroundColor: c.hero }]}>
          <Text style={[styles.heroLabel, { color: c.onHeroMuted }]}>{sum.net < 0 ? 'Overspent by' : 'Left this month'}</Text>
          <Text style={[styles.heroAmount, { color: c.onHero }]} adjustsFontSizeToFit numberOfLines={1}>
            {formatMoney(Math.abs(sum.net))}
          </Text>
          <View style={styles.heroSplit}>
            <View style={styles.heroCell}>
              <Text style={[styles.heroCellLabel, { color: c.onHeroMuted }]}>Income</Text>
              <Text style={[styles.heroCellValue, { color: c.onHero }]}>{formatMoney(sum.income)}</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: c.onHeroMuted }]} />
            <View style={styles.heroCell}>
              <Text style={[styles.heroCellLabel, { color: c.onHeroMuted }]}>Spent</Text>
              <Text style={[styles.heroCellValue, { color: c.onHero }]}>{formatMoney(sum.expense)}</Text>
            </View>
          </View>
        </View>

        {budgetTotal > 0 ? (
          <Card style={styles.budgetCard}>
            <View style={styles.between}>
              <Text style={[styles.cardLabel, { color: c.muted }]}>Budgets this month</Text>
              <Text style={[styles.cardLabel, { color: budgetedSpend > budgetTotal ? c.expense : c.muted }]}>
                {formatMoney(budgetedSpend)} of {formatMoney(budgetTotal)}
              </Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <ProgressBar
                value={budgetedSpend / budgetTotal}
                color={budgetedSpend > budgetTotal ? c.expense : budgetedSpend > budgetTotal * 0.8 ? c.warning : c.tint}
              />
            </View>
          </Card>
        ) : null}

        <SectionTitle title="Where it went" />
        <Card>
          {byCategory.length === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title="Nothing spent yet"
              body={isCurrent ? 'Add what you spend and it will be sorted into categories here.' : 'No spending was recorded this month.'}
              action={isCurrent ? 'Add an expense' : undefined}
              onAction={add}
            />
          ) : (
            <>
              <View style={styles.stack}>
                {byCategory.map((s) => (
                  <View key={s.category.id} style={{ flex: s.share, backgroundColor: s.category.color }} />
                ))}
              </View>
              {byCategory.map((s) => (
                <View key={s.category.id} style={styles.catRow}>
                  <CategoryIcon id={s.category.id} size={34} />
                  <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={1}>
                    {s.category.label}
                  </Text>
                  <Text style={[styles.catShare, { color: c.muted }]}>{Math.round(s.share * 100)}%</Text>
                  <Text style={[styles.catAmount, { color: c.text }]}>{formatMoney(s.amount)}</Text>
                </View>
              ))}
            </>
          )}
        </Card>

        <SectionTitle title="Last six months" />
        <Card>
          <TrendChart data={trend} selected={month} />
        </Card>

        <SectionTitle title="Recent" action={recent.length ? 'See all' : undefined} onAction={() => router.push('/transactions')} />
        <Card style={{ paddingVertical: 6 }}>
          {recent.length === 0 ? (
            <EmptyState icon="receipt-long" title="No transactions" body="Income and spending you add will show up here." />
          ) : (
            recent.map((t) => (
              <TransactionRow key={t.id} item={t} showDate onPress={() => router.push({ pathname: '/add', params: { id: t.id } })} />
            ))
          )}
        </Card>
      </ScrollView>
      <AddButton onPress={add} bottom={20} />
    </View>
  );
}

/** Income and spending side by side for each month — the "income visualizer" the listing promises. */
function TrendChart({ data, selected }: { data: ReturnType<typeof monthlyTrend>; selected: string }) {
  const c = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const empty = data.every((d) => d.income === 0 && d.expense === 0);

  return (
    <View>
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: c.income }]} />
        <Text style={[styles.legendText, { color: c.muted }]}>Income</Text>
        <View style={[styles.legendDot, { backgroundColor: c.expense, marginLeft: 14 }]} />
        <Text style={[styles.legendText, { color: c.muted }]}>Spent</Text>
      </View>
      <View style={styles.chart}>
        {data.map((d) => {
          const active = d.month === selected;
          return (
            <View key={d.month} style={styles.chartCol} accessibilityLabel={`${shortMonthLabel(d.month)}: income ${formatMoney(d.income)}, spent ${formatMoney(d.expense)}`}>
              <Text style={[styles.chartValue, { color: c.muted }]} numberOfLines={1}>
                {d.income || d.expense ? formatCompact(d.income - d.expense) : ''}
              </Text>
              <View style={styles.chartBars}>
                <View style={[styles.bar, { height: `${(d.income / max) * 100}%`, backgroundColor: c.income, opacity: active ? 1 : 0.55 }]} />
                <View style={[styles.bar, { height: `${(d.expense / max) * 100}%`, backgroundColor: c.expense, opacity: active ? 1 : 0.55 }]} />
              </View>
              <Text style={[styles.chartLabel, { color: active ? c.text : c.muted, fontWeight: active ? '700' : '500' }]}>
                {shortMonthLabel(d.month)}
              </Text>
            </View>
          );
        })}
      </View>
      {empty ? <Text style={[styles.chartEmpty, { color: c.muted }]}>Your monthly totals will build up here.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 110 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 14 },
  hero: { borderRadius: 22, padding: 20, marginTop: 16 },
  heroLabel: { fontSize: 14, fontWeight: '600' },
  heroAmount: { fontSize: 38, fontWeight: '800', marginTop: 4, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  heroSplit: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  heroCell: { flex: 1 },
  heroCellLabel: { fontSize: 13, fontWeight: '600' },
  heroCellValue: { fontSize: 18, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 34, marginHorizontal: 16, opacity: 0.6 },
  budgetCard: { marginTop: 12 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  stack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  catLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  catShare: { fontSize: 13, width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  catAmount: { fontSize: 15, fontWeight: '700', minWidth: 84, textAlign: 'right', fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 13 },
  chart: { flexDirection: 'row', height: 170, gap: 6 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartValue: { fontSize: 10, height: 14, fontVariant: ['tabular-nums'] },
  chartBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 4 },
  bar: { width: 11, borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 2 },
  chartLabel: { fontSize: 12, marginTop: 6 },
  chartEmpty: { fontSize: 13, textAlign: 'center', marginTop: 10 },
});
