/**
 * icon-logos.mjs — full-colour store logos, the successor to the monoline marks in icon-art.mjs.
 *
 * A mark in icon-art.mjs is one white line drawing on a generated tile. A logo here is a layered,
 * filled illustration (white forms, tints of the app's accent, one warm highlight) that reads as a
 * designed product icon rather than a glyph from an icon font. `make-app-icons.mjs` prefers a logo
 * when a target has one and falls back to the mark, then the monogram, when it does not.
 *
 * Every logo is authored on a 1024 grid and keeps its forms inside roughly 190–870, so the launcher's
 * squircle or circle crop never reaches them. `art(c)` draws the logo without its background, which
 * is what the Android adaptive foreground needs; the tile adds the gradient ground behind it.
 *
 * SVG ids are prefixed with the target id so that the preview sheet, which nests every icon in one
 * document, does not resolve one app's `url(#bg)` to another app's gradient.
 */
import { lighten as lightenBy, darken as darkenBy } from './icon-art.mjs';

const L = lightenBy;
const D = darkenBy;

export const LOGOS = {
  wellness: {
    // A lotus opening under a rising sun: the daily-practice app's calm, morning ritual.
    defs: () => `<radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#fbbf24"/></radialGradient>
<linearGradient id="petal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cffafe"/></linearGradient>`,
    art: (c) => `<!-- soft ripples -->
  <ellipse cx="512" cy="742" rx="330" ry="54" fill="#ffffff" opacity="0.12"/>
  <ellipse cx="512" cy="742" rx="230" ry="34" fill="#ffffff" opacity="0.14"/>
  <!-- rising sun -->
  <circle cx="512" cy="300" r="92" fill="url(#sun)"/>
  <!-- back petals -->
  <path d="M512 706 C 380 700 250 610 218 470 C 340 452 452 520 512 706 Z" fill="#a5f3fc" opacity="0.9"/>
  <path d="M512 706 C 644 700 774 610 806 470 C 684 452 572 520 512 706 Z" fill="#a5f3fc" opacity="0.9"/>
  <!-- side petals -->
  <path d="M512 712 C 400 660 330 540 352 400 C 450 440 520 560 512 712 Z" fill="#e0fbff"/>
  <path d="M512 712 C 624 660 694 540 672 400 C 574 440 504 560 512 712 Z" fill="#e0fbff"/>
  <!-- centre petal -->
  <path d="M512 718 C 430 640 410 520 512 404 C 614 520 594 640 512 718 Z" fill="url(#petal)"/>
  <path d="M512 470 C 488 540 488 620 512 690 C 536 620 536 540 512 470 Z" fill="${c}" opacity="0.18"/>`,
  },
  'passport-photo': {
    // An ID photo inside camera crop corners, with a gold "accepted" check.
    art: (c) => `<g filter="url(#sh)"><rect x="292" y="232" width="440" height="560" rx="44" fill="#fff"/></g>
<rect x="332" y="272" width="360" height="400" rx="24" fill="${L(c,.85)}"/>
<circle cx="512" cy="420" r="92" fill="${c}"/>
<path d="M352 672 C 360 560 430 520 512 520 C 594 520 664 560 672 672 Z" fill="${c}"/>
<rect x="352" y="704" width="200" height="28" rx="14" fill="${L(c,.7)}"/>
<g fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" opacity=".9">
<path d="M210 290 V210 H290"/><path d="M814 290 V210 H734"/><path d="M210 734 V814 H290"/><path d="M814 734 V814 H734"/></g>
<circle cx="716" cy="740" r="78" fill="url(#gold)" stroke="#fff" stroke-width="14"/>
<path d="M680 742 l26 26 l48 -52" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'pdf-tools': {
    // Stacked pages with a folded corner, a signature and a pen: merge, split and sign.
    art: (c) => `<g transform="rotate(-10 512 512)"><rect x="250" y="250" width="400" height="510" rx="36" fill="${L(c,.6)}"/></g>
<g filter="url(#sh)"><path d="M372 220 H620 L760 360 V772 a36 36 0 0 1 -36 36 H372 a36 36 0 0 1 -36 -36 V256 a36 36 0 0 1 36 -36 Z" fill="#fff"/></g>
<path d="M620 220 V324 a36 36 0 0 0 36 36 H760 Z" fill="${L(c,.75)}"/>
<rect x="400" y="300" width="160" height="26" rx="13" fill="${L(c,.8)}"/>
<rect x="400" y="400" width="296" height="26" rx="13" fill="${L(c,.8)}"/>
<rect x="400" y="460" width="296" height="26" rx="13" fill="${L(c,.8)}"/>
<rect x="400" y="520" width="200" height="26" rx="13" fill="${L(c,.8)}"/>
<path d="M404 690 c30 -70 56 -80 62 -40 c6 40 -24 70 -10 72 c20 4 40 -70 64 -64 c18 4 4 54 24 54 c18 0 30 -30 52 -30 c20 0 30 18 96 10" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(40 760 600)"><rect x="738" y="420" width="44" height="220" rx="12" fill="url(#gold)" stroke="#fff" stroke-width="8"/><path d="M738 640 L760 690 L782 640 Z" fill="#fff"/></g>`,
  },
  'room-redesign': {
    // A sofa before an arched window, with gold sparkles for the AI restyle.
    art: (c) => `<path d="M372 600 V380 a140 140 0 0 1 280 0 V600 Z" fill="${L(c,.25)}" opacity=".7"/>
<path d="M512 240 V600 M372 430 H652" stroke="${L(c,.45)}" stroke-width="12"/>
<g filter="url(#sh)">
<rect x="250" y="560" width="524" height="150" rx="40" fill="#fff"/>
<rect x="300" y="480" width="424" height="140" rx="44" fill="#fff"/>
<rect x="196" y="540" width="120" height="210" rx="56" fill="#fff"/>
<rect x="708" y="540" width="120" height="210" rx="56" fill="#fff"/></g>
<path d="M512 500 V640" stroke="${L(c,.8)}" stroke-width="12" stroke-linecap="round"/>
<rect x="250" y="750" width="30" height="50" rx="10" fill="${L(c,.85)}"/><rect x="744" y="750" width="30" height="50" rx="10" fill="${L(c,.85)}"/>
<path d="M700 220 l22 58 l58 22 l-58 22 l-22 58 l-22 -58 l-58 -22 l58 -22 Z" fill="url(#gold)"/>
<path d="M820 360 l12 30 l30 12 l-30 12 l-12 30 l-12 -30 l-30 -12 l30 -12 Z" fill="#fde68a"/>
<path d="M280 260 l10 26 l26 10 l-26 10 l-10 26 l-10 -26 l-26 -10 l26 -10 Z" fill="#fff" opacity=".85"/>`,
  },
  'subtitles-voice': {
    // A video frame with caption bars, a speech tail and a gold voice waveform.
    art: (c) => `<g filter="url(#sh)"><rect x="196" y="230" width="560" height="420" rx="52" fill="#fff"/></g>
<path d="M430 320 L560 400 L430 480 Z" fill="${c}" stroke="${c}" stroke-width="24" stroke-linejoin="round"/>
<rect x="250" y="540" width="300" height="40" rx="20" fill="${L(c,.3)}"/>
<rect x="570" y="540" width="132" height="40" rx="20" fill="#f59e0b"/>
<path d="M330 650 L310 750 L420 650 Z" fill="#fff"/>
<g stroke-width="30" stroke-linecap="round">
<path d="M640 720 V780" stroke="#fbbf24"/><path d="M696 690 V810" stroke="#fde68a"/><path d="M752 660 V840" stroke="#fbbf24"/><path d="M808 700 V800" stroke="#fde68a"/></g>`,
  },
  'resume-builder': {
    // A resume with a profile photo and a green check for passing ATS screening.
    art: (c) => `<g filter="url(#sh)"><rect x="276" y="196" width="440" height="600" rx="44" fill="#fff"/></g>
<circle cx="384" cy="320" r="62" fill="${L(c,.75)}"/>
<circle cx="384" cy="304" r="26" fill="${c}"/><path d="M340 362 a44 40 0 0 1 88 0 Z" fill="${c}"/>
<rect x="468" y="284" width="200" height="30" rx="15" fill="${c}"/>
<rect x="468" y="334" width="140" height="24" rx="12" fill="${L(c,.7)}"/>
<rect x="326" y="430" width="340" height="24" rx="12" fill="${L(c,.8)}"/>
<rect x="326" y="484" width="340" height="24" rx="12" fill="${L(c,.8)}"/>
<rect x="326" y="538" width="250" height="24" rx="12" fill="${L(c,.8)}"/>
<rect x="326" y="620" width="300" height="24" rx="12" fill="${L(c,.8)}"/>
<rect x="326" y="674" width="200" height="24" rx="12" fill="${L(c,.8)}"/>
<circle cx="716" cy="744" r="104" fill="#22c55e" stroke="#fff" stroke-width="18"/>
<path d="M664 746 l36 36 l68 -72" fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'shop-toolkit': {
    // A GST bill with a torn edge and a UPI QR code, and a gold coin for the payment.
    art: (c) => `<g filter="url(#sh)"><path d="M300 196 H724 a28 28 0 0 1 28 28 V800 l-53 -36 l-53 36 l-53 -36 l-53 36 l-53 -36 l-53 36 l-53 -36 l-53 36 V224 a28 28 0 0 1 28 -28 Z" fill="#fff"/></g>
<rect x="332" y="248" width="180" height="30" rx="15" fill="${c}"/>
<rect x="332" y="314" width="360" height="22" rx="11" fill="${L(c, 0.8)}"/>
<rect x="332" y="362" width="300" height="22" rx="11" fill="${L(c, 0.8)}"/>
<rect x="332" y="410" width="340" height="22" rx="11" fill="${L(c, 0.8)}"/>
<rect x="332" y="480" width="200" height="200" rx="18" fill="${L(c, 0.88)}"/>
<g fill="${c}"><rect x="350" y="498" width="60" height="60" rx="10"/><rect x="454" y="498" width="60" height="60" rx="10"/><rect x="350" y="602" width="60" height="60" rx="10"/>
<rect x="428" y="576" width="26" height="26" rx="5"/><rect x="470" y="610" width="26" height="26" rx="5"/><rect x="488" y="570" width="26" height="26" rx="5"/><rect x="430" y="636" width="26" height="26" rx="5"/></g>
<g fill="${L(c, 0.88)}"><rect x="368" y="516" width="24" height="24" rx="4"/><rect x="472" y="516" width="24" height="24" rx="4"/><rect x="368" y="620" width="24" height="24" rx="4"/></g>
<circle cx="740" cy="700" r="110" fill="url(#gold)" stroke="#fff" stroke-width="16"/>
<circle cx="740" cy="700" r="70" fill="none" stroke="#fff" stroke-width="12" opacity=".7"/>
<path d="M712 660 H770 M712 690 H770 M722 660 c50 0 50 60 0 60 l46 46" fill="none" stroke="#b45309" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  toolbox: {
    // A toolbox with a photo lifting out of it: everyday tools and photo fixes in one kit.
    art: (c) => `<path d="M420 470 V420 a40 40 0 0 1 40 -40 H564 a40 40 0 0 1 40 40 V470" fill="none" stroke="#fff" stroke-width="30"/>
<g transform="rotate(-8 512 400)" filter="url(#sh)"><rect x="352" y="196" width="320" height="270" rx="26" fill="#fff"/>
<rect x="378" y="222" width="268" height="180" rx="14" fill="${L(c, 0.75)}"/>
<path d="M378 402 L470 300 L540 370 L580 332 L646 402 Z" fill="${c}"/><circle cx="600" cy="268" r="26" fill="url(#gold)"/></g>
<g filter="url(#sh)"><rect x="210" y="460" width="604" height="340" rx="48" fill="#fff"/></g>
<rect x="210" y="580" width="604" height="30" fill="${L(c, 0.8)}"/>
<rect x="452" y="550" width="120" height="90" rx="20" fill="url(#gold)" stroke="#fff" stroke-width="10"/>`,
  },
  swasthpath: {
    // A map pin carrying a medical cross: find a doctor near you in Indore.
    art: (c) => `<ellipse cx="512" cy="808" rx="150" ry="36" fill="${D(c, 0.5)}" opacity=".35"/>
<ellipse cx="512" cy="808" rx="96" ry="22" fill="url(#gold)"/>
<g filter="url(#sh)"><path d="M512 800 C 430 690 276 560 276 420 a236 236 0 0 1 472 0 C 748 560 594 690 512 800 Z" fill="#fff"/></g>
<circle cx="512" cy="420" r="160" fill="${L(c, 0.85)}"/>
<path d="M472 316 h80 v64 h64 v80 h-64 v64 h-80 v-64 h-64 v-80 h64 Z" fill="${c}" stroke="${c}" stroke-width="20" stroke-linejoin="round"/>`,
  },
  sheharbazaar: {
    // A shopfront with a striped awning and a phone badge: every local business, with its number.
    art: (c) => `<g filter="url(#sh)"><rect x="236" y="400" width="552" height="400" rx="28" fill="#fff"/></g>
<rect x="290" y="480" width="190" height="150" rx="18" fill="${L(c, 0.8)}"/>
<rect x="540" y="480" width="190" height="320" rx="18" fill="${c}"/>
<circle cx="574" cy="650" r="14" fill="url(#gold)"/>
<path d="M260 230 H764 L820 400 H204 Z" fill="#fff"/>
<path d="M330 230 H414 L428 400 H302 Z M498 230 H582 L582 400 H442 Z" fill="url(#gold)"/>
<path d="M498 230 H582 L596 400 H512 Z M666 230 H750 L806 400 H694 Z" fill="url(#gold)"/>
<path d="M204 400 a52 52 0 0 0 104 0 a52 52 0 0 0 104 0 a52 52 0 0 0 104 0 a52 52 0 0 0 104 0 a52 52 0 0 0 104 0 a52 52 0 0 0 104 0 Z" fill="#fff"/>
<circle cx="380" cy="740" r="96" fill="#22c55e" stroke="#fff" stroke-width="16"/>
<path d="M342 704 c0 50 30 84 80 84 l12 -28 l-32 -16 l-14 16 c-14 -6 -26 -20 -30 -32 l16 -14 l-14 -32 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>`,
  },
  gaadighar: {
    // A car with a gold spanner badge: dealers, garages, denting and cleaning.
    art: (c) => `<ellipse cx="500" cy="720" rx="300" ry="30" fill="${D(c, 0.5)}" opacity=".35"/>
<g filter="url(#sh)"><path d="M200 640 V560 c0 -40 30 -60 70 -66 l70 -10 l70 -96 c16 -22 40 -32 66 -32 H620 c26 0 46 10 62 30 l78 98 l56 10 c34 6 58 32 58 66 V640 a30 30 0 0 1 -30 30 H230 a30 30 0 0 1 -30 -30 Z" fill="#fff"/></g>
<path d="M386 484 l48 -66 c8 -10 20 -16 32 -16 H500 V484 Z" fill="${L(c, 0.7)}"/>
<path d="M540 484 V402 H612 c14 0 26 6 34 16 l52 66 Z" fill="${L(c, 0.7)}"/>
<rect x="210" y="560" width="70" height="30" rx="15" fill="url(#gold)"/>
<rect x="786" y="560" width="70" height="30" rx="15" fill="${L(c, 0.6)}"/>
<circle cx="340" cy="670" r="72" fill="${D(c, 0.55)}" stroke="#fff" stroke-width="18"/><circle cx="340" cy="670" r="26" fill="url(#gold)"/>
<circle cx="700" cy="670" r="72" fill="${D(c, 0.55)}" stroke="#fff" stroke-width="18"/><circle cx="700" cy="670" r="26" fill="url(#gold)"/>
<circle cx="760" cy="290" r="96" fill="url(#gold)" stroke="#fff" stroke-width="16"/>
<g transform="rotate(45 760 290)"><rect x="740" y="270" width="40" height="110" rx="20" fill="#fff"/><circle cx="760" cy="250" r="50" fill="#fff"/><rect x="742" y="192" width="36" height="58" rx="6" fill="#f59e0b"/></g>`,
  },
  'tap-sprint': {
    // A stopwatch with a lightning bolt and speed lines: thirty seconds, as fast as you can tap.
    art: (c) => `<g stroke="#fff" stroke-width="26" stroke-linecap="round" opacity=".55"><path d="M170 470 H280"/><path d="M200 560 H300"/><path d="M170 650 H270"/></g>
<rect x="472" y="180" width="80" height="70" rx="20" fill="#fff"/>
<rect x="700" y="250" width="70" height="56" rx="18" fill="#fff" transform="rotate(40 735 278)"/>
<g filter="url(#sh)"><circle cx="530" cy="540" r="270" fill="#fff"/></g>
<circle cx="530" cy="540" r="210" fill="${L(c, 0.86)}"/>
<path d="M560 340 L420 580 H520 L490 740 L650 480 H550 Z" fill="url(#gold)" stroke="#f59e0b" stroke-width="14" stroke-linejoin="round"/>`,
  },
  'word-duel': {
    // Two letter tiles squaring off, with a spark between them: a sixty-second word battle.
    art: (c) => `<g transform="rotate(-12 360 520)" filter="url(#sh)"><rect x="210" y="370" width="300" height="300" rx="48" fill="#fff"/>
<path d="M290 610 L360 430 L430 610 M314 550 H406" fill="none" stroke="${c}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></g>
<g transform="rotate(12 664 520)" filter="url(#sh)"><rect x="514" y="370" width="300" height="300" rx="48" fill="url(#gold)"/>
<path d="M604 440 H724 L604 600 H724" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></g>
<path d="M512 210 l20 56 l56 20 l-56 20 l-20 56 l-20 -56 l-56 -20 l56 -20 Z" fill="#fff"/>
<rect x="290" y="760" width="444" height="34" rx="17" fill="#fff" opacity=".35"/><rect x="290" y="760" width="280" height="34" rx="17" fill="#fff"/>`,
  },
  'block-clear': {
    // A stack of blocks with its full row lighting up gold as it clears.
    art: (c) => `<g filter="url(#sh)">
<rect x="236" y="236" width="128" height="128" rx="26" fill="#fff"/><rect x="380" y="236" width="128" height="128" rx="26" fill="#fff"/><rect x="380" y="380" width="128" height="128" rx="26" fill="#fff"/>
<rect x="660" y="236" width="128" height="128" rx="26" fill="${L(c, 0.6)}"/><rect x="660" y="380" width="128" height="128" rx="26" fill="${L(c, 0.6)}"/><rect x="516" y="380" width="128" height="128" rx="26" fill="${L(c, 0.6)}"/>
<rect x="236" y="524" width="128" height="128" rx="26" fill="url(#gold)"/><rect x="380" y="524" width="128" height="128" rx="26" fill="url(#gold)"/><rect x="516" y="524" width="128" height="128" rx="26" fill="url(#gold)"/><rect x="660" y="524" width="128" height="128" rx="26" fill="url(#gold)"/>
<rect x="236" y="668" width="128" height="128" rx="26" fill="#fff"/><rect x="516" y="668" width="128" height="128" rx="26" fill="#fff"/><rect x="660" y="668" width="128" height="128" rx="26" fill="#fff"/></g>
<rect x="200" y="578" width="624" height="20" rx="10" fill="#fff" opacity=".9"/>
<path d="M850 520 l12 32 l32 12 l-32 12 l-12 32 l-12 -32 l-32 -12 l32 -12 Z M170 660 l9 24 l24 9 l-24 9 l-9 24 l-9 -24 l-24 -9 l24 -9 Z" fill="#fff"/>`,
  },
  'merge-tiles': {
    // Two 2-tiles sliding together into a gold 4: slide, merge, double.
    art: (c) => `<g filter="url(#sh)"><rect x="196" y="250" width="220" height="220" rx="44" fill="#fff"/><rect x="196" y="554" width="220" height="220" rx="44" fill="#fff"/></g>
<g fill="none" stroke="${c}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
<path d="M264 326 a42 40 0 1 1 72 28 L262 416 H350"/><path d="M264 630 a42 40 0 1 1 72 28 L262 720 H350"/></g>
<path d="M450 400 Q 520 512 450 624" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round" opacity=".6"/>
<path d="M470 512 H560 m-40 -40 l44 40 l-44 40" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
<g filter="url(#sh)"><rect x="590" y="352" width="320" height="320" rx="60" fill="url(#gold)" stroke="#fff" stroke-width="14"/></g>
<path d="M790 604 V420 L670 560 H830" fill="none" stroke="#fff" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  arcade: {
    // A retro arcade joystick with two buttons and a gold ball top.
    art: (c) => `<rect x="490" y="330" width="44" height="300" rx="22" fill="${L(c, 0.85)}"/>
<circle cx="512" cy="300" r="104" fill="url(#gold)" stroke="#fff" stroke-width="16"/>
<circle cx="480" cy="268" r="28" fill="#fff" opacity=".7"/>
<g filter="url(#sh)"><path d="M230 640 a60 60 0 0 1 60 -60 H734 a60 60 0 0 1 60 60 V740 a60 60 0 0 1 -60 60 H290 a60 60 0 0 1 -60 -60 Z" fill="#fff"/></g>
<ellipse cx="512" cy="626" rx="90" ry="30" fill="${L(c, 0.7)}"/>
<circle cx="330" cy="700" r="40" fill="#ef4444"/><circle cx="694" cy="700" r="40" fill="${c}"/>
<g fill="#fff"><rect x="170" y="200" width="36" height="36" rx="6"/><rect x="206" y="236" width="36" height="36" rx="6"/><rect x="170" y="272" width="36" height="36" rx="6"/>
<rect x="818" y="200" width="36" height="36" rx="6"/><rect x="782" y="236" width="36" height="36" rx="6"/><rect x="818" y="272" width="36" height="36" rx="6"/></g>`,
  },
  sudoku: {
    // A nine-cell board split into its boxes, with the cell you are about to fill lit in gold.
    art: (c) => `<g filter="url(#sh)"><rect x="212" y="212" width="600" height="600" rx="56" fill="#fff"/></g>
<rect x="412" y="412" width="200" height="200" rx="20" fill="url(#gold)"/>
<g stroke="${L(c, 0.75)}" stroke-width="18" stroke-linecap="round"><path d="M412 252 V772 M612 252 V772 M252 412 H772 M252 612 H772"/></g>
<g fill="none" stroke="${c}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
<path d="M312 280 V344 M300 290 L312 280"/><path d="M690 290 H736 L702 352"/><path d="M318 652 L282 712 H344 M326 684 V744"/><circle cx="710" cy="678" r="26"/><path d="M736 678 Q 740 730 700 744"/></g>
<path d="M490 460 H538 L502 562" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'math-sprint': {
    // The four operators as quick-fire tiles, the multiply lit gold: rapid mental arithmetic.
    art: (c) => `<g filter="url(#sh)">
<rect x="220" y="220" width="270" height="270" rx="70" fill="#fff"/><rect x="534" y="220" width="270" height="270" rx="70" fill="url(#gold)"/>
<rect x="220" y="534" width="270" height="270" rx="70" fill="#fff"/><rect x="534" y="534" width="270" height="270" rx="70" fill="#fff"/></g>
<g fill="none" stroke-width="40" stroke-linecap="round">
<path d="M355 295 V415 M295 355 H415" stroke="${c}"/><path d="M627 313 L711 397 M711 313 L627 397" stroke="#fff"/>
<path d="M295 669 H415" stroke="${c}"/><path d="M609 669 H729" stroke="${c}"/></g>
<circle cx="669" cy="614" r="22" fill="${c}"/><circle cx="669" cy="724" r="22" fill="${c}"/>`,
  },
  crossword: {
    // Two words crossing on a grid, with a gold pencil: the daily mini crossword.
    art: (c) => `<g filter="url(#sh)">
<rect x="180" y="420" width="120" height="120" rx="22" fill="#fff"/><rect x="316" y="420" width="120" height="120" rx="22" fill="#fff"/><rect x="452" y="420" width="120" height="120" rx="22" fill="${L(c, 0.75)}"/><rect x="588" y="420" width="120" height="120" rx="22" fill="#fff"/>
<rect x="452" y="148" width="120" height="120" rx="22" fill="#fff"/><rect x="452" y="284" width="120" height="120" rx="22" fill="#fff"/><rect x="452" y="556" width="120" height="120" rx="22" fill="#fff"/><rect x="452" y="692" width="120" height="120" rx="22" fill="#fff"/></g>
<circle cx="210" cy="450" r="12" fill="${c}"/><circle cx="482" cy="178" r="12" fill="${c}"/>
<path d="M486 516 L512 446 L538 516 M495 494 H529" fill="none" stroke="${c}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
<g transform="rotate(45 760 680)"><rect x="728" y="500" width="64" height="300" rx="14" fill="url(#gold)" stroke="#fff" stroke-width="10"/>
<rect x="728" y="500" width="64" height="56" rx="14" fill="#f472b6" stroke="#fff" stroke-width="10"/><path d="M728 800 L760 868 L792 800 Z" fill="#fff"/></g>`,
  },
  gatted: {
    // A society gate with its boom barrier lifting and a guard shield: visitor approvals at the gate.
    art: (c) => `<rect x="190" y="780" width="644" height="24" rx="12" fill="#fff" opacity=".4"/>
<g filter="url(#sh)"><rect x="210" y="430" width="120" height="370" rx="26" fill="#fff"/></g>
<rect x="236" y="470" width="68" height="68" rx="12" fill="${L(c, 0.75)}"/>
<g transform="rotate(-24 290 600)"><rect x="290" y="580" width="560" height="46" rx="23" fill="#fff"/>
<g fill="#ef4444"><rect x="400" y="580" width="56" height="46"/><rect x="530" y="580" width="56" height="46"/><rect x="660" y="580" width="56" height="46"/></g></g>
<circle cx="270" cy="600" r="34" fill="url(#gold)" stroke="#fff" stroke-width="10"/>
<g filter="url(#sh)"><path d="M680 400 l120 -46 l120 46 v80 c0 100 -60 160 -120 190 c-60 -30 -120 -90 -120 -190 Z" fill="url(#gold)" stroke="#fff" stroke-width="16" transform="translate(-60 -110)"/></g>
<path d="M682 408 l34 34 l64 -70" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  dining: {
    // A reservation ticket stamped with a fork-and-spoon seal: table bookings and food-event passes.
    art: (c) => `<g transform="rotate(-10 512 512)"><g filter="url(#sh)"><path d="M232 330 a40 40 0 0 1 40 -40 H752 a40 40 0 0 1 40 40 V430 a60 60 0 0 0 0 120 V694 a40 40 0 0 1 -40 40 H272 a40 40 0 0 1 -40 -40 V550 a60 60 0 0 0 0 -120 Z" fill="#fff"/></g>
<path d="M620 300 V724" stroke="${L(c, 0.7)}" stroke-width="12" stroke-dasharray="26 22"/>
<circle cx="450" cy="512" r="140" fill="${c}"/>
<g fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"><path d="M404 430 V500 c0 22 16 34 34 34 V606 M404 430 V490 M438 430 V490 M472 430 V500 c0 22 -16 34 -34 34"/>
<path d="M512 606 V540 M512 540 c-28 -10 -28 -110 0 -110 c28 0 28 100 0 110"/></g>
<path d="M700 456 L714 493 L753 495 L723 519 L733 557 L700 536 L667 557 L677 519 L647 495 L686 493 Z" fill="url(#gold)"/></g>`,
  },
  'cycle-tracker': {
    // A cycle ring with the period days marked in rose, a drop at its centre and a gold AI spark.
    art: (c) => `<circle cx="512" cy="530" r="250" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="64"/>
<path d="M512 280 A250 250 0 1 1 285 425" fill="none" stroke="#fff" stroke-width="64" stroke-linecap="round"/>
<path d="M285 425 A250 250 0 0 1 512 280" fill="none" stroke="#fb7185" stroke-width="64" stroke-linecap="round"/>
<circle cx="760" cy="590" r="44" fill="url(#gold)" stroke="#fff" stroke-width="12"/>
<g filter="url(#sh)"><path d="M512 390 C 560 460 600 510 600 570 a88 88 0 0 1 -176 0 C 424 510 464 460 512 390 Z" fill="#fff"/></g>
<path d="M512 470 C 540 510 560 540 560 572 a48 48 0 0 1 -96 0 C 464 540 484 510 512 470 Z" fill="#fb7185"/>
<path d="M790 210 l18 46 l46 18 l-46 18 l-18 46 l-18 -46 l-46 -18 l46 -18 Z" fill="url(#gold)"/>`,
  },
  'money-map': {
    // A wallet with a card and a gold coin rising out of it, beside a growing bar chart.
    art: (c) => `<g fill="#fff" opacity=".45"><rect x="626" y="300" width="56" height="120" rx="16"/><rect x="706" y="240" width="56" height="180" rx="16"/><rect x="786" y="190" width="56" height="230" rx="16"/></g>
<g transform="rotate(-14 420 380)"><rect x="250" y="300" width="340" height="210" rx="30" fill="${L(c, 0.7)}"/><rect x="250" y="350" width="340" height="40" fill="${c}"/></g>
<circle cx="560" cy="330" r="80" fill="url(#gold)" stroke="#fff" stroke-width="14"/>
<path d="M534 300 H586 M534 326 H586 M544 300 c44 0 44 54 0 54 l40 40" fill="none" stroke="#b45309" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
<g filter="url(#sh)"><rect x="196" y="440" width="600" height="380" rx="56" fill="#fff"/></g>
<rect x="196" y="440" width="600" height="80" rx="40" fill="${L(c, 0.82)}"/>
<path d="M660 580 H836 a24 24 0 0 1 24 24 V676 a24 24 0 0 1 -24 24 H660 a60 60 0 0 1 0 -120 Z" fill="${c}"/>
<circle cx="672" cy="640" r="26" fill="url(#gold)"/>`,
  },
  'doctor-appointment': {
    // A calendar page with one date marked by a medical cross: book a clinic visit.
    art: (c) => `<g filter="url(#sh)"><rect x="216" y="250" width="592" height="560" rx="56" fill="#fff"/></g>
<path d="M216 306 a56 56 0 0 1 56 -56 H752 a56 56 0 0 1 56 56 V400 H216 Z" fill="${L(c, 0.3)}"/>
<rect x="330" y="196" width="48" height="120" rx="24" fill="#fff" stroke="${c}" stroke-width="10"/><rect x="646" y="196" width="48" height="120" rx="24" fill="#fff" stroke="${c}" stroke-width="10"/>
<g fill="${L(c, 0.8)}"><rect x="260" y="440" width="152" height="96" rx="18"/><rect x="436" y="440" width="152" height="96" rx="18"/><rect x="612" y="440" width="152" height="96" rx="18"/><rect x="260" y="560" width="152" height="96" rx="18"/><rect x="612" y="560" width="152" height="96" rx="18"/><rect x="260" y="680" width="152" height="96" rx="18"/><rect x="436" y="680" width="152" height="96" rx="18"/><rect x="612" y="680" width="152" height="96" rx="18"/></g>
<rect x="436" y="560" width="152" height="96" rx="18" fill="url(#gold)"/>
<path d="M498 576 h28 v18 h18 v28 h-18 v18 h-28 v-18 h-18 v-28 h18 Z" fill="#fff" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>`,
  },
  highwaypass: {
    // A highway running to the horizon under a gold FASTag sticker sending its signal.
    art: (c) => `<g filter="url(#sh)"><path d="M440 360 H584 L800 820 H224 Z" fill="${D(c, 0.45)}"/></g>
<path d="M440 360 L224 820 M584 360 L800 820" stroke="#fff" stroke-width="22" stroke-linecap="round"/>
<g fill="#fff"><path d="M504 400 h16 l6 70 h-28 Z"/><path d="M496 520 h32 l10 100 h-52 Z"/><path d="M486 680 h52 l12 120 h-76 Z"/></g>
<g filter="url(#sh)"><rect x="330" y="160" width="364" height="190" rx="40" fill="url(#gold)" stroke="#fff" stroke-width="16"/></g>
<rect x="380" y="212" width="84" height="84" rx="14" fill="#fff"/>
<g fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round"><path d="M520 222 a70 70 0 0 1 0 64"/><path d="M570 196 a120 120 0 0 1 0 116"/><path d="M620 176 a160 160 0 0 1 0 156"/></g>`,
  },
  smokefree: {
    // Healthy lungs with a leaf growing in them, and a gold spark: recovery after quitting.
    art: (c) => `<rect x="490" y="196" width="44" height="200" rx="22" fill="#fff"/>
<path d="M512 380 L440 450 M512 380 L584 450" stroke="#fff" stroke-width="40" stroke-linecap="round"/>
<g filter="url(#sh)">
<path d="M450 400 C 340 360 220 520 230 690 c6 90 80 120 150 96 c50 -18 80 -60 80 -120 V450 c0 -30 -4 -46 -10 -50 Z" fill="#fff"/>
<path d="M574 400 C 684 360 804 520 794 690 c-6 90 -80 120 -150 96 c-50 -18 -80 -60 -80 -120 V450 c0 -30 4 -46 10 -50 Z" fill="#fff"/></g>
<path d="M300 720 C 300 600 360 530 430 500 C 440 600 400 690 300 720 Z" fill="${L(c, 0.35)}"/>
<path d="M300 720 C 340 650 380 590 430 500" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
<path d="M724 720 C 724 600 664 530 594 500 C 584 600 624 690 724 720 Z" fill="${L(c, 0.35)}"/>
<path d="M724 720 C 684 650 644 590 594 500" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
<path d="M780 220 l18 46 l46 18 l-46 18 l-18 46 l-18 -46 l-46 -18 l46 -18 Z" fill="url(#gold)"/>`,
  },
  'gym-tracker': {
    // A loaded dumbbell over a rising progress line ending in a gold spark: lift, log, get stronger.
    art: (c) => `<path d="M230 800 L410 690 L550 750 L736 640" fill="none" stroke="${L(c, 0.45)}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M800 564 l18 46 l46 18 l-46 18 l-18 46 l-18 -46 l-46 -18 l46 -18 Z" fill="url(#gold)"/>
<g filter="url(#sh)">
<rect x="330" y="372" width="364" height="56" rx="28" fill="#fff"/>
<rect x="236" y="276" width="78" height="248" rx="30" fill="#fff"/>
<rect x="170" y="318" width="60" height="164" rx="24" fill="#fff"/>
<rect x="710" y="276" width="78" height="248" rx="30" fill="#fff"/>
<rect x="794" y="318" width="60" height="164" rx="24" fill="#fff"/></g>
<rect x="262" y="300" width="26" height="200" rx="13" fill="${L(c, 0.6)}"/>
<rect x="736" y="300" width="26" height="200" rx="13" fill="${L(c, 0.6)}"/>`,
  },
  'quick-driver': {
    // A delivery scooter with a gold box on the seat, at speed: orders, routes and driver earnings.
    art: (c) => `<g stroke="#fff" stroke-width="24" stroke-linecap="round" opacity=".55"><path d="M140 440 H250"/><path d="M120 530 H220"/><path d="M150 620 H240"/></g>
<ellipse cx="520" cy="796" rx="310" ry="26" fill="${D(c, 0.5)}" opacity=".35"/>
<g filter="url(#sh)"><rect x="300" y="270" width="230" height="210" rx="30" fill="url(#gold)" stroke="#fff" stroke-width="14"/></g>
<path d="M375 270 V335 H455 V270" fill="none" stroke="#b45309" stroke-width="14" opacity=".55"/>
<path d="M752 728 L700 330" stroke="#fff" stroke-width="30" stroke-linecap="round"/>
<path d="M660 320 H770" stroke="#fff" stroke-width="30" stroke-linecap="round"/>
<g filter="url(#sh)"><path d="M262 680 C 262 580 330 520 420 520 H560 L590 620 H660 L690 420 C 720 440 740 520 730 620 L720 690 H300 a38 38 0 0 1 -38 -10 Z" fill="#fff"/></g>
<rect x="290" y="480" width="260" height="48" rx="24" fill="${D(c, 0.35)}"/>
<circle cx="350" cy="730" r="70" fill="${D(c, 0.55)}" stroke="#fff" stroke-width="18"/><circle cx="350" cy="730" r="24" fill="url(#gold)"/>
<circle cx="752" cy="730" r="70" fill="${D(c, 0.55)}" stroke="#fff" stroke-width="18"/><circle cx="752" cy="730" r="24" fill="url(#gold)"/>
<circle cx="716" cy="470" r="20" fill="url(#gold)"/>`,
  },
};

/** Gradients and the drop shadow every logo may use, in the app's own colour. */
function sharedDefs(c) {
  return `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L(c, 0.3)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${D(c, 0.35)}"/></linearGradient>
<radialGradient id="gold" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="${D(c, 0.6)}" flood-opacity=".45"/></filter>`;
}

/** Prefix every `id="x"` and `url(#x)` with the target id. */
function scope(svg, id) {
  return svg.replace(/id="([\w-]+)"/g, `id="${id}-$1"`).replace(/url\(#([\w-]+)\)/g, `url(#${id}-$1)`);
}

/**
 * One logo as an SVG document.
 *
 * @param variant  'icon'     the full opaque tile (iOS icon, favicon).
 *                 'adaptive' the art alone, transparent, shrunk to 0.8 so it sits inside the
 *                            Android safe zone over the adaptive backgroundColor.
 *                 'ground'   the gradient background alone, for an adaptive `backgroundImage`.
 *                 'splash'   the tile as a rounded square in the middle of a transparent canvas,
 *                            because the splash background is the light canvas and white art on
 *                            it would vanish.
 */
export function LOGO_SVG(id, color, size, variant = 'icon') {
  const logo = LOGOS[id];
  const defs = sharedDefs(color) + (logo.defs ? logo.defs(color) : '');
  const art = logo.art(color);
  const ground = '<rect width="1024" height="1024" fill="url(#bg)"/>';
  let body;
  if (variant === 'ground') body = ground;
  else if (variant === 'adaptive') body = `<g transform="translate(512 512) scale(0.8) translate(-512 -512)">${art}</g>`;
  else if (variant === 'splash')
    body = `<clipPath id="sq"><rect x="128" y="128" width="768" height="768" rx="172"/></clipPath>
<g clip-path="url(#sq)"><g transform="translate(128 128) scale(0.75)">${ground}${art}</g></g>`;
  else body = ground + art;
  return scope(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}"><defs>${defs}</defs>${body}</svg>`,
    id,
  );
}
