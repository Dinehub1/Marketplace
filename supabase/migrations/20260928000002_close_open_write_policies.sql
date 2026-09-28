-- ============================================================================
-- Close the write policies that were open to everyone.
--
-- The baseline created these as `FOR ALL TO public USING (true)`. `public` is every role,
-- anon included, and the baseline also granted anon/authenticated INSERT/UPDATE/DELETE on
-- each table — so anyone holding the publishable key (it ships inside every app binary)
-- could read, rewrite or delete these rows. The Phase 0 lockdown
-- (20260814000000_phase0_rls.sql) revoked grants on a hand-picked list of eleven tables and
-- these eleven were not on it.
--
-- The names (`service_role_all_*`, `apps_service_write`) say what was meant: server-only
-- access. The service role bypasses RLS, so it never needed these policies; they only ever
-- granted access to everyone else. Dropping them and revoking the client grants leaves the
-- service role exactly as it was.
--
-- Kept on purpose: `apps_public_read` (FOR SELECT on `apps`), the one read policy here, so
-- anything listing apps with the publishable key keeps working. Revisit it separately if
-- `apps` holds anything that should not be public.
--
-- If any process writes these tables with the PUBLISHABLE key (not the service role), it
-- stops working after this migration — switch it to the service-role key.
--
-- Existence-guarded and idempotent: safe on production and on a fresh database.
-- ============================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('apps',              'apps_service_write'),
      ('agent_outputs',     'service_role_all_agent_outputs'),
      ('research_logs',     'service_role_all_research_logs'),
      ('backlog',           'service_role_all_backlog'),
      ('learning_log',      'service_role_all_learning_log'),
      ('events',            'service_all_events'),
      ('task_queue',        'service_all_task_queue'),
      ('agent_memory',      'service_all_agent_memory'),
      ('agent_triggers',    'service_all_agent_triggers'),
      ('execution_metrics', 'service_all_execution_metrics'),
      ('event_config',      'service_all_event_config')
    ) AS v(tbl, pol)
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = r.tbl) THEN
      -- RLS stays on: with no policy, anon/authenticated see nothing and write nothing.
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
      -- Belt and braces: no client role keeps a table privilege either.
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', r.tbl);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', r.tbl);
    END IF;
  END LOOP;

  -- `apps` keeps its public read: restore SELECT (only) for the read policy to act on.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'apps') THEN
    GRANT SELECT ON public.apps TO anon, authenticated;
  END IF;
END $$;
