/**
 * wav.mjs — write a Float32 buffer as a 16-bit PCM WAV, and the small DSP primitives the
 * wellness cues are built from.
 *
 * Extracted from `make-game-sounds.mjs`, which had the container and a single triangle-wave
 * `tone()` inline. The wellness cues need more than a blip: they need filtered noise (the
 * air in a breath), a resonant filter (the formants of a voice) and a limiter (so a drone
 * plus a cue cannot clip). Those belong in one place, tested once, rather than copied into
 * three generators.
 *
 * Everything here is arithmetic on arrays: no dependencies, no network, no sampled audio.
 * That is deliberate — a wellness app that ships a voice from an unknown source has a
 * licence problem, and "we generated it from a formant model in our own repo" is a claim
 * that can be checked by reading this file.
 */

/** Every file this repo generates is 22,050 Hz: small, and every decoder takes it. */
export const RATE = 22050;

/**
 * A RIFF/WAVE container around Float32 samples.
 *
 * `channels` > 1 expects the samples interleaved (`[L, R, L, R, …]`), which is what
 * `interleave()` below produces. The drone is the only stereo asset: width is what makes a
 * background bed feel like a room rather than a tone, and low frequencies are cheap to
 * store.
 */
export function wav(samples, { rate = RATE, channels = 1 } = {}) {
  const frames = Math.floor(samples.length / channels);
  const data = Buffer.alloc(frames * channels * 2);
  for (let i = 0; i < frames * channels; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** A Float32Array of `ms` milliseconds of silence. */
export function silence(ms, rate = RATE) {
  return new Float32Array(Math.max(0, Math.round((ms / 1000) * rate)));
}

/** Left/right halves → one interleaved buffer, which is what a stereo WAV wants. */
export function interleave(left, right) {
  const out = new Float32Array(left.length * 2);
  for (let i = 0; i < left.length; i++) {
    out[i * 2] = left[i];
    out[i * 2 + 1] = right[i];
  }
  return out;
}

/** Peak absolute amplitude. The guard every generator runs before it writes a file. */
export function peak(samples) {
  let most = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > most) most = a;
  }
  return most;
}

/** Root-mean-square, as a proxy for "is this a drone or a click". */
export function rms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, samples.length));
}

/**
 * Scale so the loudest sample sits at `to`.
 *
 * Every cue is normalised to a known peak rather than left at whatever the arithmetic
 * produced, so `VOLUME[id]` in the app is the only thing deciding how loud a sound is.
 * Without this, "make the inhale cue softer" means re-deriving a synthesis gain, and the
 * first version of the game sounds shipped a file that was silently near-zero because
 * exactly that was got wrong.
 */
export function normalize(samples, to = 0.9) {
  const most = peak(samples);
  if (most <= 0) return samples;
  const k = to / most;
  for (let i = 0; i < samples.length; i++) samples[i] *= k;
  return samples;
}

/**
 * Gain envelope: fast attack, smooth decay, exponential tail.
 *
 * `attack` is in milliseconds and is never zero — a buffer that starts at full amplitude
 * begins with a step, and a step is a click on every speaker that plays it.
 */
export function envelope(samples, { attackMs = 12, decayMs = 120, releaseMs = 260, hold = 0.35 } = {}) {
  const n = samples.length;
  const a = Math.max(1, Math.round((attackMs / 1000) * RATE));
  const d = Math.max(1, Math.round((decayMs / 1000) * RATE));
  const r = Math.max(1, Math.round((releaseMs / 1000) * RATE));
  for (let i = 0; i < n; i++) {
    let g;
    if (i < a) {
      g = i / a;
    } else if (i < a + d) {
      // Exponential approach to the sustain level: what a struck string or a sung note does.
      g = 1 - (1 - hold) * (1 - Math.exp(-3 * ((i - a) / d)));
    } else if (i > n - r) {
      const t = (n - i) / r;
      g = hold * t * t;
    } else {
      g = hold;
    }
    samples[i] *= g;
  }
  return samples;
}

/** A one-pole low-pass, for taming harmonics before they fold at this sample rate. */
export function lowpass(samples, cutoffHz) {
  const dt = 1 / RATE;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  let last = 0;
  for (let i = 0; i < samples.length; i++) {
    last += alpha * (samples[i] - last);
    samples[i] = last;
  }
  return samples;
}

/** A one-pole high-pass, the mirror of `lowpass`. */
export function highpass(samples, cutoffHz) {
  const dt = 1 / RATE;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + dt);
  let lastIn = samples[0] ?? 0;
  let lastOut = 0;
  for (let i = 0; i < samples.length; i++) {
    lastOut = alpha * (lastOut + samples[i] - lastIn);
    lastIn = samples[i];
    samples[i] = lastOut;
  }
  return samples;
}

/**
 * A resonant band-pass, evaluated once per sample.
 *
 * The formant filter, and the reason a vowel can be synthesized at all: a glottal buzz put
 * through two or three of these comes out as a voice, because that is what a vocal tract
 * does to a glottal buzz. Coefficients are the standard RBJ band-pass, returned as a
 * closure so a note can sweep F1/F2 continuously — a *glide* between two vowels is what
 * "breathe in" is, and a filter that had to be rebuilt per sample block would step.
 *
 * `gain` compensates for the peak gain of the band-pass (Q), so chaining three filters does
 * not quietly attenuate the signal to nothing.
 */
export function resonator(freqHz, q = 8, gain = 1) {
  const w0 = (2 * Math.PI * freqHz) / RATE;
  const alpha = Math.sin(w0) / (2 * q);
  const cos0 = Math.cos(w0);
  const b0 = (alpha * gain) / (1 + alpha);
  const b2 = -b0;
  const a0 = 1 + alpha;
  const a1 = (-2 * cos0) / a0;
  const a2 = (1 - alpha) / a0;
  const B0 = b0 / a0;
  const B2 = b2 / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = B0 * x + B2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

/**
 * A deterministic pseudo-random source.
 *
 * `Math.random()` would make every run of the generator produce a different file, so the
 * generator could not be verified by hashing its output and a diff of two runs would be
 * noise. This is a small xorshift: same seed, same noise, same bytes.
 */
export function noise(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    // → [-1, 1)
    return (s / 0x100000000) * 2 - 1;
  };
}

/** Signed noise source with a flat-ish spectrum, band-limited by `resonator`/`lowpass`. */
export function whiteNoise(n, seed = 1) {
  const rand = noise(seed);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rand();
  return out;
}

/**
 * Add `src` into `dst` at `frame`, clipping nothing (the limiter runs last).
 *
 * The one mixing primitive: every cue is a sum of parts placed in time, and writing
 * `dst[frame + i] += src[i]` by hand in six generators is how an off-by-one lands.
 */
export function mixInto(dst, src, frame = 0) {
  for (let i = 0; i < src.length; i++) {
    const at = frame + i;
    if (at >= 0 && at < dst.length) dst[at] += src[i];
  }
  return dst;
}

/**
 * A look-ahead-free soft limiter.
 *
 * The drone plus a cue plus a voice can sum past 1.0, and a hard clamp on a slow sine is
 * audible as a buzz. `tanh`-style soft saturation keeps the peak under `ceiling` while
 * staying smooth, which is why this is preferred to normalising the mix — normalising
 * would make the cue quieter every time the drone happened to be louder.
 */
export function limit(samples, ceiling = 0.95) {
  for (let i = 0; i < samples.length; i++) {
    const x = samples[i];
    // x / (1 + |x|) approaches ±1 but never reaches it, so scale to the ceiling.
    samples[i] = ceiling * (x / (1 + Math.abs(x)));
  }
  return samples;
}

/** Concatenate parts, dropping each one's click-free tail into the next. */
export function concat(parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Float32Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/**
 * Join a buffer to its own beginning so it loops without a click.
 *
 * A loop that ends at full amplitude and restarts at zero pops once every sixteen seconds,
 * which on a background bed is the single most noticeable defect it can have. The tail is
 * cross-faded with the head over `fadeMs`; the returned buffer is shorter by exactly that
 * fade, because the fade needs material from both ends.
 */
export function loopable(samples, fadeMs = 700) {
  const fade = Math.round((fadeMs / 1000) * RATE);
  if (fade * 2 >= samples.length) return samples;
  const out = new Float32Array(samples.length - fade);
  out.set(samples.subarray(0, samples.length - fade));
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    // Equal-power-ish cross-fade (sqrt), so the seam does not dip in the middle.
    out[i] = out[i] * Math.sqrt(t) + samples[samples.length - fade + i] * Math.sqrt(1 - t);
  }
  return out;
}
