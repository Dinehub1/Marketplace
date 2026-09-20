#!/usr/bin/env node
/**
 * app-shots.mjs — one command from source to pictures a human can look at.
 *
 * A screen is only shipped when someone can see it, so this is the visual twin of
 * a curl check: it exports the Expo app to a static bundle, drives the existing
 * Playwright harness (scripts/screenshot.mjs) over every screen at phone size in
 * light and dark, refuses to accept a shot whose screen markers are absent (a
 * blank page is not proof), and writes the PNGs into the folder the shots gallery
 * watches — shots.dropby.co.in picks them up on the next load, no build.
 *
 * Usage:
 *   node scripts/app-shots.mjs                     export, then capture every screen
 *   node scripts/app-shots.mjs --no-export         capture what is already exported
 *   node scripts/app-shots.mjs --only passport     one screen (substring match)
 *   node scripts/app-shots.mjs --themes dark       one scheme
 *   node scripts/app-shots.mjs --budget-kb 4000    fail if the JS bundle exceeds this
 *
 * Env: APP_BASE (default https://expo.dropby.co.in), SHOTS_DIR (default `shots/` in the
 *      repo root on every platform except the Windows capture VM, which keeps its own folder),
 *      MOBILE_APP (dir holding apps/mobile).
 *
 * Exit: 0 all screens captured and asserted, 1 a capture failed, 2 the export failed.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const APP_DIR = process.env.MOBILE_APP || path.join(REPO, 'apps', 'mobile');
/*
 * Where the pictures go.
 *
 * The capture VM has its own folder outside the checkout and keeps it by setting SHOTS_DIR; every
 * other machine gets `shots/` in the repo root, which is gitignored and has a double-clickable
 * `index.html` in it. The default used to be the VM's path on every platform, so running this on a
 * Mac tried to write to `C:/Users/Administrator/shots` — a directory that does not exist and cannot
 * be created — and the run failed at the first capture for a reason that had nothing to do with the
 * app.
 */
const SHOTS_DIR =
  process.env.SHOTS_DIR ||
  (process.platform === 'win32'
    ? 'C:/Users/Administrator/shots'
    : path.join(REPO, 'shots'));
const APP_BASE = (process.env.APP_BASE || 'https://expo.dropby.co.in').replace(/\/$/, '');
const WEB_BASE = (process.env.WEB_BASE || 'https://sarkarmarketplace.dropby.co.in').replace(/\/$/, '');
const HARNESS = path.join(HERE, 'screenshot.mjs');

/**
 * Every screen worth a picture, with the text that proves it rendered.
 *
 * `expect` is the point of the manifest: it is the difference between "we took a
 * screenshot" and "the screen was on the page". Keep the markers to copy that is
 * unique to that screen and cannot be produced by a marketing string.
 */
const SCREENS = [
  { name: 'home', route: '/', expect: [] }, // listings come from the API; no stable copy
  { name: 'tools-hub', route: '/tools', expect: ['EVERYDAY TOOLS', 'Small jobs,'] },
  { name: 'passport', route: '/passport', expect: ['Passport photo', 'Choose the size', 'Take or choose a photo'] },
  { name: 'bg-remove', route: '/tools/bg-remove', expect: ['Remove the'] },
  { name: 'signature', route: '/tools/signature', expect: ['Sign it with', 'Sign here'] },
  { name: 'pdf-tools', route: '/tools/pdf', expect: ['Pick a job,'], interact: 'pdf-rotate-pick' },
  { name: 'exif-strip', route: '/tools/exif-strip', expect: ['Choose a photo', 'no location, no camera name'] },
  { name: 'photos-to-pdf', route: '/tools/photos-to-pdf', expect: ['Photos into', 'Page size'] },
  { name: 'collage', route: '/tools/collage', expect: ['A few photos,', 'Shape'], interact: 'collage-shape-pick' },
  { name: 'resume-checker', route: '/tools/resume-checker', expect: ['DOCUMENT CHECK', 'document says', 'not counted inside', 'no text layer'] },
  // The one toolbox screen whose job is run by a hosted model: its markers are the
  // badge, the sentence that says it draws rather than designs, and the cap that says
  // a run cannot be undone.
  { name: 'ai-image', route: '/tools/ai-image', expect: ['TEXT TO IMAGE', 'and the model draws it', 'One picture per run'] },
  // The second toolbox screen whose job leaves this box, and the only one that both
  // reads a document and bills per run. Its markers are the badge, the language picker
  // and the swap control, all of which are on the screen before anything is sent — so
  // the capture cannot accidentally require a paid job to have run.
  { name: 'translate-doc', route: '/tools/translate-doc', expect: ['DOCUMENT TRANSLATION', 'other language', 'Swap the two', 'no text layer to translate'] },
  { name: 'invoice', route: '/tools/invoice', expect: ['Shop name', 'Your shop', 'HSN is the code', 'applies to every item', 'The number counts itself once your shop name is in'], interact: 'invoice-upi-preview' },
  // The only screen with no server behind it: if this one fails, the fault is the
  // screen, never the network — so its markers are about the screen's own copy.
  // The wellness family: five screens on one native tab bar, every one of them offline.
  // Their markers are the copy that only that screen says.
  // Stretch and Breathe carry probes because their *transition* is the part that breaks: the setup
  // screen renders perfectly whether or not pressing Start survives, so a marker cannot see it. The
  // Stretch probe exists because that transition once crashed the app.
  { name: 'stretch', route: '/stretch', expect: ['Desk mobility', 'Start routine'], interact: 'stretch-start' },
  { name: 'walk', route: '/walk', expect: ['Fast for a minute', 'Start walking'] },
  { name: 'habits', route: '/habits', expect: ['GLASSES', 'BEADS'] },
  // The two pages that make this more than a one-pager: the charts, and the settings that
  // move the numbers on them.
  { name: 'progress', route: '/progress', expect: ['ALL SIX', 'LAST 30 DAYS'] },
  { name: 'profile', route: '/profile', expect: ['YOUR GOALS', 'YOUR DATA'] },
  { name: 'water', route: '/water', expect: ['Add a glass', 'What this is not'] },
  { name: 'japa', route: '/japa', expect: ['Tap anywhere to count', 'bead'] },
  { name: 'sleep', route: '/sleep', expect: ['4 IN · 7 HOLD · 8 OUT', 'Start the rounds'] },
  { name: 'breathe', route: '/breathe', expect: ['breaths a minute', 'What this is not'], interact: 'breathe-start' },
  // `interact` (see scripts/interactions.mjs) is the difference between "the game
  // rendered" and "the game works": tap-sprint's field was inert for a day of
  // captures (item 21) and every PNG passed the marker check, because a screenshot
  // of a game that cannot score looks exactly like one that can.
  { name: 'tap-sprint', route: '/tap-sprint', expect: ['How fast are your taps?'], interact: 'tap-sprint-hit' },
  { name: 'word-duel', route: '/word-duel', expect: ['How many words in sixty seconds?'], interact: 'word-duel-pick' },
  // The untimed one. Its picture is taken with a piece already on the board, which is
  // the only version of this screen that proves the two-tap placement works.
  { name: 'block-clear', route: '/block-clear', expect: ['Fit the blocks, clear the lines', 'Eight by eight'], interact: 'block-clear-place' },
  // The four directory tabs and the two shop-owner screens had **no** light/dark pair at
  // all until the theme audit (item 38): the gallery only ever held the screens somebody
  // remembered to capture, so half the app could not be checked for dark mode. Each
  // marker is copy that screen owns.
  // `browse` carries a probe because its marker is the *header* line, which renders over an
  // empty list too (item 51): the feed's primary interaction — pressing a listing — has to be
  // seen to work, not inferred from a header that a broken feed also prints.
  {
    name: 'browse',
    route: '/browse',
    expect: ['businesses you can call straight away'],
    interact: 'browse-listing-open',
  },
  { name: 'search', route: '/search', expect: ['POPULAR SEARCHES'] },
  { name: 'saved', route: '/saved', expect: ['Nothing saved yet'] },
  { name: 'account', route: '/account', expect: ['Own a business?'] },
  // One real listing — the row the listing writer filled in — because a directory app's
  // second screen is a business page.
  { name: 'business', route: '/business/119465', expect: ['Business details'] },
  // /owner redirects here while signed out, so the dashboard's own picture waits for a
  // signed-in capture; this is the screen a person actually sees.
  { name: 'owner-sign-in', route: '/owner/sign-in', expect: ['one-time code'] },
  // The Shop Toolkit's own first screen. It is not the toolbox hub on purpose — a shop's
  // front door is one action, not a grid — so its marker is copy only this screen owns.
  { name: 'shop-dashboard', route: '/shop', expect: ['Your shop', 'Make a bill'] },
  // The Subtitles & Voice-over chooser, and the two product screens behind it. The chooser's
  // marker is its own honest-limits block, which no other screen carries.
  { name: 'subtitles-chooser', route: '/subtitles', expect: ['Captions and voice', 'What these do, exactly'] },
  { name: 'subtitles', route: '/tools/subtitles', expect: ['Captions, timed', 'The audio'] },
  { name: 'voiceover', route: '/tools/voiceover', expect: ['read aloud', 'The script'] },
  // Room Redesign's first screen, whose marker is the promise about what stays and changes.
  { name: 'room-redesign', route: '/tools/room-redesign', expect: ['Your room', 'The look'] },
  // The number game. Its picture is taken after a slide for the same reason: an arrow
  // that reaches the board and one that does nothing look identical in a still.
  { name: 'merge-tiles', route: '/merge-tiles', expect: ['Slide the tiles, double the numbers', 'Four by four'], interact: 'merge-tiles-slide' },
  // The paywall is a web page, not an app screen, but it is where the money is
  // taken — so it belongs in the same gallery.
  { name: 'paywall', url: `${WEB_BASE}/unlock/33`, expect: ['Verify your', '₹'] },
];

// ------------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const opts = { export: true, only: null, themes: ['light', 'dark'], budgetKb: null, viewport: 'mobile' };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const val = () => {
    const v = argv[++i];
    if (v === undefined) {
      console.error(`error: ${a} needs a value`);
      process.exit(1);
    }
    return v;
  };
  if (a === '--no-export') opts.export = false;
  else if (a === '--only') opts.only = val();
  else if (a === '--viewport') opts.viewport = val();
  else if (a === '--themes') opts.themes = val().split(',').map((t) => t.trim()).filter(Boolean);
  else if (a === '--budget-kb') opts.budgetKb = Number(val());
  else if (a === '-h' || a === '--help') {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('/**')[1]);
    process.exit(0);
  } else {
    console.error(`error: unknown option ${a}`);
    process.exit(1);
  }
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

// ---------------------------------------------------------------------- export

function exportApp() {
  console.log(`\n▸ exporting the app (apps/mobile → dist)`);
  const r = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['expo', 'export', '--platform', 'web'],
    { cwd: APP_DIR, encoding: 'utf8', shell: process.platform === 'win32' }
  );
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  if (r.status !== 0) {
    console.error('export failed:\n' + out.slice(-2000));
    process.exit(2);
  }
  console.log(out.trim().split('\n').slice(-6).map((l) => '  ' + l).join('\n'));
}

/** Size on disk of the export — the number to watch when the app grows. */
function bundleReport() {
  const dist = path.join(APP_DIR, 'dist');
  if (!fs.existsSync(dist)) return null;
  let total = 0;
  let js = 0;
  const parts = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        const before = total;
        walk(p);
        parts.push([path.relative(dist, p), total - before]);
      } else {
        const size = fs.statSync(p).size;
        total += size;
        // Counted per file: only directories were being listed before, so the JS
        // total came out as 0 on a 3 MB bundle.
        if (p.endsWith('.js')) js += size;
        if (size > 200 * 1024) parts.push([path.relative(dist, p), size]);
      }
    }
  };
  walk(dist);
  parts.sort((a, b) => b[1] - a[1]);
  return { total, js, top: parts.filter(([n]) => !n.endsWith('.js')).slice(0, 4) };
}

// ----------------------------------------------------------------- health check

async function reachable(url) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 20000);
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    clearTimeout(t);
    return res.status;
  } catch (e) {
    return `unreachable (${e.message})`;
  }
}

// -------------------------------------------------------------------- capture

function shoot({ name, url, expect, interact }, view) {
  // One file per group/screen/view: <group>__<screen>__<view>.png, which is what
  // the gallery parses to group the pictures and offer the view switcher.
  const outFile = path.join(SHOTS_DIR, `app__${name}__${view}.png`);
  const args = [HARNESS, url, outFile, '--viewport', opts.viewport, '--json', '--wait', '2200'];
  if (view.endsWith('dark')) args.push('--dark');
  for (const e of expect) args.push('--expect', e);
  // The positive control, when the screen has one (see scripts/interactions.mjs).
  if (interact) args.push('--interact', interact);
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', env: process.env });
  const line = (r.stdout || '').trim().split('\n').filter((l) => l.trim().startsWith('{')).pop();
  let info = {};
  try {
    info = JSON.parse(line || '{}');
  } catch {
    /* fall through to the exit code */
  }
  return { name, view, file: outFile, code: r.status, ...info };
}

// ----------------------------------------------------------------------- main

fs.mkdirSync(SHOTS_DIR, { recursive: true });
if (opts.export) exportApp();

const bundle = bundleReport();
if (bundle) {
  console.log(`\n▸ app export size: ${(bundle.total / 1048576).toFixed(2)} MB total, ${kb(bundle.js)} JS`);
  for (const [n, b] of bundle.top) console.log(`    ${kb(b).padStart(9)}  ${n}`);
  if (opts.budgetKb && bundle.js / 1024 > opts.budgetKb) {
    console.error(`\n✗ JS bundle ${kb(bundle.js)} exceeds the --budget-kb ${opts.budgetKb} KB budget`);
  }
}

const status = await reachable(`${APP_BASE}/`);
console.log(`\n▸ preview host ${APP_BASE} → HTTP ${status}`);
if (status !== 200) {
  console.error('  the preview is not serving; start it with  pm2 restart expo-preview');
  process.exit(1);
}

const targets = SCREENS.filter((s) => !opts.only || s.name.includes(opts.only) || s.route?.includes(opts.only));
if (!targets.length) {
  console.error(`no screen matches --only ${opts.only}`);
  process.exit(1);
}

const results = [];
for (const s of targets) {
  const url = s.url || `${APP_BASE}${s.route}`;
  for (const theme of opts.themes) {
    const view = `${opts.viewport}-${theme}`;
    const r = shoot({ ...s, url }, view);
    results.push(r);
    const mark =
      r.code === 0 && r.ok !== false
        ? '✓'
        : r.interactionFailed
          ? '✗ probe'
          : r.code === 3
            ? '✗ asserted'
            : '✗';
    const missing = r.expectMissing ? `  missing: ${r.expectMissing.join(', ')}` : '';
    const probe = r.interactionFailed
      ? `  probe ${s.interact} did not happen: ${r.interactionFailed}`
      : r.interaction
        ? `  probe: ${r.interaction.detail}`
        : '';
    console.log(
      `  ${mark} ${s.name.padEnd(12)} ${view.padEnd(12)} http=${r.status ?? '-'} ` +
        `${r.bytes ? kb(r.bytes) : '-'} page=${r.dimensions ? `${r.dimensions.scrollWidth}x${r.dimensions.scrollHeight}` : '-'}${missing}${probe}`
    );
  }
}

const failed = results.filter((r) => r.code !== 0 || r.ok === false);
console.log(`\n▸ ${results.length - failed.length}/${results.length} captures ok, written to ${SHOTS_DIR}`);
console.log(`▸ gallery: https://shots.dropby.co.in/  (grouped by app, one view per screen)`);
if (failed.length) {
  console.error(`\n✗ failed: ${failed.map((f) => `${f.name}/${f.view} (exit ${f.code})`).join(', ')}`);
  process.exit(1);
}
process.exit(0);
