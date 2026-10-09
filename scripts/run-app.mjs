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
  gym: 'gym-tracker',
};

// ── arguments ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const portIdx = argv.indexOf('--port');
const wantedPort = portIdx > -1 ? Number(argv[portIdx + 1]) : null;
/** `--host <ip>`: the address printed in the banner and encoded in Expo's QR. */
const hostIdx = argv.indexOf('--host');
/**
 * Everything that is not a flag, or a flag's value, is the target id. Both flag *values*
 * have to be excluded, not just the flags: `--host 192.168.29.252` otherwise leaves
 * `192.168.29.252` looking like a positional id, and the run dies on "unknown target".
 * Guarded on `> -1` because otherwise `idx + 1` is 0 when the flag is absent, which
 * silently dropped the first argument — so `npm run app -- tap-sprint` printed the list
 * instead of running Tap Sprint.
 */
const flagValueIdx = new Set(
  [portIdx, hostIdx].filter((i) => i > -1).map((i) => i + 1),
);
const positional = argv.filter((a, i) => !a.startsWith('--') && !flagValueIdx.has(i));
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
  if (t.id === 'gym-tracker') return 'root / (apps/gym-tracker)';
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
/**
 * The interface the phone should dial, which is *not* simply the first one that is up.
 *
 * This used to `return` the first non-internal IPv4 it found, and on this Mac that is
 * `bridge0` (192.168.3.1) — a virtual bridge, not the Wi-Fi. The banner then printed
 * `exp://192.168.3.1:8082`, a URL no phone on the LAN can reach, and the QR that Expo
 * prints is built from the same address. The server was running perfectly; only the
 * address we told the user to open was wrong, which is the most expensive kind of wrong
 * because the app looks broken when it is not.
 *
 * So: rank the candidates instead of taking the first, and put the default route's
 * interface at the top — the address the OS would actually use to reach the internet is
 * the one a phone on the same network can reach back.
 */
function defaultRouteInterface() {
  try {
    const out = spawnSync('route', ['-n', 'get', 'default'], { encoding: 'utf8' });
    const m = /interface:\s*(\S+)/.exec(out.stdout ?? '');
    return m ? m[1] : null;
  } catch {
    // Linux (the capture VM) has no `route`; /proc/net/route is the fallback there.
    try {
      const line = fs.readFileSync('/proc/net/route', 'utf8').split('\n').slice(1)
        .map((l) => l.split(/\s+/)).find((c) => c[1] === '00000000');
      return line ? line[0] : null;
    } catch {
      return null;
    }
  }
}

function lanAddress() {
  // An explicit answer always wins: EXPO_HOST, then --host <ip>, then auto-detect.
  const flag = process.env.EXPO_HOST || (hostIdx > -1 ? argv[hostIdx + 1] : null);
  if (flag) return flag;

  const preferred = defaultRouteInterface();
  /** Virtual bridges, VPN tunnels and container links: reachable by the Mac, not the phone. */
  const virtual = /^(bridge|vmnet|vmenet|utun|tun|tap|docker|veth|llw|awdl|anpi|ap\d)/;

  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const isVirtual = virtual.test(name);
      candidates.push({
        address: a.address,
        // 0 = the default route, 1 = a real interface, 2 = virtual, 3 = link-local.
        rank: name === preferred ? 0 : isVirtual ? 2 : a.address.startsWith('169.254.') ? 3 : 1,
      });
    }
  }
  candidates.sort((x, y) => x.rank - y.rank);
  const chosen = candidates[0]?.address ?? 'localhost';

  // Say so when we skipped a bridge, because "why is my QR a different IP than last
  // time" is otherwise a mystery the next person has to re-solve from scratch.
  const skipped = candidates.filter((c) => c.rank >= 2).map((c) => c.address);
  if (skipped.length) {
    console.log(`  note        ignoring virtual interface(s) ${skipped.join(', ')} — not reachable from your phone`);
    console.log(`              override with EXPO_HOST=<ip> or --host <ip> if that is wrong`);
    console.log('');
  }
  return chosen;
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
