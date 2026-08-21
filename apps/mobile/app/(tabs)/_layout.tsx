import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { TabIcon } from "@/components/icons";

export default function TabsLayout() {
  const { c, brand } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.canvas },
        tabBarActiveTintColor: brand.secondary,
        tabBarInactiveTintColor: c.ink3,
        tabBarStyle: {
          backgroundColor: c.surfaceRaised,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.hairline,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.1 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Browse", tabBarIcon: (p) => <TabIcon name="browse" {...p} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Search", tabBarIcon: (p) => <TabIcon name="search" {...p} /> }}
      />
      <Tabs.Screen
        name="saved"
        options={{ title: "Saved", tabBarIcon: (p) => <TabIcon name="saved" {...p} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Account", tabBarIcon: (p) => <TabIcon name="account" {...p} /> }}
      />
    </Tabs>
  );
}
