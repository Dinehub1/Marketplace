#!/usr/bin/env node
/**
 * Refuses to build a target that would not survive review.
 *
 * Play Store's "Spam and Minimum Functionality" and Apple's 4.3 both punish apps
 * that look like the same app twice. This gate fails the build when two targets
 * share a name, a bundle id, or too much of their store description, and when a
 * target has neither products, directory nor game behind it (an empty shell).
 */
import { TARGETS } from "../targets.mjs";

const fail = [];
const seen = { name: new Map(), bundle: new Map(), aso: new Map() };

for (const t of TARGETS) {
  const n = t.name.toLowerCase();
  const b = t.bundleId.toLowerCase();
  if (seen.name.has(n)) fail.push(`duplicate app name: "${t.name}" (${t.id} and ${seen.name.get(n)})`);
  if (seen.bundle.has(b)) fail.push(`duplicate bundle id: ${t.bundleId}`);
  seen.name.set(n, t.id);

  const key = (t.aso || []).map((k) => k.toLowerCase()).sort().join("|");
  if (key && seen.aso.has(key)) fail.push(`identical store keywords: ${t.id} and ${seen.aso.get(key)}`);
  if (key) seen.aso.set(key, t.id);

  const backed = (t.products || []).length + (t.directory ? 1 : 0) + (t.game ? 1 : 0);
  if (!backed) fail.push(`${t.id} has nothing behind it - no products, directory or game`);
  if (!t.tagline || t.tagline.length < 12) fail.push(`${t.id} needs a real store tagline`);
  if ((t.aso || []).length < 3) fail.push(`${t.id} needs at least 3 ASO keywords`);
  if (!t.color || !t.firstScreen) fail.push(`${t.id} is missing its own identity (colour/first screen)`);
}

const products = new Set();
for (const t of TARGETS) for (const p of t.products || []) {
  if (products.has(p)) fail.push(`product "${p}" is exposed by two apps - that is the duplication we must avoid`);
  products.add(p);
}

console.log(`${TARGETS.length} app targets defined:`);
for (const t of TARGETS) {
  const kind = t.game ? "game" : t.directory ? "directory" : "tools";
  console.log(`  ${t.id.padEnd(20)} ${kind.padEnd(10)} ${t.name}`);
}
if (fail.length) {
  console.log("\nNOT READY FOR STORE:");
  for (const f of fail) console.log("  -", f);
  process.exit(1);
}
console.log("\nAll targets pass the anti-duplication gate.");
