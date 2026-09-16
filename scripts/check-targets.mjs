#!/usr/bin/env node
/**
 * check-targets.mjs — the gate `targets.mjs` has been promising and never had.
 *
 * Apple's guideline 4.3 rejects "multiple Bundle IDs of the same app", and Play rejects
 * "Spam and Minimum Functionality". With nineteen identities built from one codebase, the
 * defence cannot be a different icon: it has to be a different job, name, store description,
 * keywords and permission set — and something has to *check* that, before a build, not after
 * a rejection email.
 *
 * This refuses (exit 1) when two targets are too alike to survive review, and prints the
 * reason for every pair it compared, so a failure is actionable rather than mysterious.
 *
 * Usage: node scripts/check-targets.mjs [--all] [--json] [--targets FILE]
 *   --targets FILE  check another targets file — this is how the gate itself is tested, with
 *                   a control that is deliberately a duplicate
 *   default  prints failures and a summary
 *   --all    prints every pair it compared, with its score
 *   --json   machine-readable output
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const SHOW_ALL = args.includes("--all");
const AS_JSON = args.includes("--json");

/** Similarity above which two identities are worth a second look. */
const TOO_SIMILAR = 0.42;
/** Distinctive factors a pair must differ on before we call them different products. */
const MIN_DIFFERENTIATORS = 3;

const STOP = new Set([
  "a", "an", "and", "the", "for", "with", "your", "you", "to", "of", "in", "on", "it",
  "app", "apps", "tool", "maker", "daily", "free", "best",
]);

/** Words that carry meaning, lowercased, stop-words dropped. */
function tokens(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const targetsArg = args.indexOf("--targets");
const TARGETS_FILE =
  targetsArg >= 0 && args[targetsArg + 1]
    ? path.resolve(args[targetsArg + 1])
    : path.join(REPO, "apps", "mobile", "targets.mjs");
const { TARGETS } = await import(pathToFileURL(TARGETS_FILE).href);

const problems = [];

/* ── 1. every identity must be complete and unique on its own ─────────────── */
const seen = { id: new Map(), bundleId: new Map(), name: new Map() };
for (const t of TARGETS) {
  const fail = (msg) => problems.push({ kind: "field", target: t.id ?? "(no id)", msg });
  if (!t.id) fail("has no id");
  if (!t.name) fail("has no name");
  if (!t.bundleId) fail("has no bundleId");
  else if (!/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(t.bundleId)) fail(`bundleId "${t.bundleId}" is not reverse-DNS lowercase`);
  if (!t.tagline) fail("has no tagline");
  if (!t.storeCategory) fail("has no storeCategory");
  if (!t.firstScreen) fail("has no first screen");
  if (!Array.isArray(t.aso) || t.aso.length < 3) fail("has fewer than 3 ASO keywords (the store finds apps by these)");
  for (const key of ["id", "bundleId", "name"]) {
    const v = t[key];
    if (!v) continue;
    if (seen[key].has(v)) fail(`${key} "${v}" is already used by "${seen[key].get(v)}"`);
    else seen[key].set(v, t.id);
  }
}

/* ── 2. and every pair must be a different product, not a different colour ── */
const pairs = [];
for (let i = 0; i < TARGETS.length; i++) {
  for (let j = i + 1; j < TARGETS.length; j++) {
    const a = TARGETS[i];
    const b = TARGETS[j];

    // The store reads the name, the subtitle and the keywords together: that is the text
    // that decides whether two listings look like one app twice.
    const textA = tokens(`${a.name} ${a.tagline} ${(a.aso ?? []).join(" ")}`);
    const textB = tokens(`${b.name} ${b.tagline} ${(b.aso ?? []).join(" ")}`);
    const similarity = jaccard(textA, textB);
    const shared = [...textA].filter((w) => textB.has(w)).sort();

    // What genuinely makes two apps different products, in a reviewer's eyes.
    const diffs = [];
    if (a.storeCategory !== b.storeCategory) diffs.push("category");
    if ((a.firstScreen ?? "") !== (b.firstScreen ?? "")) diffs.push("first screen");
    if (JSON.stringify(a.permissions ?? []) !== JSON.stringify(b.permissions ?? [])) diffs.push("permissions");
    if ((a.color ?? "") !== (b.color ?? "")) diffs.push("colour");
    if ((a.tagline ?? "") !== (b.tagline ?? "")) diffs.push("tagline");
    if (jaccard(tokens(a.name), tokens(b.name)) < 0.34) diffs.push("name");
    if (jaccard(tokens((a.aso ?? []).join(" ")), tokens((b.aso ?? []).join(" "))) < 0.34) diffs.push("keywords");
    if ((a.products ?? []).length || (b.products ?? []).length) {
      const sameProducts = JSON.stringify([...(a.products ?? [])].sort()) === JSON.stringify([...(b.products ?? [])].sort());
      if (!sameProducts) diffs.push("products");
    }

    const sameCategory = a.storeCategory === b.storeCategory;
    const tooSimilar = sameCategory && similarity >= TOO_SIMILAR && diffs.length < MIN_DIFFERENTIATORS;
    pairs.push({ a: a.id, b: b.id, similarity, diffs, shared, tooSimilar, sameCategory });
    if (tooSimilar) {
      problems.push({
        kind: "similar",
        target: `${a.id} vs ${b.id}`,
        msg:
          `${(similarity * 100).toFixed(0)}% the same words in name/subtitle/keywords, same category ` +
          `(${a.storeCategory}), and only ${diffs.length} difference(s) that a reviewer could see ` +
          `[${diffs.join(", ") || "none"}]. Shared words: ${shared.slice(0, 10).join(", ")}`,
      });
    }
  }
}

/* ── report ───────────────────────────────────────────────────────────────── */
const failures = problems.filter((p) => p.kind !== "similar");
const similar = problems.filter((p) => p.kind === "similar");

if (AS_JSON) {
  console.log(JSON.stringify({ targets: TARGETS.length, pairs: pairs.length, failures, similar }, null, 2));
} else {
  if (SHOW_ALL) {
    console.log("every pair compared (worst first):");
    for (const p of [...pairs].sort((x, y) => y.similarity - x.similarity)) {
      console.log(
        `  ${p.tooSimilar ? "FAIL" : " ok "} ${p.a.padEnd(16)} ${p.b.padEnd(16)} ` +
          `${(p.similarity * 100).toFixed(0).padStart(3)}% words shared · ${p.diffs.length} visible differences`,
      );
    }
    console.log("");
  }
  for (const p of failures) console.log(`FIELD   ${p.target}: ${p.msg}`);
  for (const p of similar) console.log(`SIMILAR ${p.target}: ${p.msg}`);
  const verdict = problems.length ? "REFUSED" : "PASSED";
  console.log(
    `\n${verdict} — ${TARGETS.length} targets, ${pairs.length} pairs compared, ` +
      `${similar.length} too similar, ${failures.length} incomplete. ` +
      `(rule: same category + ${(TOO_SIMILAR * 100).toFixed(0)}% shared words + fewer than ${MIN_DIFFERENTIATORS} visible differences)`,
  );
}

process.exit(problems.length ? 1 : 0);
