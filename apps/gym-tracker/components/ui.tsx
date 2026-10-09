import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, useTheme } from '@/constants/theme';
import type { RoutineIcon as RoutineIconName } from '@/lib/training';

export const tap = () => Haptics.selectionAsync().catch(() => {});

/** A tab screen: large title, optional subtitle and a round action on the right. */
export function Screen({
  title,
  subtitle,
  action,
  children,
  scroll = true,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
}) {
  const t = useTheme();
  const head = title ? (
    <View style={styles.head}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: t.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  ) : null;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
          {head}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.screen, { flex: 1, paddingBottom: 0 }]}>
          {head}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

export function RoundButton({
  icon,
  onPress,
  label,
  tint,
  filled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  tint?: string;
  filled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: filled ? t.accentSoft : t.surface, opacity: pressed ? 0.6 : 1 },
      ]}>
      <Ionicons name={icon} size={20} color={tint ?? t.text} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface }, style]}>{children}</View>;
}

export function Section({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <Text style={{ color: t.textMuted, fontSize: 17, flex: 1 }}>{children}</Text>
      {right}
    </View>
  );
}

export function T({
  children,
  size = 16,
  weight = '400',
  muted,
  color,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  weight?: TextStyle['fontWeight'];
  muted?: boolean;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: color ?? (muted ? t.textMuted : t.text), fontSize: size, fontWeight: weight }, style]}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'soft' | 'secondary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = { primary: t.accent, soft: t.accentSoft, secondary: t.surfaceAlt, danger: 'transparent' }[kind];
  const fg = { primary: t.accentText, soft: t.accentInk, secondary: t.text, danger: t.danger }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        kind === 'danger' && { borderWidth: 1, borderColor: t.danger },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>
    </Pressable>
  );
}

/** The small green "+ Plan" / "Start" pill. */
export function Pill({ title, onPress, icon }: { title: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.pill, { backgroundColor: t.accentSoft, opacity: pressed ? 0.6 : 1 }]}>
      {icon ? <Ionicons name={icon} size={16} color={t.accentInk} /> : null}
      <Text style={{ color: t.accentInk, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Tag({ children, active }: { children: ReactNode; active?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: active ? t.accentSoft : t.surfaceAlt }]}>
      {typeof children === 'string' ? (
        <Text style={{ color: active ? t.accentInk : t.textMuted, fontSize: 13, fontWeight: '600' }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? t.accent : t.surface }]}>
      <Text style={{ color: active ? t.accentText : t.text, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: t.surfaceAlt }]}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segment, o.value === value && { backgroundColor: t.background }]}>
          <Text style={{ color: o.value === value ? t.text : t.textMuted, fontWeight: '600' }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textMuted}
      {...props}
      style={[styles.field, { color: t.text, backgroundColor: t.surface }, props.style]}
    />
  );
}

/**
 * − value +. The value is editable in place; typing keeps the raw text ("87." on the way to
 * "87.5") and only pushes a parsed number, so typing is never fought by re-formatting.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  format = (n: number) => String(n),
  parse = (s: string) => Number(s.replace(',', '.')),
  label,
  compact,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (n: number) => string;
  parse?: (s: string) => number;
  label: string;
  compact?: boolean;
}) {
  const t = useTheme();
  const [text, setText] = useState<string | null>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  const btn = (sign: 1 | -1) => (
    <Pressable
      accessibilityLabel={`${sign > 0 ? 'Increase' : 'Decrease'} ${label}`}
      hitSlop={4}
      onPress={() => {
        tap();
        setText(null);
        onChange(clamp(value + sign * step));
      }}
      style={styles.stepBtn}>
      <Ionicons name={sign > 0 ? 'add' : 'remove'} size={20} color={t.textMuted} />
    </Pressable>
  );
  return (
    <View style={[styles.stepper, { backgroundColor: t.surfaceAlt, height: compact ? 40 : 48 }]}>
      {btn(-1)}
      <TextInput
        accessibilityLabel={label}
        value={text ?? format(value)}
        onChangeText={(s) => {
          setText(s);
          const n = parse(s);
          if (Number.isFinite(n) && n >= min) onChange(Math.min(max, n));
        }}
        onBlur={() => setText(null)}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={[styles.stepValue, { color: t.text, fontSize: compact ? 16 : 18 }]}
      />
      {btn(1)}
    </View>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ color: t.textMuted, textAlign: 'center', paddingVertical: 24, fontSize: 15 }}>{children}</Text>;
}

const ROUTINE_GLYPH: Record<RoutineIconName, keyof typeof MaterialCommunityIcons.glyphMap> = {
  push: 'dumbbell',
  pull: 'weight-lifter',
  legs: 'human-handsdown',
  upper: 'arm-flex',
  core: 'yoga',
  full: 'run-fast',
};
export const ROUTINE_ICONS = Object.keys(ROUTINE_GLYPH) as RoutineIconName[];

/** The green rounded square with a routine's glyph. */
export function RoutineBadge({ icon, size = 44 }: { icon: RoutineIconName; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.26, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={ROUTINE_GLYPH[icon]} size={size * 0.55} color={t.accentText} />
    </View>
  );
}
export function RoutineGlyph({ icon, color, size = 16 }: { icon: RoutineIconName; color: string; size?: number }) {
  return <MaterialCommunityIcons name={ROUTINE_GLYPH[icon]} size={size} color={color} />;
}

/** A bottom sheet of choices. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: t.surface }]}>
        <View style={[styles.grabber, { backgroundColor: t.border }]} />
        <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>{title}</Text>
        <ScrollView style={{ maxHeight: 460 }}>{children}</ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function SheetRow({
  title,
  subtitle,
  left,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  selected?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.sheetRow, { backgroundColor: t.surfaceAlt, opacity: pressed ? 0.7 : 1 }]}>
      {left}
      <View style={{ flex: 1 }}>
        <T size={17} weight="600">
          {title}
        </T>
        {subtitle ? <T muted>{subtitle}</T> : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={t.accent} /> : null}
    </Pressable>
  );
}

/** A row in a grouped list: title, optional detail, chevron. */
export function Row({
  children,
  onPress,
  right,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: t.surface, opacity: pressed ? 0.75 : 1 }, style]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}>{children}</View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={20} color={t.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  title: { fontSize: 36, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 17, marginTop: 2 },
  round: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  card: { borderRadius: radius.lg, padding: 18, marginBottom: 12 },
  section: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 10, paddingHorizontal: 4 },
  button: {
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  tag: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 },
  chip: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  field: { minWidth: 0, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, flex: 1, minWidth: 0 },
  stepBtn: { width: 28, height: '100%', alignItems: 'center', justifyContent: 'center' },
  stepValue: { flex: 1, minWidth: 0, textAlign: 'center', fontWeight: '600', paddingVertical: 0 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 14 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, paddingVertical: 20, paddingHorizontal: 18, marginBottom: 10, gap: 10 },
});
