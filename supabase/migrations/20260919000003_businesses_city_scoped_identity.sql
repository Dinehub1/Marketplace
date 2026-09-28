-- City-scoped business identity (multi-city rollout).
--
-- businesses_name_phone_uniq keyed on (lower(name), COALESCE(phone,'')) alone, so
-- one business name+phone could not exist in two cities. The second insert failed
-- with 23505, and because the importer sends fresh rows with no conflict target,
-- that single collision aborted the entire import run.
--
-- place_id stays globally unique. That is deliberate and is what makes cross-city
-- dedup correct: a Google place_id identifies one physical location anywhere.
--
-- Safe on existing data. Every row is city='Indore' and there are zero
-- (name, phone) collisions, so the tighter index holds unchanged.
-- Verified 2026-09-19 against the live table:
--   total = 24810, distinct (lower(name), coalesce(phone,''),
--   lower(coalesce(city,''))) = 24810.
--
-- No application code upserts on name|phone - the GeoGhost importer uses
-- on_conflict=id, and the only other on_conflict targets in the repo are
-- unrelated tables (wellness token_hash,client_id; templates template_id,language;
-- carwash slug). Reversible in one statement.

DROP INDEX IF EXISTS public.businesses_name_phone_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_name_phone_city_uniq
  ON public.businesses
  USING btree (lower(name), COALESCE(phone, ''::text), lower(COALESCE(city, ''::text)));
