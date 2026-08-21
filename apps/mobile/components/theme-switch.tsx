import { View, StyleSheet } from "react-native";
import { radius } from "@hermes/tokens";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { Press, Text } from "./ui";
import { Icon, type IconName } from "./icons";

const OPTIONS: { value: ThemeChoice; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "system", label: "System", icon: "system" },
  { value: "dark", label: "Dark", icon: "moon" },
];

/** Segmented control, three states. "System" is the default and stays
 *  reachable — a binary toggle strands anyone who taps it once. */
export function ThemeSwitch() {
  const { c, choice, setChoice, elevation } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Colour theme"
      style={{
        flexDirection: "row",
        gap: 2,
        padding: 4,
        borderRadius: radius.pill,
        backgroundColor: c.surfaceSunken,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.hairline,
      }}
    >
      {OPTIONS.map((o) => {
        const active = choice === o.value;
        return (
          <Press
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            haptic="light"
            onPress={() => setChoice(o.value)}
            style={[
              {
                flex: 1,
                flexDirection: "row",
                gap: 6,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 9,
                borderRadius: radius.pill,
                backgroundColor: active ? c.surfaceRaised : "transparent",
              },
              active ? elevation(1) : null,
            ]}
          >
            <Icon name={o.icon} size={15} color={active ? c.ink : c.ink3} />
            <Text variant="meta" tone={active ? "ink" : "ink3"} style={{ fontWeight: "600" }}>
              {o.label}
            </Text>
          </Press>
        );
      })}
    </View>
  );
}
