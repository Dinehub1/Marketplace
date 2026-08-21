/**
 * Category icons as inline SVG.
 *
 * Replaces the emoji map. Emoji were failing badly here: the map only covered
 * ~25 of ~320 categories, so nearly every chip fell back to "🏢", and that
 * glyph has no coverage in the rendering font — the page filled with tofu
 * boxes (▯). Emoji also carry their own colour, which fights the brand palette,
 * and they sit on the text baseline so they never align in a grid.
 *
 * These are stroked line icons on a 24px grid, inheriting `currentColor`, so
 * they take the brand colour and stay crisp at any size.
 */

type IconProps = { className?: string; size?: number };

const S = (d: string) =>
  function Icon({ className, size = 20 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: d }}
      />
    );
  };

const Icons = {
  home: S('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
  wrench: S('<path d="M14.7 6.3a4 4 0 1 0 5 5L21 21l-3 0-9.5-9.5"/><path d="m4 20 5-5"/>'),
  bolt: S('<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>'),
  cross: S('<path d="M12 3v18M3 12h18"/>'),
  stethoscope: S('<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M6 3H4M14 3h2"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>'),
  pill: S('<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/>'),
  tooth: S('<path d="M7 3c-2 0-3 1.6-3 4 0 4 1.5 6 2 10 .3 2.5 2.5 2.5 2.8 0 .3-2.3.6-4 1.2-4s.9 1.7 1.2 4c.3 2.5 2.5 2.5 2.8 0 .5-4 2-6 2-10 0-2.4-1-4-3-4-1.5 0-2 .8-3 .8S8.5 3 7 3Z"/>'),
  cart: S('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12h11L21 7H6"/>'),
  bag: S('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  utensils: S('<path d="M6 3v8a2 2 0 0 0 4 0V3"/><path d="M8 11v10"/><path d="M17 3c-1.5 1.5-2 3-2 5s.5 2.5 2 2.5V21"/>'),
  cup: S('<path d="M4 8h12v6a5 5 0 0 1-10 0z" /><path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16"/><path d="M4 21h14"/>'),
  bed: S('<path d="M3 18v-6h18v6"/><path d="M3 12V7"/><path d="M21 18v2M3 18v2"/><path d="M7 12V9h5v3"/>'),
  car: S('<path d="M4 15h16"/><path d="M6 15V11l2-4h8l2 4v4"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/>'),
  book: S('<path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z"/>'),
  scale: S('<path d="M12 3v18"/><path d="M5 7h14"/><path d="M8 7 5 14h6zM16 7l-3 7h6z"/>'),
  chart: S('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  scissors: S('<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><path d="M8 7.5 20 18M8 16.5 20 6"/>'),
  dumbbell: S('<path d="M3 9v6M7 7v10M17 7v10M21 9v6M7 12h10"/>'),
  camera: S('<path d="M3 8h4l1.5-2h7L17 8h4v11H3z"/><circle cx="12" cy="13" r="3.2"/>'),
  monitor: S('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>'),
  building: S('<path d="M4 21V4h10v17"/><path d="M14 10h6v11"/><path d="M7 8h2M7 12h2M7 16h2M17 14h1M17 18h1"/>'),
  truck: S('<path d="M3 16V6h11v10"/><path d="M14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
  paint: S('<rect x="4" y="3" width="14" height="6" rx="1.5"/><path d="M18 6h2v5l-7 2v3"/><rect x="10" y="16" width="6" height="5" rx="1.5"/>'),
  sparkle: S('<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/>'),
  grid: S('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  sofa: S('<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M3 11a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2"/><path d="M5 16v2M19 16v2"/>'),
  tv: S('<rect x="2.5" y="6" width="19" height="12" rx="1.6"/><path d="m8 3 4 3 4-3"/>'),
  tools: S('<path d="M9 4 6 7 3 6l3.5 8"/><path d="M14.8 6.2a3.6 3.6 0 1 0 4.5 4.5L21 21h-3l-8-8"/>'),
  hammer: S('<path d="m3 20 7-7"/><path d="m11.5 11.5 2.5-2.5-2-2 3-3 5 5-3 3-2-2-2.5 2.5z"/>'),
};

export type IconKey = keyof typeof Icons;

/**
 * Keyword rules, most specific first. A generic building mark is the fallback —
 * a real icon, never a missing glyph.
 */
const RULES: [RegExp, IconKey][] = [
  // Order matters: these run before the broad rules below, because
  // "cable TV installer" must not be captured by /installer/, and
  // "furniture store" must not be captured by /store/.
  [/cable tv|television|dish antenna|set top/, "tv"],
  [/carpent|furnitur|sofa|mattress|upholster/, "sofa"],
  // "air conditioner repair" and "appliance repair" were falling through every
  // rule to the generic building mark.
  [/repair|servicing|mechanic|technician|fitter|installer|maintenance/, "tools"],
  [/dentist|dental|orthodont/, "tooth"],
  [/pharmac|chemist|medical store/, "pill"],
  [/hospital|clinic|doctor|physio|surgery|nursing|oncolog|radiolog|fertility|dialysis|immunis|ayurved|psychiatr|psycholog|chiropract|optometr|veterinar/, "stethoscope"],
  [/plumb|pipe|sanitary|water purifier|borewell/, "wrench"],
  [/electric|solar|wiring|cctv|alarm|automation|charger/, "bolt"],
  [/restaurant|dhaba|biryani|food|kebab|catering|bakery|sweet|snack|pizza|vegetarian|lobster/, "utensils"],
  [/cafe|coffee|juice|tea|bar |lounge|ice cream|dessert/, "cup"],
  [/hotel|hostel|resort|guest house|lodge|pg /, "bed"],
  [/car |auto|bike|vehicle|tyre|garage|motor|scooter|driving|petrol|cng/, "car"],
  [/school|college|university|tutor|coaching|academy|institute|educat|learning|preschool|library|training/, "book"],
  [/lawyer|legal|advocate|notary|court/, "scale"],
  [/account|tax|financ|insur|bank|invest|audit|loan|mutual fund|money|broker/, "chart"],
  [/salon|beauty|spa|makeup|hair|nail|barber|parlour|massage|tattoo|laser/, "scissors"],
  [/gym|fitness|yoga|sport|martial|pilates|swim|athlet/, "dumbbell"],
  [/photo|studio|video|film|cinema|print/, "camera"],
  [/computer|it |software|web|digital|tech|mobile|laptop|electronic|gaming|3d printing/, "monitor"],
  [/logistic|transport|courier|cargo|freight|packer|mover|delivery|shipping/, "truck"],
  [/paint|interior|decor|furnitur|carpent|tile|architect|civil|construct|contractor|build|renovat|glass|hardware|cement|concrete/, "paint"],
  [/real estate|property|realty|apartment|land|broker|housing/, "home"],
  [/clean|laundry|pest|maid|disinfect|garbage|waste/, "sparkle"],
  [/store|shop|mart|bazaar|retail|boutique|wholesale|supplier|manufactur|dealer|market/, "cart"],
  [/agency|consult|service|firm|company|centre|center/, "building"],
];

export function iconKeyFor(category: string): IconKey {
  const c = (category || "").toLowerCase();
  for (const [re, key] of RULES) if (re.test(c)) return key;
  return "building";
}

export function CategoryIcon({
  category,
  size = 20,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const Cmp = Icons[iconKeyFor(category)];
  return <Cmp size={size} className={className} />;
}

export const GridIcon = Icons.grid;
export const SparkleIcon = Icons.sparkle;
