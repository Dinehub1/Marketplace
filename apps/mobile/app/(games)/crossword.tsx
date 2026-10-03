/**
 * Daily Mini Crossword — 5x5 interactive clue puzzle.
 *
 * Implements:
 * - 5x5 crossword grid that sizes itself to the space actually left on screen
 *   (measured with onLayout), so header, clue bar, keyboard and banner always fit.
 * - Interactive clue navigation (◀ / ▶ arrows), tap a cell to select, tap again
 *   (or the clue badge) to flip Across <-> Down.
 * - "Clues" list to jump to any clue directly.
 * - Check (flags wrong letters in red) and Hint (reveals & locks a letter).
 * - Typing advances through the word, then jumps to the next unfinished clue.
 * - Tactile on-screen keyboard with uniform key sizes.
 * - AdBanner at the bottom.
 */
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { alpha, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { AdBanner } from "@/components/ad-slot";
import { recordRound } from "@/lib/game-scores";
import {
  initCrossword,
  enterLetter,
  backspace,
  revealCrosswordHint,
  checkPuzzle,
  isCellInActiveClue,
  isGridFull,
  isWrong,
  isRevealed,
  cellNumber,
  activeClueOf,
  selectCell,
  selectClue,
  toggleDirection,
  nextClue,
  prevClue,
  dailyPuzzleIndex,
  clueCells,
  SAMPLE_PUZZLES,
  type CrosswordState,
  type Clue,
  type Direction,
} from "@/lib/crossword";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "⌫"],
];
const KEY_GAP = 5;
const KB_PAD = 6;
const WRONG = "#ef4444";

function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function scoreFor(sec: number, hints: number) {
  return Math.max(100, 1500 - sec * 5 - hints * 100);
}

export default function CrosswordScreen() {
  const { c, brand, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [puzzleIdx, setPuzzleIdx] = useState(() => dailyPuzzleIndex());
  const [state, setState] = useState<CrosswordState>(() =>
    initCrossword(SAMPLE_PUZZLES[dailyPuzzleIndex()])
  );
  const [timerSec, setTimerSec] = useState(0);
  const [hints, setHints] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "clues">("grid");
  const [boardArea, setBoardArea] = useState({ w: 0, h: 0 });
  const [toast, setToast] = useState<{ text: string; tone: "info" | "bad" } | null>(null);

  const isDark = scheme === "dark";
  const compact = height < 720;

  // Grid fills the measured middle area (square), capped for tablets.
  const gridSize = Math.max(
    180,
    Math.floor(Math.min(boardArea.w || width - space.md * 2, boardArea.h || width, 420))
  );
  const cellSize = gridSize / 5;

  // Uniform keys: width from the 10-key row, height scales down on short screens.
  const keyW = Math.floor((width - KB_PAD * 2 - KEY_GAP * 9) / 10);
  const keyH = compact ? 40 : 46;

  // Timer loop
  useEffect(() => {
    if (state.solved) return;
    const interval = setInterval(() => setTimerSec((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [state.solved]);

  // Victory
  useEffect(() => {
    if (state.solved) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      recordRound(
        "crossword",
        scoreFor(timerSec, hints),
        `${state.puzzle.title} solved in ${formatTime(timerSec)}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.solved]);

  // Grid full but wrong → tell the player instead of silently doing nothing.
  const full = isGridFull(state);
  useEffect(() => {
    if (full && !state.solved) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast("Not quite — tap Check to see wrong letters", "bad");
    }
  }, [full, state.solved]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(text: string, tone: "info" | "bad" = "info") {
    setToast({ text, tone });
  }

  function onBoardLayout(e: LayoutChangeEvent) {
    const { width: w, height: h } = e.nativeEvent.layout;
    // Leave a little breathing room around the grid.
    setBoardArea({ w: w - space.md * 2, h: h - space.sm * 2 });
  }

  function handleCellPress(r: number, col: number) {
    if (state.grid[r][col] === "#") return;
    Haptics.selectionAsync();
    setState((prev) => selectCell(prev, r, col));
  }

  function handleKeyPress(k: string) {
    if (state.solved) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState((prev) => (k === "⌫" ? backspace(prev) : enterLetter(prev, k)));
  }

  function handleHint() {
    if (state.solved) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHints((h) => h + 1);
    setState((prev) => revealCrosswordHint(prev));
    setViewMode("grid");
  }

  function handleCheck() {
    if (state.solved) return;
    const { state: next, wrongCount } = checkPuzzle(state);
    setState(next);
    if (wrongCount === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Everything so far is correct ✓");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(`${wrongCount} wrong letter${wrongCount > 1 ? "s" : ""} marked in red`, "bad");
    }
    setViewMode("grid");
  }

  function loadPuzzle(idx: number) {
    setPuzzleIdx(idx);
    setState(initCrossword(SAMPLE_PUZZLES[idx]));
    setTimerSec(0);
    setHints(0);
    setViewMode("grid");
    setToast(null);
  }

  function handleNextPuzzle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadPuzzle((puzzleIdx + 1) % SAMPLE_PUZZLES.length);
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadPuzzle(puzzleIdx);
  }

  const { clue: activeClue, dir: activeDir } = activeClueOf(state);

  function isClueFilled(clue: Clue, dir: Direction) {
    return clueCells(clue, dir).every(([r, col]) => state.grid[r][col] !== "");
  }

  function renderClueList(title: string, list: Clue[], dir: Direction) {
    return (
      <>
        <Text style={[s.clueSectionHeader, { color: brand.primary }]}>{title}</Text>
        {list.map((item) => {
          const isCurrent = activeDir === dir && activeClue.num === item.num;
          const filled = isClueFilled(item, dir);
          return (
            <Pressable
              key={`${dir}-${item.num}`}
              onPress={() => {
                Haptics.selectionAsync();
                setState((prev) => selectClue(prev, item.num, dir));
                setViewMode("grid");
              }}
              style={[
                s.clueListItem,
                {
                  backgroundColor: isCurrent ? alpha(brand.primary, 0.15) : c.surfaceRaised,
                  borderColor: isCurrent ? brand.primary : c.hairline,
                },
              ]}
            >
              <View style={[s.clueListNum, { backgroundColor: brand.primary }]}>
                <Text style={s.clueListNumText}>{item.num}</Text>
              </View>
              <View style={s.clueListTextWrap}>
                <Text style={[s.clueListText, { color: c.ink, opacity: filled ? 0.55 : 1 }]}>
                  {item.clue}
                </Text>
                <Text style={[s.clueLengthText, { color: c.ink2 }]}>
                  {item.answer.length} letters{filled ? "  ✓" : ""}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </>
    );
  }

  return (
    <View
      style={[
        s.container,
        { backgroundColor: c.canvas, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={[s.title, { color: c.ink }]} numberOfLines={1}>
            Daily Mini
          </Text>
          <Text style={[s.subtitle, { color: c.ink2 }]} numberOfLines={1}>
            {state.puzzle.title} • ⏱ {formatTime(timerSec)}
            {hints > 0 ? ` • ${hints} hint${hints > 1 ? "s" : ""}` : ""}
          </Text>
        </View>

        <View style={s.headerActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode((m) => (m === "grid" ? "clues" : "grid"));
            }}
            style={[
              s.actionBtn,
              { backgroundColor: viewMode === "clues" ? brand.primary : alpha(brand.primary, 0.12) },
            ]}
            accessibilityLabel={viewMode === "clues" ? "Show grid" : "Show all clues"}
          >
            <Text
              style={[s.actionBtnText, { color: viewMode === "clues" ? "#ffffff" : brand.primary }]}
            >
              {viewMode === "clues" ? "Grid" : "Clues"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCheck}
            disabled={state.solved}
            style={[s.actionBtn, { backgroundColor: alpha(brand.primary, 0.12) }]}
          >
            <Text style={[s.actionBtnText, { color: brand.primary }]}>Check</Text>
          </Pressable>
          <Pressable
            onPress={handleHint}
            disabled={state.solved}
            style={[s.actionBtn, { backgroundColor: alpha(brand.primary, 0.12) }]}
          >
            <Text style={[s.actionBtnText, { color: brand.primary }]}>Hint 🎁</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Middle: grid (auto-sized) or clue list ── */}
      <View style={s.middle} onLayout={onBoardLayout}>
        {viewMode === "clues" ? (
          <ScrollView style={s.cluesScroll} contentContainerStyle={s.cluesContent}>
            {renderClueList("ACROSS", state.puzzle.across, "across")}
            <View style={{ height: space.sm }} />
            {renderClueList("DOWN", state.puzzle.down, "down")}
          </ScrollView>
        ) : (
          <View style={[s.grid, { width: gridSize, height: gridSize, borderColor: c.ink }]}>
            {state.grid.map((row, r) => (
              <View key={`row-${r}`} style={s.gridRow}>
                {row.map((cell, col) => {
                  const isBlack = cell === "#";
                  const isSelected = state.selectedRow === r && state.selectedCol === col;
                  const inWord = !isBlack && isCellInActiveClue(r, col, activeClue, activeDir);
                  const wrong = isWrong(state, r, col);
                  const revealed = isRevealed(state, r, col);

                  let bg = c.surfaceRaised;
                  let letterColor = c.ink;
                  if (isBlack) {
                    bg = isDark ? "#020617" : "#0f172a";
                  } else if (state.solved) {
                    bg = alpha(brand.primary, 0.14);
                  } else if (isSelected) {
                    bg = isDark ? "#a16207" : "#fde047";
                    letterColor = isDark ? "#ffffff" : "#422006";
                  } else if (inWord) {
                    bg = alpha(brand.primary, isDark ? 0.28 : 0.18);
                  }
                  if (wrong) letterColor = WRONG;
                  else if (revealed && !isSelected) letterColor = brand.primary;

                  const num = isBlack ? undefined : cellNumber(state.puzzle, r, col);

                  return (
                    <Pressable
                      key={`${r}-${col}`}
                      disabled={isBlack}
                      onPress={() => handleCellPress(r, col)}
                      style={[
                        s.cell,
                        {
                          backgroundColor: bg,
                          borderColor: isDark ? "#334155" : "#94a3b8",
                          borderRightWidth: col < 4 ? StyleSheet.hairlineWidth * 2 : 0,
                          borderBottomWidth: r < 4 ? StyleSheet.hairlineWidth * 2 : 0,
                        },
                      ]}
                      accessibilityLabel={
                        isBlack ? "Black square" : `Row ${r + 1} column ${col + 1}${cell ? `, ${cell}` : ", empty"}`
                      }
                    >
                      {num ? (
                        <Text
                          style={[
                            s.clueNum,
                            { fontSize: Math.max(9, cellSize * 0.18), color: isSelected ? letterColor : c.ink2 },
                          ]}
                        >
                          {num}
                        </Text>
                      ) : null}
                      {!isBlack && cell !== "" ? (
                        <Text
                          style={[s.cellLetter, { fontSize: cellSize * 0.5, color: letterColor }]}
                        >
                          {cell}
                        </Text>
                      ) : null}
                      {wrong ? <View style={[s.wrongSlash, { backgroundColor: WRONG }]} /> : null}
                      {revealed ? <View style={[s.revealDot, { backgroundColor: brand.primary }]} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Toast floats over the board so it never shifts the layout */}
        {toast ? (
          <View
            pointerEvents="none"
            style={[
              s.toast,
              { backgroundColor: toast.tone === "bad" ? WRONG : brand.primary },
            ]}
          >
            <Text style={s.toastText}>{toast.text}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Bottom: victory card OR clue bar + keyboard ── */}
      {state.solved ? (
        <View
          style={[s.victoryCard, { backgroundColor: c.surfaceRaised, borderColor: brand.primary }]}
        >
          <Text style={[s.victoryTitle, { color: brand.primary }]}>🎉 Puzzle Solved!</Text>
          <Text style={[s.victorySub, { color: c.ink }]}>
            {formatTime(timerSec)} • {hints} hint{hints === 1 ? "" : "s"} • Score:{" "}
            {scoreFor(timerSec, hints)} pts
          </Text>
          <View style={s.victoryActions}>
            <Pressable
              onPress={handleReset}
              style={[s.victoryBtn, { backgroundColor: alpha(brand.primary, 0.12) }]}
            >
              <Text style={[s.victoryBtnText, { color: brand.primary }]}>Play Again</Text>
            </Pressable>
            <Pressable
              onPress={handleNextPuzzle}
              style={[s.victoryBtn, { backgroundColor: brand.primary }]}
            >
              <Text style={[s.victoryBtnText, { color: "#ffffff" }]}>Next Puzzle →</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          {/* Active clue bar */}
          <View style={[s.clueBar, { backgroundColor: alpha(brand.primary, 0.1) }]}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setState((prev) => prevClue(prev));
              }}
              style={s.clueArrowBtn}
              hitSlop={6}
              accessibilityLabel="Previous clue"
            >
              <Text style={[s.clueArrowText, { color: brand.primary }]}>‹</Text>
            </Pressable>

            <Pressable
              style={s.clueCenter}
              onPress={() => {
                Haptics.selectionAsync();
                setState((prev) => toggleDirection(prev));
              }}
              accessibilityLabel="Switch direction"
            >
              <Text style={[s.clueBadgeText, { color: brand.primary }]}>
                {activeClue.num} {activeDir.toUpperCase()} ⟳
              </Text>
              <Text style={[s.clueText, { color: c.ink }]} numberOfLines={2}>
                {activeClue.clue}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setState((prev) => nextClue(prev));
              }}
              style={s.clueArrowBtn}
              hitSlop={6}
              accessibilityLabel="Next clue"
            >
              <Text style={[s.clueArrowText, { color: brand.primary }]}>›</Text>
            </Pressable>
          </View>

          {/* Keyboard */}
          <View style={s.keyboard}>
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <View key={rIdx} style={s.keyRow}>
                {row.map((k) => {
                  const isBack = k === "⌫";
                  return (
                    <Pressable
                      key={k}
                      onPress={() => handleKeyPress(k)}
                      style={({ pressed }) => [
                        s.keyBtn,
                        {
                          width: isBack ? keyW * 1.6 + KEY_GAP : keyW,
                          height: keyH,
                          backgroundColor: pressed
                            ? alpha(brand.primary, 0.25)
                            : isBack
                            ? alpha(c.ink, 0.12)
                            : c.surfaceRaised,
                          borderColor: c.hairline,
                        },
                      ]}
                      accessibilityLabel={isBack ? "Delete" : k}
                    >
                      <Text
                        style={[
                          s.keyText,
                          { color: isBack ? brand.primary : c.ink, fontSize: keyW < 32 ? 15 : 18 },
                        ]}
                      >
                        {k}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      )}

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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    gap: space.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  middle: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    borderWidth: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  gridRow: {
    flexDirection: "row",
    flex: 1,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clueNum: {
    position: "absolute",
    top: 2,
    left: 4,
    fontWeight: "800",
  },
  cellLetter: {
    fontWeight: "800",
    marginTop: 4,
  },
  wrongSlash: {
    position: "absolute",
    width: "120%",
    height: 2,
    transform: [{ rotate: "-45deg" }],
    opacity: 0.6,
  },
  revealDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toast: {
    position: "absolute",
    bottom: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  clueBar: {
    marginHorizontal: space.sm,
    marginBottom: space.xs,
    minHeight: 58,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  clueArrowBtn: {
    width: 40,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  clueArrowText: {
    fontSize: 30,
    fontWeight: "600",
    marginTop: -4,
  },
  clueCenter: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  clueBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  clueText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  cluesScroll: {
    alignSelf: "stretch",
    marginHorizontal: space.md,
  },
  cluesContent: {
    paddingVertical: space.sm,
    gap: 8,
  },
  clueSectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  clueListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.sm,
    borderRadius: 10,
    borderWidth: 1,
    gap: space.sm,
  },
  clueListNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  clueListNumText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  clueListTextWrap: {
    flex: 1,
  },
  clueListText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clueLengthText: {
    fontSize: 11,
    marginTop: 2,
  },
  keyboard: {
    paddingHorizontal: KB_PAD,
    gap: 7,
    paddingBottom: space.xs,
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: KEY_GAP,
  },
  keyBtn: {
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontWeight: "700",
  },
  adContainer: {
    alignItems: "stretch",
    paddingHorizontal: space.sm,
    paddingTop: space.xs,
  },
  victoryCard: {
    marginHorizontal: space.md,
    marginBottom: space.sm,
    padding: space.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    gap: space.sm,
  },
  victoryTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  victorySub: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  victoryActions: {
    flexDirection: "row",
    gap: space.md,
    marginTop: space.xs,
  },
  victoryBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: 8,
    alignItems: "center",
  },
  victoryBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
