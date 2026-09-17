#!/usr/bin/env node
/**
 * theme-audit.mjs — the item-19 test, applied to every screen at once, as a rule.
 *
 * Item 19 converted three screens that ignored dark mode, and it found them one at a
 * time: the test was an md5 comparison of a screen's light and dark gallery capture,
 * run by hand. That test only works on screens somebody remembered to capture, and a
 * hash that differs does not by itself say the *theme* moved (an animation or a live
 * list moves it too). So the rule is executable now.
 *
 * The route list is derived from the filesystem — every `apps/mobile/app/**\/*.tsx`
 * that is a screen (layouts are not) — so a new screen is audited the hour it lands,
 * without anyone adding it to a manifest. For each route, in both `colorScheme`s:
 *
 *   1. navigate at phone size and wait for the screen to paint its own text,
 *   2. screenshot it and md5 the pair (the item-19 test),
 *   3. measure the page's colours: the ground (body background), the ink of the first
 *      text element, and every distinct (text, fill, border) colour triple on the page.
 *
 * Verdict per route: the ground and the ink must both differ between schemes. A screen
 * whose style body was built at module scope (`StyleSheet.create` outside a
 * `makeStyles(ui)`) cannot see the theme, so it fails here. The md5 pair is reported
 * beside the measurement, not instead of it.
 *
 * The audit also prints the *saturated* colours that held in both schemes. One held
 * colour is legitimate and documented: `#fff` on a filled accent button, which
 * `bg-remove`/`exif-strip`/`pdf`/`water` all use. Anything else in that list is a
 * hard-coded colour that a screenshot would not have caught.
 *
 * Usage:
 *   node scripts/theme-audit.mjs                 every screen file
 *   node scripts/theme-audit.mjs --only pdf      routes whose path matches a substring
 *   node scripts/theme-audit.mjs --themes dark   one scheme (prints no verdicts)
 *
 * Test switch, so the gate can be watched failing instead of merely claimed:
 *   THEME_AUDIT_SABOTAGE=1 pins every colour on the page to one fixed value in both
 *   schemes — a screen whose style body is theme-blind, injected browser-side with no
 *   app change — and the run must answer exit 1 naming the routes.
 *
 * Env: APP_BASE (default https://expo.dropby.co.in), MOBILE_APP (repo default).
 * Exit: 0 every route moved, 1 a route did not (or a page errored), 2 nothing to audit.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const APP_DIR = process.env.MOBILE_APP || path.join(REPO, "apps", "mobile");
const APP_BASE = (process.env.APP_BASE || "https://expo.dropby.co.in").replace(/\/$/, "");
const OUT = path.join(os.tmpdir(), "theme-audit");
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

/** A dynamic segment needs a real row: this is the business job 154 wrote a description for. */
const SAMPLE_SEGMENT = { business: "119465" };

const argv = process.argv.slice(2);
const opts = { only: null, themes: ["light", "dark"] };
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--only") opts.only = argv[++i];
  else if (argv[i] === "--themes") opts.themes = argv[++i].split(",");
  else {
    console.error(`error: unknown option ${argv[i]}`);
    process.exit(1);
  }
}

/** Every screen file under app/, as the route the browser would load. */
function routesFromApp() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".tsx") && !e.name.startsWith("_")) out.push(p);
    }
  };
  walk(path.join(APP_DIR, "app"));
  return out
    .map((file) => {
      const rel = path.relative(path.join(APP_DIR, "app"), file).split(path.sep);
      rel[rel.length - 1] = rel[rel.length - 1].replace(/\.tsx$/, "");
      // `(tabs)` / `(wellness)` are route groups: they never appear in a URL.
      const segs = rel.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
      const dynamic = segs.find((s) => s.startsWith("["));
      if (dynamic) {
        const sample = SAMPLE_SEGMENT[dynamic.replace(/[[\]]/g, "")];
        if (!sample) return null; // no row to point at — say nothing rather than guess
        segs[segs.indexOf(dynamic)] = sample;
      }
      if (segs[segs.length - 1] === "index") segs.pop();
      return { file: path.relative(REPO, file).replace(/\\/g, "/"), route: "/" + segs.join("/") };
    })
    .filter(Boolean)
    .filter((r) => !opts.only || r.route.includes(opts.only) || r.file.includes(opts.only))
    .sort((a, b) => a.route.localeCompare(b.route));
}

const ROUTES = routesFromApp();
if (!ROUTES.length) {
  console.error("nothing to audit");
  process.exit(2);
}
fs.mkdirSync(OUT, { recursive: true });

const PROBE = () => {
  const painted = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const bg = getComputedStyle(p).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") return bg;
    }
    return null;
  };
  // The web build of `expo-router/unstable-native-tabs` renders a real tab bar whose
  // *labels* keep one grey in both schemes (measured: rgb(139,139,139) inactive in light
  // and dark, the active label the target's own colour). It is the library's chrome, not
  // a screen's style, so it is measured into its own bucket: counting it as screen text
  // made /stretch look blind when every colour on the screen itself had moved.
  const chrome = document.querySelector('[role="tablist"]');
  const inChrome = (el) => !!(chrome && chrome.contains(el));
  const text = { content: new Set(), chrome: new Set() };
  const fill = { content: new Set(), chrome: new Set() };
  for (const el of document.querySelectorAll("*")) {
    const bucket = inChrome(el) ? "chrome" : "content";
    const cs = getComputedStyle(el);
    if ((el.textContent || "").trim().length) text[bucket].add(cs.color);
    const bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)") fill[bucket].add(bg);
    if (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") fill[bucket].add(cs.borderTopColor);
  }
  const leaves = [...document.querySelectorAll("div,span")].filter(
    (e) => e.children.length === 0 && (e.textContent || "").trim().length > 2 && !inChrome(e)
  );
  const first = leaves[0] || null;
  const page = (document.body.innerText || "").replace(/\s+/g, " ").trim();
  return {
    ground: getComputedStyle(document.body).backgroundColor,
    rootBg: painted(document.querySelector("#root") || document.body),
    ink: first ? getComputedStyle(first).color : null,
    inkText: first ? (first.textContent || "").trim().slice(0, 40) : null,
    contentText: [...text.content],
    contentFill: [...fill.content],
    chromeText: [...text.chrome],
    chars: page.length,
    head: page.slice(0, 60),
  };
};

/** A colour that is neither white/black nor a grey — the ones a blind style keeps. */
const saturated = (hex) => {
  const m = /^rgba?\((\d+), (\d+), (\d+)/.exec(hex);
  if (!m) return false;
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  return Math.max(r, g, b) - Math.min(r, g, b) >= 32 && !(r === g && g === b);
};

const errors = [];
const shots = {};
const { chromium } = await import(
  pathToFileURL(process.env.PW_PATH || "C:/Users/Administrator/shots/node_modules/playwright/index.mjs").href
);
const browser = await chromium.launch();

for (const scheme of opts.themes) {
  const ctx = await browser.newContext({
    colorScheme: scheme,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: UA,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${scheme} ${page.url()}: ${e}`));
  for (const r of ROUTES) {
    await page.goto(APP_BASE + r.route, { waitUntil: "domcontentloaded" }).catch(() => {});
    // The app is client-rendered: (fn, arg, options) — passing options second keeps
    // the 30 s default and fails a wait that was going to succeed.
    await page.waitForFunction(() => document.body.innerText.trim().length > 40, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(900);
    // The fault this gate exists for, injected at the page: every colour pinned to one
    // value, i.e. a style body that cannot see the theme. Browser-side only — the app is
    // never touched, the same shape as scripts/interactions.mjs's PROBE_SABOTAGE.
    if (process.env.THEME_AUDIT_SABOTAGE) {
      await page.addStyleTag({
        content: "*{color:rgb(11,11,15) !important;background-color:rgb(251,251,253) !important;border-color:rgb(229,229,229) !important}",
      });
      await page.waitForTimeout(200);
    }
    const file = path.join(OUT, `${(r.route.replace(/[^a-z0-9]+/gi, "_") || "root")}__${scheme}.png`);
    await page.screenshot({ path: file, fullPage: false });
    const measured = await page.evaluate(PROBE);
    const md5 = crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
    (shots[r.route] ||= {})[scheme] = { md5, file, ...measured };
  }
  await ctx.close();
}
await browser.close();

console.log(`auditing ${ROUTES.length} screens from ${path.relative(REPO, APP_DIR)}/app against ${APP_BASE}\n`);
let fails = 0;
const failures = [];
for (const r of ROUTES) {
  const l = shots[r.route].light;
  const d = shots[r.route].dark;
  const pair = !l || !d ? "one scheme" : l.md5 === d.md5 ? "SAME" : "differ";
  console.log(`${r.route.padEnd(28)} ${pair.padEnd(7)} ${l && d ? `ground ${l.ground} -> ${d.ground}` : ""}`);
  console.log(`${"".padEnd(28)} ${l && d ? `ink    "${l.inkText}" ${l.ink} -> ${d.ink}` : ""}`);
  if (!l || !d || !l.chars || !d.chars) {
    console.log(`${"".padEnd(28)} ! nothing painted — this route cannot be audited this way\n`);
    failures.push(`${r.route}: nothing painted`);
    fails++;
    continue;
  }
  // The screen's own colours are the measurement. The body ground alone proves nothing:
  // it is set by the app shell, so a screen whose style body was built at module scope
  // would still sit on a ground that moves.
  const moved = l.contentText.filter((c) => !d.contentText.includes(c));
  const held = l.contentText.filter((c) => d.contentText.includes(c)).filter(saturated);
  const heldFill = l.contentFill.filter((c) => d.contentFill.includes(c)).filter(saturated);
  const chromeHeld = l.chromeText.filter((c) => d.chromeText.includes(c));
  console.log(
    `${"".padEnd(28)} screen colours: ${l.contentText.length} light / ${d.contentText.length} dark · ` +
      `${moved.length} moved · page: "${(l.head || "").slice(0, 44)}"`
  );
  if (l.ground === d.ground) {
    console.log(`${"".padEnd(28)} ! FAILED — the ground did not move between schemes\n`);
    failures.push(`${r.route}: ground did not move`);
    fails++;
    continue;
  }
  if (!moved.length) {
    console.log(`${"".padEnd(28)} ! FAILED — no colour on the screen itself moved between schemes\n`);
    failures.push(`${r.route}: screen text colours identical in both schemes`);
    fails++;
    continue;
  }
  if (held.length || heldFill.length) {
    console.log(`${"".padEnd(28)} held in both schemes (review): ${[...held, ...heldFill].join(", ")}`);
  }
  if (chromeHeld.length) console.log(`${"".padEnd(28)} tab-bar chrome held (library, not the screen): ${chromeHeld.join(", ")}`);
  console.log("");
}

console.log(`page errors: ${errors.length}${errors.length ? " -> " + errors.join(" | ") : ""}`);
console.log("known-good holds, so they are not re-litigated: #fff text on a filled accent button;");
console.log("the bill/signature paper surfaces, which read paletteFor('light') on purpose (item 19).");
console.log(`PNGs: ${OUT}`);
if (fails || errors.length) {
  console.log(`RESULT: ${fails} screen(s) did not move between schemes`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`RESULT: ok — ${ROUTES.length}/${ROUTES.length} screens move between schemes`);
