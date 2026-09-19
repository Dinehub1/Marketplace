// SDK 57's expo-router bundles React Navigation and refuses a direct
// @react-navigation/native import (see docs.expo.dev/router/migrate/sdk-55-to-56).
// The theming primitives are re-exported by expo-router itself.
import { Stack, ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { SavedProvider } from "@/lib/saved";
import { OwnerProvider } from "@/lib/owner";
import { useReduceMotion } from "@/lib/motion";
import { prepareAds } from "@/lib/ads";

function Root() {
  const { c, brand, scheme } = useTheme();
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    // Boot the ad subsystem once, at the root rather than on a screen. It is a
    // no-op unless EXPO_PUBLIC_ADS_ENABLED is set, it never throws, and it is the
    // only subscriber to impression-level revenue — a screen that owned that
    // subscription would drop any impression reported after it unmounted, which is
    // the one number the whole measurement loop runs on.
    void prepareAds();
  }, []);

  useEffect(() => {
    // Paints the window behind the React tree. Without it the OS background
    // shows through during navigation transitions as a white flash on dark.
    SystemUI.setBackgroundColorAsync(c.canvas).catch(() => {});
  }, [c.canvas]);

  // React Navigation carries its OWN theme, and every navigator paints its
  // scene background from it. Without this the tab screens keep React
  // Navigation's default light background while our components render dark
  // text on top — which is exactly what a half-migrated dark mode looks like.
  const navTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme : DefaultTheme).colors,
      background: c.canvas,
      card: c.surfaceRaised,
      text: c.ink,
      border: c.hairline,
      primary: brand.secondary,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.canvas },
          // Spatial consistency: a screen pushed from the right dismisses to the
          // right. The gesture and the animation share one path.
          //
          // Under Reduce Motion the push cross-fades instead of travelling across the
          // screen. The back *gesture* is deliberately kept: the user is driving it
          // with their own finger, so there is no motion imposed on them to be made
          // uncomfortable by — and taking away the way out would be a worse trade.
          animation: reduceMotion ? "fade" : "slide_from_right",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="(directory)/(tabs)" />
        <Stack.Screen name="(wellness)/(tabs)" />
        <Stack.Screen name="(directory)/owner" />
        <Stack.Screen
          name="(directory)/business/[id]"
          options={{ animation: reduceMotion ? "fade" : "slide_from_right", presentation: "card" }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SavedProvider>
            <OwnerProvider>
              <Root />
            </OwnerProvider>
          </SavedProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
