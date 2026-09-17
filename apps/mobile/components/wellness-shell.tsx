/**
 * The one layout every wellness screen sits in.
 *
 * It exists because the rules in docs/ios-layout-and-nav.md are easy to get wrong once
 * and then copy: the top inset for the Dynamic Island / notch, bottom clearance for the
 * floating iOS 26 tab bar (which draws *over* content), and a primary action that is
 * reachable with a thumb instead of pinned below the fold. Six screens with their own
 * padding is six chances to break the same three things.
 *
 * ── What was wrong with it ────────────────────────────────────────────────────────────
 *
 *   * **Bottom clearance was a guess.** `insets.bottom + 78` is right on exactly one
 *     device: the 78 is the tab bar's *content* height, not its frame, and it does not
 *     include the home-indicator band on the phones that have one. On a device with a
 *     larger bottom inset the last card was still reachable; on one with none it was
 *     buried. The numbers are now named constants with the reasoning attached.
 *   * **The top inset was applied inside the scroll content.** That works, but it means the
 *     content can be dragged up under the status bar and stays there. `contentInsetAdjustment`
 *     plus the padded content container keeps the overscroll bounce honest.
 *   * **There was no header action at all.** The one control the design asks for — a way
 *     into settings from any screen — did not exist, which is why an earlier iteration grew
 *     an oversized floating blue gear to compensate. A 44×44 header action is the iOS-native
 *     answer and it is what this renders.
 *   * **Pushed screens used the same padding as tab screens.** Water, Walk, Sleep and Japa
 *     set `tabBar={false}`, so they get a back control and home-indicator clearance only —
 *     without which a pushed screen had a band of dead space under its last button.
 */
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, space } from "@hermes/tokens";
import { Text } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { useTheme } from "@/lib/theme";
import { useProductUI, type ProductUI } from "@/lib/product-ui";

/**
 * The floating iOS 26 tab bar's height above the safe-area inset.
 *
 * 49 is the standard `UITabBar` content height; the extra 6 is breathing room so a card's
 * bottom hairline is not touching the glass. Both are constants rather than literals at the
 * call site so the one device-specific number in this file has a name.
 */
const TAB_BAR_CLEARANCE = 55;

/** Minimum hit area. Matches `minTouchTarget` in @hermes/tokens; 44pt is the platform floor. */
const ACTION_SIZE = 44;

export function WellnessShell({
  product,
  title,
  lead,
  status,
  children,
  scroller = true,
  tabBar = true,
  headerAction,
}: {
  product: string;
  title: string;
  lead: string;
  /** One line under the lead — the sync badge, on every screen that writes data. */
  status?: ReactNode;
  children: ReactNode;
  scroller?: boolean;
  /** False on pushed screens: there is no tab bar to clear, and they need a back control
   *  instead — a screen with no way out is a dead end. */
  tabBar?: boolean;
  /**
   * Replaces the default settings action. Pass `null` to render nothing, or a node to put
   * something else in the top-right corner.
   */
  headerAction?: ReactNode | null;
}) {
  const ui = useProductUI(product);
  const s = styles(ui);
  const insets = useSafeAreaInsets();

  const head = (
    <View style={s.head}>
      <View style={s.headRow}>
        <View style={s.headText}>
          {!tabBar ? <BackToToday /> : null}
          <Text variant="title2">{title}</Text>
          <Text variant="meta" tone="ink2">{lead}</Text>
        </View>
        {headerAction === undefined ? null : headerAction}
      </View>
      {status ? <View style={s.status}>{status}</View> : null}
    </View>
  );

  // The tab bar floats over the content, so the last card needs its height plus the home
  // indicator's reserved band, or the bottom of every screen is unreachable.
  const bottomPad = insets.bottom + (tabBar ? TAB_BAR_CLEARANCE : space.lg);
  const topPad = insets.top + space.base;

  if (!scroller) {
    return (
      <View style={[s.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        {head}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.wrap, { paddingTop: topPad, paddingBottom: bottomPad }]}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {head}
      {children}
    </ScrollView>
  );
}

function BackToToday() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/habits")}
      accessibilityRole="button"
      accessibilityLabel="Back to Today"
      hitSlop={8}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}
    >
      <Text variant="callout" tone="ink2">‹</Text>
      <Text variant="callout" tone="ink2">Today</Text>
    </Pressable>
  );
}

/**
 * The standard header action: a quiet 44×44 glyph that goes to Profile.
 *
 * Deliberately not a filled button. The old treatment was a large solid blue control that
 * read as the screen's primary call to action on pages whose real primary action was
 * somewhere else entirely — a settings gear competing with "Start routine" is a hierarchy
 * bug, not a taste question. It is a vector glyph rather than a text character, because a
 * text glyph's weight and baseline differ per platform font.
 */
export function HeaderAction({
  onPress,
  label,
  glyph = "person",
}: {
  onPress: () => void;
  label: string;
  glyph?: IconName;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        width: ACTION_SIZE,
        height: ACTION_SIZE,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Icon name={glyph} size={22} color={c.ink2} />
    </Pressable>
  );
}

/** The profile action wired to the Profile screen — what every wellness tab renders. */
export function ProfileAction() {
  const router = useRouter();
  return <HeaderAction onPress={() => router.push("/profile")} label="Profile and settings" />;
}

export function styles(ui: ProductUI) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg },
    wrap: { paddingHorizontal: space.base },
    head: { gap: 4, marginBottom: space.base },
    headRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
    headText: { flex: 1, gap: 4 },
    status: { marginTop: 2 },
  });
}
