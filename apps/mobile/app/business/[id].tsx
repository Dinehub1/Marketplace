import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { useSaved } from "@/lib/saved";
import { getBusiness, type Business } from "@/lib/api";
import { BRAND } from "@/lib/config";
import { CITY_LABEL } from "@hermes/core";
import { cleanBusinessName, formatCount, telHref, titleize, waHref } from "@hermes/core";
import { Badge, Button, Card, Divider, EmptyState, Press, Skeleton, Text } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function BusinessDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, brand, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const saved = useSaved();

  const [biz, setBiz] = useState<Business | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    const ctrl = new AbortController();
    getBusiness(Number(id), ctrl.signal)
      .then((b) => {
        setBiz(b);
        setState(b ? "ready" : "missing");
      })
      .catch(() => setState("missing"));
    return () => ctrl.abort();
  }, [id]);

  const mapsUrl = biz?.address
    ? `https://www.google.com/maps/search/${encodeURIComponent(`${biz.name} ${biz.address}`)}`
    : null;

  return (
    <View style={{ flex: 1 }}>
      {/* Header sits above the scroll view rather than inside it: the back
          affordance must never scroll out of reach. */}
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.sm,
          paddingBottom: space.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: c.canvas,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
        }}
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="back" size={22} color={c.ink} strokeWidth={2} />
        </Press>

        {biz && (
          <Press
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={saved.has(biz.id) ? "Remove from saved" : "Save listing"}
            accessibilityState={{ selected: saved.has(biz.id) }}
            onPress={() => saved.toggle(biz)}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Icon
              name="saved"
              size={21}
              color={saved.has(biz.id) ? brand.secondary : c.ink3}
              filled={saved.has(biz.id)}
              strokeWidth={1.9}
            />
          </Press>
        )}
      </View>

      {state === "missing" ? (
        <EmptyState
          title="Listing not found"
          body="It may have been removed. Browse the directory for similar businesses."
          action={<Button title="Open directory" onPress={() => router.replace("/")} />}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: space.base, paddingBottom: space.xxl, gap: space.base }}
          showsVerticalScrollIndicator={false}
        >
          {state === "loading" || !biz ? (
            <View style={{ gap: space.md }}>
              <Skeleton height={34} width="80%" />
              <Skeleton height={20} width="45%" />
              <Skeleton height={140} style={{ marginTop: space.sm }} />
            </View>
          ) : (
            <>
              <View>
                <Text variant="caption" tone="ink3">
                  {biz.category ? `${titleize(biz.category)} · ${CITY_LABEL}` : CITY_LABEL}
                </Text>
                <Text variant="hero" style={{ marginTop: space.sm }}>
                  {cleanBusinessName(biz.name)}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md }}>
                  {biz.rating != null && (
                    <Badge
                      tone="gold"
                      label={`${Number(biz.rating).toFixed(1)}${
                        biz.reviews_count != null ? ` (${formatCount(biz.reviews_count)})` : ""
                      }`}
                      icon={<Icon name="star" size={10} color={c.gold} filled />}
                    />
                  )}
                  {biz.verified && <Badge tone="positive" label="Verified" />}
                  {biz.featured && <Badge tone="brand" label="Featured" />}
                </View>
              </View>

              {/* Calling is the conversion. It is the first action, full width,
                  not the fourth row of a details list. */}
              {biz.phone && (
                <View style={{ gap: space.sm }}>
                  <Button
                    title={biz.phone}
                    haptic="medium"
                    icon={<Icon name="phone" size={15} color="#fff" strokeWidth={2} />}
                    onPress={() => Linking.openURL(telHref(biz.phone!))}
                  />
                  <View style={{ flexDirection: "row", gap: space.sm }}>
                    <Button
                      title="WhatsApp"
                      variant="secondary"
                      style={{ flex: 1 }}
                      icon={<Icon name="whatsapp" size={15} color={c.whatsapp} strokeWidth={1.8} />}
                      onPress={() =>
                        Linking.openURL(
                          waHref(biz.phone!, `Hi ${biz.name}, I found you on ${BRAND.name} and would like to enquire.`),
                        )
                      }
                    />
                    {mapsUrl && (
                      <Button
                        title="Directions"
                        variant="secondary"
                        style={{ flex: 1 }}
                        icon={<Icon name="map" size={15} color={c.ink2} />}
                        onPress={() => Linking.openURL(mapsUrl)}
                      />
                    )}
                  </View>
                </View>
              )}

              <Card style={{ padding: space.base, gap: space.base }}>
                <Text variant="title3">Business details</Text>

                {biz.address && (
                  <Row icon="map" label={biz.address} onPress={mapsUrl ? () => Linking.openURL(mapsUrl) : undefined} />
                )}
                {biz.phone && <Row icon="phone" label={biz.phone} onPress={() => Linking.openURL(telHref(biz.phone!))} />}
                {biz.website && (
                  <Row
                    icon="globe"
                    label={biz.website.replace(/^https?:\/\//, "")}
                    onPress={() => Linking.openURL(biz.website!)}
                  />
                )}

                <Divider />

                {/* Honesty over a borrowed trust signal: the source of the data
                    is stated rather than implied by a "Verified" badge that
                    every row would carry. */}
                <Text variant="meta" tone="ink3">
                  This listing comes from publicly available Google Maps data and may be out of
                  date. Please confirm with the business before travelling.
                </Text>
              </Card>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: "map" | "phone" | "globe";
  label: string;
  onPress?: () => void;
}) {
  const { c, brand } = useTheme();
  const body = (
    <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start", minHeight: 32 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.xs,
          backgroundColor: brand.tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={16} color={brand.secondary} />
      </View>
      <Text variant="body" tone={onPress ? "ink" : "ink2"} style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );

  return onPress ? (
    <Press accessibilityRole="link" onPress={onPress}>
      {body}
    </Press>
  ) : (
    body
  );
}
