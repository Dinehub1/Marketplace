/**
 * The event record the detail screen renders.
 *
 * Why this exists: `app/events/[id].tsx` held its event in `useState<any>(null)`, so
 * every read off it — including the `.filter`/`.find`/`.map` callbacks over its nested
 * arrays — was implicitly `any`. Under `strict` that produced 17 of the app's 45 errors,
 * all pointing at callback parameters rather than at the actual cause.
 *
 * Scope: this types the *scalar columns the screen reads* and the null the initial state
 * really has, so a mistyped field is an error and `event?.` is honest. It is not a claim
 * to model the whole table.
 *
 * The nested joins stay `any[]` on purpose. They are Supabase joins that this screen only
 * iterates and forwards to presentational components. A `Record<string, unknown>[]` guess
 * is *worse* than `any`: it type-checks nothing and then rejects those components' real
 * `Artist[]` / `Experience[]` / `Partner[]` props, which traded 17 errors for 40. `any`
 * is the honest current state; replacing it is the data-model refactor this file needs.
 *
 * Note: `components/Tickets/TicketCard.tsx` also declares an `EventTicketType` for the
 * tickets-of-an-event list. Same table; merge into this file rather than aliasing if the
 * two ever need to agree on a column.
 */

export interface EventDetail {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  status?: string | null;
  event_type?: string | null;
  ticket_type?: string | null;

  event_date?: string | null;
  event_end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  booking_open_date?: string | null;
  booking_type?: string | null;

  venue?: string | null;
  event_venue?: any;

  price?: number | null;
  price_display_string?: string | null;
  organizer_id?: string | null;
  native?: boolean | null;
  pay_bill_enabled?: boolean | null;
  gallery_images?: string[] | null;
  cover_image_url?: string | null;
  cover_video_url?: string | null;

  /** Tickets for this event. The shape `[id].tsx` and `TicketCard.tsx` both rely on. */
  event_ticket_types?: EventTicketRow[] | null;

  // Supabase joins — see the note above on why these are `any`.
  event_artists?: any;
  event_categories?: any;
  event_experiences?: any;
  event_faq_terms?: any;
  event_guide?: any;
  event_partners?: any;
  event_prohibited_items?: any;
  event_restaurants?: any;
}

export interface EventTicketRow {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  available: number;
  ticket_cover_enabled?: boolean | null;
  [key: string]: unknown;
}
