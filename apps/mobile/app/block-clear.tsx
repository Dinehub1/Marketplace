/**
 * Block Clear — an eight-by-eight block puzzle and the first screen of its own
 * build target (see apps/mobile/targets.mjs: id "block-clear", accent #0d9488,
 * rewarded ad = a fresh tray).
 *
 * The job is the whole game: three pieces at a time land in the tray, and each one
 * has to go somewhere on the board. Complete a row or a column and it clears. The
 * round ends when none of the three pieces fits anywhere — so the board is always
 * a record of your own decisions, never a timer's.
 *
 * Two design choices are deliberate and worth stating, because both differ from the
 * other two games in this fleet:
 *
 *   - **There is no clock.** Tap Sprint and Word Duel are both measured in seconds;
 *     this one can be put down mid-round and picked up again, which is why it is
 *     also the only game here with no way to lose by hesitating.
 *   - **Piece, then square — never drag.** Placing a piece is two taps: tap a piece
 *     to pick it up, tap a square to put it down. Every legal square is outlined
 *     while a piece is held, so the board answers "where can this go?" before the
 *     player has to guess. Drag would hide that answer behind a gesture, and a
 *     tap is the one interaction that a screenshot harness can also press.
 *
 * The accent is the game's own colour from the store-listing target, not the tenant
 * brand ramp: a game screen has to look like the game someone installed, not like
 * the directory behind it. Everything else (type scale, spacing, dark mode,
 * elevation) comes from the shared design system.
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { alpha, radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { Badge, Card, Press, Text } from "@/components/ui";
import { AdSlot } from "@/components/ad-slot";
import { Icon } from "@/components/icons";
import {
  EMPTY_RECORD,
  loadGameScores,
  recordRound,
  sinceLabel,
  type GameRecord,
} from "@/lib/game-scores";
import {
  anchors,
  at,
  clearLines,
  drawTray,
  EMPTY_BOARD,
  fits,
  freshTray,
  hasAnyMove,
  N,
  place,
  POINTS_PER_BLOCK,
  POINTS_PER_LINE,
  scoreFor,
  type Board,
  type Shape,
  type Tray,
} from "@/lib/block-clear";

/** targets.mjs colour for this build target, plus a lighter step that survives the
 *  near-black canvas (the deep teal goes muddy on it). */
const ACCENT = { light: "#0d9488", dark: "#2dd4bf" };

/** Key this game's round records live under in the device score store. */
const GAME = "block-clear";

/** Board geometry, in points. The board and the tray are sized from the window
 *  rather than from onLayout: the cell labels and the placement maths have to agree
 *  on the first frame, and a measured board is one frame late for that. */
const GAP = 4;
/** Tray pieces are drawn at their own scale so a 5-long piece still fits a third of
 *  the board's width. */
const MINI = 12;
const MINI_GAP = 2;

type Phase = "ready" | "playing" | "stuck" | "over";

type Summary = {
  score: number;
  lines: number;
  placed: number;
  bestCombo: number;
  /** Set from the stored record, the only thing that knows if this round won. */
  isNewBest: boolean;
};

export default function BlockClear() {
  const { c, scheme, elevation } = useTheme();
  const accent = scheme === "dark" ? ACCENT.dark : ACCENT.light;
  const accentTint = alpha(accent, scheme === "dark" ? 0.16 : 0.09);
  const accentEdge = alpha(accent, scheme === "dark" ? 0.42 : 0.3);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const win = useWindowDimensions();

  const boardPx = Math.min(win.width - space.base * 2, 360);
  const cell = Math.floor((boardPx - GAP * (N + 1)) / N);
  const boardWidth = cell * N + GAP * (N + 1);

  const [phase, setPhase] = useState<Phase>("ready");
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [tray, setTray] = useState<Tray>([null, null, null]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  /** Consecutive placements that cleared something. Resets to 0 on a placement
   *  that clears nothing, which is what makes a combo a streak rather than a
   *  running total. */
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [placed, setPlaced] = useState(0);
  const [notice, setNotice] = useState("");
  /** One rewarded tray per round, so the ad is an offer and not a shortcut. */
  const [rewardUsed, setRewardUsed] = useState(false);
  const [record, setRecord] = useState<GameRecord>(EMPTY_RECORD);
  /** False until the device store has answered, so the screen never claims "no
   *  rounds recorded" while it is still reading them. */
  const [recordRead, setRecordRead] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  // The device record is read once, on mount. It is what "Best score" means on
  // this screen: a number that survives closing the app, not one that restarts
  // with it.
  useEffect(() => {
    let live = true;
    loadGameScores()
      .then((scores) => {
        if (live) setRecord(scores[GAME] ?? EMPTY_RECORD);
      })
      .finally(() => {
        if (live) setRecordRead(true);
      });
    return () => {
      live = false;
    };
  }, []);

  /** Where the held piece would fit. Recomputed only when the piece, the tray or
   *  the board actually change — not on every notice or score tick. */
  const anchorSet = useMemo(() => {
    if (selected === null) return new Set<number>();
    const sh = tray[selected];
    return new Set(sh ? anchors(board, sh) : []);
  }, [selected, tray, board]);

  function selectPiece(i: number) {
    if (phase !== "playing" || !tray[i]) return;
    setSelected((cur) => (cur === i ? null : i));
    setNotice("");
  }

  function onCellPress(index: number) {
    if (phase !== "playing" || selected === null) return;
    const sh = tray[selected];
    if (!sh) return;
    const r = Math.floor(index / N);
    const c = index % N;
    if (!fits(board, sh, r, c)) {
      setNotice("That piece does not fit there — the outlined squares are the ones it does.");
      return;
    }

    const withPiece = place(board, sh, r, c);
    const cleared = clearLines(withPiece);
    // The multiplier is the streak *after* this placement: the first clearing move
    // scores 1×, and each consecutive one after it adds another step.
    const nextCombo = cleared.lines > 0 ? combo + 1 : 0;
    const gained = scoreFor(sh, cleared.lines, nextCombo);

    const afterPiece = tray.map((p, i) => (i === selected ? null : p));
    const empty = afterPiece.every((p) => p === null);
    const nextTray = empty ? drawTray() : afterPiece;

    setBoard(cleared.board);
    setTray(nextTray);
    setSelected(null);
    setScore((s) => s + gained);
    setLines((l) => l + cleared.lines);
    setCombo(nextCombo);
    setBestCombo((b) => Math.max(b, nextCombo));
    setPlaced((p) => p + sh.size);
    setNotice(
      cleared.lines > 0
        ? `${cleared.lines} ${cleared.lines === 1 ? "line" : "lines"} cleared · +${gained}` +
            (nextCombo > 1 ? ` (combo ×${nextCombo})` : "")
        : `+${gained} · no line this time`,
    );

    if (!hasAnyMove(cleared.board, nextTray)) setPhase("stuck");
  }

  /**
   * Ends the round and writes the record. Called from the stuck screen — the only
   * way a round finishes, because nothing here runs out of time.
   *
   * It reads the score from state rather than from the placement that got here:
   * this runs in its own event, after every `set…` above has committed, which is
   * exactly why it is not called from inside `onCellPress` where those values are
   * still pending.
   */
  function finishRound() {
    setPhase("over");
    setSummary({ score, lines, placed, bestCombo, isNewBest: false });
    const line = lines
      ? `${lines} ${lines === 1 ? "line" : "lines"} · best combo ${bestCombo} · ${placed} blocks`
      : `${placed} blocks placed, no lines`;
    recordRound(GAME, score, line).then(({ record: next, isNewBest }) => {
      setRecord(next);
      setSummary((prev) => (prev ? { ...prev, isNewBest } : prev));
    });
  }

  function takeFreshTray() {
    setRewardUsed(true);
    const next = freshTray(board);
    setTray(next);
    setSelected(null);
    if (!hasAnyMove(board, next)) {
      // The reward could not be honoured (a full board). Said plainly rather than
      // handing back an unplayable tray and letting the player discover it.
      setNotice("No piece fits this board — the round is over.");
      finishRound();
      return;
    }
    setNotice("Fresh pieces — the outlined squares are where they fit.");
    setPhase("playing");
  }

  function startRound() {
    setBoard(EMPTY_BOARD);
    setTray(drawTray());
    setSelected(null);
    setScore(0);
    setLines(0);
    setCombo(0);
    setBestCombo(0);
    setPlaced(0);
    setNotice("");
    setRewardUsed(false);
    setSummary(null);
    setPhase("playing");
  }

  const playing = phase === "playing" || phase === "stuck";

  return (
    <View style={[s.root, { backgroundColor: c.canvas, paddingTop: insets.top + space.sm }]}>
      <View style={s.column}>
        {router.canGoBack() ? (
          <Press
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={s.back}
          >
            <Icon name="back" size={22} color={c.ink} strokeWidth={2} />
          </Press>
        ) : null}

        {phase === "ready" ? (
          <View style={{ gap: space.base }}>
            <View style={s.badgeRow}>
              <Text variant="caption" tone="ink3">
                Eight by eight · no clock
              </Text>
              <View style={[s.chip, { backgroundColor: accentTint, borderColor: accentEdge }]}>
                <Text variant="caption" style={{ color: accent }}>
                  Free
                </Text>
              </View>
            </View>

            <Text variant="hero">Fit the blocks, clear the lines</Text>
            <Text variant="lede" tone="ink2">
              Three pieces land in the tray. Tap one, then tap the board to drop it in.
              Fill a whole row or column and it clears. When none of the three fits
              anywhere, the round is over — no timer, so the board is entirely your own
              doing.
            </Text>

            <View style={s.steps}>
              {[
                "Tap a piece in the tray to pick it up",
                "Every square it fits is outlined — tap one to place it",
                "Fill a row or a column to clear it; chain clears for a combo",
              ].map((step, i) => (
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

            <Card style={{ padding: space.base, gap: space.sm }}>
              <Text variant="title3">Scoring</Text>
              <Row label="Each block placed" value={`${POINTS_PER_BLOCK} point`} />
              <Row
                label="Each line cleared"
                value={`${POINTS_PER_LINE} points × the combo`}
              />
              <Row label="A combo" value="Each clear straight after another one" />
              <Row label="A broken combo" value="Back to ×1 on the next clear" />
              <Row
                label="No moves left"
                value={rewardUsed ? "End the round" : "One rewarded tray, then the round ends"}
              />
            </Card>

            <Press
              accessibilityRole="button"
              accessibilityLabel="Start the round"
              haptic="medium"
              onPress={startRound}
              style={[
                s.primary,
                elevation(2),
                { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
              ]}
            >
              <Text variant="title3" style={s.primaryLabel}>
                Start the round
              </Text>
            </Press>

            <Text variant="meta" tone="ink3" style={s.centre}>
              {!recordRead
                ? "Reading this device's scores…"
                : record.rounds
                  ? `Best score on this device: ${record.best} · ${record.rounds} ${
                      record.rounds === 1 ? "round" : "rounds"
                    } played`
                  : "No rounds recorded on this device yet"}
            </Text>
          </View>
        ) : null}

        {playing ? (
          <View style={{ gap: space.md }}>
            <View style={s.hud}>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Score
                </Text>
                <Text variant="title1">{score}</Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Lines
                </Text>
                <Text variant="title1">{lines}</Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Combo
                </Text>
                <Text variant="title1" style={{ color: combo > 1 ? accent : c.ink }}>
                  ×{Math.max(1, combo)}
                </Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Best
                </Text>
                <Text variant="title1" tone="ink3">
                  {recordRead ? record.best : "—"}
                </Text>
              </View>
            </View>

            <View style={s.noticeRow}>
              <Text variant="meta" tone="ink2" style={s.noticeText}>
                {notice}
              </Text>
            </View>

            <View
              style={[
                s.board,
                {
                  width: boardWidth,
                  padding: GAP,
                  gap: GAP,
                  backgroundColor: c.surfaceSunken,
                  borderColor: c.hairline,
                },
              ]}
            >
              {Array.from({ length: N }).map((_, r) => (
                <View key={r} style={{ flexDirection: "row", gap: GAP }}>
                  {Array.from({ length: N }).map((_, cIdx) => {
                    const index = at(r, cIdx);
                    const filled = board[index];
                    const canPlace = !filled && anchorSet.has(index);
                    return (
                      <Pressable
                        key={cIdx}
                        accessibilityRole="button"
                        accessibilityLabel={
                          `Row ${r + 1} column ${cIdx + 1}: ` +
                          (filled ? "filled" : canPlace ? "empty, piece fits" : "empty")
                        }
                        accessibilityState={{ disabled: phase !== "playing" }}
                        disabled={phase !== "playing"}
                        onPress={() => onCellPress(index)}
                        style={({ pressed }) => [
                          s.cell,
                          {
                            width: cell,
                            height: cell,
                            backgroundColor: filled ? accent : canPlace ? accentTint : c.surfaceInset,
                            borderColor: canPlace ? accent : "transparent",
                            borderWidth: canPlace ? 1.5 : 0,
                            opacity: pressed && !filled ? 0.7 : 1,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={s.tray}>
              {tray.map((sh, i) => {
                const isSelected = selected === i;
                return (
                  <Press
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={`Piece ${i + 1}: ${
                      sh ? `${sh.size} ${sh.size === 1 ? "block" : "blocks"}` : "used"
                    }${isSelected ? ", selected" : ""}`}
                    accessibilityState={{ selected: isSelected, disabled: !sh || phase !== "playing" }}
                    disabled={!sh || phase !== "playing"}
                    haptic="light"
                    onPress={() => selectPiece(i)}
                    style={[
                      s.slot,
                      {
                        width: (boardWidth - GAP * 2) / 3,
                        backgroundColor: isSelected ? accentTint : c.surfaceRaised,
                        borderColor: isSelected ? accent : c.hairline,
                        borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                        opacity: sh ? 1 : 0.35,
                      },
                    ]}
                  >
                    {sh ? <PiecePreview shape={sh} color={accent} /> : (
                      <Text variant="caption" tone="ink3">
                        Used
                      </Text>
                    )}
                  </Press>
                );
              })}
            </View>

            <Text variant="meta" tone="ink3" style={s.centre}>
              {selected === null
                ? "Tap a piece to see where it fits."
                : "Outlined squares are where this piece goes."}
            </Text>

            {phase === "stuck" ? (
              <View style={{ gap: space.md }}>
                <Text variant="title2">No moves left</Text>
                <Text variant="body" tone="ink2">
                  None of the three pieces fits this board. Score {score}, {lines}{" "}
                  {lines === 1 ? "line" : "lines"}, best combo {bestCombo}.
                </Text>
                {rewardUsed ? (
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel="End the round"
                    haptic="medium"
                    onPress={finishRound}
                    style={[
                      s.primary,
                      elevation(2),
                      { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
                    ]}
                  >
                    <Text variant="title3" style={s.primaryLabel}>
                      End the round
                    </Text>
                  </Press>
                ) : (
                  <AdSlot
                    accent={accent}
                    title="Rewarded ad — a fresh tray"
                    reward="Three new pieces that fit somewhere on this board, once per round."
                    cta="Watch ad for a fresh tray"
                    onReward={takeFreshTray}
                    onDismiss={finishRound}
                    dismissLabel="End the round"
                  />
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === "over" ? (
          <View style={{ gap: space.base }}>
            <View style={s.head}>
              <Text variant="hero">No moves left.</Text>
              {summary?.isNewBest ? <Badge tone="positive" label="New best" /> : null}
            </View>

            {summary ? (
              <Card style={{ padding: space.base, gap: space.sm }}>
                <Row label="Score" value={String(summary.score)} />
                <Row label="Lines cleared" value={String(summary.lines)} />
                <Row label="Blocks placed" value={String(summary.placed)} />
                <Row label="Best combo" value={`×${summary.bestCombo}`} />
                <Row label="Best score on this device" value={String(record.best)} />
                <Row label="Rounds played on this device" value={String(record.rounds)} />
              </Card>
            ) : null}

            {record.recent.length > 0 ? (
              <Card style={{ padding: space.base, gap: space.md }}>
                <Text variant="title3">
                  {record.recent.length === 1
                    ? "Your last round"
                    : `Your last ${record.recent.length} rounds`}
                </Text>
                {record.recent.map((r, i) => (
                  <View key={`${r.at}-${i}`} style={{ gap: 2 }}>
                    <View style={s.row}>
                      <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                        {r.line || "round recorded"}
                      </Text>
                      <Text variant="meta" style={{ color: c.ink }}>
                        {r.score}
                      </Text>
                    </View>
                    <Text variant="caption" tone="ink3">
                      {sinceLabel(r.at)}
                    </Text>
                  </View>
                ))}
                <Text variant="caption" tone="ink3">
                  Kept on this device, newest first — closing the app does not clear them.
                </Text>
              </Card>
            ) : null}

            <Press
              accessibilityRole="button"
              accessibilityLabel="Play again"
              haptic="medium"
              onPress={startRound}
              style={[
                s.primary,
                elevation(2),
                { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
              ]}
            >
              <Text variant="title3" style={s.primaryLabel}>
                Play again
              </Text>
            </Press>

            <Press
              accessibilityRole="link"
              accessibilityLabel="Passport photo maker, forty-nine rupees"
              onPress={() => router.push("/passport")}
              style={[s.cross, { borderColor: c.hairline }]}
            >
              <Text variant="meta" tone="ink2">
                Also in this app: a print-ready passport photo sheet for ₹49
              </Text>
            </Press>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/** A piece drawn at tray scale. Same cells, same relative shape as the board —
 *  the tray is a preview of the board, not an icon of it. */
function PiecePreview({ shape, color }: { shape: Shape; color: string }) {
  return (
    <View style={{ gap: MINI_GAP }}>
      {Array.from({ length: shape.h }).map((_, r) => (
        <View key={r} style={{ flexDirection: "row", gap: MINI_GAP }}>
          {Array.from({ length: shape.w }).map((_, c) => {
            const on = shape.cells.some(([dr, dc]) => dr === r && dc === c);
            return (
              <View
                key={c}
                style={{
                  width: MINI,
                  height: MINI,
                  borderRadius: 3,
                  backgroundColor: on ? color : "transparent",
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={s.row}>
      <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="meta" style={{ color: c.ink }}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.base },
  column: { width: "100%", maxWidth: 520, alignSelf: "center", gap: space.base },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -space.sm },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  head: { flexDirection: "row", alignItems: "center", gap: space.md, flexWrap: "wrap" },
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
  primary: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { color: "#fff" },
  centre: { textAlign: "center" },
  hud: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  hudCell: { gap: 2 },
  noticeRow: { minHeight: 20, justifyContent: "center" },
  noticeText: { flexShrink: 1 },
  board: {
    alignSelf: "center",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cell: { borderRadius: 4 },
  tray: { flexDirection: "row", alignSelf: "center", gap: GAP },
  slot: {
    height: 68,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  cross: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    alignItems: "center",
  },
});
