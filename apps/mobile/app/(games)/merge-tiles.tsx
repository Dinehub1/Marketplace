/**
 * Merge — a four-by-four number tile game, and the first screen of its own build target
 * (see apps/mobile/targets.mjs: id "merge-tiles", accent #ea580c, rewarded ad = undo the
 * last move).
 *
 * The job is the whole game: every swipe (or arrow) slides all sixteen squares that way,
 * two tiles showing the same number join into one worth double, and a new tile appears
 * after each move that changed the board.
 *
 * Four things about this screen are deliberate:
 *
 *   - **It is arithmetic, not reflexes.** Tap Sprint measures a reaction and Word Duel
 *     measures vocabulary; here only doubling a number moves the score.
 *   - **The board is the screen.** No hub, no tabs, no scroll: score and controls sit at
 *     the edges and the sixteen squares get everything that is left, so the game fills the
 *     glass the way a game should.
 *   - **Swipe, and only swipe.** The board is the control. A thumb swipe is how this genre is
 *     played on a phone, and the sixteen squares get the space an arrow pad used to take.
 *     What the pad also provided was a way to play without a gesture, so that path is kept
 *     where it belongs — as VoiceOver/TalkBack actions on the board itself, which a screen
 *     reader offers without a single extra pixel of chrome.
 *   - **An ember board, not someone else's.** Twelve values run from a pale chip to the
 *     deepest ember, so the glass says how far a round has come before a numeral is read.
 *     The tenant brand ramp is deliberately NOT used for the board — a game someone
 *     installed has to look like the game, not like the directory behind it — while the
 *     chrome around it and the accent come from the shared tokens and this build target.
 *
 * The rules are not in this file. `lib/merge-tiles.ts` owns them, plus the trace that says
 * which tile travelled where and which cell joined — because a renderer cannot recover that
 * from two boards that happen to look alike, and because the rules are what
 * `scripts/check-merge-tiles.mjs` asserts in plain Node.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
  Text as RNText,
  useWindowDimensions,
  type GestureResponderEvent,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from "expo-audio";
import { alpha, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { Press } from "@/components/ui";
import { AdBanner } from "@/components/ad-slot";
import { useReduceMotion } from "@/lib/motion";
import {
  EMPTY_RECORD,
  loadGameScores,
  recordRound,
  type GameRecord,
} from "@/lib/game-scores";
import {
  at,
  bestTile,
  canUndo,
  CELLS,
  move,
  N,
  newGame,
  swipeDir,
  undo,
  WIN_TILE,
  type Dir,
  type MoveTrace,
  type State,
} from "@/lib/merge-tiles";

/**
 * The game's own look: an ember ramp on a slate board.
 *
 * The chrome around the board comes from the design system and the accent is this build
 * target's own colour (`targets.mjs` → `co.dropby.mergetiles`, #ea580c), the way the other
 * three games wear theirs. The board is the one thing that is this game's own: twelve
 * values running from a pale chip to the deepest ember, so a glance at the glass says how
 * far the round has come without reading a numeral.
 *
 * It is deliberately no longer the game this genre descends from. That palette — and a big
 * "2048" logo card, which is someone else's name in our app — made this screen a copy of a
 * product that already exists, which is exactly what App Store guideline 4.3 and Play's
 * repetitive-content policy are for, and none of it said anything about this app.
 */
type Skin = {
  /** The board: a slate card the tiles sit on. */
  board: string;
  /** An empty cell — the board's own colour, lifted just enough to read as a socket. */
  empty: string;
  /** Numerals on the board, and the overlay's copy. */
  ink: string;
  inkSoft: string;
  /** Tile fill per doubling step; index 0 is a 2. Twelve steps reach 2048 and beyond. */
  fills: readonly string[];
  tileInk: string;
  tileInkHigh: string;
  /** The value at which numerals flip from dark ink to a warm light one. */
  flip: number;
  /** The build target's colour: the wordmark card, the primary button, the ambient wash. */
  accent: string;
  /** The score boxes, which are a part of the board rather than of the chrome. */
  scoreBox: string;
};

const SKIN: Record<"light" | "dark", Skin> = {
  light: {
    board: "#1e2532",
    empty: "#38445a",
    ink: "#f8fafc",
    inkSoft: "#94a3b8",
    fills: [
      "#e2e8f0", // 2
      "#dbe4f0", // 4
      "#ffd9a8", // 8
      "#ffc178", // 16
      "#fd9d55", // 32
      "#d9480f", // 64
      "#c2410c", // 128
      "#9a3412", // 256
      "#7c2d12", // 512
      "#60200e", // 1024
      "#b45309", // 2048 — the deepest ember, and the round's goal
      "#475569", // >2048
    ],
    tileInk: "#0f172a",
    tileInkHigh: "#fff7ed",
    flip: 64,
    accent: "#ea580c",
    scoreBox: "#1e2532",
  },
  dark: {
    board: "#111827",
    empty: "#28374d",
    ink: "#f8fafc",
    inkSoft: "#94a3b8",
    fills: [
      "#cbd5e1", // 2
      "#c3cfdd", // 4
      "#ffcb8a", // 8
      "#ffb265", // 16
      "#fb8f3f", // 32
      "#f97316", // 64
      "#ea580c", // 128
      "#c2410c", // 256
      "#9a3412", // 512
      "#7c2d12", // 1024
      "#b45309", // 2048
      "#334155", // >2048
    ],
    tileInk: "#0b1020",
    tileInkHigh: "#fff7ed",
    // 128, not 64: this ramp passes through a bright orange. Measured against the two inks,
    // a warm-white numeral on the 64 tile is 2.6:1 — under the 3:1 floor for large text —
    // while a dark numeral on it is 7:1. On the light ramp the same step is the other way
    // round, which is exactly why the flip is a per-skin number rather than a shared one.
    flip: 128,
    // A lighter step on purpose: the deep orange goes muddy against a near-black canvas.
    accent: "#fb923c",
    scoreBox: "#111827",
  },
};

/** The numerals, in the plainest face the OS has: a game about arithmetic should read its
 *  numbers, not its typography. */
const FONT = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "sans-serif",
});

/** Slide time. */
const MOVE_MS = 115;
/** Where the sound preference lives on the device. */
const SOUND_KEY = "hermes-merge-sound";
/** Board geometry, in points. */
const GAP = 12;
/** Key this game's round records live under in the device score store. */
const GAME = "merge-tiles";

type Phase = "ready" | "playing" | "over";

/**
 * One tile on the board, with an identity.
 *
 * Identity is the whole reason this exists: the engine hands back a board of numbers and a
 * trace, and "the 4 that was in the corner moved to the middle" is not a thing a number in
 * an array can be. Every tile is keyed by `id` for its whole life, so React moves the same
 * view and Reanimated animates it from where it was.
 */
type Tile = {
  id: number;
  value: number;
  r: number;
  c: number;
  /** Bumped when this tile is born or joins, so its pop replays exactly once. */
  pop: number;
  /** The pop is a join rather than a birth: a bigger bump and a flash of light. */
  joined: boolean;
};

/**
 * The fill for a tile value: one step per doubling, clamped at the top of the ladder. */
function fillFor(skin: Skin, value: number): string {
  const step = Math.round(Math.log2(Math.max(2, value))) - 1;
  return skin.fills[Math.min(skin.fills.length - 1, Math.max(0, step))];
}

/** The tiles as they stand on a board, with no animation — used when a round starts or an
 *  undo jumps the board back, where a slide would be a lie about what just happened. */
function tilesFromBoard(board: number[], nextId: { current: number }): Tile[] {
  const out: Tile[] = [];
  for (let i = 0; i < CELLS; i++) {
    const value = board[i];
    if (!value) continue;
    out.push({
      id: nextId.current++,
      value,
      r: Math.floor(i / N),
      c: i % N,
      pop: 0,
      joined: false,
    });
  }
  return out;
}

export default function MergeTiles() {
  const { c, scheme, elevation } = useTheme();
  const skin = SKIN[scheme === "dark" ? "dark" : "light"];
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>("playing");
  const [game, setGame] = useState<State | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [notice, setNotice] = useState("");
  const [rewardUsed, setRewardUsed] = useState(false);
  const [record, setRecord] = useState<GameRecord>(EMPTY_RECORD);
  const [soundOn, setSoundOn] = useState(true);
  /** The measured area the board gets. Null on the first frame, which falls back to a
   *  window estimate so the opening board is already the right size. */
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);

  /** Tile ids. A ref, not state: two tiles must never be handed the same id by a re-render. */
  const nextId = useRef(1);
  /** The authoritative tile list. State drives the render; this is what handlers read, so a
   *  move that lands mid-animation still sees the tiles that are really there. */
  const tilesRef = useRef<Tile[]>([]);
  /** A slide that has moved the tiles but not yet merged or spawned them. */
  const pending = useRef<{ trace: MoveTrace; board: number[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundOnRef = useRef(true);
  /** Whether this round's end has already been written to the device record. */
  const written = useRef(false);

  const slideSound = useAudioPlayer(require("../../assets/sounds/slide.wav"));
  const mergeSound = useAudioPlayer(require("../../assets/sounds/merge.wav"));
  const bigSound = useAudioPlayer(require("../../assets/sounds/merge-big.wav"));
  const winSound = useAudioPlayer(require("../../assets/sounds/win.wav"));

  // The board size fills width with padding
  const boardPx = useMemo(() => {
    const fallback = Math.min(win.width - space.base * 2, 480);
    const avail = area ? Math.min(area.w, area.h) : fallback;
    const maxSquare = Math.min(avail, win.width - space.base * 2, 480);
    const cell = Math.max(44, Math.floor((maxSquare - GAP * (N + 1)) / N));
    return cell * N + GAP * (N + 1);
  }, [area, win.width]);
  const cell = Math.floor((boardPx - GAP * (N + 1)) / N);

  function commit(list: Tile[]) {
    tilesRef.current = list;
    setTiles(list);
  }

  /**
   * Finish an in-flight slide at once: apply the joins and drop the new tile in.
   */
  function settle() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const flight = pending.current;
    if (!flight) return;
    pending.current = null;

    const { trace, board } = flight;
    const groups = new Map<number, Tile[]>();
    for (const tile of tilesRef.current) {
      const index = at(tile.r, tile.c);
      const group = groups.get(index);
      if (group) group.push(tile);
      else groups.set(index, [tile]);
    }

    const settled: Tile[] = [];
    for (const [index, group] of groups) {
      if (trace.merges.includes(index) && group.length > 1) {
        settled.push({
          ...group[0],
          value: board[index],
          pop: group[0].pop + 1,
          joined: true,
        });
      } else {
        for (const tile of group) settled.push({ ...tile, value: board[index] || tile.value });
      }
    }

    if (trace.spawnedAt !== null && !settled.some((t) => at(t.r, t.c) === trace.spawnedAt)) {
      settled.push({
        id: nextId.current++,
        value: board[trace.spawnedAt],
        r: Math.floor(trace.spawnedAt / N),
        c: trace.spawnedAt % N,
        pop: 1,
        joined: false,
      });
    }
    commit(settled);
  }

  function playSound(player: AudioPlayer) {
    if (!soundOnRef.current) return;
    try {
      void player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // No audio on this device
    }
  }

  // The device record and sound preference are read on mount, and the round starts immediately
  useEffect(() => {
    let live = true;
    loadGameScores()
      .then((scores) => {
        if (live) setRecord(scores[GAME] ?? EMPTY_RECORD);
      })
      .catch(() => {
        /* No stored scores yet is the first run, not a failure: the header shows 0. */
      });
    AsyncStorage.getItem(SOUND_KEY)
      .then((value) => {
        if (!live) return;
        const on = value !== "off";
        soundOnRef.current = on;
        setSoundOn(on);
      })
      .catch(() => {});

    startRound();

    return () => {
      live = false;
    };
  }, []);

  // Respect the ringer switch, and do not stop whatever else is playing: a game that takes
  // over the audio session is a game people delete.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(
      () => {},
    );
  }, []);

  // A pending slide holds a timer; leaving the screen must not leave it running.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function toggleSound() {
    const on = !soundOnRef.current;
    soundOnRef.current = on;
    setSoundOn(on);
    AsyncStorage.setItem(SOUND_KEY, on ? "on" : "off").catch(() => {});
    if (on) playSound(mergeSound);
  }

  function startRound() {
    const fresh = newGame();
    nextId.current = 1;
    pending.current = null;
    written.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setGame(fresh);
    commit(tilesFromBoard(fresh.board, nextId));
    setNotice("");
    setRewardUsed(false);
    setPhase("playing");
  }

  /**
   * One move. The board is split into two beats on purpose:
   *
   *   1. the tiles travel — the trace says which cell each one left and reached, and every
   *      surviving tile is the same React element it was, so Reanimated moves it;
   *   2. then the joins resolve and the new tile lands (`settle`), which is the moment the
   *      numbers change and the pop plays.
   *
   * Doing it in one pass would show the merged value before the tiles met, which is the
   * single detail that makes this genre feel physical.
   */
  function onSlide(dir: Dir) {
    if (phase !== "playing" || !game) return;
    // A second swipe inside the first one's flight resolves it immediately rather than
    // being ignored: the board is already committed, only the animation was pending.
    settle();

    const next = move(game, dir);
    if (next === game) {
      setNotice("Nothing moves that way — every tile is already against that wall.");
      try {
        void Haptics.selectionAsync();
      } catch {
        /* haptics are feedback, not a rule */
      }
      return;
    }

    const trace = next.lastMove;
    if (!trace) return;

    const byIndex = new Map(tilesRef.current.map((tile) => [at(tile.r, tile.c), tile]));
    const arriving = new Map<number, Tile[]>();
    for (const step of trace.steps) {
      const tile = byIndex.get(step.from);
      if (!tile) continue;
      const moved: Tile = { ...tile, r: Math.floor(step.to / N), c: step.to % N };
      const group = arriving.get(step.to);
      if (group) group.push(moved);
      else arriving.set(step.to, [moved]);
    }
    commit([...arriving.values()].flat());

    const before = game;
    setGame(next);

    const joined = trace.merges.map((index) => next.board[index]);
    const biggest = joined.length ? Math.max(...joined) : 0;
    const gained = next.score - before.score;
    setNotice(
      next.won && !before.won
        ? `${WIN_TILE} reached — the round carries on. +${gained}`
        : joined.length
          ? `Joined for +${gained}`
          : "Slid with no join this time",
    );

    // One source of feedback, chosen by what actually happened rather than by which control
    // was used — a swipe and an arrow that both join two 8s must feel identical.
    try {
      if (next.won && !before.won) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        playSound(winSound);
      } else if (joined.length) {
        void Haptics.impactAsync(
          biggest >= 128
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Light,
        );
        playSound(biggest >= 128 ? bigSound : mergeSound);
      } else {
        void Haptics.selectionAsync();
        playSound(slideSound);
      }
    } catch {
      /* feedback must never take a move down */
    }

    pending.current = { trace, board: next.board };
    timer.current = setTimeout(settle, reduceMotion ? 0 : MOVE_MS);
  }

  /**
   * The record, written the moment the board runs out of moves.
   *
   * There is no clock here, so `over` is the only ending this screen has: the engine
   * reports it as soon as no slide can do anything, and the overlay offers the two ways
   * out. It is written once per round — the board can be looked at many times in that
   * state, and a record written per render would count one round as dozens — and the undo
   * clears the flag, because a round rescued from the end can still end later.
   */
  useEffect(() => {
    if (!game?.over || written.current) return;
    written.current = true;
    const line =
      `${game.moves} ${game.moves === 1 ? "move" : "moves"} · best tile ${game.reached}` +
      (game.won ? ` · ${WIN_TILE} reached` : "");
    recordRound(GAME, game.score, line)
      .then(({ record: next }) => setRecord(next))
      .catch(() => {
        /* A device that will not store a score still plays the game. */
      });
  }, [game]);

  /**
   * The rewarded ad, kept: the board and the score go back exactly one move, which puts at
   * least one join back within reach — the state the undo returns is one a move was played
   * from, so it had a legal move by construction. Offered once per round.
   */
  function takeUndo() {
    if (!game) return;
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const back = undo(game);
    setRewardUsed(true);
    // The round has moves again, so it can end a second time and be written again.
    written.current = false;
    setGame(back);
    // The board jumps; it does not slide backwards. The ad undoes a move, it does not
    // replay one.
    commit(tilesFromBoard(back.board, nextId));
    setNotice("One move back. The tile that arrived with it is gone too.");
    setPhase("playing");
  }

  /**
   * The swipe, on the board only — so a swipe that starts on the pad is a press on the pad.
   *
   * This uses React Native's own responder system rather than a gesture library: a swipe
   * here is "where did the finger start, where did it end", which is exactly what
   * grant/release report, and it keeps the whole interaction as plain event handlers
   * (nothing runs on the UI thread mid-render, and a screenshot harness can still drive the
   * board). The board has no other touch targets, so claiming the responder on touch-down
   * costs nothing.
   */
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onBoardGrant(e: GestureResponderEvent) {
    touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  }

  function onBoardRelease(e: GestureResponderEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    // The direction maths is in the engine, where the Node check can assert it — a
    // diagonal and an exact tie are the two cases that go wrong quietly.
    const dir = swipeDir(e.nativeEvent.pageX - start.x, e.nativeEvent.pageY - start.y);
    if (dir) onSlide(dir);
  }

  return (
    <View style={s.root}>
      {/* The canvas is the design system's, with this game's accent warming the bottom of the
          screen — enough that the screen belongs to the game, not enough to be a colour of
          its own. */}
      <LinearGradient
        colors={[c.canvas, alpha(skin.accent, scheme === "dark" ? 0.12 : 0.07)]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          s.column,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md },
        ]}
      >
        {/* ── Header: the wordmark and the scoreboard ── */}
        <View style={s.header}>
          <View style={[s.logoCard, { backgroundColor: skin.accent }, elevation(2)]}>
            <RNText style={s.logoText}>MERGE</RNText>
          </View>

          <View style={s.scoresRow}>
            <View style={[s.scoreBox, { backgroundColor: skin.scoreBox }]}>
              <RNText style={s.scoreLabel}>SCORE</RNText>
              <RNText style={s.scoreVal}>{game?.score ?? 0}</RNText>
            </View>
            <View style={[s.scoreBox, { backgroundColor: skin.scoreBox }]}>
              <RNText style={s.scoreLabel}>BEST</RNText>
              <RNText style={s.scoreVal}>{Math.max(record.best, game?.score ?? 0)}</RNText>
            </View>
          </View>
        </View>

        {/* The screen's two sentences: what the game is, and its shape. They were the ready
            panel's headline before this screen lost its three states, and they belong here
            rather than in a panel in front of the board. */}
        <View style={s.tagline}>
          <RNText style={[s.taglineTitle, { color: c.ink }]}>
            Slide the tiles, double the numbers
          </RNText>
          <RNText style={[s.taglineMeta, { color: c.ink2 }]}>Four by four · no clock</RNText>
        </View>

        {/* ── Board Container ── */}
        <View
          style={s.boardArea}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setArea((prev) =>
              prev && Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
                ? prev
                : { w: width, h: height },
            );
          }}
        >
          <View
            accessibilityLabel={`Board. ${N} by ${N}. Swipe to slide the tiles.`}
            accessibilityActions={[
              { name: "slide-left", label: "Slide left" },
              { name: "slide-right", label: "Slide right" },
              { name: "slide-up", label: "Slide up" },
              { name: "slide-down", label: "Slide down" },
            ]}
            onAccessibilityAction={(e) => {
              const dir = e.nativeEvent.actionName.replace("slide-", "");
              if (dir === "left" || dir === "right" || dir === "up" || dir === "down") {
                onSlide(dir);
              }
            }}
            onStartShouldSetResponder={() => !game?.over}
            onResponderGrant={onBoardGrant}
            onResponderRelease={onBoardRelease}
            onResponderTerminationRequest={() => false}
            style={[
              s.board,
              {
                width: boardPx,
                height: boardPx,
                backgroundColor: skin.board,
              },
            ]}
          >
            {Array.from({ length: CELLS }).map((_, index) => (
              <View
                key={`cell-${index}`}
                style={[
                  s.empty,
                  {
                    left: GAP + (index % N) * (cell + GAP),
                    top: GAP + Math.floor(index / N) * (cell + GAP),
                    width: cell,
                    height: cell,
                    backgroundColor: skin.empty,
                  },
                ]}
              />
            ))}
            {tiles.map((tile) => (
              <TileView
                key={tile.id}
                tile={tile}
                cell={cell}
                skin={skin}
                reduceMotion={reduceMotion}
              />
            ))}

            {/* Game Over / Win Overlay right on the board */}
            {game?.over ? (
              <View style={[s.boardOverlay, { backgroundColor: alpha(skin.board, 0.94) }]}>
                <RNText style={[s.overlayTitle, { color: skin.ink }]}>
                  {game.won ? "You Win!" : "Game Over!"}
                </RNText>
                <RNText style={[s.overlaySubtitle, { color: skin.inkSoft }]}>
                  Final Score: {game.score}
                </RNText>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                  haptic="medium"
                  onPress={startRound}
                  style={[s.overlayBtn, { backgroundColor: skin.accent }]}
                >
                  <RNText style={s.overlayBtnText}>Try again</RNText>
                </Press>
                {!rewardUsed && canUndo(game) ? (
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel="Undo last move"
                    onPress={takeUndo}
                    style={[s.overlayBtn, { backgroundColor: skin.accent, marginTop: 10 }]}
                  >
                    <RNText style={s.overlayBtnText}>Undo move</RNText>
                  </Press>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* Where the last move stands, in the screen's own words: a slide that joined
            nothing says so, so "the board changed" and "why it changed" are one message
            instead of a board that moves in silence. */}
        <RNText style={[s.notice, { color: c.ink2 }]} numberOfLines={1}>
          {notice || "Swipe the board to slide the tiles"}
        </RNText>

        {/* The ad space, at the bottom of the board and above the controls, where it costs the
            round nothing: the height is reserved whether or not a banner has loaded, so the
            board never moves under the player's thumb when one arrives. `AdBanner` lives in
            components/ad-slot.tsx — the only file an ad SDK ever touches. */}
        <AdBanner accent={skin.accent} />

        {/* ─ Bottom Controls & Stats Bar (Thumb Zone) ── */}
        <View style={s.bottomSection}>
          <View style={s.actionsRow}>
            <Press
              accessibilityRole="button"
              accessibilityLabel="New game"
              onPress={startRound}
              style={[s.actionBtn, { backgroundColor: skin.accent }]}
            >
              <RNText style={s.actionBtnText}>NEW GAME</RNText>
            </Press>

            {Boolean(game && canUndo(game)) && !rewardUsed ? (
              <Press
                accessibilityRole="button"
                accessibilityLabel="Undo last move"
                onPress={takeUndo}
                style={[s.actionBtn, { backgroundColor: skin.accent }]}
              >
                <RNText style={s.actionBtnText}>UNDO</RNText>
              </Press>
            ) : (
              <Press
                accessibilityRole="button"
                accessibilityLabel={soundOn ? "Sound on" : "Sound off"}
                onPress={toggleSound}
                style={[s.actionBtn, { backgroundColor: skin.scoreBox }]}
              >
                <RNText style={s.actionBtnText}>{soundOn ? "SOUND: ON" : "SOUND: OFF"}</RNText>
              </Press>
            )}
          </View>

          <View style={s.statusRow}>
            <RNText style={[s.statusMeta, { color: c.ink2 }]}>
              Moves: <RNText style={{ fontWeight: "800", color: c.ink }}>{game?.moves ?? 0}</RNText>
            </RNText>
            <RNText style={[s.statusMeta, { color: c.ink2 }]}>
              Best Tile:{" "}
              <RNText style={{ fontWeight: "800", color: c.ink }}>
                {game ? bestTile(game.board) : 2}
              </RNText>
            </RNText>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * One tile, in motion.
 *
 * `left`/`top` are never animated: the tile is drawn at the origin and moved with
 * translateX/translateY, which stays on the UI thread and off the layout pass. A resize
 * (the board is measured a frame after the first render) jumps rather than slides —
 * otherwise every tile would drift into place behind the layout change.
 *
 * Under Reduce Motion the tile does not travel at all: it appears in its new cell on the
 * frame the move commits, and the only feedback left is the flash, which is an opacity
 * change rather than movement. Same information, no motion.
 */
function TileView({
  tile,
  cell,
  skin,
  reduceMotion,
}: {
  tile: Tile;
  cell: number;
  skin: Skin;
  reduceMotion: boolean;
}) {
  const targetOf = (r: number, c: number) => ({
    x: GAP + c * (cell + GAP),
    y: GAP + r * (cell + GAP),
  });

  const start = targetOf(tile.r, tile.c);
  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const scale = useSharedValue(1);
  const flash = useSharedValue(0);
  const placed = useRef(false);
  const lastCell = useRef(cell);
  const seenPop = useRef(tile.pop);

  useEffect(() => {
    const target = targetOf(tile.r, tile.c);
    const resized = lastCell.current !== cell;
    lastCell.current = cell;
    if (!placed.current || resized || reduceMotion) {
      x.value = target.x;
      y.value = target.y;
    } else {
      const timing = { duration: MOVE_MS, easing: Easing.out(Easing.cubic) };
      x.value = withTiming(target.x, timing);
      y.value = withTiming(target.y, timing);
    }
    placed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.r, tile.c, cell, reduceMotion]);

  useEffect(() => {
    if (seenPop.current === tile.pop) return;
    seenPop.current = tile.pop;
    // The flash is allowed under Reduce Motion (it is light, not movement); the bump is not.
    flash.value = withSequence(
      withTiming(tile.joined ? 0.5 : 0.28, { duration: 55 }),
      withTiming(0, { duration: tile.joined ? 180 : 120 }),
    );
    if (!reduceMotion) {
      scale.value = withSequence(
        withTiming(tile.joined ? 1.22 : 1.13, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 130, easing: Easing.out(Easing.back(1.6)) }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.pop, tile.joined, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const big = tile.value >= skin.flip;
  const isHigh = tile.value >= 128;
  const fontSize = Math.round(
    cell * (tile.value < 100 ? 0.44 : tile.value < 1000 ? 0.35 : 0.26),
  );
  const lineHeight = Math.round(fontSize * 1.16);

  return (
    <Animated.View
      accessibilityLabel={`Tile row ${tile.r + 1} column ${tile.c + 1}: ${tile.value}`}
      style={[
        s.tile,
        {
          width: cell,
          height: cell,
          backgroundColor: fillFor(skin, tile.value),
          shadowColor: isHigh ? skin.accent : "#000000",
          shadowOpacity: isHigh ? 0.4 : 0.12,
          shadowRadius: isHigh ? 8 : 2,
          shadowOffset: { width: 0, height: isHigh ? 3 : 1 },
          elevation: isHigh ? 6 : 2,
        },
        style,
      ]}
    >
      <RNText
        numberOfLines={1}
        style={{
          fontFamily: FONT,
          fontWeight: "800",
          fontSize,
          lineHeight,
          letterSpacing: -0.5,
          color: big ? skin.tileInkHigh : skin.tileInk,
          textAlign: "center",
          includeFontPadding: false,
        }}
      >
        {tile.value}
      </RNText>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: big ? "#000" : "#fff", borderRadius: 8 },
          flashStyle,
        ]}
      />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    paddingHorizontal: space.base,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  logoCard: {
    minWidth: 92,
    height: 72,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: FONT,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
    textAlign: "center",
    includeFontPadding: false,
  },
  scoresRow: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  scoreBox: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    fontFamily: FONT,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#eee4da",
    letterSpacing: 0.8,
    textAlign: "center",
    includeFontPadding: false,
  },
  scoreVal: {
    fontFamily: FONT,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    includeFontPadding: false,
  },
  /** What the game is and its shape, the two lines that used to be the ready panel. */
  tagline: {
    gap: 2,
    marginBottom: 10,
  },
  taglineTitle: {
    fontFamily: FONT,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  taglineMeta: {
    fontFamily: FONT,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
  },
  /** The line under the board that says what the last move did. */
  notice: {
    fontFamily: FONT,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  boardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  board: {
    borderRadius: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  empty: {
    position: "absolute",
    borderRadius: 10,
  },
  tile: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  boardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 100,
  },
  overlayTitle: {
    fontFamily: FONT,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    marginBottom: 6,
    textAlign: "center",
    includeFontPadding: false,
  },
  overlaySubtitle: {
    fontFamily: FONT,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
  },
  overlayBtn: {
    minWidth: 140,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBtnText: {
    fontFamily: FONT,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  bottomSection: {
    width: "100%",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionBtnText: {
    fontFamily: FONT,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  statusMeta: {
    fontFamily: FONT,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "600",
  },
});

