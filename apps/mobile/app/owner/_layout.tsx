import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function OwnerLayout() {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.canvas },
        animation: "slide_from_right",
      }}
    />
  );
}
