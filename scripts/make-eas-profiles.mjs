#!/usr/bin/env node
/**
 * make-eas-profiles.mjs — one EAS build profile per store app.
 *
 * Why profiles rather than a shell variable: `eas build` evaluates `app.config.ts` on
 * EAS's servers, not on this machine, so `APP_TARGET=breathe eas build …` does *not*
 * reach the builder. The only reliable place to pin a target is the profile, which is
 * uploaded with the build. One profile per target also means each app's build is
 * reproducible by name — `eas build --profile breathe` — instead of depending on what
 * happened to be exported in someone's terminal.
 *
 * Each profile extends `production` and gets its own update channel, so an over-the-air
 * update for one app can never land on another: they are separate store listings that
 * merely share a repository.
 *
 * Idempotent. Run it after adding a target:
 *   node scripts/make-eas-profiles.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = path.join(REPO, 'apps', 'mobile');
const EAS = path.join(MOBILE, 'eas.json');

const { TARGETS } = await import(pathToFileURL(path.join(MOBILE, 'targets.mjs')).href);
const eas = JSON.parse(fs.readFileSync(EAS, 'utf8'));

/** The marketplace is the existing listing and keeps the plain profile names. */
const DEFAULT_TARGET = 'sarkarmarketplace';

let added = 0;
for (const t of TARGETS) {
  if (t.id === DEFAULT_TARGET) continue;
  const profile = {
    extends: 'production',
    channel: t.id,
    env: { APP_TARGET: t.id },
  };
  const before = JSON.stringify(eas.build[t.id]);
  eas.build[t.id] = profile;
  if (before !== JSON.stringify(profile)) added++;
}

// Keep the file readable and diffable: base profiles first, targets after, alphabetical.
const KEY_ORDER = ['base', 'development', 'preview', 'production'];
const ordered = {};
for (const k of KEY_ORDER) if (eas.build[k]) ordered[k] = eas.build[k];
for (const k of Object.keys(eas.build).sort()) if (!ordered[k]) ordered[k] = eas.build[k];
eas.build = ordered;

fs.writeFileSync(EAS, `${JSON.stringify(eas, null, 2)}\n`);
console.log(`▸ eas.json: ${Object.keys(eas.build).length} build profiles (${added} changed)`);
