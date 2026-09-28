-- Retire the "Sarkar" brand names.
--
-- The name is not ours to use, so the 18 Sarkar* websites take new names. The code
-- (apps/web/proxy.ts) 308-redirects every old subdomain to its new one, and
-- *.dropby.co.in is a proxied wildcard on Cloudflare, so no DNS record is needed.
--
-- Rows are keyed by uuid everywhere (`brand_id`), so renaming the slug orphans
-- nothing. The only slug-keyed columns are brands.slug/folder/domain,
-- business_events.brand_slug and apps.slug, all handled below.
--
-- The `apps` row 'sarkar-marketplace' is deliberately NOT renamed: it mirrors the
-- Expo/EAS project slug, which EAS does not allow to change.

begin;

create temp table _brand_rename (old_slug text, old_name text, new_slug text, new_name text) on commit drop;
insert into _brand_rename values
  ('sarkarmarketplace','SarkarMarketplace','sheharbazaar','Shehar Bazaar'),
  ('sarkarbazaar','SarkarBazaar','thokbazaar','Thok Bazaar'),
  ('sarkarmart','SarkarMart','haatmart','Haat Mart'),
  ('sarkardukaan','SarkarDukaan','dukaandigital','Dukaan Digital'),
  ('sarkarcars','SarkarCars','gaadighar','Gaadi Ghar'),
  ('sarkarconnect','SarkarConnect','vyaparsetu','Vyapar Setu'),
  ('sarkardost','SarkarDost','padosi','Padosi'),
  ('sarkared','SarkarEd','padhaipath','Padhai Path'),
  ('sarkarskills','SarkarSkills','hunarhub','Hunar Hub'),
  ('sarkarghar','SarkarGhar','mistrimitra','Mistri Mitra'),
  ('sarkarhealth','SarkarHealth','swasthpath','Swasth Path'),
  ('sarkarjobs','SarkarJobs','rozgarpath','Rozgar Path'),
  ('sarkarlegal','SarkarLegal','nyaysaathi','Nyay Saathi'),
  ('sarkartravel','SarkarTravel','safarsaathi','Safar Saathi'),
  ('sarkarwellness','SarkarWellness','tandrust','Tandrust'),
  ('sarkarsarkar','SarkarSarkar','yojanasaathi','Yojana Saathi'),
  ('sarkarpay','SarkarPay','kadampay','Kadam Pay'),
  ('sarkarfinance','SarkarFinance','loansaathi','Loan Saathi'),
  ('sarkarfood','SarkarFood','swaadghar','Swaad Ghar'),
  ('sarkar-ai','Sarkar AI','ustaad-ai','Ustaad AI');

-- 1. Identity columns.
update brands b
   set slug   = r.new_slug,
       name   = r.new_name,
       folder = case when b.folder is null then null else r.new_slug end,
       domain = 'https://' || r.new_slug || '.dropby.co.in'
  from _brand_rename r
 where b.slug = r.old_slug;

-- 2. Copy: every text column that can carry the old name, then the shared-login
--    wording ("Sarkar ID" / "Sarkar brands") that was never a brand of its own.
do $$
declare r record;
begin
  for r in select * from _brand_rename loop
    update brands set
      tagline         = replace(replace(tagline, r.old_name, r.new_name), 'Sarkar Marketplace', 'Shehar Bazaar'),
      description     = replace(description, r.old_name, r.new_name),
      seo_title       = replace(seo_title, r.old_name, r.new_name),
      seo_description = replace(seo_description, r.old_name, r.new_name),
      about_text      = replace(about_text, r.old_name, r.new_name),
      mission_text    = replace(mission_text, r.old_name, r.new_name),
      faq_json        = replace(faq_json::text, r.old_name, r.new_name)::jsonb
    where tagline like '%Sarkar%' or description like '%Sarkar%' or seo_title like '%Sarkar%'
       or seo_description like '%Sarkar%' or about_text like '%Sarkar%'
       or mission_text like '%Sarkar%' or faq_json::text like '%Sarkar%';
  end loop;
end $$;

update brands set
  about_text      = replace(replace(about_text, 'Sarkar ID', 'Dropby ID'), 'Sarkar brands', 'Dropby brands'),
  seo_description = replace(replace(seo_description, 'Sarkar ID', 'Dropby ID'), 'Sarkar brands', 'Dropby brands')
where about_text like '%Sarkar%' or seo_description like '%Sarkar%';

-- 3. Other slug-keyed tables.
update business_events e set brand_slug = r.new_slug
  from _brand_rename r where e.brand_slug = r.old_slug;

update apps a set slug = r.new_slug
  from _brand_rename r where a.slug = r.old_slug;

-- Anything still mentioning the old name means the mapping above missed a case.
do $$
declare n int;
begin
  select count(*) into n from brands where to_jsonb(brands)::text ilike '%sarkar%';
  if n > 0 then
    raise notice '% brand row(s) still mention "sarkar" — review before relying on this rename', n;
  end if;
end $$;

commit;
