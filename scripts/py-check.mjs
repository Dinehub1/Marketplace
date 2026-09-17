#!/usr/bin/env node
/**
 * py-check.mjs — run a Python gate from the Node gate runner.
 *
 * Two of this repo's rule sets are Python because the engine is Python:
 * `services/tools/resume_layout.py` (what fits on a résumé page) and
 * `services/tools/captions.py` (what a subtitle file must look like). Both import nothing —
 * no Pillow, no pdfcpu, no token — so `scripts/check-resume.py` and
 * `scripts/check-captions.py` can assert them on a machine that has none of the engine's
 * dependencies. This wrapper is how `npm run check:resume` and `npm run check:captions`
 * reach those files with the right interpreter on a Mac (`python3`) and on the Windows VM
 * (`python`, or the `PYTHON311` that ecosystem.config.js pins for the worker).
 *
 * Usage: node scripts/py-check.mjs scripts/check-captions.py
 * Exit:  the checker's own status (0 clean, 1 a rule broke), or 2 when no interpreter exists.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2];
if (!target) {
  console.error('usage: node scripts/py-check.mjs scripts/check-<name>.py');
  process.exit(2);
}
const SCRIPT = path.resolve(REPO, target);

// PYTHON311 is what ecosystem.config.js pins for the worker on the VM, so honouring it keeps
// a check on the same interpreter the engine actually runs under.
const candidates = [process.env.PYTHON, process.env.PYTHON311, 'python3', 'python'].filter(Boolean);

for (const bin of candidates) {
  const r = spawnSync(bin, [SCRIPT], { stdio: 'inherit' });
  if (r.error && r.error.code === 'ENOENT') continue;
  if (r.error) {
    console.error(`py-check: could not run ${bin}: ${r.error.message}`);
    process.exit(2);
  }
  process.exit(r.status ?? 1);
}

console.error(`py-check: no python interpreter found (tried ${candidates.join(', ')})`);
process.exit(2);
