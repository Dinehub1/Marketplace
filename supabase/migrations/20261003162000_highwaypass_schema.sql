-- ==============================================================================
-- HighwayPass Schema Migration
-- Project: Marketplace Core (xpfmqpmhmcouwzebfwhb)
-- Tables: passes, auth_otps, and payments extensions
-- ==============================================================================

-- 1. Create auth_otps table for phone OTP verification
CREATE TABLE IF NOT EXISTS public.auth_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  otp_code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write auth_otps (prevents public OTP snooping)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_otps' AND policyname = 'service_role_all_auth_otps'
  ) THEN
    CREATE POLICY service_role_all_auth_otps ON public.auth_otps
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Create passes table for FASTag annual passes
CREATE TABLE IF NOT EXISTS public.passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vrn text NOT NULL,
  fastag_id text NOT NULL,
  vehicle_class text NOT NULL DEFAULT 'Private Car',
  issuer_bank text,
  price numeric NOT NULL DEFAULT 3000,
  trips_total integer NOT NULL DEFAULT 200,
  trips_used integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  activated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices for rapid pass lookups
CREATE INDEX IF NOT EXISTS idx_passes_user_id ON public.passes(user_id);
CREATE INDEX IF NOT EXISTS idx_passes_vrn ON public.passes(vrn);
CREATE INDEX IF NOT EXISTS idx_passes_status ON public.passes(status);

ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;

-- RLS policies for passes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passes' AND policyname = 'passes_select_own'
  ) THEN
    CREATE POLICY passes_select_own ON public.passes
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passes' AND policyname = 'passes_insert_own'
  ) THEN
    CREATE POLICY passes_insert_own ON public.passes
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passes' AND policyname = 'passes_update_own'
  ) THEN
    CREATE POLICY passes_update_own ON public.passes
      FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'passes' AND policyname = 'passes_service_role'
  ) THEN
    CREATE POLICY passes_service_role ON public.passes
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Extend payments table for user_id, pass_id, and reference_id
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pass_id uuid REFERENCES public.passes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reference_id text;

-- Drop and recreate the status check to allow 'SUCCESS' / 'success' / 'paid' / 'pending' / 'failed'
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'SUCCESS'::text, 'success'::text]));

-- RLS policies for payments so authenticated users can insert and view their own transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_select_own'
  ) THEN
    CREATE POLICY payments_select_own ON public.payments
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'payments_insert_own'
  ) THEN
    CREATE POLICY payments_insert_own ON public.payments
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_pass_id ON public.payments(pass_id);
