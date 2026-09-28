-- ============================================================================
-- Reviews table (production history name: create_reviews_table).
--
-- Production recorded version 20260624191033 as `create_reviews_table`, but this file
-- used to hold `dev_tasks_admin_grants` (GRANT INSERT/UPDATE on dev_tasks and UPDATE on
-- agents to anon/authenticated). Those grants were never applied under this version on
-- production, and later migrations lock both tables to the service role anyway. The
-- file now carries what production actually ran, so a fresh database matches it.
--
-- The policies here are superseded by 20260928000005_tighten_read_policies.sql.
-- Existence-guarded and idempotent: the baseline already creates all of this.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  business_id BIGINT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Public can read approved reviews') THEN
    CREATE POLICY "Public can read approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Authenticated users can submit reviews') THEN
    CREATE POLICY "Authenticated users can submit reviews" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Users can update own reviews') THEN
    CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Users can delete own reviews') THEN
    CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Admins can manage all reviews') THEN
    CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL
      USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
