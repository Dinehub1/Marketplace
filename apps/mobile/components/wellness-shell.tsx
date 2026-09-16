/**
 * The one layout every wellness screen sits in.
 *
 * It exists because the rules in docs/ios-layout-and-nav.md are easy to get wrong once
 * and then copy: the top inset for the Dynamic Island / notch, bottom clearance for the
 * floating iOS 26 tab bar (which draws *over* content), and a primary action that is
 * reachable with a thumb instead of pinned below the fold. Six screens with their own
 * padding is six chances to break the same three things.
 */
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@hermes/tokens";
import { Text } from "@/components/ui";
import { useProductUI, type ProductUI } from "@/lib/product-ui";

export function WellnessShell({
  product,
  title,
  lead,
  children,
  scroller = true,
  tabBar = true,
}: {
  product: string;
  title: string;
  lead: string;
  children: ReactNode;
  scroller?: boolean;
  /** False on pushed screens: there is no tab bar to clear, and they need a back control
   *  instead — a screen with no way out is a dead end. */
  tabBar?: boolean;
}) {
  const ui = useProductUI(product);
  const insets = useSafeAreaInsets();
  const s = styles(ui);

  const head = (
    <View style={s.head}>
      {!tabBar ? <BackToToday /> : null}
      <Text variant="title2">{title}</Text>
      <Text variant="meta" tone="ink2">{lead}</Text>
    </View>
  );

  // The tab bar floats over the content, so the last card needs its height plus the home
  // indicator's reserved band, or the bottom of every screen is unreachable.
  const bottomPad = insets.bottom + (tabBar ? 78 : space.lg);

  if (!scroller) {
    return (
      <View style={[s.root, { paddingTop: insets.top + space.base, paddingBottom: bottomPad }]}>
        {head}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top + space.base, paddingBottom: bottomPad }]}
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

export function styles(ui: ProductUI) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: ui.bg },
    wrap: { paddingHorizontal: space.base },
    head: { gap: 4, marginBottom: space.base },
  });
}
