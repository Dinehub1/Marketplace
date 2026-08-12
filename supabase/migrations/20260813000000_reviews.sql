-- On-site customer reviews. Trust is the moat for a local directory, and until
-- now the only social proof was the scraped Google rating. Reviews are posted
-- by OTP-verified WhatsApp numbers (same trust model as leads/claims), so they
-- are approved on submit rather than queued for moderation.
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id bigint NOT NULL,
  author_name text NOT NULL DEFAULT 'Anonymous',
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text NOT NULL CHECK (length(body) <= 2000),
  author_phone text,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_business_id_idx ON public.reviews (business_id);
CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON public.reviews (created_at DESC);

-- Public reads go through the publishable (anon) key, same as businesses.
GRANT SELECT ON public.reviews TO anon, authenticated;
-- Writes happen via the service role from the API routes.
GRANT INSERT, UPDATE, SELECT ON public.reviews TO service_role;
