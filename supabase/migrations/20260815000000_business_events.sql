-- ============================================================================
-- Phase A · Measurement layer: per-business engagement events.
--
-- The directory monetizes on proof of value ("your page got N views / M calls"),
-- and nothing was measuring it. This table records one row per user action on a
-- business listing page:
--
--   view              page impression (one per page mount; session_id allows a
--                     later rollup to count pageviews vs distinct visitors)
--   call_click        tap on a tel: link
--   whatsapp_click    tap on a wa.me link
--   directions_click  tap on a Google Maps / Directions link
--   website_click     tap on the business's own website link
--   lead              a verified lead was submitted (written by /api/leads)
--
-- Deliberately separate from the existing `events` table, which is the Hermes
-- agent task queue (type/source/priority/assigned_agent). That table must not be
-- repurposed for business analytics.
--
-- Access posture (matches Phase 0 hardening):
--   * Writes and reads go through the API routes on the service role.
--   * anon/authenticated get NO access, so a browser holding the publishable
--     key cannot read other businesses' engagement numbers.
--   * RLS is enabled default-deny; the service role bypasses RLS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_events (
  id          bigserial primary key,
  business_id bigint not null,
  brand_slug  text,
  type        text not null,
  session_id  text,
  referrer    text,
  city        text,
  created_at  timestamp with time zone not null default now(),
  constraint business_events_business_id_fkey
    foreign key (business_id) references public.businesses(id) on delete cascade,
  constraint business_events_type_check
    check (type in ('view','call_click','whatsapp_click','directions_click','website_click','lead'))
);

CREATE INDEX IF NOT EXISTS business_events_business_created_idx
  ON public.business_events (business_id, created_at desc);

CREATE INDEX IF NOT EXISTS business_events_type_created_idx
  ON public.business_events (type, created_at desc);

ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

-- Service role only (the API routes run on it). No public read/write surface.
REVOKE ALL ON public.business_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_events TO service_role;

-- The identity/bigserial sequence must be usable by the inserting role.
REVOKE ALL ON SEQUENCE public.business_events_id_seq FROM anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.business_events_id_seq TO service_role;
