/**
 * AdSlot — the rewarded-video surface, and the ONE file an ad SDK ever touches.
 *
 * No ad network is connected yet: AdMob needs an account, a unit id per placement
 * and an `app-ads.txt` we do not have. But the rewarded loop has to exist now,
 * because "what a rewarded view is worth, and when it is offered" is a game-design
 * decision rather than an SDK detail. So this component ships the SHAPE of a
 * rewarded ad and two honest states behind it:
 *
 *   - **Ads off, or no network ready** — a clearly labelled placeholder. It is not
 *     a fake ad, and it says so: the view grants the reward on tap so the flow can
 *     be tested, and the screen is fully usable without it.
 *   - **Ads on and a network ready** — the real rewarded ad, through
 *     `lib/ads` (the facade), which owns consent, caps and measurement. This file
 *     still never names a network.
 *
 * The contract the games rely on does not change in either state:
 *
 *   - the caller hands over the reward, so no game knows what is behind it;
 *   - `onReward` fires only after the ad reports a completed view;
 *   - `onDismiss` always exists, so an ad is never the only way forward.
 *
 * `placement` is the one prop the game must add: it is the key every impression is
 * measured under ("game.blockclear.stuck"), and the eCPM that decides where money
 * goes is per-placement. Without it an ad would be countable but not actionable.
 */
import { useCallback, useEffect, useRef, useState } from "react";
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
import { isRewardedReady, mayShow, showRewarded } from "@/lib/ads";
import type { PlacementId } from "@/lib/ads";

export type AdSlotProps = {
  /**
   * Where this slot lives, as `surface.moment` — e.g. `game.blockclear.stuck`.
   * Required, because the whole point of the SDK is measuring one moment against
   * another, and a slot with no name cannot be compared to anything.
   */
  placement: PlacementId;
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
  /**
   * True when the reward is **something of value** — an unlocked file, not a
   * convenience like one extra life.
   *
   * A strict slot grants nothing unless a real ad completed: in a build with no ad
   * SDK it refuses and says so, because the alternative is a paywall with a button
   * that hands the paid file over for free. A non-strict slot (the games) keeps the
   * placeholder behaviour, so the loop stays testable in Expo Go — the cost there is
   * one extra life, which is not worth a paywall hole.
   */
  strict?: boolean;
};

/**
 * Stand-in for the SDK's "view completed" callback, in a build with no network.
 * It exists so the game code already handles a delayed, asynchronous reward — the
 * part everyone forgets when the real SDK lands.
 */
export const AD_PLACEHOLDER_MS = 1200;

export function AdSlot({
  placement,
  title,
  reward,
  cta,
  onReward,
  onDismiss,
  dismissLabel = "No thanks",
  accent,
  style,
  strict = false,
}: AdSlotProps) {
  const { c, elevation } = useTheme();
  const [showing, setShowing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A reward must never land after the screen that asked for it has gone.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    },
    [],
  );

  const live = isRewardedReady(placement);

  const play = useCallback(async () => {
    if (showing) return;

    // Ads off, or no network ready.
    //
    // A strict slot has nothing to offer here, and must say so rather than grant:
    // the value behind it is a file someone would otherwise pay for. This is the
    // branch that keeps "no verified completion, no unlock" true in a build whose
    // ad SDK is not compiled in.
    if (strict && !live) {
      setNote("No ad is available in this build, so the file cannot be unlocked here. It can still be bought below.");
      return;
    }

    // The placeholder path: games only. It grants the reward on tap so the loop can
    // be tested without an ad account, and says plainly that it is a placeholder —
    // a silent fake ad is how a reward economy starts lying.
    if (!live) {
      const decision = mayShow("rewarded", placement);
      if (!decision.ok && decision.reason !== "sdk_unavailable") {
        setNote(decision.detail ? `${decision.reason}: ${decision.detail}` : decision.reason);
      }
      setShowing(true);
      timer.current = setTimeout(() => {
        timer.current = null;
        setShowing(false);
        onReward();
      }, AD_PLACEHOLDER_MS);
      return;
    }

    setShowing(true);
    const outcome = await showRewarded(placement);
    setShowing(false);

    if (outcome.kind === "rewarded") {
      onReward();
      return;
    }
    if (outcome.kind === "dismissed") {
      // The user closed it early. No reward, no penalty — and the caller's own way
      // out is still there.
      setNote("The ad was closed before it finished, so nothing was unlocked.");
      return;
    }
    setNote("No ad was available just now. Nothing was unlocked.");
  }, [live, onReward, placement, showing, strict]);

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
          onPress={() => void play()}
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

      {note ? (
        <Text variant="meta" tone="ink2">
          {note}
        </Text>
      ) : null}

      {/*
        Honest label, not a decoration: this is what the slot really is today. In a
        build with a live network the line is gone, because then it would be false.
        A strict slot gets different words, because for it "tested with a placeholder"
        is not an option — nothing is granted.
      */}
      {live ? null : (
        <Text variant="meta" tone="ink3">
          {strict
            ? "No ad network is connected in this build, so this cannot be used to unlock. It grants nothing until a real ad completes."
            : "Placeholder — no ad network is connected yet. It grants the reward on tap so the flow can be tested; the game is fully playable without it."}
        </Text>
      )}
    </View>
  );
}

/**
 * AdBanner — the reserved space a real banner is dropped into.
 *
 * The second half of the same rule the rewarded slot follows: this file is the only
 * place an ad SDK is ever mentioned, so the games keep working with or without one.
 *
 * The height is reserved whether or not an ad has loaded. A banner that arrives a
 * second late and pushes the board down is a worse experience than a space that is
 * briefly empty, and on a game screen the board moving mid-round is the one thing
 * that must never happen. A real banner is a native view owned by the adapter
 * (P2); until then nothing is faked — this says exactly what it is.
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
