#!/usr/bin/env node
/**
 * apply-ai-icons.mjs — converts generated AI icon artifacts into store-ready target icons.
 *
 * Resizes the 1:1 image to 1024×1024, strips alpha channels, flattens onto the app's brand
 * background, and places it into apps/mobile/assets/targets/<id>/icon.png.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS_DIR = path.join(REPO, 'apps', 'mobile', 'assets', 'targets');

const { TARGETS, byId } = await import(
  pathToFileURL(path.join(REPO, 'apps', 'mobile', 'targets.mjs')).href
);

const AI_ICON_MAP = {
  wellness: 'wellness_icon_1790975108738.jpg',
  'passport-photo': 'passport_photo_icon_1790975132016.jpg',
  'pdf-tools': 'pdf_tools_icon_1790975150618.jpg',
  'room-redesign': 'room_redesign_icon_1790975170567.jpg',
  'subtitles-voice': 'subtitles_voice_icon_1790975197828.jpg',
  'resume-builder': 'resume_builder_icon_1790975223213.jpg',
  'shop-toolkit': 'shop_toolkit_icon_1790975257621.jpg',
  toolbox: 'toolbox_icon_1790975288268.jpg',
  swasthpath: 'swasthpath_icon_1790975319231.jpg',
  sheharbazaar: 'sheharbazaar_icon_1790975347723.jpg',
  gaadighar: 'gaadighar_icon_1790975381179.jpg',
  'tap-sprint': 'tap_sprint_icon_1790975414845.jpg',
  'word-duel': 'word_duel_icon_1790975466066.jpg',
};

const BRAIN_DIR = '/Users/mac/.gemini/antigravity-ide/brain/232af900-3c93-4fb6-93f8-17867c2b45ac';

let updated = 0;
for (const [targetId, filename] of Object.entries(AI_ICON_MAP)) {
  const src = path.join(BRAIN_DIR, filename);
  if (!fs.existsSync(src)) continue;

  const target = byId(targetId);
  const destDir = path.join(TARGETS_DIR, targetId);
  fs.mkdirSync(destDir, { recursive: true });

  const destFile = path.join(destDir, 'icon-ai.png');
  await sharp(src)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: target ? target.color : '#000000' })
    .png()
    .toFile(destFile);

  updated++;
}

console.log(`✓ Converted and formatted ${updated} AI icons to apps/mobile/assets/targets/<id>/icon-ai.png`);
