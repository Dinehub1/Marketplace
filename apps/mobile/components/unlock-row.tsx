/**
 * UnlockRow — the paywall fence, with an ad path beside the paid one.
 *
 * This component exists so that "one completed rewarded ad unlocks one file" is
 * written ONCE. Four product screens hit the same fence, and four copies of a
 * reward rule is exactly how one of them ends up granting on a cancelled view.
 *
 * ## The order of operations, which is the whole point
 *
 *   1. the user taps **Watch ad to unlock** (the paid button sits beside it and is
 *      never taken away);
 *   2. the ad plays, and `AdSlot` calls `onReward` **only** on a verified
 *      completion — a dismissed or failed ad never reaches step 3;
 *   3. *only then* does this ask the server to release the file;
 *   4. the server writes the unlock row (one per file, ever), refuses a job that was
 *      already paid for, enforces a daily quota, and returns the clean URL.
 *
 * A failure at any step leaves the file locked and says so in words. There is no
 * local fallback that opens the preview as if it were the clean file, because that
 * is the exact bug this design is written to prevent.
 *
 * ## Why the paid button is a sibling, not a fallback
 *
 * The ad is an alternative payment, not a demo of one. Hiding the price behind an
 * ad, or the ad behind the price, would both be dark patterns; both are visible,
 * both are labelled with what they give.
 */
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { Press, Text } from "@/components/ui";
import { mayShow, showRewarded } from "@/lib/ads";
import { openPaywall, unlockWithRewardedAd, type JobResult } from "@/lib/tools";

export type UnlockRowProps = {
  /** The finished-but-locked job. Its `jobId` is what the server grants against. */
  job: JobResult;
  /**
   * The placement this fence is, e.g. `job.unlock-rewarded.bg-remove`. Per-product
   * on purpose: "which tool's paywall converts on an ad" is a real question, and a
   * single shared key could not answer it.
   */
  placement: string;
  /** What the paid button says, in this product's words. */
  paidLabel: string;
  /** One line under the paid button, e.g. what the clean file keeps. */
  paidNote?: string;
  /** Called with the clean URL once the server has released it. */
  onUnlocked: (outputUrl: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function UnlockRow({
  job,
  placement,
  paidLabel,
  paidNote,
  onUnlocked,
  style,
}: UnlockRowProps) {
  const { c } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);
  // In a build with no ad SDK there is nothing to verify against, so the ad path is
  // shown as unavailable rather than as a button that would fail on tap.
  const adOff = !mayShow("rewarded", placement).ok;

  /**
   * Start the verified unlock.
   *
   * `unlockWithRewardedAd` owns the whole handshake — claim, show, wait for AdMob's
   * signed callback — and calls back into `showRewarded` in the middle so the nonce
   * it minted rides on the ad request. `granting` guards the window so a second tap
   * cannot open a second claim.
   */
  async function start() {
    if (granting) return;
    setGranting(true);
    setError(null);
    const result = await unlockWithRewardedAd(job, placement, () => showRewarded(placement));
    setGranting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUnlocked(result.outputUrl);
  }

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[styles.adBox, { backgroundColor: c.surfaceSunken, borderColor: c.hairlineStrong }]}
      >
        <View style={styles.adHead}>
          <View style={[styles.tag, { backgroundColor: c.surfaceInset, borderColor: c.hairlineStrong }]}>
            <Text variant="caption" tone="ink3">
              Ad
            </Text>
          </View>
          <Text variant="callout" style={[styles.adTitle, { color: c.ink }]}>
            Free unlock — watch one ad
          </Text>
        </View>

        <Text variant="meta" tone="ink2">
          One completed ad unlocks this one file. The ad platform confirms it, so the
          file is released only after that confirmation arrives.
        </Text>

        <Press
          accessibilityRole="button"
          accessibilityState={{ disabled: granting }}
          accessibilityLabel="Watch an ad to unlock this file free"
          disabled={granting}
          onPress={() => void start()}
          style={[styles.adCta, { backgroundColor: c.ink }, granting ? { opacity: 0.6 } : null]}
        >
          <Text variant="callout" style={[styles.adCtaLabel, { color: c.canvas }]}>
            {granting ? "Confirming with the ad platform…" : "Watch ad to unlock free"}
          </Text>
        </Press>

        {adOff ? (
          <Text variant="meta" tone="ink3">
            No ad network is connected in this build, so this cannot be used to unlock. The
            paid option below still works.
          </Text>
        ) : null}
      </View>

      <Press
        accessibilityRole="button"
        accessibilityLabel={paidLabel}
        disabled={granting}
        onPress={() => void openPaywall(job.jobId!)}
        style={[styles.paid, { borderColor: c.hairlineStrong, backgroundColor: c.surface }]}
      >
        <Text variant="callout" style={{ color: c.ink }}>
          {paidLabel}
        </Text>
      </Press>

      {paidNote ? (
        <Text variant="meta" tone="ink2">
          {paidNote}
        </Text>
      ) : null}

      {error ? (
        <Text variant="meta" style={{ color: c.critical }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  adBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.md,
    padding: space.base,
    gap: space.sm,
  },
  adHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  tag: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xs,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  adTitle: { flex: 1 },
  adCta: {
    minHeight: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  adCtaLabel: { fontWeight: "600" },
  paid: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
});
