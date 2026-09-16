#!/usr/bin/env node
/**
 * make-app-icons.mjs — one icon set per store target.
 *
 * Nineteen listings need nineteen icons, and an icon is the first thing a reviewer
 * compares between two submissions: the same picture twice is evidence the apps are one
 * app, which is exactly what Play's "Spam and Minimum Functionality" and Apple's 4.3
 * reject. So the icons are generated from `targets.mjs` — the same file the duplicate
 * gate reads — rather than hand-managed, because hand-managed art is how seventeen icons
 * get updated and the nineteenth does not.
 *
 * These are deliberately plain: a monogram on the target's own accent. They are real,
 * distinct, and shippable, and they are also obviously placeholders — replace them with
 * designed art before the listing goes live, keeping the filenames and folder layout:
 *
 *   apps/mobile/assets/targets/<target-id>/
 *     icon.png           1024x1024  opaque, no transparency, no rounded corners
 *     adaptive-icon.png  1024x1024  transparent foreground, glyph inside the safe zone
 *     splash-icon.png     512x512   transparent, sits on the splash background
 *
 * Usage:  node scripts/make-app-icons.mjs
 * Exit:   0 written, 1 a target could not be rendered
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = path.join(REPO, 'apps', 'mobile');
const OUT_ROOT = path.join(MOBILE, 'assets', 'targets');

const { TARGETS } = await import(pathToFileURL(path.join(MOBILE, 'targets.mjs')).href);

/**
 * A short mark per target. Explicit rather than derived: "Passport Photo Maker" and
 * "PDF Toolkit" both want two letters out of four different words, and a rule that
 * guesses would eventually hand two apps the same monogram — the one thing this file
 * exists to prevent.
 */
const MARK = {
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
};

const lighten = (hex, amount) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `#${((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255))
    .toString(16)
    .padStart(6, '0')}`;
};

/** The monogram, sized to `size`, centred in a `size` box. `bg` null = transparent. */
function markSvg(mark, color, size, bg, fontScale = 0.34) {
  const top = lighten(color, 0.18);
  const bgRect = bg ? `<rect width="${size}" height="${size}" fill="url(#g)"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${color}"/>
  </linearGradient></defs>
  ${bgRect}
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${Math.round(size * fontScale)}"
        fill="${bg ? '#ffffff' : color}"
        letter-spacing="${mark.length > 2 ? -size * 0.012 : 0}">${mark}</text>
</svg>`;
}

let failed = 0;
const written = [];

for (const t of TARGETS) {
  const mark = MARK[t.id];
  if (!mark) {
    console.error(`  ✗ ${t.id}: no MARK entry — add one rather than letting it fall back`);
    failed++;
    continue;
  }
  const dir = path.join(OUT_ROOT, t.id);
  fs.mkdirSync(dir, { recursive: true });

  // iOS: opaque, square, no alpha. The OS applies the mask.
  await sharp(Buffer.from(markSvg(mark, t.color, 1024, true))).png().toFile(path.join(dir, 'icon.png'));

  // Android adaptive foreground: transparent, and the mark is kept well inside the
  // 66% safe zone because the launcher may crop it to a circle or a squircle.
  await sharp(Buffer.from(markSvg(mark, t.color, 1024, false, 0.22)))
    .png()
    .toFile(path.join(dir, 'adaptive-icon.png'));

  // Splash: transparent mark, drawn on the splash background from app.config.ts.
  await sharp(Buffer.from(markSvg(mark, t.color, 512, false, 0.30)))
    .png()
    .toFile(path.join(dir, 'splash-icon.png'));

  written.push(t.id);
}

console.log(`\n▸ wrote ${written.length} icon sets to apps/mobile/assets/targets/`);
console.log(`  ${written.join(', ')}`);
if (failed) {
  console.error(`\n${failed} target(s) failed.`);
  process.exit(1);
}
