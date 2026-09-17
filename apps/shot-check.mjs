import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:8099/breathe', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

// Count the real chips by their accessibility labels — not by scanning text, which found the
// summary card's labels last time and flattered the result.
const chips = () => page.evaluate(() => {
  const labels = [...document.querySelectorAll('button,[role="button"]')].map((b) => b.getAttribute('aria-label') || '');
  return {
    patterns: labels.filter((l) => /Coherent|Box|4·7·8|Long exhale/.test(l)).length,
    lengths: labels.filter((l) => /\d+ min/.test(l)).length,
    summary: /THIS SESSION/.test(document.body.innerText),
  };
});

console.log('idle:    ', JSON.stringify(await chips()));
await page.locator("xpath=//button[normalize-space(.)='Begin']").first().click();
await page.waitForTimeout(1300);
console.log('running: ', JSON.stringify(await chips()));
await page.locator("xpath=//button[normalize-space(.)='Pause']").first().click();
await page.waitForTimeout(700);
console.log('paused:  ', JSON.stringify(await chips()));

// The whole point: can a pattern actually be tapped while paused, and does it return to the start?
const before = await page.evaluate(() => document.body.innerText.includes('PAUSED'));
await page.locator('[aria-label^="Box 4·4·4·4"]').first().click();
await page.waitForTimeout(700);
const after = await page.evaluate(() => ({
  paused: document.body.innerText.includes('PAUSED'),
  ready: document.body.innerText.includes('TAP TO BEGIN'),
  pattern: (document.body.innerText.match(/(Coherent|Box 4·4·4·4|4·7·8|Long exhale)/) || [])[0],
  elapsed: (document.body.innerText.match(/(\d+:\d\d)\s*\n?\s*ELAPSED/i) || [])[1],
}));
console.log('was paused:', before, '→ after tapping Box:', JSON.stringify(after));

await page.evaluate(() => window.scrollTo(0, 260));
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/breathe-after-fix.png' });
console.log(errors.length ? 'ERRORS: ' + errors.join('; ') : 'no page errors');
await browser.close();
