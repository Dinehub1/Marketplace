-- On-site customer reviews. Trust is the moat for a local directory; until now
-- the only social proof was the scraped Google rating. Reviews are posted by
-- OTP-verified WhatsApp numbers (same trust model as leads/claims), so they are
-- published on submit rather than queued for moderation.
--
-- NOTE: this table already existed in the project with these exact columns, so
-- CREATE TABLE IF NOT EXISTS is a no-op here — the grants below are the part
-- that matters. Keep the column names in sync with the live table.
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id bigint NOT NULL,
  reviewer_name text NOT NULL DEFAULT 'Anonymous',
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL CHECK (length(comment) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON public.reviews (business_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews (created_at DESC);

-- Public reads go through the publishable (anon) key, same as businesses.
GRANT SELECT ON public.reviews TO anon, authenticated;
-- Writes happen via the service role from the API routes.
GRANT INSERT, UPDATE, SELECT ON public.reviews TO service_role;
