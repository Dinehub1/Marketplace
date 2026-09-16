import type { ColorValue } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

/**
 * Stroked marks that inherit currentColor, not emoji. The emoji set renders as
 * tofu wherever the platform font lacks the glyph, and it carries its own
 * colour, which fights every brand palette.
 */
const PATHS = {
  browse: <><Rect x={3} y={4} width={18} height={16} rx={2} /><Path d="M3 9h18M8 13h9M8 16.5h6" /></>,
  search: <><Circle cx={11} cy={11} r={7} /><Path d="m20 20-3.6-3.6" /></>,
  saved: <Path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" />,
  account: <><Circle cx={12} cy={8} r={4} /><Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>,
  phone: <Path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z" />,
  whatsapp: <Path d="M12 3a9 9 0 0 0-7.7 13.7L3 21l4.5-1.2A9 9 0 1 0 12 3z" />,
  map: <><Path d="m9 4 6 2 5-2v14l-5 2-6-2-5 2V6z" /><Path d="M9 4v14M15 6v14" /></>,
  globe: <><Circle cx={12} cy={12} r={9} /><Path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
  star: <Path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5-4.8-4.6 6.6-.9z" />,
  chevron: <Path d="M9 5l7 7-7 7" />,
  back: <Path d="M15 5l-7 7 7 7" />,
  sun: <><Circle cx={12} cy={12} r={4.2} /><Path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" /></>,
  moon: <Path d="M20 13.5A8.2 8.2 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5z" />,
  system: <><Rect x={2.5} y={4} width={19} height={13} rx={2} /><Path d="M8.5 20.5h7" /></>,
  chart: <Path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  inbox: <><Path d="M3 13h5l2 3h4l2-3h5" /><Path d="M5.5 5h13l2.5 8v5a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-5z" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  filled = false,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  // ColorValue, not string: React Navigation hands a tab bar icon an
  // OpaqueColorValue on native, which is a valid colour and not a string.
  color?: ColorValue;
  filled?: boolean;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </Svg>
  );
}

export function TabIcon({
  name,
  color,
  focused,
}: {
  name: IconName;
  color: ColorValue;
  focused: boolean;
}) {
  // Weight, not colour, carries the selected state — colour alone is not a
  // signal everyone can read.
  return <Icon name={name} color={color} size={23} strokeWidth={focused ? 2.2 : 1.7} />;
}
