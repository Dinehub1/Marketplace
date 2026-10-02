import { Pressable, StyleSheet, View, type PressableProps, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

export const BRAND = Brand.amber;
export const NAVY = Brand.navy;
export const SUCCESS = Brand.success;
export const DANGER = Brand.danger;

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  small?: boolean;
};

export function Button({ title, variant = 'primary', small, disabled, style, ...rest }: ButtonProps) {
  const solid = variant === 'primary' || variant === 'danger';
  const bg = variant === 'primary' ? BRAND : variant === 'danger' ? DANGER : undefined;

  const inner = (
    <ThemedText
      type="smallBold"
      style={[
        styles.buttonText,
        !small && styles.buttonTextLarge,
        variant === 'primary' && { color: NAVY },
        variant === 'danger' && { color: '#fff' },
      ]}
      themeColor={solid ? undefined : variant === 'ghost' ? 'textSecondary' : 'text'}>
      {title}
    </ThemedText>
  );

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}
      {...rest}>
      {solid ? (
        <View
          style={[
            styles.button,
            small && styles.buttonSmall,
            { backgroundColor: bg },
            variant === 'primary' && !small && styles.buttonGlow,
          ]}>
          {inner}
        </View>
      ) : (
        <ThemedView
          type={variant === 'ghost' ? 'background' : 'backgroundSelected'}
          style={[styles.button, small && styles.buttonSmall]}>
          {inner}
        </ThemedView>
      )}
    </Pressable>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  return <ThemedView type="backgroundElement" style={[styles.card, style]} {...rest} />;
}

export function Row({ style, ...rest }: ViewProps) {
  return <View style={[styles.row, style]} {...rest} />;
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}>
        <ThemedText type="smallBold" style={selected && { color: NAVY }} themeColor={selected ? undefined : 'textSecondary'}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buttonSmall: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 38,
  },
  buttonGlow: {
    shadowColor: BRAND,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
  },
  buttonTextLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
  },
  chipSelected: {
    backgroundColor: BRAND,
  },
  chipIdle: {
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
});
