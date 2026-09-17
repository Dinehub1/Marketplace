#!/usr/bin/env node
/**
 * make-game-sounds.mjs — the four sounds Merge plays, synthesized here rather than
 * downloaded.
 *
 * Why generate them: a game that ships with an audio file from an unknown source has a
 * licence problem, and a game that ships with none has no feedback for the one moment that
 * matters (a join). These are written from arithmetic — an envelope, a waveform, a handful
 * of notes — so they are ours outright, they are a few kilobytes each, and the recipe is
 * readable: change the notes, re-run, and the game's voice changes.
 *
 * The sound is deliberately chiptune: a triangle/square blend with a fast decay is what a
 * 1970s-machine-playing-a-board-game sounds like to a modern ear, which is the register the
 * screen's palette is aiming at. Nothing here is sampled, so there is no noise floor and no
 * artifact to hide.
 *
 * Output (mono, 22,050 Hz, 16-bit PCM — small, and every decoder takes it):
 *   apps/mobile/assets/sounds/slide.wav       a soft thud as the tiles move
 *   apps/mobile/assets/sounds/merge.wav       a two-note blip for a join
 *   apps/mobile/assets/sounds/merge-big.wav   a longer, higher blip for 128 and up
 *   apps/mobile/assets/sounds/win.wav         a four-note arpeggio when 2048 is reached
 *
 * Usage:  node scripts/make-game-sounds.mjs
 * Exit:   0 written, 1 something could not be rendered
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'apps', 'mobile', 'assets', 'sounds');

const RATE = 22050;

/** 16-bit mono PCM in a RIFF container. */
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/**
 * One note.
 *
 * `phase` is accumulated rather than computed as `sin(2π f t)`: a note that slides in pitch
 * (the thud's fall) has no single frequency, and a phase accumulator is what keeps the
 * waveform continuous while the frequency moves.
 */
function tone({ from, to = from, ms, gain = 0.5, wave = 'tri', attack = 0.002 }) {
  const n = Math.round((ms / 1000) * RATE);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = from + (to - from) * t;
    phase += freq / RATE;
    const cycle = phase % 1;
    // Triangle is the body; a little square gives it the edge of a cheap 70s speaker.
    const tri = 4 * Math.abs(cycle - 0.5) - 1;
    const square = cycle < 0.5 ? 1 : -1;
    const sample = wave === 'square' ? square : tri * 0.82 + square * 0.18;
    // Fast attack, exponential decay to silence: a blip, not a drone.
    const attackGain = Math.min(1, i / Math.max(1, attack * RATE));
    const decay = Math.exp(-5.5 * t);
    out[i] = sample * gain * attackGain * decay;
  }
  return out;
}

/** Notes played one after another, with a tail of silence so the buffer never ends on a click. */
function sequence(notes, tailMs = 30) {
  const parts = notes.map((n) => tone(n));
  const tail = new Float32Array(Math.round((tailMs / 1000) * RATE));
  const total = parts.reduce((sum, p) => sum + p.length, 0) + tail.length;
  const out = new Float32Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/**
 * Deliberately quiet: these play over and over, and a game that shouts is a game muted.
 *
 * The values are note *specs* — `sequence` renders them. Handing it rendered buffers would
 * be caught by the length guard below rather than shipping four files of silence, which is
 * exactly what happened the first time this script was run.
 */
const SOUNDS = {
  // The board moving with nothing joining it: low, short, no pitch to remember.
  'slide.wav': sequence([{ from: 190, to: 130, ms: 85, gain: 0.28 }]),
  // A join. Two steps up, which reads as "and now there is more of it".
  'merge.wav': sequence([
    { from: 523, ms: 55, gain: 0.4 },
    { from: 784, ms: 70, gain: 0.38 },
  ]),
  // A join worth 128 or more: the same shape, an octave up and longer, so the ear hears a
  // bigger thing without needing a different sound effect per tile value.
  'merge-big.wav': sequence([
    { from: 659, ms: 55, gain: 0.42 },
    { from: 988, ms: 65, gain: 0.4 },
    { from: 1319, ms: 85, gain: 0.36 },
  ]),
  // 2048. The only fanfare in the game.
  'win.wav': sequence([
    { from: 523, ms: 110, gain: 0.42 },
    { from: 659, ms: 110, gain: 0.42 },
    { from: 784, ms: 110, gain: 0.42 },
    { from: 1047, ms: 260, gain: 0.45 },
  ]),
};

/** Peak amplitude, so a file that rendered to (near) nothing fails here. */
function peak(samples) {
  let most = 0;
  for (const s of samples) {
    const a = Math.abs(s);
    if (a > most) most = a;
  }
  return most;
}

fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const written = [];
for (const [name, samples] of Object.entries(SOUNDS)) {
  // The check that matters is "does this file actually contain a sound": an empty or silent
  // buffer is a valid WAV, plays fine, and is indistinguishable from the game being muted.
  const seconds = samples.length / RATE;
  if (seconds < 0.04) problems.push(`${name}: only ${(seconds * 1000).toFixed(0)} ms of audio`);
  const loudest = peak(samples);
  if (loudest < 0.05) problems.push(`${name}: peaks at ${loudest.toFixed(3)}, which is silence`);
  if (loudest > 1) problems.push(`${name}: peaks at ${loudest.toFixed(3)} and would clip`);

  const file = path.join(OUT, name);
  fs.writeFileSync(file, wav(samples));
  written.push([name, fs.statSync(file).size, seconds, loudest]);
}

console.log(`\n▸ wrote ${written.length} sounds to apps/mobile/assets/sounds/`);
for (const [name, bytes, seconds, loudest] of written) {
  console.log(
    `    ${name.padEnd(16)} ${String(bytes).padStart(6)} B   ${seconds.toFixed(2)} s   peak ${loudest.toFixed(2)}`,
  );
}
if (problems.length) {
  console.error(`\n✗ ${problems.length} sound(s) are not audible:`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}
