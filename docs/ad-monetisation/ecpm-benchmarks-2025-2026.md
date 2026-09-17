# Mobile In-App eCPM Benchmarks 2025–2026 (Global, APAC, India)

Research compiled from primary sources. **Every figure is labelled INDEPENDENT or VENDOR.**
"VENDOR" = published by an ad network / monetization platform about its own inventory (marketing-grade).
"INDEPENDENT" = third-party measurement, analyst firm, or platform publishing cross-network aggregate data.

---

## 0. Critical finding: the Business of Apps URLs in the brief are dead

All four requested Business of Apps research URLs **return HTTP 404 as of this research date**, not merely a block:

| URL requested | Observed status |
|---|---|
| `https://www.businessofapps.com/ads/rewarded-video/research/rewarded-video-ecpms/` | **404** (verified via curl with browser UA; `web_fetch` sees CloudFront 403) |
| `https://www.businessofapps.com/ads/admob/research/admob-ecpms/` | **404** |
| `https://www.businessofapps.com/ads/research/` | **404** |
| `https://www.businessofapps.com/ads/mediation/research/` | **404** |

I also pulled `https://www.businessofapps.com/post-sitemap.xml` and `page-sitemap.xml` (both HTTP 200) and grepped every `<loc>` for `ecpm|research|ads/` — **no eCPM research pages exist in the sitemaps**. Business of Apps appears to have retired that research section.
**Consequence:** do not cite Business of Apps eCPM figures. Use the sources below instead. (BoA still 200s on network profile pages like `/ads/admob/`, but those pages contain no eCPM or revenue-share numbers — I checked the rendered text.)

Also dead / unretrievable: `toponad.cn` (DNS failure from this environment), `sgpjbg.com/labelsyh/...` (403 via web_fetch), `aigc.idigital.com.cn` (DNS failure).

---

## 1. Format × geography × eCPM table

### 1a. Appodeal — Q4 2024 (Oct–Dec 2024), publisher-side net eCPM

**Source:** Appodeal, *The Latest eCPM Report 2025*, published Mar 2025 — [PDF](https://appodeal.com/wp-content/uploads/2025/03/Appodeal-The-Latest-eCPM-Report-2025.pdf)
**Method stated in PDF:** timeframe Oct–Dec 2024; iOS & Android; formats Rewarded Video, Interstitial, Banner; **"Data from: 100,000+ apps & 70+ ad networks"**; **"Scale: 200+ billion ad views."**
**Classification:** VENDOR (Appodeal is an ad network + mediation platform) — but it is unusually well-documented and cross-network.
**Values below are read off the report's own charts** (the numbers are chart labels, not text, so I extracted the embedded chart images and read them; treat as ±small reading error).

| Geography | Platform | Rewarded Video | Interstitial | Banner | Confidence |
|---|---|---|---|---|---|
| **APAC** | Android | ~$8.20 | ~$5.60 | ~$0.25 | HIGH — chart read directly |
| **APAC** | iOS | ~$7.50 | ~$5.30 | ~$0.18 | HIGH |
| North America | Android | ~$9.00 | ~$9.60 | ~$0.55 | HIGH |
| North America | iOS | ~$13.70 | ~$10.50 | ~$0.55 | HIGH |
| Europe | Android | ~$5.15 | ~$3.55 | ~$0.25 | HIGH |
| Europe | iOS | ~$8.90 | ~$5.30 | ~$0.25 | HIGH |
| LATAM | Android | ~$1.75 | ~$1.20 | ~$0.12 | HIGH |
| LATAM | iOS | ~$3.35 | ~$2.20 | ~$0.15 | HIGH |
| Middle East | Android | ~$2.40 | ~$1.60 | ~$0.15 | HIGH |
| Middle East | iOS | ~$8.45 | ~$3.20 | ~$0.12 | HIGH |

Top-10 countries by eCPM (same source, same period): United States (iOS RV ~$17.5, INT ~$13.0, banner ~$0.5; Android RV ~$13.2, INT ~$12.3, banner ~$0.6), Australia, Switzerland, South Korea (iOS RV ~$10.0, INT ~$7.4), UAE (iOS RV ~$23.2 — highest single bar in the report), United Kingdom, Japan, Iceland, Ireland.
**India does not appear in Appodeal's top-10 country chart** — for India you must use the APAC aggregate (~$8.20 Android RV) *or* the TopOn/Sensor Tower data below, which are much lower. Confidence that Appodeal's APAC figure overstates India: **HIGH** (see §1b and §1c).

### 1b. TopOn × Taku — 2025 H1 (Jan–Jun 2025) and 2026 H1

**Source (2025 H1):** TopOn & Taku, *2025H1 全球手游广告变现报告* (55pp), published Aug 2025.
Primary: [takuad.com/posts/396.html](https://www.takuad.com/posts/396.html) (the publisher's own announcement).
Third-party summaries used because the full PDF is gated:
[sgpjbg.com report page](https://www.sgpjbg.com/info/1c06ac801e56e06b1e318e54cf6e16b8.html), [sgpjbg regional eCPM teardown](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html).
**Method stated:** TopOn/Taku aggregated ad-monetization data from their own mediated games worldwide for Jan–Jun 2025.
**Classification:** VENDOR-ADJACENT (a mediation platform aggregating many networks' payouts; not a single network, so less self-serving than a network blog, but still its own customer base).

| Geography | Segment / platform | Format | eCPM | Confidence |
|---|---|---|---|---|
| **Western (欧美) iOS** | mid-core | Rewarded video | **$19.98** | HIGH — figure repeated in every summary of the report |
| Western iOS | casual | Rewarded video | $12.24 | MEDIUM |
| Western iOS | casual | Interstitial | $10.27 | MEDIUM |
| Western Android | all | Interstitial | rose YoY (no absolute given) | LOW — direction only |
| **SE Asia (东南亚)** | — | Rewarded video | **$1.35** | HIGH (headline comparison figure) |
| **Japan + Korea** | Android | Rewarded video | **$6.00+** | MEDIUM-HIGH |
| China mainland | mid-core Android | Rewarded video | **$6.70** — described as a 3-year low | HIGH |
| **South Asia (南亚)** | Android | Rewarded video | "flat YoY" — **no absolute published** | LOW |
| South Asia | Android | Interstitial | fell in Q1, recovered | LOW |
| SE Asia / South Asia / LATAM | — | all formats | **"less than 1/3 of Western eCPM"**; Android LTV30 **<$0.08** | MEDIUM |

Regional eCPM ranking (2025 H1): **Western > HK/Macau/Taiwan > Japan/Korea > Russia > other Tier-3 > SE Asia ≈ South Asia ≈ LATAM.**
Format ranking globally: **Rewarded Video > Interstitial > App Open > Native > Banner.**
Regional platform winners: Japan/Korea Android = Pangle **52%** of revenue; South Asia Android = **Xiaomi Columbus** led (AdMob, Mintegral, Yandex behind); SE Asia Android = Pangle, Huawei Ads, Mintegral; Russia Android = Xiaomi Columbus 26%, Huawei Ads 24%; Android globally = AppLovin 28% > AdMob 17%; iOS globally = AdMob 28%.

**Source (2026 H1):** TopOn × Taku, *2026H1 全球手游广告变现报告* (53pp), published 29 Jul 2026 — [summary](https://www.sgpjbg.com/labelsyh/2026quanqiushouyouguanggaobianxianbaogao/1/6590516.html); corporate-wire version [ynet.com, 28 Aug 2026](http://finance.ynet.com/2026/08/28/4038304t632.html).
**Classification:** VENDOR-ADJACENT.

| Geography | Format | eCPM | YoY | Confidence |
|---|---|---|---|---|
| **Western iOS** | Rewarded video | **$17.25** (global highest) | **+40%** | HIGH |
| Japan/Korea | (rewarded video implied) | $13.44 | — | MEDIUM |
| HK/Macau/Taiwan | (rewarded video implied) | $15.28 | — | MEDIUM |
| Russia | (rewarded video implied) | $10.50 | — | MEDIUM |
| **India** | — | "eCPM in a climbing phase but still low overall"; **clear rebound Apr–May driven by IPL brand spend** — **no absolute value published in the accessible summary** | — | LOW / value UNVERIFIED |
| SE Asia, LATAM, India | all | "emerging markets… eCPM climbing but still low" | — | MEDIUM (directional) |
| China | all | double-sided eCPM up YoY | — | MEDIUM |

2026 H1 structural facts: casual games — rewarded video = **46.9%** of ad revenue; mid-core — interstitial = **40.9%** of revenue from only **7.4%** of impressions; iOS rewarded video up **~33% YoY** in mid-core. iOS rewarded video YoY **+3%** in casual. Emerging-market casual LTV30 ≈ **$0.09**.

### 1c. Sensor Tower — 2025 / 2026 (INDEPENDENT)

**Source:** Sensor Tower, *游戏深度分析：广告变现报告* (39pp), reported Jul 2026.
Accessible full write-up: [GameLook, 10 Jul 2026](http://www.gamelook.com.cn/2026/07/597137/); report landing page [sgpjbg.com/baogao/1322592.html](https://www.sgpjbg.com/baogao/1322592.html).
**Method stated:** 19 countries only — US, Canada, France, UK, Italy, Germany, Spain, **Indonesia, India**, Japan, Malaysia, Mexico, Poland, South Korea, Saudi Arabia, Thailand, Türkiye, Brazil, Vietnam.
**Classification:** INDEPENDENT (third-party store/panel measurement).

| Metric | Value | Date | Confidence |
|---|---|---|---|
| Global mobile-game ad market (19 countries) | **$12.0 B** | 2025 | HIGH |
| Ad impressions | **>2.4 trillion** | 2025 | HIGH |
| Ad-monetized game downloads | **24.6 B** | 2025 | HIGH |
| Share of games using ad monetization | 45.1% → **55.6%** | Jul 2021 → May 2026 | HIGH |
| **India: ad revenue as % of total mobile-game revenue** | **70.3%** | Jan–May 2026 | HIGH |
| India ad share (alternate statement in same article) | ~62% / "55–70% for developing markets" | 2025 | MEDIUM — the article gives 70.3% and 62% in different places |
| US: ad revenue as % of total mobile-game revenue | **22.1%** | Jan–May 2026 | HIGH |
| Mature markets (US, CA, KR, JP): IAP share | **77–90%** | — | HIGH |
| Puzzle games' share of ad revenue | **53%** | Feb–Apr 2026 | HIGH |
| Casual / hyper-casual share of ad revenue | **~40% each**; hybrid-casual 16%; mid-core 4% | Feb–Apr 2026 | HIGH |
| AppLovin + AdMob combined share of game ad revenue | **65%** (AppLovin 36%, AdMob 29%) | Jan–May 2026 (vs 61% 18 months earlier) | HIGH |
| Games ranked 1001+ share of **ad** revenue | **29%** | — | HIGH |
| Games ranked 1001+ share of **IAP** revenue | **9%** | — | HIGH |
| Games ranked 1–10 share of ad / IAP revenue | 11% / 22% | — | HIGH |
| Top-50 games share of ad / IAP revenue | 26% / 47% | — | HIGH |

**This is the single best independent source for the India question**, and it answers it in *structural* terms (India is ad-funded: ~70% of game revenue is ads) rather than in $ eCPM terms. Sensor Tower's report does not publish a per-format $ eCPM for India in the accessible write-up.

### 1d. Playwire — "AdMob eCPM Benchmarks" (VENDOR, Sep 2025)

**Source:** [playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect) — dated **September 17, 2025**. Playwire is a monetization vendor/ad-management platform. **Evidence quality is poor: the page says "Based on industry data and advertiser demand patterns" — i.e. no measured dataset, no sample size.** Classification: **VENDOR, low evidentiary weight.**

| Geography | Banner | Interstitial | Rewarded video |
|---|---|---|---|
| Tier 1 (US, UK, CA, AU, DE, FR, JP) | $0.50–$1.50 | $5.00–$8.00 | $15.00–$30.00 |
| "Global average" | $0.20–$0.80 | $2.50–$5.00 | $8.00–$18.00 |

Other Playwire claims (all VENDOR, all unverified internally): gaming eCPMs run **20–30% above** non-gaming; gaming rewarded video "often hits **$40+**"; apps with 80% Tier-1 traffic earn **~3×** an identical app with 20% Tier-1; single-network AdMob implementations vs. mediation → mediation is **40–60% higher**; fill rates **85–95%** (80%+ Tier-1), **70–85%** (50% Tier-1), **50–70%** (<20% Tier-1). **India/APAC are not broken out at all.**

### 1e. Bidlogic / optAd360 — Q1–Q4 2025 (VENDOR-ADJACENT)

**Sources:** [Q1→Q2 2025](https://bidlogic.io/2025/07/25/ecpm-growth-in-mobile-apps-q1-q2-2025-analysis-and-insights/), [Q2→Q3 2025](https://bidlogic.io/2025/10/31/strong-q3-2025-performance-mobile-app-ecpm-on-the-rise/) (31 Oct 2025), [Q3→Q4 2025](https://bidlogic.io/2026/01/30/what-happened-to-mobile-app-ecpms-in-q4-2025/) (30 Jan 2026).
**Classification:** VENDOR-ADJACENT (own network data), **and critically: these articles publish only % change, never absolute eCPM values.** Covers US, UK, Germany, **India**, Japan; Rewarded Video, Interstitial, Banner; iOS + Android.

Usable directional findings (no absolute $ available — **do not quote these as eCPM levels**):
- Q3→Q4 2025: Android interstitial eCPM **+17%+ in the US**, **+5.57% in India**; Android rewarded video **+24.19% US / +23.29% UK**; iOS interstitial fell in **every** market studied (**Japan −34.72%**, DE/UK ≈ −14%).
- Q2→Q3 2025: **Banner ads in India declined on both Android (−0.63%) and iOS (−31.65%)** — the only format/geo declines in that quarter.
- Q4 2025 report explicitly attributes falling blended eCPM to **reduced revenue share from AdMob, AppLovin, Unity and ironSource across the top-5 countries** plus more impressions overall — i.e. revenue share compression is a real, observed 2025 phenomenon.

### 1f. AnyMind Group — 2024 + Q1 2025, India & APAC (INDEPENDENT-ish, gated)

**Source:** [anymindgroup.com/report/download-ecpm-trends-interstitial-rewarded-ads-2025/](https://anymindgroup.com/report/download-ecpm-trends-interstitial-rewarded-ads-2025/), published **26 May 2025**.
**Method stated:** AnyManager data across **1,200 web publishers based in Asia**, markets include **India**, Indonesia, HK, Japan, Malaysia, Singapore, Taiwan, Australia, South Korea, Philippines, Vietnam, Thailand, UAE, US, UK, France, Germany, Brazil, Mexico. Formats: interstitial & rewarded.
**Classification:** VENDOR-ADJACENT but Asia-native and India-inclusive — the best India-specific *eCPM-by-format* source I found.
**BLOCKER: the actual numbers sit behind a lead-capture download form and I could not retrieve the PDF.** Any India interstitial/rewarded $ values from this report are **UNVERIFIED** by me.

### 1g. AppLixir — web rewarded video (VENDOR, but useful calibration)

**Source:** [applixir.com/blog/how-much-do-rewarded-video-ads-pay-web-cpm-revenue/](https://www.applixir.com/blog/how-much-do-rewarded-video-ads-pay-web-cpm-revenue/) (page renders "2026"; content references Sep 2026).
**Classification:** VENDOR. **Web/HTML5, NOT mobile in-app** — AppLixir states explicitly that Unity/AdMob/AppLovin mobile CPMs "are irrelevant benchmarks since browsers can't access that inventory."
Tier-1 **$7+**, tier-3 **$1–2**, blended **$4+** rewarded; display banner **$0.50–$2**. **5,000 DAU minimum** to onboard.

---

## 2. Revenue share / take rate

**Bottom line: none of the major in-app networks publishes a clean, current, official revenue-share number for mediation. Anything you see quoted is either (a) historical, (b) for a different Google product, or (c) a third-party estimate.** I could not verify AdMob, AppLovin MAX, Unity LevelPlay, Meta Audience Network, InMobi or Pangle take rates from a first-party 2025/2026 source. Treat all of the below accordingly.

| Network | Claim | Source | Status |
|---|---|---|---|
| **Google AdMob** | **UNVERIFIED.** The widely repeated "55% for bidding / 40% for waterfall" figure could not be confirmed on any live Google page. I probed `support.google.com/admob/answer/{9792160,180195,13570999,13530359,9754953,6175203,9830337,6128662,7381438,2745287}` — all 404 or content-free. AdMob's live mediation docs ([9234488](https://support.google.com/admob/answer/9234488?hl=en), [13420272](https://support.google.com/admob/answer/13420272?hl=en)) explain bidding vs. waterfall and **never state a revenue share**. | — | **UNVERIFIED** |
| **Google AdSense** (web, *not* AdMob — do not conflate) | "For displaying ads with AdSense for Content, **publishers receive 80% of the revenue**, after the advertiser platform takes its fee… when advertisers use Google Ads to purchase display ads on AdSense, **publishers keep about 68%**… These percentages are consistent, regardless of a publisher's geographic location." | [support.google.com/adsense/answer/180195](https://support.google.com/adsense/answer/180195?hl=en) | **OFFICIAL (Google)** — but a *different product* |
| **AppLovin MAX** | Revenue-share model; **exact share not publicly disclosed**; "industry standards for mediation platforms typically range from **5–15%**." Requires 100K+ DAU recommended; under 50K DAU "limited benefits." 60–90 days to optimize. | [playwire.com/blog/what-is-applovin-and-other-faqs](https://www.playwire.com/blog/what-is-applovin-and-other-faqs), 29 Oct 2025 | **VENDOR ESTIMATE — the 5–15% is the author's own hedge, explicitly not an AppLovin disclosure** |
| **AppLovin** (corporate disclosure) | AppLovin's FY2025 Form 10-K (`app-20251231.htm`, filed 19 Feb 2026) describes MAX as in-app bidding / "single unbiased, real-time competitive auction" and **discloses no publisher revenue-share percentage**. I searched the full 10-K text for "revenue share", "take rate", "gross", "net" in a publisher context — no number. | [sec.gov/Archives/…/app-20251231.htm](https://www.sec.gov/Archives/edgar/data/1751008/000175100826000010/app-20251231.htm) | **OFFICIAL SOURCE, NO NUMBER** |
| **Unity LevelPlay / Unity Ads** | No revenue share found. Unity docs payments page is content-gated/unrendered; searches surfaced only third-party Hebrew/Japanese comparison blogs. | [docs.unity.com monetization payments](https://docs.unity.com/ja-jp/monetization/payments/intro-to-monetization-payments) (no figure retrieved) | **UNVERIFIED** |
| **Meta Audience Network** | No first-party revenue-share figure found. | — | **UNVERIFIED** |
| **InMobi** | No revenue share found. **But the payment terms are verified and India-relevant:** non-India bank transfer minimum **US$300**; **India bank transfer minimum US$50**; PayPal minimum US$50; **Indian publishers cannot be paid via PayPal.** Payment ~60 days after month end. | [support.inmobi.com payment terms](https://support.inmobi.com/ja/monetize/ja-payments/ja-summary-of-payment-terms/) (page last updated 16 Sep 2020) | **OFFICIAL, but dated 2020** |
| **Pangle / Mintegral / Chartboost / Digital Turbine / BidMachine** | No first-party revenue-share figures located. | — | **UNVERIFIED** |
| **Industry-wide observation** | Bidlogic's Q3→Q4 2025 report states the eCPM decline in its top-5 markets was **"driven by reduced revenue share for top-tier networks (AdMob, AppLovin, Unity, ironSource)"** in addition to lower rates and more impressions. | [bidlogic.io Q4 2025](https://bidlogic.io/2026/01/30/what-happened-to-mobile-app-ecpms-in-q4-2025/) | **INDEPENDENT-ADJACENT, directional** |

### Gross vs net — what the cited figures actually are

| Source | Basis | Why |
|---|---|---|
| Appodeal eCPM charts | **NET (publisher revenue)** | Appodeal reports what its publishers earned; the report's own framing is "average eCPM" per format with "make more money from ads in your mobile game" |
| TopOn / Taku eCPM | **NET (publisher revenue)** | These are **mediation-side revenue-share reports** — literally the developer's realized revenue split by network |
| Sensor Tower | **Market size / revenue share**, i.e. publisher/network revenue pools | Third-party estimate, not a rate card |
| Playwire, Applixir, Bidlogic | **NET** | Publisher-facing earnings framing. Bidlogic explicitly discusses **"reduced revenue share"** as a driver of eCPM movement, confirming its series tracks publisher-side net |
| Ad-network blog "eCPM" claims (Mintegral, etc.) | Often **GROSS advertiser bid** dressed as eCPM | Networks rarely state the basis — **assume unstated and ask** |

**Practical rule until you get a first-party number: treat every eCPM in this document as NET publisher revenue, and treat any vendor "we pay $X eCPM" claim as unverified on basis.**

---

## 3. Install volume / DAU → revenue benchmarks

### 3a. VENDOR rules of thumb

| DAU | Revenue | Source | Date | Confidence |
|---|---|---|---|---|
| **~100,000 DAU** | **~$50,000/month** ("rule of thumb, not a promise") | [trendapps.dev — How Much Can an App Make from Ads in 2026?](https://trendapps.dev/blog/trends/how-much-can-an-app-make-from-ads/) | updated 26 Aug 2026 | VENDOR, MEDIUM — formula-driven, states its own error bars |
| < a few thousand DAU | "banners barely cover store fees" | same | same | MEDIUM |
| Utility with banner: **$0.5–$3 per DAU per month** | "tens of thousands of DAU before the check is interesting" | same | same | MEDIUM |
| High-end casual game ARPDAU | **$5–$20/day** — explicitly "the high end, not typical" | same | same | MEDIUM |
| 5,000 DAU | minimum audience for AppLixir onboarding ("below that, impression volume is too thin for meaningful optimization, and reporting is too noisy") | [applixir.com](https://www.applixir.com/blog/how-much-do-rewarded-video-ads-pay-web-cpm-revenue/) | 2026 | VENDOR (web) |
| 20,000 DAU worked example | 25% participation × 1 view ≈ 5,000 views/day ≈ 150k/month ≈ **$600/month** at $4 CPM; lift participation to 40% with two reward moments → ~480k views/month ≈ **$1,920/month** | same | same | VENDOR (web), arithmetic self-consistent |
| **50,000 DAU** | AppLovin: "publishers with under 50K DAU often see limited benefits from their machine learning algorithms" | [playwire.com](https://www.playwire.com/blog/what-is-applovin-and-other-faqs) | 29 Oct 2025 | VENDOR |
| **100,000 DAU** | AppLovin "recommended" threshold | same | same | VENDOR |
| AppLovin optimization lag | 2–4 weeks integration; **60–90 days** to optimized performance | same | same | VENDOR |
| Scaling curve by DAU band | 0–1K: statistical noise; 1K–10K: eCPMs normalize; 10K–100K: enough volume for meaningful optimization; 100K+: single-platform ceiling | [playwire.com AdMob benchmarks](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect) | 17 Sep 2025 | VENDOR |
| DAU bands (Playwire worked examples) | Gaming, 5,000 DAU, 60% Tier-1: $100–250/day optimistic, $50–100 poor. Same app at 20% Tier-1: $50–125/day optimistic, $25–60 poor. **Utility, 5,000 DAU, 60% Tier-1: $50–125/day optimistic, $25–75 poor.** | same | 17 Sep 2025 | VENDOR — **note the internal inconsistency**: 5,000 DAU at $50–125/day implies ~$3,000–7,500/month, i.e. ~$0.60–1.50/DAU/month, which is at the top of the utility band and ~15× the TrendApps "$50k at 100k DAU" (~$0.50/DAU/month) — actually these are roughly consistent, but Playwire's utility numbers equal its gaming numbers, which contradicts its own "gaming eCPMs run 20–30% higher" claim. **Flag as low confidence.** |

### 3b. INDEPENDENT volume economics

| Metric | Value | Source | Date |
|---|---|---|---|
| Games ranked **1001+** capture **29%** of all ad revenue but only **9%** of IAP revenue | → ad monetization pays the long tail; IAP does not | [Sensor Tower via GameLook](http://www.gamelook.com.cn/2026/07/597137/) | Jul 2026 |
| Ad revenue is **activity-driven, not rank-driven**: "revenue depends on user activity, not game ranking position" | — | same | same |
| Games ranked 1–10 = **11%** of ad revenue vs **22%** of IAP; top 50 = **26%** of ad vs **47%** of IAP | — | same | same |
| India: **70.3%** of mobile-game revenue is advertising (vs **22.1%** US) | → India is an ads-first market; subscription/IAP-first models underperform there | same | Jan–May 2026 |
| Hybrid-casual, ad-led vs IAP-led | Ad-led titles ($Paper.io 2$, $Zen Word) = 75–97% of revenue from ads; IAP-led ($Pixel Flow!$, $Magic Sort!$) = 78–96% IAP. Jan–May 2026 average total revenue: IAP-led **>$83M** vs ad-led **~$21M** | same | 2026 |
| China mid-core iOS 30-day retention | **13.26%** | [TopOn/Taku 2025H1](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html) | Aug 2025 |
| Emerging-market (SE Asia/South Asia/LATAM) Android **LTV30 < $0.08**; casual LTV30 ≈ **$0.09** | → at these LTVs you need ~12.5M+ lifetime installs per $1M of revenue | TopOn/Taku 2025H1 and 2026H1 | 2025 / 2026 |

---

## 4. What I could NOT verify

1. **AdMob's revenue share.** No live Google page states it. "55% bidding / 40% waterfall" is repeated widely online but I found **no first-party 2025/2026 source**. UNVERIFIED.
2. **AppLovin MAX, Unity LevelPlay, Meta Audience Network, InMobi, Pangle, Mintegral, Chartboost, Digital Turbine, BidMachine revenue shares.** None published; AppLovin's FY2025 10-K contains no percentage. UNVERIFIED.
3. **Any absolute India eCPM in USD by format.** Multiple sources give India *directionally* (TopOn: South Asia rewarded video "flat YoY"; Sensor Tower: India is 70.3% ad-funded; Bidlogic: India interstitial +5.57% QoQ, banner negative) but **no source in this set publishes "$X.XX eCPM for India rewarded video / interstitial / banner."** The AnyMind Asia report almost certainly has it, but it is behind a lead-capture form. UNVERIFIED.
4. **Native ad eCPM anywhere except ranking.** TopOn ranks native below app-open and above banner, but no absolute native eCPM was published in any accessible summary. UNVERIFIED.
5. **Business of Apps eCPM data** — pages 404; no such data in their sitemaps. UNVERIFIED / non-existent.
6. **Statista** — the brief asked about Statista eCPM pages. I did not retrieve a Statista page with usable 2025–2026 mobile in-app eCPM by format and geography; Statista's relevant series are behind a paywall and surfaced no headline figures in search. UNVERIFIED (paywalled).
7. **Google AdMob official eCPM benchmarks.** Google publishes no eCPM benchmark data; its help centre only explains bidding mechanics.
8. **Tenjin hyper-casual eCPM benchmarks (2025/2026).** `tenjin.com/blog/` cross-origin-redirects and no 2025/2026 Tenjin eCPM benchmark surfaced in search; the Tenjin reports that did appear were 2022/2023 via third-party document libraries. The 2025 H1 广大大 × Tenjin whitepaper exists ([source](https://www.sgpjbg.com/baogao/731756.html)) but is a *user-acquisition* whitepaper, not eCPM benchmarks. UNVERIFIED.
9. **AppsFlyer eCPM benchmarks.** `appsflyer.com/resources/reports/app-marketing-india/` fetched successfully but is an India *UA/marketing* report — I found **no eCPM figures in it**. AppsFlyer does not appear to publish in-app eCPM benchmarks. UNVERIFIED.
10. **Q1–Q2 2025 and Q1 2026 absolute eCPM values.** The Bidlogic series is % change only.
11. **The "install volume" question is not answered by any independent source.** Every DAU→$ figure I found is a **vendor rule of thumb**. No independent (Sensor Tower / Appfigures / data.ai / academic) study quantifying a DAU threshold for meaningful ad revenue was located.

---

## 5. Recommended citation set (highest value first)

1. **Sensor Tower 2026 ad-monetization report** (via GameLook) — INDEPENDENT, India-inclusive, 2025/2026 — [link](http://www.gamelook.com.cn/2026/07/597137/)
2. **Appodeal eCPM Report 2025** — VENDOR but 100k+ apps / 70+ networks / 200B+ impressions, with real USD chart values — [PDF](https://appodeal.com/wp-content/uploads/2025/03/Appodeal-The-Latest-eCPM-Report-2025.pdf)
3. **TopOn × Taku 2025H1 / 2026H1** — VENDOR-ADJACENT, the only source with explicit APAC/South Asia/India rankings **and** USD values (for non-India geos) — [2025H1](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html) / [2026H1](https://www.sgpjbg.com/labelsyh/2026quanqiushouyouguanggaobianxianbaogao/1/6590516.html)
4. **AnyMind Group Asia eCPM report (May 2025)** — gated; retrieve the PDF if India numbers are business-critical — [link](https://anymindgroup.com/report/download-ecpm-trends-interstitial-rewarded-ads-2025/)
5. **Bidlogic Q3→Q4 2025** — direction/seasonality only — [link](https://bidlogic.io/2026/01/30/what-happened-to-mobile-app-ecpms-in-q4-2025/)
6. **Google AdSense revenue share** — OFFICIAL but web-only — [link](https://support.google.com/adsense/answer/180195?hl=en)
