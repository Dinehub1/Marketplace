#!/usr/bin/env node
/**
 * start-all-apps.mjs — start every app in the fleet at the same time, and prove each one.
 *
 * Why this exists: `run-app.mjs` starts exactly one target, and there are 29. Checking
 * them "all working" one at a time means starting and stopping a Metro server 29 times,
 * and the answer you get at the end is a memory of what you saw scroll past. This starts
 * them all, verifies each one served a real bundle before it reports success, and writes
 * an HTML index with a scannable QR for every app.
 *
 * Verification per app is two steps, because the first alone is a lie:
 *   1. the manifest answers for platform=ios   — the server is up
 *   2. the launchAsset JS bundle compiles      — Metro resolved every import
 * Metro serves a perfectly good manifest for an app whose bundle then fails to build.
 *
 * Usage:  node scripts/start-all-apps.mjs [--stop] [--base-port 8100] [--group mobile|standalone|all] [--serve]
 * Output: .apps-running/  (pids, logs, index.html, urls.json)
 * Exit:   0 every app verified, 1 at least one did not
 *
 * `--serve` does not exit after verifying. That matters when this runs as a managed
 * background job: the job's children are killed when the job exits, so a launcher that
 * verifies and returns leaves 28 verified servers that are already dead. Staying alive
 * keeps them up until the job is explicitly stopped.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** `qrcode` is CommonJS, and this file is ESM, so it needs a CJS require to load it. */
const require = createRequire(import.meta.url);
const OUT = path.join(REPO, '.apps-running');
const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf(name);
  return i > -1 && argv[i + 1] ? argv[i + 1] : dflt;
};

const { TARGETS, isStandalone } = await import(
  pathToFileURL(path.join(REPO, 'apps', 'mobile', 'targets.mjs')).href
);

if (argv.includes('--stop')) {
  const pidFile = path.join(OUT, 'pids.json');
  if (!fs.existsSync(pidFile)) {
    console.log('Nothing to stop — no .apps-running/pids.json.');
    process.exit(0);
  }
  const pids = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
  let n = 0;
  for (const { pid } of pids) {
    try { process.kill(-pid, 'SIGKILL'); n++; } catch {}
    try { process.kill(pid, 'SIGKILL'); } catch {}
  }
  fs.rmSync(pidFile, { force: true });
  console.log(`Stopped ${n} dev server(s).`);
  process.exit(0);
}

const BASE_PORT = Number(flag('--base-port', '8100'));
const GROUP = flag('--group', 'all');
const list = TARGETS.filter((t) =>
  GROUP === 'mobile' ? !isStandalone(t) : GROUP === 'standalone' ? isStandalone(t) : true,
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The address a phone can dial. Not the first non-internal IPv4: on this Mac that is
 * `bridge0` (192.168.3.1), a virtual bridge no phone can reach. Rank the default route's
 * interface first and skip the virtual ones.
 */
function lanAddress() {
  if (process.env.EXPO_HOST) return process.env.EXPO_HOST;
  let preferred = null;
  try {
    preferred = /interface:\s*(\S+)/.exec(
      spawnSync('route', ['-n', 'get', 'default'], { encoding: 'utf8' }).stdout ?? '',
    )?.[1] ?? null;
  } catch {}
  const virtual = /^(bridge|vmnet|vmenet|utun|tun|tap|docker|veth|llw|awdl|anpi|ap\d)/;
  const cands = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      cands.push({ address: a.address, rank: name === preferred ? 0 : virtual.test(name) ? 2 : a.address.startsWith('169.254.') ? 3 : 1 });
    }
  }
  cands.sort((x, y) => x.rank - y.rank);
  return cands[0]?.address ?? 'localhost';
}
const LAN = lanAddress();

async function freePort(from) {
  const free = (port) => new Promise((res) => {
    const s = net.createServer();
    s.once('error', () => res(false));
    s.once('listening', () => s.close(() => res(true)));
    s.listen(port, '0.0.0.0');
  });
  for (let p = from; p < from + 300; p++) if (await free(p)) return p;
  return null;
}

async function fetchText(url, timeoutMs) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'expo-platform': 'ios' } });
    return { status: r.status, body: await r.text() };
  } finally { clearTimeout(timer); }
}

async function waitManifest(port, budgetMs) {
  const deadline = Date.now() + budgetMs;
  let last = 'no response';
  while (Date.now() < deadline) {
    try {
      const r = await fetchText(`http://localhost:${port}`, 15000);
      if (r.status === 200 && r.body.includes('launchAsset')) return { ok: true, manifest: JSON.parse(r.body) };
      last = `HTTP ${r.status}`;
    } catch (e) { last = e.name === 'AbortError' ? 'timeout' : String(e.message ?? e); }
    await sleep(2000);
  }
  return { ok: false, error: last };
}

const QR = require(path.join(REPO, 'node_modules', 'qrcode'));

fs.mkdirSync(OUT, { recursive: true });
const results = [];
const pids = [];
/** Every spawned server, so `--serve` can hold them and report when one dies. */
const children = [];

console.log(`\nStarting ${list.length} app(s) on ${LAN}, ports ${BASE_PORT}+. First bundle per app can take a minute.\n`);

for (const t of list) {
  const port = await freePort(BASE_PORT);
  if (!port) { console.log(`✗ ${t.id}: no free port`); continue; }
  const logPath = path.join(OUT, `${t.id}.log`);
  const log = fs.createWriteStream(logPath);
  const child = spawn('npm', ['run', 'app', '--', t.id, '--port', String(port)], {
    cwd: REPO, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
  });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  pids.push({ id: t.id, pid: child.pid, port });
  children.push({ id: t.id, child, port });
  fs.writeFileSync(path.join(OUT, 'pids.json'), JSON.stringify(pids, null, 2));

  const phase = await waitManifest(port, 180000);
  if (!phase.ok) {
    console.log(`✗ ${t.id.padEnd(20)} :${port}  manifest failed — ${phase.error}`);
    results.push({ id: t.id, name: t.name, port, ok: false, error: phase.error });
    // A server that never came up still holds a port and a pid slot; stop it rather
    // than leave it to be restarted into the same failure by the next run.
    try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    continue;
  }

  const bundleUrl = phase.manifest.launchAsset?.url?.replace('localhost', '127.0.0.1');
  let bundle = { ok: false, error: 'no launchAsset url' };
  if (bundleUrl) {
    let body = null, err = null;
    for (let i = 0; i < 4 && body === null; i++) {
      try {
        const r = await fetchText(bundleUrl, 300000);
        if (r.status === 200 && r.body.length > 100000 && !r.body.startsWith('{"')) body = r.body;
        else err = `HTTP ${r.status}, ${r.body.length}B: ${r.body.slice(0, 200)}`;
      } catch (e) { err = e.name === 'AbortError' ? 'bundle timeout' : String(e.message ?? e); }
      if (body === null) await sleep(2500);
    }
    bundle = body ? { ok: true, bytes: body.length } : { ok: false, error: err };
  }

  const url = `exp://${LAN}:${port}`;
  let qr = null;
  if (bundle.ok) {
    try {
      qr = await QR.toDataURL(url, { width: 300, margin: 1, errorCorrectionLevel: 'M' });
    } catch (e) { qr = null; }
  }

  results.push({
    id: t.id, name: t.name, tagline: t.tagline, port, url, qr,
    ok: bundle.ok, bytes: bundle.bytes, error: bundle.error,
    runtimeVersion: phase.manifest.runtimeVersion,
    family: isStandalone(t) ? 'standalone (needs dev build)' : 'mobile (Expo Go)',
  });
  console.log(
    bundle.ok
      ? `✓ ${t.id.padEnd(20)} :${port}  ${url}  ${(bundle.bytes / 1048576).toFixed(1)}MB`
      : `✗ ${t.id.padEnd(20)} :${port}  bundle failed — ${bundle.error}`,
  );
  fs.writeFileSync(path.join(OUT, 'urls.json'), JSON.stringify(results, null, 2));
  await sleep(400);
}

// ── index.html: every app, its URL and a scannable QR ────────────────────────────
const ok = results.filter((r) => r.ok);
const card = (r) => `
  <div class="card ${r.ok ? '' : 'bad'}">
    <div class="qr">${r.qr ? `<img src="${r.qr}" alt="QR for ${r.id}">` : '<div class="noqr">bundle<br>failed</div>'}</div>
    <h3>${r.name}</h3>
    <p class="tag">${r.tagline ?? ''}</p>
    <p class="url">${r.url}</p>
    <p class="meta">${r.id} · port ${r.port} · ${r.ok ? (r.bytes / 1048576).toFixed(1) + 'MB' : 'FAILED'}</p>
    <p class="fam">${r.family}</p>
  </div>`;

fs.writeFileSync(path.join(OUT, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DropBy fleet — ${ok.length}/${results.length} running</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 -apple-system, system-ui, sans-serif; margin: 0; padding: 28px 22px 60px; background: #f6f7f9; color: #14181f; }
  @media (prefers-color-scheme: dark) { body { background: #0e1116; color: #e7ebf2; } .card { background: #171c24 !important; } }
  h1 { font-size: 21px; margin: 0 0 4px; }
  .sub { opacity: .65; margin: 0 0 22px; font-size: 13.5px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(212px, 1fr)); gap: 14px; }
  .card { background: #fff; border-radius: 13px; padding: 13px; box-shadow: 0 1px 3px rgba(0,0,0,.09); }
  .card.bad { opacity: .5; }
  .qr img { width: 100%; max-width: 186px; display: block; margin: 0 auto 9px; image-rendering: pixelated; }
  .noqr { height: 150px; display: grid; place-items: center; background: #eee; border-radius: 8px; margin-bottom: 9px; color: #a00; font-weight: 700; }
  h3 { font-size: 14px; margin: 0 0 2px; }
  .tag { font-size: 11.5px; opacity: .6; margin: 0 0 6px; min-height: 28px; }
  .url { font: 700 12.5px ui-monospace, Menlo, monospace; margin: 0 0 3px; color: #0a7; word-break: break-all; }
  .meta, .fam { font-size: 11px; opacity: .55; margin: 0; }
</style></head><body>
<h1>DropBy fleet — ${ok.length} of ${results.length} running</h1>
<p class="sub">Scan with Expo Go on the same Wi-Fi as <b>${LAN}</b>. “standalone” apps need a development build, not Expo Go.</p>
<div class="grid">${results.map(card).join('')}</div>
</body></html>
`);

console.log(`\n${'='.repeat(70)}`);
console.log(`${ok.length}/${results.length} verified running`);
if (ok.length !== results.length) {
  console.log(`failed: ${results.filter((r) => !r.ok).map((r) => r.id).join(', ')}`);
}
console.log(`\nIndex with QR codes : ${path.join(OUT, 'index.html')}`);
console.log(`URLs as JSON        : ${path.join(OUT, 'urls.json')}`);
console.log(`Stop everything     : node scripts/start-all-apps.mjs --stop`);

/**
 * `--serve`: hold the servers open instead of returning.
 *
 * The children are only alive while this process is. Returning here would hand back 28
 * verified URLs and then have them all die the moment the job that ran this exited —
 * which is exactly the trap: "verified" and "still running" are different claims.
 */
if (argv.includes('--serve') && ok.length) {
  const alive = new Map(children.map((c) => [c.id, true]));
  for (const c of children) c.child.on('exit', () => alive.set(c.id, false));

  console.log(`\nHolding ${ok.length} server(s) open. Ctrl-C (or the job stop) ends them all.\n`);
  const startedAt = Date.now();
  const beat = setInterval(async () => {
    let up = 0;
    for (const r of ok) {
      try {
        const res = await fetchText(`http://127.0.0.1:${r.port}`, 5000);
        if (res.status === 200 && res.body.includes('launchAsset')) up++;
      } catch {}
    }
    const mins = Math.round((Date.now() - startedAt) / 60000);
    const exited = [...alive.entries()].filter(([, a]) => !a).map(([id]) => id);
    console.log(
      `[${mins}m] manifest-responding: ${up}/${ok.length}` +
        (exited.length ? `  exited: ${exited.join(', ')}` : ''),
    );
    if (up === 0) {
      console.log('No server is responding any more — nothing left to serve.');
      clearInterval(beat);
      process.exit(1);
    }
  }, 60000);

  const shutdown = () => {
    clearInterval(beat);
    for (const c of children) { try { process.kill(-c.child.pid, 'SIGKILL'); } catch {} }
    console.log('\nStopped all dev servers.');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  process.exit(ok.length === results.length ? 0 : 1);
}
