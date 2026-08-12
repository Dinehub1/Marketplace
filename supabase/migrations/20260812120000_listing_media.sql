-- Listing media + review volume + query-performance hardening.
--
-- Background
-- ---------
-- The Google Maps CSVs under "GMaps Data/" have always carried image_url and
-- reviews_count; scripts/import-geoghost.mjs discarded both. Without them every
-- listing renders as an identical generic icon with a bare "★ 5" (64% of rows
-- have a null rating, and the sort is rating.desc), which is why category pages
-- are unscannable.
--
-- This migration is idempotent (safe to re-run): every statement uses
-- "if not exists". Run it in Supabase -> SQL Editor, or `psql -f` it.
--
-- image_path is deliberately NOT added: only 6 of 1,865 source rows populate it.

-- 1. Columns -----------------------------------------------------------------
alter table public.businesses
  add column if not exists image_url     text,
  add column if not exists reviews_count integer;

comment on column public.businesses.image_url is
  'Google Maps photo URL from the source scrape. Display only; may expire.';
comment on column public.businesses.reviews_count is
  'Number of Google reviews behind `rating`. Never render a rating without it.';

-- 2. Integrity ---------------------------------------------------------------
-- A bare "★ 5" with no review count is misleading; constrain both.
-- NOTE: `ADD CONSTRAINT` has no `IF NOT EXISTS` in Postgres, so guard with a
-- DO block that checks pg_constraint before adding (keeps this re-runnable).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_rating_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_rating_check
      check (rating is null or (rating >= 0 and rating <= 5));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'businesses_reviews_check'
      and conrelid = 'public.businesses'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_reviews_check
      check (reviews_count is null or reviews_count >= 0);
  end if;
end $$;

-- 3. Indexes for the real query patterns ------------------------------------
-- "Listings good enough to rank", browsed by category then rating. This is the
-- common category-page scan + sort.
create index if not exists businesses_rated_idx
  on public.businesses (category, rating desc nulls last)
  where status = 'active' and rating is not null;

-- Every directory request filters status = 'active'. Anchor that.
create index if not exists businesses_active_status_idx
  on public.businesses (status)
  where status = 'active';

-- City pitch + /marketplace?city= filtering (homepage work). The app code still
-- needs to pass the city param; this index makes the filter cheap.
create index if not exists businesses_city_idx
  on public.businesses (city, rating desc nulls last)
  where status = 'active';

-- Brand scoping for multi-tenant queries.
create index if not exists businesses_brand_idx
  on public.businesses (brand_id)
  where status = 'active';

-- Free-text search: name/category `ilike '%term%'`. pg_trgm GIN turns a seq
-- scan into an index scan as the table grows.
create extension if not exists pg_trgm;
create index if not exists businesses_name_trgm_idx
  on public.businesses using gin (name gin_trgm_ops);
create index if not exists businesses_category_trgm_idx
  on public.businesses using gin (category gin_trgm_ops);
