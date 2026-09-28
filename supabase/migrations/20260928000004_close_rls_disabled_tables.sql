-- ============================================================================
-- Lock the tables Supabase's security advisor still flags.
--
-- 1. RLS was never enabled on four tables, and the baseline granted anon and
--    authenticated every privilege on them (SELECT, INSERT, UPDATE, DELETE, TRUNCATE).
--    With RLS off, a grant is the only gate, so anyone holding the publishable key
--    (shipped in every app binary) could read, rewrite or delete them:
--      service_providers       name/phone/address, and a `verified` flag anyone could set
--      provider_verifications  verification codes — readable and markable by anyone
--      content_strategy_framework, landing_page_templates
--    Advisor lint 0013 rls_disabled_in_public (ERROR).
--
-- 2. Four tables with user-scoped columns (user_id, app_id) carry `USING (true)` read
--    policies for `public`, so every row would be readable by everyone:
--      notifications, settings, jobs, trades
--    The reads are dropped along with the baseline's client write grants.
--
-- No code in this repo reads or writes any of these eight tables, and the service role
-- bypasses RLS, so server-side access is unchanged. Anything that used the PUBLISHABLE
-- key on them stops working — switch it to the service-role key or add a scoped policy.
--
-- Existence-guarded and idempotent: safe on production and on a fresh database.
-- ============================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'service_providers', 'provider_verifications', 'content_strategy_framework',
    'landing_page_templates', 'notifications', 'settings', 'jobs', 'trades'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    END IF;
  END LOOP;

  -- The `USING (true)` read policies on the user-scoped tables. DROP POLICY IF EXISTS
  -- still errors when the table itself is missing, hence the guards.
  IF to_regclass('public.notifications') IS NOT NULL THEN DROP POLICY IF EXISTS notifications_public_read ON public.notifications; END IF;
  IF to_regclass('public.settings')      IS NOT NULL THEN DROP POLICY IF EXISTS settings_public_read      ON public.settings;      END IF;
  IF to_regclass('public.jobs')          IS NOT NULL THEN DROP POLICY IF EXISTS jobs_public_read          ON public.jobs;          END IF;
  IF to_regclass('public.trades')        IS NOT NULL THEN DROP POLICY IF EXISTS trades_public_read        ON public.trades;        END IF;
END $$;
