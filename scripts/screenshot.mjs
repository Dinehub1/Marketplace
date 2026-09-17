#!/usr/bin/env node
/**
 * screenshot.mjs — headless screenshot helper (Playwright + Chromium).
 *
 * On this VM Playwright lives in its own folder so it never touches the
 * pnpm/npm workspaces:
 *     C:\Users\Administrator\shots\node_modules\playwright
 * Browsers live in the shared cache: %LOCALAPPDATA%\ms-playwright
 *
 * Usage:
 *   node screenshot.mjs <url> <output.png> [options]
 *
 * Options:
 *   -v, --viewport <mobile|desktop|WxH>  viewport preset (default: desktop)
 *   -d, --dsf <n>                        deviceScaleFactor (preset default: mobile 2, desktop 1)
 *       --wait <ms>                      extra settle time after load (default: 2500)
 *       --timeout <ms>                   navigation timeout (default: 60000)
 *       --no-fullpage                    capture only the viewport, not the full scroll height
 *       --mobile-ua                      also send an iPhone user-agent
 *       --dark                           colorScheme: dark
 *       --reduced-motion                 emulate the OS "Reduce Motion" setting, so a
 *                                        capture shows what the app does for someone who
 *                                        has asked for it. React Native Web maps this to
 *                                        AccessibilityInfo.isReduceMotionEnabled(), which
 *                                        is the same source lib/motion.ts reads.
 *       --expect <text>                  fail (exit 3) unless this text is on the page;
 *                                        repeatable, so a screen can be pinned by several
 *                                        markers. A miss reloads once and re-reads before it
 *                                        is a verdict (a tunnel can hand back the shell before
 *                                        the bundle paints), and a miss that survives that
 *                                        writes its diagnosis to %TEMP% while leaving the
 *                                        output PNG as it was — never over a good gallery shot.
 *                                        This is what stops the pipeline from "proving" a
 *                                        feature with a picture of a blank page after a bad bundle.
 *       --interact <name>                run a named probe from scripts/interactions.mjs
 *                                        (e.g. tap-sprint-hit) and fail (exit 3) unless it
 *                                        observes the change it is looking for. --expect
 *                                        proves the screen rendered; --interact proves the
 *                                        screen does something. The page is reloaded after
 *                                        a successful probe, so the PNG is of the screen
 *                                        itself and not of the probe's aftermath.
 *       --json                           print a JSON result line instead of human text
 *
 * Examples:
 *   node screenshot.mjs https://expo.dropby.co.in/passport out.png --viewport mobile
 *   node screenshot.mjs https://hermes.dropby.co.in/ out.png --viewport 1440x900 --no-fullpage
 *
 * Exit codes: 0 ok, 1 usage error, 2 navigation/render failure, 3 an assertion failed
 *             (a --expect marker was missing, or --interact did not observe its change).
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

// ---------------------------------------------------------------- arg parsing

function usage(msg) {
  if (msg) console.error('error: ' + msg);
  console.error(
    'usage: node screenshot.mjs <url> <output.png> ' +
      '[-v mobile|desktop|WxH] [-d dsf] [--wait ms] [--timeout ms] [--no-fullpage] [--mobile-ua] [--dark] [--expect text]... [--json]'
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const positional = [];
const opts = {
  viewport: 'desktop',
  dsf: null,
  wait: 2500,
  timeout: 60000,
  fullPage: true,
  mobileUA: false,
  dark: false,
  reducedMotion: false,
  json: false,
  expect: [],
  interact: null,
};

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => {
    const v = argv[++i];
    if (v === undefined) usage(`missing value for ${a}`);
    return v;
  };
  if (a === '-v' || a === '--viewport') opts.viewport = next();
  else if (a === '-d' || a === '--dsf') opts.dsf = Number(next());
  else if (a === '--expect') opts.expect.push(next());
  else if (a === '--interact') opts.interact = next();
  else if (a === '--wait') opts.wait = Number(next());
  else if (a === '--timeout') opts.timeout = Number(next());
  else if (a === '--no-fullpage') opts.fullPage = false;
  else if (a === '--mobile-ua') opts.mobileUA = true;
  else if (a === '--dark') opts.dark = true;
  else if (a === '--reduced-motion') opts.reducedMotion = true;
  else if (a === '--json') opts.json = true;
  else if (a === '-h' || a === '--help') usage();
  else if (a.startsWith('-')) usage(`unknown option ${a}`);
  else positional.push(a);
}

const [url, output] = positional;
if (!url || !output) usage('both <url> and <output.png> are required');

function resolveViewport(spec) {
  if (VIEWPORTS[spec]) return { ...VIEWPORTS[spec] };
  const m = /^(\d+)x(\d+)$/.exec(spec);
  if (m) {
    const width = Number(m[1]);
    const height = Number(m[2]);
    const base = width <= 600 ? VIEWPORTS.mobile : VIEWPORTS.desktop;
    return { ...base, width, height };
  }
  usage(`bad viewport "${spec}" (expected mobile, desktop, or WxH)`);
}

const vp = resolveViewport(opts.viewport);
if (Number.isFinite(opts.dsf)) vp.deviceScaleFactor = opts.dsf;
if (opts.mobileUA) vp.isMobile = true, (vp.hasTouch = true);

// ------------------------------------------------------------ playwright load

// The package is installed outside the workspaces; try known locations first.
const require_ = createRequire(import.meta.url);
const CANDIDATES = [
  process.env.PLAYWRIGHT_MODULE,
  'C:/Users/Administrator/shots/node_modules/playwright/index.mjs',
  'C:/Users/Administrator/shots/node_modules/playwright/index.js',
  path.join(path.dirname(process.execPath), 'node_modules', 'playwright', 'index.mjs'),
];

async function loadPlaywright() {
  const errors = [];
  for (const c of CANDIDATES.filter(Boolean)) {
    try {
      if (fs.existsSync(c)) return await import(pathToFileURL(c).href);
    } catch (e) {
      errors.push(`${c}: ${e.message}`);
    }
  }
  try {
    return await import('playwright');
  } catch (e) {
    errors.push(`bare "playwright": ${e.message}`);
  }
  try {
    return require_('playwright');
  } catch (e) {
    errors.push(`require("playwright"): ${e.message}`);
  }
  console.error('could not load playwright. tried:\n  ' + errors.join('\n  '));
  console.error('\ninstall it with:  cd C:/Users/Administrator/shots && npm i playwright && npx playwright install chromium');
  process.exit(1);
}

// -------------------------------------------------------------- capture flow

const { chromium } = await loadPlaywright();

const outPath = path.resolve(output);
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const result = { url, output: outPath, viewport: `${vp.width}x${vp.height}`, dsf: vp.deviceScaleFactor, fullPage: opts.fullPage };

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu', // this VM has no GPU
      '--hide-scrollbars',
      '--force-color-profile=srgb',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    colorScheme: opts.dark ? 'dark' : 'light',
    // Drives prefers-reduced-motion in the browser, which is what React Native Web's
    // AccessibilityInfo.isReduceMotionEnabled() reports — the same setting the app's
    // lib/motion.ts reads. Without this the reduced-motion path had no way to be seen
    // at all: it was implemented and unverifiable.
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference',
    userAgent: opts.mobileUA || vp.isMobile ? IPHONE_UA : undefined,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(opts.timeout);
  page.setDefaultNavigationTimeout(opts.timeout);

  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e.message).slice(0, 300)));

  // A non-200 is a transport failure, not a verdict on the screen: the sweep of 40
  // captures this hour got five error pages back from the public host (http=404,
  // page=980x2121, every marker "missing") while the same routes answer 200 on the
  // local preview — i.e. Cloudflare/the tunnel, not the app. Retry once, and if the
  // page still will not load, say so with exit 2 and leave the gallery alone instead
  // of writing an error page over a screen that is fine.
  let resp = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout });
    result.status = resp ? resp.status() : null;
    if (resp && resp.status() < 400) break;
    if (attempt === 1) {
      result.retried = true;
      await page.waitForTimeout(2000);
    }
  }
  if (!resp || resp.status() >= 400) {
    const diag = path.join(os.tmpdir(), `unreachable-${path.basename(outPath)}`);
    await page.screenshot({ path: diag, fullPage: opts.fullPage, type: 'png' }).catch(() => {});
    result.ok = false;
    result.unreachable = true;
    if (opts.json) console.log(JSON.stringify(result));
    else console.error(`UNREACHABLE ${url} → HTTP ${result.status}\n  -> ${diag} (${outPath} left as it was)`);
    await context.close().catch(() => {});
    process.exit(2);
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch {
    /* networkidle is best-effort on SPAs that poll */
  }

  // Give fonts/animations/async data a moment to settle before the shuttered shot.
  await page.waitForTimeout(opts.wait);

  // The interaction probe (the positive control). This runs *before* the picture is
  // taken: --expect proves the screen rendered, this proves it still does something.
  // Item 21 is why it exists — tap-sprint's field was deaf for a day of captures and
  // every one of those PNGs passed the marker check.
  if (opts.interact) {
    const { runInteraction } = await import(new URL('./interactions.mjs', import.meta.url).href);
    try {
      result.interaction = await runInteraction(page, opts.interact);
    } catch (e) {
      result.interactionFailed = String(e && e.message ? e.message : e);
      result.ok = false;
      // A probe failure is NOT a picture of a broken screen — the screen looks
      // perfect, which is the whole reason this gate exists (item 21: a dead field
      // photographed exactly like a working one). So the diagnosis image goes to the
      // temp dir and the gallery keeps its last known-good shot, instead of a fresh,
      // healthy-looking PNG silently replacing it.
      const diag = path.join(os.tmpdir(), `probe-failed-${path.basename(outPath)}`);
      await page.screenshot({ path: diag, fullPage: opts.fullPage, type: 'png' });
      result.interactionDiagnosis = diag;
      if (opts.json) console.log(JSON.stringify(result));
      else {
        console.error(
          `INTERACTION ${opts.interact} DID NOT HAPPEN: ${result.interactionFailed}\n  ${url}` +
            `\n  -> ${diag} (diagnosis only; ${outPath} left as it was)`
        );
      }
      process.exit(3);
    }
    // Reload, so the PNG is of the screen as it ships rather than of the probe's
    // aftermath (a round in progress, a half-filled row).
    try {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: opts.timeout });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      /* the reload is best-effort; the marker check below still has to pass */
    }
    await page.waitForTimeout(opts.wait);
  }

  // Force lazy-loaded images into the viewport so fullPage captures render them.
  const forceLazy = () =>
    page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
  await forceLazy();

  result.title = await page.title();
  result.dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));

  // Content assertion. A screenshot of a blank page is worse than no screenshot:
  // it looks like proof. Case- and whitespace-insensitive on purpose: a marker exists to
  // prove the screen's copy rendered, not to pin how it is capitalised (uppercase eyebrow
  // labels are a design choice, and a case-sensitive compare failed a working screen).
  const norm = (v) => v.replace(/\s+/g, ' ').trim().toLowerCase();
  const readMissing = async () => {
    const text = await page.evaluate(() => (document.body ? document.body.innerText : ''));
    const hay = norm(text);
    return opts.expect.filter((m) => !hay.includes(norm(m)));
  };

  if (opts.expect.length) {
    result.expectChecked = opts.expect.length;
    let missing = await readMissing();
    if (missing.length) {
      // A client-rendered SPA behind a tunnel can hand back the shell before the bundle
      // has painted, so a 200 whose marker is absent is usually a race and not a broken
      // screen: five of the forty captures of 2026-09-16 read as missing (tools-hub twice,
      // stretch/walk three times) on routes that render correctly on the next attempt and
      // on 127.0.0.1:8091 in the same minute. Reload once and re-read before calling it a
      // failure. The reload is a real network round-trip — that is what `markerRetried`
      // and the request count in the test below are for.
      result.markerRetried = true;
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: opts.timeout });
        await page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch {
        /* best effort: the re-read below is the verdict */
      }
      await page.waitForTimeout(opts.wait);
      await forceLazy();
      missing = await readMissing();
      result.markersRecovered = missing.length === 0;
    }
    if (missing.length) {
      result.expectMissing = missing;
      result.ok = false;
      // Diagnosis only. The marker's value *as a picture* is low precisely because a
      // broken render of a working screen looks healthy — which is how five of these
      // silently replaced good gallery shots in one sweep. So the image goes to the temp
      // dir and the gallery keeps its last known-good PNG, exactly as the probe and
      // transport paths already do.
      const diag = path.join(os.tmpdir(), `marker-missing-${path.basename(outPath)}`);
      await page.screenshot({ path: diag, fullPage: opts.fullPage, type: 'png' }).catch(() => {});
      result.markerDiagnosis = diag;
      if (opts.json) console.log(JSON.stringify(result));
      else {
        console.error(
          `MISSING ${missing.map((m) => JSON.stringify(m)).join(', ')} (checked twice, with a reload)\n  ${url}` +
            `\n  -> ${diag} (diagnosis only; ${outPath} left as it was)`
        );
      }
      process.exit(3);
    }
    // A recovered read still gets its picture, but the reloaded page's own geometry is
    // what is recorded (the pre-reload numbers describe the shell).
    if (result.markerRetried) {
      result.dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      }));
    }
  }

  await page.screenshot({ path: outPath, fullPage: opts.fullPage, type: 'png' });
  result.consoleErrors = consoleErrors.slice(0, 5);
  await context.close();
} catch (err) {
  result.error = String(err && err.message ? err.message : err);
  if (browser) await browser.close().catch(() => {});
  console.error(opts.json ? JSON.stringify({ ...result, ok: false }) : `FAILED ${url}\n  ${result.error}`);
  process.exit(2);
} finally {
  if (browser) await browser.close().catch(() => {});
}

const bytes = fs.statSync(outPath).size;
result.bytes = bytes;
result.ok = bytes > 0;

if (opts.json) {
  console.log(JSON.stringify(result));
} else {
  console.log(
    `OK  ${url}\n  -> ${outPath}\n  ${result.viewport} @${result.dsf}x  fullPage=${opts.fullPage}  ` +
      `http=${result.status}  ${(bytes / 1024).toFixed(0)} KB  page=${result.dimensions.scrollWidth}x${result.dimensions.scrollHeight}` +
      (result.consoleErrors.length ? `\n  console errors: ${result.consoleErrors.length}` : '')
  );
}

process.exit(result.ok ? 0 : 2);
