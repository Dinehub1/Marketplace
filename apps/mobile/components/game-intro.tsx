import { StyleSheet, View } from "react-native";

import { Card, Press, Text } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { space, radius } from "@brandcollabs/tokens";

/**
 * The screen a game opens on: eyebrow, title, lede, numbered rules, an optional
 * scoring card, the start button, and one line about the stored record.
 *
 * Why this exists: `tap-sprint`, `word-duel` and `block-clear` each spelled this
 * section out in full, and the three were not merely similar — 17 of their 21 shared
 * style keys were byte-identical, and the markup is the same element for element with
 * different words in it. Only the copy, the accent and the scoring rows ever differed.
 *
 * What is deliberately *not* here: the HUD, the progress bar and the game-over card.
 * Those three games diverge there for real reasons (tap-sprint's round is a clock,
 * block-clear's is move-counted; game-over is a full page in one and a board overlay in
 * another). Folding them in would mean inventing props to express differences that are
 * genuine, so this covers the part that is actually the same and stops.
 *
 * `recordLine` is passed in rather than derived: the wording of "no rounds recorded" is
 * game copy, and `tap-sprint` says it differently from `word-duel`. The caller owns it.
 */
export type GameIntroProps = {
  /** Small uppercase label above the title, e.g. "THIRTY-SECOND ROUND". */
  eyebrow: string;
  title: string;
  /** One short paragraph under the title. */
  lede?: string;
  /** The numbered rules. Each string becomes one step. */
  steps: string[];
  /** Optional "Scoring" card. Omitted entirely (not rendered empty) when absent. */
  scoring?: { title?: string; rows: { label: string; value: string }[] };
  /** Accent for the primary button, the chip and the step dots. */
  accent: string;
  accentTint: string;
  accentEdge: string;
  /** Defaults to "Free" — every game in the suite is. */
  chip?: string;
  onStart: () => void;
  startLabel?: string;
  /** The record line under the button. Pass the caller's own three-state wording. */
  recordLine: string;
  /**
   * Gap between the sections. The three screens disagreed here — `tap-sprint` used
   * `space.base`, the other two `space.md` — so it is a prop rather than a shared
   * value. Defaults to `space.md`; `tap-sprint` passes `space.base` to keep the
   * spacing it shipped with.
   */
  gap?: number;
};

export function GameIntro({
  eyebrow,
  title,
  lede,
  steps,
  scoring,
  accent,
  accentTint,
  accentEdge,
  chip = "Free",
  onStart,
  startLabel = "Start the round",
  recordLine,
  gap = space.md,
}: GameIntroProps) {
  const { c, elevation } = useTheme();

  return (
    <View style={{ gap }}>
      <View style={s.badgeRow}>
        <Text variant="caption" tone="ink3">
          {eyebrow}
        </Text>
        <View style={[s.chip, { backgroundColor: accentTint, borderColor: accentEdge }]}>
          <Text variant="caption" style={{ color: accent }}>
            {chip}
          </Text>
        </View>
      </View>

      <Text variant="hero">{title}</Text>
      {lede ? (
        <Text variant="lede" tone="ink2">
          {lede}
        </Text>
      ) : null}

      <View style={s.steps}>
        {steps.map((step, i) => (
          <View key={step} style={s.step}>
            <View style={[s.stepDot, { backgroundColor: accentTint }]}>
              <Text variant="caption" style={{ color: accent }}>
                {i + 1}
              </Text>
            </View>
            <Text variant="meta" tone="ink2" style={s.stepText}>
              {step}
            </Text>
          </View>
        ))}
      </View>

      {scoring && scoring.rows.length ? (
        <Card style={{ padding: space.base, gap: space.sm }}>
          <Text variant="title3">{scoring.title ?? "Scoring"}</Text>
          {scoring.rows.map((row) => (
            <View key={row.label} style={s.row}>
              <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                {row.label}
              </Text>
              <Text variant="meta" style={{ color: c.ink }}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Press
        accessibilityRole="button"
        accessibilityLabel={startLabel}
        haptic="medium"
        onPress={onStart}
        style={[
          s.primary,
          elevation(2),
          { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
        ]}
      >
        <Text variant="title3" style={s.primaryLabel}>
          {startLabel}
        </Text>
      </Press>

      <Text variant="meta" tone="ink3" style={s.centre}>
        {recordLine}
      </Text>
    </View>
  );
}

/**
 * Exactly the keys the three screens agreed on, copied value for value. `column`,
 * `back` and `noticeRow` differed between them and are deliberately absent — a shared
 * component cannot carry a value its callers disagree about, and quietly picking one
 * would change how two of the three games look. (`tap-sprint` centres a max-width
 * column and lays its notice row out with `space-between`; `word-duel` does neither.)
 */
const s = StyleSheet.create({
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  steps: { gap: space.sm },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepText: { flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  primary: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { color: "#fff" },
  centre: { textAlign: "center" },
});
