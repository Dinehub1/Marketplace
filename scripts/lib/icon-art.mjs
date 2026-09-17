/**
 * icon-art.mjs — the marks behind every store icon, as vector art rather than a monogram.
 *
 * ── Why the monogram had to go ────────────────────────────────────────────────────────
 *
 * Every icon in the fleet used to be two or three letters on a coloured square. They were real,
 * they were distinct, and they were also *obviously* placeholders: the same template with different
 * initials is the first thing a reviewer notices when deciding whether twenty listings are one app
 * wearing twenty hats. A drawable mark is the difference between "this is a template" and "somebody
 * designed this".
 *
 * ── The rules the art obeys ───────────────────────────────────────────────────────────
 *
 * These are not preferences; each one is a constraint that makes an icon survive a launcher:
 *
 *   1. **One mark per app, on the app's own accent.** No shared silhouettes. Two apps in the same
 *      family still have to be told apart at 60 px on a home screen full of neighbours.
 *   2. **Every mark is legible at 60 px.** That is the real test and it is why the marks are drawn
 *      with few, large forms and no interior detail finer than about 1/24 of the tile. The
 *      contact sheet from `preview-app-icons.mjs` draws each mark at 1024 *and* at 60 so this can
 *      be checked by eye rather than asserted.
 *   3. **The glyph is a light monoline**, round-capped, on a saturated ground. A dark glyph on a
 *      pale tile disappears in dark mode; a white glyph on the app's own colour works in both.
 *   4. **Nothing extends past 78% of the tile.** The launcher may crop to a squircle, a circle or a
 *      rounded square, and some platforms magnify by 1.1 before they do. A mark that reaches the
 *      edge loses its extremities on somebody's phone.
 *
 * ── What is generated and what is drawn ───────────────────────────────────────────────
 *
 * The *background* is generated per target (a two-stop gradient from the app's own colour, a soft
 * radial lift behind the mark, and a hairline rim) so twenty tiles are consistent by construction.
 * The *marks* are hand-written paths: twenty small drawings, in the same spirit as
 * `components/icons.tsx`, that can be read, reviewed and changed by a person.
 *
 * Rendered by `scripts/make-app-icons.mjs`; previewed by `scripts/preview-app-icons.mjs`.
 */

/** Mix a hex colour toward white. Used for the gradient's light stop and the rim. */
export function lighten(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `#${((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255))
    .toString(16)
    .padStart(6, '0')}`;
}

/** Darken toward black, for the gradient's deep stop. */
export function darken(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (c) => Math.round(c * (1 - amount));
  return `#${((mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255))
    .toString(16)
    .padStart(6, '0')}`;
}

/*
 * ── Mark helpers ────────────────────────────────────────────────────────────────────────
 *
 * Every mark is authored on a 24×24 grid and scaled by the caller, exactly like the in-app icon
 * set. Each helper returns one or more SVG elements that assume the `g` wrapper below has already
 * set the stroke colour, width, linecap and linejoin.
 */

const P = (d) => `<path d="${d}"/>`;
const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const F = (d) => `<path d="${d}" fill="currentColor" stroke="none"/>`;
const EF = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`;

/**
 * The marks.
 *
 * `glyph` is what the tile draws; `monogram` is the fallback for any target without art yet, so a
 * newly added app in `targets.mjs` renders something real instead of an empty tile. That fallback
 * is deliberate: this file will always lag the target list by a little, and the gate in
 * `check-targets.mjs` is about names being too similar, not about art existing.
 */
export const MARKS = {
  /* ── Wellness ─────────────────────────────────────────────────────────────────────── */

  /**
   * Breathe — one ring, open at the top, with the breath inside it.
   *
   * The first attempt was three concentric circles with a filled core, and the contact sheet showed
   * exactly what was wrong with it: at 60 px it is a bullseye, which in both stores means a
   * shooting app. What this app actually is, is a circle that opens and closes — so the mark is a
   * ring with a gap, and a wisp rising through the gap. Two forms, no concentric symmetry, and it
   * reads as "air" rather than as a target.
   */
  breathe: {
    glyph:
      `${P('M19.4 5.9A9.2 9.2 0 1 0 19.4 18.2')}` +
      `${P('M12 6.4c1.7 2.1 2.5 3.8 2.5 5.3a2.9 2.9 0 0 1-5.8 0c0-1.5.8-3.2 2.5-5.3z')}`,
  },

  /**
   * Sleep — a filled crescent with one star.
   *
   * The first attempt was an outlined crescent with a horizon line under it, and the contact sheet
   * settled the argument: at 60 px it looked like a hammock, or a boat. A crescent only reads as a
   * moon if it is a *silhouette* — the shape between two circles is unmistakable when filled and
   * ambiguous when outlined — so this is the second of the two filled marks in the set. The star is
   * what says "night sky" rather than "crescent", which alone is a croissant.
   */
  sleep: {
    glyph:
      `${F('M20.4 15.1A9.1 9.1 0 0 1 8.9 3.6a9.1 9.1 0 1 0 11.5 11.5z')}` +
      `${F('M17.4 3.1l.85 2.05 2.05.85-2.05.85-.85 2.05-.85-2.05L14.5 6l2.05-.85z')}`,
  },

  /**
   * Stretch — a seated figure hinged forward.
   *
   * Deliberately not a standing figure: the routine is desk mobility, so the mark shows a body
   * folded over a chair-back line, which is the first movement's actual shape.
   */
  stretch: {
    glyph:
      `${C(14.5, 5.6, 1.9)}` +
      `${P('M14.2 9.4c-2.6.6-4.6 2-5.8 4.1')}` +
      `${P('M14.2 9.4c1.4 1.6 2.2 3.4 2.4 5.4')}` +
      `${P('M8.4 13.5 4 15.4')}` +
      `${P('M16.6 14.8 20 16.6')}` +
      `${P('M3 19.6h18')}`,
  },

  /**
   * Walk — a walking figure on a ground line.
   *
   * A figure mid-stride, limbs open: the whole product is an interval timer for a walk, so the
   * mark is the activity rather than a clock. The ground line is what stops it reading as a
   * generic "person".
   */
  walk: {
    glyph:
      `${C(13.4, 4.6, 2)}` +
      `${P('M13 8.6c-1 1.4-1.4 3-1.2 4.8')}` +
      `${P('M11.8 13.4 7.4 17l-1.6 4')}` +
      `${P('M11.8 13.4c1.6.8 2.8 2 3.6 3.6l.6 4')}` +
      `${P('M9.4 11.4 5.6 9.6')}` +
      `${P('M13.6 10.4l3.8-2.4')}`,
  },

  /**
   * Water — a droplet.
   *
   * The one mark in the set that gets to be filled, because a droplet's silhouette *is* its
   * meaning and an outline droplet at 60 px is a tiny loop. The faceted top is drawn with two
   * curves meeting at a point rather than as a circle with a spike, which is what stops it reading
   * as a map pin.
   */
  water: {
    glyph: F('M12 2.4c3.2 4 6.4 7.7 6.4 11.6a6.4 6.4 0 0 1-12.8 0C5.6 10.1 8.8 6.4 12 2.4z'),
  },

  /**
   * Japa — a mala: beads around a ring with the count marked.
   *
   * Eight beads rather than 108. A mark is not a diagram; the ring plus the gap at the top is the
   * shape a person recognises as a mala, and eight is the most that stays crisp at 60 px.
   */
  japa: {
    glyph:
      `${C(12, 2.9, 1.35)}${C(17.4, 4.4, 1.35)}${C(21.1, 8.4, 1.35)}` +
      `${C(21.1, 13.6, 1.35)}${C(17.4, 17.6, 1.35)}${C(12, 19.1, 1.35)}` +
      `${C(6.6, 17.6, 1.35)}${C(2.9, 13.6, 1.35)}${C(2.9, 8.4, 1.35)}` +
      `${C(6.6, 4.4, 1.35)}${EF(12, 11, 2.1)}`,
  },

  /* ── Documents and images ─────────────────────────────────────────────────────────── */

  /**
   * Passport photo — a portrait crop.
   *
   * A head-and-shoulders in a frame with crop corners: the corner marks are the specific thing,
   * because they say "this is a photo being cropped to a size", which is what the screen does.
   */
  'passport-photo': {
    glyph:
      `${C(12, 9.6, 2.8)}` +
      `${P('M6.8 18.8a5.4 5.4 0 0 1 10.4 0')}` +
      `${P('M3.2 7.6V4.2a1 1 0 0 1 1-1h3.4')}` +
      `${P('M16.4 3.2h3.4a1 1 0 0 1 1 1v3.4')}` +
      `${P('M20.8 16.4v3.4a1 1 0 0 1-1 1h-3.4')}` +
      `${P('M7.6 20.8H4.2a1 1 0 0 1-1-1v-3.4')}`,
  },

  /**
   * PDF toolkit — a page with a folded corner and a rule of lines.
   *
   * The folded corner is the universal "document" signal; the lines are what distinguish it from
   * every other document app, by making it a page with content on it rather than a blank sheet.
   */
  'pdf-tools': {
    glyph: `${P('M6 2.8h7.4L19.4 9v12.2H6z')}${P('M13.4 2.8V9h6')}${P('M9 13.2h6.4')}${P('M9 16.6h4.4')}`,
  },

  /**
   * Room redesign — a floor plan with a piece placed in it.
   *
   * An outline of a room with an L-shaped sofa in the corner: the mark is the *composition*, which
   * is exactly what the product rearranges.
   */
  'room-redesign': {
    glyph: `${P('M3.2 3.6h17.6v16.8H3.2z')}${P('M3.2 15.2h6.2')}${P('M9.4 9.4v12.2')}${P('M12.4 12.6h5.6v3.4h-5.6z')}`,
  },

  /**
   * Subtitles & voice — a waveform in a caption bar.
   *
   * Bars of varying height inside a rounded frame. Symmetric about the middle so it reads as sound
   * rather than as a bar chart, which a lopsided waveform would.
   */
  'subtitles-voice': {
    glyph:
      `${P('M3 6.6h18v10.8H3z')}` +
      `${P('M7 10.2v3.6')}${P('M10 8.6v6.8')}${P('M13 10.6v2.8')}${P('M16 7.8v8.4')}`,
  },

  /**
   * Resume builder — a page with a name rule and an achievement mark.
   *
   * The rule and the bulleted lines are the CV shape; the small check circle is what makes it
   * "built", not just "read".
   */
  'resume-builder': {
    glyph:
      `${P('M5.4 2.8h9L18.6 7v14.2H5.4z')}` +
      `${P('M8.4 11.2h7.2')}${P('M8.4 14.4h4.6')}` +
      `${EF(16.2, 17.6, 3.4)}` +
      `${P('M14.8 17.6l1.1 1.1 2.2-2.4')}`,
  },

  /* ── Commerce and tools ───────────────────────────────────────────────────────────── */

  /**
   * Shop toolkit — an awning over a counter.
   *
   * A shopfront: a scalloped awning is unmistakably retail and survives being 12 px tall, which a
   * bag or a tag does not (both become a rounded blob).
   */
  'shop-toolkit': {
    glyph:
      `${P('M3 4.6h18l-1.2 4.2H4.2z')}` +
      `${P('M4.6 8.8h14.8v11.6H4.6z')}` +
      `${P('M9.4 12.6h5.2v7.8H9.4z')}`,
  },

  /**
   * Toolbox — a case with a handle and a latch.
   *
   * The handle arc is the whole icon: a plain rectangle is a box, and the arc above it is what
   * makes it a toolbox.
   */
  toolbox: {
    glyph: `${P('M3.4 8.6h17.2v11.8H3.4z')}${P('M3.4 13.4h17.2')}${P('M9.4 6.2a2.6 2.6 0 0 1 5.2 0v2.4')}${P('M11 12v3')}`,
  },

  /**
   * Sarkar Health — a cross inside a rounded square.
   *
   * The counter-intuitive choice: a heart is the obvious mark and is used by every health app in
   * both stores, so a cross in a frame is the one that identifies *this* listing.
   */
  sarkarhealth: {
    glyph: `${P('M4.4 4.4h15.2v15.2H4.4z')}${P('M12 8v8')}${P('M8 12h8')}`,
  },

  /**
   * Sarkar Marketplace — a basket.
   *
   * A basket rather than a bag because the sibling listings include a shop toolkit, and two
   * adjacent apps must not both be a bag. The handle arc keeps it from reading as a bin.
   */
  sarkarmarketplace: {
    glyph: `${P('M3.2 9.4h17.6l-1.8 11H5z')}${P('M8.2 9.4 12 4.2l3.8 5.2')}${P('M8.6 13v3.6')}${P('M15.4 13v3.6')}`,
  },

  /**
   * Sarkar Cars — a car in profile.
   *
   * The first version had a flat, high roofline and read as a van on the contact sheet. This one is
   * lower and longer with a shorter cabin and a rising window line, which is what makes a car a car
   * in a silhouette: the ratio of bonnet to cabin, not the details.
   */
  sarkarcars: {
    glyph:
      `${P('M2.6 15.2v-2.6l1.9-3.9A1.7 1.7 0 0 1 6 7.6h3.4l1.6-1.8h3.6a1.8 1.8 0 0 1 1.3.6l2.5 3.2 3.2.9a1.6 1.6 0 0 1 1.2 1.6v3.1')}` +
      `${P('M9.4 7.6v3.1h4.6')}` +
      `${EF(7, 15.4, 2.2)}${EF(17, 15.4, 2.2)}` +
      `${P('M9.2 15.4h5.6')}`,
  },

  /* ── Games ───────────────────────────────────────────────────────────────────────── */

  /**
   * Tap Sprint — a bolt with speed lines.
   *
   * A filled bolt (the one filled mark in the games set, because a bolt is a silhouette) with two
   * trailing lines: speed without needing to say "tap".
   */
  'tap-sprint': {
    glyph: `${F('M13.6 2.6 6 13.4h4.6L10.4 21.4 18 10.6h-4.6z')}${P('M3.6 8.4h3')}${P('M2.6 12.4h2.4')}`,
  },

  /**
   * Word Duel — two speech bubbles facing each other.
   *
   * A duel of words: two bubbles opposed, one with a tail. Not two, because a single bubble reads
   * as a chat app and this is not one.
   */
  'word-duel': {
    glyph:
      `${P('M3 4.4h11.4v7.2H7.6L3 14.6z')}` +
      `${P('M13.6 10.4h7.4v6.4h-3.2L14.6 20v-3.2h-1z')}`,
  },

  /**
   * Block Clear — a three-by-three grid with one cell cleared out of it.
   *
   * The gap is the icon: a full grid is a spreadsheet, and a grid missing a cell is a puzzle.
   */
  'block-clear': {
    glyph:
      `${P('M3.4 3.4h6v6h-6z')}${P('M14.6 3.4h6v6h-6z')}` +
      `${P('M3.4 14.6h6v6h-6z')}${P('M14.6 14.6h6v6h-6z')}`,
  },

  /**
   * Merge Tiles — two rounded squares overlapping into one.
   *
   * Two tiles and a shared edge, with the join in the accent: the product is sliding equal tiles
   * together, and an overlap is the only way to draw that in one colour.
   */
  'merge-tiles': {
    glyph: `${P('M3.6 3.6h9.8v9.8H3.6z')}${P('M10.6 10.6h9.8v9.8h-9.8z')}${F('M10.6 10.6h2.8v2.8h-2.8z')}`,
  },
};

/**
 * The tile: a generated background with the target's mark on it.
 *
 * @param id     Target id, keyed into `MARKS`.
 * @param color  The app's accent, from `targets.mjs` — the one place its colour is decided.
 * @param size   Output edge in px.
 * @param opts.glyphOnly  Draw only the mark, transparent. For the Android adaptive foreground and
 *                        the splash icon, where the launcher or the splash background is the tile.
 * @param opts.inset      How much of the tile the mark occupies. The adaptive icon must be smaller
 *                        than the iOS one because the launcher crops it further.
 */
export function TILE_SVG(color, size, opts = {}) {
  const mark = MARKS[opts.id];
  const top = lighten(color, 0.26);
  const bottom = darken(color, 0.18);
  const rim = lighten(color, 0.55);
  // A soft radial lift behind the mark. `radialGradient` on a centred circle, which is the only
  // depth a flat tile can carry without becoming a gradient soup.
  const glow = `<radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.24"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>`;

  const background = opts.glyphOnly
    ? ''
    : `<rect width="${size}" height="${size}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" fill="url(#glow)"/>
  <rect x="${size * 0.006}" y="${size * 0.006}" width="${size * 0.988}" height="${size * 0.988}"
        rx="${size * 0.02}" fill="none" stroke="${rim}" stroke-opacity="0.35" stroke-width="${size * 0.006}"/>`;

  const body = renderGlyph(mark, color, size, opts);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
    </linearGradient>
    ${glow}
  </defs>
  ${background}
  ${body}
</svg>`;
}

/** The mark itself, scaled into the tile. Shared by the tile and the preview sheet. */
export function renderGlyph(mark, color, size, opts = {}) {
  const ink = opts.glyphOnly ? color : '#ffffff';
  // 0.52 of the tile for a normal icon, 0.44 for the adaptive foreground: the launcher may crop
  // the outer 34% of an adaptive icon, and a mark that filled the tile would lose its edges.
  const span = size * (opts.glyphOnly ? (opts.inset ?? 0.44) : 0.52);
  const offset = (size - span) / 2;
  // The mark grid is 24 wide, so the stroke is scaled with it. 1.7 on the grid is the same weight
  // the in-app icon set uses at 20 px, which keeps the app and its icon looking like one thing.
  const stroke = (1.7 * span) / 24;

  if (!mark) {
    // The fallback: a monogram, for a target added to `targets.mjs` before its art exists.
    const text = (opts.monogram ?? '?').slice(0, 3);
    return `<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central"
        font-family="Helvetica, Arial, sans-serif" font-weight="800"
        font-size="${span * 0.62}" fill="${ink}"
        letter-spacing="${text.length > 2 ? -span * 0.03 : 0}">${text}</text>`;
  }

  return `<g transform="translate(${offset} ${offset}) scale(${span / 24})"
     fill="none" stroke="${ink}" stroke-width="${stroke / (span / 24)}"
     stroke-linecap="round" stroke-linejoin="round"
     style="color:${ink}">${mark.glyph}</g>`;
}

/**
 * The mark alone, for the preview sheet and for anything that wants the symbol without a tile.
 *
 * `id` may be empty, in which case the caller is asking for a specific target's mark by position —
 * which the preview sheet does not do; it passes the real id through `TILE_SVG`. Kept because the
 * adaptive icon and the splash icon both want exactly this and nothing else.
 */
export function MARK_SVG(id, color, size, inset) {
  return TILE_SVG(color, size, { id, glyphOnly: true, inset });
}

/** Every id this file can draw. Used by the generator's coverage check. */
export const MARK_IDS = Object.keys(MARKS);
