/**
 * Word Duel — sixty seconds of word making, and the first screen of its own
 * build target (see apps/mobile/targets.mjs: id "word-duel", accent #4f46e5,
 * rewarded ad = hint pack).
 *
 * One rack of letters, one clock, one job: build words. The rack is cut from a
 * real six- or seven-letter word in the list below, so a long word is always
 * there and the round is never impossible — and the rack is only accepted once
 * at least MIN_SOLVABLE words in the list can be made from it. Hints are
 * optional and deliberately scarce; when they run out, a rewarded video tops
 * them up once a round. The round ends on the clock either way.
 *
 * The accent is the game's own colour from the store-listing target, not the
 * tenant brand ramp — same reason as Tap Sprint. Everything else (type scale,
 * spacing, press feedback, dark mode) comes from the shared design system.
 *
 * The word list is a curated common-word list, not a full dictionary: it ships
 * in the bundle so the game is playable offline and with no network at all.
 * Every rack is derived from it, so a word the list does not carry can never be
 * the word a round depends on.
 */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions, type DimensionValue } from "react-native";
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

/** targets.mjs colour for this build target, plus a lighter step that survives
 *  the near-black canvas (indigo #4f46e5 goes to mud on it). */
const ACCENT = { light: "#4f46e5", dark: "#a5b4fc" };

/** Key this game's round records live under in the device score store. */
const GAME = "word-duel";

const ROUND_MS = 60_000;
const TICK_MS = 100;
const MIN_WORD = 3;
const HINTS_PER_ROUND = 3;
const HINT_PACK = 3;

/** How many words the list must be able to make from a candidate rack before it
 *  is used. Below this the rack is a dud and gets re-cut. */
const MIN_SOLVABLE = 6;
const SEED_TRIES = 40;
/** Seeds kept in reserve before a round may reuse one — below this the pool of
 *  unused racks is dry and reusing one beats handing out a dud. */
const FRESH_POOL = 12;

/** Points by word length, shown on the start screen. A word longer than the
 *  rack is impossible, so anything off this table scores nothing. */
const POINTS: Readonly<Record<number, number | undefined>> = {
  3: 30,
  4: 60,
  5: 100,
  6: 150,
  7: 250,
};

type Phase = "ready" | "playing" | "hintAd" | "over";

type Rack = { seed: string; letters: string[]; words: string[] };

type Summary = { score: number; words: number; longest: string; isNewBest: boolean };

/* ── Rack maths ─────────────────────────────────────────────────────────────
   Pure functions over the word list, so the rules a rack obeys can be read
   without reading the screen. */

let setCache: Set<string> | null = null;
function wordSet(): Set<string> {
  if (!setCache) setCache = new Set(WORDS);
  return setCache;
}

let seedCache: string[] | null = null;
function seedWords(): string[] {
  if (!seedCache) seedCache = WORDS.filter((w) => w.length === 6 || w.length === 7);
  return seedCache;
}

/** Can `word` be spelled from these tiles, each tile used at most once? */
function canMake(word: string, letters: string[]): boolean {
  const pool = new Map<string, number>();
  for (const letter of letters) pool.set(letter, (pool.get(letter) ?? 0) + 1);
  for (const ch of word) {
    const left = pool.get(ch) ?? 0;
    if (left === 0) return false;
    pool.set(ch, left - 1);
  }
  return true;
}

/** Every word the list can make from these tiles, longest first. */
function wordsFor(letters: string[]): string[] {
  return WORDS.filter((w) => w.length >= MIN_WORD && canMake(w, letters)).sort(
    (a, b) => b.length - a.length || (a < b ? -1 : 1),
  );
}

function shuffled<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function rackFrom(seed: string): Rack {
  const letters = shuffled(seed.split(""));
  return { seed, letters, words: wordsFor(letters) };
}

/**
 * A rack that carries at least MIN_SOLVABLE words. The shuffle means the seed
 * word is never sitting in order, and `used` keeps a session from handing back
 * the same rack twice while there are fresh seeds left.
 */
function buildRack(used: Set<string>): Rack {
  const fresh = seedWords().filter((w) => !used.has(w));
  const source = fresh.length >= FRESH_POOL ? fresh : seedWords();
  let best = rackFrom(source[0]);
  for (let attempt = 0; attempt < SEED_TRIES; attempt++) {
    const candidate = rackFrom(source[Math.floor(Math.random() * source.length)]);
    if (candidate.words.length >= MIN_SOLVABLE) return candidate;
    if (candidate.words.length > best.words.length) best = candidate;
  }
  // Nothing hit the bar in SEED_TRIES tries: the richest of what we looked at
  // is still a playable rack, and it is always solvable by its own seed word.
  return best;
}

export default function WordDuel() {
  const { c, scheme, elevation } = useTheme();
  const accent = scheme === "dark" ? ACCENT.dark : ACCENT.light;
  const accentTint = alpha(accent, scheme === "dark" ? 0.16 : 0.09);
  const accentEdge = alpha(accent, scheme === "dark" ? 0.42 : 0.3);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const win = useWindowDimensions();

  const columnW = Math.min(win.width - space.base * 2, 520);

  const [phase, setPhase] = useState<Phase>("ready");
  const [msLeft, setMsLeft] = useState(ROUND_MS);
  const [rack, setRack] = useState<Rack | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(HINTS_PER_ROUND);
  const [hintLine, setHintLine] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"ok" | "bad" | "plain">("plain");
  const [packUsed, setPackUsed] = useState(false);
  /** The record as loaded, or updated by the round that just ended. */
  const [record, setRecord] = useState<GameRecord>(EMPTY_RECORD);
  /** False until the device store has answered, so the screen never claims
   *  "no rounds recorded" while it is still reading them. */
  const [recordRead, setRecordRead] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Mirrors for the clock callback: a score read inside a timer closure is a
  // stale score.
  const msRef = useRef(ROUND_MS);
  const scoreRef = useRef(0);
  const foundRef = useRef<string[]>([]);
  const hintedRef = useRef<string[]>([]);
  const usedSeeds = useRef<Set<string>>(new Set());

  const pickedWord = rack ? picked.map((i) => rack.letters[i] ?? "").join("") : "";

  useEffect(() => {
    if (phase !== "playing") return;
    const deadline = Date.now() + msRef.current;
    const id = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      msRef.current = left;
      setMsLeft(left);
      if (left === 0) setPhase("over");
    }, TICK_MS);
    // Re-entering "playing" from the hint offer re-anchors the clock to what was
    // left, which is what holding the clock while the offer is up means.
    return () => clearInterval(id);
  }, [phase]);

  // The device record is read once, on mount: this is the number that survives
  // closing the app, which the old "this session" best did not.
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

  useEffect(() => {
    if (phase !== "over") return;
    const fs = foundRef.current;
    const longest = fs.reduce((a, b) => (b.length > a.length ? b : a), "");
    setSummary({
      score: scoreRef.current,
      words: fs.length,
      longest,
      // Not decided here: the badge is set from the stored record below.
      isNewBest: false,
    });
    const line = fs.length
      ? `${fs.length} ${fs.length === 1 ? "word" : "words"} · longest ${longest.toUpperCase()}`
      : "no words found";
    recordRound(GAME, scoreRef.current, line).then(({ record: next, isNewBest }) => {
      setRecord(next);
      setSummary((prev) => (prev ? { ...prev, isNewBest } : prev));
    });
  }, [phase]);

  function startRound() {
    const next = buildRack(usedSeeds.current);
    usedSeeds.current.add(next.seed);
    msRef.current = ROUND_MS;
    scoreRef.current = 0;
    foundRef.current = [];
    hintedRef.current = [];
    setRack(next);
    setPicked([]);
    setFound([]);
    setScore(0);
    setHints(HINTS_PER_ROUND);
    setHintLine(null);
    setNotice("");
    setNoticeTone("plain");
    setPackUsed(false);
    setSummary(null);
    setMsLeft(ROUND_MS);
    setPhase("playing");
  }

  function pickTile(index: number) {
    if (phase !== "playing") return;
    if (picked.includes(index)) return;
    setPicked([...picked, index]);
    setNotice("");
    setNoticeTone("plain");
  }

  function unpickAt(position: number) {
    if (phase !== "playing") return;
    setPicked(picked.filter((_, i) => i !== position));
  }

  function fail(message: string) {
    setNotice(message);
    setNoticeTone("bad");
  }

  function submit() {
    if (phase !== "playing") return;
    if (pickedWord.length === 0) {
      fail("Tap the letters to build a word.");
      return;
    }
    if (pickedWord.length < MIN_WORD) {
      fail(`${MIN_WORD} letters minimum — that is ${pickedWord.length}.`);
      return;
    }
    if (foundRef.current.includes(pickedWord)) {
      fail(`You already found ${pickedWord.toUpperCase()}.`);
      return;
    }
    if (!wordSet().has(pickedWord)) {
      // Honest about the source of truth: this is a bundled list, not a
      // dictionary, so a real word can be turned away.
      fail(`${pickedWord.toUpperCase()} is not in this game's word list.`);
      return;
    }
    const points = POINTS[pickedWord.length] ?? 0;
    scoreRef.current += points;
    foundRef.current = [pickedWord, ...foundRef.current];
    setScore(scoreRef.current);
    setFound(foundRef.current);
    setPicked([]);
    setHintLine(null);
    setNotice(`+${points} for ${pickedWord.toUpperCase()}`);
    setNoticeTone("ok");
  }

  function takeHint() {
    if (phase !== "playing" || !rack) return;
    if (hints === 0) {
      if (packUsed) fail("No hints left this round. The clock is still running.");
      else setPhase("hintAd");
      return;
    }
    // A hint is one real word the list can make from this rack: its first letter
    // and how long it is. Never the whole word, and never the same one twice.
    const open = rack.words.filter(
      (w) => !foundRef.current.includes(w) && !hintedRef.current.includes(w),
    );
    if (open.length === 0) {
      setNotice("Every word this rack carries from our list is already on your board.");
      setNoticeTone("ok");
      return;
    }
    const target = open.reduce((a, b) => (b.length > a.length ? b : a));
    hintedRef.current = [target, ...hintedRef.current];
    setHints(hints - 1);
    setHintLine(`${target[0].toUpperCase()} ${"_ ".repeat(target.length - 1).trim()}`);
    setNotice(`${target.length} letters, starting with ${target[0].toUpperCase()}.`);
    setNoticeTone("plain");
  }

  function takeHintPack() {
    setPackUsed(true);
    setHints(hints + HINT_PACK);
    setPhase("playing");
  }

  const seconds = (msLeft / 1000).toFixed(1);
  const timeFill = `${((msLeft / ROUND_MS) * 100).toFixed(2)}%` as DimensionValue;
  const notFound = rack ? rack.words.filter((w) => !found.includes(w)).slice(0, 8) : [];

  return (
    <View style={[s.root, { backgroundColor: c.canvas, paddingTop: insets.top + space.sm }]}>
      <View style={[s.column, { maxWidth: columnW }]}>
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
                SIXTY-SECOND ROUND
              </Text>
              <View style={[s.chip, { backgroundColor: accentTint, borderColor: accentEdge }]}>
                <Text variant="caption" style={{ color: accent }}>
                  Free
                </Text>
              </View>
            </View>

            <Text variant="hero">How many words in sixty seconds?</Text>
            <Text variant="lede" tone="ink2">
              One rack of letters, one minute. Build words of three letters or more from the
              tiles, each tile used once per word.
            </Text>

            <View style={s.steps}>
              {[
                "Tap tiles to build a word, tap a chosen letter to put it back",
                "Press check — the word has to be in this game's word list",
                "Sixty seconds on the clock, three hints in your pocket",
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
              <Text variant="title3">What a word is worth</Text>
              {[3, 4, 5, 6, 7].map((len) => (
                <View key={len} style={s.row}>
                  <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                    {len} letters
                  </Text>
                  <Text variant="meta" style={{ color: c.ink }}>
                    {POINTS[len]} points
                  </Text>
                </View>
              ))}
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

        {phase === "playing" || phase === "hintAd" ? (
          <View style={{ gap: space.md }}>
            <View style={s.hud}>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Time
                </Text>
                <Text variant="title1" style={s.tabular}>
                  {seconds}
                </Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Score
                </Text>
                <Text variant="title1">{score}</Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Words
                </Text>
                <Text variant="title1">{found.length}</Text>
              </View>
              <View style={s.hudCell}>
                <Text variant="caption" tone="ink3">
                  Hints
                </Text>
                <Text variant="title1">{hints}</Text>
              </View>
            </View>

            <View style={[s.track, { backgroundColor: c.surfaceInset }]}>
              <View style={[s.fill, { width: timeFill, backgroundColor: accent }]} />
            </View>

            {phase === "playing" && rack ? (
              <>
                <View
                  style={[
                    s.slots,
                    { borderColor: c.hairline, backgroundColor: c.surfaceSunken },
                  ]}
                >
                  {picked.length === 0 ? (
                    <Text variant="meta" tone="ink3">
                      Tap the letters below to build a word
                    </Text>
                  ) : (
                    picked.map((tileIndex, position) => (
                      <Press
                        key={`${tileIndex}-${position}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Put back ${rack.letters[tileIndex]}`}
                        haptic="light"
                        onPress={() => unpickAt(position)}
                        style={[s.slot, { backgroundColor: c.surfaceRaised, borderColor: accent }]}
                      >
                        <Text variant="title3" style={{ color: accent }}>
                          {(rack.letters[tileIndex] ?? "").toUpperCase()}
                        </Text>
                      </Press>
                    ))
                  )}
                </View>

                <View style={s.noticeRow}>
                  <Text
                    variant="meta"
                    tone={noticeTone === "bad" ? "critical" : noticeTone === "ok" ? "positive" : "ink2"}
                  >
                    {notice}
                  </Text>
                </View>

                {hintLine ? (
                  <View
                    style={[s.hintBox, { backgroundColor: accentTint, borderColor: accentEdge }]}
                  >
                    <Text variant="caption" style={{ color: accent }}>
                      Hint
                    </Text>
                    <Text variant="title2" style={{ color: accent }}>
                      {hintLine}
                    </Text>
                  </View>
                ) : null}

                <View style={s.rack}>
                  {rack.letters.map((letter, index) => {
                    const used = picked.includes(index);
                    return (
                      <Press
                        key={`${letter}-${index}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Letter ${letter}`}
                        accessibilityState={{ selected: used, disabled: used }}
                        disabled={used}
                        haptic="light"
                        onPress={() => pickTile(index)}
                        style={[
                          s.tile,
                          {
                            backgroundColor: used ? c.surfaceSunken : c.surfaceRaised,
                            borderColor: used ? c.hairline : accent,
                          },
                        ]}
                      >
                        <Text
                          variant="title2"
                          style={{ color: used ? c.ink4 : accent }}
                        >
                          {letter.toUpperCase()}
                        </Text>
                      </Press>
                    );
                  })}
                </View>

                <View style={s.actions}>
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel="Clear the word"
                    disabled={picked.length === 0}
                    onPress={() => setPicked([])}
                    style={[
                      s.secondary,
                      { borderColor: c.hairlineStrong },
                      picked.length === 0 ? { opacity: 0.5 } : null,
                    ]}
                  >
                    <Text variant="callout" tone="ink2">
                      Clear
                    </Text>
                  </Press>
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel={`Hint, ${hints} left`}
                    onPress={takeHint}
                    style={[
                      s.secondary,
                      { borderColor: accentEdge, backgroundColor: accentTint },
                    ]}
                  >
                    <Text variant="callout" style={{ color: accent }}>
                      Hint · {hints} left
                    </Text>
                  </Press>
                </View>

                <Press
                  accessibilityRole="button"
                  accessibilityLabel="Check the word"
                  haptic="medium"
                  onPress={submit}
                  style={[
                    s.primary,
                    elevation(2),
                    { backgroundColor: accent, shadowColor: accent, shadowOpacity: 0.35 },
                  ]}
                >
                  <Text variant="title3" style={s.primaryLabel}>
                    Check
                  </Text>
                </Press>

                {found.length > 0 ? (
                  <View style={{ gap: space.xs }}>
                    <Text variant="caption" tone="ink3">
                      Found · newest first
                    </Text>
                    {/* Bounded: a sixty-second round can find a lot of words, and
                        this screen does not scroll, so the log gets a fixed
                        window instead of pushing the buttons off the phone. */}
                    <View style={s.found}>
                      {found.map((w) => (
                        <View
                          key={w}
                          style={[
                            s.foundChip,
                            { backgroundColor: accentTint, borderColor: accentEdge },
                          ]}
                        >
                          <Text variant="meta" style={{ color: accent }}>
                            {w.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}

            {phase === "hintAd" ? (
              <View style={{ gap: space.md }}>
                <Text variant="title2">Hints used up</Text>
                <Text variant="body" tone="ink2">
                  {seconds}s left and {score} points on the board. The clock is held while this
                  is on screen — take the pack or carry on without it.
                </Text>
                <AdSlot
                  accent={accent}
                  title="Rewarded ad — hint pack"
                  reward={`+${HINT_PACK} hints, once per round`}
                  cta={`Watch ad for ${HINT_PACK} hints`}
                  onReward={takeHintPack}
                  onDismiss={() => setPhase("playing")}
                  dismissLabel="Back to the letters"
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === "over" ? (
          <View style={{ gap: space.base }}>
            <View style={s.head}>
              <Text variant="hero">Time.</Text>
              {summary?.isNewBest ? <Badge tone="positive" label="New best" /> : null}
            </View>

            {summary ? (
              <Card style={{ padding: space.base, gap: space.sm }}>
                <View style={s.row}>
                  <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                    Score
                  </Text>
                  <Text variant="meta" style={{ color: c.ink }}>
                    {summary.score}
                  </Text>
                </View>
                <View style={s.row}>
                  <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                    Words found
                  </Text>
                  <Text variant="meta" style={{ color: c.ink }}>
                    {summary.words}
                  </Text>
                </View>
                <View style={s.row}>
                  <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                    Longest word
                  </Text>
                  <Text variant="meta" style={{ color: c.ink }}>
                    {summary.longest ? summary.longest.toUpperCase() : "—"}
                  </Text>
                </View>
                <View style={s.row}>
                  <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                    Best score on this device
                  </Text>
                  <Text variant="meta" style={{ color: c.ink }}>
                    {record.best}
                  </Text>
                </View>
                <View style={s.row}>
                  <Text variant="meta" tone="ink2" style={{ flex: 1 }}>
                    Rounds played on this device
                  </Text>
                  <Text variant="meta" style={{ color: c.ink }}>
                    {record.rounds}
                  </Text>
                </View>
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

            {notFound.length > 0 ? (
              <Card style={{ padding: space.base, gap: space.sm }}>
                <Text variant="title3">Still on the rack</Text>
                <Text variant="meta" tone="ink2">
                  Words this game&apos;s list carries for that rack, longest first:
                </Text>
                <Text variant="callout" style={{ color: accent }}>
                  {notFound.map((w) => w.toUpperCase()).join("  ·  ")}
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

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.base },
  column: { width: "100%", alignSelf: "center", gap: space.base },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -space.sm,
  },
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
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { flex: 1 },
  primary: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: { color: "#fff" },
  secondary: {
    minHeight: 44,
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  centre: { textAlign: "center" },
  hud: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  hudCell: { gap: 2 },
  tabular: { fontVariant: ["tabular-nums"] },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
  slots: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexWrap: "wrap",
  },
  slot: {
    width: 40,
    height: 44,
    borderWidth: 1.5,
    borderRadius: radius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeRow: { minHeight: 20, justifyContent: "center" },
  hintBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.xs,
    alignItems: "center",
  },
  rack: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center" },
  tile: {
    width: 46,
    height: 56,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: space.sm },
  found: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    maxHeight: 102,
    overflow: "hidden",
  },
  foundChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 5,
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

/* ── The word list ──────────────────────────────────────────────────────────
   Common English words of three to seven letters. It lives at the bottom of the
   file because it is data, not logic: the rack builders above are what a reader
   needs to understand the game. Anything added here immediately becomes a
   buildable word and a candidate rack seed; anything misspelled becomes a word
   that can never be scored, so keep it alphabetical inside each block. */

const WORDS: string[] = [
  // ── three ──
  "act", "add", "age", "ago", "aid", "aim", "air", "ale", "all", "and", "ant", "any",
  "ape", "apt", "arc", "are", "arm", "art", "ash", "ask", "ate", "awe", "axe", "bad",
  "bag", "ban", "bar", "bat", "bay", "bed", "bee", "beg", "bet", "bid", "big", "bit",
  "boa", "bob", "bog", "bow", "box", "boy", "bud", "bug", "bun", "bus", "but", "buy",
  "cab", "cam", "can", "cap", "car", "cat", "cob", "cod", "cog", "cop", "cot", "cow",
  "cry", "cub", "cue", "cup", "cut", "dab", "dad", "dam", "day", "den", "dew", "did",
  "die", "dig", "dim", "dip", "dog", "dot", "dry", "due", "dug", "duo", "dye", "ear",
  "eat", "ebb", "eel", "egg", "ego", "elf", "elk", "elm", "end", "era", "eve", "eye",
  "fad", "fan", "far", "fat", "fee", "few", "fib", "fig", "fin", "fir", "fit", "fix",
  "fly", "foe", "fog", "for", "fox", "fry", "fun", "fur", "gal", "gap", "gas", "gel",
  "gem", "get", "gin", "got", "gum", "gun", "gut", "guy", "gym", "had", "ham", "has",
  "hat", "hay", "hem", "hen", "her", "hid", "him", "hip", "his", "hit", "hoe", "hog",
  "hop", "hot", "how", "hub", "hue", "hug", "hum", "hut", "ice", "icy", "ill", "ink",
  "inn", "its", "ivy", "jab", "jam", "jar", "jaw", "jet", "job", "jog", "jot", "joy",
  "jug", "keg", "key", "kid", "kin", "kit", "lab", "lad", "lag", "lap", "law", "lay",
  "led", "leg", "let", "lid", "lie", "lip", "lit", "lob", "log", "lot", "low", "mad",
  "man", "map", "mat", "men", "met", "mix", "mob", "mop", "mud", "mug", "nag", "nap",
  "net", "new", "nil", "nip", "nod", "not", "now", "nun", "nut", "oak", "oar", "oat",
  "odd", "ode", "off", "oil", "old", "one", "ore", "our", "out", "owe", "owl", "own",
  "pad", "pal", "pan", "pat", "paw", "pay", "pea", "peg", "pen", "pet", "pie", "pig",
  "pin", "pit", "pod", "pop", "pot", "pry", "pub", "pun", "pup", "put", "rag", "ram",
  "ran", "rap", "rat", "raw", "ray", "red", "rib", "rid", "rig", "rim", "rip", "rob",
  "rod", "rot", "row", "rub", "rug", "rum", "run", "sad", "sag", "sap", "sat", "saw",
  "say", "sea", "see", "set", "sew", "she", "shy", "sip", "sir", "sit", "six", "ski",
  "sky", "sly", "sob", "sow", "soy", "spa", "spy", "sub", "sue", "sum", "sun", "tab",
  "tag", "tan", "tap", "tar", "tax", "tea", "ten", "the", "tie", "tin", "tip", "toe",
  "ton", "too", "top", "tow", "toy", "try", "tub", "tug", "two", "use", "van", "vat",
  "vet", "via", "vow", "wag", "war", "was", "wax", "way", "web", "wed", "wet", "who",
  "why", "wig", "win", "wit", "woe", "wok", "won", "wow", "yak", "yam", "yes", "yet",
  "you", "zap", "zip", "zoo",

  // ── four ──
  "able", "ache", "acid", "acre", "also", "arch", "area", "army", "away", "baby",
  "back", "bake", "bald", "ball", "band", "bank", "bare", "bark", "barn", "base",
  "bath", "bead", "beak", "beam", "bean", "bear", "beat", "beef", "been", "beer",
  "bell", "belt", "bend", "best", "bike", "bill", "bird", "bite", "blue", "boat",
  "body", "boil", "bold", "bolt", "bomb", "bond", "bone", "book", "boot", "bore",
  "born", "boss", "both", "bowl", "brew", "bulb", "bulk", "bull", "burn", "bury",
  "bush", "busy", "cage", "cake", "calf", "call", "calm", "came", "camp", "cane",
  "cape", "card", "care", "cart", "case", "cash", "cast", "cave", "cell", "cent",
  "chat", "chef", "chew", "chin", "chip", "chop", "city", "clam", "clap", "claw",
  "clay", "clip", "club", "clue", "coal", "coat", "code", "coin", "cold", "comb",
  "come", "cone", "cook", "cool", "cope", "copy", "cord", "core", "corn", "cost",
  "cove", "crab", "crew", "crop", "crow", "cube", "cure", "curl", "cute", "dare",
  "dark", "dart", "dash", "data", "date", "dead", "deaf", "deal", "dear", "debt",
  "deck", "deed", "deep", "deer", "desk", "dial", "dice", "diet", "dime", "dine",
  "dirt", "dish", "disk", "dive", "dock", "dome", "done", "doom", "door", "dose",
  "dove", "down", "drag", "draw", "drew", "drip", "drop", "drum", "duck", "dull",
  "dumb", "dusk", "dust", "duty", "each", "earn", "ease", "east", "easy", "echo",
  "edge", "envy", "even", "ever", "evil", "exam", "exit", "face", "fact", "fade",
  "fail", "fair", "fake", "fall", "fame", "farm", "fast", "fate", "fear", "feed",
  "feel", "feet", "fell", "felt", "feud", "file", "fill", "film", "find", "fine",
  "fire", "firm", "fish", "fist", "five", "flag", "flat", "flaw", "flea", "flee",
  "flew", "flip", "flow", "foam", "foil", "fold", "folk", "food", "fool", "foot",
  "fork", "form", "fort", "four", "free", "frog", "from", "fuel", "full", "fund",
  "fuse", "gain", "game", "gang", "gate", "gave", "gaze", "gear", "gene", "gift",
  "girl", "give", "glad", "glow", "glue", "goal", "goat", "gold", "golf", "gone",
  "good", "grab", "gram", "gray", "grew", "grey", "grid", "grim", "grin", "grip",
  "grow", "gulf", "gush", "hall", "halt", "hand", "hang", "hard", "hare", "harm",
  "harp", "hate", "haul", "have", "hawk", "haze", "head", "heal", "heap", "hear",
  "heat", "heel", "held", "helm", "help", "herb", "herd", "here", "hero", "hide",
  "high", "hike", "hill", "hint", "hire", "hive", "hold", "hole", "holy", "home",
  "hood", "hoof", "hook", "hoop", "hope", "horn", "hose", "host", "hour", "huge",
  "hunt", "hurt", "hush", "icon", "idea", "idle", "inch", "into", "iron", "item",
  "jail", "jazz", "jeep", "jerk", "jest", "join", "joke", "jump", "junk", "jury",
  "just", "keen", "keep", "kept", "kick", "kind", "king", "kiss", "kite", "knee",
  "knit", "knob", "knot", "know", "lace", "lack", "laid", "lake", "lamb", "lame",
  "lamp", "land", "lane", "last", "late", "lava", "lawn", "lazy", "lead", "leaf",
  "leak", "lean", "leap", "left", "lend", "lens", "less", "liar", "lick", "life",
  "lift", "like", "lime", "limp", "line", "link", "lion", "list", "live", "load",
  "loaf", "loan", "lock", "logo", "lone", "long", "look", "loop", "lord", "lose",
  "loss", "lost", "loud", "love", "luck", "lump", "lung", "lush", "made", "mail",
  "main", "make", "male", "mall", "mane", "many", "mark", "mask", "mass", "mast",
  "mate", "maze", "meal", "mean", "meat", "meek", "meet", "melt", "memo", "mend",
  "menu", "mesh", "mess", "mice", "mild", "mile", "milk", "mill", "mind", "mine",
  "mint", "mist", "mode", "mold", "mole", "monk", "mood", "moon", "more", "moss",
  "most", "moth", "move", "much", "mule", "mute", "myth", "nail", "name", "navy",
  "near", "neat", "neck", "need", "nest", "news", "next", "nice", "nine", "node",
  "none", "noon", "norm", "nose", "note", "noun", "numb", "oath", "obey", "odor",
  "okay", "omit", "once", "only", "onto", "open", "oral", "oven", "over", "pace",
  "pack", "pact", "page", "paid", "pail", "pain", "pair", "pale", "palm", "pane",
  "pant", "park", "part", "pass", "past", "path", "pave", "peak", "pear", "peel",
  "peer", "pest", "pick", "pier", "pile", "pill", "pine", "pink", "pipe", "plan",
  "play", "plea", "plot", "plow", "plug", "plum", "plus", "poem", "poet", "pole",
  "poll", "pond", "pony", "pool", "poor", "pope", "pork", "port", "pose", "post",
  "pour", "pray", "prey", "prop", "pull", "pulp", "pump", "pure", "push", "quit",
  "quiz", "race", "rack", "raft", "rage", "raid", "rail", "rain", "rake", "ramp",
  "rang", "rank", "rant", "rare", "rash", "rate", "rave", "read", "real", "reap",
  "rear", "reed", "reef", "reel", "rely", "rent", "rest", "rice", "rich", "ride",
  "ring", "riot", "ripe", "rise", "risk", "road", "roam", "roar", "robe", "rock",
  "rode", "role", "roll", "roof", "room", "root", "rope", "rose", "rosy", "rude",
  "ruin", "rule", "rung", "rush", "rust", "sack", "safe", "sage", "said", "sail",
  "sale", "salt", "same", "sand", "sane", "sang", "sank", "save", "scan", "scar",
  "seal", "seam", "seat", "seed", "seek", "seem", "seen", "seep", "self", "sell",
  "send", "sent", "shed", "ship", "shoe", "shop", "shot", "show", "shut", "sick",
  "side", "sift", "sigh", "sign", "silk", "sing", "sink", "site", "size", "skim",
  "skin", "skip", "slam", "slap", "sled", "slid", "slim", "slip", "slit", "slot",
  "slow", "slug", "snap", "snow", "soak", "soap", "soar", "sock", "soda", "sofa",
  "soft", "soil", "sold", "sole", "some", "song", "soon", "sort", "soul", "soup",
  "sour", "span", "spin", "spit", "spot", "spun", "stab", "star", "stay", "stem",
  "step", "stew", "stir", "stop", "stub", "stud", "suit", "sung", "sunk", "sure",
  "surf", "swan", "swap", "sway", "swim", "tail", "take", "tale", "talk", "tall",
  "tame", "tank", "tape", "task", "team", "tear", "tell", "tend", "tent", "term",
  "test", "text", "than", "that", "thaw", "them", "then", "they", "thin", "this",
  "thus", "tide", "tidy", "tier", "tile", "tilt", "time", "tiny", "tire", "toad",
  "toll", "tomb", "tone", "tool", "torn", "toss", "tour", "town", "trap", "tray",
  "tree", "trek", "trim", "trio", "trip", "true", "tube", "tune", "turf", "turn",
  "twin", "type", "ugly", "undo", "unit", "upon", "urge", "used", "user", "vase",
  "vast", "veil", "vein", "verb", "very", "vest", "veto", "vibe", "vice", "view",
  "vine", "visa", "vote", "wade", "wage", "wait", "wake", "walk", "wall", "wand",
  "want", "ward", "warm", "warn", "wash", "wasp", "wave", "wavy", "weak", "wear",
  "weed", "week", "weep", "well", "went", "were", "west", "what", "when", "whim",
  "whip", "whom", "wide", "wife", "wild", "will", "wind", "wine", "wing", "wink",
  "wipe", "wire", "wise", "wish", "with", "wolf", "wood", "wool", "word", "wore",
  "work", "worm", "worn", "wrap", "yard", "yarn", "yawn", "year", "yell", "yoga",
  "yoke", "your", "zeal", "zero", "zest", "zinc", "zone", "zoom",

  // ── five ──
  "about", "above", "actor", "adopt", "adult", "after", "again", "agent", "agree",
  "ahead", "alarm", "album", "alert", "alive", "allow", "alone", "along", "alter",
  "among", "anger", "angle", "angry", "ankle", "apart", "apple", "apply", "arena",
  "argue", "arise", "armor", "aroma", "array", "arrow", "aside", "asset", "avoid",
  "awake", "award", "aware", "badge", "basic", "basin", "batch", "beach", "beard",
  "beast", "began", "begin", "being", "below", "bench", "berry", "birth", "black",
  "blade", "blame", "blank", "blast", "blaze", "bleak", "blend", "bless", "blind",
  "block", "bloom", "blunt", "bonus", "boost", "booth", "bound", "brain", "brand",
  "brass", "brave", "bread", "break", "breed", "brick", "bride", "brief", "bring",
  "brisk", "broad", "broke", "brown", "brush", "build", "built", "bunch", "burst",
  "cabin", "cable", "camel", "canal", "candy", "canoe", "carry", "carve", "catch",
  "cause", "chain", "chair", "chalk", "charm", "chart", "chase", "cheap", "cheat",
  "check", "cheek", "cheer", "chess", "chest", "chief", "child", "chill", "chose",
  "chunk", "civil", "claim", "clash", "class", "clean", "clear", "clerk", "click",
  "cliff", "climb", "clock", "close", "cloth", "cloud", "coach", "coast", "cocoa",
  "color", "comet", "comic", "coral", "couch", "cough", "could", "count", "court",
  "cover", "crack", "craft", "crane", "crash", "crate", "crawl", "crazy", "cream",
  "creek", "creep", "crest", "crime", "crisp", "cross", "crowd", "crown", "crude",
  "cruel", "crush", "crust", "curve", "cycle",

  // ── six ──
  "absent", "accent", "accept", "access", "accuse", "across", "action", "active",
  "actual", "adjust", "admire", "admit", "advice", "affect", "afford", "afraid",
  "agency", "agenda", "almost", "always", "amount", "animal", "annual", "answer",
  "anyone", "appeal", "appear", "around", "arrest", "arrive", "artist", "aspect",
  "assess", "assign", "assist", "assume", "assure", "attach", "attack", "attend",
  "author", "autumn", "avenue", "ballot", "banana", "banner", "barrel", "basket",
  "battle", "beauty", "become", "before", "behalf", "behave", "behind", "belief",
  "belong", "benefit", "beside", "better", "beyond", "bitter", "bother", "bottle",
  "bottom", "bounce", "branch", "breach", "breath", "breeze", "bridge", "bright",
  "broken", "bronze", "bubble", "bucket", "buffet", "bullet", "bundle", "burden",
  "butter", "button", "camera", "campus", "candle", "canvas", "canyon", "carbon",
  "career", "carpet", "carrot", "casino", "castle", "casual", "caught", "cattle",
  "cellar", "cement", "center", "cereal", "chance", "change", "charge", "cheese",
  "cherry", "chosen", "church", "cinema", "circle", "circus", "client", "coffee",
  "collar", "colony", "column", "combat", "comedy", "commit", "common", "cookie",
  "copper", "corner", "cotton", "county", "couple", "course", "cousin", "create",
  "credit", "crisis", "critic", "custom", "danger", "dealer", "debate", "decade",
  "decent", "decide", "defeat", "defend", "define", "degree", "delete", "demand",
  "depart", "depend", "desert", "design", "desire", "detail", "detect", "device",
  "dinner", "direct", "doctor", "dollar", "domain", "donate", "double", "dragon",
  "drawer", "driver", "during", "easily", "editor", "effect", "effort", "either",
  "eleven", "emerge", "empire", "employ", "enable", "ending", "energy", "engage",
  "engine", "enough", "ensure", "entire", "escape", "estate", "exceed", "except",
  "excess", "excuse", "exotic", "expand", "expect", "expert", "expire", "export",
  "extend", "extent", "fabric", "factor", "family", "famous", "father", "fellow",
  "female", "figure", "filter", "finger", "finish", "flavor", "flight", "flower",
  "follow", "forbid", "forest", "forget", "formal", "format", "former", "fossil",
  "foster", "friend", "frozen", "future", "gallon", "garden", "garlic", "gather",
  "gender", "gentle", "global", "golden", "gospel", "gossip", "govern", "ground",
  "growth", "guilty", "happen", "harbor", "health", "heaven", "height", "helmet",
  "hidden", "honest", "horror", "hunger", "hungry", "hunter", "impact", "import",
  "impose", "income", "indeed", "indoor", "inform", "inject", "injury", "inside",
  "insist", "intend", "invest", "invite", "island", "itself", "jacket", "jungle",
  "junior", "keeper", "kettle", "kidney", "killer", "kitten", "ladder", "laptop",
  "lately", "latest", "launch", "lawyer", "leader", "league", "likely", "liquid",
  "listen", "little", "lively", "living", "lonely", "longer", "lovely", "luxury",
  "making", "manage", "manner", "margin", "marine", "market", "marble", "master",
  "matter", "mature", "medium", "member", "memory", "mental", "mentor", "merger",
  "method", "middle", "mighty", "minute", "mirror", "mobile", "modern", "modest",
  "moment", "monkey", "mortal", "mother", "motion", "motive", "museum", "mutual",
  "myself", "narrow", "nation", "native", "nature", "nearby", "nearly", "nephew",
  "nickel", "ninety", "nobody", "notion", "number", "object", "obtain", "occupy",
  "offend", "office", "offset", "online", "option", "orange", "origin", "orphan",
  "outfit", "output", "oxygen", "parade", "parcel", "pardon", "parent", "partly",
  "patent", "patrol", "peanut", "pencil", "people", "pepper", "period", "permit",
  "person", "phrase", "picnic", "pillar", "pillow", "pirate", "pistol", "planet",
  "player", "plenty", "pocket", "poetry", "police", "policy", "polish", "popular",
  "portal", "poster", "potato", "powder", "praise", "prayer", "prefer", "pretty",
  "prince", "prison", "profit", "prompt", "proper", "public", "pursue", "puzzle",
  "rabbit", "radius", "random", "rarely", "rather", "rating", "reader", "reason",
  "recall", "recent", "record", "reduce", "reform", "refuse", "regard", "regime",
  "region", "regret", "reject", "relate", "relief", "remain", "remark", "remind",
  "remote", "remove", "rental", "repair", "repeat", "replay", "report", "rescue",
  "resist", "resort", "result", "resume", "retail", "retain", "retire", "return",
  "reveal", "review", "reward", "rhythm", "ribbon", "rising", "ritual", "robust",
  "rocket", "rotten", "rubber", "rugged", "ruling", "runner", "sacred", "safety",
  "salary", "salmon", "sample", "saving", "scheme", "school", "scrape", "script",
  "season", "second", "secret", "sector", "secure", "select", "senate", "senior",
  "series", "settle", "severe", "shadow", "shelter", "shield", "shrimp", "shrink",
  "signal", "silent", "silver", "simple", "simply", "singer", "single", "sister",
  "slight", "smooth", "social", "socket", "soccer", "source", "speech", "spirit",
  "sponge", "spouse", "spread", "spring", "sprint", "square", "squash", "stable",
  "starve", "statue", "status", "steady", "sticky", "stolen", "strain", "street",
  "stress", "strict", "strike", "string", "strive", "strong", "struck", "studio",
  "stupid", "submit", "subtle", "suburb", "sudden", "suffer", "summer", "summit",
  "supply", "survey", "switch", "symbol", "system", "tackle", "tailor", "talent",
  "target", "taught", "temple", "tender", "tennis", "terror", "thanks", "theory",
  "thirty", "though", "threat", "throne", "ticket", "timber", "tissue", "tongue",
  "toward", "tragic", "travel", "treaty", "triple", "trophy", "trying", "twelve",
  "twenty", "unable", "unique", "united", "unless", "unlike", "update", "useful",
  "valley", "vanish", "vendor", "victim", "viewer", "village", "virtue", "vision",
  "visual", "volume", "voyage", "wallet", "wander", "wealth", "weapon", "weekly",
  "weight", "window", "winner", "winter", "wisdom", "wonder", "wooden", "worker",
  "writer", "yellow",

  // ── seven ──
  "ability", "absence", "academy", "account", "achieve", "acquire", "address",
  "advance", "airline", "airport", "alcohol", "already", "ancient", "another",
  "anxiety", "applied", "appoint", "approve", "arrange", "article", "attempt",
  "attract", "auction", "average", "awesome", "balance", "bargain", "battery",
  "because", "bedroom", "believe", "billion", "biology", "blanket", "brother",
  "cabinet", "capital", "captain", "caption", "capture", "careful", "carrier",
  "caution", "ceiling", "central", "century", "chamber", "chapter", "charter",
  "chicken", "circuit", "citizen", "climate", "collect", "college", "comfort",
  "command", "comment", "company", "compare", "compete", "complex", "concept",
  "concern", "confirm", "connect", "consent", "consist", "contact", "contain",
  "content", "contest", "context", "control", "convert", "correct", "cottage",
  "council", "counter", "country", "courage", "crystal", "culture", "curious",
  "current", "declare", "decline", "default", "defense", "deliver", "desktop",
  "despite", "destiny", "develop", "digital", "discuss", "disease", "display",
  "dispute", "distant", "diverse", "drawing", "economy", "edition", "educate",
  "elderly", "element", "embrace", "emotion", "empower", "endless", "enhance",
  "episode", "essence", "evening", "exactly", "examine", "example", "exhibit",
  "expense", "explain", "explore", "express", "extreme", "failure", "fashion",
  "feature", "federal", "fiction", "fifteen", "fighter", "finding", "foreign",
  "forever", "formula", "fortune", "forward", "freedom", "funding", "gallery",
  "gateway", "general", "genetic", "genuine", "gesture", "gradual", "graphic",
  "gravity", "greater", "grocery", "growing", "handful", "happily", "harmony",
  "heading", "healthy", "heavily", "highway", "history", "holiday", "horizon",
  "however", "hundred", "husband", "imagine", "immense", "improve", "include",
  "initial", "inquiry", "insight", "install", "instant", "instead", "intense",
  "invalid", "involve", "journey", "justice", "justify", "kingdom", "landing",
  "largely", "leading", "leather", "lecture", "liberal", "liberty", "library",
  "license", "limited", "machine", "manager", "mankind", "massive", "meaning",
  "measure", "medical", "meeting", "mention", "message", "million", "mineral",
  "minimum", "mistake", "mixture", "monitor", "morning", "mystery", "natural",
  "neither", "network", "neutral", "nothing", "notable", "nuclear", "obvious",
  "offense", "operate", "opinion", "organic", "outcome", "outdoor", "overall",
  "package", "partial", "partner", "passage", "passion", "patient", "pattern",
  "payment", "penalty", "pending", "pension", "percent", "perfect", "perform",
  "perhaps", "persist", "picture", "pioneer", "plastic", "portion", "poverty",
  "predict", "premium", "prepare", "present", "prevent", "primary", "printer",
  "private", "problem", "process", "produce", "product", "profile", "program",
  "project", "promote", "propose", "protect", "protein", "protest", "provide",
  "publish", "purpose", "qualify", "quarter", "quickly", "quietly", "radical",
  "railway", "rapidly", "reality", "realize", "receipt", "receive", "recover",
  "reflect", "refresh", "regular", "related", "release", "replace", "require",
  "reserve", "resolve", "respect", "respond", "restore", "retreat", "revenue",
  "reverse", "routine", "roughly", "running", "satisfy", "scholar", "science",
  "scratch", "section", "seeking", "segment", "serious", "service", "session",
  "setting", "seventh", "several", "silence", "similar", "sitting", "speaker",
  "special", "sponsor", "station", "storage", "stretch", "student", "subject",
  "succeed", "success", "suggest", "summary", "support", "suppose", "surface",
  "surgeon", "surplus", "survive", "suspect", "sustain", "teacher", "theater",
  "therapy", "thought", "through", "tonight", "totally", "traffic", "tragedy",
  "trainer", "transit", "trouble", "turning", "typical", "uniform", "unknown",
  "unusual", "usually", "variety", "vehicle", "venture", "version", "veteran",
  "victory", "violent", "visible", "waiting", "walking", "weather", "weekend",
  "welcome", "western", "whether", "willing", "without", "witness", "working",
  "writing", "written",
];
