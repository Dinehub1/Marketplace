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

## 3. APPLOVIN (MAX mediation + AppLovin Exchange / Ads Manager)

### 3.1 Account approval
- **Approval-gated at account level:** "**AppLovin may need to approve your account before you can complete the account setup.**" [OFFICIAL — MAX Getting started](https://support.applovin.com/en/max/getting-started)
- **Individuals are explicitly permitted (18+):** "If you have entered into this Agreement on an **individual basis**, you represent that you are the age of legal majority or older in your jurisdiction (**aged 18 and over**)…" The payment form offers **"Type: Individual, Company"**, and registration "may be subject to validation from the **AppLovin payments team**." [OFFICIAL — AppLovin Terms](https://legal.applovin.com/en/terms/), [OFFICIAL — Account | Payments](https://support.applovin.com/en/max/max-dashboard/account/payments)
- **Contracting entity:** **AppLovin Corporation (Delaware, USA)** for "Publishers worldwide, excluding Singapore"; AppLovin (Singapore) Pte. Ltd. only for Singapore publishers. **Individual users worldwide → AppLovin Corporation.** Governing law California; publisher arbitration via **JAMS, Santa Clara County, CA**. [OFFICIAL — Terms](https://legal.applovin.com/en/terms/)
- ⚠️ **Families / child-directed apps:** "**AppLovin is not part of the Families Self Certified Ads SDK Program**" — if your app targets children you cannot use AppLovin. [OFFICIAL](https://support.applovin.com/en/max/getting-started)
- **No published minimum traffic / install / app count / prior revenue.** NOT VERIFIED. Every mediated network is separately gated: "the network must **approve you to serve ads**."

### 3.2 app-ads.txt — effectively demand-gating
- "**Many advertisers do not bid on apps that do not have a valid `app-ads.txt` file.**" AppLovin "**strongly recommends**" maintaining one including its line. [OFFICIAL — IAB supply chain validation](https://support.applovin.com/en/max/max-dashboard/account/iab-supply-chain-validation)
- **Developer website required** in the store listing and in MAX: add the **root domain only** at Account > General > Basic Info — "the same one that you use in your app store listing and is where you host your `app-ads.txt` file." [OFFICIAL](https://support.applovin.com/en/max/getting-started)
- Where to add the URL: **Google Play** → Store presence > Store listing > **Developer contact**; **Apple** → "place your `app-ads.txt` file at the same domain that you use for **App Privacy**." [OFFICIAL](https://support.applovin.com/en/max/max-dashboard/account/iab-supply-chain-validation)
- **Technical:** root directory; **`utf-8`**; server must return **`Content-type: text/plain`**.
- **One domain per MAX account** (IAB `sellers.json` allows one domain per Seller ID); multi-studio setups need one shared domain or a **one-hop** HTTP redirect — "**Only a single HTTP redirect** to a destination outside the original root domain is allowed… If the third party location returns a redirect, then the advertising system should treat the response as an error."
- Lines generated at **Account > General > App-ads.txt Info**. Anti-fraud warning: beware unknown companies asking to be added to your app-ads.txt. [OFFICIAL](https://support.applovin.com/en/max/max-dashboard/account/iab-supply-chain-validation)

### 3.3 Privacy policy — explicitly required, with prescribed content
- "You **must have and abide by a privacy policy for each Property** that complies with all applicable laws… must be **easily accessible from your properties, including your website**, specifically disclose that **third parties, including AppLovin, may be collecting, processing, and sharing Personal Data for advertising purposes**…" Suggested disclosure wording supplied verbatim. [OFFICIAL — Policies for Publishers](https://legal.applovin.com/en/policies-publishers/)
- MAX provides a **Terms & Privacy Policy Flow**; for iOS enable the **ATT** prompt. [OFFICIAL](https://support.applovin.com/en/max/getting-started)

### 3.4 Minimum payout
- The **payment FAQ** states a flat "**Regardless of the payment method you choose, AppLovin has a $100 minimum threshold**", and separately that "If you choose to receive payment in the form of a **wire transfer in non-USD currency, minimum payment thresholds may apply**." [OFFICIAL — Monetization payment FAQ](https://support.applovin.com/en/max/faq/faq-applovin-monetization-payment)
- The **payments dashboard page** states: "**Note that the minimum threshold for wire transfer is $150.**" [OFFICIAL — Account | Payments](https://support.applovin.com/en/max/max-dashboard/account/payments)
- ⚠️ **Official-source inconsistency — plan for $150 if you take a wire.** Do not rely on $100 for a wire payout. The non-USD-currency wire figure is **[NOT VERIFIED]**.
- **Schedule: monthly, NET 15** (on or around the 15th). Below-threshold earnings roll over. You can voluntarily **hold payments**. AppLovin pays **only** Ads Manager + AppLovin Exchange revenue; other mediated networks pay you directly.

### 3.5 Payment methods available in India
- **Methods: Direct deposit/ACH, Wire transfer, Check, PayPal.** "**Not all options may be available to you due to local regulations. Certain fees and minimum thresholds may apply.**" The real menu appears only at **Account > Payments > Info, Step 2**. [OFFICIAL](https://support.applovin.com/en/max/max-dashboard/account/payments) — which appear for an **India** payment country is **[NOT VERIFIED]**.
- **Processor: Tipalti.** [OFFICIAL](https://support.applovin.com/en/max/faq/faq-applovin-monetization-payment)
- **Currency:** defaults to the local currency of the payment country; others selectable. "**FX fees may apply if you select to receive payments in a non-USD currency.**" For USD, "AppLovin does not deduct any bank fees", but "the **intermediary and/or beneficiary bank may charge you certain fees**." **INR direct payout: NOT VERIFIED.**
- **Tax forms — mandatory, no exceptions:** "The U.S. **IRS requires AppLovin to get tax forms.** … **AppLovin cannot remit payments without a completed tax form. AppLovin cannot make any exceptions.**" Non-US publishers complete **W-8**; the wizard selects **W-8BEN (individual)** or **W-8BEN-E (entity)**; US publishers use W-9. Requires a **Foreign Tax Number** ("You do not need to have a U.S. Tax Number") and a Part 2 treaty claim with an option to "certify **0% withholding** if appropriate." A **Certificate of No U.S. Activities** can expire and block payment. Tax name must match the bank beneficiary name. 👉 **An Indian sole proprietor signs W-8BEN.**
- **GST/TDS:** AppLovin "**is unable to provide tax advice**"; no Indian GST/TDS obligation stated. **Payoneer is not listed** → **[NOT VERIFIED]** for India.

### 3.6 Live published app required?
**No — you can create ad units and integrate before launch.** "**If your app is not yet live, you can manually add it to MAX**… click **Manually Add Your Package Name**." The store ID is optional. Testing tooling: **Demo App, Mediation Debugger, Test Mode, Creative Debugger**. "AppLovin does not track impressions, clicks, or revenue for test ads." [OFFICIAL](https://support.applovin.com/en/max/getting-started)
- ⚠️ "**use a single ad unit ID for each format in an app**." ⚠️ Migration hazard: reusing another mediator's app ID when moving to MAX "**will cause crashes and discrepancies**."

### 3.7 Ad formats and integration
- Formats: **Banner & MREC, Interstitial, Native, Rewarded, App Open**; dashboard ad types include static interstitial, video interstitial, rewarded video and **playable interstitial**. [OFFICIAL — Android ad formats](https://support.applovin.com/en/max/android/ad-formats/app-open-ads), [OFFICIAL — Ad formats FAQ](https://support.applovin.com/en/max/faq/what-are-the-ad-formats-in-the-applovin-dashboard)
- **Mediation with in-app bidding + traditional waterfall**; custom SDK networks are **not** bidding/auto-CPM eligible. Best practice: "Add at least **six networks** with strong global demand… in addition to AppLovin." [OFFICIAL](https://support.applovin.com/en/max/getting-started)
- ⚠️ Viewability: "If you **hide the banner behind content**, networks will **invalidate impressions**." Implement exponential retry and immediate reload after dismissal. [OFFICIAL](https://support.applovin.com/en/max/getting-started)

---

## 4. UNITY LEVELPLAY (ironSource + Unity Ads)

### 4.1 Account approval
- Signup is self-serve, **but the account must be approved before live ads serve**: add app → integrate SDK → activate ad units → "you'll receive **two emails requesting additional information about your published apps**" → reply → review → **approved or denied**. "When your account is approved, live ads will start to serve immediately." [OFFICIAL — Create an account (LevelPlay)](https://docs.unity.com/en-us/grow/levelplay/platform/get-started/create-account), [OFFICIAL — ironSource Ads version](https://docs.unity.com/en-us/grow/is-ads/monetization/getting-started/create-an-account-ironsource-ads)
- Requires a Unity Organization; "**You must be the Organization Owner** to check, create, or update the payout profile." [OFFICIAL — Complete your payout profile](https://docs.unity.com/en-us/monetization/payments/complete-payout-profile)
- **Individuals appear supported**: the payout profile asks for "your **personal or company** information"; W-8BEN is documented "for Non-US **Individuals**" vs W-8BEN-E "for Non-US **Entities**". [OFFICIAL — Tax information](https://docs.unity.com/en-us/monetization/payments/tax/tax-information)
- **Traffic/install/revenue minimum: NOT VERIFIED.** **India support: NOT VERIFIED.**

### 4.2 app-ads.txt — required in practice; Unity generates the lines
- Prescriptive setup page: create and upload the file "and **register it with Unity for verification**." [OFFICIAL — Set up the app-ads.txt file](https://docs.unity.com/en-us/monetization/dashboard/app-ads-txt/set-up-app-ads-txt)
- Host at the **exact root domain** from the store listing.
- **Unity generates your lines**: Monetization → Settings → Organization → **App-ads.txt**; the App-Ads URL field "automatically displays a list of authorized digital sellers in the correct file format." Register the **root URL only (no paths)** in Organization info → **Developer Website**.
- ⚠️ **`OwnerDomain` is now mandatory** — e.g. `ownerdomain=yourdomain.com`.
- "The list of verified ad sellers can change over time. **Check the settings page monthly.**"

### 4.3 Privacy policy
- Publishers "must implement a **privacy consent flow** before serving personalized ads or collecting user data." [OFFICIAL — Monetization process overview](https://docs.unity.com/en-us/monetization/getting-started/process-overview)
- LevelPlay legal resources cover the Apple Privacy Questionnaire, Google Data Safety Questionnaire, Children/Child-Directed Apps, ironSource GDPR compliance and US State Privacy Laws. [OFFICIAL](https://docs.unity.com/en-us/grow/levelplay/platform/legal-resources)

### 4.4 Minimum payout
- **$100 minimum, net 60.** "if you earn $50 in March, then $50 in April, the accumulated balance meets the minimum payment amount in April and is **paid by the end of June**." [OFFICIAL — When will my payment be processed? (updated 25 Jul 2025)](https://support.unity.com/hc/en-us/articles/6192555249940-When-will-my-payment-be-processed)

### 4.5 Payment methods available in India
- ⚠️ **USD only:** "Unity Ads supports payouts in **US Dollars (USD) only**." **No INR option.** [OFFICIAL — Earnings payouts](https://docs.unity.com/en-us/grow/dashboard/finance/payment/earnings-payouts), [OFFICIAL — How do I receive payment for my Ads revenue?](https://support.unity.com/hc/en-us/articles/211217543-How-do-I-receive-payment-for-my-Ads-revenue)
- Provider is **Tipalti**, effective **22 January 2024**; flow = Address → Payment Method → Tax Forms, with **Tipalti SMS 2FA** separate from Dashboard 2FA. [OFFICIAL](https://docs.unity.com/en-us/monetization/payments/complete-payout-profile)
- Tax forms: **W-8BEN (non-US individuals), W-8BEN-E (non-US entities), W-9 (US), plus W-8ECI, W-8IMY, W-8EXP, 8233**; a "Certificate of No U.S. Activities" is referenced. 👉 **Indian sole proprietor → W-8BEN.** [OFFICIAL — Introduction to tax forms](https://docs.unity.com/en-us/monetization/payments/tax/intro-to-tax-forms)
- **Contracting entity:** Unity's One Operate Services Terms are with **Unity Technologies SF (California, USA)**, noting "Certain Services may be provided by different Affiliates." ⚠️ The **monetisation-specific** entity is **NOT VERIFIED**. [OFFICIAL](https://unity.com/legal/one-operate-services-terms-of-service)
- **India-specific rails / GST / TDS: NOT VERIFIED.**

### 4.6 Live published app required? — effectively yes for approval
- You **can** create the account, add an app and integrate the SDK first, and **test mode is uninterrupted** during review. But approval requires information about **published apps**, and live ads start only on approval. Payout-profile prerequisites: "**Add your app to the dashboard. Add your project to the dashboard.**" [OFFICIAL](https://docs.unity.com/en-us/monetization/payments/complete-payout-profile)
- Whether a store URL is mandatory at signup: **NOT VERIFIED**.

### 4.7 Ad formats and integration — **critical payment-routing nuance**
- The Unity Ads SDK minimum integration requires **at least one of interstitial, rewarded, banner**. LevelPlay ad units are managed for **Rewarded, Interstitial, Banner**. **Native, App Open, rewarded interstitial and playable: NOT VERIFIED** for the Unity Ads SDK. [OFFICIAL — Publisher process overview](https://docs.unity.com/en-us/ads-android/4.20.0/getting-started/publisher-process-overview), [OFFICIAL — Manage ad units](https://docs.unity.com/en-us/grow/levelplay/platform/get-started/ad-units)
- Management: mediation with **in-app bidding + hybrid waterfall**, floor prices, manual rates for non-bidding instances; Unity Ads also bids inside AppLovin MAX and Google AdMob/Ad Manager. [OFFICIAL — Mediation management](https://docs.unity.com/en-us/grow/levelplay/platform/fundamentals/mediation-management)
- ⚠️ **Who pays you depends on the path:** "When using Unity Ads as a bidder in **Google AdMob or Google Ad Manager mediation, all earnings from SDK bidding are paid out by Google, not Unity**. Only earnings from Unity Ads **waterfall** placements are paid by Unity." [OFFICIAL — Receiving payment](https://docs.unity.com/grow/en-us/dashboard/finance/payment/receiving)
- Appeals: [How do I appeal if my organization is blocked…](https://support.unity.com/hc/en-us/articles/14315075759636-How-do-I-appeal-if-my-organization-is-blocked-for-a-violation-of-Unity-s-Terms-of-Service)

---

## 5. META AUDIENCE NETWORK

> ⚠️ **Research limitation:** Meta's **publisher help centre is fully login-gated** (`facebook.com/help/publisher/*`, `facebook.com/business/help/*`) and `facebook.com/legal/audience_network_terms` returns no readable body. Commercial terms (payout threshold, India rails, FX, entity) could **not** be verified from primary sources. Meta's **developer** docs are readable (append `.md` to a `developers.facebook.com/documentation/audience-network/...` URL).

### 5.1 Account approval — gated, with ownership verification
- Onboarding runs through **Business Manager** and a **"Property"**: "**The bundle has to be reviewed and approved before the property can perform the monetization.**" [OFFICIAL — Monetization Manager checklist](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)
- "**Developers must complete the app ownership verification process in order to monetize the relevant apps.**" [OFFICIAL — AN policy](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **Discretionary admission:** "We reserve the right to **reject, approve or remove any Publisher or app for any reason, at our sole discretion**."
- **App-ads.txt accuracy is a pre-onboarding condition:** "Prior to onboarding, Publishers that maintain an ads.txt or app-ads.txt file **must include Audience Network listed accurately**."
- **Store requirement:** "Audience Network is only available to apps offered in **Apple iTunes or Google Play**, unless you have our prior written approval."
- **Content bans:** adult content; primarily-UGC apps (written permission needed); real-money gambling (written permission needed); Meta-imitation apps.
- **Only published quantitative number is a quality trigger, not an admission bar:** "If your property receives **70k impressions over a 14-day period, your app automatically enters a 90-day review period** on the quality of ad clicks." [OFFICIAL — AN Do's and Don'ts](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy/dos-and-donts)
- **India support, sole-proprietor eligibility, minimum traffic: NOT VERIFIED.**
- ⚠️ **Explicit non-finding:** no official Meta statement was found that Audience Network has **paused or restricted new publisher onboarding** in 2025–2026. Public docs read as **open-but-reviewed**; treat pause claims as unverified.
- Practical constraint: AN ads only serve to users with a **Facebook profile logged in within 30 days**. [OFFICIAL](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)

### 5.2 app-ads.txt
- **De facto required** (pre-onboarding condition + buyer demand).
- Fields: ad system domain `facebook.com` (mandatory); Publisher Account ID = "your property ID, Business ID, or app ID"; `DIRECT` or `RESELLER`; certification authority ID **`c3e20eee3f780d68`**. Example: `facebook.com, 1000001, RESELLER, c3e20eee3f780d68`. [OFFICIAL — Authorized sellers](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/authorized-sellers-app-ads)
- **Hosting:** root of the developer website domain listed in the stores; **drop `www.`**; only **one** subdomain allowed; `robots.txt` must allow `facebookexternalhit/1.1`. Verification up to 24h; up to **7 days** if the store URL was missing. Apple: **App Support URL ≠ Developer Website URL**.

### 5.3 Privacy policy
- **Required:** "**Privacy Notice: Apps must include a privacy policy that adequately discloses your privacy practices.**" Exact linking location: **NOT VERIFIED**. [OFFICIAL — AN policy](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **COPPA:** primarily child-directed apps **may not use the Facebook SDK for Android**; mixed-audience apps without an age gate serve AN ads to **non-US users only**. [OFFICIAL — COPPA](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/coppa)

### 5.4 Minimum payout
- **NOT VERIFIED** (login-gated).
- **[NON-OFFICIAL, stale]** A Meta-authorised reseller guide dated **2020-06-19** states payment around the 21st of the following month and "all apps' combined monthly revenue must reach at least **US$100**", with rollover. Six years old and not authoritative — treat as a hypothesis. [NON-OFFICIAL](https://www.kchuhai.com/report/view-6289.html)

### 5.5 Payment methods available in India
- **Officially documented:** only that the Property "has to be linked with your payment account **which should contain proper tax form**." [OFFICIAL](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)
- **[NON-OFFICIAL, 2020]:** bank account or PayPal; "Your account **must be able to accept USD**"; no other currencies; W-9 (US), W-8BEN-E (non-US companies), **W-8BEN (non-US individuals)**.
- **INR payout, FX/fees, GST/TDS, contracting entity, governing law: NOT VERIFIED.**

### 5.6 Live published app required?
**Effectively yes.** "This assumes that **you already have a published app** that you want to add Audience Network to as a mediation partner." Flow: Placement IDs → test → "**Publish an update to your app with Audience Network in production.**" [OFFICIAL — How to use this site](https://developers.facebook.com/documentation/audience-network/how-to-use-this-site)

### 5.7 Ad formats and integration — **bidding only**
- Formats: **Banner/MREC, Interstitial, Native, Native Banner, Rewarded Video, Rewarded Interstitial.** App Open **not documented**; Playable is not a publisher format.
- ⚠️ **Waterfall is gone:** "**Audience Network is now only using bidding to fill ads in iOS and Android apps.** You'll need to move your apps from waterfall to bidding to monetize with Audience Network." [OFFICIAL — Bidding overview](https://developers.facebook.com/documentation/audience-network/bidding/overview)
- Partner mediation support: Google Ad Manager, AdMob, Admost, Appodeal, Chartboost, CloudX, DT Exchange (Fyber), Unity LevelPlay, MAX, TopOn, TradPlus, Nimbus. In-house mediation is **closed beta**.
- Policy detail in §9.8.

---

## 6. OTHER GLOBAL NETWORKS

### 6.1 DT Exchange (Digital Turbine, formerly Fyber)
- **Approval-gated.** "**Once the DT Team approves and activates your account**, you can sign in to the DT Console." Self-serve signup at `console.fyber.com/sign-up` but you must "**Use an official company email address**." [OFFICIAL — Signing up for DT Console](https://docs.digitalturbine.com/dt-console/authorization/signing-up-for-dt-console)
- **Traffic / KYC / GST / entity minimum: NOT FOUND.** India support and sole-proprietor eligibility: **NOT VERIFIED**.
- **app-ads.txt — required, and the domain is `fyber.com`, NOT `digitalturbine.com`.** Line: `fyber.com,YOUR_DT_PUBLISHER_ID,DIRECT,1ad675c9de6b5176` (cert ID `1ad675c9de6b5176`). You must **also add DT's official resellers** — list at [digitalturbine.com/dt-app-ads.txt](https://www.digitalturbine.com/dt-app-ads.txt). Publisher ID: Console → User Profile → "Basic Reporting API – Credentials". **Hosting: root of your domain or at most one subdomain below root; "do not place it in either the `www.` or `m.` subdomains."** Developer website URL required in all stores (Apple = **Marketing URL**; Play = Store settings → "Visit website"). Anti-fraud: "**Beware of unknown companies reaching out directly and requesting to be added to your app-ads.txt file. This may be fraud.**" [OFFICIAL — app-ads.txt](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/advanced-configurations/app-ads.txt)
- **Privacy:** DT publishes compliance docs for GDPR, COPPA, LGPD, GPP, TCF 2.3, Apple App Privacy Details and the Google Data Safety Form. An explicit "publisher must host a privacy policy at X" clause: **NOT VERIFIED**. [OFFICIAL](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/privacy)
- **⚠️ Minimum payout: NOT PUBLISHED AT ALL.** DT's own docs assistant, asked directly, answered that it "cannot find information about the minimum payout threshold, available payment methods, supported payout currencies, payout schedule, supported countries, whether India is supported, or whether a W-8BEN/tax form is required" and directed the publisher to their Account Manager. [OFFICIAL — Managing payouts](https://docs.digitalturbine.com/dt-console/finance/managing-payouts-in-the-dt-console) 👉 **A material problem for a solo developer.**
- **India payments: NOT VERIFIED entirely.** No DT page lists rails, currencies, country eligibility, FX, W-8BEN, GST/TDS or the contracting entity.
- ✅ **Live app: NO — the best pre-launch option among the majors.** "**The DT Console allows you to add your app whether or not it is published in an app store.**" Tick "My app is not available in app stores" and enter details manually. Test devices supported. [OFFICIAL](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/setting-up-your-app-in-the-dt-console)
- **Formats:** Banner, MREC (300x250), Interstitial Display (close after 5s), Interstitial Video (15–30s; skippable after 5s if ≥16s), **Rewarded Video** (max 30s, no skip), **Rewarded Playable** (max 30s), Native. App Open **not documented**. [OFFICIAL — Ad types and specification](https://docs.digitalturbine.com/dt-exchange/additional-resources/ad-types-and-specification)
- **Integration:** direct SDK (Android/iOS), mediation (DT FairBid + AdMob/GAM/MAX/LevelPlay), SDK bidding / in-app bidding, plus Dynamic Floor Pricing (developer preview).

> ⚠️ **FALSE-LEAD WARNING:** `help.dtxplatform.com` / "DTXplatform" (advertising a $50 payout and PayPal/Wire/eCheck/Paxum/Webmoney rails) is **NOT Digital Turbine's DT Exchange**. Different GitBook organisation. **Do not cite its figures for DT Exchange.**

### 6.2 Liftoff Monetize (formerly Vungle)
- **Open self-serve signup** plus mandatory **email activation**: an un-activated account returns `{"messages":["Account not activated."],"code":403001}`. [OFFICIAL](https://support.vungle.com/hc/en-us/articles/360041251552)
- **No published traffic / install / prior-revenue / KYC / GST bar.**
- **Individuals are contemplated:** the agreement is drafted for "you and any company, entity, or organization on behalf of which you are accepting this Agreement ('Developer')", and payment guidance says "**Most non-US individuals fill out the W8-BEN**" → an **Indian sole proprietor is permissible**. [OFFICIAL — Terms](https://publisher.vungle.com/LICENSE.html)
- ⚠️ **Feature gating:** "**Flat CPM is only available for select publisher accounts; contact your account manager to activate**" and "In-App Bidding is only available for select publisher accounts." [OFFICIAL](https://support.vungle.com/hc/en-us/articles/360041251552)
- **app-ads.txt — required, root domain only (`www.` REJECTED).** Liftoff introduced "an additional validation step for all new publisher apps — **app-ads.txt verification**… before launching new apps" (updated **2025-12-22**): "**Root domain is required. www subdomains are NOT accepted.**" / "Liftoff **ONLY accepts app-ads.txt hosted on the ROOT DOMAIN. Any subdomain — including www — will fail validation.**" **Rejected:** `www.example.com/app-ads.txt`, `ads.example.com/app-ads.txt`, `m.example.com/app-ads.txt`. **Accepted:** `example.com/app-ads.txt`. Line: `vungle.com, <YOUR_VUNGLE_PUBLISHER_ACCOUNT_ID>, DIRECT, c107d686becd2d77` (cert ID `c107d686becd2d77`). Official line list at `publisher.vungle.com/vungleAdsTxt`; **monthly email updates**. Recommended `OWNERDOMAIN=yourstudio.com`. The developer website must match in **both** the store listings and the Liftoff dashboard. "**many brand buyers and advertisers require publishers to have a valid app-ads.txt file and will not buy inventory on apps without one**". [OFFICIAL — app-ads.txt](https://support.vungle.com/hc/en-us/articles/360055891252-app-ads-txt)
- **Privacy policy — required with prescribed content.** The agreement obliges the Developer "to **conspicuously post a privacy notice**" describing the Developer's and third parties' collection/use/processing/disclosure, disclosing "(i) that **third parties, including Liftoff, may collect or receive information and use that information to provide measurement services and targeted ads**, and (ii) **how and where users can opt-out**." COPPA status must be declared in the dashboard; **CCPA** is opted-in by default unless `setCCPAStatus(false)`. [OFFICIAL — Publisher agreement](https://publisher.vungle.com/LICENSE.html)
- **Minimum payout — official table** (article updated **2025-05-22**): [OFFICIAL](https://support.vungle.com/hc/en-us/articles/203813080-Getting-Paid-Everything-You-Need-to-Know)

| Method | Min. to initiate | Fixed fee | % fee | Max fee/txn |
|---|---|---|---|---|
| PayPal (US) | **$50** | $1.00 | 2% | $2.00 |
| **PayPal (International)** | **$50** | $1.00 | 2% | **$21.00** |
| ACH (US residents only) | $50 | $0.75 | 0% | none |
| **Wire Transfer (International)** | **$1,000** | **$18.00** | **2.5% FX conversion** | none |
| Wire Transfer (US) | $1,000 | $15.00 | 0% | none |
| eCheck | $1,000 | $5.00 | 2.5% FX conversion | none |
| Check (US only, USD only) | $50 | none | 0% | none |

- ⚠️ **Official-source conflict:** the publisher **contract** says "Liftoff may **withhold payment until the following month for Developer Fee amounts less than $1,000.00**", contradicting the $50 PayPal/eCheck floor. **Resolve with your account manager before planning cash flow.**
- **Schedule: default Net 60**, monthly at month end. Options: **Net 60** or **Hold Payment**.
- **Processor: Tipalti** — "PayPal, ACH, Wire Transfer, and eCheck", availability **country-dependent** ("We offer different payment methods, depending on your country") with **no per-country matrix** → exact India list **NOT VERIFIED**. Likely routes: **PayPal (min $50)** or **international Wire (min $1,000)**; ACH and Check are US-only. **INR payout: NOT VERIFIED.**
- **Tax forms**: W-9 (US); "**Most non-US individuals fill out the W8-BEN**". Contract: Liftoff may "**deduct or withhold any applicable taxes**". Fees borne by the publisher. **Unclaimed payments forfeited after 1 year.** India GST/TDS: **NOT VERIFIED**.
- **Entity / law:** **LMI Inc.**, "a Liftoff Mobile, Inc. company", Palo Alto CA, USA. Governing law **California**; venue San Mateo County. Revenue share is "a percentage of the **Net Revenue** … **as determined by Liftoff**", net of up to **10%** deductions and **Invalid Impressions**.
- **Live app: NO for setup, YES for real ads.** "**If your app is not live on Apple Store or Google Play, you will not be able to use live ads for integration testing. You will only be able to use test ads.**" In test mode "Interstitial and Rewarded placement types are only supported". [OFFICIAL — Add and edit your app](https://support.vungle.com/hc/en-us/articles/115000493152)
- **Formats**: Interstitial, Rewarded, Inline, Banner, MREC, Native, **App Open**. **Rewarded Interstitial** was a v6.12.0 "closed beta" (Aug 2022) with **no later GA confirmation → NOT VERIFIED**.
- 🔧 **Technique:** Liftoff's Zendesk has a public JSON search API — `https://support.vungle.com/api/v2/help_center/articles/search.json?query=<term>`.

### 6.3 Chartboost (by LoopMe)
- **Still operating.** LoopMe Ltd (UK) is the contracting entity; Chartboost LLC (Delaware) is a LoopMe affiliate and "Platform Provider". Publisher Terms **updated 19 Nov 2025**; SDK v9.14.1. [OFFICIAL — Terms](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Account creation is free/self-serve, but EVERY APP is review-gated with a traffic minimum:** (1) "**The Chartboost SDK must be present in the live version of the application**"; (2) "**Your applications must be live in the official App Store**"; (3) "**Each individual app requires a minimum of 250 Daily Active Users (DAU) constantly for 7–14 days**… The metric for DAU is 'Uniques'." Review ≤3 business days. [OFFICIAL — Publisher App Review](https://docs.chartboost.com/en/monetization/publishing/publisher-app-review/) 👉 **The hardest numeric gate in this report.**
- **Entity:** "The Services are available only to **(a) individuals aged 18 or older**, and (b) entities that are properly licensed…" → an **Indian individual/sole proprietor (18+) IS permitted**. Extra accounts "must be **pre-approved by LoopMe**… if not pre-approved or registered, You automatically **waive any right to payments**."
- ⚠️ **COPPA blocker:** "You **shall not** use or permit the use of: (A) **games or applications directed to End Users under 13** in Your Supply Inventory."
- **app-ads.txt**: supported and **verified in-platform** — Monetization → Tools → App-ads.txt → **SCAN ALL APPS**; **COPY ALL / COPY MISSING ONLY** generate exact lines. Verifier requires SDK integrated + live on store + **approved**. Line: `chartboost.com,<publisher id>,DIRECT`. Cert authority ID: **NOT VERIFIED**. Developer URL must be publisher-managed (`user123.github.io/app-ads.txt` is valid; `twitter.com/user123` is not). Apple = **Marketing URL**; Play = store listing contact details. [OFFICIAL](https://docs.chartboost.com/en/monetization/publishing/app-ads-txt/)
- **Privacy policy — required with prescribed disclosures:** maintain "a clear, accessible, and legally compliant privacy policy on Your Supply Inventory", disclosing data types; sharing for personalized advertising including with third parties such as LoopMe; third-party service providers/cookies; and an **effective opt-out mechanism**. EEA/UK/CH personalised ads need a compliant consent solution. Publisher and LoopMe are **independent controllers**. [OFFICIAL — Terms §4.c.iii, §9](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Minimum payout — from Terms §6.l by Platform Provider:**
  - **CHARTBOOST provider → min USD 75; USD 300 for wire transfers.** Paid by the **last day of the second calendar month** after accrual (Jan → Mar 31).
  - **LOOPME provider → min USD 100**; valid invoice within **5 working days** of month end to `finance@loopme.com`; paid within **60 days** of receipt.
  - Help docs: "Publishers need to meet a **$75 minimum**… Publisher payments **via wire transfer have a $300 minimum** threshold." [OFFICIAL — Payment Terms & Dates](https://docs.chartboost.com/en/monetization/payments/payment-terms-dates/)
- **India payments**: Rails = **Wire Transfer, Direct Deposit/ACH, Hold My Payments**. **Currencies: "USD ($), GBP (£), or EUR (€), as agreed" — NO INR.** India-specific rails: **NOT VERIFIED**. [OFFICIAL — Setup Payment](https://docs.chartboost.com/en/monetization/payments/setup-payment/)
- **Tax form**: "Upload a **W-9**… or a **W-8BEN** tax form (for international vendors)" — only W-8BEN named, **not** W-8BEN-E. **Fees:** USD wires **$25**; non-USD wires **$25 + 3%**; checks and **eCheck/Local Bank Transfer/Global ACH $10**. [OFFICIAL — Payment FAQ](https://docs.chartboost.com/en/faq/payment/)
- **Taxes:** "Chartboost is **not required to withhold any taxes**." Terms: payments are "**inclusive of taxes**"; you remit "transaction taxes **(including VAT, GST, or similar)**"; LoopMe may withhold absent a valid exemption certificate; "**Amounts payable to You shall not be grossed up for withholding taxes.**" Fraud exposure: liquidated damages "up to **50% of the amount payable to You**." [OFFICIAL — Terms §6](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Entities / law:** **LoopMe Ltd** — English company no. **07979184**, London EC1M 4AH. **Chartboost LLC** — Wilmington, Delaware. Governing law **England and Wales**.
- **Live app: YES — STRICTLY** (SDK in live version + live in official store + 250 DAU for 7–14 days). Test Mode available during review with placeholder ads; with the Chartboost Mediation SDK "**no ads will be served to banner ad requests while your app is still under review**" but interstitials and rewarded do serve. ⚠️ "using it in more than one application is strictly against our Terms & Conditions."
- **Formats: materially narrower — Interstitial, Rewarded, Banner ONLY.** Native, App Open, MREC-as-separate-format, Rewarded Interstitial and Playable are **not documented** as publisher formats. [OFFICIAL — Ad Locations](https://docs.chartboost.com/en/monetization/publishing/ad-locations/)

### 6.4 Mintegral (Mobvista)
> ⚠️ **Source-quality warning.** Mintegral has **no current public publisher help centre**; `helpcenter.mintegral.com` is the **advertiser-only** "AppGrowth" centre. Publisher doc URLs (`/en/monetization/…`) now **404**; newest Wayback snapshots are **May 2022**. `support.mintegral.com` does not resolve.

- Publisher signup exists at **dev.mintegral.com/user/signup?lang=en**. [OFFICIAL — mintegral.com/en/monetization](https://www.mintegral.com/en/monetization)
- **Current approval criteria, traffic minimum, KYC/GST, entity type, and whether an Indian sole proprietor is accepted: NOT VERIFIED.**
- **Minimum payout: USD 1,000 monthly** — but only from an **archived** official publisher FAQ (snapshot **2022-05-25**): "The monthly minimum publisher revenue for payment is **$1000**. If your account balance is less than $1000, then the amount will rollover… For example, if an account earns $500/month, the publisher will be paid every second month." "Mintegral and the publisher will pay for each respective party's own transaction fees." ⚠️ **Live URL 404; current threshold NOT VERIFIED.** [Archived OFFICIAL](https://web.archive.org/web/20220525055954/https://www.mintegral.com/en/monetization/what-is-mintegrals-monthly-minimum-threshold-for-payment/)
- Historic footer entity: **广州汇世信息科技有限公司 (Guangzhou Huishi Information Technology Co., Ltd.)** — **current entity: NOT VERIFIED**.
- **app-ads.txt:** Google's official AdMob mediation doc says "**To prevent a significant loss in ad revenue, you'll need to implement an app-ads.txt file**… To implement app-ads.txt for Mintegral, see How app-Ads.txt Can Help Fight Ad Fraud." Mintegral's own line format did **not** render → **NOT VERIFIED**. [OFFICIAL — AdMob Mintegral mediation](https://developers.google.com/admob/android/mediation/mintegral)
  - Format hint only (AppLovin's illustrative example, **not** a Mintegral-issued value): `mintegral.com, 19435, DIRECT, 0aeed123c80d6423`.
- **Privacy policy: NOT VERIFIED.** **India payments: NOT VERIFIED.** Historic 2022 evidence suggests **no live-app requirement** (Add App form asked "Live in Google Play or App store yet") — **current requirement NOT VERIFIED**.
- **Formats** per Google's AdMob doc: **Banner, Interstitial, Native, Rewarded**. Markets **in-app bidding**. [OFFICIAL](https://developers.google.com/admob/android/mediation/mintegral)
- 🔧 Published SDK contact: `sdk-support@mintegral.com`. **Treat Mintegral as high-risk / high-effort until you get written terms from them.**

### 6.5 Pangle (ByteDance) — ⚠️ **NOT AVAILABLE TO INDIVIDUALS**
> **There are TWO Pangle platforms.** 穿山甲 / ChuanShanJia (`csjdeveloper.com`) is the **China-domestic** developer platform; **Pangle Global** (`pangleglobal.com`) is the international one an Indian developer would use. Do not conflate them.

- ⚠️ **Company required — individuals and sole proprietors are rejected.** "**Pangle currently does not support non-corporate (individual) developers.**" And: "Pangle does not offer support to individual developers. This specifically applies to those who engage in software development on a personal basis or **operate as sole proprietors**… **applications submitted by individual developers will not pass Pangle's review process**." [OFFICIAL — Non-corporate developers](https://www.pangleglobal.com/knowledge/individual-developers), [OFFICIAL — Edit company information](https://www.pangleglobal.com/knowledge/edit-company-info)
- **Company qualification verification is mandatory** before adding apps; failed online review → **manual review 3–5 business days** with a registration certificate showing **company name, registration number, registered address**. Name must match official documents exactly.
- India **is** accepted in registration-number formats (CIN e.g. `U99999UP1987PTC008754`; PAN e.g. `KPFPS1546H`). [OFFICIAL — Registration Number](https://www.pangleglobal.com/knowledge/28098)
- ⚠️ **But India is ABSENT from "Regions Pangle supports"** (Asia list = Japan, Korea, Taiwan, Indonesia, Thailand, Vietnam, Malaysia, Philippines, Singapore, Cambodia, Saudi Arabia, UAE, Turkey, Israel, Kazakhstan, Pakistan, Kuwait, Iraq, Qatar, Jordan, Oman, Bahrain, Lebanon, Sri Lanka, Azerbaijan). Pangle does not state whether this governs publisher country or traffic country — **UNRESOLVED**. [OFFICIAL](https://www.pangleglobal.com/knowledge/regions-Pangle-supports)
- The Publisher Agreement warrants the Partner is "duly organised, validly existing and in good standing as a **corporation or other entity**." [OFFICIAL — Publisher Agreement](https://www.pangleglobal.com/terms)
- **app-ads.txt — highly recommended, gates brand demand:** "**Failure to incorporate app-ads.txt may result in developers being excluded from brand advertisers' pool of targeted media, ultimately impacting their revenue.**" Prerequisite: developer website in the store listing (Play contact details; Apple **marketing URL**). Line: `pangleglobal.com, <Pangle account ID>, DIRECT`; Pangle also recommends a `pubmatic.com` line.
- **Privacy policy — required and detailed** (clause 10.2): maintain a "**publicly accessible privacy notice on each Property**… available to Data Subjects **prior to processing**", linked "at a minimum, via an **easily accessible link within the Property's settings and/or privacy policy** and **within any store or website where the Property is distributed**." Clause 10.3 bars Sensitive Data and Minor-Directed Property data.
- **Minimum payout: $100** — "The minimum payment amount is **$100**"; contractual "**'Applicable Threshold' means USD 100**". Sub-threshold invoices sit "**Awaiting Combination**". Cycle: statement ~**8th working day**; paid within **10 working days** after confirmation. [OFFICIAL — Payment FAQ](https://www.pangleglobal.com/knowledge/payment-faq)
- **Payments: wire transfer ONLY, USD ONLY** — "All payments will be made in **US dollars** and Pangle does not support other currencies." SWIFT (8–11 chars) required; **bank account name must match company name**; a **foreign currency account** is advised. Contracting entity: **ByteDance Pte. Ltd.**, Singapore (GST no. 201923456H). **GST guidance is Singapore-only. India GST: NOT VERIFIED. US W-8BEN: NOT REFERENCED AT ALL → NOT VERIFIED.** [OFFICIAL — Payment FAQ](https://www.pangleglobal.com/knowledge/payment-faq), [OFFICIAL — Bank account information](https://www.pangleglobal.com/knowledge/edit-bank-account-info)
- **Live app: YES.** "**Please note that only apps that have been officially released on Google Play or App Store can be created on Pangle Platform.**" Test apps "cannot generate revenue"; the contract must be in effect for Live. Store URL mandatory. Test devices supported (max 30). [OFFICIAL — How to Add an App](https://www.pangleglobal.com/knowledge/set-up-apps)
- **Formats (non-China traffic): Native, Banner, Interstitial, Rewarded Video, App Open.** Playable **not listed** for non-China traffic; rewarded interstitial **NOT VERIFIED**. [OFFICIAL — Supported Ad Formats](https://www.pangleglobal.com/integration/supported-ad-formats)
- Payment split: "**Google will pay out revenue to publishers earned from bidding, while Pangle will pay out any revenue earned from Waterfall.**"

### 6.6 Amazon Publisher Services (APS) / Amazon Ads
> **Distinguish the sides:** APS = the **publisher/monetisation** side (TAM, UAM, Connections Marketplace, Signal IQ, Publisher Cloud). Amazon Ads / DSP = the **advertiser** side. Amazon Ads advertiser specifics for India: **NOT VERIFIED**.

- **Approval: INVITATION-ONLY + application review.** "**Unified Ad Marketplace is an invitation-only service**… designed for web publishers who directly or exclusively represent their site and use Google Ad Manager." "An **invitation is required**." [OFFICIAL — UAM](https://publishers.advertising.a2z.com/aps/unified-ad-marketplace/index.html)
- The official mobile app application ([aps.amazon.com/aps/contact-us](https://aps.amazon.com/aps/contact-us/)) asks Company, **Company Size (1 / 2–19 / 20–99 / 100–499 / 500–999 / 1000+)**, apps managed, **app store URL(s)**, ad server/mediator (GAM / MAX / AdMob / Unity LevelPlay / DT FairBid / Nimbus / Custom / Other / None) and **Country — India is selectable**. No published traffic or revenue minimum. **Sole-proprietor acceptance: NOT VERIFIED.**
- **Correcting a widespread claim:** "APS only accepts large US/EU-traffic publishers" is **NOT VERIFIED** and is partly contradicted by APS's own "With UAM, **publishers around the world** can monetize their traffic."
- **[NON-OFFICIAL]** Playwire (2026-08-06) reports APS publishes **no eligibility criteria**, review is **one-shot with no retry or appeal**, and includes a content-governance / brand-safety review.
- **app-ads.txt** required in practice; the APS Portal has a per-app **"APP-ADS.TXT SETUP"** generating your content. **Exact generated line: NOT VERIFIED** (docs login-gated at `ams.amazon.com`).
- **Privacy policy — contractually REQUIRED.** APS Agreement General Terms §2(d): "you will on Your Properties **make accessible a privacy policy** that abides by all applicable Laws… adequately inform your end users about any information relating to end users that you will provide." (Agreement **last updated Feb 24, 2025**.) [OFFICIAL — APS Agreement](https://ams.amazon.com/webpublisher/apsmanaged/apsagreement)
- **⚠️ Minimum payout — the famous "high APS threshold" appears WRONG for UAM:** "UAM consolidates earnings from all bidders and issues one payment on a **net 60-day** basis… if it meets the **USD $5 minimum earnings threshold**." [OFFICIAL — UAM FAQ](https://publishers.advertising.a2z.com/aps/unified-ad-marketplace/index.html)
  - **Amazon Demand:** "within 60 days from the end of the calendar month"; no dollar threshold stated. **TAM:** buyers pay you directly → per-SSP thresholds. **Mobile SDK threshold: NOT VERIFIED.** ⚠️ Ignore Amazon **KDP** thresholds — different business.
- **India payments:** "Payments will be made in **USD, local currency or any other currency agreed in advance**… exchange rate… based on data supplied by **Bloomberg**… **we may deduct any currency conversion fees**." Tax: "**We may deduct or withhold any taxes that we may be legally obligated to deduct or withhold**"; you must supply forms "to satisfy any information reporting or withholding tax obligations" (W-8 territory, form not named). Contracting entity **A9.com LLC** (US) plus Amazon Europe Core S.a.r.l.; governing law **Washington State**, venue King County. **India rails / INR / GST / TDS: NOT VERIFIED.**
- **Fees:** TAM "**2.5% service fee charged to bidders**"; UAM "**10% transaction fee**… prior to conducting a first price auction."
- **Live app:** the application requires **App store URLs**; flow = Add App → Add Slots → app-ads.txt → SDK. **Pre-launch slot creation: NOT VERIFIED.**
- **Formats:** TAM — "Dynamic display banners, streaming TV (open beta), and pre-roll video on desktop and mobile web. **In-app mobile display and video units require separate SDK integration.**" Integrator docs list **Banner, Interstitial, Rewarded**; App Open / Rewarded Interstitial **not documented**.
- **Integration:** SDK + **in-app header bidding**; adapters via MAX, LevelPlay, AdMob/GAM, DT FairBid, Nimbus, TradPlus, TopOn. **Amazon Publisher Cloud is US/Canada-only.** **Bottom line:** a **long-shot** for a solo dev, but if invited the **$5 UAM threshold** is far friendlier than its reputation.

### 6.7 BidMachine (Bidease)
- **Self-serve signup, no invite**; account → activation email → dashboard. **Individuals allowed** ("must be at least **18 years old**"). No published company/KYC/GST requirement; **no traffic minimum published (NOT VERIFIED)**. Entity **Bidmachine, Inc.** (Delaware); California law. [OFFICIAL — Terms of Service](https://www.bidmachine.com/terms-of-service), [OFFICIAL — Dashboard payments](https://developers.bidmachine.io/dashboard/payments)
- **app-ads.txt:** dashboard-generated (**Dashboard > app-ads.txt**), append to your website's file.
- ⚠️ **Two configuration traps that silently kill revenue:** you must enable **Secure Signal sharing** and **allow-list BidMachine in your consent settings** in AdMob/GAM, or BidMachine **will not bid** (both **off by default**).
- **Privacy:** "**It is your responsibility to obtain any and all consents… from end users**"; you must add BidMachine to your CMP's **TCF vendors**. SDK reads IAB TCF v2 / US Privacy / GPP; `setCoppa(true)`, `setNonPersonalized(true)`.
- **Minimum payout: USD $1,000**, rollover, **net-60**, **45-day dispute window**, "All payments may be subject to banking fees." Carve-out: for **Google SDK Bidding** (AdMob/GAM), BidMachine remits to Google and **Google pays you** — the net-60/$1,000 terms do **not** apply.
- **India payments:** paid to "your bank account" (Pending ≤5 days / Completed / Rejected). **Currency, rails, tax forms, GST/TDS: NOT VERIFIED.**
- **Live app: YES, contractually, for payment.** "**You must have an active application that is currently published in the App Store, Google Play**"; impressions after removal may not be paid. Placements can still be **created** against a bundle ID. [OFFICIAL — ToS, last update 17 Jan 2024](https://www.bidmachine.com/terms-of-service)
- **Formats:** Ad Type = **Banner, Interstitial, Rewarded Video**; Native appears in the official AdMob console price-point table. Placement Type = **Bidding or Waterfall (waterfall adapter BETA)**, HVA setup, price floors. Integration: SDK (Android/iOS/Unity), bidding adapters for **MAX, Unity LevelPlay, AdMob/GAM**, OpenRTB. Incentivised traffic: **rewarded only, no cash/gift-card rewards** (ToS §7).

### 6.8 Moloco
- **Self-serve signup form** (`publisher.moloco.cloud/signup`) but **onboarding is rep-assisted** ("your Moloco representative"). **Individual OR Company** allowed — **Individual requires legal name, country of birth, date of birth** (KYC-style). No traffic minimum published. Global (230 countries). [OFFICIAL — Publisher FAQs](https://help.publisher.moloco.com/hc/en-us/articles/28449905072151-FAQs)
- ✅ **app-ads.txt explicitly NOT required:** "**Moloco operates with direct demand only, so app-ads.txt is not required for our platform.**" TCF Global Vendor ID **807**.
- **Privacy:** TCF v2.0/**v2.2**; "supports **GDPR, COPPA, and Apple ATT automatically**"; SKAdNetwork IDs handled server-side. App-level privacy-policy requirement: **NOT VERIFIED.**
- **Minimum payout: NOT PUBLISHED → NOT VERIFIED.** "payment is processed according to the payment terms outlined in **your contract**."
- **India payments:** "**Direct Deposit / ACH (for US only)**" or "**Wire Transfer**"; for wire "**USD is the only available option**". Requires a **government-issued beneficiary ID**, phone, SWIFT, bank name + address. **INR not offered.** Moloco is "**NOT authorized to provide any tax advice**" and points to Tipalti. Also a **Zip Supplier Portal (ZSP)**. **FX / GST / TDS / India entity: NOT VERIFIED.** Payment issues: `usap@moloco.com`.
- ✅ **Live app: NO.** App creation has an "**App is available in-store**" checkbox plus manual entry → **apps and ad units can be created pre-launch**. OS not editable after creation.
- **Formats:** Banner, Interstitial, Rewarded Video. Native **NOT VERIFIED**. **Auction method: in-app bidding ONLY** (not editable). Integration: certified in-app header-bidding adapters for **AppLovin MAX ≥13.0.0, Unity LevelPlay, Google AdMob, Google Ad Manager**; **custom adapters and waterfall are DEPRECATED**; iOS 13+ / Android API 21+.

---

## 7. INDIA-FOCUSED NETWORKS

### 7.1 InMobi — the strongest India-native option
See **§2**. Self-serve signup; ~24-hour app approval; app-ads.txt required (crawler activates at 10,000 bid requests); **$50 minimum for India publishers**; **EFT or PayPal**; **GST invoice mandatory for India**; 60-day cycle; Banner/Interstitial/Rewarded/Native.

### 7.2 AFFLE — ❌ **no verifiable publisher side**
- `affle.com` describes an **advertiser/marketer** business ("enabling **marketers**", Affle 3i Consumer Platform, OpticksAI, CTV AI). **No publisher signup, no publisher SDK, no payout terms.** [OFFICIAL — affle.com](https://affle.com/)
- **mediasmart** (Affle-owned) is a **demand-side** platform with a self-serve **advertiser** console; **Jampp** is UA/retargeting. [OFFICIAL — mediasmart.io](https://www.mediasmart.io/)
- 👉 **Budget Affle as a user-acquisition channel you pay, not a revenue partner.**

### 7.3 GLANCE — ❌ **no publisher side at all**
- Glance is an **owned-and-operated media property you buy on**: "**Owned Glance surfaces** — 175M+ devices… lock screen, connected TV, and the Glance discovery experience" plus "**InMobi global network** — 2B+ devices". Only commercial paths are **Advertisers / Brand partners**. [OFFICIAL — glance.com/advertising](https://glance.com/advertising)
- Advertiser side is real: InMobi support documents a "**Pricing Model for Glance Campaigns**". [OFFICIAL](https://support.inmobi.com/monetize/adding-an-app/pricing-model-for-glance-campaigns/)
- `glance.com` now fronts **Glance AI** (Glance AI, Inc. © 2026) — a rebrand within the same InMobi Group family.
- 👉 **Glance is a supply source, not a publisher network. You cannot monetise your app through Glance.**

### 7.4 Adgebra (Inuxu Media) — web-first, **not a native in-app SDK network**
- ⚠️ **Its own documentation only supports apps with web content:** "If you have a mobile app with **web-based content**, you can also use the DIY Partner program to integrate ads into your app's **website or landing page**." **No native in-app SDK / mediation / bidding product documented.** [OFFICIAL — Adgebra help](https://help.adgebra.co/getting-started/publish-your-docs-7/diy-partner)
- **Approval:** DIY self-serve signup requiring **GST, PAN and bank account**; then a call-back, **site approval**, then a Partner Manager. [OFFICIAL — Adgebra DIY publisher signup](https://login.adgebra.co/DIY/publisher-signup/)
- **Minimum payout: $100** revenue before invoicing; invoices due by the **7th** of the following month; paid within **60 days** of receipt, **subject to collections from Inuxu clients/advertisers**.
- **India payments — the clearest INR statement in this report:** "**All payments will be made in INR (Indian Rupees) or USD (United States Dollars) only.**" And: "Inuxu reserves the right to deduct the required **TDS (Tax Deduction at Source), Withholding Tax, or any other applicable tax**." ⚠️ **The one network that explicitly contemplates deducting Indian TDS.** [OFFICIAL — Adgebra help](https://help.adgebra.co/)
- **app-ads.txt and privacy policy requirements: NOT VERIFIED.**
- **Formats** (web): native, rich media, video, display, notification, gamification, in-image/in-footer.

### 7.5 IncrementX (Vertoz group) — India-HQ, thin public documentation
- **Approval: demo/contact-based, NOT self-serve** ("Book A Demo" / "Become a Publisher Partner"). Claims "Publisher onboarding < 24 Hours". [OFFICIAL — IncrementX](https://www.incrementx.com/)
- **Privacy:** the sample MSA §9 requires each party to post a privacy policy with third-party-cookie disclosure, and states "**IncrementX will not serve to EU, UK & Switzerland regions**." ⚠️ The page warns: "**NOTE: This is not the actual MSA.**"
- **Minimum payout / payment rails / app-ads.txt / live-app requirement / integration type: NOT VERIFIED.**
- **Entities:** **IncrementX Private Limited (Mumbai, India)** and IncrementX LLC (New Jersey, USA); the sample MSA's law is US/New York.
- **Formats (App channel):** Rewarded, Interstitial, Refresh Ads, Video Player, Header Bidding, CPA Offerwall.
- Vertoz sibling brands **VerdeAds / Adzcube / Ripple: NOT VERIFIED** individually.

### 7.6 Assessed and excluded
- **AdCounty Media** (Jaipur; BSE-listed "Adcounty Media India Limited", scrip 544435; "PUB-361" platform) — publisher signup/thresholds/payments **NOT VERIFIED** (site unreachable). Trade press only → **[NON-OFFICIAL]**.
- **Silverpush, Fork Media, SVG Media, Komli, mCanvas, Pokkt** — **NOT VERIFIED** as in-app **publisher** monetisation networks; public positioning is advertiser-side, creative, or agency. Do not assume a publisher program exists.

### 7.7 India-network bottom line
For **native in-app publisher revenue** the viable set is **InMobi** (best India payout terms) plus the global networks in §1 and §3–§6. **Affle and Glance are channels you buy, not networks that pay you.** **Adgebra is web-only.** Everything else India-branded is unverified as a publisher program.

---

## 8. CONSENT, PRIVACY AND AD DECLARATIONS

### 8.1 Google UMP SDK, GDPR and IAB TCF
- **The trigger is user location, not developer location.** "Under the Google EU User Consent Policy, you must make certain disclosures to your users in the **EEA, the UK and Switzerland**, and obtain their consent to use cookies or other local storage… and to use personal data (such as AdID) to serve ads." 👉 **An Indore developer with EEA/UK/Swiss users has the same obligation as an EU developer.** [OFFICIAL — Disclose to EEA users](https://developers.google.com/admob/android/privacy/gdpr)
- **A Google-certified CMP is mandatory for personalised ads in the EEA/UK (from 16 Jan 2024) and Switzerland (from 31 Jul 2024).** "if a partner doesn't adopt a Google-certified CMP, only **Limited Ads** will be eligible to serve on EEA and UK traffic." Enforcement ramped up to all EEA/UK traffic by end of February 2024. [OFFICIAL](https://developers.google.com/admob/android/privacy/gdpr), [OFFICIAL — CMP requirements](https://support.google.com/admob/answer/13554116)
- **You do not have to use UMP.** "No, you can use any CMP from the List of Google-certified CMP." UMP is Google's own certified CMP.
- **UMP mechanics:** Android API 21+; dependency `com.google.android.ump:user-messaging-platform:4.0.0`; call `requestConsentInfoUpdate()` **on every app launch**, then `loadAndShowConsentFormIfRequired()`, gate ad requests on `canRequestAds()`, and expose a privacy-options entry point when `getPrivacyOptionsRequirementStatus() == REQUIRED`. [OFFICIAL — Set up UMP SDK](https://developers.google.com/admob/android/privacy)
- **Consent revocation is required under GDPR** — implement via `showPrivacyOptionsForm()`. [OFFICIAL](https://developers.google.com/admob/android/privacy/gdpr)
- ⚠️ **TCF version: v2.3 is current, and the deadline has ALREADY PASSED.** v2.2 launched 16 May 2023; **v2.3 launched April 2025**; IAB deadline **28 Feb 2026**; Google's wording is a "**mandatory deadline … March 1, 2026**", after which support for new v2.2 strings is dropped. "Failure to meet this requirement may cause the associated ad request to be defaulted to **Limited Ads**, which may impact revenue." Google requires GMA SDK ≥19.0.0 (Android) / ≥7.60.0 (iOS) for TCF. [OFFICIAL — TCF requirements](https://support.google.com/admob/answer/9760862), [IAB Europe TCF](https://iabeurope.eu/transparency-consent-framework/)
- **US states:** 20 states covered (CA, CO, CT, DE, FL, IN, IA, KY, MD, MN, MT, NE, NH, NJ, OR, RI, TN, TX, UT, VA). Google frames US compliance as **Restricted Data Processing** with **optional** messaging — **not** a hard gate like the EU CMP rule. Supports IAB **GPP**. [OFFICIAL — US states](https://support.google.com/admob/answer/9561022), [OFFICIAL](https://support.google.com/admob/answer/10862202)
- **You must list mediation partners** or they will not bid: "Failure to do so can lead to partners failing to serve ads on your app." [OFFICIAL](https://developers.google.com/admob/android/privacy/gdpr)
- ⚠️ **NOT VERIFIED:** whether Meta/AppLovin/Unity each *require* an IAB CMP (only Google's publisher products were confirmed), and the contents of IAB Europe's / Google's named certified-CMP lists (both JS/Cloudflare-gated).

### 8.2 Apple App Tracking Transparency (ATT)
- **Requirement:** "In iOS 14.5 … you need to receive the user's permission through the App Tracking Transparency (ATT) framework in order to track them **or access their device's advertising identifier**." On denial, "the device's advertising identifier value will be **all zeros**." Requires `NSUserTrackingUsageDescription` + `requestTrackingAuthorization`. [OFFICIAL — AppTrackingTransparency](https://developer.apple.com/documentation/apptrackingtransparency)
- **Guideline 5.1.2(i):** "**You must receive explicit permission from users via the App Tracking Transparency APIs to track their activity.**" And you may **not** require users to enable tracking — or any system functionality — "in order to access functionality, content, use the app, or receive monetary or other compensation." [OFFICIAL — Guidelines 5.1.2](https://developer.apple.com/app-store/review/guidelines/)
- Verified ATT rulings: hashed email/phone is **not** a loophole; web-based consent does not substitute; **no fingerprinting**; you are responsible for all SDK code; covers session IDs, fingerprint IDs, device-graph IDs; webview tracking needs ATT.
- ⚠️ **NEW 2026:** iOS/iPadOS 27.2 introduces an **alternative ATT prompt** in the EU (`requestTrackingAuthorization(usingExpandedInterface:)`, `NSUserTrackingMarkdownUsageDescription` — both Beta), mandatory-only in **Germany, France, Italy, Poland, Romania**, with **re-prompt allowed one year** after the previous choice. [OFFICIAL — User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- **Revenue effect of denial:** ad serving **continues** (contextual / non-personalised / Limited Ads); SKAdNetwork preserves install attribution (Google's ID `cstr6suwn9.skadnetwork` — add to `SKAdNetworkItems`); best practice is to **create mediation groups by IDFA availability**. Google warns only of "**eCPM fluctuations**". ⚠️ **No official quantified % loss exists — NOT VERIFIED for any number.** [OFFICIAL — AdMob iOS14](https://developers.google.com/admob/ios/ios14)
- **Guideline 5.1.1(ii):** "**Paid functionality must not be dependent on or require a user to grant access to this data.**"

### 8.3 Google Play Data safety form
- **MANDATORY** for all developers with an app published on Play, including closed/open/production testing tracks. Only apps active **exclusively on internal testing** are exempt. Even zero-collection apps must complete it **and provide a privacy-policy link**. [OFFICIAL — Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- **Third-party SDK data must be included.** **Ad SDK ad-profile-building counts as "sharing", not a service-provider transfer:** "if an SDK provider is **building advertising profiles across multiple customers** based on your app data, that would **not** be considered 'service provider' activity… and would need to be declared as '**sharing**'." Ad profiling "**cannot be treated as ephemeral**." [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/10787469)
- **Android Advertising ID → declare as "Device or other IDs."** Also expect **App interactions**, **Approximate location** (IP-inferred "must be disclosed"), **Diagnostics**.
- **Google's own AdMob disclosure** (labelled "GMA SDK (**Legacy**) v25.5.0"): collects and shares **IP address** (may estimate general location), **user product interactions** (app launch, taps, video views), **diagnostic info**, and **device/account identifiers** (Android ad ID, app set ID, signed-in account IDs), all TLS-encrypted in transit. [OFFICIAL — AdMob Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- **Enforcement:** "When Google becomes aware of a discrepancy between your app behavior and your declaration, we may take appropriate action, **including enforcement action**." The Developer Program Policy (effective **26 Aug 2026**) makes suspensions count as **strikes**; multiple strikes → termination of the account **and related accounts**. [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/10787469), [OFFICIAL — Developer Program Policy](https://support.google.com/googleplay/android-developer/answer/17105854)

### 8.4 Families policy, Designed for Families, COPPA
- **Advertising ID must not be transmitted for children or unknown-age users.** "if one of the target audiences for your app is children, your app must not transmit certain identifiers (including the advertising ID) for children or users of unknown age." Fix: **GMA SDK Android 20.6.0+ / iOS 7.67.0+**, or remove the AD_ID permission. [OFFICIAL — Comply with Play's Families Policy using AdMob](https://support.google.com/admob/answer/6223431)
- **Families Self-Certified Ads SDK requirement — a hard gate.** "**All Android apps classified as Families must use a Google Play Families self-certified ads SDK or mediation platform** when serving ads to children or users of unknown age." AdMob auto-blocks non-self-certified sources; custom events must also use certified sources. [OFFICIAL](https://support.google.com/admob/answer/6223431)
  - **Certified SDK list includes:** AdColony 4.8.0+, AddApptr 3.8.3+, **Chartboost 9.1.1+**, **DT Exchange 8.2.1+**, Google Ad Manager (interactivemedia 3.19.0+), **Google AdMob play-services-ads 19.0.0+**, HyprMX 6.0.3+, **InMobi 10.5.5+**, **ironSource 7.2.1+**, Kidoz 8.9.4+, SuperAwesome 8.4.3+, **Unity Ads 4.0.1+**, **Vungle 6.10.4+**. ⚠️ **AppLovin LEFT the programme** (transition deadline 31 May 2023). The programme is "**currently not accepting new applicants**". [OFFICIAL — Self-Certified Ads SDK Program](https://support.google.com/googleplay/android-developer/answer/9283445), [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/9900633)
- **Formats/implementations PROHIBITED for child / unknown-age users:** ad walls; full-screen ads not clearly dismissible; "**rewarded or opt-in ads that are not closeable after 5 seconds**"; "**Interstitial monetization and advertising displayed immediately upon app launch**"; "**Multiple ad placements on a page**"; offerwalls and ads not clearly distinguishable from content; deceptive/emotionally manipulative ads. Also mandatory: no interest-based advertising or remarketing; child-appropriate content. Failure → "app removal or suspension." [OFFICIAL — Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335)
  - ⚠️ **Contrast:** for general apps the closeability limit is **15 seconds** and only *splash-screen video* / *unexpected* interstitials are banned. **Families is stricter on every axis** — don't carry one rulebook to the other.
- ⚠️ **BIGGEST 2026 CHANGE — TFCD/TFUA are DEPRECATED in favour of TFAT (Tag For Age Treatment).** "The tag for under age of consent (TFUA) and the tag for child-directed treatment (TFCD) are now deprecated. Instead, use the Tag for age treatment (TFAT)… The TFAT 'child' value is functionally equivalent." **CHILD(=1)**: disables personalised ads and remarketing, disables third-party ad-vendor requests, applies child ad-serving protections, and **does not transmit AAID/IDFA**. **TEEN(=2)**: disables personalisation/remarketing plus teen protections. **UNSPECIFIED(=0)** is the default. API: `RequestConfiguration.Builder().setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)`. Tagging is a certification — "abuse of this setting may result in **termination of your Google Account**." [OFFICIAL — Tag for age-restricted treatment](https://support.google.com/admob/answer/6219315), [OFFICIAL](https://support.google.com/admob/answer/11402075)
- **Identifier and location bans:** child-only apps must not transmit AAID, SIM Serial, Build Serial, BSSID, MAC, SSID, IMEI, IMSI, should not request the AD_ID permission when targeting API 33+, and may not request or transmit precise location. A **neutral age screen = free-entry DOB**; pre-filling or hinting an age is an **incorrect setup**. [OFFICIAL — Target audience](https://support.google.com/googleplay/android-developer/answer/9867159)
- **COPPA (FTC)** — 16 CFR 312. Applies to services directed to under-13s **and** general-audience services with **actual knowledge**. Notably covers "personal information collected by **an ad network to serve targeted advertising**." Persistent identifiers **are** personal information, and "collection" includes **passive tracking**. **Key carve-out: contextual advertising and frequency capping qualify as "support for internal operations" (no parental consent needed) — but "the term 'support for internal operations' does not include behavioral advertising."** Mixed-audience age screens may not block children entirely. [OFFICIAL — FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- Apple's parallel rules: **1.3** ("Apps in the Kids Category should not include third-party analytics or third-party advertising"; narrow contextual-ad exception requiring human creative review) and **5.1.4**. Apple's App Review page requires you to **submit a link to the ad service's Kids-category practices** if the app is for kids and contains third-party ads. [OFFICIAL — Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### 8.5 Google Play "Ads" declaration — mandatory
- "**You must declare whether or not your app contains ads.** This includes ads delivered through **third-party ad SDKs**, display ads, native ads, and/or banner ads." Adds a public "**Contains ads**" label. Path: Play Console → **Policy and programs → App content → "Ads"** → Start → review the Ads policy → Yes/No → Save. [OFFICIAL — Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455)
- Answer **Yes** for: banner/interstitial via an Ad SDK (whether monetising or promoting your own apps), native ads, house ads. Answer **No** only if the sole cross-promotion is a "More Apps" section that doesn't interfere with gameplay or confuse users.
- **Enforcement:** "**If you misrepresent the presence of ads in your app(s), it's considered a violation of the Google Play policies and may result in your app(s) being suspended.**"
- 👉 **You may not ship with ads while declaring "No ads"**, even on a testing track.

### 8.6 Apple: declaring ad SDKs
- **`PrivacyInfo.xcprivacy`** is the exact required filename. Keys: `NSPrivacyTracking`, `NSPrivacyTrackingDomains` (**requests to these domains FAIL if tracking permission is not granted**), `NSPrivacyCollectedDataTypes`, `NSPrivacyAccessedAPITypes`. [OFFICIAL — Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- **Required-reason APIs: mandatory since 1 May 2024** — approved reasons for listed APIs "used by your app's code (**including from third-party SDKs**)". [OFFICIAL — Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)
- **Apple's commonly-used SDK list (fetched 18 Sep 2026):** "You **must** include the privacy manifest for any SDK listed below… **Signatures are also required**… Any version of a listed SDK, **as well as any SDKs that repackage those on the list**, are included." Ad/monetisation-relevant entries: Meta → `FBAEMKit`, `FBLPromises`, `FBSDKCoreKit`, `FBSDKCoreKit_Basics`, `FBSDKLoginKit`, `FBSDKShareKit`; Google → `GoogleDataTransport`, `GoogleToolboxForMac`, `GoogleUtilities`; Unity → `UnityFramework`. [OFFICIAL — Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)
- ⚠️ **IMPORTANT NEGATIVE FINDING:** there is **NO entry named GoogleMobileAds / Google-Mobile-Ads-SDK, and NO AppLovin, ironSource/LevelPlay, Unity Ads, Liftoff/Vungle, Mintegral, Pangle, Chartboost, InMobi, DT Exchange, AdColony or Kidoz**. Do **not** tell the developer "ad SDKs are on Apple's list by name" — the rule reaches most ad SDKs only via the "**repackages those on the list**" clause.
- **Other current Apple deadlines:** since **28 Apr 2026** uploads must be built with **Xcode 26 / iOS 26 SDK+**; since **31 Jan 2026** new age-rating questions must be answered; EU **DSA trader status** required since 17 Feb 2025.
- ⚠️ **NOT VERIFIED:** no Apple doc describes an App Store Connect field enumerating individual SDK names. The verified mechanism is manifests + signatures + required-reason APIs + the App Privacy nutrition label. [OFFICIAL — App privacy details](https://developer.apple.com/app-store/app-privacy-details/)

---

## 9. WHY APPS GET REJECTED, SUSPENDED OR BANNED

Note the asymmetry: **Google Play/Apple reject the app**; **ad networks cut off the money**. Both can flow from the same root cause.

### 9.1 AdMob: the consequence ladder
"If you fail to comply with these policies without permission from Google, we reserve the right to **disable ad serving to your app and/or disable your AdMob account at any time**. **If your account is disabled, you will not be eligible for further participation in the AdSense and/or AdMob program(s).**" [OFFICIAL — AdMob policies and restrictions](https://support.google.com/admob/answer/6128543)

AdMob publishes an official table of statuses — you walk down this ladder rather than jumping to a ban. [OFFICIAL — Understand policy issues and ad serving statuses](https://support.google.com/admob/answer/15697162)

| Status | What it means |
|---|---|
| **Ad serving at risk** | "Ad serving isn't affected yet, but you'll need to make changes… due to a **warning** on your app. Warnings typically include enforcement dates." |
| **Restricted ad serving** | "There are restrictions on the advertisers that can bid on your inventory… likely to have little or no buyer demand." |
| **Disabled ad serving** | "**All advertising is blocked on your app.**" |
| **Limited ad serving** | "Google has placed a limit on the number of ads your AdMob account can show." "typically … **less than 30 days**"; applies to **AdMob Network only** — third-party mediation, house ads and direct-sold campaigns are unaffected. |
| **Confirmed Click on** | Accidental-click mitigation: "Confirmed Click adds a second click that … let[s] the user confirm their intent." |
| **Account suspension / termination** | "Repeated policy violations may lead to an **account suspension**." |

"Check your Policy center for the '**fix by**' date." [OFFICIAL](https://support.google.com/admob/answer/15697162), [OFFICIAL — Ad serving limits](https://support.google.com/admob/answer/9493252)

**Suspension (invalid traffic) — non-appealable:**
- "we may **suspend your account and refund all account earnings associated with violations** … to impacted advertisers." "**Suspensions are non-appealable.**" "If any additional issues are found … your account may be **permanently disabled even before the suspension period ends.**" [OFFICIAL — Invalid activity: Suspended account](https://support.google.com/admob/answer/6213019)
- **Per-app disapproval → appeal:** Policy center → **Disapproved apps** → **Fix** → confirm → **Start review process**. You must upload the fixed version to the store **before** requesting review. [OFFICIAL — About app readiness](https://support.google.com/admob/answer/10564477), [OFFICIAL — Fix policy issues](https://support.google.com/admob/answer/9192065)

**What a permanent disable costs** — [OFFICIAL — Invalid activity: Disabled account](https://support.google.com/admob/answer/6197403):
- "**we're unable to provide our publishers with any information about their account activity**"; "**there is no guarantee that your account will be reinstated. Once we've reached a decision on your appeal, further appeals may not be considered**".
- "publishers disabled for invalid activity … **may not open new accounts.**" Duplicates: "the accounts will be flagged as duplicates and then **one or both accounts will be closed**." A **payment hold of at least 30 days** applies. Related-party accounts may also be disabled.

**What does NOT stop:** "mediated third-party network ads, house ads, and Reservation campaigns will continue to serve as normal through AdMob Mediation" — **unless** the violation is of **platform policies**, in which case you lose "the AdSense and/or AdMob program(s) **including AdMob Mediation**." [OFFICIAL — Account issues FAQ](https://support.google.com/admob/answer/9686306)

### 9.2 AdMob: the documented invalid-traffic causes
"**Invalid traffic includes any clicks or impressions that may artificially inflate an advertiser's costs or a publisher's earnings. Invalid traffic covers intentionally fraudulent traffic as well as accidental clicks.**" … "ultimately **it is your responsibility as the publisher** to ensure that the traffic on your ads is valid." [OFFICIAL — Invalid traffic](https://support.google.com/admob/answer/3342054)

Top causes [OFFICIAL — Invalid activity: Suspended account](https://support.google.com/admob/answer/6213019):
1. **Clicking the ads on your own app.** "Testing your own ads by clicking on them is not allowed." Use test ads.
2. **Users repeatedly clicking ads.** "Publishers may not ask others to click their ads. This includes **asking for users to support your app, offering rewards to users for clicking ads**…"
3. **Deceptive placement / accidental clicks.** "**placing ads too close to clickable elements on the app**", ads that "prevent users from viewing the app's core content", and "modifying the ad size to be nonstandard, invisible, or hard to see."
4. Failure to follow implementation guidance.

Also: "**Testing your own ads by clicking on them is not allowed.**" and "If you click too many ads without being in test mode, your account can be flagged for invalid activity." [OFFICIAL — Behavioral policies (updated 16 Aug 2024)](https://support.google.com/admob/answer/2753860), [OFFICIAL — How you can prevent invalid activity](https://support.google.com/admob/answer/3342099)

### 9.3 AdMob: disallowed interstitial implementations
[OFFICIAL — Disallowed interstitial implementations](https://support.google.com/admob/answer/6201362)
- **App load or exit — prohibited.** "**Do not place interstitial ads on app load and when exiting apps** as interstitials should only be placed in between pages of app content." Recommended replacement: an **app open ad**.
- **Repeated/recurring interstitials.** "You should place **no more than one interstitial ad after every two user actions**"; this "also applies when a user clicks the *Back* button."
- **Back-to-back interstitials** are non-compliant.
- **Interstitials that impact navigation** — may not "interfere with navigating or interacting with the app's core content and functionality."
- **Unexpected launches** — implement only at "**logical breaks**"; a documented failure mode is the ad appearing after the next screen renders due to **carrier latency**, fixed by **pre-loading**.

### 9.4 Policy-level rules (stricter than "guidance")
**"Ads interfering"** — [OFFICIAL](https://support.google.com/publisherpolicies/answer/11035030): ads may not "**overlay or are adjacent to navigational or other action items**", "**severely interfere with consumption of content**", or sit on a "**dead end**" screen. "Google-served ads cannot overlay or obscure other ads."

**"Screens without publisher-content"** — the ad-wrapper / thin-utility-app killer. [OFFICIAL](https://support.google.com/publisherpolicies/answer/11112688): bans ads on screens "**without publisher-content or with low-value content**", and "Ads should not be placed on '**dead end**' or no content screens (e.g., Thank You, Exit, Error pages)… For example, **a flashlight app**." 👉 Combined with Apple 4.2/4.2.2 and AppLovin's minimum-content rule, a thin utility app is refused by **both** stores and **both** networks. Apple **4.3(b)** names "dating, flashlight, sound effects, wallpaper, simple timers, and fortune telling" as categories where "**we will not accept new submissions unless they offer a meaningfully different or improved experience**." [OFFICIAL — Guidelines §4.3](https://developer.apple.com/app-store/review/guidelines/#4.3)

**Rewarded ads — the exact safe harbour** [OFFICIAL — Policies for ad units that offer rewards](https://support.google.com/admob/answer/7313578):
- "**Direct monetary items may not be offered as rewards under any circumstance.**"
- Non-monetary rewards must be redeemable only within your app/platform, **non-transferable**; physical-item discounts ≤ **25%** of value.
- Random rewards allowed only if probability is disclosed **before** the ad, all rewards listed, "not receiving a reward" stated as possible, and "**The chance for receiving a reward must be greater than 0.**"
- "Rewarded Ads must not oblige users to interact with it (for example, it must be possible to skip or dismiss them)."
- "**Publishers must not include any text or icons, other than to describe the reward(s) offered, to mislead or incentivize users** (such as by indicating 'watch this ad to support our business')."

**Encouraging clicks:** "**Any compensation or other incentives to click ads are strictly prohibited**", including "placing images next to individual ads". [OFFICIAL — Implementation guidance](https://support.google.com/admob/answer/2936217)

### 9.5 Google Play's own ad rules
Because a Play removal automatically restricts AdMob ad serving, Play's ad policy is effectively an ad-network policy too. [OFFICIAL — Ads (Play Console Help)](https://support.google.com/googleplay/android-developer/answer/9857753)
- "**Full screen video interstitial ads that appear before an app's loading screen (splash screen) are not allowed.**"
- Full-screen interstitials that "show unexpectedly" are not allowed; "Ads that appear during game play at the beginning of a level" are not allowed.
- "**not closeable after 15 seconds** are not allowed." Rewarded ads explicitly opted into are exempt.
- "**Made for Ads** — We don't allow apps that display interstitial ads repeatedly to distract users."
- "Ads must not simulate or impersonate the user interface of any app feature" (deceptive ads).
- Lockscreen monetisation banned unless lockscreen is the app's exclusive purpose.
- "**Your app cannot force a user to click on an ad or submit personal information for advertising purposes before they can fully use an app.**"

**Play "Ad Fraud"** [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/9969955): "**Ad fraud is strictly prohibited.**" Named examples: "ads that are **not visible to the user**"; "**automatically generates clicks**"; "**fake installation attribution clicks**"; ads popping up outside the app interface; "**False representations of the ad inventory** … an app that communicates to ad networks that it is running on an iOS device when it is in fact running on an Android device".

**Play strikes → termination** [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/2491922): "**app suspensions count as strikes**… Multiple suspensions or suspensions for egregious policy violations may also result in the **termination of your Google Play Developer account**." On termination, "**all apps in your catalog will be removed**", "**related Google Play Developer accounts are also terminated**", new accounts are terminated **without refund of the registration fee**, and "**Do not attempt to register for a new Google Play Developer account.**" One appeal per termination.

**Fair warnings** [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/2985876): "**Google is not required to send you a warning prior to suspension or termination.** … Failure to address the issue, **or launching a second app that does the same thing**, will almost certainly result in your app's suspension, or even termination."

**Store → AdMob link** [OFFICIAL](https://support.google.com/admob/answer/6195019): "If your app is removed from the Google Play store for a violation of Play Policies, **Google will restrict ad serving for that app until you resolve your issues**"; re-enabling takes "up to 2-3 days". "App removed from Google Play Store" is a named **Publisher Restriction**. [OFFICIAL](https://support.google.com/publisherpolicies/answer/10437964)

### 9.6 Apple: the ad-related rejection hooks
- **3.2.2(iii):** "**Artificially increasing the number of impressions or click-throughs of ads, as well as apps that are designed predominantly for the display of ads.**"
- **3.2.2(x):** no forcing ratings/reviews/downloads; "**Apps may otherwise incentivize users to take specific actions within apps (e.g. completing a level, watching an ad).**" 👉 **Rewarded video is explicitly blessed; rewarding a *click* is not.**
- **4.2 / 4.2.2 / 4.2.6:** minimum functionality; "apps shouldn't primarily be marketing materials, advertisements, web clippings, content aggregators, or a collection of links"; template/generated apps rejected.
- **2.5.18 (the core ad rule):** ads confined to the main binary; age-appropriate; must show all targeting information; no behavioural targeting on sensitive data; "**Interstitial ads or ads that interrupt or block the user experience must clearly indicate that they are an ad, must not manipulate or trick users into tapping into them, and must provide easily accessible and visible close/skip buttons large enough for people to easily dismiss the ad. Apps that contain ads must also include the ability for users to report any inappropriate or age-inappropriate ads.**"
- **5.1.2(i):** explicit ATT permission required; may not gate functionality or rewards on granting tracking.
- **Introduction:** "**You are responsible for making sure everything in your app complies with these guidelines, including ad networks, analytics services, and third-party SDKs.**" And: "If you attempt to cheat the system … **your apps will be removed from the store and you will be expelled from the Apple Developer Program.**"
- [OFFICIAL — App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (no revision date shown on the page → **NOT VERIFIED**; the App Review landing page reported a published date of **30 Jan 2026**)

### 9.7 AppLovin, Unity and Meta enforcement (publisher-side)
**AppLovin — Policies for Publishers** (*Date updated: September 16, 2026*): [OFFICIAL](https://legal.applovin.com/policies-publishers/)
- **Minimum content rule (a direct ad-wrapper ban):** the Property must have "**substantive, original content, and demonstrate signs of user engagement**"; AppLovin does not work with any Property that "**Contains more ads than Publisher content, or appears designed primarily to display ads or low quality**", has "little to no evidence of user engagement", or "remains under construction."
- **Invalid traffic:** "AppLovin strictly prohibits invalid impressions, clicks, or requests… **AppLovin shall determine, in AppLovin's sole discretion, what constitutes valid** … **payments to you may be withheld or adjusted if you engage in any actual or suspected violation**."
- **Named techniques:** "click injection, click spamming, **install or device farms, emulators, or undisclosed or prohibited incentivized traffic**"; device/SDK/location spoofing; "**Once you make an ad request through MAX, do not redirect that impression through any other auction.**"
- **Viewability:** ads must be visible "(i.e., **not hidden or invisible, out of page, stacked, or stuffed**)" — non-visible ads "may be considered … **invalid activity**."
- **Deceptive elements:** "**fake messages that lead to an ad or landing page when clicked**", non-clickable areas that lead to an ad.
- **Enforcement:** "**blocking or limiting ads** … the **suspension or termination of your account** … and/or the **suspension, withholding, or termination of any payments**."
- **Store requirement:** "Your property must be **live in an official app store**. We do not allow … **direct APK downloads**." [OFFICIAL — Introduction](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/)
- **Terms of Use** (effective 14 Jul 2026): termination "**at any time, for any reason or no reason, and without notice or explanation**"; eligibility excludes anyone who "**ha[s] previously been suspended from the Services**"; **VPN/proxy apps prohibited**; use with a "**child**" means "**your account(s) may be subject to immediate termination**." [OFFICIAL](https://legal.applovin.com/en/terms/)

**Unity** — three operative documents:
- **Invalid Activity Policy** (last updated **23 Jun 2021**): banned conduct includes automated requests; "**encouraging or incentivizing** … End-User actions … **other than in strict compliance with the Rewarded Inventory Policy**"; designs "likely to lead to Invalid Activity or other unintended or accidental Ad interactions"; device/geo spoofing; "**automatically refreshing Ads**"; traffic from "**recognized proxy IPs**" or "**unapproved VPN applications**"; and "**manually clicking on Ads by publisher's employees or agents outside of limited, customary Application testing**." "**Invalid Activity includes both intentional and/or fraudulent traffic, as well as accidental traffic.**" [OFFICIAL](https://unity.com/legal/invalid-activity-policy)
- **Placement Policy** (last updated **23 Jun 2021**): no placements "so close to or underneath buttons"; none "running in the background of the device or outside of the Application environment" — "**placements launched before an Application has opened or after an Application has closed would be a violation**"; none on "**screens with no or little content (e.g., log-in, error pages)**"; "**End-Users must have a means to exit any screen that contains an Ad placement without being forced to click on the Ad**"; "**Placements may not be disguised in any way.**" [OFFICIAL](https://unity.com/legal/placement-policy)
- **Advertising Services Content Policy** (last updated **30 Jun 2026**): enforcement includes "**Suspend/ terminate/ restrict monetization of content**" and "Suspend/ terminate an account"; factor includes "If an account **repeatedly violates** our content restrictions." [OFFICIAL](https://unity.com/legal/content-policy)
- **Terms of Service** (30 Jun 2026) §23: "**If Unity suspends, disables or terminates your access to an Offering due to your breach, no refunds will be provided.**" [OFFICIAL](https://unity.com/legal/terms-of-service)

**Meta Audience Network Policy** (*Updated: Apr 20, 2026*): [OFFICIAL](https://developers.facebook.com/docs/audience-network/policy/)
- "**Violations of these policies may result in suspension or termination**"; "If we determine that a publisher account might pose a risk … **we may limit or disable that account**."
- Placement: no ads where people are "**likely to accidentally click**"; "users should not be able to engage with **white space and the background** of an ad"; "**engaging with an ad is not the only way to exit a screen**"; "**Apps must not stack multiple ads in a single ad placement**"; "**Apps must not automatically refresh**"; "Apps must not show ads in the background or outside of the app."
- Rewarded (stricter than AdMob in places): "**Apps must only offer users rewards for watching ads.**"; "**Offering a one-time opt-in to viewing all rewarded ads is not acceptable**"; if no natural breaks, cap at "**maximum 3** Rewarded Video or Rewarded Interstitial Ads in a specific period"; no financial/cash-equivalent rewards; no transferable rewards; "**Apps must not show an interstitial ad if users choose not to watch a Rewarded Video**"; no reward if the ad is closed early.

### 9.8 Does an AdMob ban cascade to other networks?
**What IS verified:** within Google, completely — "if a publisher had an AdMob account closed for invalid activity or policy violations, they would not be able to use AdSense … and vice versa. **these publishers may not open new accounts**." [OFFICIAL](https://support.google.com/admob/answer/2753860)
**The real cross-network choke point is the app store, not the ad network:** AppLovin requires the property "live in an official app store"; Meta requires apps "offered in Apple iTunes or Google Play"; a Play removal auto-restricts AdMob.
⚠️ **Explicitly NOT VERIFIED:** **no official AppLovin, Unity or Meta page** was found stating that they check or act on Google AdMob/AdSense ban status. **There is no verified official cross-network blacklist.** What is true is that the *same bad traffic source* is visible to every network's fraud system at once.

### 9.9 Top ban triggers to avoid — checklist
1. **Never click a live ad in your own app.** Use demo ad units or register a **test device**. AdMob suspensions are **non-appealable**; a permanent disable means never opening another AdMob/AdSense account.
2. **No interstitial at app open, splash, or exit**, and **pre-load** so latency doesn't push the ad past the next screen.
3. **Cap frequency:** ≤1 interstitial per 2 user actions (Back counts), no back-to-back interstitials, banners persist 60s+.
4. **Keep ads clear of buttons, nav bars, chat inputs, galleries and gameplay; never float/hover/overlap.** Accidental clicks *are* invalid traffic by Google's own definition.
5. **Reward the *view*, never the *click*** — in-app, non-transferable, non-cash rewards only, and no "support us" copy.
6. **Ship a genuinely useful app** — no webview/link-list/ad-wrapper (Apple 4.2/3.2.2(iii) + AdMob low-value-screen policy + AppLovin minimum content).
7. **Never buy installs/traffic that flows into monetised inventory** — click injection, install farms and emulators are banned by AppLovin, Unity and Meta, and the same spike hits all four fraud systems at once.
8. **No hidden, transparent, off-screen, auto-clicking or stacked ads** — classified as **ad fraud**, the worst enforcement tier on both the store and the network.
9. **app-ads.txt correct and early** (mandatory for new AdMob apps); for kids' apps use **only** Families self-certified SDKs, no personalised ads, no launch interstitial.
10. **Treat the first warning email as a countdown.** Fix → upload the new version to the store **first** → then request review in the AdMob Policy center. Never ship the same ad pattern on a second Play account.

---

## 10. GOOGLE PLAY PLATFORM REQUIREMENTS
Covered in **§8.3** (Data safety), **§8.4** (Families/COPPA/TFAT), **§8.5** (Ads declaration) and **§9.5** (Play's own ad rules and strike system). The three declarations that must be mutually consistent are: the **Ads** declaration, the **Data safety** form, and the **privacy policy** — misrepresentation on any of them is a direct suspension trigger.

---

## 11. APPLE APP STORE REQUIREMENTS
Covered in **§8.2** (ATT), **§8.6** (ad-SDK/privacy-manifest declarations), **§9.6** (rejection hooks) and **§12.8** (Apple's India payouts). Key items: privacy policy in App Store Connect **and** in-app for **all** apps (5.1.1(i)); `PrivacyInfo.xcprivacy` + required-reason APIs since 1 May 2024; ads only in the main binary; the in-app **"report this ad"** mechanism required by 2.5.18; and Kids Category rules that effectively exclude third-party ad SDKs.

---

## 12. INDIA TAX, REGULATORY AND PAYMENT FRAMEWORK

> ⚠️ **Not tax advice.** Engage a CA. This section describes what the law and the networks' own documents say.

### 12.1 GST — is ad revenue an export of services?
- **Yes, if the five conditions of IGST Act s.2(6) are met:** (i) supplier in India; (ii) recipient outside India; (iii) place of supply outside India; (iv) payment received in **convertible foreign exchange** (or INR where RBI permits — inserted by the IGST (Amendment) Act 2018 w.e.f. 01.02.2019); (v) supplier and recipient are not merely establishments of a distinct person. All five are satisfied for revenue from Google Asia Pacific (Singapore), Google Ireland or AppLovin US. [OFFICIAL — IGST Act s.2(6), CBIC](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_IGST_Act/active/chapteri/section2_v1.00.html)
- **Export of services is ZERO-RATED, not exempt** — taxable at 0% with input tax credit intact. [OFFICIAL — IGST Act s.16](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_IGST_Act/active/chaptervii/section16_v1.00.html)
- **A LUT (Letter of Undertaking) in Form GST RFD-11 is required** for the route where you export **without paying IGST**: a registered person exporting without payment of IGST "**shall furnish, prior to export, a bond or a Letter of Undertaking in FORM GST RFD-11**." If foreign exchange is not received, tax + interest become payable 15 days after the expiry of one year **or** the FEMA-allowed period, whichever is later. [OFFICIAL — CGST Rules Rule 96A, CBIC](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96a_v1.00.html)
- ⚠️ **Is GST registration mandatory for a sub-Rs-20-lakh service exporter? CONTESTED — no clean official answer.** CGST s.24(i) requires registration for "persons making any inter-State taxable supply", but **Notification No. 10/2017-Integrated Tax dated 13.10.2017** exempts "persons making inter-State supplies of taxable services and having an aggregate turnover … not exceeding twenty lakh rupees in a financial year" from registration. ⚠️ The CBIC-hosted original could **not** be retrieved; the notification's number/date/subject was corroborated only via an ICMAI compilation → **VERIFY ON cbic.gov.in**. Competing readings: (a) no registration needed below Rs 20 lakh if you are a pure exporter and don't want ITC/refund; (b) registration is what unlocks the zero-rating machinery, because s.16(3) and Rule 96A are expressed to apply to a **"registered person."** [OFFICIAL — CGST s.24](https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter6/section24_v1.00.html)
- **What the networks actually require:** **InMobi** is the only one with a verified India GST demand (GST invoice or emailed exemption declaration — §2.5). **Google** does **not** require an Indian GSTIN from an India-address AdMob publisher (its GST-invoice page is about **Singapore** GST). **Adgebra** requires GST + PAN at signup and may deduct TDS. **Pangle** publishes Singapore-GST guidance only.
- **OIDAR / reverse charge:** IGST s.2(17) OIDAR expressly includes "**(i) advertising on the internet**", but the registration duty under CGST s.24(xi) falls on the **foreign supplier** selling to Indian recipients — not on the Indian publisher. Direction matters: a foreign network **paying** you = you are the supplier → export of services. A foreign supplier **charging** you (Apple's developer fee, foreign SaaS) = **import of services** → examine reverse charge under IGST s.5(3). ⚠️ The RCM notification text and any de-minimis exemption were **NOT VERIFIED**.

### 12.2 Income tax and TDS
- Ad revenue for a sole proprietor is **business income (PGBP)** → ITR-4 if presumptive, else ITR-3.
- **⚠️ 44AD vs 44ADA is the biggest money decision.** [OFFICIAL — Income Tax Dept](https://www.incometaxindia.gov.in/w/small-businessmen-benefits-allowable)
  - **s.44AD:** deemed profit **8%** of turnover (6% where receipts are digital/account-payee); threshold Rs **2 crore**, rising to **Rs 3 crore if cash ≤5%**.
  - **s.44ADA:** deemed profit **50%** of gross receipts; cap **Rs 50 lakh**, rising to **Rs 75 lakh if cash ≤5%**.
  - ⚠️ **s.44AD is expressly unavailable to a s.44AA(1) "profession"**: the Income Tax Dept FAQ confirms "a person carrying on **profession as referred to in section 44AA(1)** is not eligible for presumptive taxation scheme under section 44AD." [OFFICIAL — FAQ](https://www.incometaxindia.gov.in/w/which-businesses-are-not-eligible-for-presumptive-taxation-scheme-of-section-44ad-)
  - 👉 **There is NO official resolution of whether app development / ad-monetised mobile apps are a "business" (→ 44AD, 6% deemed profit on up to Rs 2–3 crore) or a "profession / technical consultancy" (→ 44ADA, 50% deemed profit capped at Rs 50–75 lakh).** This is the single highest-value question for the CA. **NOT VERIFIED.**
  - Advance tax for a 44AD/44ADA opter may be paid in **one instalment by 15 March** (only if liability ≥ Rs 10,000). Tax audit u/s 44AB does not apply to a presumptive opter.
- **⚠️ No Indian TDS is withheld on this income.** Indian TDS u/s 195 applies to payments **to** non-residents, not **from** them. A foreign ad network deducts nothing under Indian law, so **no TDS credit will appear in 26AS/AIS** — the entire liability is self-paid via advance tax and self-assessment (interest u/s 234B/234C applies for shortfalls). Do **not** conflate this with **Google Play India's** withholding on Indian-user paid-app/IAP sales (Income Tax Act 2025 s.393(1), Table S.No. 8(v)), which **does** appear as TDS. [OFFICIAL — Google Payments Center](https://support.google.com/paymentscenter/answer/13401799?hl=en)
- **⚠️ Adgebra is the one exception** worth flagging: its help pages state Inuxu "reserves the right to deduct the required **TDS, Withholding Tax, or any other applicable tax**." (§7.4)

### 12.3 Form 42 / Form 43 — the TRC an Indian resident needs
- **Rule 75 of the Income-tax Rules, 2026** (formerly Rule 21AB of the 1962 Rules): **Form 42** (formerly 10FA) is the **application by a RESIDENT** for a Tax Residency Certificate, filed online on the e-filing portal, one per tax year, no due date, with passport upload for individuals; **Form 43** (formerly 10FB) is the **certificate actually issued**, downloadable from the portal. [OFFICIAL — Income Tax Dept brochure, March 2026](https://www.incometaxindia.gov.in/documents/d/guest/2-form-no-42-43-rules-and-forms-for-obtaining-taxresidency-certificate-trc-by-resident-taxpayer-pdf)
- This is the form an Indian **resident** needs to claim DTAA benefits **abroad** — e.g. to support a reduced US withholding rate.
- ⚠️ **Form 10F is a different thing** and the brief conflates them: Form 10F is the **NON-RESIDENT's** self-declaration for claiming DTAA benefits on **INDIAN** income (Rule 21AB). [OFFICIAL — Rule 21AB](https://www.incometaxindia.gov.in/w/rule-21ab)

### 12.4 W-8BEN vs W-8BEN-E and US withholding
- **A sole proprietor signs W-8BEN; W-8BEN-E is for entities only.** The IRS instructions state: "If you are the single owner of a disregarded entity, you are considered the beneficial owner of income received by the disregarded entity", and "**Do not use Form W-8BEN if … you are a foreign entity** … Instead, use Form W-8BEN-E." A proprietorship is not a separate legal person. [OFFICIAL — IRS Instructions for Form W-8BEN (10/2021)](https://www.irs.gov/instructions/iw8ben)
- **Validity:** generally through the last day of the third succeeding calendar year, sometimes indefinitely absent a change in circumstances; notify the withholding agent within **30 days** of any change. Google in practice applies a **3-year refresh**: "The IRS requires Google to refresh its non-US partners' and vendors' tax forms at the earlier of (1) every 3 years or (2) if there has been a change in circumstances." [OFFICIAL — Google Payments Center](https://support.google.com/paymentscenter/answer/10349995?hl=en)
- **⚠️ The single most consequential tax finding: Google classifies AdSense/AdMob income as "Services or other business income", NOT a royalty.** Google's own payments page lists "Services or other business income (**such as AdSense**, but not including AdSense for YouTube)" separately from "Other Copyright Royalties (such as YouTube Partner Program)". [OFFICIAL — Google Payments Center](https://support.google.com/paymentscenter/answer/10349995?hl=en)
  - 👉 That points to the India–US **business profits** article with the **no-permanent-establishment** representation on **line 10 of the W-8BEN** — **not** a 10–15% royalty claim. The IRS instructions confirm: "Persons claiming treaty benefits on business profits or gains that are not attributable to a permanent establishment **must** complete this line … You must also include the relevant treaty article."
  - Supporting point: Google states that unrelated third-party US web hosting, renting US servers from an unrelated third party, or a US PO Box/mail-forwarding address "**do not of themselves constitute US Activities**" — i.e. no US permanent establishment for a solo Indore developer. [OFFICIAL — About US Activities](https://support.google.com/admob/answer/2772627?hl=en)
  - "**only the portion of your revenue earned from US users is subject to US withholding taxes and reporting.**" Without a valid form, default withholding is **30%** (Chapter 3) or **24%** backup withholding. [OFFICIAL](https://support.google.com/paymentscenter/answer/10349995?hl=en)
- ⚠️ **NOT VERIFIED:** the India–US treaty text (Art. 7 business profits; Art. 12 royalties/FTS) was not fetched, so the **exact rate Google applies** to "Services or other business income" is unconfirmed. Read the rate shown in your own Google payments profile (Settings → Manage tax info). For reference, the Embassy of India's DTAA rate table lists Royalty **10%/15%** and Fee for Technical Services **10%/15%**, subject to conditions. [OFFICIAL — Embassy of India](https://www.indianembassyusa.gov.in/taxdata?id=9)

### 12.5 Which entity pays you (and the TDS consequences)
| Payor | Entity | India-relevant note |
|---|---|---|
| AdMob | **Google Asia Pacific Pte. Ltd. (Singapore)** for India-address publishers | No Indian TDS; no Indian GSTIN demanded |
| Google Play (store) | Google (India billing) | **Withholds** Indian TDS u/s 393(1) on Indian-user paid-app/IAP sales; GSTIN required if GST-registered |
| Apple | Apple entity (see ⚠️ below) | Pays India in **INR**, threshold **USD 0.02** |
| AppLovin | **AppLovin Corporation (Delaware, USA)** | W-8BEN required; USD via Tipalti |
| Unity | **Unity Technologies SF (California)** | USD only; W-8BEN |
| InMobi | **InMobi (India/Singapore)** | **GST invoice mandatory** — the one verified India GST demand |
| Adgebra | **Inuxu Media (India)** | **May deduct Indian TDS**; pays INR or USD |
| Pangle | **ByteDance Pte. Ltd. (Singapore)** | Company required; wire/USD only |
| Liftoff | **LMI Inc. (Palo Alto, CA)** | USD; W-8BEN for individuals |
| Chartboost | **LoopMe Ltd (UK)** / Chartboost LLC (DE) | USD/GBP/EUR only; W-8BEN named |
| BidMachine / Moloco | Bidmachine, Inc. (DE) / Moloco (US) | USD; bank transfer |

- ⚠️ **NOT VERIFIED: which Apple legal entity pays Indian developers, and whether any Indian TDS is deducted on Apple proceeds.** This matters materially — it determines whether Apple income arrives net-with-TDS-credit in 26AS or as a gross foreign receipt you must self-tax in full. Apple's legal-entities reference page was not fetched. [Reference](https://developer.apple.com/help/app-store-connect/reference/reporting/apple-legal-entities)
- **Apple pays India in INR with essentially no minimum:** App Store Connect's "Minimum payment threshold" lists **IND / India / INR / USD 0.02** (global default for other countries is USD 40). [OFFICIAL](https://developer.apple.com/help/app-store-connect/reference/reporting/minimum-payment-threshold)
- **Google Play pays India in USD by wire with a US$100 minimum.** [OFFICIAL](https://support.google.com/googleplay/android-developer/answer/2700656?hl=en)
- 👉 **A dual-store developer therefore receives INR from Apple and USD from Google Play** — different FIRC and purpose-code handling for each.
- **Apple's tax forms:** "All developers must complete a **US tax form** to comply with the Paid Apps Agreement"; for non-US developers "the **W-8BEN**, W-8BEN-E, or W-8ECI may be required." Apple's country-specific tax lists cover Australia, Brazil, Canada, Ireland, Mexico, Singapore, South Korea, Taiwan and Thailand — **India is NOT listed**. [OFFICIAL](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/)

### 12.6 FEMA / RBI — receiving the money
- **FIRC:** the AD bank that actually received the remittance must issue the FIRC; it is normally valid for **one year**, and Form 10H is available for income-tax purposes. Get an FIRC or inward-remittance advice for every foreign credit — it is your evidence for the s.2(6)(iv) "convertible foreign exchange" condition. [OFFICIAL-ADJACENT — FEDAI SPL-14/FIRC/2012](https://fedai.org.in/DocumentUploadFiles/SPL-14-FIRC-2012.pdf)
- **⚠️ Purpose codes — the brief's guesses are wrong.** Per RBI's Annexure II list: **P0802 = "Software implementation/consultancy"**, **P1006 = "Business and management consultancy and public relations services"**. The **advertising** code is **P1007 — "Advertising, trade fair, market research and public opinion polling services."** Also **P0803 = database/data processing charges**. [OFFICIAL-ADJACENT — bank PDF reproducing RBI Annexure II](https://www.hsbc.co.in/content/dam/hsbc/in/documents/rbi-purpose-codes-for-forex-transactions.pdf)
  - DGFT's eBRC guidelines add: "**For Services > IT, only these four purpose codes are applicable – P0802, P0803, P0807, and P0103.**" [OFFICIAL — DGFT Self-Certified eBRC Guidelines v1.0, 10 Nov 2023](https://content.dgft.gov.in/Website/Self%20Certified%20eBRC%20Generation%20Guidelines%20v1.0.pdf)
  - 👉 **Ad-network revenue → P1007. App/software sales → P0802/P0803/P0807/P0103.** Getting this wrong mis-reports the receipt.
- **IEC: ⚠️ NOT VERIFIED, sources conflict.** No DGFT notification was found stating IEC is not required for services exports; an ICMAI training PDF actually says "IEC is mandatory for all service exporters in India", while non-official sources say the opposite. The RBI Master Direction mentions IEC only in the goods context and requires **no declaration form for services exports** — consistent with IEC not being needed, but not dispositive. **Verify with your AD bank and CA before buying an IEC.**
- **EEFC account:** "**A person resident in India** may open with an AD Category–I bank in India an account in foreign currency called the **Exchange Earners' Foreign Currency (EEFC) Account**"; it "shall be maintained **only in the form of non-interest bearing current account**"; "**All categories of foreign exchange earners are allowed to credit 100% of their foreign exchange earnings** to their EEFC Accounts." 👉 **Available to an individual sole proprietor.** [OFFICIAL — RBI Master Direction on Export of Goods and Services (updated 17 Jul 2026)](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF)
  - ⚠️ Whether a **savings** account is legally barred (vs. bank policy) for business receipts is **NOT VERIFIED**; in practice banks require a current account for a proprietorship with business receipts.
- **Realisation window: nine months** — "the period of realization and repatriation of export proceeds shall be **nine months** from the date of export for all exporters" (substituted by FEMA 23(R)(7)/2025-RB dated 13 Nov 2025 and further by FEMA 23(R)(8)/2026-RB dated 05 Jun 2026; previously fifteen months). AD banks may extend up to six months at a time. [OFFICIAL — RBI Master Direction](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF)
- **Export of services needs no declaration form**, but the realisation and repatriation obligation still applies: "the exporter **may export such services without furnishing any declaration**, but shall be liable to **realise** the amount of foreign exchange … and to **repatriate** the same to India." [OFFICIAL — RBI Master Direction, Para B.7](https://rbidocs.rbi.org.in/rdocs/notification/PDFs/11MDEGS1205163428383952204B77831A3A086E82FDDF.PDF)
- ⚠️ **Note the GST/FEMA interplay:** Rule 96A(1)(b) keys the LUT discharge to "one year, or the period as allowed under FEMA … whichever is later" — effectively one year — while the FEMA window is nine months.
- **Payoneer / Wise / PayPal: ⚠️ NOT VERIFIED.** RBI publishes an authorised list of Payment Aggregators (Cross-Border), but the page could not be read (it redirected to the RBI homepage). Only non-official reporting suggests Payoneer holds in-principle PA-CB authorisation. **Check RBI's PA/PA-CB list directly**, and confirm the provider can issue an FIRC/FIRA with a purpose code. Remember the nine-month realisation obligation is **yours**, not the platform's.

### 12.7 What an Indore-based solo developer practically needs
1. **PAN** (already required) and a **current account** for business receipts; consider an **EEFC** account to reduce conversion costs.
2. **A developer website** with a root-domain `app-ads.txt` and a real privacy policy — non-negotiable across nearly every network.
3. **A CA decision on 44AD vs 44ADA** — the single biggest tax lever, and unresolved by official guidance.
4. **W-8BEN** (not W-8BEN-E) for every US-paying network; keep **Form 43** TRC handy; refresh the W-8 every **3 years**.
5. **GSTIN + LUT (Form GST RFD-11)** if you go the zero-rated/ITC route — and a **GST invoice or exemption declaration for InMobi**.
6. **Advance tax** (single instalment by 15 March under presumptive taxation), since no TDS will be credited.
7. **FIRC/FIRA for every inward remittance**, with purpose code **P1007** for ad revenue.
8. **Keep store declarations consistent** — Ads declaration, Data safety form, and Apple App Privacy label must match actual SDK behaviour.

### 12.8 Apple vs Google Play payout contrast (important for planning)
| | Apple App Store | Google Play |
|---|---|---|
| Payout currency to India | **INR** | **USD** (wire) |
| Minimum threshold | **USD 0.02 (IND)** | **US$100** |
| Indian TDS | **NOT VERIFIED** | Yes, on Indian-user paid-app/IAP sales (s.393(1)) |
| India-specific tax form list | **India NOT listed** | GSTIN required if GST-registered |

[OFFICIAL — Apple minimum payment threshold](https://developer.apple.com/help/app-store-connect/reference/reporting/minimum-payment-threshold), [OFFICIAL — Apple tax information](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information/), [OFFICIAL — Google Play wire transfer payouts](https://support.google.com/googleplay/android-developer/answer/2700656?hl=en)

---

## 13. SUMMARY TABLE — the 14 networks at a glance

| Network | Signup gating | app-ads.txt | Min payout | India payout | Live app needed? | Formats | Integration |
|---|---|---|---|---|---|---|---|
| **AdMob** | Open; account verification; **per-app readiness review** | **Mandatory for new apps (Jan 2025)**; root domain | **$100** (€70/£60) | **Wire, USD/EUR**; IFSC+SWIFT; **no INR** | No to start / **yes to earn** | Banner, interstitial, native, rewarded, rewarded interstitial, app open | SDK + mediation (bidding + waterfall) |
| **InMobi** | Self-serve; **~24h app approval** | **Mandatory line**; crawler needs **10k bid requests** | **$50 India** / $50 PayPal / $300 wire | **EFT or PayPal**; **GST invoice mandatory** | Yes in practice | Banner, interstitial, rewarded, native | SDK + broad mediation |
| **AppLovin** | Open; **may need account approval**; **individuals 18+ OK** | Strongly recommended; **demand-gating** | **$100** all / **$150 wire** ⚠️ inconsistent | Tipalti; ACH/wire/check/PayPal; **India menu NOT VERIFIED** | **No** | Banner, MREC, interstitial, native, rewarded, app open, playable interstitial | SDK + mediation (bidding + waterfall) |
| **Unity LevelPlay** | Open; **approval needs published apps (2 emails)** | Required; Unity generates lines; **OwnerDomain mandatory** | **$100**, net 60 | Tipalti; **USD ONLY** | Effectively yes | Interstitial, rewarded, banner | SDK + mediation (bidding + hybrid waterfall) |
| **Meta Audience Network** | **Gated** — Business Manager + Property + bundle review + ownership verification | De facto required (`facebook.com`, cert `c3e20eee3f780d68`) | **NOT VERIFIED** (non-official: $100, 2020) | **NOT VERIFIED** | Effectively yes | Banner/MREC, interstitial, native, native banner, rewarded video, rewarded interstitial | **Bidding ONLY** (waterfall gone) |
| **DT Exchange** | **Approval-gated**; "official company email" | **Required**; domain `fyber.com`; no `www.`/`m.` | **NOT PUBLISHED** | **NOT VERIFIED** | **NO** | Banner, MREC, interstitial display/video, rewarded video, rewarded playable, native | SDK + mediation + bidding |
| **Liftoff Monetize** | Open + **email activation** | **Required; ROOT DOMAIN ONLY (`www.` rejected)** | **$50** PayPal/ACH/check; **$1,000** wire/eCheck ⚠️ contract says $1,000 | Tipalti; PayPal $50 or wire $1,000; **INR NOT VERIFIED** | No for setup / **yes for live ads** | Interstitial, rewarded, inline, banner, MREC, native, **app open** | SDK + mediation + bidding |
| **Chartboost** | Free account, but **every app: SDK in live app + live store + 250 DAU × 7–14 days** | Supported; in-platform scanner (post-approval) | **$75** (wire **$300**); LoopMe provider $100 | Wire/ACH; **USD/GBP/EUR only, no INR**; W-8BEN | **YES — STRICTLY** | **Interstitial, rewarded, banner ONLY** | Fixed CPM or in-app bidding |
| **Mintegral** | Signup open; **current terms NOT VERIFIABLE** | Effectively required (Google doc) | **$1,000** (2022 archived) ⚠️ | **NOT VERIFIED** | Historic: no; **current NOT VERIFIED** | Banner, interstitial, native, rewarded | SDK + mediation + bidding |
| **Pangle** | ⚠️ **Company required — individuals/sole proprietors REJECTED** | Highly recommended; `pangleglobal.com` | **$100** | **Wire only, USD only**; company-named account | **YES** | Native, banner, interstitial, rewarded video, app open | SDK + mediation + bidding |
| **Amazon APS** | ⚠️ **Invitation-only**; one-shot review | Required; portal generates | **UAM $5**; TAM per-SSP | A9.com LLC (US); USD/local; **India rails NOT VERIFIED** | Store URLs at application | Banner, interstitial, rewarded (in-app SDK) | SDK + in-app header bidding |
| **BidMachine** | Self-serve; **individuals 18+ OK** | Dashboard-generated | **$1,000**, net 60 | Bank transfer; **currency/rails NOT VERIFIED** | **YES (to be paid)** | Banner, interstitial, rewarded video (+ native per AdMob table) | SDK + bidding adapters (waterfall BETA) |
| **Moloco** | Self-serve form, rep-assisted; **individual or company** | ✅ **NOT REQUIRED** | **NOT PUBLISHED** | **Wire, USD only**; Tipalti/Zip | **NO** | Banner, interstitial, rewarded video | **Bidding only** (waterfall deprecated) |
| **Adgebra** | Self-serve; **GST + PAN + bank**; site approval | **NOT VERIFIED** | **$100** | **INR or USD**; **may deduct TDS** | Site approved first | Web only — **no native in-app SDK** | Web JS tags |
| **Affle / Glance** | ❌ **No publisher side at all** | n/a | n/a | n/a | n/a | n/a | Advertiser-side only |

### 13.1 Practical recommendation for an Indore solo developer
**Start with:** AdMob (open, self-serve, demo ad units, largest demand) + **InMobi** (best India payout terms at $50, EFT/PayPal, India-native). Add **AppLovin MAX** as the mediation layer (individuals explicitly allowed, no live app needed to build). These three are reachable today without a company.

**Only if you have a registered company:** Pangle becomes possible (but India's absence from its supported-regions list must be resolved first).

**Avoid or defer:** **Chartboost** (250 DAU × 7–14 days is unreachable for a new app), **Amazon APS** (invitation-only, one-shot review), **Google Play Families-certified products** if you use AppLovin (AppLovin left the programme), and **Mintegral/DT Exchange** until you obtain written payout terms.

**Do first, before writing any ad code:** buy the developer website + root `app-ads.txt`; write the privacy policy; decide the target-audience declaration; pick test ad units; and get the CA ruling on 44AD vs 44ADA.

---

## 14. NOT VERIFIED REGISTER (do not treat these as facts)

**Networks**
1. AdMob: whether an undocumented quality/traffic bar exists; whether an Indian publisher can be paid in INR (evidence says no).
2. AppLovin: the India-specific payment-method menu, thresholds and fees; the exact non-USD wire threshold; whether Payoneer is available via Tipalti; GST/TDS handling.
3. Unity: the monetisation-specific contracting entity; India payout rails; whether a store URL is mandatory at signup.
4. Meta: minimum payout, India rails, INR support, FX/fees, W-8BEN vs W-8BEN-E, contracting entity, governing law, traffic/entity onboarding bar, current onboarding-pause status, privacy-policy link location — **root cause: the publisher help centre is fully login-gated.**
5. DT Exchange: minimum payout, schedule, India rails, currencies, FX, W-8BEN, KYC/GST, traffic/entity bar, contracting entity, explicit publisher privacy-policy obligation — **root cause: DT publishes no finance/eligibility page; its own docs assistant confirms this.**
6. Liftoff: minimum traffic/install/revenue bar; KYC/GST; exact India payment-method availability; INR payout; Rewarded Interstitial GA status; the $50-vs-$1,000 payout-floor conflict.
7. Chartboost: India support and India-specific rails; whether Local Bank Transfer/Global ACH is offered to Indian publishers; W-8BEN vs W-8BEN-E for Indian companies; the `chartboost.com` app-ads.txt cert ID.
8. Mintegral: **its entire current publisher policy set** (payout threshold, approval criteria, app-ads.txt line, privacy policy, India payments, live-app requirement, contracting entity).
9. Pangle: whether the "Regions Pangle supports" list governs publisher country or traffic country; whether an Indian PAN is accepted as the bank Tax ID; India GST/TDS; any W-8BEN requirement.
10. Amazon APS: mobile payout threshold, India rails, W-8BEN/-E requirement text, the exact generated app-ads.txt line, sole-proprietor eligibility, pre-launch slot creation (all behind `ams.amazon.com` login).
11. BidMachine: payment currency/rails/tax forms for India; whether signup involves human review beyond the activation email.
12. Moloco: minimum payout, FX fees, GST/TDS handling, India contracting entity.
13. Adgebra: app-ads.txt and privacy-policy requirements; existence of any native in-app SDK.
14. IncrementX: payout threshold, currency, rails, app-ads.txt, integration type.
15. AdCounty Media: publisher signup and terms.
16. Whether any publisher program exists at Silverpush, Fork Media, SVG Media, Komli, mCanvas or Pokkt.

**Compliance / policy**
17. The contents of IAB Europe's CMP list and Google's named certified-CMP list (both JS/Cloudflare-gated); Google's UMP CMP-ID; any third-party CMP names.
18. Any specific revenue/eCPM percentage impact of ATT denial — only "eCPM fluctuations" and "ads still serve without IDFA" are documented.
19. Whether Meta, AppLovin and Unity each *require* an IAB CMP (only Google's publisher products confirmed).
20. An App Store Connect field enumerating individual SDK names (Apple's verified mechanism is manifests + signatures + required-reason APIs + the App Privacy label).
21. The exact compliance date of the 2025 COPPA Rule amendments.
22. **AdMob SDK lineage is confusing:** the data-disclosure page says "Google Mobile Ads SDK (**Legacy**) v25.5.0" while other current docs describe a "**Next-Gen**" SDK (`com.google.android.libraries.ads.mobile.sdk`, `setAgeRestrictedTreatment`) vs legacy `play-services-ads` (`setTagForChildDirectedTreatment`). **Resolve this before copying data-disclosure answers or writing tagging code.**
23. Apple's App Review Guidelines revision date (the page shows none); Apple publishes no numeric strike ladder before Developer Program termination.
24. Whether an AdMob ban cascades to AppLovin/Unity/Meta — **no official cross-network blacklist is disclosed anywhere.**

**India tax / regulatory**
25. CBIC-hosted originals for **Notification 10/2017-Integrated Tax** (the sub-Rs-20-lakh services registration exemption) and the **LUT conditions notification** (commonly cited as 37/2017-Integrated Tax) — corroborated only via non-CBIC compilations.
26. Any official CBIC circular expressly confirming that a sub-Rs-20-lakh pure services exporter needs no GSTIN.
27. The **44AD vs 44ADA characterisation** of app development / ad-monetised apps — no official resolution; this is the top item for the CA.
28. The India–US treaty text (Art. 7 business profits; Art. 12 royalties/FTS) and the exact rate Google applies to "Services or other business income".
29. The IGST reverse-charge notification text and any de-minimis exemption for imported services.
30. Whether **IEC** is required for services exports — official and non-official sources conflict.
31. RBI's authorised **PA/PA-CB list** (page redirected to the RBI homepage), so Payoneer/Wise/PayPal India authorisation could not be officially confirmed.
32. Which **Apple legal entity** pays Indian developers and whether any Indian TDS is deducted on Apple proceeds.
33. Whether a **savings account** is legally barred (vs. bank policy) for business/export receipts.
34. Page-visible last-updated dates for several vendor pages (many show only a © year).

---

*Compiled as a research synthesis. Every factual claim carries a source link at the point of assertion; items that could not be confirmed are labelled **NOT VERIFIED** rather than estimated. Not legal, tax, or accounting advice.*

