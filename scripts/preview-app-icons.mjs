#!/usr/bin/env node
/**
 * preview-app-icons.mjs — render icon candidates to one contact sheet, to be *looked at*.
 *
 * Why this exists: `make-app-icons.mjs` writes twenty icons into twenty folders and prints a list of
 * filenames. That tells you the script ran; it does not tell you whether the thing it drew is any
 * good, and an icon is the one asset where "it rendered" and "it is good" are furthest apart. This
 * does the obvious thing instead — it draws each mark three ways, side by side, in one PNG, so a
 * person can look and choose.
 *
 * Three readings per app, because that is the only honest test:
 *   tile@200   the icon as the store shows it
 *   glyph@200  the mark alone, on light grey — the Android adaptive foreground's real appearance
 *   glyph@60   the mark at the size a home screen shows it, which is where detail dies
 *
 * Usage:  node scripts/preview-app-icons.mjs [out.png]
 * Exit:   0 written, 1 nothing to draw
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(REPO, 'apps', 'mobile', 'assets', 'icon-preview.png');

const { TARGETS } = await import(pathToFileURL(path.join(REPO, 'apps', 'mobile', 'targets.mjs')).href);
const { TILE_SVG } = await import(pathToFileURL(path.join(REPO, 'scripts', 'lib', 'icon-art.mjs')).href);

/**
 * The marks to show. Defaults to the whole fleet, because a contact sheet that omits half the apps
 * is a contact sheet that lets two of them accidentally look the same — which is the one thing the
 * icon set exists to prevent. Pass ids as extra arguments to narrow it down while iterating.
 */
const wanted = process.argv.slice(3);
const shown = wanted.length ? TARGETS.filter((t) => wanted.includes(t.id)) : TARGETS;
if (!shown.length) {
  console.error('✗ no targets to draw');
  process.exit(1);
}

const CELL = 200;
const GAP = 18;
const PAD = 26;
const LABEL_H = 34;
const GLYPH = 1024; // the viewBox the marks are authored against; the sheet scales them down
/**
 * Ten apps per row. Twenty apps in one row is 13,000 px wide, which is a sheet nobody can look at
 * in one go — and looking at it is the entire point of this script.
 */
const PER_ROW = 10;

const rows = Math.ceil(shown.length / PER_ROW);
const cols = Math.min(shown.length, PER_ROW) * 3;
const width = PAD * 2 + cols * CELL + (cols - 1) * GAP;
const height = PAD * 2 + rows * (CELL + LABEL_H + GAP) - GAP;

const tiles = [];
shown.forEach((t, n) => {
  const row = Math.floor(n / PER_ROW);
  const col = (n % PER_ROW) * 3;
  const y0 = PAD + row * (CELL + LABEL_H + GAP);
  const x0 = PAD + col * (CELL + GAP);

  // 1. The tile, exactly as `make-app-icons.mjs` writes `icon.png`.
  tiles.push(
    `<svg x="${x0}" y="${y0}" width="${CELL}" height="${CELL}" viewBox="0 0 ${GLYPH} ${GLYPH}">${strip(
      TILE_SVG(t.color, GLYPH, { id: t.id }),
    )}</svg>`,
  );

  // 2. The mark alone, which is the adaptive icon's foreground and the splash mark.
  const gx = x0 + CELL + GAP;
  tiles.push(`<rect x="${gx}" y="${y0}" width="${CELL}" height="${CELL}" rx="14" fill="#f4f4f5"/>`);
  tiles.push(
    `<svg x="${gx}" y="${y0}" width="${CELL}" height="${CELL}" viewBox="0 0 ${GLYPH} ${GLYPH}">${strip(
      TILE_SVG(t.color, GLYPH, { id: t.id, glyphOnly: true }),
    )}</svg>`,
  );

  // 3. The same mark shown at the 60 px a home screen actually gives it, in a 200 px cell so the
  //    detail that dies at that size is visible in the sheet rather than hidden by it.
  const sx = x0 + (CELL + GAP) * 2;
  const box = CELL * 0.34;
  const inset = (CELL - box) / 2;
  tiles.push(`<rect x="${sx}" y="${y0}" width="${CELL}" height="${CELL}" rx="14" fill="#f4f4f5"/>`);
  tiles.push(
    `<svg x="${sx + inset}" y="${y0 + inset}" width="${box}" height="${box}" viewBox="0 0 ${GLYPH} ${GLYPH}">${strip(
      TILE_SVG(t.color, GLYPH, { id: t.id, glyphOnly: true }),
    )}</svg>`,
  );

  tiles.push(
    `<text x="${x0}" y="${y0 + CELL + 22}" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#3f3f46">${t.id}</text>`,
  );
});

/** Inner markup only: the sheet embeds each icon as a nested `<svg>`. */
function strip(svg) {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  ${tiles.join('\n  ')}
</svg>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await sharp(Buffer.from(sheet)).png().toFile(OUT);
const bytes = fs.statSync(OUT).size;
console.log(`\n▸ ${path.relative(REPO, OUT)}  ${width}×${height}  ${(bytes / 1024).toFixed(0)} KB`);
console.log(`  ${shown.length} app(s) × 3 readings (tile · glyph · glyph at 60 px)`);
console.log('  Look at it before shipping it. This script exists because a filename is not a review.');
