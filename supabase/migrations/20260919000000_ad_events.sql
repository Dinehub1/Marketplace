-- ============================================================================
-- Ad monetisation · first-party impression ledger.
--
-- Why this table exists, in one line: the networks' own dashboards are aggregated
-- across every publisher they have, and the only question this project actually
-- needs answered is "for THIS app, THIS placement and THIS country, which network
-- paid more?" — which no vendor report can answer for us.
--
-- It is the record behind the whole design (docs/ad-monetisation/ad-sdk-and-
-- placement-design.md §6): the SDK records every request/fill/impression/reward/
-- error, the network reports the winning price per impression through Google's
-- impression-level ad revenue API, and the Networks screen ranks networks by that
-- measured price — never by a vendor blog's claimed eCPM.
--
-- Two columns carry the honesty of the whole thing:
--
--   * `is_test` — demo-unit impressions are recorded so the pipeline can be proven
--     before any ad account exists, and labelled so they can never be averaged into
--     the eCPM that decides where money goes.
--   * `revenue_micros` NULL vs 0 — NULL means the network did not report a value.
--     Averaging "not measured" in as zero makes a good network look like a bad one,
--     which is the one way this data could actively mislead.
--
-- Access posture (matches the Phase 0 hardening and business_events):
--   * writes and reads go through the API routes on the service role;
--   * anon/authenticated get NO access — the publishable key in a client binary
--     must not be able to read or forge revenue data;
--   * RLS is enabled default-deny; the service role bypasses RLS.
--
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.ad_events (
  id             bigserial primary key,
  created_at     timestamp with time zone not null default now(),
  -- The store listing this happened in: 'block-clear', 'passport-photo', …
  app_target     text not null,
  platform       text not null,
  -- A moment, not a screen: 'game.blockclear.stuck', 'job.unlock-rewarded'.
  placement      text not null,
  format         text not null,
  event          text not null,
  -- The WINNING network for an impression, as reported by the mediation host.
  network        text,
  ad_unit_id     text,
  -- Impression-level revenue in micros. NULL = the network did not report one.
  revenue_micros bigint,
  currency       text,
  latency_ms     integer,
  error_code     text,
  error_message  text,
  is_test        boolean not null default false,
  -- 'unknown' | 'personalized' | 'non-personalized' | 'denied'
  consent_state  text not null default 'unknown',
  -- Joins an impression to one run of the app: "that particular time and audience".
  session_id     text,
  country        text,
  constraint ad_events_format_check
    check (format in ('rewarded','interstitial','banner','native','appOpen')),
  constraint ad_events_event_check
    check (event in ('request','fill','impression','click','reward','error','cap_blocked'))
);

-- The screen's main query: one app, most recent first.
create index if not exists ad_events_app_created_idx
  on public.ad_events (app_target, created_at desc);

-- "Which network won, and for how much, per format and country" — the ranking.
create index if not exists ad_events_network_format_idx
  on public.ad_events (network, format, created_at desc);

create index if not exists ad_events_placement_created_idx
  on public.ad_events (placement, created_at desc);

-- Error triage: "why is fill dropping on this placement".
create index if not exists ad_events_error_idx
  on public.ad_events (error_code, created_at desc)
  where error_code is not null;

alter table public.ad_events enable row level security;

revoke all on public.ad_events from anon, authenticated;
grant select, insert, update, delete on public.ad_events to service_role;
revoke all on sequence public.ad_events_id_seq from anon, authenticated;
grant usage, select on sequence public.ad_events_id_seq to service_role;

comment on table public.ad_events is
  'First-party ad impression ledger from apps/mobile/lib/ads. One row per request/fill/impression/reward/error. is_test marks demo-unit rows; revenue_micros NULL means the network did not report a value (do not treat as zero).';

-- ----------------------------------------------------------------------------
-- Measured network performance — the only source the "who pays more" decision
-- may read. Deliberately excludes test rows and impressions with no reported
-- revenue, so a NULL can never drag an average toward zero.
--
-- One row per app × network × format × country × day. A view, not a table: it is
-- derived from the ledger and there is no second copy to keep in step.
-- ----------------------------------------------------------------------------
create or replace view public.ad_network_performance as
select
  app_target,
  network,
  format,
  country,
  date_trunc('day', created_at) as day,
  count(*) filter (where event = 'request')    as requests,
  count(*) filter (where event = 'fill')       as fills,
  count(*) filter (where event = 'impression') as impressions,
  count(*) filter (where event = 'reward')     as rewards,
  count(*) filter (where event = 'error')      as errors,
  -- eCPM for the day, in micros, from impressions that actually reported revenue.
  case
    when count(*) filter (where event = 'impression' and revenue_micros is not null) > 0
    then sum(revenue_micros) filter (where event = 'impression' and revenue_micros is not null)
         / count(*) filter (where event = 'impression' and revenue_micros is not null)
    else null
  end as ecpm_micros,
  sum(revenue_micros) filter (where event = 'impression' and revenue_micros is not null) as revenue_micros
from public.ad_events
where not is_test
group by app_target, network, format, country, date_trunc('day', created_at);

comment on view public.ad_network_performance is
  'Measured eCPM/requests/fill per app × network × format × country × day, excluding test rows and unreported revenue. The only source the network-ranking decision reads.';

revoke all on public.ad_network_performance from anon, authenticated;
grant select on public.ad_network_performance to service_role;
