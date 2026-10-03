/**
 * Math Sprint — 30-second rapid mental arithmetic speed game.
 *
 * Implements:
 * - 30-second rapid timer with combo streak bonuses.
 * - Dynamic problem generation from lib/math-sprint.ts.
 * - Rewarded Ad integration: "+30 Seconds / Second Chance".
 * - Score storage via lib/game-scores.ts.
 * - AdBanner at the bottom.
 */
import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { alpha, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { AdBanner } from "@/components/ad-slot";
import { loadGameScores, recordRound, type GameRecord } from "@/lib/game-scores";
import {
  startSprint,
  submitAnswer,
  type SprintState,
} from "@/lib/math-sprint";

export default function MathSprintScreen() {
  const { c, brand } = useTheme();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<SprintState>(startSprint);
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [feedbackColor, setFeedbackColor] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Load high scores
  useEffect(() => {
    loadGameScores().then((scores) => {
      setRecord(scores["math-sprint"] || null);
    });
  }, []);

  // Timer loop
  useEffect(() => {
    if (state.phase !== "playing") return;

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft <= 1) {
          clearInterval(interval);
          return { ...prev, timeLeft: 0, phase: "over" };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Round over: write score
  useEffect(() => {
    if (state.phase === "over") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      recordRound(
        "math-sprint",
        state.score,
        `${state.solved} problems • Best streak ${state.bestStreak}`
      ).then((res) => setRecord(res.record));
    }
  }, [state.phase, state.score, state.solved, state.bestStreak]);

  function handleChoice(idx: number) {
    if (state.phase !== "playing") return;

    const { nextState, isCorrect } = submitAnswer(state, idx);

    if (isCorrect) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFeedbackColor("#22c55e");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedbackColor("#ef4444");
    }

    setTimeout(() => setFeedbackColor(null), 250);
    setState(nextState);
  }

  function handleRestart() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRewardClaimed(false);
    setState(startSprint());
  }

  function handleRewardedRevive() {
    // Rewarded Ad unlock: adds 30 seconds
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRewardClaimed(true);
    setState((prev) => ({
      ...prev,
      timeLeft: 30,
      phase: "playing",
    }));
  }

  const multiplier = Math.min(5, 1 + Math.floor(state.streak / 3));

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
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: c.ink }]}>Math Sprint</Text>
          <Text style={[s.subtitle, { color: c.ink2 }]}>
            Best: {record?.best || 0} pts
          </Text>
        </View>

        <View style={s.statsGroup}>
          <View style={[s.statBadge, { backgroundColor: c.surfaceRaised }]}>
            <Text style={[s.statNum, { color: brand.primary }]}>{state.score}</Text>
            <Text style={[s.statLabel, { color: c.ink2 }]}>PTS</Text>
          </View>

          <View
            style={[
              s.statBadge,
              {
                backgroundColor: state.timeLeft <= 5 ? "#ef4444" : brand.primary,
              },
            ]}
          >
            <Text style={[s.statNum, { color: "#ffffff" }]}>{state.timeLeft}s</Text>
            <Text style={[s.statLabel, { color: "#ffffff" }]}>TIME</Text>
          </View>
        </View>
      </View>

      {/* ── Streak Multiplier ── */}
      <View style={s.streakRow}>
        {state.streak > 0 && (
          <View
            style={[
              s.streakBadge,
              { backgroundColor: alpha(brand.primary, 0.15) },
            ]}
          >
            <Text style={[s.streakText, { color: brand.primary }]}>
              🔥 {state.streak} IN A ROW ({multiplier}x MULTIPLIER)
            </Text>
          </View>
        )}
      </View>

      {/* ── Main Arena ── */}
      {state.phase === "playing" ? (
        <View style={s.playArea}>
          <View
            style={[
              s.card,
              {
                backgroundColor: feedbackColor || c.surfaceRaised,
                borderColor: c.hairline,
              },
            ]}
          >
            <Text style={[s.questionText, { color: feedbackColor ? "#ffffff" : c.ink }]}>
              {state.currentProblem.question}
            </Text>
          </View>

          {/* ── 2x2 Options Grid ── */}
          <View style={s.optionsContainer}>
            <View style={s.optionsRow}>
              {[0, 1].map((idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleChoice(idx)}
                  style={[s.optionBtn, { backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}
                >
                  <Text style={[s.optionText, { color: c.ink }]}>{state.currentProblem.options[idx]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.optionsRow}>
              {[2, 3].map((idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleChoice(idx)}
                  style={[s.optionBtn, { backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}
                >
                  <Text style={[s.optionText, { color: c.ink }]}>{state.currentProblem.options[idx]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : (
        /* ── Round Over ── */
        <View style={s.gameOverArea}>
          <Text style={[s.overTitle, { color: c.ink }]}>Sprint Complete!</Text>
          <Text style={[s.overScore, { color: brand.primary }]}>
            {state.score} PTS
          </Text>
          <Text style={[s.overDetails, { color: c.ink2 }]}>
            {state.solved} solved • Max streak: {state.bestStreak}
          </Text>

          <View style={s.actionRow}>
            {!rewardClaimed && (
              <Pressable
                onPress={handleRewardedRevive}
                style={[
                  s.rewardBtn,
                  { backgroundColor: alpha(brand.primary, 0.15), borderColor: brand.primary },
                ]}
              >
                <Text style={[s.rewardBtnText, { color: brand.primary }]}>
                  🎁 +30s Extra Time (Rewarded Ad)
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleRestart}
              style={[s.restartBtn, { backgroundColor: brand.primary }]}
            >
              <Text style={s.restartBtnText}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── AdBanner Slot ── */}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsGroup: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 58,
  },
  statNum: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  streakRow: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  playArea: {
    paddingHorizontal: space.md,
    alignItems: "center",
  },
  card: {
    width: "100%",
    paddingVertical: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.lg,
  },
  questionText: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  optionsContainer: {
    width: "100%",
    gap: space.md,
  },
  optionsRow: {
    flexDirection: "row",
    gap: space.md,
    width: "100%",
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 22,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 26,
    fontWeight: "700",
  },
  gameOverArea: {
    alignItems: "center",
    paddingHorizontal: space.md,
  },
  overTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  overScore: {
    fontSize: 48,
    fontWeight: "900",
    marginVertical: 8,
  },
  overDetails: {
    fontSize: 15,
    marginBottom: space.lg,
  },
  actionRow: {
    width: "100%",
    gap: space.sm,
  },
  rewardBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  rewardBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  restartBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  restartBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  adContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingBottom: space.xs,
  },
});
