/**
 * AdSlot — the rewarded-video placeholder, and the ONE file an ad SDK ever
 * touches.
 *
 * No ad network is connected yet: AdMob needs an account, a unit ID per
 * placement and an app-ads.txt we do not have. But both games need the rewarded
 * loop to exist now, because it is a game-design decision (what a rewarded view
 * is worth, and when it is offered) rather than a SDK detail. So this component
 * ships the SHAPE of a rewarded ad:
 *
 *   - it renders a clearly labelled placeholder, never a fake ad;
 *   - the caller hands it the reward, so no game knows which network is behind it;
 *   - `onReward` fires only after the ad reports a completed view;
 *   - `onDismiss` always exists, so an ad is never the only way forward.
 *
 * Swapping in AdMob is a change to this file alone — the games keep working
 * unchanged, with or without ads:
 *
 *   const { show, loaded } = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
 *   if (loaded) show().then(() => onReward());   // replaces the placeholder timer
 */
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { Press, Text } from "@/components/ui";

export type AdSlotProps = {
  /** Placeholder headline, e.g. "Rewarded ad — extra lives". */
  title: string;
  /** What the view pays out, in the game's own words. */
  reward: string;
  /** Button label — say what it buys, not "watch ad". */
  cta: string;
  /** Fires once the ad reports a completed view. */
  onReward: () => void;
  /** Way out. A rewarded ad is an offer, never a wall. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** The game's accent, so the slot belongs to the game it sits in. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Stand-in for the SDK's "view completed" callback. It exists so the game code
 * already handles a delayed, asynchronous reward — the part everyone forgets
 * when the real SDK lands.
 */
export const AD_PLACEHOLDER_MS = 1200;

export function AdSlot({
  title,
  reward,
  cta,
  onReward,
  onDismiss,
  dismissLabel = "No thanks",
  accent,
  style,
}: AdSlotProps) {
  const { c, elevation } = useTheme();
  const [showing, setShowing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A reward must never land after the screen that asked for it has gone.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    },
    [],
  );

  function play() {
    if (showing) return;
    setShowing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setShowing(false);
      onReward();
    }, AD_PLACEHOLDER_MS);
  }

  const ctaColor = accent ?? c.ink;

  return (
    <View
      style={[
        styles.box,
        elevation(0),
        { backgroundColor: c.surfaceSunken, borderColor: c.hairlineStrong },
        style,
      ]}
    >
      <View style={styles.head}>
        <View style={[styles.tag, { backgroundColor: c.surfaceInset, borderColor: c.hairlineStrong }]}>
          <Text variant="caption" tone="ink3">
            Ad
          </Text>
        </View>
        <Text variant="callout" style={[styles.title, { color: c.ink }]}>
          {title}
        </Text>
      </View>

      <Text variant="meta" tone="ink2">
        {reward}
      </Text>

      <View style={styles.actions}>
        <Press
          accessibilityRole="button"
          accessibilityState={{ disabled: showing, busy: showing }}
          accessibilityLabel={cta}
          disabled={showing}
          haptic="light"
          onPress={play}
          style={[styles.cta, { backgroundColor: ctaColor }, showing ? { opacity: 0.6 } : null]}
        >
          {showing ? (
            <ActivityIndicator color={c.canvas} />
          ) : (
            <Text variant="callout" style={[styles.ctaLabel, { color: c.canvas }]}>
              {cta}
            </Text>
          )}
        </Press>

        {onDismiss ? (
          <Press
            accessibilityRole="button"
            accessibilityLabel={dismissLabel}
            disabled={showing}
            onPress={onDismiss}
            style={styles.dismiss}
          >
            <Text variant="callout" tone="ink2">
              {dismissLabel}
            </Text>
          </Press>
        ) : null}
      </View>

      {/* Honest label, not a decoration: this is what the slot really is today. */}
      <Text variant="meta" tone="ink3">
        Placeholder — no ad network is connected yet. It grants the reward on tap so the
        flow can be tested; the game is fully playable without it.
      </Text>
    </View>
  );
}

/**
 * AdBanner — the reserved space a real banner is dropped into.
 *
 * The second half of the same rule the rewarded slot follows: this file is the only place an
 * ad SDK is ever mentioned, so the games keep working with or without one.
 *
 * The height is reserved whether or not an ad has loaded. A banner that arrives a second
 * late and pushes the board down is a worse experience than a space that is briefly empty,
 * and on a game screen the board moving mid-round is the one thing that must never happen.
 * Nothing is faked — until a network is connected this says exactly what it is, the way the
 * rewarded slot does.
 */
export const AD_BANNER_HEIGHT = 60;

export function AdBanner({
  accent,
  style,
}: {
  /** The game's accent, so the reserved space belongs to the screen it sits in. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  return (
    <View
      accessibilityRole="summary"
      style={[
        styles.banner,
        {
          height: AD_BANNER_HEIGHT,
          borderColor: c.hairlineStrong,
          backgroundColor: c.surfaceSunken,
        },
        style,
      ]}
    >
      <View style={[styles.tag, { backgroundColor: c.surfaceInset, borderColor: c.hairlineStrong }]}>
        <Text variant="caption" tone="ink3">
          Ad
        </Text>
      </View>
      <Text variant="meta" tone="ink3" style={styles.bannerNote}>
        Banner space
      </Text>
      {accent ? <View style={[styles.bannerDot, { backgroundColor: accent }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: space.base,
    gap: space.sm,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    marginBottom: space.sm,
  },
  bannerNote: { flex: 1 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.5 },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  title: { flex: 1 },
  actions: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.xs },
  cta: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: { fontWeight: "600" },
  dismiss: {
    minHeight: 44,
    paddingHorizontal: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
