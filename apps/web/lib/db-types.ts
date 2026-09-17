/**
 * Row shapes for the PostgREST tables the web API routes read and write.
 *
 * Why these exist by hand: the project has no generated database types, so every
 * `await res.json()` came back as `any` and each route re-asserted it inline
 * (`((await res.json()) as any[])[0]` — 55 of them). That is not just noisy; nothing
 * checked that a route asked for a column that exists, or read one that does not.
 *
 * Columns are taken from `supabase/migrations/` and from the `select=` clauses the
 * routes issue. A field is optional here only when the schema defaults it AND the
 * routes never rely on it; anything a route dereferences is required, so adding a
 * required read is a compile error rather than a runtime `undefined`.
 *
 * These describe *database rows*, not API payloads. A route that reshapes a row for
 * the client should build its own response type.
 */

/** `public.businesses` — the 24k-row directory. */
export type BusinessRow = {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  pincode: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  description: string | null;
  image_url: string | null;
  slug: string | null;
  google_maps: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  featured: boolean;
  premium: boolean | null;
  verified: boolean | null;
  priority: number;
  owner_id: string | null;
  brand_id: string | null;
  app_id: string | null;
  source: string | null;
  created_at: string;
  updated_at: string | null;
};

/** `public.orders` — a gateway order, optionally tied to the job it unlocks. */
export type OrderRow = {
  id: number;
  /** Product slug; null for a wallet/credit purchase. */
  product: string | null;
  phone: string | null;
  amount_paise: number;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  credits_granted: number | null;
  /** The `product_jobs` row this payment unlocks. */
  job_id: number | null;
  created_at: string;
};

/** `public.product_jobs` — one attempt at one product job, success or failure. */
export type ProductJobRow = {
  id: number;
  product: string;
  phone: string | null;
  /** R2 key(s) of the uploaded input; comma-separated for multi-file jobs. */
  input_key: string | null;
  output_key: string | null;
  preview_key: string | null;
  status: string;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
};

/** `public.products` — the priced catalogue a job must exist in. */
export type ProductRow = {
  slug: string;
  name: string;
  price_paise: number;
  plan: string | null;
  enabled: boolean | null;
};

/** `public.leads` — an enquiry captured from a brand site. */
export type LeadRow = {
  id: string;
  brand_id: string | null;
  business_id: number | null;
  app_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source_path: string | null;
  status: string;
  meta: unknown;
  created_at: string;
};

/** `public.bookings` — a slot booked at a vendor. */
export type BookingRow = {
  id: string;
  app_id: string | null;
  user_id: string | null;
  business_id: number | null;
  service_type: string | null;
  booking_date: string | null;
  status: string;
  /** `pay_at_shop` vs online; completing an at-shop booking settles it. */
  payment_mode: string | null;
  payment_status: string | null;
  notes: string | null;
  amount: number | null;
  created_at: string;
  updated_at: string | null;
};

/** `public.vendor_services` — what a vendor offers. */
export type VendorServiceRow = {
  id: string;
  business_id: number;
  name: string;
  description: string | null;
  price_inr: number | null;
  duration_minutes: number | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string | null;
};

/** `public.vendor_hours` — a vendor's weekly opening hours. */
export type VendorHourRow = {
  business_id: number;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  slot_minutes: number | null;
  capacity: number | null;
};

/** `public.reviews` — a customer review, with the owner's optional reply. */
export type ReviewRow = {
  id: number;
  business_id: number;
  user_id: string | null;
  reviewer_name: string;
  rating: number;
  title: string | null;
  comment: string;
  is_verified: boolean | null;
  is_approved: boolean | null;
  helpful_count: number | null;
  meta: unknown;
  created_at: string;
  updated_at: string | null;
  owner_reply: string | null;
};

/** `public.otp_codes` — a WhatsApp OTP and its delivery outcome. */
export type OtpCodeRow = {
  id: number;
  phone: string;
  code: string;
  purpose: string | null;
  expires_at: string;
  verified_at: string | null;
  attempts: number | null;
  created_at: string;
  delivered?: boolean | null;
  nextel_detail?: string | null;
};

/** `public.payments` — a boost payment, linked to the listing it features. */
export type PaymentRow = {
  id: string;
  brand_id: string | null;
  app_id: string | null;
  business_id: number | null;
  amount: number | null;
  currency: string | null;
  method: string | null;
  upi_ref: string | null;
  status: string;
  payer_name: string | null;
  payer_contact: string | null;
  gateway: string;
  gateway_order_id: string | null;
  meta: unknown;
  created_at: string;
};

/** `public.business_media` — a photo attached to a listing. */
export type BusinessMediaRow = {
  id: number;
  business_id: number;
  /** R2 object key, used to delete the object when the row goes. */
  object_key: string;
  /** Public URL kept on the row so a render needs no R2 round trip. */
  url: string;
  kind: string | null;
  content_type: string | null;
  bytes: number | null;
  position: number | null;
};
