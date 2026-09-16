import type { IconName } from "@/components/icons";

/**
 * The product registry.
 *
 * `targets.mjs` has always said "each target names the product modules it exposes from
 * lib/products.ts" — and this file is that list. It exists because a store app is not
 * defined by a name and an icon: it is defined by the jobs it offers. The Breathe app
 * offers one job; the Shop Toolkit offers seven and must not offer the other twenty-four.
 *
 * A product is a catalogue entry, a screen is a route, and they are deliberately not the
 * same thing: `pdf-tools` is one product whose screen runs six different jobs.
 *
 * `price` strings are the ones in `docs/product-plan.md`. They are not invented here —
 * a price typed into a tile is a price someone eventually has to honour.
 *
 * `route: null` means the screen is not built. That is recorded rather than left out,
 * because the alternative — quietly dropping it — is how a store listing ends up
 * promising a product the binary cannot open. The hub renders those as honest
 * "coming soon" cards that say so when tapped.
 */
export type Product = {
  slug: string;
  label: string;
  /** One line, for the tile. Says what the job is, not how it works. */
  blurb: string;
  /** From docs/product-plan.md. */
  price: string;
  /** The route that opens it, or null when no screen implements it yet. */
  route: string | null;
  icon: IconName;
};

export const PRODUCTS: Record<string, Product> = {
  // ── Photo / camera ──────────────────────────────────────────────────────────────
  "passport-photo": {
    slug: "passport-photo",
    label: "Passport photo",
    blurb: "A print-ready sheet at the right size for the form.",
    price: "₹49",
    route: "/passport",
    icon: "account",
  },
  "bg-remove": {
    slug: "bg-remove",
    label: "Background remover",
    blurb: "Cut the subject out of a photo, save a clear PNG.",
    price: "Free · ₹99 pack",
    route: "/tools/bg-remove",
    icon: "star",
  },
  "signature-maker": {
    slug: "signature-maker",
    label: "Signature & stamp",
    blurb: "Sign with a finger, export a clean PNG for forms.",
    price: "₹49",
    route: "/tools/signature",
    icon: "system",
  },
  "photo-repair": {
    slug: "photo-repair",
    label: "Old photo repair",
    blurb: "Cracks and fading cleaned off a scanned photo.",
    price: "₹99",
    route: null,
    icon: "star",
  },
  "product-photo": {
    slug: "product-photo",
    label: "Product photo cleaner",
    blurb: "Shop catalogue shots on a clean white background.",
    price: "₹99/mo",
    route: null,
    icon: "map",
  },

  // ── Documents (local, ₹0 per job) ───────────────────────────────────────────────
  "pdf-tools": {
    slug: "pdf-tools",
    label: "PDF toolkit",
    blurb: "Merge, split, compress, rotate, number and sign PDFs.",
    price: "Free · ₹299/mo",
    route: "/tools/pdf",
    icon: "inbox",
  },
  "invoice-maker": {
    slug: "invoice-maker",
    label: "Invoice & GST bill",
    blurb: "Type the items, get a numbered GST bill with a UPI QR.",
    price: "₹299/mo",
    route: "/tools/invoice",
    icon: "inbox",
  },
  "photos-to-pdf": {
    slug: "photos-to-pdf",
    label: "Photos to PDF",
    blurb: "Up to 20 photos into one PDF, one per page, in your order.",
    price: "Free",
    route: "/tools/photos-to-pdf",
    icon: "inbox",
  },
  "exif-strip": {
    slug: "exif-strip",
    label: "Photo metadata cleaner",
    blurb: "Removes the location, camera and time tags from a photo.",
    price: "Free",
    route: "/tools/exif-strip",
    icon: "system",
  },
  collage: {
    slug: "collage",
    label: "Photo collage",
    blurb: "Two to four photos on one sheet, cut to the same size.",
    price: "Free",
    route: "/tools/collage",
    icon: "map",
  },
  "resume-builder": {
    slug: "resume-builder",
    label: "Resume builder",
    blurb: "A CV laid out for the screening software.",
    price: "₹499",
    route: null,
    icon: "account",
  },
  "resume-checker": {
    slug: "resume-checker",
    label: "ATS check",
    blurb: "What the parser actually sees in your CV.",
    price: "Included in ₹499",
    route: null,
    icon: "search",
  },
  "application-writer": {
    slug: "application-writer",
    label: "Application writer",
    blurb: "A covering letter for one job.",
    price: "₹199",
    route: null,
    icon: "globe",
  },
  "marksheet-maker": {
    slug: "marksheet-maker",
    label: "Marksheet & certificate",
    blurb: "Certificates from a name list, for coaching classes.",
    price: "₹199",
    route: null,
    icon: "inbox",
  },
  "worksheet-maker": {
    slug: "worksheet-maker",
    label: "Worksheet & quiz",
    blurb: "Practice sheets and quizzes from a chapter.",
    price: "₹199/mo",
    route: null,
    icon: "chart",
  },
  "translate-doc": {
    slug: "translate-doc",
    label: "Hindi ↔ English translation",
    blurb: "A document in, the other language out.",
    price: "₹49",
    route: null,
    icon: "globe",
  },
  "study-helper": {
    slug: "study-helper",
    label: "Study helper",
    blurb: "Photograph a question, get the worked answer.",
    price: "₹99/mo",
    route: null,
    icon: "sun",
  },
  "notes-from-audio": {
    slug: "notes-from-audio",
    label: "Lecture → notes",
    blurb: "Record a class, get notes you can revise from.",
    price: "₹99/mo",
    route: null,
    icon: "inbox",
  },

  // ── Writing / cards ─────────────────────────────────────────────────────────────
  catalogue: {
    slug: "catalogue",
    label: "Catalogue maker",
    blurb: "Your products in one shareable catalogue.",
    price: "₹199/mo",
    route: null,
    icon: "saved",
  },
  "digital-card": {
    slug: "digital-card",
    label: "Digital visiting card",
    blurb: "One link with your number and address.",
    price: "Free · ₹199",
    route: null,
    icon: "account",
  },
  "card-maker": {
    slug: "card-maker",
    label: "Visiting card / ID maker",
    blurb: "One card design, printed or sent as an image.",
    price: "₹199",
    route: null,
    icon: "account",
  },
  "cover-maker": {
    slug: "cover-maker",
    label: "Reel & thumbnail cover",
    blurb: "A cover image sized for reels and YouTube thumbs.",
    price: "₹399/mo",
    route: null,
    icon: "star",
  },

  // ── Shop operations ─────────────────────────────────────────────────────────────
  "order-loop": {
    slug: "order-loop",
    label: "Order to payment",
    blurb: "An order form that becomes a bill and a payment link.",
    price: "₹299/mo",
    route: null,
    icon: "whatsapp",
  },
  "booking-page": {
    slug: "booking-page",
    label: "Appointment booking",
    blurb: "A page that takes slots for you.",
    price: "₹299/mo",
    route: null,
    icon: "phone",
  },
  "bill-tracker": {
    slug: "bill-tracker",
    label: "Bill scanner & expense book",
    blurb: "Photograph a bill, keep the month's expenses.",
    price: "₹199/mo",
    route: null,
    icon: "inbox",
  },
  "fee-tracker": {
    slug: "fee-tracker",
    label: "Attendance & fees",
    blurb: "Who came, who has paid.",
    price: "₹199/mo",
    route: null,
    icon: "chart",
  },

  // ── Video / audio ───────────────────────────────────────────────────────────────
  subtitles: {
    slug: "subtitles",
    label: "Subtitles for reels",
    blurb: "Captions burnt into a short video.",
    price: "₹49/video",
    route: null,
    icon: "system",
  },
  voiceover: {
    slug: "voiceover",
    label: "Text to voice-over",
    blurb: "A read-through of your script.",
    price: "₹99/clip",
    route: null,
    icon: "phone",
  },

  // ── Interior ────────────────────────────────────────────────────────────────────
  "room-redesign": {
    slug: "room-redesign",
    label: "Room redesign",
    blurb: "Your room, restyled in five looks.",
    price: "₹49/room",
    route: null,
    icon: "map",
  },
};

/** Products a target claims, in catalogue order. Unknown slugs are dropped, not faked. */
export function productsFor(slugs: readonly string[] | undefined): Product[] {
  if (!slugs?.length) return [];
  return slugs.map((s) => PRODUCTS[s]).filter((p): p is Product => Boolean(p));
}

/** The ones with a screen behind them — what a hub should actually offer today. */
export function builtProductsFor(slugs: readonly string[] | undefined): Product[] {
  return productsFor(slugs).filter((p) => p.route !== null);
}

/**
 * The products a target still owes its store listing. This is the honest backlog: to ship
 * a target, this list has to reach zero (or the listing has to stop promising them).
 */
export function unbuiltProductsFor(slugs: readonly string[] | undefined): Product[] {
  return productsFor(slugs).filter((p) => p.route === null);
}
