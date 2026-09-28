# Brand names — the Sarkar rename

Written 2026-09-29. The "Sarkar" name was not ours to use, so the 20 `Sarkar*` websites were renamed.
The other eight brands (PaisaFlow, FollowUp, YaadRakh, Cloud Player, Mera Ayurvedic, SikshaHub,
Hyperframes Real Estate, JustDial Agent) and the platform domain are unchanged. The shared login that was
called "Sarkar ID" is now "Dropby ID".

## Old → new

| Old slug | New slug | Display name |
|---|---|---|
| sarkarmarketplace | sheharbazaar | Shehar Bazaar |
| sarkarbazaar | thokbazaar | Thok Bazaar |
| sarkarmart | haatmart | Haat Mart |
| sarkardukaan | dukaandigital | Dukaan Digital |
| sarkarcars | gaadighar | Gaadi Ghar |
| sarkarconnect | vyaparsetu | Vyapar Setu |
| sarkardost | padosi | Padosi |
| sarkared | padhaipath | Padhai Path |
| sarkarskills | hunarhub | Hunar Hub |
| sarkarghar | mistrimitra | Mistri Mitra |
| sarkarhealth | swasthpath | Swasth Path |
| sarkarjobs | rozgarpath | Rozgar Path |
| sarkarlegal | nyaysaathi | Nyay Saathi |
| sarkartravel | safarsaathi | Safar Saathi |
| sarkarwellness | tandrust | Tandrust |
| sarkarsarkar | yojanasaathi | Yojana Saathi |
| sarkarpay | kadampay | Kadam Pay |
| sarkar-ai | ustaad-ai | Ustaad AI |
| sarkarfinance | loansaathi | Loan Saathi |
| sarkarfood | swaadghar | Swaad Ghar |

Names were chosen for this rename and have **not** had a trademark search. Do one before publishing marketing.

## Where it lives

- Web: static folders `apps/web/public/sites/<slug>/`, `apps/web/lib/site-folders.ts`, the per-brand sitemap in
  `apps/web/lib/brand-sitemap.ts`, category ownership in `packages/core/src/brand-scope.ts`.
- Old hostnames: `LEGACY_BRAND_REDIRECTS` in `apps/web/proxy.ts` sends every old `<old>.dropby.co.in` to the new
  host with a 308, path and query preserved, so indexed URLs and shared links keep working.
- Mobile: the three directory targets are now `swasthpath`, `sheharbazaar`, `gaadighar` (`apps/mobile/targets.mjs`,
  `eas.json`, `assets/targets/`).
- Database: `supabase/migrations/20260929000000_rename_sarkar_brands.sql` renames `brands`, `business_events` and
  `apps` rows. **It is written but not applied.** Until it runs, the new hostnames answer 404 because the `brands`
  table still holds the old slugs.

## DNS (Cloudflare)

`dropby.co.in` is on Cloudflare (nameservers `*.ns.cloudflare.com`) and uses a proxied wildcard: an unknown
subdomain already resolves to the same two Cloudflare addresses as `sarkarhealth.dropby.co.in`. No per-brand CNAME
has to be added or removed; a new hostname starts working the moment its `brands` row exists.

## Deliberately not renamed

These are permanent identifiers. Changing them after a store or Expo registration breaks the app's identity:

- Bundle id `com.brandcollabs.sarkarhealth` (`apps/mobile/targets.mjs`, `apps/web/app/developer/catalog.ts`).
- Legacy bundle id `live.cashcard.sarkarmarketplace` and EAS slug `sarkar-marketplace` (its EAS project cannot change slug).
- The `apps` table row `sarkar-marketplace`, which mirrors that EAS slug.
- `supabase/migrations/*` written before this rename, which are history.
- Business names in the scraped data (`combined_indore_master*.csv`) that contain the ordinary word "sarkar".
- "sarkari" (Hindi for governmental) in SEO keywords such as "sarkari naukri".

If the bundle id has not been submitted to a store yet, it can still be changed; decide before the first upload.
