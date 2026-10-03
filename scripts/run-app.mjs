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
function findExpoCli(dir) {
  const list = [
    path.join(REPO, 'node_modules', 'expo', 'bin', 'cli'),
    path.join(dir, 'node_modules', 'expo', 'bin', 'cli'),
    path.join(MOBILE, 'node_modules', 'expo', 'bin', 'cli'),
  ];
  for (const p of list) {
    if (fs.existsSync(p)) return p;
  }
  return 'npx';
}

const { TARGETS, FIRST_ROUTE, familyOf, isStandalone } = await import(
  pathToFileURL(path.join(MOBILE, 'targets.mjs')).href
);

const WEB_TARGET = {
  id: 'web',
  name: 'Dropby / Marketplace Web Portal',
  bundleId: 'web',
  tagline: 'Next.js marketplace web application & directory',
  permissions: [],
  storeCategory: 'Web',
  family: 'web',
};

const ALL_TARGETS = [...TARGETS, WEB_TARGET];

const ALIASES = {
  doctor: 'doctor-appointment',
  driver: 'quick-driver',
  gate: 'gatted',
  cycle: 'cycle-tracker',
  money: 'money-map',
  highway: 'highwaypass',
};

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
let id = positional[0];

// If no positional id was passed, check if the user accidentally ran `npm run app --<id>` (without space)
if (!id) {
  for (const arg of argv) {
    if (arg.startsWith('--') && arg !== '--dev-client' && arg !== '--port') {
      const stripped = arg.replace(/^--/, '');
      if (ALL_TARGETS.some((t) => t.id === stripped) || ALIASES[stripped]) {
        id = stripped;
        break;
      }
    }
  }
}

// Also check if npm parsed --<id> as an npm config option into process.env
if (!id) {
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('npm_config_')) {
      const candidate = k.replace(/^npm_config_/, '').replace(/_/g, '-');
      if (ALL_TARGETS.some((t) => t.id === candidate) || ALIASES[candidate]) {
        id = candidate;
        break;
      }
    }
  }
}

const openOn = (t) => {
  if (t.id === 'web') return 'http://localhost:3000 (apps/web)';
  if (t.id === 'dining') return 'root / (apps/dining)';
  if (t.id === 'gatted') return 'root / (apps/gatted)';
  if (t.id === 'cycle-tracker') return 'root / (apps/cycle-tracker)';
  if (t.id === 'money-map') return 'root / (apps/money-map)';
  if (t.id === 'doctor-appointment') return 'root / (apps/doctor-appointment)';
  if (t.id === 'highwaypass') return 'root / (apps/highwaypass)';
  if (t.id === 'smokefree') return 'root / (apps/smokefree)';
  if (t.id === 'quick-driver') return 'root / (apps/quick-driver)';
  return FIRST_ROUTE[t.id] ? FIRST_ROUTE[t.id] : 'a "not built yet" screen';
};

if (!id) {
  console.log('\nAll apps in one codebase. Pick one:\n');
  const w = [16, 12, 34, 26];
  const line = (a) => a.map((c, i) => String(c).padEnd(w[i])).join(' ');
  console.log(line(['id', 'family', 'app name', 'opens on']));
  console.log('-'.repeat(w.reduce((a, b) => a + b, 0)));
  for (const t of ALL_TARGETS) console.log(line([t.id, t.family || familyOf(t), t.name, openOn(t)]));
  console.log('\nRun one:   npm run app -- <id>');
  console.log('Pick port: npm run app -- <id> --port 8083\n');
  process.exit(0);
}

const resolvedId = ALIASES[id] || id;
const target = ALL_TARGETS.find((t) => t.id === resolvedId);
if (!target) {
  console.error(`\nUnknown app "${id}".`);
  console.error(`Known ids: ${ALL_TARGETS.map((t) => t.id).join(', ')}\n`);
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

// ── load root .env ─────────────────────────────────────────────────────────────
const rootEnvPath = path.join(REPO, '.env');
if (fs.existsSync(rootEnvPath)) {
  try {
    process.loadEnvFile(rootEnvPath);
  } catch (err) {
    console.warn('Warning: failed to load root .env:', err);
  }
}

// ── run ─────────────────────────────────────────────────────────────────────────
if (target.id === 'web') {
  const nextBin = path.join(REPO, 'node_modules', '.bin', 'next');
  const webPort = wantedPort ?? 3000;
  console.log(`Starting Next.js development server on http://localhost:${webPort} ...\n`);
  const r = spawnSync(nextBin, ['dev', '-p', String(webPort)], {
    cwd: path.join(REPO, 'apps', 'web'),
    env: { ...process.env, PORT: String(webPort) },
    stdio: 'inherit',
  });
  process.exit(r.status ?? 0);
}

const appDir = isStandalone?.(target)
  ? path.join(REPO, 'apps', target.id)
  : MOBILE;

const expoArgs = ['start', '--port', String(port)];
if (argv.includes('--dev-client')) {
  expoArgs.push('--dev-client');
} else {
  expoArgs.push('--go');
}

const targetEnv = { ...process.env, EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK: '1' };
if (target.id === 'gatted') {
  if (process.env.EXPO_PUBLIC_GATTED_SUPABASE_URL) {
    targetEnv.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_GATTED_SUPABASE_URL;
  }
  if (process.env.EXPO_PUBLIC_GATTED_SUPABASE_ANON_KEY) {
    targetEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_GATTED_SUPABASE_ANON_KEY;
  }
} else if (target.id === 'dining') {
  if (process.env.EXPO_PUBLIC_DINING_SUPABASE_URL) {
    targetEnv.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_DINING_SUPABASE_URL;
  }
  if (process.env.EXPO_PUBLIC_DINING_SUPABASE_ANON_KEY) {
    targetEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_DINING_SUPABASE_ANON_KEY;
  }
}



const expoBin = findExpoCli(appDir);
const spawnCmd = expoBin === 'npx' ? 'npx' : process.execPath;
const spawnParams = expoBin === 'npx' ? ['expo', ...expoArgs] : [expoBin, ...expoArgs];

const r = spawnSync(spawnCmd, spawnParams, {
  cwd: appDir,
  env: { ...targetEnv, APP_TARGET: target.id },
  stdio: 'inherit',
});
process.exit(r.status ?? 1);
