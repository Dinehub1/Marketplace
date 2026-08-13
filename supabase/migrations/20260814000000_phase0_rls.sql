-- ============================================================================
-- Phase 0 · Lock the doors (C3): baseline RLS + public read posture.
--
-- Before this migration the RLS posture on the core tables was unknown/unmanaged
-- and 20260624191033.sql GRANTed INSERT/UPDATE/SELECT on dev_tasks and UPDATE on
-- agents to anon/authenticated — a public write surface through the browser key.
--
-- This migration:
--   1. ENABLEs ROW LEVEL SECURITY on every application table that exists. RLS
--      default-deny means a table with no policy is invisible/unwriteable to
--      anon and authenticated; the service role (used by every app write path)
--      bypasses RLS entirely, so server-side flows are unaffected.
--   2. REVOKEs the dangerous grants so an anon/authenticated role can no longer
--      INSERT/UPDATE/DELETE anything, anywhere.
--   3. Adds explicit FOR SELECT policies ONLY on the tables the public pages
--      really read through the publishable key (businesses, brands, reviews,
--      whatsapp_templates, listing_media, business_description).
--   4. Leaves leads, payments, otp_codes, dev_tasks and agents with NO policy:
--      they are readable/writeable only via the service role. The admin console
--      was switched to the service role in this same phase, so its stats keep
--      working without exposing customer data through the browser key.
--
-- The known working set is businesses, brands, leads, payments, otp_codes,
-- dev_tasks, agents, reviews, whatsapp_templates, plus any listing_media /
-- business_description tables if they exist. Every statement is existence-
-- guarded (the migration iterates information_schema.tables), so it is safe to
-- run on the production database AND on a fresh one.
-- ============================================================================

-- ── 1 + 2 + 4 + 5: enable RLS, revoke public writes, restore grants ───────
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name::text FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('businesses','brands','leads','payments','otp_codes',
                         'dev_tasks','agents','reviews','whatsapp_templates',
                         'listing_media','business_description')
  LOOP
    -- 1. RLS on (idempotent; default-deny for anon/authenticated).
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- 2. Strip every privilege history (incl. the 20260624191033.sql grants).
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', t);
    -- 4/5. Service role keeps full access for the API routes + admin console.
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    -- 3. Public read surface, table by table.
    IF t IN ('businesses','brands','reviews','whatsapp_templates','listing_media','business_description') THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  s record;
BEGIN
  -- Revoke any direct sequence grants from anon/authenticated across every
  -- public sequence, without naming them (the names vary between environments,
  -- and a missing sequence must never abort the migration). 42P01 (undefined
  -- table/sequence) is NOT covered by undefined_object, so guard with OTHERS.
  FOR s IN
    SELECT n.nspname AS sch, c.relname AS seq
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM anon, authenticated', s.sch, s.seq);
  END LOOP;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 2b. Drop legacy anon/authenticated WRITE policies ───────────────────────
-- REVOKE removes table-level grants, but it does NOT remove row-level POLICIES.
-- The project shipped with anon/authenticated write policies on the ops tables
-- (dev_tasks, agents, leads, payments). They are guarded with IF EXISTS and
-- dropped explicitly — service role keeps full access through the API routes
-- and the (service-role-based) admin console. Reads on dev_tasks/agents are
-- also removed: the console no longer reads them with the publishable key.
DROP POLICY IF EXISTS dev_tasks_anon_insert ON public.dev_tasks;
DROP POLICY IF EXISTS dev_tasks_anon_update ON public.dev_tasks;
DROP POLICY IF EXISTS dev_tasks_anon_select ON public.dev_tasks;
DROP POLICY IF EXISTS agents_anon_update    ON public.agents;
DROP POLICY IF EXISTS agents_anon_select    ON public.agents;

-- Keep leads/payments writeable via service role only; drop public writes.
DROP POLICY IF EXISTS leads_public_insert    ON public.leads;
DROP POLICY IF EXISTS payments_public_insert ON public.payments;

-- ── 3. Public FOR SELECT policies (the publishable-key read surface) ────────
-- Each policy is scoped as tightly as the app's own queries are.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='businesses') THEN
    DROP POLICY IF EXISTS "public_read" ON public.businesses;
    CREATE POLICY "public_read" ON public.businesses
      FOR SELECT TO anon, authenticated
      USING (status = 'active');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='brands') THEN
    DROP POLICY IF EXISTS "public_read" ON public.brands;
    CREATE POLICY "public_read" ON public.brands
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Reviews: moderate at the DB layer when the moderation column exists (as it
-- does on the live table), otherwise fall back to allowing reads and let the
-- app's is_approved=eq.true filters do the work on a fresh database.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reviews') THEN
    DROP POLICY IF EXISTS "public_read" ON public.reviews;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='reviews' AND column_name='is_approved'
    ) THEN
      CREATE POLICY "public_read" ON public.reviews
        FOR SELECT TO anon, authenticated
        USING (is_approved);
    ELSE
      CREATE POLICY "public_read" ON public.reviews
        FOR SELECT TO anon, authenticated
        USING (true);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='whatsapp_templates') THEN
    DROP POLICY IF EXISTS "public_read" ON public.whatsapp_templates;
    CREATE POLICY "public_read" ON public.whatsapp_templates
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='listing_media') THEN
    DROP POLICY IF EXISTS "public_read" ON public.listing_media;
    CREATE POLICY "public_read" ON public.listing_media
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='business_description') THEN
    DROP POLICY IF EXISTS "public_read" ON public.business_description;
    CREATE POLICY "public_read" ON public.business_description
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;