#!/usr/bin/env node
/**
 * app-map.mjs — which screenshot belongs to which store app.
 *
 * The gallery groups DropBy's pictures by *app identity*, not by "the app", because
 * there are twelve of them (apps/mobile/targets.mjs) and a screenshot is proof for
 * one listing, not for all twelve. This script reads that file — the single source
 * of truth for names, bundle ids, colours, categories and the products each app
 * exposes — and writes `apps.json` next to the PNGs, where the gallery reads it.
 *
 * The one thing targets.mjs does not know is which *screen file* implements a
 * product (a screen is a route, a product is a catalogue entry), so that mapping
 * lives in SCREEN_FOR_PRODUCT below; everything else is derived, never retyped.
 *
 * Usage: node scripts/app-map.mjs [--shots DIR]
 * Output: <shots>/apps.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS_DIR = process.env.SHOTS_DIR || 'C:/Users/Administrator/shots';

/** product slug -> the screen(s) that implement it, as they appear in filenames. */
const SCREEN_FOR_PRODUCT = {
  'passport-photo': ['passport'],
  // rotate and page-numbers are the same product's pickers: they only render after
  // the card is tapped, so they are separate captures but not a separate app's.
  'pdf-tools': ['pdf-tools', 'pdf-tools-rotate', 'pdf-tools-numbers'],
  'invoice-maker': ['invoice'],
  'bg-remove': ['bg-remove'],
  'signature-maker': ['signature'],
};

/** first-screen names in targets.mjs -> the screen slug that implements them. */
const SCREEN_FOR_FIRST = {
  grid: 'tools-hub',
  breathe: 'breathe',
  dashboard: null, // the shop dashboard is not built yet
  directory: 'home',
  camera: null, // the camera capture screen is the product screen itself
};

/**
 * Screens that belong to an app but do not carry a product slug: the toolbox
 * grew three jobs (metadata cleaner, photos to PDF, collage) whose screens are
 * part of that app's grid. Without this list they would sit in the gallery's
 * "no app claims this screen" pile, which reads like an orphan rather than a
 * toolbox feature.
 */
const EXTRA_SCREENS = {
  toolbox: ['exif-strip', 'photos-to-pdf', 'collage'],
};

const { TARGETS } = await import(pathToFileURL(path.join(REPO, 'apps', 'mobile', 'targets.mjs')).href);

function screensFor(t) {
  const out = new Set();
  for (const p of t.products ?? []) for (const s of SCREEN_FOR_PRODUCT[p] ?? []) out.add(s);
  if (t.game) out.add(t.game);
  if (t.directory) {
    out.add('home');
    out.add('business');
  }
  const first = SCREEN_FOR_FIRST[t.firstScreen];
  if (first) out.add(first);
  // One identity owns the whole wellness family: they share a tab bar, so they are one app.
  if (t.id === 'breathe') for (const sc of WELLNESS_SCREENS) out.add(sc);
  for (const s of EXTRA_SCREENS[t.id] ?? []) out.add(s);
  return [...out];
}

/** The wellness app's screens: one native tab bar, five products plus the hub. */
const WELLNESS_SCREENS = ['stretch', 'walk', 'habits', 'water', 'japa', 'sleep'];

const apps = TARGETS.map((t) => ({
  id: t.id,
  name: t.name,
  bundleId: t.bundleId,
  tagline: t.tagline,
  color: t.color,
  storeCategory: t.storeCategory,
  products: t.products ?? [],
  screens: screensFor(t),
  firstScreen: t.firstScreen,
  kind: t.game ? 'game' : t.directory ? 'directory' : 'product',
}));

// Screens that belong to no single listing: the paywall is web, and it takes the
// money for every paid product, so it is shown once as shared rather than twelve
// times.
const shared = [{ name: 'Money path (web)', screens: ['paywall'], note: 'the paywall the app hands off to; shared by every paid product' }];

const manifest = { generated: new Date().toISOString(), shots: SHOTS_DIR, apps, shared };
fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.writeFileSync(path.join(SHOTS_DIR, 'apps.json'), JSON.stringify(manifest, null, 2) + '\n');

const onDisk = new Set(
  fs.readdirSync(SHOTS_DIR).filter((f) => f.endsWith('.png')).map((f) => f.split('__')[1]).filter(Boolean)
);
for (const a of apps) {
  const have = a.screens.filter((s) => onDisk.has(s));
  const missing = a.screens.filter((s) => !onDisk.has(s));
  console.log(
    `${a.name.padEnd(34)} ${a.bundleId.padEnd(30)} ${String(a.products.length.toString()).padStart(2)} products · ` +
      `screens: ${have.length ? have.join(', ') : '—'}${missing.length ? `  (not captured: ${missing.join(', ')})` : ''}`
  );
}
const claimed = new Set(apps.flatMap((a) => a.screens).concat(shared.flatMap((s) => s.screens)));
const unclaimed = [...onDisk].filter((s) => !claimed.has(s));
console.log(
  `\n${apps.length} apps · ${[...onDisk].length} screens captured · ` +
    `${apps.filter((a) => !a.screens.length).length} apps with nothing to show yet` +
    (unclaimed.length ? ` · unclaimed screens: ${unclaimed.join(', ')}` : ' · every captured screen is claimed')
);
console.log(`wrote ${path.join(SHOTS_DIR, 'apps.json')}`);
