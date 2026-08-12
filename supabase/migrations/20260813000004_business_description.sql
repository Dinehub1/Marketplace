-- Listing description. Owners edit their business description from the owner
-- console; it is public (part of the listing) so anon may read it. The existing
-- businesses table has name/address/area/city/phone/category but was missing
-- `description`, which the edit-listing flow writes to.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description text;

-- Reads go through the publishable (anon) key like other columns; writes happen
-- via the service role from the API route (table-level grants already cover this).
GRANT SELECT ON public.businesses TO anon, authenticated;
GRANT UPDATE, SELECT ON public.businesses TO service_role;
