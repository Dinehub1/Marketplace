import { Linking, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { useOwner } from "@/lib/owner";
import { BRAND } from "@/lib/config";
import { Button, Card, Divider, Press, Text } from "@/components/ui";
import { ThemeSwitch } from "@/components/theme-switch";
import { Icon, type IconName } from "@/components/icons";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { c, brand } = useTheme();
  const owner = useOwner();
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + space.base,
        paddingHorizontal: space.base,
        paddingBottom: space.xxl,
        gap: space.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="title1">Account</Text>

      {/* Owner mode. The app is one binary with two modes rather than two apps:
          most people only ever browse, so the dashboard is something you sign
          into, not a tab that sits there confusing everyone else. */}
      <Card style={{ padding: space.base, gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: brand.tint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="chart" size={19} color={brand.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="title3">{owner.session ? "Business dashboard" : "Own a business?"}</Text>
            <Text variant="meta" tone="ink3">
              {owner.session
                ? owner.session.phone
                : "See your leads and manage your listing."}
            </Text>
          </View>
        </View>

        {owner.session ? (
          <View style={{ gap: space.sm }}>
            <Button title="Open dashboard" onPress={() => router.push("/owner")} />
            <Button title="Sign out" variant="ghost" onPress={owner.signOut} />
          </View>
        ) : (
          <Button title="Sign in with WhatsApp" onPress={() => router.push("/owner/sign-in")} />
        )}
      </Card>

      <View style={{ gap: space.md }}>
        <Text variant="caption" tone="ink3">
          Appearance
        </Text>
        <ThemeSwitch />
        <Text variant="meta" tone="ink3">
          System follows your device setting.
        </Text>
      </View>

      <Card style={{ overflow: "hidden" }}>
        <LinkRow icon="globe" label="Open the website" onPress={() => Linking.openURL(WEB_BASE_URL)} />
        <Divider />
        <LinkRow icon="inbox" label="Contact support" onPress={() => Linking.openURL("mailto:support@cashcard.live")} />
      </Card>

      <Text variant="meta" tone="ink3" style={{ textAlign: "center" }}>
        {BRAND.name} · v0.1.0
      </Text>
    </ScrollView>
  );
}

function LinkRow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Press
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingHorizontal: space.base,
        minHeight: 52,
      }}
    >
      <Icon name={icon} size={18} color={c.ink3} />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="chevron" size={16} color={c.ink4} strokeWidth={2} />
    </Press>
  );
}
