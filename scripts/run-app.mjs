#!/usr/bin/env node
/**
 * run-app.mjs — start the dev server for one of the twenty apps.
 *
 * Why this exists: the raw command is three things to remember and two to get wrong.
 *
 *   APP_TARGET=japa npx expo start --port 8083
 *
 * The target id is an environment variable that has to sit *before* the command (it is
 * read by app.config.ts, not by Expo's CLI), the port has to dodge whatever else is on
 * this machine, and the shell has to be in apps/mobile or Expo cannot find a
 * package.json. This script removes all three: the id is an argument, the port is chosen
 * for you, and the working directory is set here rather than inherited from wherever you
 * happened to be standing.
 *
 * Usage:
 *   npm run app                  list every app
 *   npm run app -- japa          run one (port chosen automatically)
 *   npm run app -- toolbox --port 8099
 *
 * Exit: 0 the server ran and stopped, 1 the id is unknown or the port is taken.
 */
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = path.join(REPO, 'apps', 'mobile');
const EXPO_CLI = path.join(REPO, 'node_modules', 'expo', 'bin', 'cli');

const { TARGETS, FIRST_ROUTE, familyOf } = await import(
  pathToFileURL(path.join(MOBILE, 'targets.mjs')).href
);

// ── arguments ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const portIdx = argv.indexOf('--port');
const wantedPort = portIdx > -1 ? Number(argv[portIdx + 1]) : null;
/**
 * Everything that is not a flag, or a flag's value, is the target id. Guarded on
 * `portIdx > -1`: without it, `portIdx + 1` is 0 when no `--port` was given, which
 * silently filtered out the first argument — so `npm run app -- tap-sprint` printed the
 * list instead of running Tap Sprint.
 */
const portValueIdx = portIdx > -1 ? portIdx + 1 : -1;
const positional = argv.filter((a, i) => !a.startsWith('--') && i !== portValueIdx);
const id = positional[0];

const openOn = (t) => (FIRST_ROUTE[t.id] ? FIRST_ROUTE[t.id] : 'a "not built yet" screen');

if (!id) {
  console.log('\nTwenty apps, one codebase. Pick one:\n');
  const w = [16, 10, 32, 22];
  const line = (a) => a.map((c, i) => String(c).padEnd(w[i])).join(' ');
  console.log(line(['id', 'family', 'app name', 'opens on']));
  console.log('-'.repeat(w.reduce((a, b) => a + b, 0)));
  for (const t of TARGETS) console.log(line([t.id, familyOf(t), t.name, openOn(t)]));
  console.log('\nRun one:   npm run app -- <id>');
  console.log('Pick port: npm run app -- <id> --port 8083\n');
  process.exit(0);
}

const target = TARGETS.find((t) => t.id === id);
if (!target) {
  console.error(`\nUnknown app "${id}".`);
  console.error(`Known ids: ${TARGETS.map((t) => t.id).join(', ')}\n`);
  process.exit(1);
}

// ── a port that is actually free ────────────────────────────────────────────────
const isFree = (port) =>
  new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '0.0.0.0');
  });

/** 8081 is a common default and is often already taken by another project. */
async function pickPort(start) {
  for (let p = start; p < start + 40; p += 1) {
    if (await isFree(p)) return p;
  }
  return null;
}

const port = wantedPort ?? (await pickPort(8082));
if (port === null) {
  console.error('\nNo free port found between 8082 and 8121.\n');
  process.exit(1);
}
if (wantedPort && !(await isFree(wantedPort))) {
  console.error(`\nPort ${wantedPort} is already in use. Try another, or omit --port to let this pick one.\n`);
  process.exit(1);
}

// ── banner ──────────────────────────────────────────────────────────────────────
function lanAddress() {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return 'localhost';
}
const lan = lanAddress();

console.log('');
console.log(`  ${target.name}`);
console.log(`  ${target.tagline}`);
console.log('');
console.log(`  target      ${target.id}  (${familyOf(target)})`);
console.log(`  opens on    ${openOn(target)}`);
console.log(`  permissions ${target.permissions.length ? target.permissions.join(', ') : 'none'}`);
console.log('');
console.log(`  On this Mac     http://localhost:${port}`);
console.log(`  On your iPhone  exp://${lan}:${port}`);
console.log('');
console.log('  Open Expo Go and enter the second address, or scan the QR printed below.');
console.log('  Stop the server with Ctrl-C.');
console.log('');

// ── run ─────────────────────────────────────────────────────────────────────────
const r = spawnSync(process.execPath, [EXPO_CLI, 'start', '--port', String(port)], {
  cwd: MOBILE,
  env: { ...process.env, APP_TARGET: target.id },
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
