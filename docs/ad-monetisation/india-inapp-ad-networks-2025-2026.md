# Mobile In-App Ad Monetisation Networks — 2025/2026 State of Play
### Perspective: small Indian developer (Indore), Google Play + Apple App Store, publisher/monetisation side

**Method / labelling**
- `[OFFICIAL]` = the network's own site/docs/contract.
- `[NON-OFFICIAL]` = third-party integrator docs, trade press, agency blogs — labelled inline.
- `NOT VERIFIED` = I could not confirm from any source in this session. I do **not** guess.
- Pages were fetched in this session; visible "last updated"/publication dates are quoted where the page showed one.
- Where a mobile-app-specific page is login-gated (Amazon `ams.amazon.com/webpublisher/uam/docs/aps-mobile/*`), I say so.

---

## 1. AMAZON PUBLISHER SERVICES (APS) / AMAZON ADS

**Which side is which**
- **APS = publisher/monetisation side**: Transparent Ad Marketplace (TAM), Unified Ad Marketplace (UAM), Connections Marketplace, Signal IQ, Amazon Publisher Cloud, Shopping Insights. ([aps.amazon.com](https://aps.amazon.com/aps/contact-us/))
- **Amazon Ads / Amazon DSP = advertiser side** (you buying traffic). "Amazon Ads for apps" advertiser specifics (min spend, INR billing, self-serve app-install campaigns for India) — **NOT VERIFIED** in this session.

### 1.1 Account approval
- **Invitation / application + review. Not self-serve.** `[OFFICIAL]` UAM FAQ: *"Unified Ad Marketplace is an invitation-only service. Generally speaking, UAM is designed for web publishers who directly or exclusively represent their site and use Google Ad Manager (formerly DoubleClick for Publishers or DFP) as their ad server."* — [publishers.advertising.a2z.com/aps/unified-ad-marketplace](https://publishers.advertising.a2z.com/aps/unified-ad-marketplace/index.html)
- `[OFFICIAL]` TAM page: *"An invitation is required."* — [publishers.advertising.a2z.com/aps/solutions/transparent-ad-marketplace](https://publishers.advertising.a2z.com/aps/solutions/transparent-ad-marketplace/)
- `[NON-OFFICIAL]` Digital Turbine/DT FairBid integrator docs: *"Amazon Publisher Services (APS) is an invitation-only program. To create an APS account, request an invitation from APS. Once approved, APS sends an invitation with instructions on creating your APS account."* — [docs.digitalturbine.com](https://docs.digitalturbine.com/dt-fairbid/fairbid-sdk/supported-networks/network-integration-guides/amazon-publisher-services.md)
- **What the application asks** `[OFFICIAL]` — the mobile-app branch of the APS Contact Us form collects: first/last name, email, **Company**, **Company Size (1 / 2–19 / 20–99 / 100–499 / 500–999 / 1000+)**, title, "What type of app(s) do you manage?" (Owned & operated / Third party / Both / Other), **"How many apps do you manage?"**, **App store URL(s)**, **ad server or mediator** (Google Ad Manager / MAX / AdMob / Unity LevelPlay / DT Fairbid / Nimbus / Custom / Other / None / I don't know), **Country (India is selectable)**. — [aps.amazon.com/aps/contact-us](https://aps.amazon.com/aps/contact-us/)
- **KYC / entity / GST:** no published list. The form's *Company* + *Company Size* fields suggest a business entity is expected, but **Company Size includes "1"**, and there is **no published statement** that an Indian sole proprietor/individual is barred → **NOT VERIFIED** either way.
- **Minimum traffic / revenue:** **no published threshold** in any official APS page I could reach. `[NON-OFFICIAL]` Playwire (a monetisation vendor) states Amazon publishes no eligibility criteria, no violation taxonomy, no appeal path, and that the review covers content governance/brand safety in addition to scale: [Playwire APS review](https://www.playwire.com/blog/amazon-publisher-services-review-what-publishers-need-to-know-before-applying) (published 2026-08-06).
- **"APS only takes big US/EU-traffic publishers":** partially contradicted — `[OFFICIAL]` UAM FAQ says *"With UAM, publishers around the world can monetize their traffic. Size of advertiser demand can vary across countries."* A hard US/EU traffic minimum is **NOT VERIFIED**.
- **Regional:** India is explicitly in the APS country dropdown (`[OFFICIAL]`, contact-us form). No India-specific exclusion found.

### 1.2 app-ads.txt
- **Required in practice for apps.** `[OFFICIAL]`-adjacent: the APS Portal has an **"APP-ADS.TXT SETUP"** action per app that generates the app-ads.txt content you then host. Sources: DT FairBid (*"Update your `App-ads.txt` file to include the APS Portal"*) — [docs.digitalturbine.com](https://docs.digitalturbine.com/dt-fairbid/fairbid-sdk/supported-networks/network-integration-guides/amazon-publisher-services.md) — and TradPlus (*"Inventory → App & Slot Integration → APP-ADS.TXT SETUP"*), both `[NON-OFFICIAL]`.
- **Hosting location:** root of your developer website (per IAB app-ads.txt spec, same as everyone).
- **Exact generated line (domain + account ID string):** `NOT VERIFIED` — the APS mobile documentation at `ams.amazon.com/webpublisher/uam/docs/aps-mobile/resources` redirects to an Amazon sign-in wall; I could not read it without an APS account.

### 1.3 Privacy policy
- **REQUIRED — this is contractual.** `[OFFICIAL]` APS Agreement, General Terms §2(d): *"We will on our site, and you will on Your Properties make accessible a privacy policy that abides by all applicable Laws and we and you will adhere to its respective privacy policy. Your privacy policy will adequately inform your end users about any information relating to end users that you will provide or is otherwise accessible to us…"* — Agreement **Last Updated February 24, 2025**: [ams.amazon.com/webpublisher/apsmanaged/apsagreement](https://ams.amazon.com/webpublisher/apsmanaged/apsagreement)
- The same clause says you will not send ad requests from sites directed at Children / from users known to be Children.

### 1.4 Minimum payout
- **UAM: USD $5.** `[OFFICIAL]` UAM FAQ: *"UAM consolidates earnings from all bidders and issues one payment on a net 60-day basis. For example, revenue earned in January net of tax will be paid at the end of March if it meets the **USD $5 minimum earnings threshold**."* — [publishers.advertising.a2z.com/aps/unified-ad-marketplace](https://publishers.advertising.a2z.com/aps/unified-ad-marketplace/index.html)
  - This directly contradicts the common "APS has a high threshold" belief **for UAM**.
- **Amazon Demand via APS:** `[OFFICIAL]` APS Agreement (Amazon Demand Program Specific Terms, §Payment): *"We will make payment within 60 days from the end of the calendar month during which the advertising fees were earned."* **No dollar threshold is stated in the agreement.** — [apsagreement](https://ams.amazon.com/webpublisher/apsmanaged/apsagreement)
- **TAM:** `[OFFICIAL]` *"You agree that you will receive payment from TAM Buyers directly… We will not make any payment… We are not a party to… the TAM Buyer Direct Agreements."* → payout threshold is set by **each SSP/buyer**, not Amazon: `NOT VERIFIED` per-buyer.
- **Mobile-app (APS SDK) threshold: `NOT VERIFIED`** — no public official figure found. (Do not confuse with Amazon **KDP** payment thresholds, which are a different business: [kdp.amazon.com/en_US/help/topic/G201207800](https://kdp.amazon.com/en_US/help/topic/G201207800).)

### 1.5 Payment methods in India
- `[OFFICIAL]` APS Agreement §Payment: *"Payments will be made in **USD, local currency or any other currency agreed in advance** between the Parties. The exchange rate (if applicable) will be based on the data supplied to us by Bloomberg… in the form of average monthly exchange rate for a given month. If applicable, **we may deduct any currency conversion fees** paid in connection with currency exchange."*
- `[OFFICIAL]` Taxes clause: you may charge VAT/sales/use tax **only if stated separately on a valid tax invoice**; *"We may **deduct or withhold any taxes** that we may be legally obligated to deduct or withhold from any amounts payable to you"*; *"you will provide us with any forms, documents, or certifications as may be required by us to satisfy any information reporting or **withholding tax obligations**."* → this is the W-8BEN / W-8BEN-E territory for a non-US publisher, though the form names are not stated on the page.
- `[OFFICIAL]` **Contracting entity:** *"an agreement between **A9.com LLC** and **Amazon Europe Core S.a.r.l.**"*; governing law **Washington State**, exclusive venue **King County, Washington**. → An Indian publisher contracts with the **US** entity (A9.com LLC) for non-EU inventory.
- **India-specific rails (NEFT/wire/ACH/PayPal/Payoneer/Tipalti), INR support, FX spread, GST zero-rating/export treatment, TDS/withholding rate:** `NOT VERIFIED` — no public official APS page found. The agreement only guarantees the clauses quoted above.
- **Fees:** `[OFFICIAL]` TAM = *"A transparent **2.5% service fee charged to bidders**"*; UAM = *"UAM charges a **10% transaction fee** from SSP and Amazon bid prices prior to conducting a first price auction"*; Auction Mechanisms policy: *"fees… reflect a transaction fee that we deduct from Amazon Demand and UAM bid prices on a pre-auction, per auction basis."* (TAM Fees page / UAM FAQ / [apsprogrampolicy](https://ams.amazon.com/webpublisher/apsmanaged/apsprogrampolicy))
- `[NON-OFFICIAL]` Playwire: a 10% publisher transaction fee was applied to Amazon DSP demand in Sept 2023 with ~30 days' notice.

### 1.6 Live published app required?
- Partly. The **application** asks for **App store URL(s)** (`[OFFICIAL]`), and the TAM FAQ says the *"only technical requirement… is active integration with the multi-slot header bidding tag"* plus contracts with your demand partners. `[OFFICIAL]`
- Whether you can create apps/slots in the APS Portal **before** the app is live: `NOT VERIFIED` (portal docs login-gated).
- Third-party integration docs describe the portal flow as: Add App → Add Slots → app-ads.txt → SDK init. `[NON-OFFICIAL]`

### 1.7 Ad formats + integration type
- `[OFFICIAL]` TAM FAQ: *"Dynamic display banners, streaming TV (open beta), and pre-roll video on desktop and mobile web. **In-app mobile display and video units require separate SDK integration.**"*
- `[NON-OFFICIAL]` DT FairBid: APS supports **Banner, Interstitial, Rewarded** — [docs.digitalturbine.com](https://docs.digitalturbine.com/dt-fairbid/fairbid-sdk/supported-networks/network-integration-guides/amazon-publisher-services.md)
- `[OFFICIAL]` Mobile page: *"Single point access — One light SDK setup to make all demand partners compete in parallel"*; *"Powering in-app 'header' bidding for developers since 2015"* — [aps.amazon.com/aps/services/mobile-app-developers](https://aps.amazon.com/aps/services/mobile-app-developers/)
- **Integration type:** SDK + **in-app header bidding**; certified adapters exist through AppLovin MAX, Unity LevelPlay, AdMob/GAM, DT FairBid, Nimbus, TradPlus, TopOn (mediator list is from the official APS application form + `[NON-OFFICIAL]` integrator docs).
- **App open / rewarded interstitial:** not documented in any APS page I reached → treat as **not supported / NOT VERIFIED**.
- **2026 direction:** APS Summit 2026 announced a **Mobile SDK bridge (with InMobi)**, interactive + **shoppable video ads open beta** (Fire TV / Fire OS), Signal IQ, Publisher Supply AI, Shopping Insights deals — [APS resource page](https://aps.amazon.com/aps/resource/amazon-publisher-services-unveils-new-capabilities-at-annual-summit/) and [Amazon Developer Community, 2026-06-01](https://community.amazondeveloper.com/t/june-1-2026-appstore-sdk-3-0-9-aps-shoppable-ads/28457).
- **Amazon Publisher Cloud** `[OFFICIAL]`: clean-room-style data collaboration; **US/Canada only** — the agreement says you may not process *"Personal Information of individuals subject to data protection Laws other than those of the United States and Canada"* → **not usable for Indian-traffic inventory**.

---

## 2. BIDMACHINE (Bidease)

### 2.1 Account approval
- **Self-serve signup, no invitation.** `[OFFICIAL]` docs: 1) Create account at bidmachine.io → 2) **activation email** with instructions → 3) configure dashboard (payment info, ad formats). Publishes a public `Sign Up As A Publisher` route — [developers.bidmachine.io/sdk/overview](https://developers.bidmachine.io/sdk/overview), [bidmachine.com/sign-up-publisher](https://www.bidmachine.com/sign-up-publisher)
- **Individuals allowed.** `[OFFICIAL]` ToS: *"If you are an individual user… you must be at least 18 years old."* No company/KYC/GST requirement published. — [Terms of Service, last update Jan 17, 2024](https://www.bidmachine.com/terms-of-service)
- **Minimum traffic / installs / prior revenue:** **none published** → `NOT VERIFIED`. There may be a manual review after email activation — `NOT VERIFIED`.
- **Live app required (contractual):** `[OFFICIAL]` ToS §3 and §6: *"You must have an active application that is currently published in the App Store, Google Play. If at any point the application is removed from those platforms, but impressions generated from BidMachine ads continue… you may not receive earnings derived from such impressions."*
- **Regional:** global; no country list or India restriction found. Entity: **Bidmachine, Inc., a Delaware corporation**; governing law **California** (N.D. Cal.). Note the ToS legal contact is `legal@appodeal.com` and website address is McLean, Virginia — `[NON-OFFICIAL]` inference: Appodeal-group affiliation.

### 2.2 app-ads.txt
- **Yes — BidMachine generates it for you.** `[OFFICIAL]` Getting Started step 4: *"Update your app-ads.txt file with the BidMachine data from the dashboard. You can find the file in the dashboard under `Dashboard > app-ads.txt`."* Console Setup repeats: *"Access the app-ads.txt tab in the BidMachine dashboard, copy the content, and append it to **your website's** app-ads.txt file."* — [developers.bidmachine.io/sdk/overview](https://developers.bidmachine.io/sdk/overview), [Console Setup](https://developers.bidmachine.io/sdk/admob/admob-bidding-console)

### 2.3 Privacy policy
- `[OFFICIAL]` ToS §10: publisher consents to BidMachine's Privacy Policy; *"It is your responsibility to obtain any and all consents, waivers, approvals, authorizations, and clearances from end users that may be required by applicable laws."*
- `[OFFICIAL]` Getting Started step 5: *"Update your CMP… to include recommended vendors"* ([TCF vendor list](https://developers.bidmachine.io/sdk/general/tcf-vendors)).
- SDK auto-reads IAB TCF v2 / US Privacy / GPP strings; `setCoppa(true)` and `setNonPersonalized(true)` manual APIs. — [BidMachine Plus Mediation privacy docs](https://mediation-docs.bidmachine.io/ios/privacy)
- BidMachine also publishes the exact declarations your app should make: [Google Play privacy details](https://developers.bidmachine.io/sdk/general/android/app-privacy-details-on-the-google-play), [App Store privacy details](https://developers.bidmachine.io/sdk/general/ios/app-privacy-details-on-the-app-store).
- An explicit *"your app must link a privacy policy"* sentence in BidMachine's own publisher docs: `NOT VERIFIED` (it is required by Google Play / Apple anyway).

### 2.4 Minimum payout
- **USD $1,000.** `[OFFICIAL]` Payments doc and ToS §6: *"The minimum payable amount is **$1,000**. If the revenue generated in any given month is less than $1,000, no payment will be issued and the revenue of that month will be added to next month's payment."* — [developers.bidmachine.io/dashboard/payments](https://developers.bidmachine.io/dashboard/payments); [ToS §6](https://www.bidmachine.com/terms-of-service)
- **Net-60** terms; dispute window **45 days**; *"All payments may be subject to banking fees."*
- **Closing out:** if you stop before reaching $1,000, email support to close the account and request the remaining balance.
- **Important carve-out:** for **Google SDK Bidding Transactions** (AdMob/GAM mediation), BidMachine remits to Google and **Google pays you** under your Google agreement — the net-60 / $1,000 terms **do not apply** to those amounts. `[OFFICIAL]`

### 2.5 Payment methods in India
- `[OFFICIAL]` Payments are made to **"your bank account"**; statuses Pending (up to 5 days) / Completed (*"successfully sent to your bank account"*) / Rejected.
- **Currency, rails (wire/PayPal/Payoneer), tax forms, GST/TDS:** `NOT VERIFIED` — BidMachine's public docs do not state them. Threshold is quoted in USD, and ToS says payments may be subject to banking fees.
- **Contracting entity:** Bidmachine, Inc. (Delaware, USA); California law. If you route through AdMob/GAM, you are paid by **Google** instead (Google's India payout terms then apply).

### 2.6 Live published app required?
- **Yes — contractually (see 2.1).** Separately, placements **can** be created in the dashboard against a bundle ID (Android `com.example.app`; iOS **numeric store ID**, e.g. `123456789`) — [Placements doc](https://developers.bidmachine.io/dashboard/placement). So integration can be prepared, but you must be live to be paid.

### 2.7 Ad formats + integration type
- `[OFFICIAL]` Placement creation "Ad Type" options: **Banner, Interstitial, Rewarded Video** (docs phrase it as *"such as banners, interstitials, and rewarded videos"*). **Native** appears in the official AdMob console price-point table heading *"Banners/Native/Mrec"* → native is supported for mediation mapping. **App open / rewarded interstitial: not documented → `NOT VERIFIED` / assume unsupported.**
- Placement options include **Placement Type = Bidding (real-time auction) or Waterfall (sequential by priority)**, **HVA Setup** (parallel higher price floor), **Price Floor**. Waterfall adapter is **BETA** (contact your account manager).
- **Integration:** BidMachine SDK (Android / iOS / Unity); **bidding adapters** for AppLovin MAX, Unity LevelPlay (IronSource), AdMob/GAM; waterfall adapter (beta); **OpenRTB** for publishers with their own SSP. — [Integration Types](https://developers.bidmachine.io/sdk/integration-types)
- **Gotcha (official):** BidMachine **will not bid** unless *Secure Signal sharing* is enabled and BidMachine is allowed under User Consent settings in AdMob/GAM — these toggles are **off by default**.
- **Incentivised traffic:** **rewarded format only**; monetary rewards (cash/gift cards/crypto) prohibited. ToS §7.

---

## 3. MOLOCO (Moloco Ads / Moloco SDK for Publishers)

### 3.1 Account approval
- **Self-serve signup form exists, but onboarding is rep-assisted.** `[OFFICIAL]` The publisher landing page's CTA goes to **publisher.moloco.cloud/signup** (fields: First name, Last name, Email address, agree to Privacy Policy) — [moloco.com/capabilities/moloco-ads/sdk](https://www.moloco.com/capabilities/moloco-ads/sdk), [publisher.moloco.cloud/signup](https://publisher.moloco.cloud/signup). However the help centre repeatedly defers to **"your Moloco representative"** (e.g. *"reach out to your Moloco representative for support"*, *"contact your Moloco representative"*), and the legacy publisher SDK doc says *"Please work with your Moloco representative to receive the ad unit ID."*
- **App count / install volume / prior revenue minimums:** **none published** → `NOT VERIFIED`.
- **Individual vs company:** **both allowed.** `[OFFICIAL]` payment setup has a required **Type** field with options **Individual** and **Company**; choosing Individual requires legal first/last name, **country of birth** and **date of birth** (i.e. KYC-style data) — [Add and edit payment information](https://help.publisher.moloco.com/hc/en-us/articles/26777616091799-Add-and-edit-payment-information)
- **Regional:** global — *"230 countries and territories served by Moloco Ads"* `[OFFICIAL]` ([moloco.com](https://www.moloco.com/)). India not restricted.
- **Scale signals** `[OFFICIAL]`: *"2X more publishers adopted the Moloco SDK in 2025"*; and per **AppGoblin App SDK Report 2025 (Jan 2026)**, Moloco was 2025's #1 fastest-growing ad network by net new integrations (52,287 apps analysed).

### 3.2 app-ads.txt
- **NOT REQUIRED.** `[OFFICIAL]` FAQ: *"Where can I find the app-ads.txt for Moloco bidding? **Moloco operates with direct demand only, so app-ads.txt is not required for our platform.**"* — [Moloco SDK FAQs](https://help.publisher.moloco.com/hc/en-us/articles/28449905072151-FAQs)

### 3.3 Privacy policy
- `[OFFICIAL]` Payment/onboarding step: *"Agree to all Terms of Service and Privacy policy"* (your agreement with Moloco — not a statement about your app's policy).
- `[OFFICIAL]` FAQ: complies with **GDPR, CCPA and other data privacy laws**; TCF v2.0 and v2.2 compliant; **Global Vendor ID 807**; *"Moloco supports user privacy frameworks such as GDPR, COPPA, and Apple ATT **automatically**"*; **SKAdNetwork IDs are handled server-side** (you do not add them).
- Whether Moloco requires your app to link its own privacy policy: `NOT VERIFIED` from Moloco docs.

### 3.4 Minimum payout
- **`NOT VERIFIED` — not published.** `[OFFICIAL]` *"Your invoice is automatically generated at the end of every month and payment is processed according to the **payment terms outlined in your contract**."* — [View invoices and payment history](https://help.publisher.moloco.com/hc/en-us/articles/26777640363927-View-invoices-and-payment-history)

### 3.5 Payment methods in India
- `[OFFICIAL]` **Payment method: "Direct Deposit / ACH (for US only)" or "Wire Transfer".** For Wire Transfer the **currency field offers USD only** (*"At this time, USD is the only available option"*), and you must supply: beneficiary government-issued ID (passport/driver's licence/national registration number), phone number, **SWIFT**, bank name + full bank address, optional intermediary bank details.
- `[OFFICIAL]` **Tax forms** are completed during onboarding from a list of options; Moloco states *"Moloco is NOT authorized to provide any tax advice"* and links **Tipalti** tax resources (Tipalti is the tax/payments backend).
- `[OFFICIAL]` Moloco also runs a **Zip Supplier Portal (ZSP)** for supplier onboarding / banking / invoicing — [moloco.com/terms-and-policies/supplier-portal](https://www.moloco.com/terms-and-policies/supplier-portal). (Mostly relevant to supplier/partner contracting rather than a small SDK publisher.)
- **FX fees, INR payout support, GST/TDS treatment, and the contracting entity for Indian publishers:** `NOT VERIFIED`.
- **Contact for payment issues:** `usap@moloco.com` (US Accounts Payable).

### 3.6 Live published app required?
- **No — you can register an app that is not yet live.** `[OFFICIAL]` App creation has a conditional field: *"**App is available in-store** — If the app is publicly available for download, you must check this box"*, and you can *"manually enter"* app details instead of picking a store listing. You can therefore create apps **and ad units** before launch. — [Create and manage apps](https://help.publisher.moloco.com/hc/en-us/articles/26774514524183-Create-and-manage-apps), [Create and manage ad units](https://help.publisher.moloco.com/hc/en-us/articles/26774587841047-Create-and-manage-ad-units)
- App creation requires OS (Android/iOS, **not editable later**), market (Google Play / other: OneStore, Galaxy Store), bundle ID, IAB category; COPPA and CCPA flags.

### 3.7 Ad formats + integration type
- `[OFFICIAL]` **Ad unit inventory types:**
  - **Banner:** Display
  - **Interstitial:** Display, Video, HTML
  - **Rewarded Video:** Video, HTML
  - Auction method: **In-app bidding only** (the only option; not editable after creation).
  - **Native is not in this list** → `NOT VERIFIED` (the stale GitHub `libs/publisher` JS doc mentions BANNER/NATIVE for WebView, but also says "Android SDK: N/A / iOS SDK: N/A").
- `[OFFICIAL]` **Integration:** certified **in-app header-bidding** adapters for **AppLovin MAX (≥13.0.0)**, **Unity LevelPlay**, **Google AdMob**, **Google Ad Manager**; **custom adapters are deprecated** and **waterfall is deprecated**. SDK supports iOS 13+ / Android API 21+, Unity supported. Testing via MAX Mediation Debugger / LevelPlay Test Suite / Ad Inspector.
- **OpenRTB-only / web (non-mediation) integration:** the legacy moloco.js publisher doc exists but is marked N/A for native SDKs → `NOT VERIFIED` as a current product.

---

## 4. INDIA-FOCUSED NETWORKS
> Reminder: for each, I separate **(a) monetising your app with their ads (publisher side)** from **(b) promoting your app through them (advertiser/UA side)**.

### 4.1 AFFLE (affle.com / mediasmart / Jampp)
- **Publisher side (a): `NOT VERIFIED` — evidence says it does not exist for third-party apps.** Affle's own site describes an **advertiser/marketer** business: *"enabling **marketers** to engage with audiences…"*, "Affle 3i Consumer Platform Stack", 130+ markets, 4bn+ connected devices, OpticksAI creative generation, CTV AI — no publisher signup, no publisher SDK, no payout terms. [affle.com](https://affle.com/) (fetched this session).
- **mediasmart** (Affle-owned) is a **demand-side/omnichannel programmatic platform** for advertisers, with a self-serve advertiser console (`console.mediasmart.io/signup`) and solutions like CTV Sync, DOOH, Impactful Mobile Ads — again **advertiser side**. [mediasmart.io](https://www.mediasmart.io/), [blog.mediasmart.io](https://blog.mediasmart.io/)
- **Jampp** = app user-acquisition / retargeting (advertiser side) — same conclusion.
- Because there is no verifiable publisher program, items **2–7 (app-ads.txt, privacy policy, minimum payout, payment methods, live app, formats) are NOT APPLICABLE / NOT VERIFIED on the publisher side.** Do not plan on Affle as a monetisation partner.
- **Advertiser side (b):** you would buy UA/CPI/CPC through Affle/mediasmart/Jampp; pricing is "contact sales" — minimum spend for an Indore sole proprietor is `NOT VERIFIED`.

### 4.2 GLANCE (Glance / InMobi Group — lock screen, CTV)
- **Glance is an owned-and-operated media property, not a network you publish into.**
  `[OFFICIAL]` Glance advertising page: *"**Owned Glance surfaces** — 175M+ devices. Premium placements across **lock screen, connected TV, and the Glance discovery experience**, running on devices from the world's largest manufacturers"*, plus *"**InMobi global network** — 2B+ devices. Extend your campaigns across the InMobi network of apps, sites and connected experiences."* — [glance.com/advertising](https://glance.com/advertising)
- **Publisher side (a) — monetise YOUR app by hosting Glance ads: `NOT VERIFIED`; no such program found.** There is no Glance publisher/developer SDK, no publisher signup, no payout terms anywhere on glance.com; the site's only commercial paths are *Advertisers* and *Brand partners*. ([glance.com/business](https://glance.com/business), [glance.com/advertising](https://glance.com/advertising))
- **Advertiser side (b): yes — Glance inventory is bought as an advertiser campaign via InMobi's DSP.** `[OFFICIAL]` *"Pricing Model for Glance Campaigns — Glance offers flexible pricing models to advertisers depending on the campaign goals, target audience, verticals, etc. Please contact the Glance team…"*; InMobi DSP has dedicated **Glance support sections for India and Indonesia** — [InMobi support](https://support.inmobi.com/monetize/adding-an-app/pricing-model-for-glance-campaigns/) and [Glance India DSP support](https://support.inmobi.com/dsp/in/glance-support-dsp-india/glance-performance-campaigns-overview).
- **Corporate note:** glance.com now fronts **"Glance AI"**, an AI shopping agent (Glance AI, Inc. © 2026), while InMobi's own support centre still lists Glance as a DSP product line. InMobi Group relationship is real; the branding has moved on.
- **Bottom line for an Indore developer:** Glance = **UA channel, not a monetisation partner**. Items 2–7 are **NOT APPLICABLE** on the publisher side.

### 4.3 InMobi (India-founded — added because Glance is InMobi Group and InMobi *is* a real publisher-side in-app network)
1. **Approval:** self-serve signup at **publisher.inmobi.com/signup**. `[OFFICIAL]` *"The standard time for app approval is 24 working hours"*; inventory can be *"rejected or flagged due to non-compliance…, quality issues, or discrepancies in the provided data"*; sensitive categories take longer. — [App Approval FAQ, updated 21 Jul 2026](https://support.inmobi.com/monetize/cat-faqs/app-approval-process)
2. **app-ads.txt:** **Yes, mandatory-style.** `[OFFICIAL]` You must (i) put your developer website in the store listing contact URL, (ii) download your **personalised app-ads.txt** from `Inventory → app-ads.txt` (includes your InMobi payment ID), (iii) host it at **https://<hostname>/app-ads.txt** (root of the developer domain; subdomain fallback rules apply), (iv) be crawlable over HTTP **and** HTTPS. **Crawler activation requires any one app to have generated 10,000 bid requests.** Direct vs Reseller lines must be used per the tabs. — [Set up an app-ads.txt file](https://support.inmobi.com/monetize/manage-inventory/app-ads-txt/set-up-an-app-ads.txt-file-for-your-app), [Ads.txt FAQ](https://support.inmobi.com/monetize/cat-faqs/ads.txt-sellers-json) (both updated Jul 2026)
3. **Privacy policy:** `[OFFICIAL]` InMobi is a **Joint Controller with the Publisher**; *"InMobi does not gather user consent directly and will rely on the publisher to obtain appropriate consent… Publishers must notify InMobi where consent is withdrawn."* Compliance settings are set in the dashboard (COPPA/CCPA/GDPR/LGPD compliance declaration). — [App Approval FAQ](https://support.inmobi.com/monetize/cat-faqs/app-approval-process)
4. **Minimum payout:** `[OFFICIAL]` *"**$300 for wire and $50 for PayPal, $50 for India publisher.**"* Separately, publishers **set** a threshold: *"The threshold range must be between **$300 – $10,000**."* — [Finance & Payments FAQ](https://support.inmobi.com/monetize/cat-faqs/finance-payments) and [Payment Settings, updated 21 Aug 2026](https://support.inmobi.com/monetize/performance-earnings/payment-settings)
5. **Payment methods in India:** `[OFFICIAL]` **Electronic Fund Transfer or PayPal** (add account after selecting payment country; multiple accounts allowed, one primary). **If the payment country is India, GST details must be entered**; *"Publishers registered in Singapore and India are required to send **GST invoices**. If exempted from GST, they must provide a declaration via email to bd-finance@inmobi.com."* Payout cycle: **60 days after the end of the month** (Jan earnings → paid by end March, received first week of April). Invoices in **PDF**. **Bank charges and currency-conversion charges are not covered by InMobi.** — Finance & Payments FAQ / Payment Settings
6. **Live app:** signup → add app → 24h approval. Whether you may integrate before the app is live: `NOT VERIFIED`.
7. **Formats + integration:** `[OFFICIAL]` **Banner, Interstitial, Rewarded Video, Native** on both iOS and Android; mediation/bidding with **Google SDK Bidding / GAM, AdMobi (AdMob), AppLovin MAX, Unity LevelPlay, DT FairBid, Nimbus, Prebid, Publica, SpringServe, oRTB, WebX**. — [InMobi monetize docs index](https://support.inmobi.com/monetize)

### 4.4 Adgebra (Inuxu Media) — small-publisher-friendly, India, but **web-first**
1. **Approval:** `[OFFICIAL]` **DIY self-serve signup** at [login.adgebra.co/DIY/publisher-signup](https://login.adgebra.co/DIY/publisher-signup/). The form requires name, email, phone **plus financial details: GST, PAN, bank account**. Then a **call-back** from the team, dashboard login by email, then **site approval** (*"based on… site content, traffic quality, and alignment with Adgebra's standards"*) and a dedicated Partner Manager. Separate registration forms for **Indian Entity** vs **Non-Indian Entity**. No duplicate profiles per company/site. — [DIY Partner](https://help.adgebra.co/getting-started/publish-your-docs-7/diy-partner.md), [Registration](https://help.adgebra.co/getting-started/general/registration.md)
   - **CRITICAL NUANCE:** this is **website/blog monetisation**. App developers are mentioned only as *"If you have a mobile app with **web-based content**, you can also use the DIY Partner program to integrate ads into your app's website or landing page."* There is **no native in-app SDK / mediation / bidding product** documented → for a Play/App Store app, Adgebra is **not a native in-app ad network**.
2. **app-ads.txt:** **`NOT VERIFIED` / appears not applicable.** Neither app-ads.txt nor ads.txt appears anywhere in Adgebra's documentation index ([help.adgebra.co/llms.txt](https://help.adgebra.co/llms.txt)).
3. **Privacy policy:** `NOT VERIFIED` — not present in the documentation index.
4. **Minimum payout:** `[OFFICIAL]` *"DIY Partners are required to submit their invoices by the **7th of the subsequent month** when the billing amount i.e diy partner revenue reaches a minimum of **$100**."* Payment processed *"within **60 days** from the date of reception, subject to collections from Inuxu clients/advertisers."* — [Partner Payment T&C](https://help.adgebra.co/getting-started/publish-your-docs-7/partner-payment-t-and-c.md)
5. **Payment methods in India:** `[OFFICIAL]` *"**All payments will be made in INR (Indian Rupees) or USD (United States Dollars) only.**"* *"Inuxu reserves the right to deduct the required **TDS (Tax Deduction at Source), Withholding Tax, or any other applicable tax** as per prevailing Government norms."* Invoices to `finance@inuxu.media` and `pub@inuxu.media`; revenue visible in real-time dashboard reports. (Advertiser-side, i.e. not your money: minimum recharge **₹10,000**, **1% convenience fee**, **18% GST** — [Payments T&C](https://help.adgebra.co/getting-started/publish-your-docs/payments-t-and-c.md).)
6. **Live site/app required:** yes — sites must be added in the dashboard and **approved** before tags can be placed.
7. **Formats + integration:** `[OFFICIAL]` native ads, rich media, **video ads**, plus display, notification, gamification, in-image/in-footer; **100+ custom responsive widgets**, AMP support; **one-time tag integration** (header + footer code). Separate **Traffic+** product = publishers *buying* traffic at CPC/CPM (that is an advertiser-side/self-promotion tool, not monetisation). — [Publisher](https://help.adgebra.co/getting-started/publish-your-docs-7.md), [Site Addition](https://help.adgebra.co/getting-started/publish-your-docs-8/site-addition.md), [Ad Formats](https://adgebra.co/formats/)

### 4.5 IncrementX (Vertoz group) — India-HQ publisher monetisation incl. an App channel
1. **Approval:** `[OFFICIAL]` **contact/demo-based, not self-serve** — CTAs are "Book A Demo" / "Become a Publisher Partner"; claims *"Publisher onboarding < 24 Hours"* and "25+ premium demand partners". — [incrementx.com](https://www.incrementx.com/)
2. **app-ads.txt:** `NOT VERIFIED`.
3. **Privacy policy:** `[OFFICIAL]` MSA §9 *Data Protection*: *"Each party shall include conspicuously on its website(s), a privacy policy that describes how such party collects, uses, stores and discloses users' personal data… Publisher's privacy policy shall disclose that third party advertisers may place cookies…"* Also: *"**IncrementX will not serve to EU, UK & Switzerland regions** and so GDPR laws will not be applicable to IncrementX."* **Caveat:** the page itself says *"NOTE: This is not the actual MSA. The actual terms and conditions may change as per the IO."* — [Master Service Agreement](https://www.incrementx.com/master-service-agreement/)
4. **Minimum payout:** `NOT VERIFIED` (not published).
5. **Payment methods:** `NOT VERIFIED` for publisher payouts. The MSA only describes **advertiser** prepayment (PayPal / credit card / wire) and a publisher-refund clause. Entities: **IncrementX Private Limited (Mumbai, India)** and **IncrementX LLC (New Jersey, USA)** → an Indian publisher can contract with the Indian entity; that MSA's governing law/jurisdiction is **US / New York courts**. — [Terms of Use](https://www.incrementx.com/terms-of-use/)
6. **Live app required:** `NOT VERIFIED`.
7. **Formats + integration:** `[OFFICIAL]` App channel plus products: **Refresh Ads, Rewarded Ads, Interstitial Ads, Video Player, Header Bidding, CPA Offerwall**; also Web and CTV channels. Integration type (SDK vs tag vs mediation) is `NOT VERIFIED`.
   - Related Vertoz brands **VerdeAds, Adzcube/Ripple**: `NOT VERIFIED` individually in this session.

### 4.6 Other India-centric networks assessed (and why they are not in the main list)
- **AdCounty Media** (Jaipur) — BSE-listed as *Adcounty Media India Limited*, scrip **544435**; launched **"PUB-361"**, a publisher reporting/ad-ops platform. `[NON-OFFICIAL]` trade press: [bestmediainfo](https://bestmediainfo.com/mediainfo/advertising/adcounty-media-launches-pub-361-ad-tech-platform-11152752). **Publisher signup, thresholds, app-ads.txt and payment terms: `NOT VERIFIED`** (their site did not respond in this session; BSE filings are corporate, not publisher docs).
- **Silverpush, Fork Media, SVG Media, Komli, mCanvas, Pokkt** — `NOT VERIFIED` as in-app **publisher** monetisation networks. Publicly these operate primarily **advertiser-side / creative / agency** models. Treat as unverified until you see a publisher contract and payout terms.

---

## 5. CROSS-CUTTING NOTES FOR A SMALL INDORE-BASED DEVELOPER

**Who actually pays you, and from where**
| Network | Payer entity | Your paperwork |
|---|---|---|
| Amazon APS | **A9.com LLC** (US) for non-EU inventory (TAM: the SSP buyer pays you directly) | Amazon withholding forms ("forms, documents, or certifications" per agreement) |
| BidMachine | Bidmachine, Inc. (Delaware, US) — **or Google**, if you use AdMob/GAM mediation | Not published |
| Moloco | Moloco (US); Tipalti + Zip Supplier Portal | Tax form chosen in onboarding (Tipalti) |
| InMobi | InMobi (India/Singapore entities) | **GST invoice** or exemption declaration to `bd-finance@inmobi.com` |
| Adgebra (Inuxu) | Inuxu Media (India) | **GST + PAN + bank** at signup; TDS may be deducted |
| IncrementX (Vertoz) | IncrementX Private Limited (Mumbai) or LLC (New Jersey) | Not published |

**Minimum payout ranking (lowest friction → highest)**
1. **InMobi — $50 for India** payouts (PayPal/EFT) / $300 wire
2. **Amazon APS UAM — USD $5** (net 60)
3. **Adgebra — $100** revenue before you may invoice (INR or USD)
4. **BidMachine — $1,000** (net 60; waived routing if you go via AdMob/GAM, since Google pays you)
5. **Moloco — not published**
6. **TAM — per-SSP buyer thresholds**, not Amazon's

**app-ads.txt**
- Required in practice: **APS** (portal generates it), **InMobi** (portal generates it; crawler needs 10k bid requests)
- Provided by the network, you host it: **BidMachine**
- **Explicitly not required: Moloco** ("direct demand only")
- Not documented: **Adgebra** (web-first), IncrementX, AdCounty

**"Can I integrate before my app is live?"**
- **Moloco: yes** (explicit "App is available in-store" checkbox you leave unchecked)
- **BidMachine: integrate yes, get paid no** — ToS requires an active app in Play/App Store
- **APS / InMobi: `NOT VERIFIED`** (APS application requires store URLs; portal docs are login-gated)
- **Adgebra: site must be added and approved first**

**Two facts that change the plan**
1. **Affle and Glance have no verifiable publisher/monetisation side for third-party apps.** Affle is advertiser/UA + programmatic buying; Glance is an owned lock-screen/CTV property you *buy* on. Budget them as **UA channels**, not revenue.
2. **Adgebra is a website network**, not a native in-app SDK network — it only touches apps via web content in a WebView. For Play/App Store in-app revenue, the real India-relevant publisher-side options are **InMobi**, **BidMachine**, **Moloco**, and (if accepted) **Amazon APS**.

---

## 6. SUMMARY TABLE (publisher/monetisation side only)

| | Amazon APS (TAM/UAM) | BidMachine | Moloco | Affle | Glance | InMobi | Adgebra | IncrementX (Vertoz) |
|---|---|---|---|---|---|---|---|---|
| **Approval** | Invitation-only, one-shot review `[OFF]` | Self-serve + email activation `[OFF]` | Self-serve form, rep-assisted `[OFF]` | **No publisher program found** | **No publisher program found** | Self-serve; app approval ~24h `[OFF]` | Self-serve DIY; site approval + callback `[OFF]` | Demo/contact only `[OFF]` |
| **Traffic minimum** | Not published | Not published | Not published | n/a | n/a | Not published | Site-quality review only | Not published |
| **Sole proprietor / individual** | Not verified (Company Size "1" exists) | Yes (≥18) `[OFF]` | Yes (Type=Individual, needs DOB) `[OFF]` | n/a | n/a | Not verified | Needs **GST + PAN** `[OFF]` | Not verified |
| **India available** | Yes (country list) `[OFF]` | Yes | Yes | n/a | n/a | Yes | Yes (India entity form) `[OFF]` | Yes (India entity) `[OFF]` |
| **app-ads.txt** | Yes; portal generates (line not public) | Yes; dashboard generates `[OFF]` | **Not required** `[OFF]` | n/a | n/a | Yes; **10k bid requests to activate crawler** `[OFF]` | Not documented | Not verified |
| **Privacy policy** | **Contractually required** `[OFF]` | Required by app stores + CMP; explicit clause not verified | Joint/consent duties; app policy clause not verified | n/a | n/a | Joint Controller; publisher obtains consent `[OFF]` | Not verified | MSA requires site privacy policy `[OFF]` |
| **Minimum payout** | **UAM $5**; Amazon Demand threshold not stated; TAM = per-SSP | **$1,000** (net 60) `[OFF]` | **Not published** `[OFF]` | n/a | n/a | **$50 India** / $50 PayPal / $300 wire `[OFF]` | **$100** before invoicing `[OFF]` | Not published |
| **India payment** | USD or agreed currency; FX = Bloomberg monthly; Amazon may deduct FX fees & withhold tax `[OFF]` | Bank transfer; banking fees may apply; currency/tax not published | **Wire transfer, USD only**; Tipalti tax forms `[OFF]` | n/a | n/a | **EFT or PayPal**; GST invoice mandatory for India `[OFF]` | **INR or USD only**; TDS/withholding may be deducted `[OFF]` | Not published |
| **Contracting entity** | A9.com LLC (US) / Amazon Europe Core S.à r.l.; Washington law `[OFF]` | Bidmachine, Inc. (Delaware); California law `[OFF]` | Moloco (US) | n/a | n/a | InMobi (India/Singapore) | Inuxu Media (India) | IncrementX Pvt Ltd (Mumbai) `[OFF]` |
| **Live app required** | Store URLs at application | **Yes, to be paid** `[OFF]` | **No** — can register pre-launch `[OFF]` | n/a | n/a | Approval before monetising; pre-launch unclear | Site approved first | Not verified |
| **Formats** | Banner, Interstitial, Rewarded (in-app SDK); no app-open/r-interstitial documented | Banner, Interstitial, Rewarded Video, Native (mediation) | Banner, Interstitial, Rewarded Video | n/a | n/a | Banner, Interstitial, Rewarded, Native `[OFF]` | Native, rich media, video, display, notification, gamification (web) | Rewarded, Interstitial, Refresh, Video, Header Bidding, CPA Offerwall |
| **Integration** | SDK + in-app header bidding; MAX/LevelPlay/AdMob/GAM/DT/Nimbus/TradPlus/TopOn adapters | SDK (Android/iOS/Unity) + MAX/LevelPlay/AdMob-GAM bidding; OpenRTB; waterfall beta | **In-app bidding only**; MAX/LevelPlay/AdMob/GAM adapters; waterfall deprecated `[OFF]` | n/a | n/a | SDK + GAM/AdMob SDK bidding, MAX, LevelPlay, DT FairBid, Nimbus, Prebid, Publica, oRTB `[OFF]` | Web ad tags (JS) | Not verified |
| **Fees** | TAM 2.5% to bidders; UAM 10% on bid prices; Amazon Demand fee deducted pre-auction `[OFF]` | Revenue share, dynamically set; net of fees `[OFF]` | Not published | n/a | n/a | Not published | Not published | "less IncrementX margin" `[OFF]` |

`[OFF]` = official source (cited in the sections above).

---

## 7. EXPLICIT GAPS (things I could NOT verify)
1. Amazon APS **mobile-app payment threshold**, **India payout rails**, **W-8BEN/W-8BEN-E requirement text**, and the **exact generated app-ads.txt line** — the APS mobile docs sit behind `ams.amazon.com` login.
2. Whether **APS accepts Indian sole proprietors / individuals** without a registered company.
3. Whether **APS allows slot creation before an app is live**.
4. **BidMachine** payment currency, rails (PayPal/Payoneer/wire), tax form requirements for India, and whether signup involves a human review beyond email activation.
5. **Moloco** minimum payout, FX fees, GST/TDS handling for India.
6. **Adgebra** app-ads.txt and privacy-policy requirements; whether any native in-app SDK exists at all.
7. **IncrementX / Vertoz** payout threshold, currency, rails, app-ads.txt, and SDK-vs-tag integration.
8. **AdCounty Media** publisher signup and payment terms (site unreachable in this session).
9. Any confirmed **publisher (monetisation) program** at **Affle**, **Glance**, Silverpush, Fork Media, SVG Media, Komli, mCanvas, Pokkt.
10. **Amazon "Ads for apps"** advertiser-side specifics (minimum spend, India billing) for a small developer.
