-- Product orders: tie a paid order to the job it unlocks.
--
-- Background
-- ----------
-- `orders` was designed as (product, phone, amount_paise, razorpay_order_id,
-- status, credits_granted) with no reference to the thing that was bought. That
-- is fine for a credit wallet, but the passport-photo paywall is per *job*: the
-- clean sheet must be released for the job the customer paid for, and for no
-- other. Without a link, "paid" can only be answered per phone, so two jobs on
-- one phone become indistinguishable and an order cannot be refunded, audited or
-- retried against the right artifact.
--
-- This migration only adds a nullable column, a foreign key and an index.
-- Existing rows (there are none) and every other table are untouched.
--
-- Idempotent: safe to re-run. Apply in Supabase -> SQL Editor, `psql -f`, or
-- POST it to /v1/projects/<ref>/database/query like the repo's other scripts.

-- 1. Column ------------------------------------------------------------------
alter table public.orders
  add column if not exists job_id bigint;

comment on column public.orders.job_id is
  'product_jobs row this payment unlocks. Null for wallet/credit purchases that are not tied to one job.';

-- 2. Integrity ---------------------------------------------------------------
-- Deleting a job must not delete the money trail: SET NULL, not CASCADE.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_job_id_fkey' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_job_id_fkey foreign key (job_id)
      references public.product_jobs(id) on delete set null;
  end if;
end $$;

-- 3. Lookups -----------------------------------------------------------------
-- The gate asks "is there a paid order for this job for this phone?" on every
-- download, so that is the index that matters.
create index if not exists idx_orders_job_id on public.orders (job_id);

create index if not exists idx_orders_razorpay_order_id on public.orders (razorpay_order_id);

-- 4. Status vocabulary -------------------------------------------------------
-- The webhook and the checkout-verify route both flip rows to 'paid'; a replay
-- test that must not be mistaken for real money uses 'test_replay'.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_status_check' and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_check
      check (status in ('pending', 'paid', 'failed', 'refunded', 'test_replay'));
  end if;
end $$;
