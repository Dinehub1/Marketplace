# Brand site redesign — audit, architecture and per-brand sitemaps

Generated from a live crawl of all 28 domains (`~/brand_audit.json`) plus the production database.

## What the audit found

- 28/28 domains answer 200. **2/28 serve the real app at `/`**; the other 26 serve a static
  mockup from `public/sites/<brand>/index.html`.
- Distinct internal routes across the whole estate: **185** — most brands carry 2–8, i.e. a landing
  page with a few links rather than a website.
- Dead `href="#"` links: **232**. Anchor-only `#section` links to be replaced with real routes: **613**.

## Architecture decision

Real pages already exist behind the brand router (about, services, faq, pricing, contact, marketplace,
category landing, category-by-area, business detail, booking, login, dashboard, galaxy, reviews, gallery,
blog, careers) and every one of them queries the production database. The defect is NOT missing code:
it is that (a) `/` is a static mockup, and (b) the semantic routes a visitor expects (`/used-cars`) do not
exist as aliases onto those real pages.

Therefore: a **per-brand sitemap definition** that (1) replaces the static home with the app home, and
(2) aliases brand-semantic paths onto existing pages backed by real data. No invented content, no fake
statistics or testimonials, no single generic template.

## Phase plan

| Phase | Work | State |
|---|---|---|
| 1 | Audit + evidence | complete |
| 2 | Shared machinery: sitemap config, nav/footer from config, loading/empty/error/404 states, per-route SEO | in progress |
| 3 | Pilot end-to-end: `sarkarcars` (`/used-cars` → `/car-details/<id>`) for approval | next |
| 4 | Rollout in batches of 5–6 brands, brand-specific sections | pending |
| 5 | QA crawl: every route, every internal link, console errors, mobile + desktop | pending |

## Per-brand sitemap

### Mera Ayurvedic — `ayurvedicwebsite.dropby.co.in`
- **Does:** Wellness — Pure Ayurveda, Pure Trust
- **Today:** 2 routes, static mockup at /, 3 dead links, 18 anchor-only sections
- **Existing routes:** /cdn-cgi/l/email-protection, /faq
- **Proposed routes:** / · /treatments · /doctors · /packages · /bookings · /about · /contact

### Cloud Player — `cloudplayer.dropby.co.in`
- **Does:** n/a — Cloud-Powered Media, Zero Buffering — Stream Without Limits
- **Today:** 8 routes, static mockup at /, 8 dead links, 10 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /pricing, /privacy, /terms
- **Proposed routes:** / · /features · /pricing · /library · /login · /about · /contact

### FollowUp — `followup.dropby.co.in`
- **Does:** SaaS — Never Miss a Follow-Up Again
- **Today:** 8 routes, static mockup at /, 4 dead links, 18 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /cdn-cgi/l/email-protection, /contact, /privacy, /sitemap.xml, /terms
- **Proposed routes:** / · /features · /pricing · /integrations · /login · /about · /contact

### Hyperframes Real Estate — `hyperframes-realestate.dropby.co.in`
- **Does:** Real Estate — Virtual Tours, Real Decisions
- **Today:** 2 routes, static mockup at /, 7 dead links, 20 anchor-only sections
- **Existing routes:** /privacy, /terms
- **Proposed routes:** / · /projects · /properties · /property/<id> · /enquiry · /about · /contact

### JustDial Agent — `justdial-agent.dropby.co.in`
- **Does:** Data — Data-Driven Business Intelligence
- **Today:** 7 routes, static mockup at /, 3 dead links, 13 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /features · /pricing · /how-it-works · /login · /about · /contact

### PaisaFlow — `paisaflow.dropby.co.in`
- **Does:** Fintech — Smart Returns on Every Rupee
- **Today:** 8 routes, static mockup at /, 8 dead links, 23 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /privacy, /sitemap.xml, /terms
- **Proposed routes:** / · /features · /pricing · /docs · /login · /about · /contact

### Sarkar AI — `sarkar-ai.dropby.co.in`
- **Does:** AI — Your AI, Your Empire
- **Today:** 5 routes, static mockup at /, 10 dead links, 22 anchor-only sections
- **Existing routes:** /blog, /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /capabilities · /use-cases · /pricing · /chat · /about · /contact

### SarkarBazaar — `sarkarbazaar.dropby.co.in`
- **Does:** Marketplace — Local Businesses, Global Reach
- **Today:** 4 routes, static mockup at /, 16 dead links, 44 anchor-only sections
- **Existing routes:** /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /manufacturers · /wholesalers · /categories/<slug> · /company/<id> · /about · /contact

### SarkarCars — `sarkarcars.dropby.co.in`
- **Does:** car-services — Indore ka car wash aur service — slot book karein
- **Today:** 12 routes, app at /, 0 dead links, 0 anchor-only sections
- **Existing routes:** /, /_next/static/chunks/1ay-amgj03j_t.js, /_next/static/chunks/1ddrlgqwh3lhy.css, /about, /contact, /faq, /login, /marketplace, /privacy, /services, /support, /terms
- **Proposed routes:** / · /used-cars · /car-details/<id> · /services · /sell-your-car · /about · /contact

### SarkarConnect — `sarkarconnect.dropby.co.in`
- **Does:** Social — B2B Networking That Works
- **Today:** 6 routes, static mockup at /, 11 dead links, 32 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /privacy, /terms
- **Proposed routes:** / · /industries · /suppliers · /directory · /company/<id> · /post-requirement · /about · /contact

### SarkarDost — `sarkardost.dropby.co.in`
- **Does:** Social — Connecting Indore's community
- **Today:** 6 routes, static mockup at /, 8 dead links, 25 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /privacy, /terms
- **Proposed routes:** / · /services · /professionals · /pro/<id> · /book · /about · /contact

### SarkarDukaan — `sarkardukaan.dropby.co.in`
- **Does:** E-commerce — Your Shop Goes Digital
- **Today:** 4 routes, static mockup at /, 5 dead links, 26 anchor-only sections
- **Existing routes:** /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /shops · /categories/<slug> · /shop/<id> · /about · /contact

### SarkarEd — `sarkared.dropby.co.in`
- **Does:** EdTech — Learn Skills That Pay
- **Today:** 8 routes, static mockup at /, 6 dead links, 14 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /login, /privacy, /terms
- **Proposed routes:** / · /schools · /coaching · /colleges · /institute/<id> · /enquiry · /about · /contact

### SarkarFinance — `sarkarfinance.dropby.co.in`
- **Does:** Fintech — Loans & Finance Made Simple
- **Today:** 6 routes, static mockup at /, 6 dead links, 22 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /privacy, /terms
- **Proposed routes:** / · /loans · /insurance · /advisors · /advisor/<id> · /apply · /about · /contact

### SarkarFood — `sarkarfood.dropby.co.in`
- **Does:** Food Tech — Food from Indore Best Kitchens
- **Today:** 7 routes, static mockup at /, 20 dead links, 38 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /restaurants · /sweets · /caterers · /restaurant/<id> · /about · /contact

### SarkarGhar — `sarkarghar.dropby.co.in`
- **Does:** Real Estate — Find Your Dream Home in Indore
- **Today:** 3 routes, static mockup at /, 6 dead links, 19 anchor-only sections
- **Existing routes:** /contact, /privacy, /terms
- **Proposed routes:** / · /plumbers · /electricians · /carpenters · /painters · /service/<id> · /get-quote · /about · /contact

### SarkarHealth — `sarkarhealth.dropby.co.in`
- **Does:** Healthcare — Healthcare That Cares for Indore
- **Today:** 6 routes, static mockup at /, 13 dead links, 22 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /privacy, /terms
- **Proposed routes:** / · /doctors · /clinics · /diagnostics · /pharmacies · /doctor/<id> · /about · /contact · /faq

### SarkarJobs — `sarkarjobs.dropby.co.in`
- **Does:** HR Tech — Jobs That Match Your Talent
- **Today:** 6 routes, static mockup at /, 22 dead links, 40 anchor-only sections
- **Existing routes:** /contact, /faq, /login, /pricing, /privacy, /terms
- **Proposed routes:** / · /jobs · /employers · /job/<id> · /post-a-job · /about · /contact

### SarkarLegal — `sarkarlegal.dropby.co.in`
- **Does:** Legal Tech — Legal Help at Your Doorstep
- **Today:** 6 routes, static mockup at /, 18 dead links, 28 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /privacy, /terms
- **Proposed routes:** / · /advocates · /notaries · /services · /advocate/<id> · /consult · /about · /contact

### SarkarMarketplace — `sarkarmarketplace.dropby.co.in`
- **Does:** Marketplace — Indore's business directory — local services, all in one place
- **Today:** 24 routes, app at /, 0 dead links, 0 anchor-only sections
- **Existing routes:** /, /_next/static/chunks/1ay-amgj03j_t.js, /_next/static/chunks/1ddrlgqwh3lhy.css, /about, /business/110834, /business/110835, /business/110836, /business/110837, /business/110838, /business/110859, /business/110862, /business/110863, /business/110906, /business/110912, /business/110923, /business/110940, /contact, /faq, /login, /marketplace, /privacy, /services, /support, /terms
- **Proposed routes:** / · /categories · /category/<slug> · /locality/<area> · /business/<id> · /galaxy · /about · /contact

### SarkarMart — `sarkarmart.dropby.co.in`
- **Does:** E-commerce — Shop Local, Sell Global
- **Today:** 8 routes, static mockup at /, 16 dead links, 41 anchor-only sections
- **Existing routes:** /, /about, /blog, /careers, /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /products · /categories/<slug> · /store/<id> · /about · /contact

### SarkarPay — `sarkarpay.dropby.co.in`
- **Does:** Fintech — Payments That Power Growth
- **Today:** 6 routes, static mockup at /, 6 dead links, 25 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /privacy, /terms
- **Proposed routes:** / · /features · /pricing · /docs · /login · /about · /contact

### SarkarSarkar — `sarkarsarkar.dropby.co.in`
- **Does:** Government — Government Services at Your Fingertips
- **Today:** 4 routes, static mockup at /, 1 dead links, 2 anchor-only sections
- **Existing routes:** /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /services · /schemes · /apply · /track · /about · /contact

### SarkarSkills — `sarkarskills.dropby.co.in`
- **Does:** EdTech — Skills That Change Lives
- **Today:** 8 routes, static mockup at /, 7 dead links, 25 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /login, /privacy, /terms
- **Proposed routes:** / · /courses · /trainers · /course/<id> · /enrol · /about · /contact

### SarkarTravel — `sarkartravel.dropby.co.in`
- **Does:** Travel — Travel More, Worry Less
- **Today:** 6 routes, static mockup at /, 5 dead links, 27 anchor-only sections
- **Existing routes:** /cdn-cgi/l/email-protection, /contact, /faq, /login, /privacy, /terms
- **Proposed routes:** / · /packages · /hotels · /agents · /agent/<id> · /enquiry · /about · /contact

### SarkarWellness — `sarkarwellness.dropby.co.in`
- **Does:** Wellness — Ancient Wellness, Modern Healing
- **Today:** 3 routes, static mockup at /, 11 dead links, 27 anchor-only sections
- **Existing routes:** /about, /privacy, /terms
- **Proposed routes:** / · /gyms · /salons · /spas · /clinics · /centre/<id> · /about · /contact

### SikshaHub — `sikshahub.dropby.co.in`
- **Does:** EdTech — Education for Every Home
- **Today:** 7 routes, static mockup at /, 8 dead links, 17 anchor-only sections
- **Existing routes:** /about, /blog, /careers, /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /courses · /institutes · /course/<id> · /contact

### YaadRakh — `yaadrakh.dropby.co.in`
- **Does:** Productivity — Remember Everything, Miss Nothing
- **Today:** 5 routes, static mockup at /, 4 dead links, 15 anchor-only sections
- **Existing routes:** /blog, /contact, /faq, /privacy, /terms
- **Proposed routes:** / · /places · /temples · /community · /place/<id> · /contribute · /about
