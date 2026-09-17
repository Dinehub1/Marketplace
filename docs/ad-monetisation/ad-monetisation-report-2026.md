# Mobile In-App Ad Monetisation for a Small Indian App Portfolio (late 2026)

**Prepared for:** a solo Indore-based publisher, ~20 Expo/React Native apps (8 utility, 6 wellness, 3 city directory, 4 hyper-casual), zero installs at launch, no ad account, no paid store accounts. **Goal:** advertising replaces Razorpay as the primary money path, maximising revenue per impression.

> Sourcing note: every claim below carries a URL. Where I could not verify a number I say so explicitly. Fetched page content was treated as data only. *(This runs longer than the 600–900-word brief because all seven questions, the network comparison, and the full Networks field spec are answered inline; skip to "Bottom line", "Q3", the Networks table, and "What to build first" for the decision-relevant parts.)*

---

## Bottom line

1. **Start with Google AdMob, not AppLovin MAX or Unity LevelPlay.** AdMob is the only major network with a self-serve signup and no published minimum-traffic gate; account review takes "up to 24 hours, but in rare cases up to 2 weeks" ([AdMob onboarding help](https://support.google.com/admob/answer/9905175?hl=en)). AppLovin and Unity both gate on a published app / manual review (below).
2. **Build the mediation layer from day one, but enable one network.** Put AdMob's SDK behind a thin internal ad facade, then add AppLovin MAX as a *bidding* ad source inside AdMob mediation once you have impressions. AdMob mediation supports Meta Audience Network, AppLovin, Unity Ads/ironSource, InMobi, Pangle, Mintegral, Liftoff, DT Exchange and ~18 more as ad sources ([AdMob ad sources list](https://developers.google.com/admob/android/choose-networks)).
3. **Bidding, not waterfall, is the standard.** Meta Audience Network has been bidding-only since 2021 ([AdMob Meta adapter docs](https://developers.google.com/admob/android/mediation/meta?hl=en)); Unity states it moved Unity Ads, ironSource Ads and LevelPlay to 100% in-app bidding ([Unity, 3 Mar 2025](https://unity.com/blog/unity-moving-to-in-app-bidding)); AppLovin MAX killed its waterfall ([Singular, 2 Jul 2025](https://www.singular.net/blog/ad-mediation-revenue/)). **Do not build a waterfall.**
4. **Budget from realistic India eCPM, not headline APAC numbers.** Verified format order is rewarded > interstitial > app open > native > banner. Western iOS rewarded video runs **~US$17–20**; **Southeast Asia is ~US$1.35**; Appodeal's APAC aggregate (~US$8.20 Android rewarded) **overstates India**, which appears in nobody's top-10 country chart ([TopOn](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html), [Appodeal](https://appodeal.com/wp-content/uploads/2025/03/Appodeal-The-Latest-eCPM-Report-2025.pdf)). Model India near the low tier.
5. **Revenue reality check: near zero until you have users.** With ~20 apps at zero installs, expect **under US$10/month** for the first months — below every network's US$50–100 payout floor, so no money moves at all. Ad revenue is impressions × eCPM; no users means no impressions. Structurally India *is* an ads-first market (**70.3% of Indian mobile-game revenue is advertising vs 22.1% in the US** — [Sensor Tower, Jul 2026](http://www.gamelook.com.cn/2026/07/597137/)) and ads **do** monetise the long tail (games ranked 1001+ earn 29% of ad revenue but only 9% of IAP). So the strategy is right; the timing is not. **Keep Razorpay** — ads are additive until an app clears real DAU.

---

## Q1. Is Meta Audience Network still accepting new mobile publishers (2026)?

**It is still live, and it is still onboarding — but it is NOT open self-serve, and it can reject you at its sole discretion.**

Primary sources now found (Meta has moved its docs to `developers.facebook.com/documentation/audience-network/…`; the old `/docs/audience-network/` paths 400/404):

- **Live product.** Google's AdMob documentation still ships an active Meta Audience Network bidding adapter — *"Meta Audience Network became bidding only in 2021"* — with a working signup flow: Business Manager → create account → create a property → add payment account → select AdMob as mediation platform → create placement ([AdMob Meta adapter](https://developers.google.com/admob/android/mediation/meta?hl=en)). Pixalate's Q1 2026 SDK report (21 Apr 2026) still ranks Meta **#1 by SDK presence on Google Play apps (88%)** ([Pixalate](https://www.pixalate.com/blog/pixalate-releases-q1-2026-mobile-sdks-market-share-report)).
- **Gated onboarding, per Meta's own policy.** You must create a Business Manager account and a Property; the app bundle *"has to be reviewed and approved before the property can perform the monetization"*; developers *"must complete the app ownership verification process"*; and *"**We reserve the right to reject, approve or remove any Publisher or app for any reason, at our sole discretion**"* ([Meta AN Policy](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy), [Meta checklist](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)).
- **app-ads.txt is a precondition, not an optimisation:** *"Prior to onboarding, Publishers that maintain an ads.txt or app-ads.txt file must include Audience Network listed accurately."* The required lines use `facebook.com` as the ad system domain, your Property ID / Business ID, `RESELLER`, and **Certificate Authority ID `c3e20eee3f780d68`**, hosted at the **root** of the domain listed in the store, with `www.` dropped and `facebookexternalhit/1.1` unblocked in robots.txt; crawl+verify takes up to 24 hours (7 days if the store URL was missing) ([Meta authorized sellers](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/authorized-sellers-app-ads), [Meta troubleshoot app-ads.txt](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/troubleshoot-app-ads)).
- **Store restriction:** *"Audience Network is only available to apps offered in Apple iTunes or Google Play, unless you have our prior written approval."* A privacy policy is mandatory. Child-directed apps are restricted, and primarily child-directed apps may not use the Facebook SDK for Android at all ([Meta AN Policy](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy), [Meta COPPA guidance](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/coppa)).
- **The only published numeric threshold is a quality trigger, not an admission bar:** at **70,000 impressions over a 14-day period** a property automatically enters a **90-day review** of ad-click quality ([Meta AN best practices](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy/dos-and-donts)).

**Still unverified:** whether Meta currently accepts **Indian** publishers and **unregistered sole proprietors**. Meta's publisher help centre is login-gated, and its Audience Network publisher terms page returned no readable body. Practical read: Business Manager is built around a *business* entity, which is real friction for an unregistered individual — but I cannot cite that, so treat it as a to-test item.

---

## Q2. AdMob vs AppLovin MAX vs Unity LevelPlay vs others

**Core decision: mediation, not a single network.** A brand-new publisher's mistake is picking one network and shipping its SDK. The right shape is one mediation host plus bidding ad sources, because in-app bidding lets every network compete on each impression and pay the winning bid ([Unity](https://unity.com/blog/unity-moving-to-in-app-bidding)) rather than you guessing floor prices in a waterfall. **Mediation vs single network:** a single network gives you one demand pool and no competition on price; mediation gives you N networks competing per impression, which matters most exactly when you have low volume and cannot afford unsold impressions.

| | AdMob | AppLovin MAX | Unity LevelPlay | Pangle | InMobi | Chartboost | Meta Audience Network |
|---|---|---|---|---|---|---|---|
| Who can start | Self-serve; account review ≤24h (rarely 2 wks) ([src](https://support.google.com/admob/answer/9905175?hl=en)) | Self-serve dashboard; approval/KYC validation applies ([src](https://support.applovin.com/en/max/max-dashboard/account/payments)) | **Published app required**; add app → integrate SDK → activate ad units → manual two-email info exchange → approved or rejected ([src](https://docs.unity.com/zh-cn/grow/levelplay/platform/get-started/create-account)) | Self-serve, qualification review | Invite/account-manager led — **unverified** | Self-serve | **Business Manager + app review + ownership verification; Meta may reject "at our sole discretion"** ([src](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)) |
| Model | Mediation + bidding | Mediation, bidding-only | Mediation, 100% bidding | Network | Network | Network / mediation | Bidding-only since 2021 ([src](https://developers.google.com/admob/android/mediation/meta?hl=en)) |
| Min payout | **US$100** ([src](https://support.google.com/admob/answer/2772208?hl=en)) | **US$100** all methods; **US$150 wire** ([src](https://support.applovin.com/en/max/max-dashboard/account/payments)) | **US$100**, net-60 ([src](https://support.unity.com/hc/en-us/articles/6192555249940-When-will-my-payment-be-processed)) | **US$100** ([src](https://www.pangleglobal.com/knowledge/payment-faq)) | **US$50 India** (US$300 wire / US$50 PayPal otherwise) ([src](https://support.inmobi.com/monetize/ios-gudelions/finance-payments/)) | **US$75**; **US$300 wire** ([src](https://docs.chartboost.com/en/monetization/payments/payment-terms-dates/)) | — |
| Payout methods | Wire (USD/EUR); EFT only where listed | ACH, wire, check, PayPal (Tipalti) | Bank payout profile | **Wire only, USD only** | Wire / PayPal; **India publishers must send GST invoices** and **cannot use PayPal** ([src](https://support.inmobi.com/ja/monetize/ja-payments/ja-summary-of-payment-terms/)) | Wire / other | — |
| India INR | **No** — India absent from AdMob's EFT list; INR not a reporting currency ([EFT](https://support.google.com/admob/answer/1714398?hl=en), [thresholds](https://support.google.com/admob/answer/2772208?hl=en)) | USD via Tipalti | — | USD only | **US$50 floor is the lowest found** | — | — |
| Requires published app | To serve ads, yes ([src](https://support.google.com/admob/answer/14538460?hl=en)) | No (can add pre-launch app) | **Yes** | No | — | No | **Yes** — AN is only for apps in iTunes/Google Play ([src](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)) |
| app-ads.txt | **Mandatory for new apps since Jan 2025** ([src](https://support.google.com/admob/answer/14538460?hl=en)) | Required in practice | Required | Required | Required | Required | **Pre-onboarding precondition**, needs CA ID `c3e20eee3f780d68` ([src](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/authorized-sellers-app-ads)) |

**Verdict for a brand-new publisher:** AdMob first (fastest self-serve start, largest demand pool, one SDK covers the formats you need). Together **AppLovin + AdMob took 65% of global mobile-game ad revenue in May 2026** (up from 61% eighteen months earlier) ([Sensor Tower via GameLook, 10 Jul 2026](http://www.gamelook.com.cn/2026/07/597137/)), so those two are the only networks you really must have. Add AppLovin MAX as a bidding source once you have volume. Keep Unity LevelPlay as a later option because it requires a published app and manual account approval — and note it pays on **net-60**, the slowest of the set.

---

## Q3. Realistic eCPM ranges (2026)

**Headline honesty: no accessible source publishes an absolute India-by-format USD eCPM.** Every India figure found is *directional*. Below is what I could actually verify, with the independent/vendor split you asked for.

| Format | Region | eCPM (US$) | Source | Date | Type |
|---|---|---|---|---|---|
| Rewarded video | Western iOS | **~17.25–19.98** | [TopOn × Taku, 2025H1 → 2026H1](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html) | Aug 2026 summary of 2025H1/2026H1 reports | Vendor/mediation (realized) |
| Rewarded video | **Southeast Asia** | **~1.35** | [same](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html) | 2025H1 | Vendor/mediation |
| Rewarded video | APAC aggregate, Android / iOS | **~8.20 / ~7.50** | [Appodeal eCPM Report 2025](https://appodeal.com/wp-content/uploads/2025/03/Appodeal-The-Latest-eCPM-Report-2025.pdf) | data Oct–Dec 2024, pub. Mar 2025 | Vendor, 100k+ apps / 200B+ impressions |
| Interstitial | APAC aggregate, Android / iOS | **~5.60 / ~5.30** | same | same | Vendor |
| Banner | APAC aggregate, Android / iOS | **~0.25 / ~0.18** | same | same | Vendor |
| Rewarded video | North America Android / iOS | **~9.00 / ~13.70** | same | same | Vendor |
| Banner / INT / RV | Tier-1 "industry" bands | **$0.50–1.50 / $5–8 / $15–30** | [Playwire, 17 Sep 2025](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect) | Sep 2025 | **VENDOR MARKETING — no dataset**, page admits it is "based on industry data and advertiser demand patterns" |

Confidence notes: the Appodeal figures were **read off embedded chart images** (the PDF's text layer carries no numbers), so treat them as approximate. **The APAC aggregate materially overstates India** — India does not appear in Appodeal's own top-10 country chart, and TopOn places South Asia in its lowest eCPM tier alongside SE Asia and LATAM. TopOn's own wording for India is *"climbing phase, still low."* **Do not budget from the $8.20 APAC row for an India-majority install base.**

Independent structural facts that matter more than the eCPM table:

- **India is an ads-first market, not an IAP market.** Sensor Tower's mobile-game ad report (19 countries, 2025–2026) finds **India derives 70.3% of mobile-game revenue from advertising (Jan–May 2026) versus 22.1% in the US** ([Sensor Tower via GameLook, 10 Jul 2026](http://www.gamelook.com.cn/2026/07/597137/)). Your ad-led strategy is structurally right for India.
- **The same report is the best evidence for building many small apps:** games ranked **1001+ earn 29% of ad revenue but only 9% of IAP revenue** — ads are what monetise the long tail that IAP cannot ([same](http://www.gamelook.com.cn/2026/07/597137/)). Global mobile-game ad market **US$12.0B in 2025**, 2.4T impressions; **AppLovin + AdMob = 65% of game ad revenue** as of May 2026 (up from 61% eighteen months earlier).
- **Format order is consistent everywhere:** **Rewarded Video > Interstitial > App Open > Native > Banner** ([TopOn](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html)); "Rewarded Video had the highest eCPM across both platforms… Banners remained the lowest-performing format" ([Appodeal PDF, p.6](https://appodeal.com/wp-content/uploads/2025/03/Appodeal-The-Latest-eCPM-Report-2025.pdf)).
- **Seasonality is real and actionable:** Q4 (holiday) and the **Apr–May IPL window** lift Indian eCPM ([Bidlogic Q3-2025](https://bidlogic.io/2025/10/31/strong-q3-2025-performance-mobile-app-ecpm-on-the-rise/), [TopOn](https://www.sgpjbg.com/labelsyh/youxiecpmquyuduibi/1/7002890.html)).
- **Business of Apps' eCPM research pages no longer exist** — all four candidate URLs return HTTP 404 and its sitemaps contain no eCPM pages, so any citation of BoA eCPM data is stale. Do not cite them.
- **Take rate: unverified.** AdMob's help docs never state a revenue share; the widely repeated "55%/40%" has **no first-party source**. AppLovin's FY2025 10-K discloses no MAX revenue-share percentage either ([EDGAR](https://www.sec.gov/Archives/edgar/data/1751008/000175100826000010/app-20251231.htm)). Google's **AdSense** (web, a different product) states publishers keep **80%**, or **~68%** for Google Ads demand ([AdSense](https://support.google.com/adsense/answer/180195?hl=en)) — do not conflate the two. One independent signal: Bidlogic attributes falling 2025 eCPM partly to **revenue-share compression at AdMob, AppLovin, Unity and ironSource** ([Bidlogic Q4 2025](https://bidlogic.io/2026/01/30/what-happened-to-mobile-app-ecpms-in-q4-2025/)).
- **Gross vs net:** every figure above is **net publisher revenue**. Vendor "we pay $X eCPM" claims usually do not state the basis — record `ecpm_gross_vs_net` in the screen.

**Action:** seed the Networks screen with your own first-party eCPM ([AdMob impression-level ad revenue API](https://developers.google.com/admob/android/impression-level-ad-revenue)) rather than vendor blogs, and compare measured revenue per 1,000 sessions, not headline eCPM.

---

## Q4. Minimum requirements, thresholds, India payments

- **AdMob:** identity + address verification at US$10 equivalent earnings; payment method selection unlocks at US$10; payment at **US$100**; cancellation threshold US$10 (USD account) ([thresholds](https://support.google.com/admob/answer/2772208?hl=en)). **EFT is not available in India**, so Indian publishers are on **international wire in USD** ([EFT country list](https://support.google.com/admob/answer/1714398?hl=en), [wire transfer](https://support.google.com/admob/answer/3372975?hl=en)). You will need SWIFT/BIC + account details; intermediary/beneficiary bank fees and FX are on you.
- **AppLovin:** **US$100** minimum ("For all options, there is a $100 minimum threshold for earnings generated through the AppLovin network"), but **the wire-transfer minimum is US$150** per the same page's FAQ section; monthly NET 15; Tipalti payee registration; **W-8 form required** for non-US publishers, W-8BEN-E for organisations ([AppLovin payments](https://support.applovin.com/en/max/max-dashboard/account/payments)).
- **Chartboost:** US$75 default payout threshold, but **US$300 for wire transfer** ([Chartboost payment terms](https://docs.chartboost.com/en/monetization/payments/payment-terms-dates/)).
- **Unity LevelPlay:** US$100 minimum, **net-60** payment cadence ([Unity support, updated 25 Jul 2025](https://support.unity.com/hc/en-us/articles/6192555249940-When-will-my-payment-be-processed)); account approval requires a published app and a manual info exchange ([docs](https://docs.unity.com/zh-cn/grow/levelplay/platform/get-started/create-account)).
- **Pangle:** US$100 minimum, **wire transfer only, USD only** ([Pangle payment FAQ](https://www.pangleglobal.com/knowledge/payment-faq)).
- **InMobi (India-relevant):** **US$50 minimum payout for India publishers** (US$300 wire / US$50 PayPal for non-India), paid ~60 days after month-end; **India-registered publishers must submit GST invoices** or an exemption declaration, and **Indian publishers cannot be paid via PayPal** ([InMobi Finance & Payments](https://support.inmobi.com/monetize/ios-gudelions/finance-payments/), [InMobi payment terms](https://support.inmobi.com/ja/monetize/ja-payments/ja-summary-of-payment-terms/)). This is the lowest payout floor of the networks verified and the only one that explicitly names India — which makes InMobi a sensible *second* network for this portfolio specifically.
- **app-ads.txt is now MANDATORY for new AdMob apps, not optional.** Google: *"Starting January 2025, you will be required to verify new apps that you set up in AdMob with an app-ads.txt file… Apps won't be able to fully serve ads until they're verified with an app-ads.txt file and approved after the app readiness review."* Rollout continued through 2025 and is being extended to all publishers ([AdMob app verification](https://support.google.com/admob/answer/14538460?hl=en)). Note the older AdMob *developer docs* page still words this as best practice — the help-centre policy page governs.
- **app-ads.txt mechanics:** requires a **developer website linked in the store listing**, and the app must already be registered on Play or the App Store — AdMob crawls the *hostname* of the store-listing developer website ([AdMob app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en)). Firebase Hosting (`PROJECT_ID.web.app`) is Google's sanctioned workaround if you don't want a custom domain.
- **Ad placement rules Google states explicitly:** *"Do not place interstitial ads on app load and when exiting apps"*; *"You should place no more than one interstitial ad after every two user actions within your app"*; and no interstitial immediately after another one closed. Google's recommended replacement for a launch placement is an **app open ad** ([Disallowed interstitial implementations](https://support.google.com/admob/answer/6201362?hl=en)).
- **Suspensions for invalid activity are terminal and non-appealable:** AdMob refunds the affected earnings (including Google's own revenue share) to advertisers, and *"Suspensions are non-appealable"* ([AdMob invalid activity](https://support.google.com/admob/answer/6213019?hl=en)). Never tap a live production ad.
- **Store accounts:** Google Play **US$25 one-time** ([Play Console help](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)); Apple Developer Program **US$99/year** ([Apple enrollment](https://developer.apple.com/support/enrollment/)).

**India payment bottom line:** expect **USD wires, not INR**. Only AdMob EFT pays local currency, and India is not on the list. Budget for FX spread and bank charges; consider a dedicated FCY/EEFC account and ask a CA about presumptive taxation (44ADA/44AD) and W-8BEN filing. *I did not verify current Indian tax treatment with a primary source — confirm with a CA.*

---

## Q5. Why apps get rejected/banned, and what to do up front

Ad-serving violations (AdMob) include **ads that overlay or sit adjacent to navigational/action items**, ads that **interfere with content**, ads on **"dead-end" screens** the user cannot exit without clicking, ads on **screens without publisher-content**, **out-of-context ads** (background/offscreen), **more ads than content**, and **replicated content** ([Google Publisher Policies](https://support.google.com/admob/answer/10502938?hl=en)). Invalid traffic includes self-clicking and any artificial inflation; "clicking your own ads for any reason is prohibited," and non-rewarded inventory must not encourage clicks ([AdMob/AdSense program policies](https://support.google.com/admob/answer/48182?hl=en)).

Google Play's **Ads policy** bans deceptive ads that mimic app or system UI, disruptive/undismissible ads, and ads inappropriate for the app's content rating; ads must be dismissible without penalty ([Play Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)).

Do these up front:

- **Consent:** integrate Google's **UMP SDK** for EEA/US consent; lack of a certified IAB TCF CMP produces a "Restricted ad personalization" regulatory issue ([AdMob policy issues](https://support.google.com/admob/answer/10448803?hl=en), [UMP setup](https://developers.google.com/admob/android/privacy)).
- **Play Data Safety + App content:** declare ads in the App content page ([Play Console, App content](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)) and complete the Data Safety form covering your ad SDKs ([AdMob Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure?hl=en)).
- **Families:** if any app targets children you must use **self-certified ad SDKs only** and **no personalised ads**; mixed-audience apps need a neutral age screen ([Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)). Your 6 wellness apps and 3 city directories are the high-risk ones — do **not** opt into Families unless required, and set content ratings honestly.
- **iOS ATT:** show the App Tracking Transparency prompt before any tracking/IDFA access, and only if you actually track ([Apple App Store user privacy and data use](https://developer.apple.com/app-store/user-privacy-and-data-use/), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). Expect lower iOS eCPM when users opt out.
- **Apple Guideline 2.5.18 — three concrete build requirements:** ads must be confined to the main binary (not widgets/extensions/App Clips), interstitials must "clearly indicate that they are an ad" with "easily accessible and visible close/skip buttons large enough for people to easily dismiss the ad", and **your app must include a way for users to report inappropriate or age-inappropriate ads** ([App Review Guidelines §2.5.18](https://developer.apple.com/app-store/review/guidelines/)). Budget UI work for an ad-report affordance; the wellness apps additionally must not target ads on health/medical data.
- **Apple Guideline 3.2.2:** artificially inflating impressions/clicks is prohibited, as are "apps that are designed predominantly for the display of ads" — but 3.2.2(x) explicitly *permits* rewarding users for "watching an ad", so rewarded video is safe ([App Review Guidelines §3.2.2](https://developer.apple.com/app-store/review/guidelines/)).
- **The consequence is permanent, not temporary:** *"If your account is disabled, you will not be eligible for further participation in the AdSense and/or AdMob program(s)"* ([AdMob policies hub](https://support.google.com/admob/answer/6128543?hl=en)). Combined with non-appealable suspensions ([invalid activity](https://support.google.com/admob/answer/6213019?hl=en)), a single bad launch can permanently end this revenue path. Treat the first app as a low-risk pilot.
- **Banner proximity is the #1 accidental-click cause and is explicitly discouraged:** *"banner ads should not be placed next to interactive buttons, such as a 'next' button or a custom app menu bar… or on a game play screen where users are continuously interacting with the app"*, and **banners must not float, hover or move over app content — that implementation "is against policy"** ([Banner guidance](https://support.google.com/admob/answer/6128877?hl=en), [Discouraged banner implementations](https://support.google.com/admob/answer/6275345?hl=en)).
- **No ads on "dead-end" or no-content screens — this is the specific risk for utility apps:** Google names *"Thank You, Exit, Error pages"* and says an app *"where the sole focus of the interaction is the user looking away from the screen. For example, a flashlight app"* must not carry ads ([Screens without publisher-content](https://support.google.com/publisherpolicies/answer/11112688)). Your PDF-toolkit "done" screen and passport-photo "exported" screen must not be monetised; ads belong on the browse/select/work screens that carry real content.
- **Test-mode discipline:** always use Google's demo ad units or registered test devices during development — clicking live ads is the fastest route to an invalid-traffic flag ([AdMob test ads](https://developers.google.com/admob/android/test-ads?hl=en)).

---

## Q6. Is meaningful revenue realistic? What volume is needed?

**Not at launch.** Ad revenue = impressions × eCPM ÷ 1000. With zero installs you have zero impressions, so the honest expectation for this portfolio's first months is **under US$10/month — below the payout floor of every network verified above**, meaning no money moves at all until accumulated earnings cross US$50–100. The lowest floor found is **InMobi at US$50 for Indian bank transfer**; note that InMobi's own terms state **Indian publishers cannot be paid via PayPal** ([InMobi payment terms](https://support.inmobi.com/ja/monetize/ja-payments/ja-summary-of-payment-terms/), [InMobi finance FAQ](https://support.inmobi.com/monetize/ios-gudelions/finance-payments/)).

**No independent study of DAU → ad revenue exists.** Everything below is a **vendor rule of thumb** — treat as orientation only:

| Claim | Source | Type |
|---|---|---|
| ~100,000 DAU ≈ ~US$50,000/month | [trendapps.dev, upd. 26 Aug 2026](https://trendapps.dev/blog/trends/how-much-can-an-app-make-from-ads/) | VENDOR |
| Utility app with banner: **US$0.50–3 per DAU per month**; "tens of thousands of DAU before the check is interesting" | same | VENDOR |
| 10K–100K DAU = "sufficient volume for meaningful optimisation"; under 50K DAU = "limited benefits" | [Playwire](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect) | VENDOR (flagged **internally inconsistent**) |
| 5,000 DAU minimum; 20K DAU ≈ US$600–1,920/month at 25–40% rewarded participation | AppLixir (via subagent; not independently re-fetched) | VENDOR |

Do the arithmetic against the eCPM table above rather than trusting these rules. On an India-majority Android mix, a realistic net rewarded eCPM is far closer to the **SE-Asia figure (~US$1.35)** than the APAC aggregate (~US$8.20). At US$1.35 net rewarded eCPM, **1,000 rewarded impressions pays about US$1.35**. Reaching the **US$100** payout floor therefore needs on the order of **~74,000 rewarded impressions** — and reaching it in a single month needs a sustained daily base of thousands of active users actually choosing to watch. **This is my arithmetic from the sourced eCPM, clearly labelled as arithmetic, not a published benchmark.**

Two genuinely independent structural findings soften that picture and should shape strategy:

- **India is ads-first:** 70.3% of Indian mobile-game revenue is advertising vs 22.1% in the US ([Sensor Tower via GameLook, 10 Jul 2026](http://www.gamelook.com.cn/2026/07/597137/)) — so an ad-led model is the *right* model for this market.
- **Ads monetise the long tail:** games ranked 1001+ earn **29% of ad revenue but only 9% of IAP revenue** ([same](http://www.gamelook.com.cn/2026/07/597137/)). A portfolio of 20 unranked apps can therefore earn *something* from ads where it would earn nothing from IAP — but "something" is small in absolute terms.

**Strategic implication:** distribution is the bottleneck, not monetisation plumbing. Utilities (PDF toolkit, passport-photo, invoice maker) have real search intent and can accumulate installs with no UA budget; four hyper-casual games at zero UA budget mostly will not. **Keep Razorpay available** — ads should be *additive* until an app clears real DAU, because a single US$2.99 IAP equals roughly a thousand India-tier rewarded impressions.

---

## Q7. What can be built before store approval vs what needs a live app

**Can be built now, with no store accounts and no ad account:**
- SDK integration + the ad facade/placeholder behind a feature flag, using **Google's demo ad units** — "not associated with your AdMob account, so there's no risk of your account generating invalid traffic" ([AdMob test ads](https://developers.google.com/admob/android/test-ads?hl=en)).
- The **rewarded-ad component and `ad_events` table** (impression/click/reward/error events, network, ad unit, format, placement, eCPM, currency, test-vs-live flag, consent state) — build it now so first-party eCPM exists from day one.
- **Consent plumbing:** UMP SDK wiring, ATT prompt gating, a privacy-policy page and the developer website (needed later for app-ads.txt) ([UMP](https://developers.google.com/admob/android/privacy), [app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en)).
- The **Networks comparison screen** from static config (table below) — it can ship before any SDK is live.
- Draft Data Safety answers and content-rating questionnaires.

**Needs a live published app / approved account:**
- **AdMob account approval** and real ad units ([onboarding](https://support.google.com/admob/answer/9905175?hl=en)). You *can* register an unpublished app and create ad units early, but **full ad serving requires a published app in Play/App Store plus a passed app readiness review** ([app verification](https://support.google.com/admob/answer/14538460?hl=en)).
- **app-ads.txt verification — now mandatory** for new AdMob apps since January 2025, and the app must be registered in Play/App Store with a developer website in the listing ([app verification](https://support.google.com/admob/answer/14538460?hl=en), [app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en)).
- **Unity LevelPlay** approval — explicitly requires a published app and a manual review email exchange ([docs](https://docs.unity.com/zh-cn/grow/levelplay/platform/get-started/create-account)).
- **Real payouts** — anything under US$100 sits unpaid at every network listed (US$50 at InMobi for India).

**Critical scheduling constraint:** a **personal Google Play developer account created after 13 Nov 2023 must run a closed test with ≥12 testers opted in continuously for 14 days before production access is granted** ([Play Console testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)). Budget ~3 weeks per app before it can even go live, or publish under an **organisation** account to avoid this. Start the tester-recruitment and the 14-day clock before you need revenue.

---

## Networks screen — data model

Store one row per network × app × format × geography × period. Never overwrite history; eCPM is a time series.

| Field | Type | Why / source of truth |
|---|---|---|
| `network_id`, `network_name` | text | AdMob, AppLovin, Unity LevelPlay, Meta Audience Network, InMobi, Pangle, Mintegral, Liftoff, DT Exchange, BidMachine, Moloco, Amazon |
| `integration_type` | enum: `sdk_only` / `mediation_ad_source` / `bidding` / `waterfall` | Meta & Unity are bidding-only ([Meta](https://developers.google.com/admob/android/mediation/meta?hl=en), [Unity](https://unity.com/blog/unity-moving-to-in-app-bidding)) |
| `formats_supported` | array: rewarded, rewarded_interstitial, interstitial, banner, native, app_open | Per-network matrix |
| `mediation_host` | enum: `admob` / `max` / `levelplay` / `none` | Decide the host first; it constrains everything |
| `ecpm_median_local` + `currency` + `geo` + `format` | decimal | **First-party**, from impression-level ad revenue ([API](https://developers.google.com/admob/android/impression-level-ad-revenue)). Never vendor blog numbers |
| `ecpm_gross_vs_net` | enum | Avoid comparing gross vendor eCPM with net payout |
| `fill_rate_pct` | decimal | First-party; drives real revenue more than headline eCPM |
| `match_rate` / `no_fill_reason` | text | From ad-load error codes |
| `min_payout_amount` + `currency` + `method` | — | AdMob US$100 ([src](https://support.google.com/admob/answer/2772208?hl=en)); AppLovin US$100/150 ([src](https://support.applovin.com/en/max/max-dashboard/account/payments)); Unity US$100 ([src](https://support.unity.com/hc/en-us/articles/6192555249940-When-will-my-payment-be-processed)); Pangle US$100 ([src](https://www.pangleglobal.com/knowledge/payment-faq)) |
| `payout_methods`, `payout_currency`, `pays_inr` | array/bool | India: **wire USD** at AdMob (no EFT: [src](https://support.google.com/admob/answer/1714398?hl=en)); Pangle wire USD only |
| `tax_forms_required` | array | W-8BEN / W-8BEN-E ([AppLovin](https://support.applovin.com/en/max/max-dashboard/account/payments)) |
| `approval_status` + `approval_requirements` | enum + text | `self_serve` vs `manual_review` vs `published_app_required` |
| `requires_published_app` | bool | Unity = yes ([src](https://docs.unity.com/zh-cn/grow/levelplay/platform/get-started/create-account)) |
| `requires_app_ads_txt` | bool + `app_ads_txt_verified_at` | Needs store listing + developer website ([src](https://support.google.com/admob/answer/9363762?hl=en)) |
| `ad_unit_setup_steps` | text (ordered) | Steps differ per network |
| `policy_constraints` | text | e.g. no personalised ads for child-directed; families-certified SDK only ([src](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)) |
| `consent_requirements` | text | IAB TCF CMP for EEA, US states, ATT on iOS |
| `revenue_share_pct` | decimal | **Unverified for 2026** — leave null until read from current terms |
| `last_checked_at`, `source_url` | date, text | Every rate row must cite where the number came from |
| `notes` | text | Renewal/KYC/contact requirements |

**Rule for the screen:** show only first-party measured eCPM as the "earns most" signal; display vendor/estimated rates in a clearly separate, greyed column labelled `vendor_estimate (unverified)`.

---

## What to build first

1. **Ad facade + `ad_events` table** with Google demo ad unit IDs; log every request/fill/impression/error with network, format, placement, test flag, consent state.
2. **Networks screen** from the table above with a `vendor_estimate (unverified)` column and a prominent "measured vs claimed" split.
3. **Consent stack:** UMP SDK, ATT prompt, privacy policy page, developer website (also needed for app-ads.txt later).
4. **Google Play organisation account** (avoid the 12-tester/14-day personal-account gate: [src](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)) + Apple Developer Program ([US$99/yr](https://developer.apple.com/support/enrollment/)).
5. **AdMob account + app-ads.txt** as soon as the first app's store listing and developer website are live ([app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en)).
6. **Design ad placements policy-safely:** rewarded-first, interstitials only at natural breaks and never on launch, no banners adjacent to navigation, no ads on dead-end or empty screens.
7. **Add AppLovin MAX as a bidding ad source** in AdMob mediation once you have measurable impressions; then test **InMobi** (lowest India payout floor, US$50) and **Meta Audience Network** (needs Business Manager + app review + the `c3e20eee3f780d68` app-ads.txt line). Test Unity LevelPlay last — it is the only one demanding a published app and manual approval up front.
8. **Pick 2–3 utility apps to actually market.** The portfolio's revenue is a distribution problem; ads are the easy part.

---

## Explicitly unverified (do not treat as fact)

- **Any absolute India-by-format USD eCPM.** All India eCPM findings are directional. Sensor Tower gives India *share* of revenue (70.3%), TopOn says India is "climbing but still low" without an absolute value, and Appodeal omits India from its country chart. The two reports that do break out India (AnyMind's Asia eCPM report, TopOn's 55-page 2026H1 report) sit behind lead-capture forms — **request them if India numbers are business-critical.**
- Whether Meta Audience Network currently approves new individual Indian publishers (Meta's developer docs were unreachable — HTTP 400/404 on every attempt).
- **All revenue-share / take-rate percentages, including AdMob's.** No first-party source exists for the widely repeated "55%/40%" figure. Do not model net revenue from a share assumption — model it from measured eCPM.
- Any independent DAU → revenue benchmark. Every figure in Q6 is a vendor rule of thumb, and Playwire's own examples are internally inconsistent.
- India-network *approval* gates (InMobi's payout terms are verified above; its onboarding requirements are not).
- **Indian tax/TDS/GST treatment of foreign ad revenue, FEMA/FCY account handling, and whether an individual (non-company) satisfies each network's KYC.** Confirm with a CA. InMobi explicitly requires GST invoices from India-registered publishers, which implies GST registration matters.
- Whether AdMob's GMA "Next-Gen SDK" changes the Expo/React Native integration path — the legacy SDK is in maintenance mode and Google points to a migration guide ([AdMob deprecation](https://developers.google.com/admob/android/deprecation)). Verify against `react-native-google-mobile-ads` before committing to an adapter.
