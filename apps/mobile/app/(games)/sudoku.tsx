/**
 * Sudoku Daily — Classic 9x9 logic puzzle screen.
 *
 * Designed to fit any phone screen:
 * - 9x9 board sized from the space actually left (measured with onLayout), so
 *   header, tools, number pad and banner never push it off-screen.
 * - Proper thick 3x3 box lines and thin cell lines.
 * - Same-number & row/col/box highlights for rapid pattern recognition.
 * - Note-taking mode (pencil candidates) with auto-clearing of peer notes.
 * - Number pad shows how many of each digit are left; finished digits dim out.
 * - Rewarded Ad integration: "Hint / Reveal Cell".
 * - AdBanner at the bottom.
 * - High score & solve time tracked in lib/game-scores.ts.
 */
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  Pressable,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { alpha, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { AdBanner } from "@/components/ad-slot";
import { loadGameScores, recordRound, type GameRecord } from "@/lib/game-scores";
import {
  createSudoku,
  setCellValue,
  toggleNote,
  undoMove,
  revealHint,
  digitCounts,
  firstOpenCell,
  rowOf,
  colOf,
  blockOf,
  type Difficulty,
  type SudokuState,
} from "@/lib/sudoku";

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "expert", label: "Expert" },
];
const MAX_MISTAKES = 3;
const WRONG = "#ef4444";

function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function newGame(diff: Difficulty) {
  return createSudoku(diff);
}

export default function SudokuScreen() {
  const { c, brand, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [state, setState] = useState<SudokuState>(() => newGame("easy"));
  const [selected, setSelected] = useState<number | null>(() => firstOpenCell(newGame("easy")));
  const [notesMode, setNotesMode] = useState(false);
  const [timerSec, setTimerSec] = useState(0);
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [boardArea, setBoardArea] = useState({ w: 0, h: 0 });
  const [toast, setToast] = useState<{ text: string; tone: "info" | "bad" } | null>(null);

  const isDark = scheme === "dark";
  const compact = height < 720;
  const failed = state.mistakes >= MAX_MISTAKES && !state.completed;
  const over = state.completed || failed;

  // Board fills the measured middle area (square), capped for tablets.
  const boardSize = Math.max(
    234,
    Math.floor(Math.min(boardArea.w || width - space.md * 2, boardArea.h || width, 460))
  );
  const cellSize = boardSize / 9;
  const counts = digitCounts(state);

  // Timer loop
  useEffect(() => {
    if (over) return;
    const interval = setInterval(() => setTimerSec((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [over]);

  // Load scores
  useEffect(() => {
    loadGameScores().then((scores) => setRecord(scores.sudoku || null));
  }, []);

  // Handle victory
  useEffect(() => {
    if (state.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const score = Math.max(100, 2000 - timerSec * 2 - state.mistakes * 50);
      recordRound("sudoku", score, `${state.difficulty.toUpperCase()} in ${formatTime(timerSec)}`).then(
        (res) => setRecord(res.record)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.completed]);

  useEffect(() => {
    if (failed) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [failed]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(text: string, tone: "info" | "bad" = "info") {
    setToast({ text, tone });
  }

  function onBoardLayout(e: LayoutChangeEvent) {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBoardArea({ w: w - space.md * 2, h: h - space.xs * 2 });
  }

  function handleCellPress(idx: number) {
    Haptics.selectionAsync();
    setSelected(idx);
  }

  function handleNumInput(num: number) {
    if (over) return;
    if (selected === null) {
      showToast("Tap a cell first");
      return;
    }
    if (state.initial[selected] !== 0) {
      showToast("That number is part of the puzzle");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (notesMode) {
      if (state.current[selected] !== 0) {
        showToast("Erase the number to add notes");
        return;
      }
      setState((prev) => toggleNote(prev, selected, num));
      return;
    }

    const { nextState, isCorrect } = setCellValue(state, selected, num);
    if (!isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const left = MAX_MISTAKES - nextState.mistakes;
      showToast(
        left > 0 ? `Not a ${num} — ${left} mistake${left > 1 ? "s" : ""} left` : "Out of mistakes",
        "bad"
      );
    }
    setState(nextState);
  }

  function handleErase() {
    if (selected === null || over) return;
    if (state.initial[selected] !== 0) return;
    Haptics.selectionAsync();
    if (state.current[selected] === 0 && state.notes[selected]?.length) {
      // Clear notes in the cell.
      setState((prev) => {
        const notes = { ...prev.notes };
        delete notes[selected];
        return { ...prev, notes };
      });
      return;
    }
    const { nextState } = setCellValue(state, selected, 0);
    setState(nextState);
  }

  function handleUndo() {
    if (over) return;
    Haptics.selectionAsync();
    setState((prev) => undoMove(prev));
  }

  function handleHint() {
    if (over) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next = revealHint(state, selected ?? undefined);
    const changed = next.history[next.history.length - 1];
    if (changed && next !== state) setSelected(changed.index);
    setState(next);
    showToast("Hint revealed 🎁");
  }

  function handleNewGame(diff: Difficulty) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = newGame(diff);
    setState(next);
    setSelected(firstOpenCell(next));
    setNotesMode(false);
    setTimerSec(0);
    setToast(null);
  }

  const selectedVal = selected !== null ? state.current[selected] : 0;
  const selectedRow = selected !== null ? rowOf(selected) : -1;
  const selectedCol = selected !== null ? colOf(selected) : -1;
  const selectedBlock = selected !== null ? blockOf(selected) : -1;

  const thick = isDark ? "#cbd5e1" : "#1e293b";
  const thin = isDark ? "#334155" : "#cbd5e1";
  const numBtnH = compact ? 50 : 58;

  return (
    <View
      style={[
        s.container,
        { backgroundColor: c.canvas, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: c.ink }]}>Sudoku Daily</Text>
          <Text style={[s.timer, { color: c.ink }]}>⏱ {formatTime(timerSec)}</Text>
        </View>
        <View style={s.statsRow}>
          <Text style={[s.stat, { color: state.mistakes > 0 ? WRONG : c.ink2 }]}>
            Mistakes {state.mistakes}/{MAX_MISTAKES}
          </Text>
          <Text style={[s.stat, { color: c.ink2 }]}>{record ? `Best ${record.best}` : "No best yet"}</Text>
        </View>

        {/* Difficulty segmented control */}
        <View style={[s.segment, { backgroundColor: c.surfaceRaised, borderColor: c.hairline }]}>
          {DIFFICULTIES.map((d) => {
            const active = state.difficulty === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => handleNewGame(d.id)}
                style={[s.segmentBtn, active && { backgroundColor: brand.primary }]}
                accessibilityLabel={`New ${d.label} puzzle`}
              >
                <Text style={[s.segmentText, { color: active ? "#ffffff" : c.ink2 }]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Board (auto-sized) ── */}
      <View style={s.middle} onLayout={onBoardLayout}>
        <View
          style={[
            s.board,
            { width: boardSize, height: boardSize, borderColor: thick, backgroundColor: c.surfaceRaised },
          ]}
        >
          {Array.from({ length: 9 }).map((_, r) => (
            <View key={`row-${r}`} style={s.boardRow}>
              {Array.from({ length: 9 }).map((__, col) => {
                const idx = r * 9 + col;
                const val = state.current[idx];
                const isInitial = state.initial[idx] !== 0;
                const isSelected = selected === idx;
                const isSameNum = val !== 0 && val === selectedVal;
                const isRelated =
                  r === selectedRow || col === selectedCol || blockOf(idx) === selectedBlock;
                const isWrongVal = val !== 0 && val !== state.solution[idx];
                const notes = state.notes[idx] || [];

                let bgColor = "transparent";
                if (isSelected) bgColor = alpha(brand.primary, isDark ? 0.55 : 0.4);
                else if (isWrongVal) bgColor = alpha(WRONG, 0.14);
                else if (isSameNum) bgColor = alpha(brand.primary, isDark ? 0.32 : 0.24);
                else if (isRelated) bgColor = alpha(brand.primary, isDark ? 0.14 : 0.08);

                return (
                  <Pressable
                    key={`cell-${idx}`}
                    onPress={() => handleCellPress(idx)}
                    style={[
                      s.cell,
                      {
                        backgroundColor: bgColor,
                        borderRightWidth: col === 8 ? 0 : col % 3 === 2 ? 2 : StyleSheet.hairlineWidth * 2,
                        borderBottomWidth: r === 8 ? 0 : r % 3 === 2 ? 2 : StyleSheet.hairlineWidth * 2,
                        borderRightColor: col % 3 === 2 ? thick : thin,
                        borderBottomColor: r % 3 === 2 ? thick : thin,
                      },
                    ]}
                    accessibilityLabel={`Row ${r + 1} column ${col + 1}${val ? `, ${val}` : ", empty"}`}
                  >
                    {val !== 0 ? (
                      <Text
                        style={[
                          s.cellText,
                          {
                            fontSize: cellSize * 0.56,
                            color: isWrongVal ? WRONG : isInitial ? c.ink : brand.primary,
                            fontWeight: isInitial ? "700" : "600",
                          },
                        ]}
                      >
                        {val}
                      </Text>
                    ) : notes.length > 0 ? (
                      <View style={s.notesGrid}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                          <Text
                            key={n}
                            style={[
                              s.noteText,
                              {
                                fontSize: Math.max(7, cellSize * 0.24),
                                lineHeight: cellSize / 3 - 0.5,
                                color: n === selectedVal ? brand.primary : c.ink2,
                                opacity: notes.includes(n) ? 1 : 0,
                              },
                            ]}
                          >
                            {n}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Game over / victory overlay sits on the board, so the layout never jumps */}
          {over ? (
            <View style={[s.overlay, { backgroundColor: alpha(c.canvas, 0.88) }]}>
              <Text style={[s.overlayTitle, { color: state.completed ? brand.primary : WRONG }]}>
                {state.completed ? "🎉 Puzzle Solved!" : "Out of mistakes"}
              </Text>
              <Text style={[s.overlaySub, { color: c.ink }]}>
                {state.difficulty.toUpperCase()} • {formatTime(timerSec)} • {state.mistakes} mistake
                {state.mistakes === 1 ? "" : "s"}
              </Text>
              <View style={s.overlayActions}>
                {failed ? (
                  <Pressable
                    onPress={() => {
                      // Second chance (rewarded ad slot): forgive the last mistake.
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setState((prev) => ({ ...prev, mistakes: MAX_MISTAKES - 1 }));
                    }}
                    style={[s.overlayBtn, { backgroundColor: alpha(brand.primary, 0.14) }]}
                  >
                    <Text style={[s.overlayBtnText, { color: brand.primary }]}>Second chance 🎁</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => handleNewGame(state.difficulty)}
                  style={[s.overlayBtn, { backgroundColor: brand.primary }]}
                >
                  <Text style={[s.overlayBtnText, { color: "#ffffff" }]}>New Puzzle →</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        {toast ? (
          <View
            pointerEvents="none"
            style={[s.toast, { backgroundColor: toast.tone === "bad" ? WRONG : brand.primary }]}
          >
            <Text style={s.toastText}>{toast.text}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Tools ── */}
      <View style={s.toolRow}>
        {[
          { id: "undo", icon: "↶", label: "Undo", onPress: handleUndo, active: false },
          { id: "erase", icon: "⌫", label: "Erase", onPress: handleErase, active: false },
          {
            id: "notes",
            icon: "✎",
            label: notesMode ? "Notes ON" : "Notes",
            onPress: () => {
              Haptics.selectionAsync();
              setNotesMode((n) => !n);
            },
            active: notesMode,
          },
          { id: "hint", icon: "💡", label: "Hint", onPress: handleHint, active: false },
        ].map((t) => (
          <Pressable
            key={t.id}
            onPress={t.onPress}
            disabled={over}
            style={({ pressed }) => [
              s.toolBtn,
              {
                backgroundColor: t.active
                  ? brand.primary
                  : pressed
                  ? alpha(brand.primary, 0.18)
                  : c.surfaceRaised,
                opacity: over ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[s.toolIcon, { color: t.active ? "#ffffff" : brand.primary }]}>{t.icon}</Text>
            <Text style={[s.toolLabel, { color: t.active ? "#ffffff" : c.ink2 }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── Numpad 1..9 ── */}
      <View style={s.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const left = 9 - counts[num];
          const done = left <= 0;
          return (
            <Pressable
              key={num}
              onPress={() => handleNumInput(num)}
              disabled={done || over}
              style={({ pressed }) => [
                s.numBtn,
                {
                  height: numBtnH,
                  backgroundColor: pressed ? alpha(brand.primary, 0.2) : c.surfaceRaised,
                  borderColor: notesMode ? alpha(brand.primary, 0.5) : c.hairline,
                  opacity: done ? 0.3 : 1,
                },
              ]}
              accessibilityLabel={`Enter ${num}`}
            >
              <Text
                style={[
                  s.numBtnText,
                  { color: notesMode ? c.ink2 : brand.primary, fontSize: width < 360 ? 22 : 26 },
                ]}
              >
                {num}
              </Text>
              <Text style={[s.numLeft, { color: c.ink2 }]}>{done ? "✓" : left}</Text>
            </Pressable>
          );
        })}
      </View>

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
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  timer: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    fontSize: 13,
    fontWeight: "600",
  },
  segment: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    marginTop: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
  },
  middle: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  board: {
    borderWidth: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  boardRow: {
    flexDirection: "row",
    flex: 1,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    includeFontPadding: false,
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    height: "100%",
  },
  noteText: {
    width: "33.33%",
    height: "33.33%",
    textAlign: "center",
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    padding: space.md,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  overlaySub: {
    fontSize: 14,
    fontWeight: "500",
  },
  overlayActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.xs,
  },
  overlayBtn: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: 10,
  },
  overlayBtnText: {
    fontSize: 15,
    fontWeight: "700",
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
  toolRow: {
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  toolBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toolIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  numpad: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: space.sm,
    paddingBottom: space.xs,
  },
  numBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numBtnText: {
    fontWeight: "700",
  },
  numLeft: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: -2,
  },
  adContainer: {
    alignItems: "stretch",
    paddingHorizontal: space.sm,
    paddingTop: space.xs,
  },
});
