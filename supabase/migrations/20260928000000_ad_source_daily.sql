-- ============================================================================
-- Ad monetisation · per-network revenue, from AdMob's own mediation report.
--
-- Why a second table beside ad_events: with AppLovin and InMobi bidding inside
-- the AdMob auction, the app no longer knows who won an impression —
-- react-native-google-mobile-ads does not expose the winning ad source for
-- full-screen formats, so ad_events now records those impressions as
-- network = 'unknown'. AdMob does know, and reports it per ad source in the
-- mediation report. That report is also what AdMob pays out on, so it is the
-- right source for "which network paid more" anyway.
--
-- Filled by POST /api/admin/ad-source-sync (apps/web/lib/admob-report.ts), which
-- re-pulls a rolling window of recent days: AdMob revises estimated earnings for a
-- few days after the fact, so rows are upserted, never appended.
--
-- One row per day × app × platform × ad source × format × country.
--
-- Access posture matches ad_events: service role only, RLS default-deny.
-- Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.ad_source_daily (
  day               date not null,
  -- AdMob app id (ca-app-pub-…~…) and its display name at sync time.
  app_id            text not null,
  app_name          text,
  -- 'ANDROID' | 'IOS', as AdMob reports it.
  platform          text not null,
  -- AdMob's ad source id and label, e.g. 'AppLovin (bidding)'.
  ad_source_id      text not null,
  ad_source_name    text,
  -- Our network id, mapped from the label: 'admob' | 'applovin' | 'inmobi' | 'other'.
  network           text not null,
  -- AdMob's format name: 'REWARDED', 'INTERSTITIAL', 'BANNER', …
  format            text not null,
  -- ISO 3166 alpha-2, as AdMob reports it.
  country           text not null,
  ad_requests       bigint,
  matched_requests  bigint,
  impressions       bigint,
  clicks            bigint,
  -- Estimated earnings in micros of `currency` (the sync asks for USD).
  earnings_micros   bigint,
  currency          text not null default 'USD',
  synced_at         timestamp with time zone not null default now(),
  primary key (day, app_id, platform, ad_source_id, format, country)
);

create index if not exists ad_source_daily_network_day_idx
  on public.ad_source_daily (network, day desc);

alter table public.ad_source_daily enable row level security;

revoke all on public.ad_source_daily from anon, authenticated;
grant select, insert, update, delete on public.ad_source_daily to service_role;

comment on table public.ad_source_daily is
  'Per-ad-source daily earnings from the AdMob Mediation Report API, upserted by /api/admin/ad-source-sync. The source for per-network eCPM once bidders are in the auction.';

-- ----------------------------------------------------------------------------
-- The ranking: which network earned what, per format and country and day.
-- eCPM = earnings per 1,000 impressions, in micros; NULL when nothing was shown.
-- ----------------------------------------------------------------------------
create or replace view public.ad_source_performance as
select
  day,
  network,
  format,
  country,
  sum(ad_requests)      as ad_requests,
  sum(matched_requests) as matched_requests,
  sum(impressions)      as impressions,
  sum(clicks)           as clicks,
  sum(earnings_micros)  as earnings_micros,
  case
    when sum(impressions) > 0 then (sum(earnings_micros) * 1000 / sum(impressions))::bigint
    else null
  end as ecpm_micros,
  currency
from public.ad_source_daily
group by day, network, format, country, currency;

comment on view public.ad_source_performance is
  'Per network × format × country × day earnings and eCPM (micros), from ad_source_daily.';

revoke all on public.ad_source_performance from anon, authenticated;
grant select on public.ad_source_performance to service_role;
