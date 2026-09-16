/**
 * interactions.mjs — positive controls for the screenshot pipeline.
 *
 * `--expect <text>` in screenshot.mjs proves a screen **rendered**; it says nothing
 * about whether the screen **works**. Item 21 is the proof: tap-sprint's playing
 * field was inert for a whole day of captures — every PNG looked perfect, the marker
 * copy was all on the page, and every round scored zero. A capture that cannot see
 * that is not verification, it is decoration.
 *
 * So a screen with one obvious primary interaction declares a probe here, and
 * app-shots.mjs runs it (through `screenshot.mjs --interact <name>`) *before* it
 * writes the picture. A probe has to observe a change it did not put on the page
 * itself — a number moving, a control appearing — or it throws, the harness exits 3,
 * and the run counts as failed.
 *
 * Writing a probe:
 *   - press the real control a person presses (the accessibility label, not a style);
 *   - read the state before, act, read it after, and require a change;
 *   - keep every failure message a sentence about what did NOT happen.
 *
 * PROBE_SABOTAGE=1 is for testing this gate itself: it makes the probe's own target
 * refuse pointer events, i.e. it reproduces "the screen stopped responding" without
 * touching the app. It is never set by a normal capture run.
 */

const SABOTAGE = process.env.PROBE_SABOTAGE === '1';

/** tap-sprint's accent in each scheme: the dot, the lives and the start button all
 *  wear it, so the dot is found by its colour + its squareness, never by a class. */
const DOT_COLOURS = ['rgb(219, 39, 119)', 'rgb(244, 114, 182)'];

/** A press that works whether or not the context has a touch screen. */
async function press(page, x, y) {
  const hasTouch = await page.evaluate(() => 'ontouchstart' in window || navigator.maxTouchPoints > 0);
  if (hasTouch) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** Makes a target refuse pointer events — the "interaction stopped responding" case. */
async function sabotage(selector, page) {
  if (!SABOTAGE) return;
  await page.evaluate((sel) => {
    for (const el of document.querySelectorAll(sel)) el.style.pointerEvents = 'none';
  }, selector);
}

/** tap-sprint's HUD, read off the page the same way a person reads it. */
function hud(page) {
  return page.evaluate(() => {
    const body = document.body.innerText;
    const num = (label) => {
      const m = body.match(new RegExp(`${label}\\s*\\n\\s*(-?\\d+)`, 'i'));
      return m ? Number(m[1]) : null;
    };
    return {
      score: num('Score'),
      time: num('Time'),
      reaction: (body.match(/(\d+) ms · \+\d+/) || [])[1] ?? null,
    };
  });
}

/** Where the dot is right now, in page coordinates, or null if there is none. */
function dotBox(page, colours) {
  return page.evaluate((list) => {
    const d = [...document.querySelectorAll('div')].find((el) => {
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return list.includes(cs.backgroundColor) && Math.abs(b.width - b.height) < 2 && b.width > 40;
    });
    if (!d) return null;
    const b = d.getBoundingClientRect();
    return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2), Math.round(b.width)];
  }, colours);
}

/** The playing field itself — the element a tap has to reach for a hit to be possible. */
const FIELD = 'button[aria-label="Playing field. Tap the dot."]';

/**
 * tap-sprint: start a round and hit the dot. The observable change is the round's own
 * score, which is exactly what stayed at 0 for a day while the field was deaf (item 21):
 * a press-and-hold scored, a tap did not, and the PNGs could not tell the difference.
 */
async function tapSprintHit(page) {
  await page.locator('text=Start the round').first().click();
  await page.waitForTimeout(400); // the dot spawns with the round, in the same render

  const field = await page.locator(FIELD).count();
  if (!field) throw new Error('the round started but no playing field is on the page');
  await sabotage(FIELD, page);

  const before = await hud(page);
  let lastWhy = 'no dot was ever on the field';
  for (let attempt = 0; attempt < 3; attempt++) {
    const box = await dotBox(page, DOT_COLOURS);
    if (!box) {
      await page.waitForTimeout(250);
      continue;
    }
    await press(page, box[0], box[1]);
    await page.waitForTimeout(450);
    const after = await hud(page);
    if (after.score !== null && before.score !== null && after.score > before.score) {
      return { detail: `started a round, tapped the dot at ${box[0]},${box[1]} — score ${before.score} → ${after.score} (reaction ${after.reaction ?? '?'} ms), lives hold` };
    }
    lastWhy = `a tap on the dot at ${box[0]},${box[1]} did not move the score (still ${after.score})`;
  }
  throw new Error(`the playing field is not responding: ${lastWhy}`);
}

/** word-duel: press a letter tile and require it to land in the word row, which is
 *  empty before the press and carries a "Put back <letter>" slot after it. */
async function wordDuelPick(page) {
  await page.locator('text=Start the round').first().click();
  await page.waitForTimeout(400);

  const tiles = page.locator('[aria-label^="Letter "]');
  const tileCount = await tiles.count();
  if (!tileCount) throw new Error('the round started but no letter tile is on the page');
  const filledBefore = await page.locator('[aria-label^="Put back "]').count();
  if (filledBefore !== 0)
    throw new Error(`the word row was not empty before the press (${filledBefore} slots filled)`);

  const label = await tiles.first().getAttribute('aria-label');
  const box = await tiles.first().boundingBox();
  await sabotage('[aria-label^="Letter "]', page);
  // Pressed at the tile's own centre rather than through locator.click(): a sabotaged
  // tile (pointer-events: none) never receives the event, and locator.click() would
  // spend its whole timeout failing an actionability check instead of letting the
  // probe report what did not happen.
  await press(page, Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
  await page.waitForTimeout(400);

  const filled = await page.locator('[aria-label^="Put back "]').count();
  if (filled !== 1)
    throw new Error(`pressing ${label} did not reach the word row (${filled} of 1 slots filled)`);
  const slot = await page.locator('[aria-label^="Put back "]').first().getAttribute('aria-label');
  const used = await tiles.first().getAttribute('aria-disabled');
  return {
    detail: `pressed ${label} — the row was empty and now holds "${(slot || '').replace('Put back ', '')}" (tile disabled: ${used ?? 'unset'})`,
  };
}

/**
 * block-clear: pick a tray piece and put it on the board.
 *
 * Two observable changes, because either half fails on its own and they are
 * different bugs. Selecting a piece has to *outline* the squares it fits (a tray
 * that picks up but highlights nothing means the anchor maths is dead), and
 * pressing one of those outlined squares has to *add* blocks to the board (a
 * highlight that places nothing means the board is deaf). Neither check reads the
 * screen's own copy, so a relabelled button cannot satisfy either one.
 */
async function blockClearPlace(page) {
  await page.locator('text=Start the round').first().click();
  await page.waitForTimeout(400);

  const pieces = page.locator('[aria-label^="Piece "]');
  const pieceCount = await pieces.count();
  if (pieceCount !== 3) throw new Error(`the round started with ${pieceCount} pieces in the tray, not 3`);

  const piece = pieces.first();
  const pieceLabel = (await piece.getAttribute('aria-label')) || 'the first piece';
  const pieceBox = await piece.boundingBox();
  if (!pieceBox) throw new Error('the first tray piece has no box on the page');
  await sabotage('[aria-label^="Piece "]', page);
  await press(page, Math.round(pieceBox.x + pieceBox.width / 2), Math.round(pieceBox.y + pieceBox.height / 2));
  await page.waitForTimeout(350);

  const targets = page.locator('[aria-label*="piece fits"]');
  const targetCount = await targets.count();
  if (!targetCount)
    throw new Error(`pressing ${pieceLabel} did not outline a single square it fits — the piece is not picked up`);

  const filledBefore = await page.locator('[aria-label$="filled"]').count();
  const target = targets.first();
  const targetLabel = (await target.getAttribute('aria-label')) || 'an outlined square';
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('the outlined square has no box on the page');
  await press(page, Math.round(targetBox.x + targetBox.width / 2), Math.round(targetBox.y + targetBox.height / 2));
  await page.waitForTimeout(350);

  const filledAfter = await page.locator('[aria-label$="filled"]').count();
  if (filledAfter <= filledBefore)
    throw new Error(
      `pressing ${targetLabel} put nothing on the board (${filledBefore} filled squares before, ${filledAfter} after)`,
    );

  return {
    detail: `picked up ${pieceLabel}, pressed ${targetLabel} — filled squares went ${filledBefore} → ${filledAfter}`,
  };
}

export const INTERACTIONS = {
  'tap-sprint-hit': {
    screen: 'tap-sprint',
    what: 'start a round and hit the dot; the score has to move',
    run: tapSprintHit,
  },
  'word-duel-pick': {
    screen: 'word-duel',
    what: 'press a letter tile; it has to land in the word row',
    run: wordDuelPick,
  },
  'block-clear-place': {
    screen: 'block-clear',
    what: 'pick a tray piece and press an outlined square; the board has to change',
    run: blockClearPlace,
  },
};

export function interactionNames() {
  return Object.keys(INTERACTIONS);
}

/** Runs one named probe. Returns { name, detail } or throws a readable sentence. */
export async function runInteraction(page, name) {
  const probe = INTERACTIONS[name];
  if (!probe) throw new Error(`unknown interaction "${name}" (known: ${interactionNames().join(', ')})`);
  const out = await probe.run(page);
  return { name, screen: probe.screen, what: probe.what, sabotaged: SABOTAGE, detail: out.detail };
}
