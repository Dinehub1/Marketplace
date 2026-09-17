#!/usr/bin/env node
/**
 * make-app-icons.mjs — one icon set per store target, drawn rather than lettered.
 *
 * Twenty listings need twenty icons, and an icon is the first thing a reviewer compares between two
 * submissions: the same picture twice is evidence the apps are one app, which is exactly what Play's
 * "Spam and Minimum Functionality" and Apple's 4.3 reject. So the icons are generated from
 * `targets.mjs` — the same file the duplicate gate reads — rather than hand-managed, because
 * hand-managed art is how nineteen icons get updated and the twentieth does not.
 *
 * ── What changed, and why ───────────────────────────────────────────────────────────────
 *
 * This used to draw two or three letters on a coloured square. They were distinct and they were
 * obviously placeholders, and "obviously a placeholder" is a bad thing to hand a reviewer along with
 * nineteen siblings. Each target now has a **drawn mark** from `scripts/lib/icon-art.mjs`: the app's
 * own symbol, on a generated tile built from the app's own accent. The fallback for a target without
 * art is still a monogram, so adding an app to `targets.mjs` never produces an empty icon.
 *
 * ── The three files, and why they differ ────────────────────────────────────────────────
 *
 *   icon.png           1024×1024  opaque, no transparency, no rounded corners. iOS applies its own
 *                                 mask; supplying rounded corners gets them rounded twice.
 *   adaptive-icon.png  1024×1024  transparent foreground, mark inside the inner 66%. Android may
 *                                 crop this to a circle or a squircle and may magnify it by 1.1, so
 *                                 the mark is drawn much smaller here than on iOS. The background is
 *                                 supplied separately by the platform (see `app.config.ts`).
 *   splash-icon.png     512×512   transparent, sits on the splash background.
 *
 * Usage:  node scripts/make-app-icons.mjs
 * Exit:   0 written, 1 a target could not be rendered
 *
 * Look at the result with `node scripts/preview-app-icons.mjs` before shipping it — this script
 * proves the files exist, and only a person can say whether the art is any good.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = path.join(REPO, 'apps', 'mobile');
const OUT_ROOT = path.join(MOBILE, 'assets', 'targets');

const { TARGETS } = await import(pathToFileURL(path.join(MOBILE, 'targets.mjs')).href);
const { MARKS, TILE_SVG } = await import(
  pathToFileURL(path.join(REPO, 'scripts', 'lib', 'icon-art.mjs')).href
);

/**
 * A short mark per target, used **only** when a target has no drawn art yet.
 *
 * Explicit rather than derived: "Passport Photo Maker" and "PDF Toolkit" both want two letters out
 * of four different words, and a rule that guesses would eventually hand two apps the same monogram
 * — the one thing this file exists to prevent.
 */
const MONOGRAM = {
  breathe: 'BR',
  stretch: 'ST',
  walk: 'WK',
  water: 'WA',
  japa: 'JP',
  sleep: 'SL',
  'passport-photo': 'PP',
  'pdf-tools': 'PDF',
  'room-redesign': 'RR',
  'subtitles-voice': 'SV',
  'resume-builder': 'CV',
  'shop-toolkit': 'SH',
  toolbox: 'TB',
  sarkarhealth: 'DR',
  sarkarmarketplace: 'IN',
  sarkarcars: 'CAR',
  'tap-sprint': 'TS',
  'word-duel': 'WD',
  'block-clear': 'BC',
  'merge-tiles': 'MG',
};

let failed = 0;
const written = [];
const drawn = [];
const monogrammed = [];

for (const t of TARGETS) {
  const monogram = MONOGRAM[t.id];
  if (!monogram) {
    console.error(`  ✗ ${t.id}: no MONOGRAM entry — add one rather than letting it fall back`);
    failed++;
    continue;
  }
  const dir = path.join(OUT_ROOT, t.id);
  fs.mkdirSync(dir, { recursive: true });
  const opts = { id: t.id, monogram };

  // iOS: the full tile, opaque and square. `flatten` is not cosmetic — the SVG's own background
  // fills the canvas, but `sharp` still emits an alpha channel, and Apple rejects a store icon that
  // has one at all (transparency in an app icon is an ITMS-90717 warning and a review rejection).
  // Flattening onto the app's own colour makes the output RGB with no channel to argue about, and
  // it is also the right colour if a renderer ever rounds a corner and reveals a pixel.
  await sharp(Buffer.from(TILE_SVG(t.color, 1024, opts)))
    .flatten({ background: t.color })
    .png()
    .toFile(path.join(dir, 'icon.png'));

  // Android adaptive foreground: transparent, and inset to 0.42 rather than 0.52 because the
  // launcher crops the outer third and then may magnify what is left.
  await sharp(Buffer.from(TILE_SVG(t.color, 1024, { ...opts, glyphOnly: true, inset: 0.42 })))
    .png()
    .toFile(path.join(dir, 'adaptive-icon.png'));

  // Splash: the mark alone, on the splash background from `app.config.ts`.
  await sharp(Buffer.from(TILE_SVG(t.color, 512, { ...opts, glyphOnly: true, inset: 0.5 })))
    .png()
    .toFile(path.join(dir, 'splash-icon.png'));

  written.push(t.id);
  if (MARKS[t.id]) drawn.push(t.id);
  else monogrammed.push(t.id);
}

/*
 * ── The checks, run on what was actually written ─────────────────────────────────────────
 *
 * Every one of these is a store rejection, not a preference, and every one of them is invisible in
 * a filename listing — which is why the first version of this file could write a 97 KB icon with an
 * alpha channel and report success. Apple rejects an app icon that has transparency at all; Android
 * rejects an adaptive foreground that has none (it must show the launcher's background through it);
 * and a wrong dimension fails either store's upload. Checking the bytes is cheaper than a rejection.
 */
const problems = [];
const ICON_SPEC = [
  ['icon.png', 1024, false],
  ['adaptive-icon.png', 1024, true],
  ['splash-icon.png', 512, true],
];

for (const id of written) {
  for (const [file, size, wantsAlpha] of ICON_SPEC) {
    const full = path.join(OUT_ROOT, id, file);
    const meta = await sharp(full).metadata();
    if (meta.width !== size || meta.height !== size) {
      problems.push(`${id}/${file}: ${meta.width}×${meta.height}, expected ${size}×${size}`);
    }
    if (wantsAlpha && !meta.hasAlpha) {
      problems.push(`${id}/${file}: no alpha channel, but the platform expects transparency here`);
    }
    if (!wantsAlpha && meta.hasAlpha) {
      problems.push(`${id}/${file}: has an alpha channel — a store icon must be opaque`);
    }
  }
}

console.log(`\n▸ wrote ${written.length} icon sets to apps/mobile/assets/targets/`);
console.log(`  ${drawn.length} drawn marks, ${monogrammed.length} monograms`);
if (monogrammed.length) {
  console.log(`  still a monogram: ${monogrammed.join(', ')}`);
  console.log('  ^ these are real and shippable, but they are placeholders. Draw a mark in');
  console.log('    scripts/lib/icon-art.mjs and the same command picks it up.');
}
if (problems.length) {
  console.error(`\n✗ ${problems.length} file(s) would be rejected by a store:`);
  for (const p of problems) console.error(`    ${p}`);
  process.exit(1);
}
console.log('  ✓ every icon is opaque at 1024, every adaptive foreground transparent, every splash 512');
if (failed) {
  console.error(`\n${failed} target(s) failed.`);
  process.exit(1);
}
console.log('\n  Look at them before shipping: node scripts/preview-app-icons.mjs');
