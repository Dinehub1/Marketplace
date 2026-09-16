/**
 * The wellness app's navigation: iOS 26 native tabs.
 *
 * Why native rather than a hand-built bar: in iOS 26 the system tab bar is Liquid Glass,
 * it floats above the content, it minimises on scroll and it adapts to the phone's size.
 * Re-implementing that in JavaScript produces something that is nearly right on every
 * device and wrong on the newest one — Apple's own guidance is to use the system
 * component, and Expo SDK 57 wraps it as NativeTabs (UITabBarController on iOS, Material
 * tabs on Android, a web implementation for the browser preview).
 *
 * Five tabs, because iOS collapses anything past five into a "More" list, and a product
 * hidden behind "More" is a product nobody finds. Water and the japa counter are pushed
 * from Habits for that reason — they are real screens, not tabs.
 */
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "@/lib/theme";

export default function WellnessLayout() {
  const { brand } = useTheme();

  return (
    <NativeTabs tintColor={brand.secondary}>
      <NativeTabs.Trigger name="breathe">
        <NativeTabs.Trigger.Label>Breathe</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wind" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stretch">
        <NativeTabs.Trigger.Label>Stretch</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.flexibility" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="walk">
        <NativeTabs.Trigger.Label>Walk</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.walk" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="habits">
        <NativeTabs.Trigger.Label>Habits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="checkmark.circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sleep">
        <NativeTabs.Trigger.Label>Sleep</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="moon.stars" />
      </NativeTabs.Trigger>
      {/* Water and Japa are NOT declared here. Declaring them with `hidden` looked right
          and failed on the web build — the route rendered the first tab's content instead
          of its own screen. They live outside the group as pushed screens. */}
    </NativeTabs>
  );
}
