import { Linking, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { cleanBusinessName, formatCount, telHref, waHref } from "@hermes/core";
import type { Business } from "@/lib/api";
import { Badge, Card, Press, Text } from "./ui";
import { Icon } from "./icons";

/**
 * The native counterpart of the web's BusinessCard. Same information hierarchy,
 * same conversion priority: calling is what a local directory is *for*, so the
 * phone button is a full-width primary action rather than the fourth line of a
 * details list.
 */
export function BusinessCard({ b }: { b: Business }) {
  const { c, brand, elevation } = useTheme();
  const router = useRouter();
  const rating = b.rating != null ? Number(b.rating) : null;

  return (
    <Card style={{ overflow: "hidden" }}>
      {/* The card body navigates; the actions below do not. Nesting a Pressable
          inside a Pressable is the RN equivalent of the web's stretched link,
          and the inner one wins the touch — which is what we want. */}
      <Press large accessibilityRole="button" onPress={() => router.push(`/business/${b.id}`)}>
        <View style={{ flexDirection: "row", gap: space.md, padding: space.base }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radius.sm,
              backgroundColor: brand.tint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="browse" size={21} color={brand.secondary} />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="callout" numberOfLines={2}>
              {cleanBusinessName(b.name)}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {rating != null && (
                <Badge
                  tone="gold"
                  label={`${rating.toFixed(1)}${b.reviews_count != null ? ` (${formatCount(b.reviews_count)})` : ""}`}
                  icon={<Icon name="star" size={10} color={c.gold} filled />}
                />
              )}
              {b.verified && <Badge tone="positive" label="Verified" />}
              {b.category && (
                <Text variant="meta" tone="ink3" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {b.category}
                </Text>
              )}
            </View>

            {b.address && (
              <Text variant="meta" tone="ink3" numberOfLines={2} style={{ marginTop: 6 }}>
                {b.address}
              </Text>
            )}
          </View>
        </View>
      </Press>

      {b.phone && (
        <View
          style={{
            flexDirection: "row",
            gap: space.sm,
            paddingHorizontal: space.base,
            paddingBottom: space.base,
          }}
        >
          <Press
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel={`Call ${b.name}`}
            onPress={() => Linking.openURL(telHref(b.phone!))}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              minHeight: 44,
              borderRadius: radius.sm,
              backgroundColor: brand.primary,
              ...elevation(1),
            }}
          >
            <Icon name="phone" size={14} color="#fff" strokeWidth={2} />
            <Text variant="meta" style={{ color: "#fff", fontWeight: "600", letterSpacing: 0 }}>
              {b.phone}
            </Text>
          </Press>

          <Press
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={`Message ${b.name} on WhatsApp`}
            onPress={() =>
              Linking.openURL(
                waHref(b.phone!, `Hi ${b.name ?? "there"}, I found you on the directory and would like to enquire.`),
              )
            }
            style={{
              width: 44,
              minHeight: 44,
              borderRadius: radius.sm,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.whatsappTint,
            }}
          >
            <Icon name="whatsapp" size={17} color={c.whatsapp} strokeWidth={1.8} />
          </Press>

          {b.website && (
            <Press
              accessibilityRole="button"
              accessibilityLabel={`${b.name} website`}
              onPress={() => Linking.openURL(b.website!)}
              style={{
                width: 44,
                minHeight: 44,
                borderRadius: radius.sm,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.surfaceSunken,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.hairline,
              }}
            >
              <Icon name="globe" size={16} color={c.ink2} />
            </Press>
          )}
        </View>
      )}
    </Card>
  );
}
