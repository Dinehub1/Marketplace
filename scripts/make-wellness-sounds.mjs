#!/usr/bin/env node
/**
 * make-wellness-sounds.mjs — every sound the six wellness screens play, synthesized here.
 *
 * ── Why generated, and not downloaded or recorded ─────────────────────────────────────
 *
 * Three reasons, in order of how much they cost when ignored:
 *
 *   1. **Licence.** A wellness app that ships a chime from an unknown source has a claim on
 *      it that nobody can answer. Everything here is arithmetic on an array: the recipe is
 *      this file, it is ours outright, and that is a fact a reviewer can check by reading it.
 *   2. **Size.** These are 22,050 Hz mono 16-bit WAVs, a few tens of kilobytes each. The whole
 *      set of cues is smaller than one stock "meditation bell" MP3 and needs no attribution.
 *   3. **Consistency.** Twenty cue sounds across six screens share one palette — a warm
 *      triangle body, a breath of band-passed noise, a soft attack. Change `PALETTE` and every
 *      screen's voice changes together, instead of six screens drifting into six apps.
 *
 * ── The palette, and the one rule it obeys ────────────────────────────────────────────
 *
 * This is a *wellness* palette, not the chiptune one in `make-game-sounds.mjs`: no square
 * wave, no fast decay, no blip. Sine and triangle bodies, 20–60 ms attacks, long releases,
 * and a band of filtered noise on anything that represents breath. A cue that startles is a
 * cue that made someone breathe faster.
 *
 * The rule: **nothing rises in pitch at a hold, and nothing falls at a start.** Rising reads
 * as "draw in", falling as "let go" — the two directions the screen already animates in. A
 * cue that contradicts the animation is worse than no cue.
 *
 * ── What this set is, after the voice was removed ──────────────────────────────────────
 *
 * Fourteen cues and one bed. There was a spoken layer over the top of them and it was removed for
 * being robotic and unclear on a real phone — the reasoning, and what replaced it, is in the note
 * further down this file. The short version: the tones already carried the instruction, and the
 * three things they could not say were given their own cues.
 *
 * Output:  apps/mobile/assets/wellness/  (15 files, .wav each)
 *   cue-in  cue-out  cue-hold  cue-done  cue-tick  cue-relax  cue-interval
 *   cue-fast  cue-easy  cue-last  cue-drop  cue-bead  cue-round  cue-swell
 *   drone
 *
 * Usage:  node scripts/make-wellness-sounds.mjs
 * Exit:   0 written, 1 something could not be rendered
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RATE,
  envelope,
  highpass,
  interleave,
  limit,
  loopable,
  lowpass,
  mixInto,
  noise,
  normalize,
  peak,
  rms,
  wav,
} from './lib/wav.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'apps', 'mobile', 'assets', 'wellness');

const ms = (n) => Math.round((n / 1000) * RATE);

/* ── The palette ─────────────────────────────────────────────────────────────────────────
   One place for the character of every cue. `body` is how much triangle is mixed under the
   sine: pure sine is too pure to hear as an instrument, and a triangle alone is buzzy.       */

const PALETTE = {
  body: 0.22,        // triangle blended under the sine
  attackMs: 22,      // nothing in this app starts instantly
  air: 0.16,         // the band-passed noise that reads as breath, not as hiss
  quiet: 0.62,       // peak a cue is normalised to, so "softer than the others" is expressible
};

/**
 * One tone, with an optional frequency sweep.
 *
 * `phase` is accumulated rather than computed as `sin(2πft)`: a swept tone has no single
 * frequency, and a phase accumulator is what keeps the waveform continuous while it moves.
 */
function tone({
  from,
  to = from,
  ms: durMs,
  gain = 1,
  wave = 'sine',
  attack = PALETTE.attackMs,
  hold = 0.5,
  decay = durMs * 0.3,
  release = durMs * 0.35,
}) {
  const n = ms(durMs);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = from * Math.pow(to / from, t); // exponential sweep: musical, not linear
    phase += freq / RATE;
    if (phase >= 1) phase -= 1;
    const sine = Math.sin(2 * Math.PI * phase);
    // Triangle from the same phase. Blended rather than switched, so a tone has one timbre.
    const tri = 4 * Math.abs(phase - 0.5) - 1;
    const sample = wave === 'tri' ? tri : sine * (1 - PALETTE.body) + tri * PALETTE.body;
    out[i] = sample * gain;
  }
  return envelope(out, { attackMs: attack, decayMs: decay, releaseMs: release, hold });
}

/**
 * A band of filtered noise — the sound of air moving.
 *
 * Used two ways: as the layer under a breath cue, and on its own as a fricative-ish texture.
 * `centre` is where the band sits: a low band (500 Hz) is a soft "haa", a high one (3 kHz) is
 * closer to a whisper.
 */
function breath({ ms: durMs, centre = 1200, width = 2.2, gain = 1, tilt = 0.03, seed = 7 }) {
  const n = ms(durMs);
  const rand = noise(seed);
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = rand() * 2 - 1;
  // Two one-pole passes around the band: high-pass below, low-pass above. Cheaper than a
  // biquad and, for noise, indistinguishable.
  highpass(raw, centre / width);
  lowpass(raw, centre * width);
  // A slow amplitude drift so the noise does not sit perfectly still, which reads as static.
  for (let i = 0; i < n; i++) {
    const t = i / n;
    raw[i] *= gain * (1 - tilt + tilt * Math.sin(2 * Math.PI * 3 * t));
  }
  return raw;
}

/** Place parts in time on one timeline. The mixer every compound cue is assembled with. */
function timeline(totalMs, parts) {
  const out = new Float32Array(ms(totalMs));
  for (const { at, samples } of parts) mixInto(out, samples, ms(at));
  return out;
}

/** A soft two-or-three note figure: a plucked string, not a fanfare. */
function chime(notes, opts = {}) {
  return timeline(
    opts.totalMs ?? notes.reduce((s, n) => s + n.ms * 0.8, 0) + 400,
    notes.map((n, i) => ({
      at: n.at ?? i * (n.ms * 0.72),
      samples: tone({ ...n, gain: opts.gain ?? 0.55, hold: 0.34, attack: 14, release: n.ms * 0.6 }),
    })),
  );
}

/* ── The cues ────────────────────────────────────────────────────────────────────────────
   Each entry says what the screen does at that moment and why the sound has the shape it
   has. The `why` is the part worth keeping: the next person to touch this needs to know
   that the inhale *rises* because the circle *grows*.                                        */

const SOUNDS = {
  /**
   * Breathe / Stretch / Sleep — the in-breath.
   *
   * A slow rise from G3 to C4 (196 → 262 Hz), an open fifth — the most consonant interval
   * there is, and wide enough that the rise is unmistakable without being a melody. Under it,
   * a quiet band of noise sweeping open, which is what an indrawn breath sounds like.
   */
  'cue-in.wav': () =>
    timeline(2600, [
      { at: 0, samples: tone({ from: 196, to: 262, ms: 2300, gain: 0.62, hold: 0.44, release: 1200 }) },
      { at: 120, samples: breath({ ms: 2100, centre: 1500, gain: PALETTE.air, tilt: 0.35, seed: 11 }) },
    ]),

  /**
   * The out-breath. The exact mirror: C4 → G3, and the noise band closes as it falls.
   *
   * The release is longer than the inhale's, because every pattern in the app gives the
   * exhale at least as much time as the inhale and two of them give it more.
   */
  'cue-out.wav': () =>
    timeline(2900, [
      { at: 0, samples: tone({ from: 262, to: 190, ms: 2500, gain: 0.58, hold: 0.40, release: 1500 }) },
      { at: 120, samples: breath({ ms: 2300, centre: 1100, gain: PALETTE.air * 1.15, tilt: 0.3, seed: 13 }) },
    ]),

  /**
   * A hold. Flat, quiet, short — the one cue with no direction in it.
   *
   * 262 Hz is the same C4 the inhale lands on, so a hold reads as "stay where the breath
   * left you" rather than as a new event.
   */
  'cue-hold.wav': () =>
    timeline(1400, [
      { at: 0, samples: tone({ from: 262, to: 262, ms: 1100, gain: 0.34, hold: 0.3, release: 700 }) },
    ]),

  /**
   * The session finished. Three notes up a major triad, slowly — a resolution, not a reward.
   *
   * Deliberately not the four-note fanfare the game ships: a breathing session that ends in
   * an arpeggio is a slot machine, not a practice.
   */
  'cue-done.wav': () =>
    chime(
      [
        { from: 392, ms: 700 },
        { from: 494, ms: 700 },
        { from: 587, ms: 1100, gain: 0.5 },
      ],
      { gain: 0.5 },
    ),

  /**
   * A state change with nothing to say: a phase boundary in a routine, a completed set.
   *
   * One low note with almost no attack transient. It is the sound "the world moved", and it
   * is what the stretch and sleep screens use where Breathe uses a word.
   */
  'cue-tick.wav': () =>
    timeline(700, [
      { at: 0, samples: tone({ from: 330, to: 294, ms: 480, gain: 0.4, hold: 0.26, release: 300 }) },
    ]),

  /**
   * Walk — the pace changed. Two notes rather than one, so a person who is not looking at the
   * phone can tell "this is a new instruction" from "an interval ended".
   */
  'cue-interval.wav': () =>
    timeline(1200, [
      { at: 0, samples: tone({ from: 440, ms: 220, gain: 0.44, hold: 0.3, release: 180 }) },
      { at: 260, samples: tone({ from: 587, ms: 420, gain: 0.42, hold: 0.3, release: 300 }) },
    ]),

  /**
   * Walk — "this is the LAST fast interval".
   *
   * Added when the spoken cues were removed. The voice used to carry this ("last round"), and it is
   * the one piece of information a walker genuinely wants without looking at the phone: it is the
   * difference between pacing yourself for another round and knowing you can spend what is left.
   *
   * A rising major third *after* the fast cue's own two notes — up, not down. Rising reads as "more
   * to come" in this palette's vocabulary (it is the direction the in-breath moves), so a falling
   * figure here would say the opposite of what it means.
   */
  'cue-last.wav': () =>
    timeline(1500, [
      { at: 0, samples: tone({ from: 440, ms: 180, gain: 0.42, hold: 0.28, release: 150 }) },
      { at: 210, samples: tone({ from: 587, ms: 180, gain: 0.42, hold: 0.28, release: 150 }) },
      { at: 440, samples: tone({ from: 740, ms: 620, gain: 0.4, hold: 0.32, release: 460 }) },
    ]),

  /**
   * Walk — a fast interval that is not the last one.
   *
   * Two short, high notes: brighter and quicker than `cue-interval`, because the instruction is
   * "faster now". Its own cue rather than the interval's means the fast/easy alternation is
   * audible as an alternation.
   */
  'cue-fast.wav': () =>
    timeline(900, [
      { at: 0, samples: tone({ from: 659, ms: 170, gain: 0.42, hold: 0.26, release: 140 }) },
      { at: 200, samples: tone({ from: 880, ms: 320, gain: 0.4, hold: 0.28, release: 240 }) },
    ]),

  /**
   * Walk — back to easy.
   *
   * The mirror of `cue-fast`: lower, slower, and it settles rather than pushing. The pair is the
   * whole point — a walker with one earbud in should be able to tell which half of the interval they
   * are in from the shape of the sound alone.
   */
  'cue-easy.wav': () =>
    timeline(1100, [
      { at: 0, samples: tone({ from: 523, to: 494, ms: 300, gain: 0.42, hold: 0.3, release: 260 }) },
      { at: 320, samples: tone({ from: 392, ms: 520, gain: 0.4, hold: 0.32, release: 400 }) },
    ]),

  /**
   * Water — one glass logged.
   *
   * A short falling "plink" with a high, quick ring over it: the shape of a drop landing in
   * water. This is the only cue that is an *effect* rather than a signal, because it is the
   * only one standing in for a physical thing happening.
   */
  'cue-drop.wav': () =>
    timeline(900, [
      { at: 0, samples: tone({ from: 880, to: 588, ms: 320, gain: 0.5, hold: 0.22, release: 260 }) },
      { at: 10, samples: tone({ from: 1760, to: 1568, ms: 220, gain: 0.18, hold: 0.14, release: 200 }) },
      { at: 0, samples: breath({ ms: 200, centre: 2600, gain: 0.1, seed: 23 }) },
    ]),

  /**
   * Japa — one bead counted.
   *
   * The shortest sound in the set, because it plays up to 108 times in a row and anything
   * with a tail becomes a drone by accumulation. A wooden click: a 1,050 Hz note with a
   * 45 ms release and no sustain at all.
   */
  'cue-bead.wav': () =>
    timeline(260, [
      { at: 0, samples: tone({ from: 1047, to: 988, ms: 190, gain: 0.45, hold: 0.08, attack: 3, decay: 70, release: 110 }) },
    ]),

  /**
   * Sleep — a round of the wind-down finished.
   *
   * A slow swell rather than a hit: this plays as someone is trying to fall asleep, so the
   * attack is 700 ms and there is no transient at all. The one cue in the set where a person
   * should not be able to tell exactly when it started.
   */
  'cue-swell.wav': () =>
    timeline(3200, [
      { at: 0, samples: tone({ from: 174, to: 196, ms: 2800, gain: 0.5, attack: 700, hold: 0.7, decay: 400, release: 1200 }) },
      { at: 300, samples: tone({ from: 261, to: 294, ms: 2400, gain: 0.24, attack: 900, hold: 0.7, release: 1100 }) },
    ]),

  /**
   * Stretch — the closing wind-down movement.
   *
   * Added when the spoken cues were removed: the voice used to say "relax" here, and this is the one
   * movement in the class where the sound should *not* be the same tick as every other turn. It is
   * the tick's shape taken down a fourth and stretched: lower, slower, and it settles rather than
   * marking a beat, because the class is ending rather than changing.
   */
  'cue-relax.wav': () =>
    timeline(1800, [
      { at: 0, samples: tone({ from: 262, to: 233, ms: 1300, gain: 0.42, attack: 40, hold: 0.36, release: 900 }) },
      { at: 180, samples: tone({ from: 175, ms: 1200, gain: 0.2, attack: 60, hold: 0.3, release: 800 }) },
    ]),

  /**
   * Japa — the 108th bead, without the spoken "round done".
   *
   * The bead click is struck twice, a beat apart, with a low fifth underneath that the plain bead
   * does not have. Two strikes rather than one is what makes it unmistakable with eyes closed: it is
   * the same object hit differently, which is exactly how a person counting on a mala knows they have
   * finished a round without looking. Added when the spoken cues were removed.
   */
  'cue-round.wav': () =>
    timeline(1400, [
      { at: 0, samples: tone({ from: 1047, to: 988, ms: 200, gain: 0.42, hold: 0.1, attack: 3, decay: 80, release: 130 }) },
      { at: 240, samples: tone({ from: 1319, to: 1245, ms: 260, gain: 0.4, hold: 0.1, attack: 3, decay: 90, release: 180 }) },
      { at: 60, samples: tone({ from: 659, ms: 1000, gain: 0.24, attack: 30, hold: 0.34, release: 700 }) },
    ]),

  /**
   * The bed under a session: Breathe's drone, and Sleep's.
   *
   * A low A (55 Hz) and its fifth (82.5 Hz) with a slow breathing amplitude on each, a third
   * partial an octave and a fifth up for warmth, and a very quiet noise floor so it reads as
   * a room rather than as a tone. Two channels with the partials detuned by ~0.15 Hz each
   * way, which is what stops it sounding like a test signal.
   *
   * It is *loopable*: the head is cross-faded into the tail by `loopable()` before writing, so
   * sixteen seconds of bed can run under a ten-minute session with no seam. That is the whole
   * reason this is a generated file rather than a player-level loop — the seam is a real
   * defect and this is where it is fixed.
   */
  'drone.wav': () => {
    const seconds = 16;
    const n = Math.round(seconds * RATE);
    const left = new Float32Array(n);
    const right = new Float32Array(n);
    // [frequency, amplitude, breath period in seconds]
    const partials = [
      [55, 0.5, 9.5],
      [82.5, 0.22, 13.0],
      [110, 0.14, 11.0],
      [165, 0.07, 15.0],
    ];
    for (const [freq, amp, period] of partials) {
      // The two channels are detuned by ±0.13 Hz and given different start phases. That
      // detune is the whole stereo image: a beat at about a quarter of a hertz between the
      // ears, which is what makes a bed feel wide without any reverb.
      for (const [channel, detune, start] of [
        [left, -0.13, 0],
        [right, 0.13, 0.25],
      ]) {
        let phase = start;
        for (let i = 0; i < n; i++) {
          const t = i / RATE;
          // The breath: never reaches zero, so the bed never disappears mid-session.
          const swell = 0.72 + 0.28 * Math.sin((2 * Math.PI * t) / period);
          phase += (freq + detune) / RATE;
          if (phase >= 1) phase -= 1;
          channel[i] += Math.sin(2 * Math.PI * phase) * amp * swell;
        }
      }
    }
    // The room: a very low noise floor, different in each channel, so the bed has a floor to
    // sit on rather than a black background.
    for (const [channel, seed] of [
      [left, 101],
      [right, 211],
    ]) {
      const room = breath({ ms: seconds * 1000, centre: 420, width: 1.8, gain: 0.035, tilt: 0.5, seed });
      for (let i = 0; i < n; i++) channel[i] += room[i];
    }
    // Tame the harmonics that would fold at 22 kHz, then round the loop.
    lowpass(left, 900);
    lowpass(right, 900);
    return interleave(loopable(left, 900), loopable(right, 900));
  },
};

/* ── Why there is no voice any more ──────────────────────────────────────────────────────
 *
 * The first version of this shipped fifteen spoken phrases, synthesized by `lib/voice.mjs` — a
 * source–filter formant model, real code, and it produced something that was recognisably the words
 * "breathe in" and "breathe out". The verdict on a real phone was that it sounded **robotic and not
 * clear**, and that is the honest outcome to accept rather than to defend: a formant synthesizer with
 * three resonators and no proper excitation model is a 1980s talking machine, and a person doing a
 * breathing exercise should not be listening to one.
 *
 * So the spoken layer is gone. What replaced it is *not* nothing:
 *
 *   * the phase cues (`cue-in`, `cue-out`, `cue-hold`) already carried the instruction — the rising
 *     tone *is* "breathe in", which is why the words were riding on top of it rather than the other
 *     way round;
 *   * the three places where the voice carried information a tone could not were given their own
 *     cues instead: `cue-fast`/`cue-easy`/`cue-last` for Walk's pace, `cue-round` for Japa's round,
 *     `cue-relax` for Stretch's wind-down.
 *
 * `lib/voice.mjs` is deliberately **left in the repository**, unimported. It is a working model, the
 * phrases are transcribed, and if a better voice is ever wanted the shortest path is to fix that file
 * and re-add a `VOICES` block here rather than to start again. It is dead code with a reason, which is
 * a different thing from dead code.
 *
 * What was NOT done: switching to the platform's text-to-speech. That was rejected before the voice
 * was built (see `docs/wellness-sound.md`) and is still rejected — on Android it can be a *network*
 * voice, which would break this app's one promise and would send the words a person typed to a third
 * party. A robotic offline voice is a bad feature; a clear online one is a worse product.
 */

/* ── Render, verify, write ─────────────────────────────────────────────────────────────── */

const ALL = { ...SOUNDS };
const CHANNELS = { 'drone.wav': 2 };
/**
 * Assets that are *beds*, not cues: they loop for the length of a session rather than firing
 * at a phase boundary. The "must fit inside the shortest phase" check does not apply to them,
 * and saying so here is better than loosening the check for everything.
 */
const BEDS = new Set(['drone.wav']);

fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const written = [];

for (const [name, render] of Object.entries(ALL)) {
  const channels = CHANNELS[name] ?? 1;
  let samples;
  try {
    samples = render();
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
    continue;
  }
  if (!samples || !samples.length) {
    problems.push(`${name}: rendered nothing`);
    continue;
  }
  normalize(samples, name.startsWith('voice-') ? 0.86 : PALETTE.quiet + 0.18);
  limit(samples, 0.94);

  const frames = Math.floor(samples.length / channels);
  const seconds = frames / RATE;
  const loudest = peak(samples);
  const energy = rms(samples);

  // The checks that matter, all of them learned from a generator that once shipped silence:
  // a file can be a valid WAV, play without error, and contain nothing a person can hear.
  if (seconds < 0.04) problems.push(`${name}: only ${(seconds * 1000).toFixed(0)} ms of audio`);
  if (loudest < 0.08) problems.push(`${name}: peaks at ${loudest.toFixed(3)}, which is silence`);
  if (loudest > 0.999) problems.push(`${name}: peaks at ${loudest.toFixed(3)} and would clip`);
  if (energy < 0.004) problems.push(`${name}: RMS ${energy.toFixed(4)}, effectively silent`);
  // A long cue that is almost entirely quiet is a cue with a bug in its envelope, and it is
  // the failure a peak check cannot see.
  if (seconds > 1 && energy < 0.01) problems.push(`${name}: ${seconds.toFixed(1)}s but RMS only ${energy.toFixed(4)}`);
  // A cue that is longer than the shortest phase it can play in would still be talking over
  // the next one. Five seconds is the shortest real phase in any of the six screens. Beds are
  // exempt: they are meant to outlast every phase.
  if (!BEDS.has(name) && seconds > 5.2) {
    problems.push(`${name}: ${seconds.toFixed(1)}s is too long for a phase as short as 5s`);
  }

  const file = path.join(OUT, name);
  fs.writeFileSync(file, wav(samples, { rate: RATE, channels }));
  written.push({ name, bytes: fs.statSync(file).size, seconds, loudest, energy, channels });
}

const total = written.reduce((sum, w) => sum + w.bytes, 0);
console.log(`\n▸ wrote ${written.length} wellness sounds to apps/mobile/assets/wellness/  (${(total / 1024).toFixed(0)} KB)`);
for (const w of written) {
  console.log(
    `    ${w.name.padEnd(26)} ${String(w.bytes).padStart(7)} B  ${w.seconds.toFixed(2)}s  ${w.channels}ch  peak ${w.loudest.toFixed(2)}  rms ${w.energy.toFixed(3)}`,
  );
}
if (problems.length) {
  console.error(`\n✗ ${problems.length} sound(s) failed a check:`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}
