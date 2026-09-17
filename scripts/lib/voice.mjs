/**
 * voice.mjs — a voice synthesized from a vocal-tract model, not sampled from a recording.
 *
 * Why not text-to-speech: `expo-speech` would add a dependency, needs the platform's TTS
 * engine, and on Android can fall back to a network voice — which breaks the one promise
 * this app makes (it works in aeroplane mode) and would read whatever a person typed to a
 * third party. Why not a recorded human: a voice clip from an unknown source is a licence
 * problem, and this repo's rule is that generated audio is generated from arithmetic that
 * can be read.
 *
 * ── The model ─────────────────────────────────────────────────────────────────────────
 *
 * A voice is a buzz filtered by a tube. So this is a **source–filter** synthesizer, the
 * same shape as the Klatt formant synthesizer:
 *
 *   source   a glottal pulse train at the pitch, plus a breath-noise component, both faded
 *            by a per-phoneme "voiced" weight;
 *   filter   three resonant band-passes at F1/F2/F3, plus a high shelf of noise for the
 *            air around a whispered consonant;
 *   prosody  a pitch contour over the phrase, with a small vibrato and a slight downward
 *            drift — a perfectly flat pitch reads as a machine.
 *
 * A vowel is then just a set of formants, and **a word is a glide between two sets**. That
 * glide is the whole trick: "breathe in" is /b/ (silence into a low buzz) → /r/ (F3 low) →
 * /iː/ (F1 280, F2 2300) → /ð/ (fricative noise) → /ɪ/ (F1 420, F2 1900) → /n/ (a nasal
 * murmur). Nothing here is a recording of anybody, and nothing here can say a word we did
 * not write down.
 *
 * ── What this means for the app ───────────────────────────────────────────────────────
 *
 * The cues speak a **fixed phrase**. They cannot read the phrase a person typed, because
 * there is no speech engine — and that is stated plainly in `docs/wellness-sound.md` and on
 * the Profile page rather than being quietly promised. The generated voice is the character
 * the app has; the person's own words are shown on screen and carried by the haptic.
 */
import { RATE, envelope, highpass, lowpass } from './wav.mjs';

export { RATE };

/**
 * Vowel formants, in Hz: [F1, F2, F3].
 *
 * Standard measured averages for an adult voice. F1 tracks how open the mouth is and F2 how
 * far forward the tongue is, which is why these five cover "ah", "ee", "oo", "oh" and the
 * hum — the sounds this app needs and no more. Inventing more would be inventing a language.
 */
const VOWELS = {
  a: [730, 1090, 2440], // "ah"  — open, the in-breath
  A: [660, 1720, 2410], // "uh"  — the schwa most unstressed syllables collapse to
  i: [280, 2250, 2900], // "ee"
  I: [420, 1900, 2550], // "ih"  — the short i in "in"
  u: [320, 800, 2400], // "oo"
  o: [500, 900, 2400], // "oh"
  E: [530, 1840, 2480], // "eh"
  m: [280, 1100, 2300], // a closed hum: low F1, nasal, no noise at all
};

/** A phoneme with no formants of its own borrows the neighbouring vowel's. */
const NEUTRAL = [500, 1500, 2500];

/**
 * How long each phoneme lasts at normal pace, in milliseconds.
 *
 * Hand-written rather than looked up: this is not a text-to-speech engine and pretending it
 * is would mean shipping a pronunciation dictionary and still getting "breathe" wrong. Six
 * fixed phrases are transcribed by hand, once.
 */
const PHONEME_MS = {
  b: 55, r: 55, i: 90, th: 70, n: 70, t: 45, h: 45, l: 55, f: 70, s: 80,
  sh: 80, m: 80, z: 70, d: 45, k: 50, p: 50, a: 110, I: 80, u: 110, o: 110,
  A: 70, E: 80, _: 45,
  // Added when the word table grew and a missing duration threw at render time rather than
  // at import. `assertVocabulary()` below now makes that a load-time failure instead.
  w: 50, g: 50, v: 60, y: 50, e: 90,
};

/**
 * The words this app can say, spelled as phonemes.
 *
 * `_` is a short silence *inside* a phrase ("breathe ‖ in"). Written as a table so the set
 * of things the voice can say is reviewable at a glance — the alternative, a general
 * grapheme-to-phoneme converter, is a much larger thing that would also be able to
 * mispronounce a person's name.
 */
const WORDS = {
  breathe: ['b', 'r', 'i', 'th'],
  in: ['I', 'n'],
  out: ['a', 'u', 't'],
  hold: ['h', 'o', 'u', 'l', 'd'],
  relax: ['r', 'i', 'l', 'E', 'k', 's'],
  left: ['l', 'E', 'f', 't'],
  right: ['r', 'i', 't'],
  up: ['A', 'p'],
  down: ['d', 'a', 'u', 'n'],
  switch: ['s', 'w', 'I', 't', 'sh'],
  fast: ['f', 'a', 's', 't'],
  slow: ['s', 'l', 'o', 'u'],
  last: ['l', 'a', 's', 't'],
  round: ['r', 'a', 'u', 'n', 'd'],
  done: ['d', 'A', 'n'],
  ten: ['t', 'E', 'n'],
  more: ['m', 'o', 'r'],
  /*
   * Two single-phoneme entries, because `tokensOf` only knows words. "m" and "a" are not
   * words, they are the sounds themselves — the closed-mouth hum an exhale is in most
   * practices, and the bare open vowel an in-breath is. Spelling them as words keeps the
   * rest of the pipeline (a word list, a glide between formants) unchanged.
   */
  m: ['m'],
  a: ['a'],
};

/** Vowel-ish phonemes whose formants can be glided between; others hold the previous set. */
const VOWELISH = new Set(Object.keys(VOWELS).concat(['_']));

/** True when a phoneme is noise rather than buzz — a fricative or a breathy /h/. */
const UNVOICED = new Set(['h', 'f', 's', 'sh', 'th', 't', 'p', 'k']);

/**
 * The phrase table: every sound the app's voice can produce.
 *
 * Naming them rather than passing phoneme arrays around keeps the call sites in
 * `make-wellness-sounds.mjs` readable ("inhale" not `['b','r','i','th','_','I','n']`) and
 * makes the total vocabulary of the voice one list to read.
 */
export const PHRASES = {
  'breathe-in': { words: ['breathe', 'in'], ms: 1180 },
  'breathe-out': { words: ['breathe', 'out'], ms: 1250 },
  hold: { words: ['hold'], ms: 620 },
  relax: { words: ['relax'], ms: 700 },
  'left-side': { words: ['left'], ms: 560 },
  'right-side': { words: ['right'], ms: 560 },
  'switch-sides': { words: ['switch'], ms: 620 },
  walk: { words: ['breathe'], ms: 620 },
  'walk-fast': { words: ['fast'], ms: 520 },
  'walk-slow': { words: ['slow'], ms: 520 },
  'walk-last': { words: ['last', 'round'], ms: 900 },
  'round-done': { words: ['round', 'done'], ms: 820 },
  'one-more': { words: ['ten', 'more'], ms: 700 },
  /** A hum, not a word: the exhale is a closed-mouth sound in most practices. */
  hum: { words: ['m'], ms: 900 },
  /** A long open "aah" with no consonants — the bare in-breath. */
  aah: { words: ['a'], ms: 900 },
};

/** The flat list of every phoneme token, so `say()` can fail loudly on a bad word. */
function tokensOf(words) {
  const out = [];
  for (const w of words) {
    const phonemes = WORDS[w];
    if (!phonemes) throw new Error(`voice: no phoneme entry for the word "${w}"`);
    out.push(...phonemes);
  }
  return out;
}

/**
 * Interpolate the formant track and the voicing track across a phoneme list.
 *
 * Returns a per-sample schedule rather than a per-phoneme one because the whole point is
 * that the formants *move* through a phoneme: a hard switch at each boundary is exactly the
 * buzzy, robotic sound this is trying to avoid. The first two thirds of a phoneme hold its
 * target and the last third glides to the next one, which is roughly what a coarticulating
 * vocal tract does.
 */
function schedule(phonemes, totalSamples, glide = 0.34) {
  const spans = [];
  let cursor = 0;
  for (const p of phonemes) {
    const ms = PHONEME_MS[p];
    if (ms == null) throw new Error(`voice: no duration for the phoneme "${p}"`);
    spans.push({ p, ms, from: cursor, to: cursor + ms });
    cursor += ms;
  }
  const totalMs = cursor;

  const f1 = new Float32Array(totalSamples);
  const f2 = new Float32Array(totalSamples);
  const f3 = new Float32Array(totalSamples);
  const voiced = new Float32Array(totalSamples);
  const noisy = new Float32Array(totalSamples);

  // The formant set each span targets, carried forward from the last vowel.
  let prev = NEUTRAL;
  const targets = spans.map((s) => {
    if (VOWELISH.has(s.p)) prev = VOWELS[s.p] ?? prev;
    return prev;
  });

  for (let i = 0; i < totalSamples; i++) {
    const tMs = (i / RATE) * 1000;
    let idx = spans.findIndex((s) => tMs >= s.from && tMs < s.to);
    if (idx < 0) idx = spans.length - 1; // the tail, past the last boundary
    const span = spans[idx];
    const into = (tMs - span.from) / Math.max(1, span.ms);
    const next = targets[Math.min(idx + 1, targets.length - 1)];
    const here = targets[idx];
    // Hold, then glide: the boundary blend only starts after `1 - glide` of the phoneme.
    const blend = into <= 1 - glide ? 0 : (into - (1 - glide)) / glide;
    const k = Math.min(1, Math.max(0, blend));

    f1[i] = here[0] + (next[0] - here[0]) * k;
    f2[i] = here[1] + (next[1] - here[1]) * k;
    f3[i] = here[2] + (next[2] - here[2]) * k;

    // Voicing and noise also ramp, which is what makes a /b/ a stop rather than a click:
    // the buzz fades in over the phoneme instead of appearing at full amplitude.
    const voicedTarget = UNVOICED.has(span.p) ? 0.12 : 1;
    const noiseTarget = UNVOICED.has(span.p) ? 0.85 : span.p === '_' ? 0 : 0.1;
    const ramp = Math.min(1, into * 5); // 20% of the phoneme to reach level
    voiced[i] = voicedTarget * ramp;
    noisy[i] = noiseTarget * ramp;
    if (span.p === '_') {
      voiced[i] = 0;
      noisy[i] = 0;
    }
  }

  return { f1, f2, f3, voiced, noisy, totalMs };
}

/**
 * One biquad band-pass, in-place over a whole buffer, with the centre frequency given
 * per sample.
 *
 * Written as a running recurrence rather than one `resonator()` closure per sample: a filter
 * whose coefficients change every sample is not the same filter, but for a glide this slow
 * the difference is inaudible and the running state is what keeps the output continuous.
 */
function sweepBandpass(input, freq, q, gain = 1) {
  const out = new Float32Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i++) {
    const w0 = (2 * Math.PI * Math.min(freq[i], RATE * 0.45)) / RATE;
    const alpha = Math.sin(w0) / (2 * q);
    const cos0 = Math.cos(w0);
    const a0 = 1 + alpha;
    const b0 = (alpha * gain) / a0 / a0;
    const b2 = -b0;
    const a1 = (-2 * cos0) / a0;
    const a2 = (1 - alpha) / a0;
    const x = input[i];
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
}

/**
 * Synthesize one phrase.
 *
 * @param words  A key of `PHRASES`.
 * @param opts   `pitch` in Hz (an adult speaking fundamental, 110–190), `ms` to override the
 *               phrase's own length, `air` for how breathy the result is, `gain`.
 * @returns      Float32Array at 22,050 Hz.
 */
export function say(words, opts = {}) {
  const phrase = PHRASES[words];
  if (!phrase) throw new Error(`voice: unknown phrase "${words}"`);
  const {
    pitch = 138,
    drift = -0.06,
    air = 0.5,
    vibrato = 4.6,
    vibratoDepth = 0.012,
    gain = 1,
  } = opts;

  const ms = opts.ms ?? phrase.ms;
  const n = Math.round((ms / 1000) * RATE);
  const phonemes = tokensOf(phrase.words);
  const plan = schedule(phonemes, n);

  // ── Source: a band-limited glottal pulse train ──────────────────────────────────────
  // A sawtooth through a gentle low-pass stands in for the glottal waveform: it has the
  // harmonic stack a voice has, and the low-pass keeps the high harmonics from folding at
  // 22 kHz before the formants ever see them.
  const source = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const vib = 1 + vibratoDepth * Math.sin(2 * Math.PI * vibrato * (i / RATE));
    const f0 = pitch * (1 + drift * t) * vib;
    phase += f0 / RATE;
    if (phase >= 1) phase -= 1;
    // 2·phase − 1 is a saw; squaring it slightly rounds the discontinuity, which is what a
    // glottis actually does and what takes the buzz out of the buzz.
    const saw = 2 * phase - 1;
    const shaped = saw - 0.35 * saw * saw * saw;
    source[i] = shaped * plan.voiced[i];
  }
  lowpass(source, 6500);

  // ── Breath: filtered noise, weighted per phoneme ────────────────────────────────────
  // The same deterministic noise the cues use, so two runs produce identical bytes.
  const breath = new Float32Array(n);
  let seed = 0x9e3779b9;
  for (let i = 0; i < n; i++) {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    breath[i] = ((seed / 0x100000000) * 2 - 1) * plan.noisy[i];
  }
  // A voice's breath sits above 1.5 kHz, not in the rumble.
  highpass(breath, 1400);
  lowpass(breath, 7000);

  // ── Filter: three formants, swept along the schedule ────────────────────────────────
  // Q is deliberately low (7–10) rather than the 20+ a pure formant display would use: a
  // high-Q filter rings on a moving pitch and sounds like a whistle, not a person.
  const b1 = sweepBandpass(source, plan.f1, 9, 2.2);
  const b2 = sweepBandpass(source, plan.f2, 11, 1.5);
  const b3 = sweepBandpass(source, plan.f3, 13, 0.7);
  // The noise is shaped by the same formants at lower weight, so a fricative sits in the
  // mouth rather than hissing on top of it.
  const n1 = sweepBandpass(breath, plan.f2, 6, 1.1);
  const n2 = sweepBandpass(breath, plan.f3, 6, 0.9);

  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const voicedPart = b1[i] * 0.62 + b2[i] * 0.34 + b3[i] * 0.16;
    const noisePart = (n1[i] * 0.7 + n2[i] * 0.3 + breath[i] * 0.25) * air;
    out[i] = (voicedPart + noisePart) * gain;
  }

  // Fade the very start and end: a phrase that begins or ends on a non-zero sample clicks,
  // and these are played back-to-back with a drone underneath.
  envelope(out, {
    attackMs: 25,
    decayMs: Math.max(80, ms * 0.18),
    releaseMs: Math.min(120, ms * 0.12),
    hold: 0.92,
  });
  return out;
}

/** Every phrase key the voice knows, for the generator's own coverage check. */
export const PHRASE_NAMES = Object.keys(PHRASES);

/**
 * Check the three tables agree, and throw at import time if they do not.
 *
 * This exists because they did not: `switch` was added to `WORDS` and `w` had no duration,
 * so the generator died halfway through rendering — after it had already written some files,
 * which is the worst way for a build step to fail. Loud at load beats half-written at exit.
 */
function assertVocabulary() {
  for (const [word, phonemes] of Object.entries(WORDS)) {
    for (const p of phonemes) {
      if (PHONEME_MS[p] == null) {
        throw new Error(`voice: word "${word}" uses the phoneme "${p}", which has no duration`);
      }
    }
  }
  for (const [name, phrase] of Object.entries(PHRASES)) {
    for (const w of phrase.words) {
      if (!WORDS[w]) throw new Error(`voice: phrase "${name}" uses the word "${w}", which is not in WORDS`);
    }
  }
  return true;
}

assertVocabulary();
