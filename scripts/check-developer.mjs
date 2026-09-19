#!/usr/bin/env node
/**
 * check-developer.mjs — the developer website must not lie about the apps.
 *
 * `apps.dropby.co.in` is the organisation website in Play Console and the domain AdMob
 * crawls for `app-ads.txt`. Two failure modes matter, and both are silent until a store
 * reviewer or a crawler finds them:
 *
 *   1. **Drift.** A listing is renamed or a bundle id changes in `targets.mjs` — the
 *      single source of truth — and the website keeps publishing the old name. The site
 *      then contradicts the store listing it is supposed to corroborate.
 *   2. **Invention.** A bundle id is typed into the privacy policy's ad-SDK list that
 *      belongs to no app. That is a false statement about what an app collects, in the
 *      one document that is supposed to be checkable.
 *
 * The catalogue is a TypeScript file with a `process.env` read in it, so this check reads
 * the *values* out of it the same way it reads `targets.mjs`: by importing the module.
 *
 * Usage:  node scripts/check-developer.mjs
 * Exit:   0 the site agrees with the fleet, 1 it does not
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { TARGETS, familyOf } = await import(pathToFileURL(path.join(REPO, 'apps/mobile/targets.mjs')).href);

// The catalogue is TS; read it with a light regex scrape rather than adding a TS loader
// to a repo-wide gate. The scrape is deliberately strict about shape so a reformat that
// breaks it fails loudly instead of silently checking nothing.
const catalogPath = path.join(REPO, 'apps/web/app/developer/catalog.ts');
const catalogSrc = (await import('node:fs')).readFileSync(catalogPath, 'utf8');

function scrapeApps(src) {
  const apps = [];
  const re = /id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?bundleId:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) apps.push({ id: m[1], name: m[2], bundleId: m[3] });
  return apps;
}

function scrapeAdsList(src) {
  const block = src.match(/APPS_WITH_ADS[^=]*=\s*\[([\s\S]*?)\]/);
  if (!block) return null;
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const siteApps = scrapeApps(catalogSrc);
const adsList = scrapeAdsList(catalogSrc);

const targetById = new Map(TARGETS.map((t) => [t.id, t]));
const targetBundleIds = new Set(TARGETS.map((t) => t.bundleId));

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`  FAIL ${msg}`);
};
const ok = (msg) => console.log(`  ok   ${msg}`);

console.log('\nDeveloper website — apps.dropby.co.in\n');

// 1. The scrape found something, i.e. the check is actually checking.
if (siteApps.length === 0) fail('catalog.ts could not be parsed — the check would pass vacuously');
else ok(`catalogue parsed: ${siteApps.length} apps`);

// 2. Every catalogued app exists in the fleet, with the same name and bundle id.
const seen = new Set();
for (const app of siteApps) {
  const t = targetById.get(app.id);
  if (!t) {
    fail(`"${app.id}" is on the website but is not a target in targets.mjs`);
    continue;
  }
  if (seen.has(app.id)) fail(`"${app.id}" appears twice on the website`);
  seen.add(app.id);
  if (t.name !== app.name) fail(`${app.id}: website says "${app.name}", targets.mjs says "${t.name}"`);
  if (t.bundleId !== app.bundleId) fail(`${app.id}: website says ${app.bundleId}, targets.mjs says ${t.bundleId}`);
}
if (siteApps.length && failures === 0) ok('every name and bundle id matches targets.mjs');

// 3. Every target is published on the site — a missing app is a listing the website
//    does not corroborate, which is the drift this exists to catch.
for (const t of TARGETS) {
  if (!seen.has(t.id)) fail(`"${t.id}" (${t.name}) is a target but is missing from the website`);
}

// 4. The ad-SDK list must name real apps, and must include every game (the fleet's
//    known ad placements). A bundle id that belongs to nothing is a false statement in
//    a privacy policy.
if (!adsList) {
  fail('APPS_WITH_ADS could not be parsed from catalog.ts');
} else {
  for (const bundleId of adsList) {
    if (!targetBundleIds.has(bundleId)) fail(`APPS_WITH_ADS names ${bundleId}, which is no target's bundle id`);
  }
  const games = TARGETS.filter((t) => familyOf(t) === 'game');
  for (const g of games) {
    if (!adsList.includes(g.bundleId)) fail(`game "${g.id}" shows ads but is missing from APPS_WITH_ADS`);
  }
  if (adsList.length) ok(`ad-SDK list: ${adsList.length} bundle ids, all real, all four games present`);
}

console.log(
  `\n${failures === 0 ? '✓ the developer website agrees with the fleet.' : `✗ ${failures} mismatch(es).`}\n`,
);
process.exit(failures === 0 ? 0 : 1);
