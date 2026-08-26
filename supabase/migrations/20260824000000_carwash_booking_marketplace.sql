-- ============================================================================
-- Car-service booking marketplace (vertical: car wash & service).
--
-- Turns the directory's dormant `bookings` table into a real slot-booking
-- product for ONE vertical:
--
--   customer picks a vendor -> service -> date/time slot -> books.
--   Platform records a commission (basis points) snapshot per booking;
--   settlement is tracked via payment_mode/payment_status until Razorpay
--   online collection is switched on (the gateway plumbing already exists
--   for boosts — see app/api/payments/webhook/route.ts).
--
-- New tables:
--   vendor_services — what a vendor sells and at what price/duration.
--   vendor_hours    — weekly opening hours + slot length + per-slot capacity.
--
-- bookings extensions:
--   slot_start      — the actual booked instant (booking_date kept for legacy
--                     rows; new writes always set both).
--   vendor_service_id / customer_name / vehicle — what was booked, by whom.
--   commission_bps / commission_amount / vendor_payout — money split snapshot,
--                     frozen at booking time so later rate changes never
--                     rewrite history.
--   payment_mode / payment_status — pay-at-shop ledger until online payments.
--
-- Statuses widened from the baseline pending|confirmed|cancelled|completed to
-- a lifecycle that matches how a workshop actually runs:
--   requested -> confirmed -> in_progress -> completed
--   with cancelled / no_show as terminal exits. Existing rows are migrated.
--
-- Security posture follows 20260814000000_phase0_rls.sql: bookings carry
-- customer PII, so they stay service-role-only (every write path is an API
-- route). vendor_services / vendor_hours are non-sensitive catalogue data the
-- public booking page reads through the publishable key, so they get a
-- FOR SELECT grant only. This also CLOSES a hole: the baseline shipped a
-- `bookings_public_insert` policy letting anyone INSERT arbitrary rows through
-- the browser key — dropped here.
-- ============================================================================

-- ── 1. vendor_services: a vendor's bookable catalogue ──────────────────────
CREATE TABLE IF NOT EXISTS public.vendor_services (
  id uuid not null default gen_random_uuid(),
  business_id bigint not null,
  name text not null,
  description text,
  price_inr numeric(10,2) not null default 0,
  duration_minutes integer not null default 60,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  CONSTRAINT vendor_services_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_services_business_id_fkey FOREIGN KEY (business_id)
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT vendor_services_duration_check CHECK (duration_minutes BETWEEN 5 AND 600),
  CONSTRAINT vendor_services_price_check CHECK (price_inr >= 0)
);
CREATE INDEX IF NOT EXISTS idx_vendor_services_business ON public.vendor_services (business_id);

-- ── 2. vendor_hours: weekly availability template ──────────────────────────
-- One row per weekday the vendor opens (absent row = closed that day).
-- day_of_week matches JS Date.getDay(): 0=Sunday … 6=Saturday.
CREATE TABLE IF NOT EXISTS public.vendor_hours (
  business_id bigint not null,
  day_of_week smallint not null,
  open_time time not null default '09:00',
  close_time time not null default '19:00',
  slot_minutes integer not null default 60,
  capacity integer not null default 1,
  CONSTRAINT vendor_hours_pkey PRIMARY KEY (business_id, day_of_week),
  CONSTRAINT vendor_hours_business_id_fkey FOREIGN KEY (business_id)
    REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT vendor_hours_day_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT vendor_hours_window_check CHECK (close_time > open_time),
  CONSTRAINT vendor_hours_slot_check CHECK (slot_minutes >= 15),
  CONSTRAINT vendor_hours_capacity_check CHECK (capacity >= 1)
);
CREATE INDEX IF NOT EXISTS idx_vendor_hours_business ON public.vendor_hours (business_id);

-- ── 3. bookings: extend for slots, customers and money ─────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS brand_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vendor_service_id uuid;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS slot_start timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vehicle text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS commission_bps integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS vendor_payout numeric(10,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'pay_at_shop';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_brand_id_fkey' AND conrelid='public.bookings'::regclass) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_vendor_service_id_fkey' AND conrelid='public.bookings'::regclass) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_vendor_service_id_fkey FOREIGN KEY (vendor_service_id) REFERENCES public.vendor_services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Swap the status vocabulary. Order matters: the baseline check still lists
-- 'pending', so the constraint MUST be dropped before the backfill or every
-- migrated row fails its own check.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_status_check' AND conrelid='public.bookings'::regclass) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

UPDATE public.bookings SET status = 'requested' WHERE status = 'pending';

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status = ANY (ARRAY['requested','confirmed','in_progress','completed','cancelled','no_show']));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_payment_mode_check' AND conrelid='public.bookings'::regclass) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_mode_check CHECK (payment_mode = ANY (ARRAY['pay_at_shop','online']));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bookings_payment_status_check' AND conrelid='public.bookings'::regclass) THEN
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status = ANY (ARRAY['unpaid','paid','refunded']));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_slot ON public.bookings (slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_business_slot ON public.bookings (business_id, slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON public.bookings (customer_phone);

-- ── 4. Lock bookings down; publish read-only catalogue tables ───────────────
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name::text FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('bookings','vendor_services','vendor_hours')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- No anon/authenticated direct access at all…
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role', t);
    -- …except public reads of the two catalogue tables the booking page needs.
    IF t IN ('vendor_services','vendor_hours') THEN
      EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

-- Baseline allowed anonymous INSERTs into bookings via the browser key. With
-- the grants revoked above this policy is dead weight — remove it so it can't
-- be resurrected by a future GRANT.
DROP POLICY IF EXISTS bookings_public_insert ON public.bookings;

-- ── 5. The vertical brand row ───────────────────────────────────────────────
-- One category, one brand: car wash & service in Indore. Commission lives in
-- features.commission_bps so ops can change the take-rate without a deploy;
-- each booking freezes its own copy anyway.
INSERT INTO public.brands (
  slug, name, domain, category, emoji, tagline, description,
  theme, features, status, sort_order,
  seo_title, seo_description,
  booking_enabled, quote_enabled, checkout_enabled, chat_enabled,
  page_flags
) VALUES (
  'sarkarcars',
  'SarkarCars',
  'sarkarcars.cashcard.live',
  'car-services',
  '🚗',
  'Indore ka car wash aur service — slot book karein',
  'Book car wash, detailing and service slots at verified Indore workshops. Transparent prices, instant confirmation, pay at the shop.',
  '{"primary":"#1d4ed8","secondary":"#3b82f6","accent":"#93c5fd","bg":"#f8fafc"}'::jsonb,
  '{"leads":true,"payments":true,"listings":true,"events":true,"commission_bps":1500}'::jsonb,
  'active',
  25,
  'Car Wash & Service in Indore — Book a Slot Online | SarkarCars',
  'Book car wash, detailing and repair slots at verified Indore workshops. Live availability, instant confirmation, pay at the shop.',
  true, false, false, false,
  '{"marketplace":true,"categories":true,"about":true,"contact":true,"faq":true,"reviews":true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  emoji = EXCLUDED.emoji,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  theme = EXCLUDED.theme,
  features = EXCLUDED.features,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  booking_enabled = true,
  updated_at = now();
