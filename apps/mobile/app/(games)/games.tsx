/**
 * Games & Arcade Hub — Quick Launcher for all built games.
 *
 * Route: /games or / (in game builds)
 */
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { alpha, space } from "@brandcollabs/tokens";
import { useTheme } from "@/lib/theme";
import { AdBanner } from "@/components/ad-slot";

type GameItem = {
  route: string;
  name: string;
  genre: string;
  icon: string;
  tag: string;
  color: string;
};

const GAMES: GameItem[] = [
  {
    route: "/sudoku",
    name: "Sudoku Daily",
    genre: "Classic 9x9 Logic Puzzle",
    icon: "🧩",
    tag: "NEW",
    color: "#2563eb",
  },
  {
    route: "/math-sprint",
    name: "Math Sprint",
    genre: "30s Mental Arithmetic Drills",
    icon: "⚡",
    tag: "NEW",
    color: "#7c3aed",
  },
  {
    route: "/crossword",
    name: "Daily Mini",
    genre: "5x5 Clue Crossword Grid",
    icon: "📰",
    tag: "NEW",
    color: "#059669",
  },
  {
    route: "/sounds",
    name: "Ambient Sounds",
    genre: "White Noise, Rain & Sleep Mixer",
    icon: "🎧",
    tag: "NEW",
    color: "#0891b2",
  },
  {
    route: "/merge-tiles",
    name: "Merge 2048",
    genre: "Sliding Number Tile Puzzle",
    icon: "🔢",
    tag: "POPULAR",
    color: "#ea580c",
  },
  {
    route: "/block-clear",
    name: "Block Clear",
    genre: "Shape Fitting & Line Clearing",
    icon: "🧱",
    tag: "RELAXING",
    color: "#0d9488",
  },
  {
    route: "/tap-sprint",
    name: "Tap Sprint",
    genre: "Reflex & Reaction Speed Test",
    icon: "🏃",
    tag: "ACTION",
    color: "#db2777",
  },
  {
    route: "/word-duel",
    name: "Word Duel",
    genre: "60-Second Word Making Puzzle",
    icon: "🔤",
    tag: "BRAIN",
    color: "#4f46e5",
  },
];

export default function GamesHubScreen() {
  const { c, brand } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function launchGame(route: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  }

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: c.canvas,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* ── Top Header ── */}
      <View style={s.header}>
        <Text style={[s.title, { color: c.ink }]}>Games & Arcade</Text>
        <Text style={[s.subtitle, { color: c.ink2 }]}>
          Select any game to launch and play
        </Text>
      </View>

      {/* ── Games List ── */}
      <ScrollView
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      >
        {GAMES.map((game) => (
          <Pressable
            key={game.route}
            onPress={() => launchGame(game.route)}
            style={({ pressed }) => [
              s.card,
              {
                backgroundColor: c.surfaceRaised,
                borderColor: c.hairline,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[s.iconBox, { backgroundColor: alpha(game.color, 0.12) }]}>
              <Text style={s.iconText}>{game.icon}</Text>
            </View>

            <View style={s.textBox}>
              <View style={s.titleRow}>
                <Text style={[s.gameName, { color: c.ink }]}>{game.name}</Text>
                <View style={[s.tagBadge, { backgroundColor: alpha(game.color, 0.15) }]}>
                  <Text style={[s.tagText, { color: game.color }]}>{game.tag}</Text>
                </View>
              </View>
              <Text style={[s.gameGenre, { color: c.ink2 }]}>{game.genre}</Text>
            </View>

            <Text style={[s.arrow, { color: c.ink3 }]}>›</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Bottom AdBanner ── */}
      <View style={s.adContainer}>
        <AdBanner accent={brand.primary} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 26,
  },
  textBox: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gameName: {
    fontSize: 17,
    fontWeight: "700",
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
  },
  gameGenre: {
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    fontWeight: "300",
    marginLeft: 8,
  },
  adContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingBottom: space.xs,
  },
});
