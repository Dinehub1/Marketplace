-- Owner replies on reviews. Owners prove ownership the same way claims do —
-- an OTP-verified phone matching the business's stored phone — and then set
-- owner_reply on a review belonging to their business. owner_reply is public
-- (it is part of the brand's trust surface), so anon may read it.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_reply text;

-- Public reads go through the publishable (anon) key, same as businesses.
GRANT SELECT ON public.reviews TO anon, authenticated;
-- Writes happen via the service role from the API routes.
GRANT INSERT, UPDATE, SELECT ON public.reviews TO service_role;
