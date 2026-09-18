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
 *   - **Swipe first, arrows for everyone else.** A thumb swipe is how this genre is played
 *     on a phone; the pad stays because it is the accessible control, it works one-handed
 *     at the bottom of the screen, and it is the one interaction a screenshot harness can
 *     press deterministically.
 *   - **Vintage, not themed.** Warm paper, letterpress tiles and a serif numeral are the
 *     game's own look, borrowed from the board games this puzzle descends from. The tenant
 *     brand ramp is deliberately NOT used for the board — a game someone installed has to
 *     look like the game, not like the directory behind it — but every control around the
 *     board still comes from the shared type scale, spacing and press behaviour.
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from "expo-audio";
import { alpha, radius, space } from "@hermes/tokens";
import { useTheme } from "@/lib/theme";
import { Badge, Card, Press, Text } from "@/components/ui";
import { AdSlot } from "@/components/ad-slot";
import { useReduceMotion } from "@/lib/motion";
import {
  EMPTY_RECORD,
  loadGameScores,
  recordRound,
  type GameRecord,
} from "@/lib/game-scores";
import {
  at,
  canSlide,
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
 * The game's own look. Two complete palettes rather than tints of one, because parchment
 * and lamplight are different materials, not the same material at two brightnesses.
 */
type Skin = {
  /** The paper the whole screen is printed on. */
  paper: readonly [string, string];
  board: string;
  boardEdge: string;
  boardShadow: string;
  empty: string;
  ink: string;
  inkSoft: string;
  tileEdge: string;
  /** Tile fill per doubling step; index 0 is a 2. Ten steps reach 2048. */
  fills: readonly string[];
  tileInk: string;
  tileInkHigh: string;
  /** The value at which numerals flip from ink to cream. */
  flip: number;
  accent: string;
};

const SKIN: Record<"light" | "dark", Skin> = {
  light: {
    paper: ["#f9f2e2", "#ebdec2"],
    board: "#e1d1b1",
    boardEdge: "#c2a97f",
    boardShadow: "#7c6541",
    empty: "#d6c4a2",
    ink: "#3d2f1e",
    inkSoft: "#6d5b41",
    tileEdge: "rgba(61,47,30,0.16)",
    fills: [
      "#faf4e7",
      "#f5e9d0",
      "#f0d9ab",
      "#ecc489",
      "#e6a862",
      "#dd8a3f",
      "#cf6d27",
      "#b95418",
      "#9d3f10",
      "#7e2f0b",
      "#5f2107",
    ],
    tileInk: "#43331f",
    tileInkHigh: "#fff7e8",
    flip: 128,
    accent: "#b8430f",
  },
  dark: {
    paper: ["#241d14", "#100e0a"],
    board: "#2c2418",
    boardEdge: "#4c3d27",
    boardShadow: "#000000",
    empty: "#352b1d",
    ink: "#f3e7d1",
    inkSoft: "#c5b394",
    tileEdge: "rgba(0,0,0,0.5)",
    fills: [
      "#3b3020",
      "#4a3b22",
      "#5d4623",
      "#77531f",
      "#92631a",
      "#ab741a",
      "#c38621",
      "#d69c2d",
      "#e3b241",
      "#edc45e",
      "#f4d47c",
    ],
    tileInk: "#f7edd9",
    tileInkHigh: "#2a1c06",
    flip: 512,
    accent: "#f59e0b",
  },
};

/** The numeral face. A serif on the tiles is the one piece of type in this app that is not
 *  the shared scale, and it is the piece that makes the board read as a board game rather
 *  than a spreadsheet. Platform serif faces are used rather than a bundled font: no
 *  download, no licence, and both platforms ship a good one. */
const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, 'Times New Roman', serif",
});

/** Slide time. Short enough that a fast player never waits on it, long enough to read as
 *  movement rather than a jump cut. */
const MOVE_MS = 115;
/** Where the sound preference lives on the device. */
const SOUND_KEY = "hermes-merge-sound";
/** Board geometry, in points. */
const GAP = 8;
/** The direction pad. */
const ARROW = 58;
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

type Summary = {
  score: number;
  best: number;
  moves: number;
  won: boolean;
  /** Set from the stored record, the only thing that knows if this round won. */
  isNewBest: boolean;
};

/** The fill for a tile value: one step per doubling, clamped at the top of the ladder. */
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
  const { scheme, elevation } = useTheme();
  const skin = SKIN[scheme === "dark" ? "dark" : "light"];
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const win = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>("ready");
  const [game, setGame] = useState<State | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [notice, setNotice] = useState("");
  const [rewardUsed, setRewardUsed] = useState(false);
  const [record, setRecord] = useState<GameRecord>(EMPTY_RECORD);
  const [recordRead, setRecordRead] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
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

  const slideSound = useAudioPlayer(require("../../assets/sounds/slide.wav"));
  const mergeSound = useAudioPlayer(require("../../assets/sounds/merge.wav"));
  const bigSound = useAudioPlayer(require("../../assets/sounds/merge-big.wav"));
  const winSound = useAudioPlayer(require("../../assets/sounds/win.wav"));

  // The board is the screen, so its size follows the space that is actually left after the
  // header, the notice and the pad — measured rather than guessed from the window, because
  // "everything that is left" is a layout fact and this screen is all layout.
  const boardPx = useMemo(() => {
    const fallback = Math.min(win.width - space.base * 2, win.height * 0.52);
    const avail = area ? Math.min(area.w, area.h) : fallback;
    const cell = Math.max(44, Math.floor((avail - GAP * (N + 1)) / N));
    return cell * N + GAP * (N + 1);
  }, [area, win.width, win.height]);
  const cell = Math.floor((boardPx - GAP * (N + 1)) / N);

  function commit(list: Tile[]) {
    tilesRef.current = list;
    setTiles(list);
  }

  /**
   * Finish an in-flight slide at once: apply the joins and drop the new tile in.
   *
   * Called by the timer that would have done it anyway, and by the next move — a player who
   * swipes twice inside 115 ms should get two moves, not a dropped input. It is safe to
   * call when nothing is pending.
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
        // The first tile to arrive keeps its identity and takes the joined value; the other
        // is absorbed. Giving the survivor a new identity would animate a merge as a death
        // and a birth, which is not what happened.
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
      // Rewound before playing so two joins in quick succession are two blips rather than
      // one blip that never restarts.
      void player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // No audio on this device, or the platform refused it. The game is fully playable;
      // sound is feedback, not a rule.
    }
  }

  // The device record and the sound preference are read once, on mount.
  useEffect(() => {
    let live = true;
    loadGameScores()
      .then((scores) => {
        if (live) setRecord(scores[GAME] ?? EMPTY_RECORD);
      })
      .finally(() => {
        if (live) setRecordRead(true);
      });
    AsyncStorage.getItem(SOUND_KEY)
      .then((value) => {
        if (!live) return;
        const on = value !== "off";
        soundOnRef.current = on;
        setSoundOn(on);
      })
      .catch(() => {});
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
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setGame(fresh);
    commit(tilesFromBoard(fresh.board, nextId));
    setNotice("");
    setRewardUsed(false);
    setSummary(null);
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
   * Ends the round and writes the record. Called from the stuck panel — the only way a
   * round finishes, because nothing here runs out of time.
   */
  function finishRound() {
    settle();
    const g = game;
    if (!g) return;
    setPhase("over");
    setSummary({
      score: g.score,
      best: g.reached,
      moves: g.moves,
      won: g.won,
      isNewBest: false,
    });
    const line =
      `${g.moves} ${g.moves === 1 ? "move" : "moves"} · best tile ${g.reached}` +
      (g.won ? ` · ${WIN_TILE} reached` : "");
    recordRound(GAME, g.score, line).then(({ record: next, isNewBest }) => {
      setRecord(next);
      setSummary((prev) => (prev ? { ...prev, isNewBest } : prev));
    });
  }

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

  const playing = phase === "playing" && game !== null;

  return (
    <View style={s.root}>
      <LinearGradient colors={skin.paper} style={StyleSheet.absoluteFill} />

      <View
        style={[
          s.column,
          { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.sm },
        ]}
      >
        {phase === "ready" ? (
          <View style={s.page}>
            <View style={s.topRow}>
              <Text variant="caption" style={{ color: skin.inkSoft }}>
                Four by four · no clock
              </Text>
              <View style={[s.chip, { borderColor: alpha(skin.accent, 0.45) }]}>
                <Text variant="caption" style={{ color: skin.accent }}>
                  Free
                </Text>
              </View>
            </View>

            <Text style={[s.title, { color: skin.ink }]}>MERGE</Text>
            <Text variant="lede" style={{ color: skin.inkSoft }}>
              Slide the tiles, double the numbers
            </Text>

            <View style={s.steps}>
              {[
                "Swipe the board, or press an arrow — everything slides that way",
                "Two equal tiles join into one worth double: 2 and 2 make 4, and 4 points",
                "Fill the board and the round is over. Reaching 2048 is the win",
              ].map((step, i) => (
                <View key={step} style={s.step}>
                  <View style={[s.stepDot, { borderColor: alpha(skin.accent, 0.5) }]}>
                    <Text variant="caption" style={{ color: skin.accent }}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text variant="meta" style={[s.stepText, { color: skin.inkSoft }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>

            {/* The ladder, printed rather than explained: this is what the tiles go
                through, and it is also the clearest way to say "old paper". */}
            <View style={[s.ladder, { borderColor: skin.boardEdge, backgroundColor: skin.board }]}>
              {[2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048].map((value) => (
                <View
                  key={value}
                  style={[
                    s.ladderTile,
                    {
                      backgroundColor: fillFor(skin, value),
                      borderColor: skin.tileEdge,
                      width: value < 100 ? 34 : value < 1000 ? 42 : 50,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.ladderInk,
                      {
                        color: value >= skin.flip ? skin.tileInkHigh : skin.tileInk,
                        fontSize: value < 100 ? 13 : value < 1000 ? 11 : 10,
                      },
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            <Card style={[s.rules, { borderColor: skin.boardEdge, backgroundColor: skin.paper[0] }]}>
              <Rule skin={skin} label="Every join" value="Scores the tile it produced" />
              <Rule skin={skin} label="A pair joins once per slide" value="2·2·2·2 makes two 4s, not an 8" />
              <Rule skin={skin} label="A new tile" value="A 2, or a 4 one time in ten" />
              <Rule skin={skin} label="The board fills up" value="One rewarded undo, then the end" />
            </Card>

            <Press
              accessibilityRole="button"
              accessibilityLabel="Start the round"
              haptic="medium"
              onPress={startRound}
              style={[s.play, { backgroundColor: skin.accent }, elevation(3)]}
            >
              <Text style={[s.playLabel, { color: skin.tileInkHigh }]}>PLAY</Text>
            </Press>

            <Text variant="meta" style={[s.centre, { color: skin.inkSoft }]}>
              {!recordRead
                ? "Reading this device's scores…"
                : record.rounds
                  ? `Best on this device: ${record.best} · ${record.rounds} ${
                      record.rounds === 1 ? "round" : "rounds"
                    } played`
                  : "No rounds recorded on this device yet"}
            </Text>
          </View>
        ) : null}

        {playing && game ? (
          <>
            <View style={s.hud}>
              <Stat skin={skin} label="Score" value={String(game.score)} />
              <Stat
                skin={skin}
                label="Best tile"
                value={String(game.reached)}
                highlight={game.won}
              />
              <Stat skin={skin} label="Moves" value={String(game.moves)} />
              <Stat skin={skin} label="Best" value={recordRead ? String(record.best) : "—"} />
            </View>

            <View style={s.noticeRow}>
              <Text variant="meta" style={[s.noticeText, { color: skin.inkSoft }]} numberOfLines={1}>
                {notice || "Swipe the board, or use the arrows"}
              </Text>
              <Press
                accessibilityRole="button"
                accessibilityLabel={soundOn ? "Sound on" : "Sound off"}
                accessibilityState={{ selected: soundOn }}
                onPress={toggleSound}
                style={[s.sound, { borderColor: skin.boardEdge }]}
              >
                <Text variant="caption" style={{ color: soundOn ? skin.accent : skin.inkSoft }}>
                  {soundOn ? "♪ on" : "♪ off"}
                </Text>
              </Press>
            </View>

            {/* The board gets everything left over after the header, the notice and the
                pad. Measuring the space rather than deriving it from the window is what
                makes it fill the phone instead of leaving a strip of paper at the bottom. */}
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
                onStartShouldSetResponder={() => phase === "playing" && !game.over}
                onResponderGrant={onBoardGrant}
                onResponderRelease={onBoardRelease}
                onResponderTerminationRequest={() => false}
                style={[
                  s.board,
                  // The elevation token first, so the board's own warm shadow colour and
                  // softer falloff win on iOS while Android still gets its elevation.
                  elevation(2),
                  {
                    width: boardPx,
                    height: boardPx,
                    backgroundColor: skin.board,
                    borderColor: skin.boardEdge,
                    shadowColor: skin.boardShadow,
                    shadowOpacity: 0.22,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 8 },
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
              </View>
            </View>

            <View style={s.pad}>
              {/* A 3×3 cross: the pad this genre is played with on a keyboard, kept here
                  because it is the accessible control and the one a probe can press. */}
              <View style={s.padRow}>
                <View style={s.padSpacer} />
                <Arrow dir="up" game={game} phase={phase} skin={skin} onSlide={onSlide} />
                <View style={s.padSpacer} />
              </View>
              <View style={s.padRow}>
                <Arrow dir="left" game={game} phase={phase} skin={skin} onSlide={onSlide} />
                <View style={s.padCentre}>
                  <Text variant="caption" style={{ color: skin.inkSoft }}>
                    {WIN_TILE}
                  </Text>
                </View>
                <Arrow dir="right" game={game} phase={phase} skin={skin} onSlide={onSlide} />
              </View>
              <View style={s.padRow}>
                <View style={s.padSpacer} />
                <Arrow dir="down" game={game} phase={phase} skin={skin} onSlide={onSlide} />
                <View style={s.padSpacer} />
              </View>
            </View>

            {game.over ? (
              <View style={[s.over, { borderColor: skin.boardEdge, backgroundColor: skin.paper[0] }]}>
                <Text variant="title2" style={{ color: skin.ink }}>
                  No moves left
                </Text>
                <Text variant="body" style={{ color: skin.inkSoft }}>
                  Every square is full and no two neighbours are equal. Score {game.score}, best
                  tile {game.reached} after {game.moves} {game.moves === 1 ? "move" : "moves"}.
                </Text>
                {rewardUsed || !canUndo(game) ? (
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel="End the round"
                    haptic="medium"
                    onPress={finishRound}
                    style={[s.play, { backgroundColor: skin.accent }, elevation(2)]}
                  >
                    <Text style={[s.playLabel, { color: skin.tileInkHigh }]}>END ROUND</Text>
                  </Press>
                ) : (
                  <AdSlot
                    accent={skin.accent}
                    title="Rewarded ad — undo the last move"
                    reward="The board and the score go back exactly one move, once per round."
                    cta="Watch ad to take the move back"
                    onReward={takeUndo}
                    onDismiss={finishRound}
                    dismissLabel="End the round"
                  />
                )}
              </View>
            ) : null}
          </>
        ) : null}

        {phase === "over" ? (
          <View style={s.page}>
            <Text style={[s.title, { color: skin.ink }]}>
              {summary?.won ? String(WIN_TILE) : "GAME OVER"}
            </Text>
            <View style={s.topRow}>
              <Text variant="lede" style={{ color: skin.inkSoft }}>
                {summary?.won ? "Reached, and the board carried on" : "No moves left"}
              </Text>
              {summary?.isNewBest ? <Badge tone="positive" label="New best" /> : null}
            </View>

            {summary ? (
              <Card style={[s.rules, { borderColor: skin.boardEdge, backgroundColor: skin.paper[0] }]}>
                <Rule skin={skin} label="Score" value={String(summary.score)} />
                <Rule skin={skin} label="Best tile" value={String(summary.best)} />
                <Rule skin={skin} label="Moves" value={String(summary.moves)} />
                <Rule
                  skin={skin}
                  label={`Reached ${WIN_TILE}`}
                  value={summary.won ? "Yes" : "Not this round"}
                />
                <Rule skin={skin} label="Best on this device" value={String(record.best)} />
              </Card>
            ) : null}

            {record.recent.length > 0 ? (
              <Card style={[s.rules, { borderColor: skin.boardEdge, backgroundColor: skin.paper[0] }]}>
                <Text variant="title3" style={{ color: skin.ink }}>
                  {record.recent.length === 1 ? "Last round" : `Last ${record.recent.length} rounds`}
                </Text>
                {record.recent.map((r, i) => (
                  <View key={`${r.at}-${i}`} style={s.recentRow}>
                    <Text variant="meta" style={{ color: skin.inkSoft, flex: 1 }}>
                      {r.line || "round recorded"}
                    </Text>
                    <Text variant="meta" style={{ color: skin.ink }}>
                      {r.score}
                    </Text>
                  </View>
                ))}
                <Text variant="caption" style={{ color: skin.inkSoft }}>
                  Kept on this device, newest first
                </Text>
              </Card>
            ) : null}

            <Press
              accessibilityRole="button"
              accessibilityLabel="Play again"
              haptic="medium"
              onPress={startRound}
              style={[s.play, { backgroundColor: skin.accent }, elevation(3)]}
            >
              <Text style={[s.playLabel, { color: skin.tileInkHigh }]}>PLAY AGAIN</Text>
            </Press>

            <Press
              accessibilityRole="link"
              accessibilityLabel="Passport photo maker, forty-nine rupees"
              onPress={() => router.push("/passport")}
              style={[s.cross, { borderColor: skin.boardEdge }]}
            >
              <Text variant="meta" style={{ color: skin.inkSoft }}>
                Also in this app: a print-ready passport photo sheet for ₹49
              </Text>
            </Press>
          </View>
        ) : null}
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
  return (
    <Animated.View
      accessibilityLabel={`Tile row ${tile.r + 1} column ${tile.c + 1}: ${tile.value}`}
      style={[
        s.tile,
        {
          width: cell,
          height: cell,
          backgroundColor: fillFor(skin, tile.value),
          borderColor: skin.tileEdge,
          shadowColor: skin.boardShadow,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: SERIF,
          fontWeight: "700",
          fontSize: Math.round(
            cell * (tile.value < 100 ? 0.42 : tile.value < 1000 ? 0.33 : 0.25),
          ),
          letterSpacing: -0.5,
          color: big ? skin.tileInkHigh : skin.tileInk,
        }}
      >
        {tile.value}
      </Text>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: big ? "#000" : "#fff", borderRadius: radius.sm },
          flashStyle,
        ]}
      />
    </Animated.View>
  );
}

/** One cell of the scoreboard. */
function Stat({
  skin,
  label,
  value,
  highlight,
}: {
  skin: Skin;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={s.stat}>
      <Text variant="caption" style={{ color: skin.inkSoft }}>
        {label}
      </Text>
      <Text style={[s.statValue, { color: highlight ? skin.accent : skin.ink }]}>{value}</Text>
    </View>
  );
}

/** One arrow of the pad, dimmed exactly when the engine says it cannot move anything. */
function Arrow({
  dir,
  game,
  phase,
  skin,
  onSlide,
}: {
  dir: Dir;
  game: State;
  phase: Phase;
  skin: Skin;
  onSlide: (dir: Dir) => void;
}) {
  const usable = phase === "playing" && !game.over && canSlide(game.board, dir);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={`Slide ${dir}`}
      accessibilityState={{ disabled: !usable }}
      disabled={!usable}
      onPress={() => onSlide(dir)}
      style={[
        s.arrow,
        {
          backgroundColor: skin.paper[0],
          borderColor: usable ? skin.boardEdge : alpha(skin.boardEdge, 0.45),
          opacity: usable ? 1 : 0.45,
        },
      ]}
    >
      <Text style={[s.arrowInk, { color: skin.ink }]}>
        {dir === "up" ? "↑" : dir === "down" ? "↓" : dir === "left" ? "←" : "→"}
      </Text>
    </Press>
  );
}

/** A label/value line on paper. */
function Rule({ skin, label, value }: { skin: Skin; label: string; value: string }) {
  return (
    <View style={s.ruleRow}>
      <Text variant="meta" style={{ color: skin.inkSoft, flex: 1 }}>
        {label}
      </Text>
      <Text variant="meta" style={{ color: skin.ink, flexShrink: 1, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: space.base,
  },
  // ── ready / over: printed pages ──────────────────────────────────────────────
  page: { flex: 1, justifyContent: "center", gap: space.base },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: {
    fontFamily: SERIF,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: 4,
    fontWeight: "700",
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  steps: { gap: space.sm },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1 },
  ladder: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: GAP,
  },
  ladderTile: {
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ladderInk: { fontFamily: SERIF, fontWeight: "700" },
  rules: { padding: space.base, gap: space.sm, borderWidth: 2 },
  ruleRow: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  recentRow: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  play: {
    minHeight: 60,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  playLabel: {
    fontFamily: SERIF,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 2.5,
    fontWeight: "700",
  },
  cross: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.base,
    alignItems: "center",
  },
  centre: { textAlign: "center" },

  // ── playing ─────────────────────────────────────────────────────────────────
  hud: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  stat: { gap: 2 },
  statValue: { fontFamily: SERIF, fontSize: 26, lineHeight: 30, fontWeight: "700" },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    minHeight: 24,
  },
  noticeText: { flexShrink: 1 },
  sound: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 3,
  },
  boardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  board: {
    borderRadius: radius.lg,
    borderWidth: 2,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  empty: { position: "absolute", borderRadius: radius.sm },
  tile: {
    position: "absolute",
    left: 0,
    top: 0,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  pad: { alignSelf: "center", gap: GAP },
  padRow: { flexDirection: "row", gap: GAP, justifyContent: "center" },
  padSpacer: { width: ARROW, height: ARROW },
  padCentre: { width: ARROW, height: ARROW, alignItems: "center", justifyContent: "center" },
  arrow: {
    width: ARROW,
    height: ARROW,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowInk: { fontFamily: SERIF, fontSize: 24, lineHeight: 28, fontWeight: "700" },
  over: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.base,
    gap: space.md,
  },
});
