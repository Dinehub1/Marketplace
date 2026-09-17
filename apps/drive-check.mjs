import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:8099/stretch', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.locator('text=Start routine').first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/live-stretch-2.png' });

// Overlap check: nothing a person must read or press may sit on top of the figure's frame.
const boxes = await page.evaluate(() => {
  const pick = (re) => {
    for (const el of document.querySelectorAll('div')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ');
      if (re.test(own)) { const b = el.getBoundingClientRect(); return { y: Math.round(b.y), h: Math.round(b.height) }; }
    }
    return null;
  };
  const svg = [...document.querySelectorAll('svg')].map((s) => s.getBoundingClientRect()).filter((b) => b.height > 120)[0];
  return {
    figure: svg ? { y: Math.round(svg.y), h: Math.round(svg.height) } : null,
    next: pick(/^NEXT$/), pause: pick(/^Pause$/), prev: pick(/^Previous$/), finish: pick(/^Finish$/),
  };
});
console.log('boxes:', JSON.stringify(boxes));
const f = boxes.figure;
const overlap = (b) => (b && f && b.y < f.y + f.h && b.y + b.h > f.y ? 'OVERLAPS' : 'clear');
for (const k of ['next', 'pause', 'prev', 'finish']) console.log(`  ${k.padEnd(7)} ${overlap(boxes[k])}`);
console.log(errors.length ? 'PAGE ERRORS: ' + errors.join('; ') : 'no page errors');
await browser.close();
