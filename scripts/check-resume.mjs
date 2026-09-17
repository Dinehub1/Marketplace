#!/usr/bin/env node
/**
 * check-resume.mjs — the Node entry point for a gate whose rules are Python.
 *
 * The résumé's page rules live in `services/tools/resume_layout.py`, because that is the
 * renderer's own language and because the module imports nothing at all — no Pillow, no
 * pdfcpu, no PDF library. The assertions live beside it in `scripts/check-resume.py`, which
 * is runnable with plain `python3`. This wrapper exists so that gate is reachable the way
 * every other gate here is — `npm run check:resume` — on a Mac, where the interpreter is
 * `python3`, and on the Windows VM, where it is `python` or the pinned Python 3.11.
 *
 * Exit: the checker's own status (0 clean, 1 a rule broke), or 2 when no interpreter exists.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts', 'check-resume.py');

// PYTHON311 is what ecosystem.config.js pins for the worker on the VM, so honouring it keeps
// this check on the same interpreter the engine actually runs under.
const candidates = [process.env.PYTHON, process.env.PYTHON311, 'python3', 'python'].filter(Boolean);

for (const bin of candidates) {
  const r = spawnSync(bin, [SCRIPT], { stdio: 'inherit' });
  if (r.error && r.error.code === 'ENOENT') continue;
  if (r.error) {
    console.error(`check-resume: could not run ${bin}: ${r.error.message}`);
    process.exit(2);
  }
  process.exit(r.status ?? 1);
}

console.error(`check-resume: no python interpreter found (tried ${candidates.join(', ')})`);
process.exit(2);
