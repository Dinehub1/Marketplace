import { forwardRef, useState, type ReactNode } from "react";
import {
  Pressable,
  Text as RNText,
  View,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { type PaletteKey, type TypeKey, press, pressFade, radius, space, spring, type as typeScale, minTouchTarget } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { useReduceMotion } from "@/lib/motion";

/* ── Text ──────────────────────────────────────────────────────────────────
   One component owns the type scale, so a screen cannot invent a 15.5pt
   semibold that exists nowhere else. Tracking and leading come from the token,
   never from the call site. */

export function Text({
  variant = "body",
  tone = "ink",
  style,
  children,
  ...rest
}: {
  variant?: TypeKey;
  tone?: PaletteKey;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof RNText>, "style">) {
  const { c } = useTheme();
  const t = typeScale[variant];
  return (
    <RNText
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          fontWeight: t.fontWeight as TextStyle["fontWeight"],
          color: c[tone],
        },
        variant === "caption" && { textTransform: "uppercase" },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/* ── Press ─────────────────────────────────────────────────────────────────
   The single most important interaction rule in the system: feedback happens on
   pressIn, not on release. Waiting for the tap to complete before acknowledging
   it is what makes an app feel dead, and it is the default if you use a plain
   Pressable with an onPress handler and no visual state.

   The scale runs on a spring rather than a timing curve so an interrupted press
   — finger lifted mid-animation, or dragged away and back — resolves from
   wherever it currently is instead of snapping. */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Press = forwardRef<View, PressableProps & {
  children: ReactNode;
  /** Large surfaces compress less; 0.965 on a full-width card looks rubbery. */
  large?: boolean;
  /** Fires on the commit, not the press — reserved for meaningful moments. */
  haptic?: "light" | "medium" | "success" | null;
  style?: StyleProp<ViewStyle>;
}>(function Press({ children, large, haptic = null, style, onPress, ...rest }, ref) {
  const reduceMotion = useReduceMotion();
  /**
   * How far the press has been carried, 0 at rest and 1 held.
   *
   * One shared value drives whichever property the motion setting allows, so the two
   * paths cannot drift apart: whichever one is live, it is the same gesture, the same
   * timing and the same release.
   */
  const held = useSharedValue(0);
  const scaleTo = large ? press.scaleLarge : press.scale;

  const animated = useAnimatedStyle(
    () => ({
      // Reduce Motion: the press still answers instantly, it just does not move. A
      // surface that stayed perfectly still while being touched would read as broken,
      // which is why this is a fade and not nothing.
      opacity: reduceMotion ? 1 - held.value * pressFade : 1,
      // The unused axis is pinned to its rest value rather than omitted, so a setting
      // that flips mid-press cannot leave a stale transform on the element.
      transform: [{ scale: reduceMotion ? 1 : 1 - held.value * (1 - scaleTo) }],
    }),
    [reduceMotion, scaleTo],
  );

  return (
    <AnimatedPressable
      ref={ref}
      onPressIn={() => {
        // A spring can absorb the finger reversing mid-press; a duration cannot, so the
        // reduced path is a short timing curve and the full path stays a spring.
        held.value = reduceMotion
          ? withTiming(1, { duration: press.durationMs })
          : withSpring(1, spring.snappy);
      }}
      onPressOut={() => {
        held.value = reduceMotion
          ? withTiming(0, { duration: press.durationMs })
          : withSpring(0, spring.settle);
      }}
      onPress={(e) => {
        if (haptic) {
          // Causality: the haptic fires on the same event that changes the UI,
          // so the two land together rather than one trailing the other.
          const style =
            haptic === "success"
              ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              : Haptics.impactAsync(
                  haptic === "medium"
                    ? Haptics.ImpactFeedbackStyle.Medium
                    : Haptics.ImpactFeedbackStyle.Light,
                );
          void style;
        }
        onPress?.(e);
      }}
      style={[animated, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
});

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

export function Card({
  children,
  style,
  level = 1,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  level?: 0 | 1 | 2 | 3;
}) {
  const { c, elevation } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surfaceRaised,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.hairline,
        },
        elevation(level),
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.hairline }} />;
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  style,
  haptic = "light",
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: "light" | "medium" | "success" | null;
}) {
  const { c, brand, elevation } = useTheme();

  const content = (
    <View style={styles.buttonInner}>
      {icon}
      <RNText
        numberOfLines={1}
        style={{
          fontSize: 15,
          fontWeight: "600",
          letterSpacing: -0.17,
          color: variant === "primary" ? "#fff" : variant === "secondary" ? c.ink : c.ink2,
        }}
      >
        {title}
      </RNText>
    </View>
  );

  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      haptic={haptic}
      onPress={onPress}
      style={[{ opacity: disabled ? 0.45 : 1 }, style]}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={brand.gradient as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, elevation(2), { shadowColor: brand.primary, shadowOpacity: 0.35 }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            {
              backgroundColor: variant === "secondary" ? c.surfaceRaised : "transparent",
              borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
              borderColor: c.hairlineStrong,
            },
            variant === "secondary" ? elevation(1) : null,
          ]}
        >
          {content}
        </View>
      )}
    </Press>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  accessibilityLabel,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  /**
   * What a screen reader announces, when the visible label is not the whole story.
   *
   * The chip's visible text is deliberately short — "5 min", "Coherent" — because a row of chips
   * has to fit on a phone. On Breathe a tap on one of those *ends the session in progress and starts
   * a new one*, and "5 min, selected" gives a screen-reader user no way to know that before they
   * commit to the tap. The call site supplies the sentence; the chip falls back to its own label,
   * which is the right answer at every other use.
   */
  accessibilityLabel?: string;
}) {
  const { c, brand } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: active ? brand.primary : c.surfaceRaised,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: active ? "transparent" : c.hairline,
      }}
    >
      {icon}
      <RNText
        style={{
          fontSize: 13,
          fontWeight: "500",
          letterSpacing: -0.05,
          color: active ? "#fff" : c.ink2,
        }}
      >
        {label}
      </RNText>
    </Press>
  );
}

export function Badge({
  label,
  tone = "brand",
  icon,
}: {
  label: string;
  tone?: "brand" | "positive" | "gold" | "critical" | "neutral";
  icon?: ReactNode;
}) {
  const { c, brand } = useTheme();
  const map = {
    brand: { fg: brand.secondary, bg: brand.tint },
    positive: { fg: c.positive, bg: c.positiveTint },
    gold: { fg: c.gold, bg: c.goldTint },
    critical: { fg: c.critical, bg: c.criticalTint },
    neutral: { fg: c.ink3, bg: c.surfaceSunken },
  }[tone];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: map.bg,
      }}
    >
      {icon}
      <RNText style={{ fontSize: 11, fontWeight: "600", letterSpacing: 0.15, color: map.fg }}>
        {label}
      </RNText>
    </View>
  );
}

/* ── Status ────────────────────────────────────────────────────────────────
   An empty box while data loads is a missing answer to "is this working?".
   Skeletons answer it without claiming a result. */

export function Skeleton({ height, width, style }: { height: number; width?: number | string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        { height, width: (width ?? "100%") as ViewStyle["width"], backgroundColor: c.surfaceSunken, borderRadius: radius.sm },
        style,
      ]}
    />
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: space.xxl, paddingHorizontal: space.lg, gap: space.sm }}>
      <Text variant="title3" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {body && (
        <Text variant="body" tone="ink2" style={{ textAlign: "center" }}>
          {body}
        </Text>
      )}
      {/* Wayfinding: never leave someone at a dead end. */}
      {action ? <View style={{ marginTop: space.md }}>{action}</View> : null}
    </View>
  );
}

/* ── Disclosure ─────────────────────────────────────────────────────────────
   A section that starts closed.

   Why this is in the design system rather than written once on the Profile page:
   the alternative that gets written instead is a wall of prose, because collapsed
   content is usually added by simply *not* collapsing it. The small print on a
   privacy page is the exact case the pattern exists for — it has to be available and
   it must not be the first thing anyone reads.

   The whole header row is the target, at 44pt, not the chevron. A disclosure whose
   only tappable part is an 11pt glyph is a disclosure nobody opens. */

export function Disclosure({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  /** The one-line summary shown while the section is closed. */
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const { c } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View>
      <Press
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          minHeight: minTouchTarget,
          paddingVertical: 4,
        }}
      >
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="callout">{title}</Text>
          {subtitle && !open ? (
            <Text variant="meta" tone="ink3" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {/* The chevron rotates rather than swapping glyphs: a swap is a layout change,
            and a rotating one reads as the same control opening. */}
        <Text variant="callout" tone="ink3" style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
          ›
        </Text>
      </Press>
      {open ? <View style={{ paddingTop: space.xs, gap: space.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline }}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTouchTarget,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInner: { flexDirection: "row", alignItems: "center", gap: 8 },
});
