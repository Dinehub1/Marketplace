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
 * Five tabs, because iOS 26 shows five and collapses the rest into a "More" list, and a
 * product hidden behind "More" is a product nobody finds. The five are the two practices
 * people open daily, the hub, the charts page and the settings page; Walk, Sleep, Water and
 * Japa are pushed screens listed on Today, so nothing is more than one tap away.
 */
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "@/lib/theme";

export default function WellnessLayout() {
  const { brand } = useTheme();

  return (
    <NativeTabs tintColor={brand.secondary}>
      <NativeTabs.Trigger name="habits">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sun.max" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="breathe">
        <NativeTabs.Trigger.Label>Breathe</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wind" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stretch">
        <NativeTabs.Trigger.Label>Stretch</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.flexibility" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" />
      </NativeTabs.Trigger>
      {/* Walk, Sleep, Water and Japa have no tab on purpose: iOS 26 shows five and buries
          the rest behind "More", and a product behind "More" is a product nobody finds.
          Today lists all six, so nothing is more than one tap away. */}
    </NativeTabs>
  );
}
