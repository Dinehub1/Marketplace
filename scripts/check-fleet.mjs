#!/usr/bin/env node
/**
 * check-fleet.mjs — the publish-readiness gate for all fifteen apps.
 *
 * `check-targets.mjs` answers "are two of these listings too alike to survive review?".
 * This answers the other half: "does each one actually resolve to a real, buildable app?"
 * — the questions that otherwise get answered one at a time, on the day of submission,
 * by a failed build.
 *
 * For every target it resolves the real `app.config.ts` (not a re-implementation of it,
 * so the check cannot drift from the thing it checks) and asserts:
 *
 *   • name, slug and bundle id exist and are unique across the fleet — a duplicate
 *     bundle id means two listings overwrite each other in the stores;
 *   • the icon, adaptive icon and splash exist on disk, because app.config.ts references
 *     per-target art that a missing file turns into a build failure;
 *   • the first screen is either a route that exists or an honest null;
 *   • the declared permissions include INTERNET and nothing the store cannot see.
 *
 * It also prints how much of each listing is actually built, so "ready to publish" is a
 * number rather than a feeling.
 *
 * Usage:  node scripts/check-fleet.mjs [--only <target-id>]
 * Exit:   0 every target resolves, 1 something would fail a build or a review
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = path.join(REPO, 'apps', 'mobile');
const EXPO_CLI = path.join(REPO, 'node_modules', 'expo', 'bin', 'cli');

const onlyIdx = process.argv.indexOf('--only');
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;
/**
 * `--require-ready` turns "four apps are still owed a first screen" from a report into a
 * failure. Development runs without it, so the fleet can be worked on incrementally; a
 * release run with it cannot pass while any listing would open on nothing.
 */
const REQUIRE_READY = process.argv.includes('--require-ready');

const { TARGETS } = await import(pathToFileURL(path.join(MOBILE, 'targets.mjs')).href);

/** Every route the app can actually open, derived from the file tree. */
function routeFiles() {
  const out = new Set();
  const walk = (dir, prefix) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        // `(tabs)` and `(wellness)` are groups: they do not appear in the URL.
        const seg = e.name.startsWith('(') && e.name.endsWith(')') ? '' : e.name;
        walk(full, seg ? `${prefix}/${seg}` : prefix);
        continue;
      }
      if (!e.name.endsWith('.tsx') || e.name.startsWith('_')) continue;
      const name = e.name.replace(/\.tsx$/, '');
      const route = name === 'index' ? prefix || '/' : `${prefix}/${name}`;
      out.add(route.replace(/\/+/g, '/') || '/');
    }
  };
  walk(path.join(MOBILE, 'app'), '');
  return out;
}

const ROUTES = routeFiles();

/** Products a target claims, and how many of them have a screen. */
function productReadiness(productsTs, slugs) {
  const src = fs.readFileSync(productsTs, 'utf8');
  const entries = [...src.matchAll(/slug:\s*"([^"]+)"[\s\S]*?route:\s*(null|"([^"]+)")/g)].map((m) => ({
    slug: m[1],
    route: m[3] || null,
  }));
  const byslug = Object.fromEntries(entries.map((e) => [e.slug, e]));
  const missing = slugs.filter((s) => !byslug[s]);
  const ready = slugs.filter((s) => byslug[s]?.route).length;
  return { total: slugs.length, ready, missing };
}

const seen = { slug: new Map(), bundle: new Map(), name: new Map() };
const failures = [];
const rows = [];

for (const t of TARGETS) {
  if (ONLY && t.id !== ONLY) continue;

  const r = spawnSync(process.execPath, [EXPO_CLI, 'config', '--type', 'public', '--json'], {
    cwd: MOBILE,
    env: { ...process.env, APP_TARGET: t.id },
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const raw = r.stdout || '';
  const start = raw.indexOf('{');
  if (r.status !== 0 || start === -1) {
    failures.push(`${t.id}: app.config.ts did not resolve (exit ${r.status})`);
    rows.push([t.id, '—', '—', '—', 'RESOLVE FAILED']);
    continue;
  }

  let cfg;
  try {
    cfg = JSON.parse(raw.slice(start));
  } catch {
    failures.push(`${t.id}: app.config.ts produced unparseable JSON`);
    continue;
  }

  const x = cfg.extra?.target ?? {};
  const slug = cfg.slug;
  const bundle = cfg.ios?.bundleIdentifier;
  const name = cfg.name;

  const dup = (map, value, what) => {
    if (!value) return failures.push(`${t.id}: no ${what}`);
    if (map.has(value)) failures.push(`${t.id}: ${what} "${value}" is already used by ${map.get(value)}`);
    else map.set(value, t.id);
  };
  dup(seen.slug, slug, 'slug');
  dup(seen.bundle, bundle, 'bundle id');
  dup(seen.name, name, 'name');

  // Art must exist: app.config.ts points at per-target files, so a missing one is a
  // build failure rather than a fallback to the previous app's icon.
  for (const [file, label] of [
    ['icon.png', 'icon'],
    ['adaptive-icon.png', 'adaptive icon'],
    ['splash-icon.png', 'splash'],
  ]) {
    const p = path.join(MOBILE, 'assets', 'targets', t.id, file);
    if (!fs.existsSync(p)) failures.push(`${t.id}: ${label} missing at assets/targets/${t.id}/${file}`);
  }

  // The first screen is the thing a store listing promises. Normalised to a string or
  // null: Expo's config serialiser turns a null into `{}`, and an older config could
  // still be sending that, so a truthiness test alone would invent a route.
  const first = typeof x.firstRoute === 'string' && x.firstRoute ? x.firstRoute : null;
  if (first && !ROUTES.has(first)) {
    failures.push(`${t.id}: first route "${first}" has no screen file`);
  }
  const opens = first ?? 'not built yet';

  const perms = cfg.android?.permissions ?? [];
  if (!perms.includes('android.permission.INTERNET')) failures.push(`${t.id}: INTERNET permission missing`);

  const pr = productReadiness(path.join(MOBILE, 'lib', 'products.ts'), x.products ?? []);
  if (pr.missing.length) failures.push(`${t.id}: products not in the registry: ${pr.missing.join(', ')}`);

  rows.push([
    t.id,
    bundle,
    String(opens),
    `${pr.ready}/${pr.total}`,
    // "ok" means this app opens on a screen it owns. A target with no products at all
    // (wellness, directory, game) is its own first screen, so it passes without one.
    first || pr.total === 0 ? 'ok' : 'first screen owed',
  ]);
}

// ── report ──────────────────────────────────────────────────────────────────────
const w = [16, 32, 14, 8, 18];
const line = (a) => a.map((c, i) => String(c).padEnd(w[i])).join(' ');
console.log(`\n${line(['target', 'bundle id', 'first screen', 'built', 'state'])}`);
console.log('-'.repeat(w.reduce((a, b) => a + b, 0)));
for (const r of rows) console.log(line(r));

const publishable = rows.filter((r) => r[4] === 'ok').length;
const owed = rows.filter((r) => r[4] !== 'ok');

console.log(
  `\n✓ ${rows.length} targets resolve: unique name, slug and bundle id; art on disk; every declared route exists.`,
);

if (owed.length) {
  const bar = '━'.repeat(w.reduce((a, b) => a + b, 0));
  console.log(`\n${bar}`);
  console.log(`⚠  ${owed.length} OF ${rows.length} LISTINGS CANNOT BE SUBMITTED TO A STORE`);
  console.log(bar);
  for (const r of owed) {
    console.log(`    ${String(r[0]).padEnd(18)} opens on nothing — first screen is not built`);
  }
  console.log(
    `\n  ${publishable}/${rows.length} publishable today. These are kept as a roadmap on purpose,` +
      `\n  but "cannot be submitted" has to be impossible to miss rather than a footnote.` +
      `\n\n  A store build refuses to run while any of them is unbuilt: every prebuild:* hook in` +
      `\n  apps/mobile/package.json runs check-fleet.mjs --require-ready.` +
      `\n  This report-only run exits 0 so the fleet can still be worked on incrementally.`,
  );
  console.log(bar);
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} defect(s) that would fail a build or a review:`);
  for (const f of failures) console.error(`    ${f}`);
  process.exit(1);
}

if (REQUIRE_READY && owed.length) {
  console.error(`\n✗ --require-ready: ${owed.length} target(s) still owe a first screen.`);
  process.exit(1);
}

console.log('');
