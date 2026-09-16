import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@hermes/tokens";
import { useSaved } from "@/lib/saved";
import { Button, EmptyState, Text } from "@/components/ui";
import { BusinessCard } from "@/components/business-card";

export default function SavedScreen() {
  const { items, ready } = useSaved();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <FlatList
      data={items}
      keyExtractor={(b) => String(b.id)}
      renderItem={({ item }) => <BusinessCard b={item} />}
      contentContainerStyle={{
        paddingTop: insets.top + space.base,
        paddingHorizontal: space.base,
        paddingBottom: space.xxl,
        gap: space.md,
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        items.length > 0 ? (
          <Text variant="title1" style={{ marginBottom: space.sm }}>
            Saved
          </Text>
        ) : null
      }
      ListEmptyComponent={
        !ready ? null : (
          <EmptyState
            title="Nothing saved yet"
            body="Tap the bookmark on any listing and it stays here — phone number included, so it works with no signal."
            action={<Button title="Browse the directory" onPress={() => router.push("/browse")} />}
          />
        )
      }
    />
  );
}
