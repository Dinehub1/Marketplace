#!/usr/bin/env node
/**
 * make-store-graphics.mjs — creates Google Play Feature Graphics and App Store Promo Banners.
 *
 * For each of the seventeen apps in the fleet:
 * 1. feature-graphic.png (1024×500): The official Google Play Store Feature Graphic.
 *    - Exact 1024×500 dimensions, opaque RGB.
 *    - Deep brand gradient, ambient lighting glow, app icon badge, crisp title, tagline,
 *      and category pill.
 * 2. promo-banner.png (1080×1920): High-resolution store screenshot hero promotional card.
 *    - Phone-scale showcase slide with headline, value prop, and device frame aesthetic.
 *
 * Usage: node scripts/make-store-graphics.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE = path.join(REPO, 'apps', 'mobile');
const OUT_ROOT = path.join(MOBILE, 'assets', 'targets');

const { TARGETS } = await import(pathToFileURL(path.join(MOBILE, 'targets.mjs')).href);
const { lighten, darken, TILE_SVG } = await import(
  pathToFileURL(path.join(REPO, 'scripts', 'lib', 'icon-art.mjs')).href
);

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds an SVG string for Google Play Store Feature Graphic (1024×500).
 */
function FEATURE_GRAPHIC_SVG(target) {
  const primary = target.color;
  const top = lighten(primary, 0.22);
  const bottom = darken(primary, 0.45);
  const accentLight = lighten(primary, 0.45);

  const name = escapeXml(target.name);
  const tagline = escapeXml(target.tagline);
  const category = escapeXml(target.storeCategory?.toUpperCase() || 'MOBILE APP');
  const asoTag = escapeXml(target.aso && target.aso[0] ? `#${target.aso[0].replace(/\s+/g, '')}` : '');

  // Embedded app tile icon (140×140)
  const iconTile = TILE_SVG(primary, 140, { id: target.id });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${top}"/>
      <stop offset="55%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="mesh" cx="25%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="meshRight" cx="85%" cy="60%" r="50%">
      <stop offset="0%" stop-color="${accentLight}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${bottom}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
    <clipPath id="tileClip">
      <rect width="140" height="140" rx="30"/>
    </clipPath>
  </defs>

  <!-- Background Canvas -->
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#mesh)"/>
  <rect width="1024" height="500" fill="url(#meshRight)"/>

  <!-- Subtle Decorative Geometric Elements -->
  <circle cx="880" cy="120" r="180" fill="none" stroke="${accentLight}" stroke-width="1.5" stroke-opacity="0.25"/>
  <circle cx="880" cy="120" r="260" fill="none" stroke="${accentLight}" stroke-width="1.5" stroke-opacity="0.15" stroke-dasharray="8 12"/>
  <circle cx="150" cy="460" r="140" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.12"/>

  <!-- Left Content Column -->
  <g transform="translate(80, 100)">
    <!-- Category Pill -->
    <rect x="0" y="0" width="130" height="32" rx="16" fill="#ffffff" fill-opacity="0.2"/>
    <rect x="0" y="0" width="130" height="32" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.4" stroke-width="1"/>
    <text x="65" y="21" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2" text-anchor="middle">${category}</text>

    <!-- App Title -->
    <text x="0" y="90" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" letter-spacing="-0.8">
      ${name}
    </text>

    <!-- Tagline -->
    <text x="0" y="140" fill="#ffffff" fill-opacity="0.9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400">
      ${tagline}
    </text>

    <!-- Keyword Pill / Badge -->
    ${asoTag ? `
    <g transform="translate(0, 185)">
      <rect x="0" y="0" width="180" height="36" rx="18" fill="#000000" fill-opacity="0.25"/>
      <text x="90" y="23" fill="${accentLight}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" text-anchor="middle">${asoTag}</text>
    </g>` : ''}
  </g>

  <!-- Right Side App Showcase Card with Icon -->
  <g transform="translate(730, 120)" filter="url(#shadow)">
    <!-- Frosted Glass Plate -->
    <rect x="-40" y="-30" width="220" height="310" rx="36" fill="#0f172a" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.5"/>
    
    <!-- Rendered App Icon Tile -->
    <g transform="translate(0, 20)" clip-path="url(#tileClip)">
      ${iconTile}
    </g>

    <!-- Minimalist Preview Screen Lines inside phone plate -->
    <g transform="translate(0, 190)">
      <rect x="-10" y="0" width="160" height="14" rx="7" fill="#ffffff" fill-opacity="0.7"/>
      <rect x="-10" y="24" width="110" height="10" rx="5" fill="#ffffff" fill-opacity="0.4"/>
      <rect x="-10" y="44" width="80" height="8" rx="4" fill="${accentLight}" fill-opacity="0.8"/>
    </g>
  </g>
</svg>`;
}

/**
 * Builds an SVG string for Store Promotional Showcase Poster (1080×1920).
 */
function PROMO_POSTER_SVG(target) {
  const primary = target.color;
  const top = lighten(primary, 0.28);
  const bottom = darken(primary, 0.52);
  const accentLight = lighten(primary, 0.45);

  const name = escapeXml(target.name);
  const tagline = escapeXml(target.tagline);
  const category = escapeXml(target.storeCategory?.toUpperCase() || 'APPLICATION');

  // Large app tile icon (220×220)
  const iconTile = TILE_SVG(primary, 220, { id: target.id });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="pbg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${top}"/>
      <stop offset="40%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${bottom}"/>
    </linearGradient>
    <radialGradient id="pglow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="pdrop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <clipPath id="pTileClip">
      <rect width="220" height="220" rx="48"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1920" fill="url(#pbg)"/>
  <rect width="1080" height="1920" fill="url(#pglow)"/>

  <!-- Subtle Backdrop Waves -->
  <circle cx="540" cy="1100" r="480" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="2"/>
  <circle cx="540" cy="1100" r="620" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2" stroke-dasharray="14 18"/>

  <!-- Top Brand Header -->
  <g transform="translate(100, 160)">
    <!-- Category Tag -->
    <rect x="0" y="0" width="160" height="42" rx="21" fill="#ffffff" fill-opacity="0.18"/>
    <text x="80" y="27" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" letter-spacing="1.5" text-anchor="middle">${category}</text>

    <!-- Big Headline -->
    <text x="0" y="130" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" letter-spacing="-1.2">
      ${name}
    </text>

    <!-- Subtitle / Tagline -->
    <text x="0" y="200" fill="#ffffff" fill-opacity="0.88" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="400">
      ${tagline}
    </text>
  </g>

  <!-- Central Device Mockup Container -->
  <g transform="translate(240, 520)" filter="url(#pdrop)">
    <!-- Phone Bezel / Glass Slab -->
    <rect x="0" y="0" width="600" height="1180" rx="58" fill="#0b0f19" stroke="#ffffff" stroke-opacity="0.25" stroke-width="3"/>
    
    <!-- Phone Screen Surface -->
    <rect x="18" y="18" width="564" height="1144" rx="44" fill="#131927"/>
    
    <!-- Dynamic Island / Speaker Notch -->
    <rect x="230" y="32" width="140" height="28" rx="14" fill="#000000"/>

    <!-- App Hero Header inside mockup -->
    <g transform="translate(190, 180)" clip-path="url(#pTileClip)">
      ${iconTile}
    </g>

    <text x="300" y="460" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="800" text-anchor="middle">
      ${name}
    </text>

    <text x="300" y="505" fill="${accentLight}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" text-anchor="middle">
      Instant Launch • No Setup
    </text>

    <!-- Functional Mockup Cards -->
    <g transform="translate(50, 560)">
      <rect x="0" y="0" width="500" height="100" rx="20" fill="#1e293b" fill-opacity="0.8"/>
      <circle cx="50" cy="50" r="22" fill="${primary}"/>
      <rect x="90" y="32" width="240" height="14" rx="7" fill="#ffffff" fill-opacity="0.9"/>
      <rect x="90" y="56" width="160" height="10" rx="5" fill="#ffffff" fill-opacity="0.4"/>

      <rect x="0" y="124" width="500" height="100" rx="20" fill="#1e293b" fill-opacity="0.8"/>
      <circle cx="50" cy="174" r="22" fill="${accentLight}"/>
      <rect x="90" y="156" width="280" height="14" rx="7" fill="#ffffff" fill-opacity="0.9"/>
      <rect x="90" y="180" width="180" height="10" rx="5" fill="#ffffff" fill-opacity="0.4"/>

      <rect x="0" y="248" width="500" height="100" rx="20" fill="#1e293b" fill-opacity="0.8"/>
      <circle cx="50" cy="298" r="22" fill="${top}"/>
      <rect x="90" y="280" width="210" height="14" rx="7" fill="#ffffff" fill-opacity="0.9"/>
      <rect x="90" y="304" width="140" height="10" rx="5" fill="#ffffff" fill-opacity="0.4"/>
    </g>

    <!-- Bottom Action Pill inside mockup -->
    <rect x="100" y="1010" width="400" height="64" rx="32" fill="${primary}"/>
    <text x="300" y="1050" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" text-anchor="middle">
      Open Experience
    </text>
  </g>
</svg>`;
}

console.log(`Generating store feature graphics and promo posters for ${TARGETS.length} apps...`);

let count = 0;
for (const target of TARGETS) {
  const dir = path.join(OUT_ROOT, target.id);
  fs.mkdirSync(dir, { recursive: true });

  // 1. Google Play Feature Graphic (1024×500)
  const fgSvg = FEATURE_GRAPHIC_SVG(target);
  await sharp(Buffer.from(fgSvg))
    .flatten({ background: target.color })
    .png()
    .toFile(path.join(dir, 'feature-graphic.png'));

  // 2. High-res Promo Poster (1080×1920)
  const promoSvg = PROMO_POSTER_SVG(target);
  await sharp(Buffer.from(promoSvg))
    .flatten({ background: target.color })
    .png()
    .toFile(path.join(dir, 'promo-banner.png'));

  count++;
}

console.log(`✓ Successfully generated 1024×500 feature graphics and 1080×1920 promo posters for all ${count} targets in apps/mobile/assets/targets/!`);
