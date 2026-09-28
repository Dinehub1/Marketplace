-- ============================================================================
-- Tighten the read policies left over from the baseline.
--
-- 1. businesses: `biz_public_read` is `FOR SELECT TO public USING (true)`. Policies are
--    OR-ed, so it cancelled the `status = 'active'` filter on the other read policies:
--    anyone holding the publishable key could read every duplicate, quarantined and new
--    listing (1,900+ rows), with `raw`, `email` and `owner_id`. Dropped, with the
--    redundant `Public can read businesses` (same as `public_read`).
--    `Business owners can manage` was `FOR ALL TO public`; the client roles only hold
--    SELECT on businesses, so all it ever did was let an owner read their own listing.
--    It is recreated as exactly that.
--
-- 2. profiles: anon and authenticated held every privilege (TRUNCATE included, which RLS
--    does not check), and `profiles_self_update` let a user rewrite their own `role`.
--    Now: anon holds nothing; authenticated may read its own row and update only
--    `full_name`. `role` and `brand_id` are service-role only.
--
-- 3. reviews: the client roles only hold SELECT, so the insert/update/delete/admin
--    policies never applied — every review write goes through the service role
--    (apps/web/app/api/businesses/[id]/reviews/route.ts). They are dropped so nothing
--    trusts `profiles.role`, along with the duplicate approved-read policy.
--
-- 4. brands: three identical public-read policies become one. The admin insert/update
--    policies checked `auth.jwt() ->> 'role' = 'admin'`, which is always
--    'authenticated' for a signed-in user, and the client roles hold no write grant, so
--    they are dropped as dead.
--
-- 5. bookings: `bookings_public_read` (`USING (true)`) on a table holding customer_name
--    and customer_phone. No client role holds a grant on bookings today, so it was
--    inert; dropped so a future GRANT does not expose every booking.
--
-- 6. products, product_jobs, orders, wallets, app_users: created outside migrations, so
--    they kept Supabase's default grants — every privilege, TRUNCATE included, for anon
--    and authenticated. RLS (no policies) blocked row access and PostgREST cannot issue
--    TRUNCATE, so nothing was reachable; the grants are revoked so it stays that way.
--    All access is service-role (apps/web/lib/nextel.ts `db()`); products keeps SELECT
--    for its public catalogue policy.
--
-- Every public read in apps/web already filters `status=eq.active` / `is_approved=eq.true`,
-- so listing, search, sitemap and review pages see the same rows as before. A direct
-- link to a duplicate or quarantined business now returns not-found for anon.
--
-- Existence-guarded and idempotent: safe on production and on a fresh database.
-- ============================================================================

-- 1. businesses --------------------------------------------------------------
DROP POLICY IF EXISTS biz_public_read               ON public.businesses;
DROP POLICY IF EXISTS "Public can read businesses"  ON public.businesses;
DROP POLICY IF EXISTS "Business owners can manage"  ON public.businesses;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='businesses' AND policyname='public_read') THEN
    CREATE POLICY public_read ON public.businesses FOR SELECT TO anon, authenticated
      USING (status = 'active');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='businesses' AND policyname='owner_read') THEN
    CREATE POLICY owner_read ON public.businesses FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = owner_id);
  END IF;
END $$;

-- 2. profiles ----------------------------------------------------------------
REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

DROP POLICY IF EXISTS profiles_self_read   ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- 3. reviews -----------------------------------------------------------------
DROP POLICY IF EXISTS "Public can read approved reviews"       ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews"           ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews"           ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews"          ON public.reviews;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='public_read') THEN
    CREATE POLICY public_read ON public.reviews FOR SELECT TO anon, authenticated
      USING (is_approved);
  END IF;
END $$;

-- 4. brands ------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read access for anon and authenticated" ON public.brands;
DROP POLICY IF EXISTS brands_public_read                             ON public.brands;
DROP POLICY IF EXISTS "Allow insert for admins"                      ON public.brands;
DROP POLICY IF EXISTS "Allow update for admins"                      ON public.brands;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='brands' AND policyname='public_read') THEN
    CREATE POLICY public_read ON public.brands FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- 5. bookings ----------------------------------------------------------------
DROP POLICY IF EXISTS bookings_public_read ON public.bookings;
REVOKE ALL PRIVILEGES ON TABLE public.bookings FROM anon, authenticated;

-- 6. product tables ----------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products', 'product_jobs', 'orders', 'wallets', 'app_users'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    GRANT SELECT ON public.products TO anon, authenticated;
  END IF;
END $$;
