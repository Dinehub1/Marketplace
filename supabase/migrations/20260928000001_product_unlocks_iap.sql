-- ============================================================================
-- `product_unlocks` records store purchases (Apple / Google billing via RevenueCat).
--
-- Inside the iOS/Android apps a clean file is a digital good, so it must be sold through
-- the store's own billing (Apple 3.1.1, Play Payments policy) — the Razorpay paywall
-- (`orders`) stays for the website. A store purchase is a third kind of proof, and like
-- the rewarded ad it names itself in `source`:
--
--   rewarded_ad       the phone claimed an ad completion (P1; no longer grants on its own)
--   rewarded_ad_ssv   AdMob's server signed a completion
--   app_store         RevenueCat confirmed an App Store purchase (secret-key lookup)
--   play_store        RevenueCat confirmed a Play purchase
--
-- `store_transaction_id` holds RevenueCat's id for the transaction and is unique: one
-- purchase opens one file, ever. `unique (job_id)` still means one unlock per file.
-- `is_sandbox` separates App Review / TestFlight purchases from sales.
--
-- Idempotent: safe to re-run.
-- ============================================================================

alter table public.product_unlocks
  drop constraint if exists product_unlocks_source_check;
alter table public.product_unlocks
  add constraint product_unlocks_source_check
  check (source in ('rewarded_ad', 'rewarded_ad_ssv', 'app_store', 'play_store'));

alter table public.product_unlocks add column if not exists store_transaction_id text;
alter table public.product_unlocks add column if not exists iap_product_id text;
alter table public.product_unlocks add column if not exists is_sandbox boolean;

create unique index if not exists product_unlocks_store_txn
  on public.product_unlocks (store_transaction_id)
  where store_transaction_id is not null;

comment on column public.product_unlocks.store_transaction_id is
  'RevenueCat transaction id for a store purchase (app_store / play_store). Unique: one purchase unlocks one file.';
comment on column public.product_unlocks.is_sandbox is
  'True for sandbox purchases (App Review, TestFlight, license testers) — not revenue.';
comment on table public.product_unlocks is
  'How each clean file was released when not through a Razorpay order: a verified rewarded ad or a verified store purchase. One row per file (unique job_id), one file per store purchase (unique store_transaction_id), source-constrained, service-role only. The clean URL is derived from product_jobs at read time and never stored here.';
