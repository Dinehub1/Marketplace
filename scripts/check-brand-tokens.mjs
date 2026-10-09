#!/usr/bin/env node
/**
 * check-brand-tokens.mjs — the guard the brand tint strengths never had.
 *
 * The palette has a generator: `packages/tokens/scripts/extract.mjs` derives
 * `palette.generated.ts` from `apps/web/app/globals.css`, and CI re-runs it and fails on
 * any diff. So a literal colour cannot drift.
 *
 * The brand *tints* had no such guard, and cannot have a generator, because the two sides
 * are not the same kind of computation:
 *
 *   web    — `color-mix(in oklab, var(--brand-primary) 7%, transparent)` in CSS, which
 *            the browser resolves and which can participate in `:hover` and cascade.
 *   native — `tintStrength = scheme === "dark" ? 0.15 : 0.07` in TypeScript, applied by
 *            `alpha()` because React Native's StyleSheet has no cascade to resolve
 *            against.
 *
 * Both are correct for their platform, so this is not duplication to remove. It is six
 * numbers expressed twice, and nothing was checking that they agree. They do agree today
 * — every strength below matches — but a change to one side would silently make a brand
 * tint subtler on the phone than on the web, in a way no test would catch and no reviewer
 * would see, because the two files are in different languages and different directories.
 *
 * This asserts the agreement. It is a check, not a generator, on purpose: generating one
 * side from the other would mean either teaching the web to consume a TS constant (it
 * needs a CSS custom property for `:hover`) or teaching native to parse CSS `color-mix`
 * (which it cannot resolve). Comparing is the honest operation here.
 *
 * Usage: node scripts/check-brand-tokens.mjs
 * Exit:  0 the six strengths agree, 1 they do not
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS = path.join(REPO, "apps", "web", "app", "globals.css");
const TS = path.join(REPO, "packages", "tokens", "src", "index.ts");

/** The three derived strengths, and the CSS custom property each one drives. */
const STRENGTHS = [
  { name: "tintStrength", prop: "--brand-tint" },
  { name: "strongStrength", prop: "--brand-tint-strong" },
  { name: "hairlineStrength", prop: "--brand-hairline" },
];

const css = fs.readFileSync(CSS, "utf8");
const ts = fs.readFileSync(TS, "utf8");

/**
 * The `:root` block is light and the dark overrides appear in more than one selector
 * (there are two dark blocks that both re-point the brand tints). So this takes the
 * *distinct* percentages a property is assigned — occurrence count is a property of how
 * the stylesheet is organised, not of the design, and asserting on it would fail the day
 * someone adds a third theme selector.
 */
function cssPercentsFor(prop) {
  const out = new Set();
  // `[^;]*` rather than `[^)]*`: the declaration contains `var(--brand-primary)`, so a
  // character class that stops at the first `)` matches nothing at all. Scanning to the
  // end of the declaration avoids bracket matching entirely.
  const re = new RegExp(`${prop}\\s*:\\s*color-mix\\(([^;]*?)\\)\\s*;`, "g");
  let m;
  while ((m = re.exec(css))) {
    const pct = /(\d+(?:\.\d+)?)%/.exec(m[1]);
    if (pct) out.add(Number(pct[1]));
  }
  return [...out].sort((a, b) => a - b);
}

/** `const tintStrength = scheme === "dark" ? 0.15 : 0.07;` -> [7, 15] as percents. */
function tsPercentsFor(name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*scheme\\s*===\\s*"dark"\\s*\\?\\s*([\\d.]+)\\s*:\\s*([\\d.]+)`);
  const m = re.exec(ts);
  if (!m) return null;
  // Rounded because 0.07 * 100 is 7.000000000000001 in binary floating point, and the
  // table should read as the percentages a designer wrote, not as their representation.
  return [Number(m[2]) * 100, Number(m[1]) * 100].map((v) => Number(v.toFixed(6))).sort((a, b) => a - b);
}

const problems = [];
const rows = [];

for (const { name, prop } of STRENGTHS) {
  const fromCss = cssPercentsFor(prop);
  const fromTs = tsPercentsFor(name);

  if (fromTs === null) {
    problems.push(`packages/tokens/src/index.ts no longer declares \`${name}\` in the expected form`);
    continue;
  }
  if (fromCss.length !== 2) {
    problems.push(
      `${prop} is assigned ${fromCss.length} distinct color-mix percentage(s) in ` +
        `globals.css (${fromCss.join("%, ")}%); expected exactly 2 — one light, one dark`,
    );
    continue;
  }
  const same = fromCss.length === fromTs.length && fromCss.every((v, i) => Math.abs(v - fromTs[i]) < 1e-9);
  rows.push({ prop, name, css: fromCss.join("% / "), ts: fromTs.join("% / "), same });
  if (!same) {
    problems.push(
      `${prop} is ${fromCss.join("%/")}% on web but \`${name}\` is ${fromTs.join("%/")}% in ` +
        `packages/tokens/src/index.ts — a brand tint would differ between the two surfaces`,
    );
  }
}

const w = [22, 20, 14, 14];
const line = (a) => a.map((c, i) => String(c).padEnd(w[i])).join(" ");
console.log(`\n${line(["css property", "ts constant", "web", "native"])}`);
console.log("-".repeat(w.reduce((a, b) => a + b, 0)));
for (const r of rows) console.log(line([r.prop, r.name, r.css, r.ts]) + (r.same ? "  ✓" : "  ✗"));

if (problems.length) {
  console.error(`\n✗ brand tints disagree between web and native:`);
  for (const p of problems) console.error(`    ${p}`);
  console.error(
    `\n  Both sides are legitimate (CSS needs a custom property, native needs a number),\n` +
      `  so fix this by changing the value in BOTH places, not by deleting one.`,
  );
  process.exit(1);
}

console.log(`\n✓ brand tint strengths agree: globals.css and packages/tokens/src/index.ts ` +
  `declare the same ${rows.length * 2} values.`);
