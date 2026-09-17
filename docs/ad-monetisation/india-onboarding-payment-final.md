# Mobile In-App Ad Monetisation: Onboarding, Payment & Policy Requirements for a Small Indian Developer

**Perspective:** solo/small developer based in **Indore, Madhya Pradesh, India**, publishing on **Google Play** and **Apple App Store**.
**Scope:** 2025–2026 state of play across AdMob, AppLovin (MAX/Exchange), Unity LevelPlay (ironSource + Unity Ads), Meta Audience Network, InMobi, Pangle, Mintegral, DT Exchange, Liftoff Monetize, Chartboost, Amazon Publisher Services, BidMachine, Moloco, and India-focused networks.
**Method:** primary/official sources where possible, cited as markdown links at the point of claim; third-party sources labelled **[NON-OFFICIAL]**; anything unconfirmed marked **NOT VERIFIED**.

> ⚠️ **Not legal, tax, or accounting advice.** Indian GST / income-tax / FEMA points should be confirmed with a qualified CA. Several official pages carried 2026 timestamps (e.g. Google "©2026", InMobi "Last Updated on: 21 Aug, 2026"), consistent with a 2026 snapshot.

> 🔁 **Rebuild note:** an earlier draft of this file was truncated to zero bytes by a tooling error and has been rewritten. Companion evidence files in `docs/ad-monetisation/` hold the full per-topic detail: `ad-network-research-meta-dtexchange-liftoff-chartboost.md`, `ad-policy-ban-research-2026-09.md`, `ad-compliance-consent-privacy-declarations-2026.md`, `india-inapp-ad-networks-2025-2026.md`, `indore-solo-dev-india-tax-framework.md`.

---

## 0. Cross-cutting truths (read these first)

1. **Two separate gates per network:** *account approval* and *per-app approval*. Accounts are often open while every app is individually reviewed, and monetisation can be withheld until that review passes. AdMob's "app readiness review" is the clearest example; Chartboost's 250-DAU gate is the harshest.
2. **You now need a real developer website.** app-ads.txt verification is a hard or effective precondition at AdMob (mandatory for new apps since Jan 2025), InMobi, AppLovin, Unity, Liftoff, DT Exchange and Pangle. The store-listing domain must **exactly** match the domain hosting the file.
3. **A live app is not needed to start integrating at several networks** (AdMob, AppLovin, DT Exchange, Moloco; Liftoff for setup) but *is* needed to earn at most — and is strictly required at Chartboost, Pangle and BidMachine.
4. **AdMob does not pay in INR.** Neither does Unity (USD only), Liftoff, Moloco (USD only) or Chartboost (USD/GBP/EUR only). Indian publishers receive foreign currency and bear FX plus intermediary bank costs.
5. **Revenue is split across multiple payors even with one mediation SDK.** Under AdMob mediation, Google pays for Open Bidding traffic while each network pays for its own non-bidding traffic; Unity Ads bidding inside Google mediation is paid by Google, not Unity.
6. **The most dangerous mistake is clicking your own live ads.** AdMob invalid-traffic suspensions are **non-appealable**, and a permanent disable means you can never open another AdMob/AdSense account.
7. **Interstitial-on-launch is banned**, and the frequency cap is quantified: **no more than one interstitial per two user actions** (Back button included).
8. **Pangle rejects individual / sole-proprietor developers outright** — a registered company is required.
9. **Two of the most-recommended "India networks" have no publisher side at all.** Affle and Glance are advertiser channels, not monetisation partners.
10. **No foreign ad network withholds Indian TDS**, so there is no 26AS credit; the entire tax liability is self-paid via advance tax.

---

## 1. GOOGLE ADMOB

### 1.1 Account approval
Self-serve and open — no invite, no minimum installs, no traffic or prior-revenue requirement documented at account level. The gates are **account verification** and **per-app approval**.

- Requires a Google Account; the country you select at signup **cannot be changed later**. [OFFICIAL — Sign up for AdMob](https://support.google.com/admob/answer/7356219?hl=en)
- **Age 18+:** "developers must be at least 18 years of age to participate in the AdMob program." Under-18s may have a parent/guardian apply with their own Google Account, and **all payments are issued in that person's name**. [OFFICIAL — Age requirements](https://support.google.com/admob/answer/2785008?hl=en)
- **Account verification:** "your account must be verified before it's approved to serve ads. To have your account verified, you must enter your payment details. Payment details include your name, **account type (individual or organization)**, and your payment address." Typically ≤24 hours, rarely up to 2 weeks. [OFFICIAL](https://support.google.com/admob/answer/7356219?hl=en)
  - 👉 **An Indian individual / sole proprietor is explicitly supported** — "individual" is an offered account type; no company registration, GSTIN or CIN is needed to open the account.
- **Country restrictions:** unavailable in OFAC-embargoed territories (Crimea, Cuba, DNR/LNR, Iran, North Korea). **India is not restricted.** [OFFICIAL](https://support.google.com/admob/answer/6163675?hl=en)
- **Per-app gate — "app readiness review":** "When you set up a new app in AdMob, your app must be reviewed and approved before it can fully serve ads." Typically **2–3 days**; limited ad serving meanwhile. To be reviewed, "**Your app must be published**" and "**must be listed in a supported store**." [OFFICIAL — About app readiness](https://support.google.com/admob/answer/10564477?hl=en)
  - Supported stores: Google Play, Apple App Store, Amazon Appstore, OPPO App Market, Samsung Galaxy Store, VIVO App Store, Xiaomi GetApps. **Private Google Play apps cannot be linked.** [OFFICIAL — Set up an app in AdMob](https://support.google.com/admob/answer/9989980?hl=en)
- **No documented minimum traffic/install/revenue threshold.** NOT VERIFIED whether an undocumented quality bar exists.

### 1.2 app-ads.txt — **mandatory for new apps since January 2025**
- AdMob's *developer docs* page still says "not mandatory, but is highly recommended" — **that page is stale.** [OFFICIAL — app-ads.txt (developer docs)](https://developers.google.com/admob/android/app-ads)
- The *policy* page governs: "**Starting January 2025, you will be required to verify new apps that you set up in AdMob with an app-ads.txt file.** … Eventually all AdMob publishers will be required to verify their apps… We're continuing to roll out app verification throughout 2025." [OFFICIAL — Verify your app with app-ads.txt](https://support.google.com/admob/answer/14538460?hl=en)
- Consequence: "**Apps won't be able to fully serve ads until they're verified with an app-ads.txt file and approved after the app readiness review.**"
- **Exemption:** apps listed **only** in a third-party store (not Play/App Store) are not currently required to verify. [OFFICIAL](https://support.google.com/admob/answer/14538460?hl=en)
- **Hosting:** "an app developer posts in the **root domain of their app's developer website**." The store listing must carry that domain: "**Make sure the domain is entered exactly as listed on Google Play.**" Line format:
  ```
  google.com, pub-00000000000000, DIRECT, f08c47fec0942fa0
  ```
  **Firebase Hosting** is Google's sanctioned workaround (including `PROJECT_ID.web.app` as the store-listing developer website). Wait ≥24h, then **Verify app** → **Check for updates**. [OFFICIAL](https://developers.google.com/admob/android/app-ads), [OFFICIAL](https://support.google.com/admob/answer/14538460?hl=en)

### 1.3 Privacy policy
- Play requires a privacy policy on the **store listing and within the app** for apps requesting sensitive permissions/data, and **regardless of permissions for apps targeting children**. [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
- Apple requires a privacy policy link **in App Store Connect metadata and within the app** for **all** apps (§11.2). [OFFICIAL — Guidelines 5.1.1(i)](https://developer.apple.com/app-store/review/guidelines/)

### 1.4 Minimum payout
[OFFICIAL — Payment thresholds](https://support.google.com/admob/answer/2772208?hl=en)

| Threshold | USD | EUR | GBP |
|---|---|---|---|
| Tax information | $0 | N/A | N/A |
| Verification (identity + address) | $10 | $10 equivalent | $10 equivalent |
| Payment **method** selection | $10 | €10 | £10 |
| **Payment** (actual payout) | **$100** | **€70** | **£60** |
| Cancellation | $10 | €10 | £10 |

"You can't select your form of payment until their earnings have reached this amount."

**⚠️ INR is absent from the table.** Supported reporting currencies are USD, AUD, CAD, CLP, CZK, DKK, EGP, EUR, GBP, HKD, HUF, IDR, ILS, JPY, JOD, MXN, MAD, NZD, NOK, PEN, PLN, SGD, ZAR, SEK, CHF, TRY, AED, UYU — **an Indian publisher runs a USD (or EUR) account**. [OFFICIAL](https://support.google.com/admob/answer/2772208?hl=en)

**Timeline:** monthly accrual; payment issued **on or around the 21st**. Example: a $100 balance reached in January is paid at the end of February. Tax info must be in by the 20th to be paid that month. [OFFICIAL — Steps to getting paid](https://support.google.com/admob/checklist/2998383?hl=en)

**Verification sequence:** (1) reach $10 → tax info as applicable; (2) **identity verification — 45 days** to submit documents; (3) **address/PIN verification** — PIN by post, **2–3 weeks**, **4 months** to enter it *(real friction for an Indore address)*; (4) reach $10 → choose payment method; (5) reach $100 → paid. [OFFICIAL](https://support.google.com/admob/checklist/2998383?hl=en)

### 1.5 Payment methods available in India
- **Bank transfer / wire IS available in India**, paid "in **US Dollars or Euros**, depending on your account currency, via international bank transfer". India requires **Account holder name, IFSC (11 chars), SWIFT BIC (8 or 11), Account number (12–17 digits)**, plus optional intermediary bank and FFC/FBO fields. [OFFICIAL — Receive payments by bank transfer](https://support.google.com/admob/answer/3372975?hl=en-GB)
- Options depend on **billing-address country and currency**; finder at `billing.google.com/payments/paymentsinfofinder`. [OFFICIAL](https://support.google.com/admob/answer/7276705?hl=en)
- **INR direct payout: effectively no / NOT VERIFIED.** Expect a USD wire your bank converts, with FX spread and possible intermediary charges that Google does not state it covers.
- **Tax / withholding:**
  - "Depending on your location… Google may be required to collect tax-related information." "Google can't provide advice on tax issues." Failure to file "may be subject to a **higher withholding tax deduction**"; treaties may reduce it. [OFFICIAL — Submit your non-US tax info](https://support.google.com/admob/answer/14135099?hl=en)
  - For **India**, Google's AdMob TRC table names **"Certificate of Residence for the Purposes of Section 159 in Form 43"** for both entities and individuals.
  - ⚠️ **Contradiction:** Google Payments Center names India as **Form 10FB** (old Act) and says "**We do not require a tax residency certificate for India.**" AdMob's table is current; the Payments Center table is stale. Practical posture: complete the online tax interview (auto-selects **W-8BEN** for an individual), keep a **Form 43** ready. [OFFICIAL](https://support.google.com/paymentscenter/answer/13401799?hl=en)
  - **Contracting entity** is one of Google Inc., **Google Ireland**, Google Advertising (Shanghai), or **Google Asia Pacific Pte. Ltd.** — check the **Terms** link in your AdMob account. 👉 **India-address publishers contract with Google Asia Pacific Pte. Ltd. (Singapore).** [OFFICIAL](https://support.google.com/admob/answer/2772511?hl=en), [OFFICIAL](https://support.google.com/admob/answer/4385995?hl=en)
    - ⚠️ **Trap:** that page's GST-invoice text is about **Singapore GST** and Singapore billing addresses (GST no. 200817984R) — **not** Indian GST. Many blogs misread it as requiring an Indian GSTIN. **No Google page was found requiring an Indian GSTIN from an India-address AdMob publisher** [NOT VERIFIED as a requirement].
    - "The status of tax residency information related to tax exemption with **Ireland or Singapore** will not result in account limitations, or impact payouts or withholding tax." [OFFICIAL](https://support.google.com/admob/answer/14135099?hl=en)
  - **W-8BEN vs W-8BEN-E:** an **Indian sole proprietor signs W-8BEN**; a registered company signs W-8BEN-E (§12.4).

### 1.6 Is a live published app required?
**"No" to start, "yes" to earn.**
- You **can** add an **"unpublished" app**, create ad units and integrate before release — "useful to set up and **test your app before you release your app on an app store**" — but such apps get **limited ad serving**. [OFFICIAL](https://support.google.com/admob/answer/9989980?hl=en)
- Full serving needs a **published app in a supported store** plus readiness review. [OFFICIAL](https://support.google.com/admob/answer/10564477?hl=en)
- **Google-provided demo ad units** let you test with no account risk: "not associated with your AdMob account, so there's no risk of your account generating invalid traffic." "**You should only use demo ads for application testing before publishing to app stores.**" Also: test devices, test apps, ad inspector. Test apps are "demonetized." [OFFICIAL — How to test your ads](https://support.google.com/admob/answer/9388275?hl=en)
- ⚠️ "publishers may not click on their own production ads, even for testing purposes. Clicking on production ads can result in a policy violation for **invalid traffic**." [OFFICIAL](https://support.google.com/admob/answer/9388275?hl=en)

### 1.7 Ad formats and integration
Formats: **banner, interstitial, native, rewarded, rewarded interstitial, app open**. [OFFICIAL](https://developers.google.com/admob/android/app-ads)
- Mediation supports **in-app bidding** *and* **waterfall** ("For bidding: Google Mobile Ads SDK (Legacy) 18.3.0 or higher"), with sources including AppLovin, BidMachine, BIGO, Chartboost, DT Exchange, InMobi, ironSource, Liftoff Monetize, Meta Audience Network, Mintegral, Moloco, Pangle, PubMatic OpenWrap, Tapjoy, Unity Ads, Vpon, Yahoo, Zucks. [OFFICIAL — Set up AdMob Mediation](https://developers.google.com/admob/android/mediation)
- ⚠️ Each mediated network is a **separate publisher relationship** with its own account, threshold and app-ads.txt line.
- "Failure to do so [adding mediation partners to the GDPR/US-states ad partners list] can lead to **partners failing to serve ads on your app**." [OFFICIAL](https://developers.google.com/admob/android/mediation)

---

## 2. INMOBI (India-HQ, Bengaluru)

### 2.1 Account approval
- Self-serve signup, but **every app is reviewed**: "The standard time for app approval is **24 working hours**." Sensitive categories take longer. Explicit **"Under Review"** state. [OFFICIAL — App Approval Process FAQ, updated 21 Jul 2026](https://support.inmobi.com/monetize/cat-faqs/app-approval-process)
- Inventory can be "rejected or flagged due to non-compliance with platform guidelines, quality issues, or discrepancies in the provided data."
- **Business/payment info is required to generate app-ads.txt entries.** [OFFICIAL — Set up An App-ads.txt File, updated 20 Jul 2026](https://support.inmobi.com/monetize/manage-inventory/app-ads-txt/set-up-an-app-ads.txt-file-for-your-app)
- **Minimum traffic/entity threshold: NOT VERIFIED.** Indian sole proprietor: InMobi requires **GST details** for India payment country — a real obstacle without a GSTIN; whether a non-GST individual is accepted is **NOT VERIFIED**.

### 2.2 app-ads.txt — mandatory in practice, with a traffic gate
- "**Inmobi's line:** This a **mandatory line** to be included in your app-ads.txt file to authorize Inmobi to sell your inventory."
- Requires a **developer website linked from the store listing contact URL**.
- **Hosting:** root of the developer website hostname; checks `https://<hostname>/app-ads.txt` then `http://`. Subdomain checked before root domain. "Ensure the app-ads.txt is accessible via **both HTTP and HTTPS**." Up to **five redirections within a subdomain and one outside the root domain**.
- ⚠️ **Traffic gate:** "**Activation of the InMobi crawler occurs once any of the added apps has generated 10 thousand bid requests.**"
- Direct vs Reseller tabs must be respected line-for-line. [OFFICIAL](https://support.inmobi.com/monetize/manage-inventory/app-ads-txt/set-up-an-app-ads.txt-file-for-your-app)
- app-ads.txt "enable[s] buyers to spend only programmatic dollars through channels explicitly trusted and authorized by the originating publisher." [OFFICIAL — Introduction, updated 20 Jul 2026](https://support.inmobi.com/monetize/manage-inventory/app-ads-txt/app-ads-txt)

### 2.3 Privacy policy
- InMobi is a **Joint Controller with the Publisher** and **does not collect consent itself**: "InMobi does not gather user consent directly and will rely on the publisher to obtain appropriate consent from data subjects and pass that on to InMobi." Non-consented EEA requests get **non-targeted ads**. Publishers must notify consent withdrawal. [OFFICIAL](https://support.inmobi.com/monetize/cat-faqs/app-approval-process)
- Compliance declarations are set in the dashboard; InMobi publishes COPPA/GDPR/LGPD/CCPA/ATT pages. [OFFICIAL](https://support.inmobi.com/monetize/privacy/coppa)

### 2.4 Minimum payout
- Settings screen: "**The threshold range must be between $300 - $10,000.**" [OFFICIAL — Payment Settings, updated 21 Aug 2026](https://support.inmobi.com/monetize/performance-earnings/payment-settings)
- Method-specific: "**$300 for wire and $50 for PayPal, $50 for India publisher.**" [OFFICIAL — Finance & Payments FAQ](https://support.inmobi.com/monetize/cat-faqs/finance-payments)
- **Cycle: 60 days** after month end (January earnings → processed end of March, received first week of April).

### 2.5 Payment methods available in India
- **EFT (bank) or PayPal**; one primary account. [OFFICIAL](https://support.inmobi.com/monetize/performance-earnings/payment-settings)
- **GST required for India:** "**If the Payment Country is India, GST details need to be entered.**"
- **GST invoice mandatory:** "Publishers registered in **Singapore and India are required to send GST invoices**. If exempted from GST, they must provide a **declaration via email** to bd-finance@inmobi.com." 👉 **The one network with a verified India GST demand.** [OFFICIAL](https://support.inmobi.com/monetize/cat-faqs/finance-payments)
- Bank/currency-conversion charges **not covered**; deductions also arise from "**invalid traffic, fraud detection, or policy violations**." Invoice must be **PDF** with invoice number, date, campaign ID.
- **Payout currency per method: NOT VERIFIED.**

### 2.6 Live app required?
**Yes in practice** — app review plus app-ads.txt crawling keyed to the store-listing developer URL. Pre-launch SDK integration: **NOT VERIFIED**.

### 2.7 Ad formats and integration
**Banner, Interstitial, Rewarded Video, Native** (Android/iOS). Mediation: AppLovin MAX, Amazon APS, Google AdMob/Ad Manager/Open Bidding, DT FairBid, Unity LevelPlay, CloudX, Nimbus, Prebid, Publica, SpringServe, oRTB, WebX. Also **InMobi Choice CMP** and **UnifID**. [OFFICIAL — InMobi SDK docs](https://support.inmobi.com/monetize/sdk-documentation/download-sdk), [OFFICIAL — mediation index](https://support.inmobi.com/monetize/integrating-inmobi-with-mediation/overview)

---

<!-- PART2 -->
