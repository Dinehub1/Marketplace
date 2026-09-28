-- ============================================================================
-- Product tables: products, product_jobs, orders, wallets, app_users.
--
-- These five were created on production directly (SQL editor), never in a migration,
-- so 20260915000000_product_orders.sql — the first migration to touch `orders` —
-- failed on a fresh database with `relation "public.orders" does not exist`, and
-- `supabase db reset` could not rebuild the schema.
--
-- The definitions below are production's, as they stood before the later migrations
-- added to them (orders.job_id, product_jobs.preview_key, product_jobs.meta, the
-- orders status check and indexes). Those migrations are guarded and still apply.
--
-- Access: RLS on, and every read and write goes through the service role
-- (apps/web/lib/nextel.ts `db()`). The one client read is the public product
-- catalogue. Client grants are tightened in 20260928000005_tighten_read_policies.sql.
--
-- Existence-guarded and idempotent: a no-op on production.
-- ============================================================================

create table if not exists public.products (
  slug        text primary key,
  name        text not null,
  tagline     text,
  category    text,
  icon        text,
  price_paise integer not null default 0,
  plan        text not null default 'one_time',
  cost_model  text not null default 'free_local',
  kind        text not null default 'product',
  enabled     boolean not null default true,
  sort_order  integer,
  created_at  timestamp with time zone not null default now()
);

create table if not exists public.product_jobs (
  id          bigserial primary key,
  product     text not null references public.products (slug),
  phone       text,
  input_key   text,
  output_key  text,
  status      text not null default 'queued',
  error       text,
  duration_ms integer,
  created_at  timestamp with time zone not null default now(),
  finished_at timestamp with time zone
);

create index if not exists product_jobs_product_created_idx
  on public.product_jobs (product, created_at desc);

create table if not exists public.orders (
  id                  bigserial primary key,
  product             text not null references public.products (slug),
  phone               text,
  amount_paise        integer not null,
  razorpay_order_id   text,
  razorpay_payment_id text,
  status              text not null default 'created',
  credits_granted     integer,
  created_at          timestamp with time zone not null default now()
);

create table if not exists public.wallets (
  phone         text primary key,
  credits       integer not null default 0,
  balance_paise integer not null default 0,
  updated_at    timestamp with time zone not null default now()
);

create table if not exists public.app_users (
  phone      text primary key,
  name       text,
  email      text,
  city       text,
  created_at timestamp with time zone not null default now(),
  last_seen  timestamp with time zone not null default now()
);

alter table public.products     enable row level security;
alter table public.product_jobs enable row level security;
alter table public.orders       enable row level security;
alter table public.wallets      enable row level security;
alter table public.app_users    enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='products are public') then
    create policy "products are public" on public.products for select using (true);
  end if;
end $$;
