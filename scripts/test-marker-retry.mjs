#!/usr/bin/env node
/**
 * test-marker-retry.mjs — prove the capture harness's marker gate (queue item 33).
 *
 * The defect it pins: a client-rendered SPA behind the tunnel can answer **200 with the
 * shell and no marker**, and the old marker path then treated that as a verdict — it wrote
 * its diagnosis PNG **over the gallery filename**, so a transient race silently replaced a
 * good shot with a healthy-looking picture of nothing (five of the forty captures of
 * 2026-09-16: tools-hub twice, stretch/walk three times, all on routes that render correctly
 * on the next attempt).
 *
 * Why a real socket and not a mock of the code: the thing being tested is *one more request*,
 * so the test counts the requests a server actually receives, and asserts on the picture the
 * harness leaves behind. A stub of `readMissing()` could only prove the code called itself.
 *
 * Run:  node scripts/test-marker-retry.mjs
 * Exit: 0 when every case matches, 1 otherwise.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// HARNESS lets this run against an older copy of the harness (the negative control: the
// pre-fix version must fail these cases, or the test is decoration).
const HARNESS = process.env.HARNESS || path.join(HERE, 'screenshot.mjs');
const MARKER = 'THE SHELL PAINTED';

const shell = `<!doctype html><html><body><div id="root">loading…</div></body></html>`;
const ready = `<!doctype html><html><body><div id="root">${MARKER} — Everyday Tools</div></body></html>`;

// ---------------------------------------------------------------- scripted server
//
// `bodies` is consumed one entry per request; the last one repeats, so a 3rd request is
// answerable. `seen` is the evidence: the test asserts on what arrived over the socket.
let bodies = [];
let seen = [];
let server = null;
let base = '';

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      if (req.url === '/__requests__') {
        res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify(seen.length));
        return;
      }
      const body = bodies[Math.min(seen.length, bodies.length - 1)];
      seen.push(req.url);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
}

const stopServer = () => new Promise((r) => server.close(r));
const md5 = (file) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');

// ------------------------------------------------------------------------ harness run

function shoot(outFile, extra = []) {
  const args = [HARNESS, `${base}/tools`, outFile, '--viewport', 'mobile', '--json', '--wait', '250', '--expect', MARKER, ...extra];
  // `spawn`, not `spawnSync`: the scripted server runs in THIS process, and spawnSync would
  // block this event loop for the whole capture — the browser would then time out on a
  // socket nobody is answering (measured: 60 s goto timeout, 0 requests arrived).
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => {
      const line = stdout.trim().split('\n').filter((l) => l.trim().startsWith('{')).pop();
      let info = {};
      try {
        info = JSON.parse(line || '{}');
      } catch {
        /* fall through to the exit code */
      }
      resolve({ code, info, stderr });
    });
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marker-retry-'));

// ----------------------------------------------------------------------------- cases

await startServer();
console.log(`\nscripted server on ${base}\n`);

// Case 1 — the transient: shell first, real page on the reload. Must recover, and the
// evidence that it recovered by *reloading* is the request count (2), not the claim.
{
  bodies = [shell, ready];
  seen = [];
  const out = path.join(tmp, 'recovers.png');
  const r = await shoot(out);
  check('A. shell then ready → capture succeeds', r.code === 0, `exit ${r.code}${r.code ? ` (${r.stderr.trim().split('\n').pop()})` : ''}`);
  check('A. the harness says it reloaded once', r.info.markerRetried === true, `markerRetried=${r.info.markerRetried}`);
  check('A. the second read found the marker', r.info.markersRecovered === true, `markersRecovered=${r.info.markersRecovered}`);
  check('A. the reload really hit the network', seen.length === 2, `${seen.length} request(s) arrived`);
  check('A. the picture was written', fs.existsSync(out) && fs.statSync(out).size > 0, fs.existsSync(out) ? `${fs.statSync(out).size} B` : 'no file');
}

// Case 2 — the real fault: the marker never arrives. Must fail with exit 3, and the gallery
// file must be untouched (this is the defect: it used to be overwritten with the diagnosis).
{
  bodies = [shell];
  seen = [];
  const out = path.join(tmp, 'still-broken.png');
  fs.writeFileSync(out, crypto.randomBytes(4096)); // stands in for the last known-good shot
  const before = md5(out);
  const r = await shoot(out);
  const diag = path.join(os.tmpdir(), `marker-missing-${path.basename(out)}`);
  check('B. a marker that never arrives exits 3', r.code === 3, `exit ${r.code}`);
  check('B. it says which markers are missing', Array.isArray(r.info.expectMissing) && r.info.expectMissing.includes(MARKER), JSON.stringify(r.info.expectMissing));
  check('B. the gallery file is byte-identical', md5(out) === before, `${before} → ${md5(out)}`);
  check('B. the diagnosis went to the temp dir instead', r.info.markerDiagnosis === diag && fs.existsSync(diag) && fs.statSync(diag).size > 0, `${fs.existsSync(diag) ? `${fs.statSync(diag).size} B` : 'missing'}`);
  check('B. the second read is recorded as failed', r.info.markersRecovered === false, `markersRecovered=${r.info.markersRecovered}`);
}

// Case 3 — the control: a healthy page must NOT pay a second load. Without this, "retry"
// could be "always reload" and every capture sweep would cost twice the traffic.
{
  bodies = [ready];
  seen = [];
  const out = path.join(tmp, 'healthy.png');
  const r = await shoot(out);
  check('C. a healthy first read captures without a reload', r.code === 0 && r.info.markerRetried === undefined, `exit ${r.code}, markerRetried=${r.info.markerRetried}`);
  check('C. exactly one request was made', seen.length === 1, `${seen.length} request(s) arrived`);
}

await stopServer();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`diagnosis files kept in ${tmp}`);
process.exit(failed.length ? 1 : 0);
