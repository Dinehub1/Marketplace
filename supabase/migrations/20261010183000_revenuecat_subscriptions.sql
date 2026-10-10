-- ============================================================================
-- RevenueCat In-App Purchases & Subscriptions Mirror
--
-- Mirrors webhook events from RevenueCat (Apple App Store, Google Play Store,
-- Stripe, and Test Store) directly into PostgreSQL.
--
-- Architecture & Invariants:
--   1. `public.user_subscriptions`: Stores current active/cancelled/expired
--      subscription state keyed by `(app_user_id, product_id)`.
--      - `app_user_id` supports any identifier: phone numbers (e.g. '917566636666'),
--        Supabase auth UUIDs, or anonymous RevenueCat IDs ('$RCAnonymousID:...').
--      - `entitlement_ids` stores an array of unlocked entitlements (e.g. ['pdf_pro']).
--   2. `public.revenuecat_webhook_events`: Append-only audit log keyed by unique
--      RevenueCat `event_id` to guarantee strict idempotency (webhook retries
--      are deduplicated).
--   3. `public.check_user_entitlement(user_id, entitlement)`: Fast SQL helper function
--      for any backend route or client to check if a user has an active entitlement.
--   4. Access Posture: Service-role write only (via Edge Function); authenticated
--      users can only read their own rows.
--
-- Idempotent: Safe to re-run.
-- ============================================================================

-- 1. Main Current State Table ------------------------------------------------
create table if not exists public.user_subscriptions (
  id                          uuid primary key default gen_random_uuid(),
  app_user_id                 text not null,
  original_app_user_id        text,
  aliases                     text[] not null default '{}',
  product_id                  text not null,
  entitlement_ids             text[] not null default '{}',
  status                      text not null default 'active'
                              check (status in ('active', 'cancelled', 'expired', 'in_grace_period', 'paused', 'billing_issue', 'refunded')),
  store                       text,
  environment                 text not null default 'PRODUCTION',
  is_sandbox                  boolean not null default false,
  period_type                 text,
  purchased_at                timestamp with time zone,
  expires_at                  timestamp with time zone,
  grace_period_expires_at     timestamp with time zone,
  auto_resume_at              timestamp with time zone,
  cancel_reason               text,
  original_transaction_id     text,
  latest_transaction_id       text,
  price_in_purchased_currency numeric,
  currency                    text,
  latest_event_id             text,
  latest_event_type           text,
  metadata                    jsonb not null default '{}'::jsonb,
  created_at                  timestamp with time zone not null default now(),
  updated_at                  timestamp with time zone not null default now(),
  constraint user_subscriptions_user_product_key unique (app_user_id, product_id)
);

comment on table public.user_subscriptions is
  'Current subscription state mirrored from RevenueCat webhooks across iOS, Android, and web billing.';

-- Indexes for lightning-fast queries
create index if not exists idx_user_subscriptions_app_user_id
  on public.user_subscriptions (app_user_id);

create index if not exists idx_user_subscriptions_status_expires
  on public.user_subscriptions (status, expires_at);

create index if not exists idx_user_subscriptions_entitlements
  on public.user_subscriptions using gin (entitlement_ids);

create index if not exists idx_user_subscriptions_aliases
  on public.user_subscriptions using gin (aliases);

create index if not exists idx_user_subscriptions_orig_txn
  on public.user_subscriptions (original_transaction_id);


-- 2. Audit Trail & Deduplication Table ---------------------------------------
create table if not exists public.revenuecat_webhook_events (
  id                          uuid primary key default gen_random_uuid(),
  event_id                    text not null unique,
  event_type                  text not null,
  app_user_id                 text not null,
  original_app_user_id        text,
  product_id                  text,
  entitlement_ids             text[] not null default '{}',
  store                       text,
  environment                 text,
  payload                     jsonb not null,
  created_at                  timestamp with time zone not null default now()
);

comment on table public.revenuecat_webhook_events is
  'Append-only audit log of raw RevenueCat webhook events. Enforces unique event_id for idempotency.';

create index if not exists idx_rc_events_app_user_id
  on public.revenuecat_webhook_events (app_user_id);

create index if not exists idx_rc_events_created_at
  on public.revenuecat_webhook_events (created_at desc);


-- 3. Entitlement Check Function ----------------------------------------------
-- Fast helper function callable by Postgres queries or Supabase RPC.
-- Returns true if the user has an active, non-expired grant for the entitlement.
create or replace function public.check_user_entitlement(
  p_app_user_id text,
  p_entitlement text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions
    where (
      app_user_id = p_app_user_id
      or p_app_user_id = any(aliases)
      or original_app_user_id = p_app_user_id
    )
    and p_entitlement = any(entitlement_ids)
    and status in ('active', 'in_grace_period', 'cancelled')
    and (expires_at is null or expires_at > now())
  );
$$;

comment on function public.check_user_entitlement(text, text) is
  'Checks whether a given user ID, phone, or alias holds an active grant for the specified entitlement.';


-- 4. Row Level Security & Permissions -----------------------------------------
alter table public.user_subscriptions enable row level security;
alter table public.revenuecat_webhook_events enable row level security;

-- Drop existing policies if re-running
drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
drop policy if exists user_subscriptions_service_all on public.user_subscriptions;
drop policy if exists rc_events_service_all on public.revenuecat_webhook_events;

-- Users can read their own subscriptions (by UUID or phone from JWT)
create policy user_subscriptions_select_own on public.user_subscriptions
  for select
  to authenticated
  using (
    app_user_id = auth.uid()::text
    or app_user_id = coalesce(auth.jwt() ->> 'phone', '')
    or coalesce(auth.jwt() ->> 'phone', '') = any(aliases)
  );

-- Service role has full access (used by Edge Functions and backend processes)
create policy user_subscriptions_service_all on public.user_subscriptions
  for all
  to service_role
  using (true)
  with check (true);

create policy rc_events_service_all on public.revenuecat_webhook_events
  for all
  to service_role
  using (true)
  with check (true);

-- Grant privileges
revoke all on public.user_subscriptions from anon, authenticated;
grant select on public.user_subscriptions to authenticated;
grant all on public.user_subscriptions to service_role;

revoke all on public.revenuecat_webhook_events from anon, authenticated;
grant all on public.revenuecat_webhook_events to service_role;

grant execute on function public.check_user_entitlement(text, text) to anon, authenticated, service_role;
