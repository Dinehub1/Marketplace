/**
 * The small building blocks every Money Map screen is made of.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { categoryOf, dayLabel, formatMoney, monthLabel, type Transaction } from '@/lib/money';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const c = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <Text style={[styles.sectionAction, { color: c.tint }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CategoryIcon({ id, size = 40 }: { id: string; size?: number }) {
  const cat = categoryOf(id);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: cat.color + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <MaterialIcons name={cat.icon} size={size * 0.5} color={cat.color} />
    </View>
  );
}

export function ProgressBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  const c = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.track, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function MonthSwitcher({
  month,
  onChange,
  canGoForward,
}: {
  month: string;
  onChange: (delta: number) => void;
  canGoForward: boolean;
}) {
  const c = useTheme();
  return (
    <View style={styles.monthRow}>
      <Pressable
        onPress={() => onChange(-1)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        style={[styles.monthButton, { backgroundColor: c.card, borderColor: c.border }]}>
        <MaterialIcons name="chevron-left" size={22} color={c.text} />
      </Pressable>
      <Text style={[styles.monthLabel, { color: c.text }]}>{monthLabel(month)}</Text>
      <Pressable
        onPress={() => onChange(1)}
        disabled={!canGoForward}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        style={[styles.monthButton, { backgroundColor: c.card, borderColor: c.border, opacity: canGoForward ? 1 : 0.35 }]}>
        <MaterialIcons name="chevron-right" size={22} color={c.text} />
      </Pressable>
    </View>
  );
}

export function TransactionRow({
  item,
  onPress,
  showDate,
}: {
  item: Transaction;
  onPress?: () => void;
  showDate?: boolean;
}) {
  const c = useTheme();
  const cat = categoryOf(item.category);
  const income = item.kind === 'income';
  // Without a note the category is already the title, so the second line says something new.
  const subtitle = item.note
    ? showDate
      ? `${cat.label} · ${dayLabel(item.date)}`
      : cat.label
    : showDate
      ? dayLabel(item.date)
      : income
        ? 'Income'
        : 'Expense';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${cat.label}, ${income ? 'income' : 'spent'} ${formatMoney(item.amount)}`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <CategoryIcon id={item.category} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
          {item.note || cat.label}
        </Text>
        <Text style={[styles.rowSub, { color: c.muted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: income ? c.income : c.text }]}>
        {income ? '+' : '−'}
        {formatMoney(item.amount)}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  const c = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.tint + '1f' }]}>
        <MaterialIcons name={icon} size={28} color={c.tint} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: c.muted }]}>{body}</Text>
      {action ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.emptyButton, { backgroundColor: c.tint, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.emptyButtonText, { color: c.onTint }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AddButton({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a transaction"
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: c.tint, bottom, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}>
      <MaterialIcons name="add" size={30} color={c.onTint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionAction: { fontSize: 14, fontWeight: '600' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 999 },
  emptyButtonText: { fontSize: 15, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
