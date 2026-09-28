-- ============================================================================
-- Schema cleanup: duplicate indexes, duplicate triggers, and two missing guards.
--
-- 1. Duplicate indexes (advisor lint 0009). Each pair is byte-identical; the copy
--    kept is the one with scans, or the one a later migration names.
--      businesses          idx_biz_category          = idx_businesses_category (kept)
--      businesses_staging  ..._category_idx1         = ..._category_idx (kept)
--      reviews             idx_reviews_business_id   = reviews_business_id_idx (kept)
--      reviews             idx_reviews_created_at    = reviews_created_at_idx (kept)
--      service_providers   unique_phone              = service_providers_phone_key (kept)
--
-- 2. agents, brands, content and dev_tasks each ran two BEFORE UPDATE triggers that both
--    set updated_at = now(). The `update_*_updated_at` trigger is kept.
--
-- 3. businesses.updated_at had a default but no trigger, so it never moved after insert.
--    The baseline also never defined update_updated_at() or any trigger (they were made
--    on production by hand), so a fresh database had none. The function is defined here
--    exactly as production has it, and each table that has the trigger on production
--    gets it if missing — a no-op on production.
--
-- 4. businesses.status was free text. The values in use are active, new, duplicate and
--    quarantined; pending, inactive and closed are allowed for owner-submitted and
--    delisted rows. Anything else is a typo that would silently hide a listing.
--
-- 5. orders.status defaulted to 'created', a value its own orders_status_check rejects,
--    so any insert that omitted status failed. The API always sends 'pending'; the
--    default now matches it.
--
-- Existence-guarded and idempotent: safe on production and on a fresh database.
-- ============================================================================

-- 1. duplicate indexes -------------------------------------------------------
DROP INDEX IF EXISTS public.idx_biz_category;
DROP INDEX IF EXISTS public.businesses_staging_category_idx1;
DROP INDEX IF EXISTS public.idx_reviews_business_id;
DROP INDEX IF EXISTS public.idx_reviews_created_at;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_phone'
             AND conrelid = 'public.service_providers'::regclass) THEN
    ALTER TABLE public.service_providers DROP CONSTRAINT unique_phone;
  END IF;
END $$;

-- 2. duplicate updated_at triggers -------------------------------------------
DROP TRIGGER IF EXISTS trg_agents_updated  ON public.agents;
DROP TRIGGER IF EXISTS trg_brands_updated  ON public.brands;
DROP TRIGGER IF EXISTS trg_content_updated ON public.content;
DROP TRIGGER IF EXISTS trg_tasks_updated   ON public.dev_tasks;

-- 3. updated_at triggers -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agents', 'apps', 'bookings', 'brands', 'businesses', 'content', 'courses',
    'dev_tasks', 'jobs', 'settings', 'subscriptions', 'trades'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = format('update_%s_updated_at', t)
                       AND tgrelid = format('public.%I', t)::regclass) THEN
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()',
        format('update_%s_updated_at', t), t);
    END IF;
  END LOOP;
END $$;

-- 4. businesses.status -------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_status_check'
                 AND conrelid = 'public.businesses'::regclass) THEN
    ALTER TABLE public.businesses ADD CONSTRAINT businesses_status_check
      CHECK (status IN ('active', 'new', 'pending', 'duplicate', 'quarantined', 'inactive', 'closed'))
      NOT VALID;
    ALTER TABLE public.businesses VALIDATE CONSTRAINT businesses_status_check;
  END IF;
END $$;

-- 5. orders.status default ---------------------------------------------------
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';
