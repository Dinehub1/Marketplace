-- ============================================================================
-- Phase 0 · Real payments: link a payment to the listing it boosts, and record
-- the gateway order id so the webhook can reconcile idempotently.
--
-- The baseline `payments` table only had brand_id/app_id (no business_id), so a
-- boost payment could not be attributed to the specific listing it featured.
-- ============================================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS business_id bigint,
  ADD COLUMN IF NOT EXISTS gateway text NOT NULL DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS gateway_order_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_business_id_fkey'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_business_id_fkey
      FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Status domain: pending -> paid | failed. Baseline defaulted to 'pending'.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_status_check'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_status_check
      CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text]));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pay_business ON public.payments USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_pay_gateway_order ON public.payments USING btree (gateway_order_id);
