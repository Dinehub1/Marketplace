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
 *
 * Three of the probes need a file (a PDF, three photos): no job is ever sent, the
 * pickers are the thing under test. The fixtures are written to the temp dir at
 * probe time — a 1-page PDF made by hand and three 1x1 PNGs — so nothing in the repo
 * has to carry test data.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SABOTAGE = process.env.PROBE_SABOTAGE === '1';

// ------------------------------------------------------------------- fixtures

/** The pickers only need the file to have the right kind (`accept` on the input),
 *  and no job is run, so this is a real but deliberately trivial one-page PDF. */
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n' +
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n',
  'utf8',
);

/** A 1x1 PNG — the collage only shows thumbnails of what it was given. */
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

let fixtureDir = null;

function fixture(name, contents) {
  if (!fixtureDir) {
    fixtureDir = path.join(os.tmpdir(), 'dropby-probe-fixtures');
    fs.mkdirSync(fixtureDir, { recursive: true });
  }
  const p = path.join(fixtureDir, name);
  // Rewritten every run: a fixture that survived from a previous hour is exactly the
  // stale-input mistake this repo has made before.
  fs.writeFileSync(p, contents);
  return p;
}

/**
 * Answer the file picker the screen opens.
 *
 * Every web picker in the app builds an `<input type="file">` on the press, clicks it
 * and removes it when it settles (`lib/tools.ts` → `pickOnWeb`), so the files have to
 * be handed over while the chooser is open: Playwright hands the chooser to us and
 * `setFiles` is what a person's file dialog would do.
 */
async function chooseFiles(page, open, files) {
  const opening = page.waitForEvent('filechooser', { timeout: 15000 });
  await open();
  const chooser = await opening;
  await chooser.setFiles(files);
}

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

/**
 * The invoice's own version of "the control stopped responding": the field still takes
 * the keystroke, the screen never hears about it. (Pointer events are no use here —
 * `fill()` would time out on the actionability check instead of letting the probe say
 * what did not happen. Blocking the DOM `input` event in the capture phase stops it
 * before React's root listener sees it, which is the real fault being simulated.)
 */
async function deafen(selector, page) {
  if (!SABOTAGE) return;
  await page.evaluate((sel) => {
    for (const el of document.querySelectorAll(sel)) {
      el.addEventListener('input', (e) => e.stopPropagation(), true);
    }
  }, selector);
}

/** The sentence on a tool screen's primary button — what the press is about to do. */
function jobLabel(page) {
  return page.evaluate(() => {
    const shape = /^(Merge|Split pages|Compress|Rotate|Number pages at|Choose a PDF|Choose a different PDF|Add at least|Make the collage|Add \d+ more)/;
    const btns = [...document.querySelectorAll('[role="button"]')].filter((el) =>
      shape.test((el.innerText || '').trim()),
    );
    // The primary button is the one whose `disabled` prop reaches the DOM as
    // aria-disabled; the picker button above it never has one — and both can read
    // "Choose a PDF", which is how this read the wrong button the first time it ran.
    const withState = btns.filter((el) => el.hasAttribute('aria-disabled'));
    const btn = (withState.length ? withState : btns).pop();
    return btn ? btn.innerText.trim().split('\n')[0] : null;
  });
}

/**
 * The PDF screen's turn picker: press a `90 / 180 / 270` chip and require the primary
 * button to name the job it will run. The screen computes that sentence from the chip
 * (`Rotate ${angleLabel}`), so a chip that never lands leaves the sentence saying the
 * old angle — the same shape as tap-sprint's deaf field: the screen looks right.
 *
 * One PDF has to be attached first: with no file the button reads "Choose a PDF" and
 * the angle is not on it at all.
 */
async function pdfRotatePick(page) {
  const card = page.locator('[role="radio"]').filter({ hasText: 'Rotate' }).first();
  if (!(await card.count())) throw new Error('the PDF screen is missing its Rotate job card');
  await card.click();
  await page.waitForTimeout(250);

  await chooseFiles(page, () => page.locator('text=Choose a PDF').first().click(), [
    fixture('probe-rotate.pdf', MINIMAL_PDF),
  ]);
  await page.waitForTimeout(600);

  const before = await jobLabel(page);
  if (!/^Rotate /.test(before || ''))
    throw new Error(
      `the PDF never reached the screen, so the button still reads ${JSON.stringify(before)} instead of naming the rotate job`,
    );

  await sabotage('[aria-label^="Rotate "]', page);
  const chip = page.locator('[aria-label="Rotate a half turn — the page upside down"]').first();
  const box = await chip.boundingBox();
  if (!box) throw new Error('the 180° chip has no box on the page');
  await press(page, Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
  await page.waitForTimeout(350);

  const after = await jobLabel(page);
  if (after !== 'Rotate 180°')
    throw new Error(
      `pressing the 180° chip did not change the job the screen would run (the button still reads ${JSON.stringify(after)}, it read ${JSON.stringify(before)} before)`,
    );
  return { detail: `attached a PDF, pressed the 180° chip — the button went "${before}" → "${after}"` };
}

/**
 * The invoice's UPI field: what matters is not that the text lands in the input but
 * that the **bill preview** carries it, and that a malformed id is refused in words
 * rather than printed onto the sheet.
 */
async function invoiceUpiPreview(page) {
  const sel = 'input[placeholder="yourname@bank"]';
  const field = page.locator(sel).first();
  if (!(await field.count())) throw new Error('the invoice screen has no UPI id field');
  if (await page.evaluate(() => document.body.innerText.includes('Pay by UPI')))
    throw new Error('the bill already carried a UPI line before anything was typed');

  const readPaper = () =>
    page.evaluate(() => {
      const m = document.body.innerText.match(/Pay by UPI · (\S+)/);
      return m ? m[1] : null;
    });

  await deafen(sel, page);
  await field.fill('sharmaelectricals@okhdfcbank');
  await page.waitForTimeout(350);
  const printed = await readPaper();
  if (printed !== 'sharmaelectricals@okhdfcbank')
    throw new Error(
      `typing a UPI id into the field did not reach the bill preview (the paper says ${printed ? JSON.stringify(printed) : 'nothing about UPI'})`,
    );

  // The other half of the claim: a bad id is refused, and the sheet loses the line.
  await field.fill('not-a-upi');
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => ({
    paper: document.body.innerText.includes('Pay by UPI'),
    refused: document.body.innerText.includes('That is not a UPI id'),
  }));
  if (after.paper || !after.refused)
    throw new Error(
      `a malformed UPI id was not refused: the bill still carries a UPI line = ${after.paper}, and the refusal sentence is on the page = ${after.refused}`,
    );
  return {
    detail: `typed sharmaelectricals@okhdfcbank — the paper went from no UPI line to "Pay by UPI · sharmaelectricals@okhdfcbank"; "not-a-upi" dropped the line and was refused in words`,
  };
}

/**
 * The collage's shape chips: three photos in, press "3 across", and require the note
 * under the chips to become that shape's note. Then the control the item names — a chip
 * that cannot hold three photos is **dimmed**, and a press on it must change nothing.
 * Neither check reads a label the probe itself could have set.
 */
async function collageShapePick(page) {
  await chooseFiles(page, () => page.locator('text=Add photos').first().click(), [
    fixture('probe-1.png', ONE_PX_PNG),
    fixture('probe-2.png', ONE_PX_PNG),
    fixture('probe-3.png', ONE_PX_PNG),
  ]);
  await page.waitForTimeout(700);

  const button = await jobLabel(page);
  if (!/^Make the collage · 3 photos$/.test(button || ''))
    throw new Error(
      `the three photos never reached the screen (the button reads ${JSON.stringify(button)} instead of "Make the collage · 3 photos")`,
    );

  const NOTE = /(we pick the shape that fits|two side by side|two stacked|a square of four|a strip of three)/;
  const note = () =>
    page.evaluate((src) => {
      const m = document.body.innerText.match(new RegExp(src));
      return m ? m[1] : null;
    }, NOTE.source);
  const before = await note();

  await sabotage('[role="button"]', page);
  const pressChip = async (name) => {
    const chip = page.getByRole('button', { name, exact: true }).first();
    const b = await chip.boundingBox();
    if (!b) throw new Error(`the "${name}" chip has no box on the page`);
    await press(page, Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2));
    await page.waitForTimeout(350);
  };

  await pressChip('3 across');
  const after = await note();
  if (after !== 'a strip of three')
    throw new Error(
      `pressing "3 across" did not change the shape the screen would use (the note under the chips still reads ${JSON.stringify(after)}, it read ${JSON.stringify(before)} before)`,
    );

  // Three photos cannot fit a two-cell sheet, so that chip is dimmed with the reason on
  // it. A press there has to do nothing — a chip that is dimmed but still live is the
  // silent-wrong-job case (the engine would answer 400).
  await pressChip('2 across');
  const held = await note();
  if (held !== 'a strip of three')
    throw new Error(
      `the dimmed "2 across" chip changed the shape to ${JSON.stringify(held)} even though it cannot hold the three photos on the screen`,
    );

  return {
    detail: `added 3 photos and pressed "3 across" — the shape note went "${before}" → "${after}", and the dimmed "2 across" (holds 2 of 3) left it alone`,
  };
}

/**
 * merge-tiles: start a round and slide a direction.
 *
 * The observable change is the HUD's own move counter, and it is the right one here
 * because of a rule in the game: a slide against a wall is deliberately **not** a move. So
 * "the button was pressed" and "the board changed" are different claims, and this checks
 * the second. All four arrows are pressed in turn, because which of them can move depends
 * on where the two opening tiles landed.
 *
 * The arrows are probed rather than the swipe, and both go through the same `onSlide`, so
 * this covers the board's response either way. The swipe's own maths (`swipeDir`: the
 * diagonal, the tie, the threshold) is asserted in `scripts/check-merge-tiles.mjs`, because
 * a synthetic drag through this harness is exactly the kind of thing that fails for reasons
 * that have nothing to do with the game.
 */
function mergeHud(page) {
  return page.evaluate(() => {
    const body = document.body.innerText;
    // Read the way a person reads it. The header puts SCORE over its number, the status row
    // puts "Moves: 4" and "Best Tile: 8" on one line — both shapes are accepted, so the probe
    // follows the screen instead of pinning it to one of them. (It used to read a hidden
    // block of test text in the screen; that block is gone, and a probe that reads the real
    // HUD is a probe that would notice the HUD going missing.)
    const num = (label) => {
      const m = body.match(new RegExp(`${label}\\s*:?\\s*(-?\\d+)`, 'i'));
      return m ? Number(m[1]) : null;
    };
    return { score: num('Score'), moves: num('Moves'), best: num('Best tile') };
  });
}

async function mergeTilesSlide(page) {
  // The board is live the moment the screen opens (the game starts itself, the way the
  // genre does), so a Start gate is clicked only when the screen has one. Both shapes are
  // the same game, and this probe is about the slide, not about how a round begins.
  const gate = page.locator('text=Start the round').first();
  if (await gate.count()) {
    await gate.click();
    await page.waitForTimeout(400);
  }

  const before = await mergeHud(page);
  if (before.moves === null) throw new Error('the round started with no move counter on the page');
  if (before.moves !== 0) throw new Error(`a fresh round already reports ${before.moves} moves`);

  const board = page.locator('[aria-label^="Board"]').first();
  if (!(await board.count())) throw new Error('the round started with no board on the page');
  await sabotage('[aria-label^="Board"]', page);

  const box = await board.boundingBox();
  if (!box) throw new Error('the board is on the page but has no box to swipe');

  // The swipe is this game's only control, so a drag is what proves the screen still plays:
  // there is no arrow pad to press any more, and a probe that pressed buttons would be
  // proving something the game no longer ships.
  //
  // It is driven as real pointer events on the board — the same grant/release the game reads
  // — with several small steps, because the game measures where the finger started and where
  // it ended. The travel is a third of the board, comfortably past the engine's own
  // 22-pixel threshold. All four directions are tried: which one can move depends on where
  // the two opening tiles landed, and a slide against a wall is deliberately not a move.
  const cx = Math.round(box.x + box.width / 2);
  const cy = Math.round(box.y + box.height / 2);
  const travel = Math.max(40, Math.round(Math.min(box.width, box.height) / 3));
  const drags = [
    [-travel, 0, 'left'],
    [travel, 0, 'right'],
    [0, -travel, 'up'],
    [0, travel, 'down'],
  ];

  let lastWhy = 'the board was never swiped';
  for (const [dx, dy, label] of drags) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + Math.round(dx / 2), cy + Math.round(dy / 2), { steps: 4 });
    await page.mouse.move(cx + dx, cy + dy, { steps: 4 });
    await page.mouse.up();
    await page.waitForTimeout(350);
    const after = await mergeHud(page);
    if (after.moves !== null && after.moves > before.moves) {
      return {
        detail:
          `swiped ${label} across the board — moves ${before.moves} → ${after.moves}, ` +
          `score ${before.score} → ${after.score}, best tile ${before.best} → ${after.best}`,
      };
    }
    lastWhy = `swiping ${label} did not change the board (moves still ${after.moves})`;
  }
  throw new Error(`no swipe reached the board: ${lastWhy}`);
}

/**
 * stretch: press "Start routine" and reach the guided class.
 *
 * This probe exists because of a real crash. Pressing Start on the Stretch screen brought the app
 * down, and no `--expect` marker could have caught it: the setup screen rendered perfectly, with all
 * its copy on the page, and the failure was in the *transition*. A capture of the setup state is a
 * picture of the app working.
 *
 * So the observable change is the class itself: the guided state names a movement ("MOVE 1 OF 8"),
 * offers Pause/Skip, and offers Finish. Any of those is proof the transition completed. The probe
 * also fails loudly on the two ways this screen can die silently — an error boundary's copy, and a
 * blank page — because "the button was pressed" is not "the class started".
 */
async function stretchStart(page) {
  const before = await page.evaluate(() => document.body.innerText);
  if (/Something went wrong|Application error|Unhandled/i.test(before)) {
    throw new Error(`the Stretch setup screen was already showing an error: ${before.slice(0, 200)}`);
  }

  // Found by an XPath over the button's whole text, for the same reason the Breathe probe is:
  // `text=` matches on a substring, and RN Web puts the label in a nested div where neither the
  // accessible name nor `hasText` sees it.
  const start = page.locator("xpath=//button[normalize-space(.)='Start routine']").first();
  await start.waitFor({ state: 'visible', timeout: 15000 });
  await start.click();

  // Wait for the class rather than for a fixed delay: the transition is a state change plus an
  // arrival animation, and pinning a duration here would make the probe a flake generator.
  try {
    await page.getByText(/MOVE \d+ OF \d+/).first().waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 220));
    throw new Error(`Start did not reach the class within 8s; the page reads: ${body}`);
  }

  const after = await page.evaluate(() => document.body.innerText);
  if (/Something went wrong|Application error|Unhandled/i.test(after)) {
    throw new Error(`the app crashed on Start — the page now reads: ${after.slice(0, 200)}`);
  }
  if (!after.trim()) throw new Error('the page is blank after Start, which is a crash, not a class');

  const reached =
    /MOVE \d+ OF \d+/i.test(after) ||
    /NEXT|LAST MOVEMENT/i.test(after) ||
    (await page.locator('text=Finish').count()) > 0;
  if (!reached) {
    throw new Error(`Start did not reach the class; the page still reads: ${after.slice(0, 200)}`);
  }

  // The clock has to actually run, or "the class started" is a still picture.
  const clock = () => page.evaluate(() => (document.body.innerText.match(/\b\d+:\d\d\b/) || [])[0] ?? null);
  const t0 = await clock();
  await page.waitForTimeout(1500);
  const t1 = await clock();
  if (t0 === null) throw new Error('the class started with no clock on the page');
  if (t0 === t1) throw new Error(`the class started but its clock is frozen at ${t0}`);

  return { detail: `the class started, showed movement 1, and its clock ran ${t0} → ${t1}` };
}

/**
 * breathe: press Begin and reach a running session.
 *
 * The same class of check as `stretch-start` — the transition is the thing that can break, and the
 * idle screen no `--expect` marker can see past. "TAP TO PAUSE" is the running state's own copy, so
 * the probe is reading the screen rather than reading a variable.
 */
async function breatheStart(page) {
  /*
   * The primary action, found as an *interactive element* whose text is exactly "Begin".
   *
   * The obvious `text=Begin` matches on a substring, and the first match on this screen is the
   * circle's hint copy "TAP TO BEGIN" — a `<div>` inside the Pressable, not the control. Clicking
   * that usually works by bubbling and sometimes does nothing at all, which is exactly the
   * intermittent a capture gate exists to catch: the probe passed when run by hand and failed inside
   * the pipeline, where the page has had less time to settle.
   *
   * The two forms that look right against this markup do not work either: `getByRole('button', {
   * name })` finds nothing because RN Web renders the label into a nested `<div>` and the accessible
   * name comes out empty, and `filter({ hasText })` compares against each *text node* rather than the
   * element's text. `normalize-space(.)` in an XPath is what reads the element's whole text.
   */
  const begin = page.locator("xpath=//button[normalize-space(.)='Begin']").first();
  await begin.waitFor({ state: 'visible', timeout: 15000 });
  await begin.click();

  // Wait for the running state rather than for a fixed delay: the transition is a state change plus
  // a pacer re-arm, and how long that takes is not this probe's business.
  const running = page.getByText('TAP TO PAUSE');
  try {
    await running.first().waitFor({ state: 'visible', timeout: 8000 });
  } catch {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 200));
    throw new Error(`Begin did not start a session within 8s; the page reads: ${body}`);
  }

  const body = await page.evaluate(() => document.body.innerText);
  if (/Something went wrong|Application error|Unhandled/i.test(body)) {
    throw new Error(`the app crashed on Begin — the page now reads: ${body.slice(0, 200)}`);
  }

  // A running session has to be counting its phases down, not just showing the copy.
  const phaseSeconds = () =>
    page.evaluate(() => {
      const m = document.body.innerText.match(/\n(\d+)s\n/);
      return m ? Number(m[1]) : null;
    });
  const a = await phaseSeconds();
  await page.waitForTimeout(1600);
  const b = await phaseSeconds();
  if (a === null) throw new Error('the session started with no phase countdown on the page');
  if (a === b) throw new Error(`the session started but its countdown is frozen at ${a}s`);

  return { detail: `the session started and its phase countdown ran ${a}s → ${b}s` };
}

/**
 * browse: press the feed's own listing card and require that listing to open.
 *
 * Item 51: `/browse`'s capture marker is its header line — "N verified businesses you can call
 * straight away" — which renders whether or not a single listing arrived (the `home` entry has an
 * empty `expect` for the same reason). So a feed that paints its header over an empty list, or a
 * card whose press does nothing (item 21's fault class), passes every marker check in the gallery
 * today, and this is the directory app's primary interaction and its whole conversion path.
 *
 * The card body is found the way a person finds it rather than by a style: it is the only
 * `role=button` on the screen with no accessibility label — the Call / WhatsApp / website buttons
 * all carry one. Three claims are required in order, because only the third is the useful one:
 * a press changes the route to a listing, that page renders, and it renders **the name that was on
 * the card that was pressed**. A card that opened a different business passes a route-only check.
 *
 * The press navigates, so the probe walks back to the feed before returning: the harness reloads
 * the page it is on and photographs that, and a picture of a listing page would fail `/browse`'s
 * marker check — a capture that fails for the probe's own side effect is worse than no probe.
 */
async function browseListingOpen(page) {
  const started = new URL(page.url());
  // The card surface and, for the sabotage control, everything inside it: `pointer-events: none`
  // on the wrapper alone still lets a descendant be hit and the event bubble back through, which
  // would make this gate unfailable.
  const CARD = '[role="button"]:not([aria-label])';

  const card = page.locator(CARD).first();
  try {
    await card.waitFor({ state: 'visible', timeout: 20000 });
  } catch {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 200));
    throw new Error(`no listing card ever appeared on the feed; the page reads: ${body}`);
  }

  const name = ((await card.innerText()) || '').trim().split('\n')[0];
  if (!name) throw new Error('the first listing card carries no business name at all');
  const box = await card.boundingBox();
  if (!box) throw new Error(`the "${name}" card has no box on the page`);
  await sabotage(`${CARD}, ${CARD} *`, page);
  await press(page, Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));

  // Wait for the route rather than for a fixed delay; read it either way, so the failure sentence
  // can say where the press left the app instead of only that it did not work.
  try {
    await page.waitForURL(/\/business\/\d+/, { timeout: 15000 });
  } catch {
    /* the route check below is what reports it */
  }
  const route = new URL(page.url()).pathname;
  if (!/^\/business\/\d+$/.test(route))
    throw new Error(
      `pressing the "${name}" card did not open a listing — the route is still ${route} (it was ${started.pathname} before the press)`,
    );

  // The page has to name the business that was pressed. `cleanBusinessName` is applied on both
  // screens, so a prefix is enough and survives a line clamp differing between the two.
  const wanted = name.slice(0, 20);
  try {
    await page.waitForFunction(
      (n) => document.body.innerText.includes('Business details') && document.body.innerText.includes(n),
      wanted,
      { timeout: 20000 },
    );
  } catch {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 200));
    throw new Error(`the press reached ${route} but that page does not read "${wanted}" — it reads: ${body}`);
  }

  // Back to the feed, because this probe runs before the picture is taken.
  try {
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
  } catch {
    /* fall through to the goto below */
  }
  if (new URL(page.url()).pathname !== started.pathname) {
    await page.goto(started.href, { waitUntil: 'domcontentloaded' });
  }
  const back = new URL(page.url()).pathname;
  if (back !== started.pathname)
    throw new Error(`the probe opened ${route} and could not get back to ${started.pathname}; it is on ${back}`);

  return {
    detail: `pressed the "${name}" card — the route went ${started.pathname} → ${route}, that page rendered "Business details" and the same name, and the probe returned to ${back}`,
  };
}

export const INTERACTIONS = {
  'pdf-rotate-pick': {
    screen: 'pdf-tools',
    what: 'press a turn chip; the primary button has to name the job it will run',
    run: pdfRotatePick,
  },
  'invoice-upi-preview': {
    screen: 'invoice',
    what: 'type a UPI id; the bill preview has to carry it, and refuse a malformed one',
    run: invoiceUpiPreview,
  },
  'collage-shape-pick': {
    screen: 'collage',
    what: 'press a shape chip; the note has to change and a dimmed chip must stay inert',
    run: collageShapePick,
  },
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
  'merge-tiles-slide': {
    screen: 'merge-tiles',
    what: 'start a round and press an arrow; the move counter has to move',
    run: mergeTilesSlide,
  },
  'stretch-start': {
    screen: 'stretch',
    what: 'press "Start routine" and reach the class; the guided state and a running clock have to appear',
    run: stretchStart,
  },
  'breathe-start': {
    screen: 'breathe',
    what: 'press "Begin" and reach a running session; the pause state and a counting phase have to appear',
    run: breatheStart,
  },
  'browse-listing-open': {
    screen: 'browse',
    what: 'press the first listing card; the route has to open that listing and its page has to name it',
    run: browseListingOpen,
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
