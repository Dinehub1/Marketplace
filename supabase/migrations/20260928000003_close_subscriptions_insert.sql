-- ============================================================================
-- Close `subscriptions_public_insert`, the last write policy open to everyone.
--
-- Same hole as 20260928000002_close_open_write_policies.sql, on one more table: the baseline
-- created `FOR INSERT TO public WITH CHECK (true)` on `subscriptions` and granted anon and
-- authenticated INSERT/UPDATE/DELETE, so anyone holding the publishable key (it ships in
-- every app binary) could insert subscription rows. Nothing in the repo writes this table
-- through the publishable key, and it has no read policy, so after this migration it is
-- service-role only.
--
-- A separate migration rather than an edit to ...0002, because that one has already been
-- applied: changing an applied migration makes the repo and the database disagree.
--
-- Existence-guarded and idempotent.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS subscriptions_public_insert ON public.subscriptions;
    REVOKE ALL PRIVILEGES ON TABLE public.subscriptions FROM anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO service_role;
  END IF;
END $$;
