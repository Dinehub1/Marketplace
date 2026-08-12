-- Monetization: featured/priority placement. A directory monetizes via placement
-- and leads, not listings, so businesses can boost themselves to the top of the
-- discovery results. `featured` is the on/off flag the marketplace sort keys off;
-- `priority` is a numeric tie-breaker (higher = higher) so repeated boosts or
-- different tiers can out-rank each other. Both default off so existing rows are
-- unaffected.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority int NOT NULL DEFAULT 0;

-- Public reads go through the publishable (anon) key, same as other columns.
GRANT SELECT ON public.businesses TO anon, authenticated;
-- Writes (feature/boost) happen via the service role from the API route.
GRANT UPDATE, SELECT ON public.businesses TO service_role;
