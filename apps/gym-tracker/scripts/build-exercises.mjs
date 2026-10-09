#!/usr/bin/env node
/**
 * build-exercises.mjs — regenerate data/exercises.json and data/EXERCISES-LICENSE.txt.
 *
 * Source: hasaneyldrm/exercises-dataset, pinned to one commit so a rebuild is reproducible.
 * The text fields (name, body part, equipment, muscles, English steps) are MIT-licensed and are
 * bundled. The pictures are NOT: they belong to Gym visual. Only each exercise's media key
 * (e.g. "0001-2gPfomN") is kept, so lib/media.ts can load the picture from the dataset's CDN at
 * runtime, and that loading can be switched off in one place. No image bytes or URLs are bundled.
 *
 * Usage:
 *   npm run build:exercises -w @hermes/gym-tracker            downloads the pinned commit
 *   npm run build:exercises -w @hermes/gym-tracker -- ex.json uses an already-downloaded copy
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMIT = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd';
const RAW = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${COMMIT}`;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

async function text(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

const local = process.argv[2];
const source = JSON.parse(local ? fs.readFileSync(local, 'utf8') : await text(`${RAW}/data/exercises.json`));
const license = await text(`${RAW}/LICENSE`);

const steps = (e) => {
  const s = e.instruction_steps?.en ?? e.instruction_steps;
  if (Array.isArray(s) && s.length) return s.map((x) => String(x).trim()).filter(Boolean);
  return [String(e.instructions?.en ?? '').trim()].filter(Boolean);
};

/** "images/0001-2gPfomN.jpg" -> "0001-2gPfomN"; the CDN serves images/<key>.jpg and videos/<key>.gif. */
const mediaKey = (e) => {
  const m = String(e.image ?? '').match(/^images\/([\w-]+)\.jpg$/);
  return m ? m[1] : null;
};

const out = source
  .map((e) => ({
    id: String(e.id),
    name: String(e.name).trim(),
    bodyPart: e.body_part,
    equipment: e.equipment,
    target: e.target,
    secondary: Array.isArray(e.secondary_muscles) ? e.secondary_muscles : [],
    steps: steps(e),
    media: mediaKey(e),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const ids = new Set(out.map((e) => e.id));
if (ids.size !== out.length) throw new Error('duplicate exercise ids in source');
if (out.some((e) => !e.name || !e.bodyPart || !e.equipment)) throw new Error('exercise missing name/bodyPart/equipment');
const leaked = JSON.stringify(out).match(/gymvisual|https?:|\.gif|\.png|\.jpe?g|\.mp4/i);
if (leaked) throw new Error(`media URL leaked into output (only keys belong here): ${leaked[0]}`);
const noMedia = out.filter((e) => !e.media).length;
if (noMedia) console.warn(`${noMedia} exercises have no media key`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'exercises.json'), `${JSON.stringify(out)}\n`);
fs.writeFileSync(
  path.join(OUT, 'EXERCISES-LICENSE.txt'),
  `Exercise names, categories, muscles and instructions in exercises.json come from\n` +
    `https://github.com/hasaneyldrm/exercises-dataset (commit ${COMMIT}),\n` +
    `used under the MIT License reproduced below. No images from that dataset are bundled; they are\n` +
    `© Gym visual (https://gymvisual.com/) and are loaded from the dataset's CDN at runtime only.\n\n${license.trim()}\n`,
);
console.log(`wrote ${out.length} exercises (${(fs.statSync(path.join(OUT, 'exercises.json')).size / 1024).toFixed(0)} KB)`);
