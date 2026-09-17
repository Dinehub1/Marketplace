# In-App Ad Monetisation Networks — Research Report
### Networks: Meta Audience Network · DT Exchange · Liftoff Monetize · Chartboost by LoopMe
**Perspective:** small Indian developer (Indore, India), Google Play + Apple App Store
**State of research:** 2025–2026. All facts carry a source link. Anything unconfirmed is explicitly marked **NOT VERIFIED**.

> **Source-trust convention used below**
> - **OFFICIAL** = the network's own developer docs / help centre / legal terms.
> - **NON-OFFICIAL** = third-party blog, agency site, aggregator (labelled inline).
> - Meta's publisher help centre (`facebook.com/help/publisher/*`, `facebook.com/business/help/*`) is **login-gated** — every attempt returned a Facebook login wall, so most Meta payout/onboarding specifics could not be confirmed from primary sources. This is flagged throughout.

---

## 1. Meta Audience Network (Facebook Audience Network / Monetization Manager)

### 1.1 Account approval
- **Gated, not open self-serve.** You must create a **Business Manager** account, and a **Property**; "You'll need this to access Monetization Manager, which is the platform you'll use to monetize with Audience Network." — [OFFICIAL: Checklist – mApp](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)
- **App-level review is mandatory:** "Is the bundle ready for monetization? **The bundle has to be reviewed and approved** before the property can perform the monetization." — [OFFICIAL: Checklist – mApp](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)
- **Ownership verification is mandatory:** "Developers **must complete the app ownership verification process** in order to monetize the relevant apps." — [OFFICIAL: Audience Network Policy §Quality and Authenticity](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **Discretionary admission:** "We reserve the right to reject, approve or remove any Publisher or app for any reason, at our sole discretion." — [OFFICIAL: AN Policy](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **app-ads.txt is a pre-onboarding condition:** "**Prior to onboarding**, Publishers that maintain an ads.txt or app-ads.txt file **must include Audience Network listed accurately**." — [OFFICIAL: AN Policy](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **Store restriction:** "Audience Network is **only available to apps offered in Apple iTunes or Google Play**, unless you have our prior written approval." — [OFFICIAL: AN Policy §Implementation Restrictions](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **Content gates that matter for a small dev:** no adult content; apps consisting **primarily of user-generated content** need prior written permission; **real-money gambling** needs prior written permission; apps confusable with Meta are banned; "Content Monetization Policies" apply. — [OFFICIAL: AN Policy §Content Restrictions](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **Quantitative thresholds:** the only published number is a *quality* trigger, not an admission bar: "If your property receives **70k impressions over a 14-day period**, your app automatically enters a **90-day review period** on the quality of ad clicks." — [OFFICIAL: AN Policy Top 5 Best Practices](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy/dos-and-donts)
- **Onboarding paused / invite-only status:** **NOT VERIFIED.** No official Meta page stating a pause, waitlist, or invite-only policy for publisher onboarding could be located in 2025–2026 sources. The docs read as open-but-reviewed.
- **India supported?** **NOT VERIFIED** (help centre login-gated).
- **Indian sole proprietor / unregistered individual allowed?** **NOT VERIFIED.** Meta's Audience Network publisher terms are behind a JS/login wall ([facebook.com/legal/audience_network_terms](https://www.facebook.com/legal/audience_network_terms) returned no readable body; `facebook.com/legal/AN_terms` likewise). Practical read: Business Manager requires a *business* entity structure, which is a friction point for an unregistered sole proprietor, but I cannot cite this.

### 1.2 app-ads.txt
- **De facto required.** Recommended as an industry standard, *and* a stated pre-onboarding precondition (see 1.1). — [OFFICIAL: Identifying Authorized Sellers with app-ads.txt](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/authorized-sellers-app-ads)
- **Ad system domain:** `facebook.com` (Required field). — same source
- **Publisher Account ID:** "Your property ID, Business ID, or app ID". **Relationship:** `DIRECT` or `RESELLER`. **Certificate Authority ID:** `c3e20eee3f780d68`. — same source
- **Generated line format:**
  ```
  facebook.com, <Property ID>, RESELLER, c3e20eee3f780d68
  facebook.com, <Business ID>, RESELLER, c3e20eee3f780d68
  ```
- **Hosting rules:**
  - "Upload the app-ads.txt file to the **root** of your website domain (for example, `https://example.com/app-ads.txt`)." — same source
  - "This is the domain of the URL that you listed in the **app stores**". "In all cases, you **must list your developer website URL in the GooglePlay and iTunes app stores**." — same source
  - `www.` **must be dropped**: "if the developer website is `https://www.website.com/game`, use `https://website.com/apps-ads.txt`" — [OFFICIAL: Troubleshoot app-ads.txt](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/troubleshoot-app-ads)
  - **Only one subdomain** may be used; second-level subdomains rejected. — same source
  - `robots.txt` must not block: add `User-agent: facebookexternalhit/1.1` + `Disallow:`. — same source
  - Crawl/verify takes up to **24 hours**; if the store URL was missing it "can take up to **7 days** for the app listing to be updated." — [OFFICIAL: authorized-sellers-app-ads](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/authorized-sellers-app-ads)
  - Apple note: "the App Support URL is **not** the same as the Developer Website URL." — [OFFICIAL: Troubleshoot app-ads.txt](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/troubleshoot-app-ads)
- **Does it gate demand?** Yes, effectively: verification failure means AN demand can be withheld, and the policy text ties accurate listing to onboarding.

### 1.3 Privacy policy
- **Required.** "**Privacy Notice:** Apps must include a privacy policy that adequately discloses your privacy practices." — [OFFICIAL: AN Policy §Implementation Restrictions](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/an-policy)
- **Where it must be linked:** **NOT VERIFIED** on Meta's developer docs (the store-listing/in-app placement requirement is Google Play / App Store policy, not restated here). The help-centre page that would specify this is login-gated.
- **COPPA:** developers self-determine child-directed status; **primarily child-directed apps may not use the Facebook SDK for Android**, and mixed-audience-without-age-gate apps only serve AN ads to non-US users. — [OFFICIAL: Child-Directed Apps and Services](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/coppa)
- **CCPA/US data-processing options** supported: [Data Processing Options for US Users](https://developers.facebook.com/documentation/audience-network/optimization/best-practices/data-processing-options).

### 1.4 Minimum payout
- **NOT VERIFIED from any official source.** No Meta-owned page with the payout threshold is publicly reachable (login wall).
- **NON-OFFICIAL data point:** a Meta-authorised reseller (飞书互动) guide, republished 2020-06-19, states: AN pays monthly, **around the 21st of the following month**; "all apps' combined monthly revenue must reach at least **US$100** to qualify; if monthly revenue is under $100, the amount rolls into the next month until the $100 minimum is reached." — [NON-OFFICIAL: kchuhai.com](https://www.kchuhai.com/report/view-6289.html) (page dated 2020-06-19)
  - ⚠️ This is **6 years stale and non-official**. Treat the $100 figure as a hypothesis to confirm inside Monetization Manager, not a fact.

### 1.5 Payment methods available in India
- **Official:** only that the Property "has to be linked with your payment account which should contain **proper tax form**." — [OFFICIAL: Checklist – mApp](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)
- **NON-OFFICIAL** (same 2020 reseller guide): AN "requires a bank account or PayPal"; "**Your account must be able to accept USD**"; "Audience Network does not support payment in other currencies." Tax forms: **W-9** (US companies and individuals), **W-8BEN-E** (non-US companies), **W-8BEN** (non-US individuals). — [NON-OFFICIAL: kchuhai.com](https://www.kchuhai.com/report/view-6289.html)
- **INR direct payout:** **NOT VERIFIED** — the only cited source says USD only.
- **FX / fees:** **NOT VERIFIED.**
- **GST / TDS for an Indian publisher:** **NOT VERIFIED** — no Meta-owned page addresses Indian GST/TDS for AN publishers. **Contracting entity location:** **NOT VERIFIED** (terms page unreachable).

### 1.6 Live published app required?
- **Effectively yes for monetisation.** "This assumes that you already have a **published app** that you want to add Audience Network to as a mediation partner." — [OFFICIAL: Audience Network Overview / Quick start](https://developers.facebook.com/documentation/audience-network/how-to-use-this-site)
- The bundle must pass review before the property can monetize (see 1.1).
- **Pre-launch testing is supported:** you obtain Placement IDs from Monetization Manager, then test — allow-list the device in Monetization Manager ("Is device allow listed for testing from Monetization Manager?"), use override-enable test mode, and the Onboarding/Bid Token debuggers. — [OFFICIAL: Checklist – mApp](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp), [Test Your Setup](https://developers.facebook.com/documentation/audience-network/setting-up/testing)
- Flow ends with: "Publish an update to your app with Audience Network in production. Make sure both your app Audience Network code and your app ads are **not in test mode**." — [OFFICIAL: Audience Network Overview](https://developers.facebook.com/documentation/audience-network/how-to-use-this-site)
- **Store URL at signup:** **NOT VERIFIED** directly, but the app must exist in iTunes/Google Play and the store listing must carry the developer website (see 1.2).
- **Note:** ads are only shown to users with Facebook profiles logged in within 30 days — "it might be because people who are visiting your platform aren't logged into Facebook or don't have tracking enabled." — [OFFICIAL: Checklist – mApp](https://developers.facebook.com/documentation/audience-network/support/checklists/mapp)

### 1.7 Ad formats supported
| Format | Supported | Source |
|---|---|---|
| Banner / Medium Rectangle | ✅ | [Ad Formats](https://developers.facebook.com/documentation/audience-network/ad-formats), [Ad Setup](https://developers.facebook.com/documentation/audience-network/setting-up/ad-setup) |
| Interstitial | ✅ | same |
| Native | ✅ (not on Unity) | same |
| Native Banner | ✅ (not on Unity) | same |
| Rewarded Video | ✅ | same |
| Rewarded Interstitial | ✅ | same |
| App Open | ❌ not documented | — |
| Playable (as publisher format) | ❌ not documented | — |

- **Integration type: BIDDING ONLY.** "**Audience Network is now bidding only.** Audience Network is now only using bidding to fill ads in iOS and Android apps. You'll need to move your apps from waterfall to bidding to monetize with Audience Network." — [OFFICIAL: Bidding Overview](https://developers.facebook.com/documentation/audience-network/bidding/overview) (originally announced for iOS in 2021 via the AN blog)
- **Partner mediation integrations:** Google Ad Manager, AdMob, Admost, Appodeal, Chartboost, CloudX, Fyber (now DT Exchange), Unity LevelPlay, MAX, TopOn, TradPlus, Nimbus. — [OFFICIAL: Bidding with Partner Mediation](https://developers.facebook.com/documentation/audience-network/bidding/partner-mediation)
- **In-house mediation:** "is in **closed beta** and not yet publicly available." — [OFFICIAL: Audience Network Overview](https://developers.facebook.com/documentation/audience-network/how-to-use-this-site)

### 1.8 Meta — explicit gaps (NOT VERIFIED)
- Minimum traffic / installs / revenue for approval.
- India being a supported publisher/payout country.
- Whether an Indian unregistered sole proprietor can contract.
- Minimum payout threshold (**believed $100, non-official, 2020**).
- Payment methods reachable from India, FX, INR support.
- W-8BEN vs W-8BEN-E requirement (non-official says W-8BEN for non-US individuals).
- Contracting entity + governing law.
- Exact privacy-policy linking location.
- Any current onboarding pause/waitlist.

---

## 2. DT Exchange (Digital Turbine Exchange, formerly Fyber)

> ⚠️ **Critical disambiguation.** `help.dtxplatform.com` / `dtxplatform.com` ("DTXplatform", min payout $50, pays via PayPal/Wire/eCheck/Paxum/Webmoney) is **NOT** Digital Turbine's DT Exchange. It is a separate GitBook org (`6c5mQQHu4dCTP6mVZdl2`) publishing a "self-service" network with RU-style payment rails. Digital Turbine's own docs live at `docs.digitalturbine.com` (GitBook org `8KSLu5HNiyDWpvGRZh7B` / `LbREhkP3WlLtP6TNVZ2Q`) and the console is `console.fyber.com`. **Do not cite the DTXplatform $50 figure as DT Exchange.** — [DTXplatform article (unrelated network)](https://help.dtxplatform.com/publishers-help-center/what-are-dtxplatform-payout-frequency-and-thresholds) vs [DT Exchange docs](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange)

### 2.1 Account approval
- **Approval-gated.** "A DT Console account allows you to access DT products. **Once the DT Team approves and activates your account**, you can sign in to the DT Console." — [OFFICIAL: Signing Up for DT Console](https://docs.digitalturbine.com/dt-console/authorization/signing-up-for-dt-console)
- Signup is a self-serve form at [console.fyber.com/sign-up](https://console.fyber.com/sign-up), but you must "**Use an official company email address**". — same source
- **Product families:** DT Exchange (programmatic exchange), DT FairBid (mediation), DT Offer Wall. — [OFFICIAL: DT docs index](https://docs.digitalturbine.com/llms.txt)
- **App count / install volume / prior revenue / KYC / GST requirements:** **NOT FOUND** in the public docs. **NOT VERIFIED.**
- **Minimum traffic requirement:** **NOT FOUND. NOT VERIFIED.**
- **India supported?** **NOT VERIFIED** (no country list published).
- **Indian sole proprietor / individual allowed?** **NOT VERIFIED.** The only signal is the instruction to use an "official company email address", which hints at business-entity preference but is not a rule.
- Note: DT Exchange is a NASDAQ-listed-company product (Digital Turbine, Inc.), which is relevant for counterparty risk vs. smaller networks — but the contracting entity is **NOT VERIFIED** from the docs.

### 2.2 app-ads.txt
- **Required for fraud prevention / to authorise DT as a direct seller.** — [OFFICIAL: app-ads.txt](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/advanced-configurations/app-ads.txt)
- **Generated line (ad system domain is `fyber.com`, not digitalturbine.com):**
  ```
  fyber.com,YOUR_DT_PUBLISHER_ID,DIRECT,1ad675c9de6b5176
  ```
  Certificate Authority ID: `1ad675c9de6b5176`. — same source
- **You must also add DT's official resellers.** Full official list: [https://www.digitalturbine.com/dt-app-ads.txt](https://www.digitalturbine.com/dt-app-ads.txt). — same source
- **Where to find your DT Publisher ID:** DT Console → click username top-left → **User Profile** → "Basic Reporting API – Credentials" → copy **Publisher ID**. — same source
- **Hosting rules:**
  - "Either the **root** of your domain (`fungames.com/app-ads.txt`) or **no more than one subdomain below the root** (`my.fungames.com/app-ads.txt`)."
  - "If you place the file in a subdomain, **do not place it in either the `www.` or `m.` subdomains**." — same source
- **Developer website URL required in all app stores:**
  - **Apple App Store:** set the **Marketing URL** field in App Store Connect. — same source
  - **Google Play:** **Store presence → Store settings**, "Visit website" link. — same source
- **Anti-fraud warning:** "Beware of unknown companies reaching out directly and requesting to be added to your `app-ads.txt` file. This may be fraud." — same source

### 2.3 Privacy policy
- DT publishes a full **Privacy and Compliance** doc set: GDPR, COPPA, LGPD, GPP, **TCF 2.3**, Apple App Privacy Details, Google Data Safety Form, Vietnam's Amended Law on Advertising. — [OFFICIAL: Privacy and Compliance](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/privacy)
- **Is a publisher privacy policy explicitly required by DT, and where must it be linked?** **NOT VERIFIED** — the compliance pages I retrieved enumerate regulatory regimes and SDK consent flags, but I did not find an explicit "publisher must host/link a privacy policy at X" clause. Section index: [GDPR](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/privacy/gdpr), [COPPA](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/privacy/coppa).
- Practical note: DT's TCF 2.3 and Google Data Safety pages imply the publisher must make accurate store data-safety disclosures, which presupposes a privacy policy, but that is inference not citation.

### 2.4 Minimum payout
- **NOT PUBLISHED.** DT's own GitBook assistant, queried directly, answered: "I cannot find information about the **minimum payout threshold**, available payment methods, supported payout currencies, payout schedule, supported countries, whether India is supported, or whether a W-8BEN/tax form is required in the docs I can access… you'll need to confirm with your Account Manager." — [OFFICIAL: DT docs (GitBook `?ask=` response on Managing Payouts)](https://docs.digitalturbine.com/dt-console/finance/managing-payouts-in-the-dt-console)
- What *is* documented: DT Console → **Finance** → **Payment Details** (personal + banking info), **Invoices** (itemized revenue-share statements per billing cycle), **Payment History** (completed payments with exact dates). — [OFFICIAL: Managing Payouts in the DT Console](https://docs.digitalturbine.com/dt-console/finance/managing-payouts-in-the-dt-console)
- **Minimum payout threshold: NOT VERIFIED. Payout schedule: NOT VERIFIED.**

### 2.5 Payment methods available in India
- **NOT VERIFIED.** No DT-owned page lists payment rails, currencies, or country eligibility. The console exposes a "Payment Details" banking form, implying bank transfer/wire at minimum.
- **W-8BEN / tax forms:** **NOT VERIFIED.**
- **INR support / FX fees:** **NOT VERIFIED.**
- **GST/TDS:** **NOT VERIFIED.** Contracting entity: **NOT VERIFIED.**

### 2.6 Live published app required?
- **No — you can integrate and set up before launch.** "The DT Console allows you to **add your app whether or not it is published in an app store**." — [OFFICIAL: Setting Up Your App in the DT Console](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/setting-up-your-app-in-the-dt-console)
- When adding an app you can either search the Google Play / Apple App Store by name, **or** tick "**My app is not available in app stores**" and enter name, platform, store URL, bundle ID and category manually. Note: "If your app is available for both iOS and Android, you must add an app for each platform separately." — [OFFICIAL: Adding an App](https://docs.digitalturbine.com/dt-console/app-management/adding-a-new-app/adding-an-app)
- **Test devices supported pre-launch:** [Setting Up Test Devices](https://docs.digitalturbine.com/dt-console/app-management/setting-up-an-existing-app/setting-up-test-devices).
- **Store URL required at signup?** No — the store URL is required only if you add the app from a store; manual entry is supported (though a live app is still needed for real demand).

### 2.7 Ad formats supported
**SDK ad formats** — [OFFICIAL: Android Ad Formats](https://docs.digitalturbine.com/dt-exchange/sdk-configuration/integrating-the-android-sdk/android-ad-formats):
- Banner/MREC ✅, Interstitial ✅, Rewarded ✅, Native ✅

**Detailed specs** — [OFFICIAL: Ad Types and Specification](https://docs.digitalturbine.com/dt-exchange/additional-resources/ad-types-and-specification):
| Format | Spec highlights |
|---|---|
| Banner | 320x50; 728x90 for tablets; HTML/MRAID 2.0; In-View |
| MREC | 300x250; In-View |
| Interstitial Display | Full screen; Close/Back after **5s**; HTML/MRAID 2.0 + VAST 2.0 |
| Interstitial Video | 15–30s; **skippable after 5s if ≥16s**; end card + Close after 3s |
| Rewarded Video | Full screen; **max 30s**; **no skip**; end card + Close after 3s |
| Rewarded Playable | Full screen; max 30s; fail-safe Close at 30s |

- **App Open:** ❌ not documented. **Plain (non-rewarded) playable:** the demand-side creative list includes [Playables](https://docs.digitalturbine.com/dt-ads-demand/ad-creative-types/playables) and [Rewarded Playables](https://docs.digitalturbine.com/dt-ads-demand/ad-creative-types/rewarded-playables).
- **Integration types:** direct SDK ([Android](https://docs.digitalturbine.com/dt-exchange/sdk-configuration/integrating-the-android-sdk) / [iOS](https://docs.digitalturbine.com/dt-exchange/sdk-configuration/integrating-the-ios-sdk)), **mediation** (DT FairBid, plus [Mediating DT Exchange](https://docs.digitalturbine.com/dt-exchange/mediating-dt-exchange) via AdMob/GAM/MAX/LevelPlay/etc.), and **SDK bidding / in-app bidding** — [SDK Bidding Process](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/sdk-bidding-process), [SDK Bidding Guidelines](https://docs.digitalturbine.com/dt-exchange/getting-started-with-dt-exchange/sdk-bidding-process/sdk-bidding-guidelines). Also **Dynamic Floor Pricing** (developer preview).

### 2.8 DT Exchange — explicit gaps (NOT VERIFIED)
- Minimum traffic / app count / install / revenue bar for approval.
- India supported; sole-proprietor eligibility; KYC/GST docs.
- Minimum payout threshold and payout schedule.
- Payment methods from India, currencies, FX fees, INR support.
- W-8BEN / W-8BEN-E requirement.
- Contracting entity and governing law.
- Explicit publisher privacy-policy obligation and its placement.

---

## 3. Liftoff Monetize (formerly Vungle)

> **Branding note:** `liftoff.io/publishers/` now 301-redirects to **liftoff.ai**. Publisher suite = **Liftoff Monetize**; advertiser suite = **Liftoff Direct**; SDK = **Vungle SDK**; demand side = **Vungle Exchange**. Site footer reads "© 2026 Liftoff, Inc." Help centre remains at `support.vungle.com`. — [OFFICIAL: liftoff.ai](https://liftoff.ai/), [Start Monetizing With Liftoff](https://support.vungle.com/hc/en-us/articles/203610124-Start-Monetizing-With-Liftoff) (updated 2026-05-08)

### 3.1 Account approval
- **Open self-serve signup.** "Start with **creating an account**!" → [app.vungle.com/signup](https://app.vungle.com/signup/). No invite/referral gate documented. — [OFFICIAL: Start Monetizing With Liftoff](https://support.vungle.com/hc/en-us/articles/203610124-Start-Monetizing-With-Liftoff)
- **Email activation required:** the Publisher Management API returns `{"messages":["Account not activated."],"code":403001}` — "You must **activate your Liftoff Monetize account** first. Check your email inbox for the activation email." — [OFFICIAL: Publisher Management API 1.3](https://support.vungle.com/hc/en-us/articles/360041251552)
- **Minimum traffic / install volume / prior revenue:** **NOT FOUND** in any official Liftoff/Vungle article. **NOT VERIFIED.**
- **KYC / GST:** **NOT FOUND. NOT VERIFIED.**
- **Business entity:** the publisher agreement is drafted to permit **individuals** — "you and any company, entity, or organization on behalf of which you are accepting this Agreement ('Developer')"; and the payment/tax guidance explicitly says "**Most non-US individuals fill out the W8-BEN**". An Indian sole proprietor operating as an individual therefore appears permissible. — [OFFICIAL: Monetize SDK License and Publisher Terms (LMI Inc.)](https://publisher.vungle.com/LICENSE.html), [Getting Paid](https://support.vungle.com/hc/en-us/articles/203813080-Getting-Paid-Everything-You-Need-to-Know)
- **India:** India is present in the country/geo code table used by the Publisher Management API (`99 India IN`), i.e. India is a recognised market for geo targeting — but this does **not** confirm payout availability. — [OFFICIAL: Publisher Management API 1.3](https://support.vungle.com/hc/en-us/articles/360041251552)
- **Feature gating for small accounts:** "Flat CPM is only available for **select publisher accounts**; contact your account manager to activate." "In-App Bidding is only available for **select publisher accounts**; contact your account manager to use in-app bidding." — [OFFICIAL: Publisher Management API 1.3](https://support.vungle.com/hc/en-us/articles/360041251552)
- (Advertiser-side, not publisher-side: Playables and Adaptive Creative Playable assets are "only available to **pre-approved advertisers**". — [OFFICIAL: Approval Process for Creatives and Playable Assets](https://support.vungle.com/hc/en-us/articles/360035210552))

### 3.2 app-ads.txt
- **Required in practice, and now verified at app-registration time.**
- **New-app validation is mandatory:** "We've introduced an **additional validation step for all new publisher apps — app-ads.txt verification**. This ensures every publisher correctly configures their app-ads.txt file before launching new apps. The validation helps prevent unauthorized developers from impersonating legitimate publishers and monetizing unqualified traffic." — [OFFICIAL: Publisher Applications – Setting Up and FAQ](https://support.vungle.com/hc/en-us/articles/210985478) (updated 2025-12-22)
- **Failure modes quoted verbatim:** "No domain found for the provided Store ID. Please add your domain information to the app store." / "Please add the following line to the app-ads.txt file on any one of your domains… to pass validation" (domain exists but file missing or missing the seller line). Store website changes take **24 hours** to propagate. — same source
- **Root domain ONLY — `www.` is rejected:**
  - "**Root domain is required. `www` subdomains are NOT accepted.**"
  - "Liftoff **ONLY** accepts `app-ads.txt` hosted on the **ROOT DOMAIN**. Any subdomain — including `www` — will fail validation."
  - Rejected: `www.example.com/app-ads.txt`, `ads.example.com/app-ads.txt`, `m.example.com/app-ads.txt`. Accepted: `example.com/app-ads.txt`. — same source
- **Generated seller line:**
  ```
  vungle.com, <YOUR_VUNGLE_PUBLISHER_ACCOUNT_ID>, DIRECT, c107d686becd2d77
  ```
  Certificate Authority ID: `c107d686becd2d77`. Publisher Account ID = "Seller ID", shown top-right of the Liftoff Monetize Dashboard. — [OFFICIAL: app-ads.txt](https://support.vungle.com/hc/en-us/articles/360055891252-app-ads-txt) (updated 2025-11-19)
- **Official downloadable line list:** [https://publisher.vungle.com/vungleAdsTxt](https://publisher.vungle.com/vungleAdsTxt) — "Liftoff sends **monthly email updates** with any missing or new entries." — same source
- **Recommended `OWNERDOMAIN` line** at the top of the file: `OWNERDOMAIN=yourstudio.com`. — same source
- **Developer website must be set in two places:** (1) the app store listings (Google Play + App Store, one canonical root domain), and (2) the **Developer website** field in the Liftoff Monetize Dashboard, matching that same root domain. — same source
- **One domain per Seller ID:** "The IAB Sellers.json specification allows **only one domain per Seller ID** (Liftoff account). A Seller ID cannot validly represent more than one entity." — same source
- **Does it gate demand?** Yes: "Publishers who adopt app-ads.txt are likely to earn more revenue, as **many brand buyers and advertisers require publishers to have a valid app-ads.txt file and will not buy inventory on apps without one**." — same source

### 3.3 Privacy policy
- **Required, with prescribed content.** From the publisher agreement, "Compliance with Privacy Laws": the Developer agrees "to **conspicuously post a privacy notice** that accurately describes the Developer's and third parties' collection, use, processing, and disclosure of end user data from the Developer Apps," which must include disclosure "(i) that **third parties, including Liftoff, may collect or receive information and use that information to provide measurement services and targeted ads**, and (ii) **how and where users can opt-out** of collection and use of information for ad targeting." — [OFFICIAL: Monetize SDK License and Publisher Terms](https://publisher.vungle.com/LICENSE.html)
- **Where linked:** the agreement requires a "conspicuous" notice but does not name store listing vs. website vs. in-app. The Liftoff Privacy Notice itself is referenced at `liftoff.io/privacy-policy/`. — same source
- **COPPA:** Developer must tell Liftoff whether the app is "directed to children" and set the dashboard COPPA flag; app-level dashboard setting can be overridden per-user by the SDK COPPA API. — same source + [Integrate Vungle SDK (COPPA section)](https://support.vungle.com/hc/en-us/articles/360002922871)
- **EEA/UK:** the **Monetize Data Privacy Addendum (DPA)** at [liftoff.io/monetize-dpa](https://liftoff.io/monetize-dpa/) is incorporated by reference and governs on conflict. — [OFFICIAL: Terms](https://publisher.vungle.com/LICENSE.html)
- **CCPA** consent status is opted-in by default unless `setCCPAStatus(false)`. — [OFFICIAL: Integrate Vungle SDK](https://support.vungle.com/hc/en-us/articles/360002922871)

### 3.4 Minimum payout
**Official, from "Getting Paid: Everything You Need to Know" (updated 2025-05-22)** — [OFFICIAL: support.vungle.com article 203813080](https://support.vungle.com/hc/en-us/articles/203813080-Getting-Paid-Everything-You-Need-to-Know)

| Method | Min. to initiate | Fixed fee | % fee | Max fee / txn |
|---|---|---|---|---|
| **PayPal** (US) | USD **$50** | $1.00 | 2% | **$2.00** |
| **PayPal** (International) | USD **$50** | $1.00 | 2% | **$21.00** |
| **ACH** (US residents only) | USD **$50** | $0.75 | 0% | No maximum |
| **Wire Transfer** (US) | USD **$1,000** | $15.00 | 0% | No maximum |
| **Wire Transfer** (International) | USD **$1,000** | $18.00 | **2.5% FX conversion** | No maximum |
| **eCheck** | USD **$1,000** | $5.00 | **2.5% FX conversion** | No maximum |
| **Check** (US-based publishers only, USD only) | USD **$50** | None | 0% | No maximum |

- **Conflicting floor in the contract:** the publisher agreement states "Liftoff may **withhold payment until the following month for Developer Fee amounts less than $1,000.00 U.S Dollars**." — [OFFICIAL: Terms](https://publisher.vungle.com/LICENSE.html). ⚠️ This is inconsistent with the $50 PayPal/eCheck thresholds in the help article. **Treat the effective floor as requiring confirmation from your account manager.** Flagged as an official-source conflict.
- **Configurable threshold:** the dashboard lets you "specify a **Payment Threshold** to control the minimum payment total before we issue a payment." — [OFFICIAL: Getting Paid](https://support.vungle.com/hc/en-us/articles/203813080-Getting-Paid-Everything-You-Need-to-Know)
- **Schedule:** "By default, we pay out to our publishing clients on a **Net 60** schedule, and conduct **monthly** revenue payouts at the very end of the month. For instance, revenue for the month of January is calculated on January 31 and, by default, the Publisher is paid at the end of March." Options: **Net 60** (default) or **Hold Payment**. — same source
- Contract also states payment "sixty (60) days' after the completion of the month in which such Liftoff Ads are served". — [OFFICIAL: Terms](https://publisher.vungle.com/LICENSE.html)

### 3.5 Payment methods available in India
- **Portal:** "Liftoff partners with **Tipalti** to manage payments to our Publishers… We currently use Tipalti to process four types of payment methods: **PayPal, ACH, Wire Transfer, and eCheck**. In addition, Liftoff can pay Publishers by regular check, which we process in-house." — [OFFICIAL: Getting Paid](https://support.vungle.com/hc/en-us/articles/203813080-Getting-Paid-Everything-You-Need-to-Know)
- **Country-dependent availability, exact India list NOT VERIFIED:** "**We offer different payment methods, depending on your country.**" — same source. The article does not publish a per-country matrix.
  - Reasoned read (inference, not citation): **PayPal** (min $50) and **international Wire Transfer** (min $1,000, $18 + 2.5% FX) are the likely routes for an Indian publisher; **ACH and Check are explicitly US-only**.
- **INR vs USD:** the fee table is denominated entirely in USD and describes currency-conversion surcharges rather than an INR payout rail. **Whether Liftoff pays directly in INR is NOT VERIFIED.** — same source
- **Tax forms (official):**
  - "Most US residents fill out the **W9** form."
  - "Most **non-US individuals** fill out the **W8-BEN**."
  - "Most **non-US entities** fill out the **W8-Ben-E**."
  - A **Tax Form Questionnaire** is embedded in the dashboard payment screen. — same source
- **Taxes in the contract:** "Each party will be responsible… for identifying and paying all taxes… imposed on that party." The Developer "may charge and Liftoff will pay applicable national, state or local sales or use taxes or value added taxes… provided that such Taxes are stated on the original invoice… and meet the requirements for a valid tax invoice." However, "**Liftoff maintains the right… to deduct or withhold any applicable taxes that Liftoff may be legally obligated to deduct or withhold** from amounts due," and the reduced amount "will constitute full payment." — [OFFICIAL: Terms](https://publisher.vungle.com/LICENSE.html)
- **GST/TDS for an Indian publisher:** **NOT VERIFIED** — Liftoff's terms are generic (VAT / withholding), with no India-specific GST or TDS guidance.
- **Contracting entity (official):** **LMI Inc.**, described as "a **Liftoff Mobile, Inc.** company", **555 Bryant Street, Palo Alto CA 94301**, USA. Contact `support@liftoff.io`. — [OFFICIAL: Terms](https://publisher.vungle.com/LICENSE.html)
- **Governing law / jurisdiction:** laws of the **State of California, USA**, without regard to conflict of laws; **exclusive jurisdiction and venue in the federal and state courts sitting in San Mateo County, California**. — same source
- **Fees borne by publisher:** "Developer shall be **responsible for any bank, transfer or transaction fees** (e.g., PayPal)." Unclaimed payments are forfeited after **1 year**. — same source
- **Revenue share:** "a percentage of the **Net Revenue** (the 'Developer Fee'), **as determined by Liftoff**." Net Revenue = gross collected from advertisers less (i) advertiser refunds, (ii) **a deduction of up to 10%** for advertiser discounts, payment transaction fees, telecom, data centre and other serving costs, (iii) amounts payable to targeting/reporting/verification/data providers, and (iv) Invalid Impressions/violations. — same source

### 3.6 Live published app required?
- **No for setup; yes for real ads.** You can register an app that is not yet live: when adding an app, "Select the CheckBox depending on whether your app is live in the App Store or not. If your app is live, enter your app's URL in 'Connect Your Live App'… **If your app isn't live yet, you can connect your app after it is live** in the App Store or Google Play." — [OFFICIAL: Add and Edit Your App in the Dashboard](https://support.vungle.com/hc/en-us/articles/115000493152) (updated 2025-10-22)
- **But:** "**If your app is not live on Apple Store or Google Play, you will not be able to use live ads for integration testing. You will only be able to use test ads for integration testing.**" — same source
- **App status values:** **Active** ("Only for the lived on Apple Store/Google Play"), **Test Mode**, **Inactive**. — same source
- **Test ads:** "There is no API to get a test ad on SDK side. You can **enable Test mode or test devices on our dashboard**." In test mode, "**Interstitial and Rewarded placement types are only supported.**" — [OFFICIAL: SDK Integration FAQ](https://support.vungle.com/hc/en-us/articles/43640580780315), [Test Mode for Liftoff In-App Bidding](https://support.vungle.com/hc/en-us/articles/360056978331)
- **Store URL at signup:** needed to *connect* a live app (full store URL, or Amazon ASIN). A newly published app may not be found for a few days ("wait a few days and then trying again"); up to 10 days for Amazon. — [OFFICIAL: Why isn't my app found…](https://support.vungle.com/hc/en-us/articles/41580520930331)

### 3.7 Ad formats supported
- **Documented publisher formats:** **Interstitial**, **Rewarded**, **Inline**, **Banner**, **MREC**, **Native**, **App Open**. — [OFFICIAL: Integrate Vungle SDK for Android or Amazon §Step 4](https://support.vungle.com/hc/en-us/articles/360002922871) (updated 2026-08-27), [iOS integration](https://support.vungle.com/hc/en-us/articles/14128414365851)
- **Rewarded Interstitial:** introduced as v6.12.0 "closed beta" (Aug 2022); no later GA confirmation found. **NOT VERIFIED as generally available.**
- **Playable:** not a publisher format — Playables are an **advertiser creative category** available to pre-approved advertisers. — [OFFICIAL: Creative Asset Requirements](https://support.vungle.com/hc/en-us/articles/360057064312)
- **Legend/Retired formats:** Flex View and Flex Feed **removed** in SDK v6.8.0 (Sept 2020). — [OFFICIAL: Android SDK changelog](https://support.vungle.com/hc/en-us/articles/15722228922395)
- **Integration type:** SDK ([Maven Central](https://central.sonatype.com/artifact/com.vungle/vungle-ads) / CocoaPods / manual), **mediation** (MAX, DT FairBid, AdMob/Google, Unity LevelPlay, ironSource, and more), and **in-app bidding** for interstitial/rewarded/banner/MREC. In SDK v7.0.0 (Aug 2023): "In addition to waterfall, we added support for **real-time ads (without caching) for in-app bidding**." — [OFFICIAL: Android SDK changelog](https://support.vungle.com/hc/en-us/articles/15722228922395), [Liftoff In-App Bidding with MAX](https://support.vungle.com/hc/en-us/articles/360053229212), [with Digital Turbine](https://support.vungle.com/hc/en-us/articles/6589335285019)
- **Alternative IDs for premium demand:** integrating RampID/UID2.0/EUID via GAM, Xandr or Nimbus (and notifying `monetize@liftoff.io`) unlocks premium brand demand. — [OFFICIAL: Advanced Settings](https://support.vungle.com/hc/en-us/articles/360047780372)

### 3.8 Liftoff — explicit gaps (NOT VERIFIED)
- Minimum traffic / install / revenue bar for account approval.
- KYC/GST documentation requirements; India-specific onboarding.
- Exact payment methods offered for an Indian-registered account.
- Whether payout can be made in INR.
- India GST / TDS treatment, and whether Liftoff issues an Indian tax invoice.
- Reward Interstitial GA status.
- Resolution of the $50 (help centre) vs $1,000 (contract) payout-floor conflict.

---

## 4. Chartboost (by LoopMe)

> **Status: still operating as a publisher monetisation platform — not sunset.** LoopMe Ltd (UK) is the contracting entity; **Chartboost LLC** (Delaware) is a LoopMe affiliate and a designated "Platform Provider". Publisher Terms were **last updated 19 November 2025**; the publisher SDK is at **v9.14.1**; a full publisher docs site and self-serve signup remain live. LoopMe's own site lists Chartboost as a product ("Chartboost Direct"), and LoopMe is also listed as a **third-party demand partner inside Liftoff Monetize** — i.e. Chartboost inventory is sold through LoopMe's exchange. — [OFFICIAL: Publisher Terms & Conditions](https://docs.chartboost.com/en/legal/terms-conditions/), [Chartboost Get Started](https://docs.chartboost.com/en/monetization/get-started/), [loopme.ai](https://loopme.ai/), [Liftoff third-party demand partner list](https://support.vungle.com/hc/en-us/articles/25816828422683-Third-Party-Demand-Partners)

### 4.1 Account approval
- **Account creation is free and self-serve:** "Sign up for a **free Chartboost platform account**" at [platform.chartboost.com/signup](https://platform.chartboost.com/signup). No invite gate. — [OFFICIAL: Get Started with Chartboost Monetization](https://docs.chartboost.com/en/monetization/get-started/)
- **But every app is approval-gated:** "**Chartboost is dedicated to ensuring the high quality of our supply. Therefore, all publisher apps are required to pass review before running publishing campaigns with Chartboost.**" — [OFFICIAL: Publisher App Review](https://docs.chartboost.com/en/monetization/publishing/publisher-app-review/)
- **Hard app requirements (the key one for a small dev):**
  1. "The **Chartboost SDK must be present in the live version** of the application."
  2. "Your applications **must be live in the official App Store**."
  3. "**Each individual app requires a minimum of 250 Daily Active Users (DAU) constantly for 7–14 days** in order to join the Chartboost publishing network. The metric for DAU is 'Uniques' on the Chartboost dashboard under **Monetization > Analytics**." — same source
- While under review, "**no ads will be served to the app unless test mode is explicitly turned on**." Review takes "**up to 3 business days**" and live apps with the SDK are auto-submitted. — same source
- Rejections: SDK integration issue, app not downloadable (Google Play/Amazon apps must be downloadable in the **US or the Netherlands**, otherwise provide an APK), quality standards, or breach of Terms. You have **14 days** to fix and request re-review (`app.review@chartboost.com`). — same source
- **Business entity / sole proprietor — explicitly permitted:** "The Services are available only to **(a) individuals aged 18 or older**, and **(b) entities that are properly licensed and legally permitted to do business**. You represent and warrant that You meet such criteria." → an Indian individual developer (sole proprietor, 18+) is permitted by the Terms. — [OFFICIAL: Publisher Terms §2](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Additional accounts need pre-approval:** "to the extent You create a new account, it **must be pre-approved by LoopMe** and registered to You under the same entity or name as Your other account(s); if not pre-approved or registered, **You automatically waive any right to payments**." — same source
- **COPPA restriction (important):** "**You shall not use or permit the use of: (A) games or applications directed to End Users under 13 in Your Supply Inventory.**" Chartboost/LoopMe will not accept child-directed apps on the publisher side. — [OFFICIAL: Publisher Terms §14.c.ii](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Content bans:** extensive Prohibited Content list (hate, porn, violence, illegal activity, etc.), and misrepresenting app ownership is grounds for a permanent ban. — same source §1, §4.g.ii
- **India supported?** **NOT VERIFIED** — no country list is published. The only geography-specific rule found is the **US/Netherlands** requirement for Google Play/Amazon app review downloadability.
- **KYC / GST requirements:** **NOT FOUND. NOT VERIFIED.**

### 4.2 app-ads.txt
- **Supported and actively verified in-platform.** "Maintaining an app-ads.txt file is a **critical component to both maximizing ad revenue from programmatic buyers** and protecting against unauthorized selling of in-app inventory and app spoofing." — [OFFICIAL: app-ads.txt](https://docs.chartboost.com/en/monetization/publishing/app-ads-txt/)
- **Chartboost App-ads.txt Verifier:** Monetization → Tools → **App-ads.txt** → **SCAN ALL APPS**; per-app status and a details page listing found/missing lines; **COPY ALL** / **COPY MISSING ONLY** buttons generate the exact lines to paste. — same source
- **Eligibility for scanning requires all three:** "Have successfully integrated the Chartboost SDK" + "Are live on their respective app store" + "**Have been approved for publishing**." → i.e. app-ads.txt verification is a *post-approval* tool, not a pre-signup gate. — same source
- **Generated line (first, account-specific):**
  ```
  chartboost.com,<publisher id>,DIRECT
  ```
  plus a set of additional required lines (identical across all Chartboost accounts). "You need to add a `chartboost.com,<publisher id>,DIRECT` line for **each account** you monetize apps with." — same source
- **Certificate Authority ID for `chartboost.com`: NOT VERIFIED** (not published on that page).
- **Developer URL rules:**
  - "Developer URLs **must** be hosted on domains/subdomains **managed by the publisher**. Examples of *invalid domains* include **Facebook/Twitter links, GitHub pages, YouTube channels**, etc."
  - Nuance from the FAQ: `https://user123.github.io/home` yields `user123.github.io/app-ads.txt` which is **valid** (you control the subdomain), whereas `https://twitter.com/user123` yields `twitter.com/app-ads.txt` which is **invalid**. — same source
  - **Apple:** the App Store **Marketing URL** field; "only possible by publishing & submitting a new version via App Store Connect."
  - **Google Play:** **Grow → Store Presence → Store Settings → Store listing contact details → website**. — same source
- **Propagation:** file edits usually reflect on the next scan (mind CDN cache; set expiry ≤1 hour); Developer URL changes "may take several days" on the store, then "allow **24–48 hours** for it to be reflected in Chartboost." — same source
- **Does it gate demand?** Yes — it is described as critical to maximising programmatic revenue and preventing unauthorised selling/app spoofing.

### 4.3 Privacy policy
- **Required, with prescribed disclosures.** "You will **maintain and display a clear, accessible, and legally compliant privacy policy on Your Supply Inventory**, and ensure it is appropriately communicated to End Users." It must, where applicable: "(A) the types of data that may be collected; (B) that such data may be used and/or shared for **personalized advertising**, including with third parties, such as LoopMe…; (C) the details of any third-party service providers and any use of cookies for ad-serving purposes; and (D) a clear description of, or link to, an **effective opt-out mechanism**." — [OFFICIAL: Publisher Terms §4.c.iii](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Precise location:** if you pass precise geo-location data, you must ensure **opt-in consent** and clear conspicuous notice on the inventory. — same source §4.b.viii
- **EEA/UK/Switzerland:** personalized ads require a compliant consent solution; you "may not alter, bypass, or fraudulently simulate End User consent." — same source §9.e
- **Controller relationship:** publisher and LoopMe act as **independent controllers**; LoopMe is controller for End Users outside the US (EEA, UK, Switzerland). A **DPA** is incorporated by reference ([Data Processing Addendum](https://docs.chartboost.com/en/legal/data-processing-agreement/), with a [Subprocessors](https://docs.chartboost.com/en/legal/subprocessors/) list). — same source §9.b, §9.d
- **Where it must be linked (store listing vs. website vs. in-app):** the Terms require it on "Your Supply Inventory" (i.e. in/alongside the app) but do not separately mandate the store-listing field. Store-listing linking is a Google Play / App Store requirement. — same source
- Also relevant: [App Privacy Settings](https://docs.chartboost.com/en/monetization/publishing/app-privacy-settings/) and [COPPA FAQ](https://docs.chartboost.com/en/faq/coppa/).

### 4.4 Minimum payout
**From the publisher Terms (§6.l), by Platform Provider** — [OFFICIAL: Publisher Terms & Conditions](https://docs.chartboost.com/en/legal/terms-conditions/):

| Platform Provider | Minimum payment threshold | Timing |
|---|---|---|
| **Chartboost** | **USD 75**; **USD 300** for wire transfers | Paid by the **last day of the second calendar month** following the month earnings accrued (e.g. January earnings paid by **March 31**) |
| **LoopMe** | **USD 100** | Publisher must submit a valid invoice within **5 working days** of month end to `finance@loopme.com`; LoopMe pays valid undisputed invoices **within 60 days of receipt** |

- Paying-entity note: "LoopMe may make payments to You through **any Affiliate (including, for example, Chartboost LLC on behalf of LoopMe Ltd)**." — same source §6.k
- Confirmed by the help docs: "Publishers need to meet a **$75 minimum** before receiving earnings. Publisher payments **via wire transfer** have a **$300 minimum threshold**." and "By default, the payment threshold is **$300 for wire transfer** payments. You can change your payment threshold at any time." — [OFFICIAL: Payment Terms & Dates](https://docs.chartboost.com/en/monetization/payments/payment-terms-dates/), [Adjusting Your Payout Threshold](https://docs.chartboost.com/en/monetization/payments/adjusting-your-payout-threshold/)
- **Rollover:** "In the event Your earnings for any given month are less than the applicable minimum threshold, LoopMe may **roll over** such amount month to month until the threshold is met." — [OFFICIAL: Publisher Terms §6.c](https://docs.chartboost.com/en/legal/terms-conditions/)
- **Payment schedule examples:** January earnings → **March 31**; December earnings → **February 28**. Allow **3–5 business days** for banks to post. Publishers receive **no monthly invoices** — automatic payments plus email confirmations. — [OFFICIAL: Payment Terms & Dates](https://docs.chartboost.com/en/monetization/payments/payment-terms-dates/), [Payment FAQ](https://docs.chartboost.com/en/faq/payment/)
- ⚠️ **Inconsistency flagged:** the Terms give a **USD 75** Chartboost threshold, while the help docs also say "the default payment threshold is **$300 for wire transfer**." These are consistent only if $75 is the non-wire default and $300 the wire default — read them that way, and confirm in-dashboard.

### 4.5 Payment methods available in India
- **Available rails (official):** **Wire Transfer**, **Direct Deposit/ACH**, or **Hold My Payments**. — [OFFICIAL: Setup Payment](https://docs.chartboost.com/en/monetization/payments/setup-payment/)
- **Payment processor:** a **Tipalti** agreement page exists in the legal docs. — [OFFICIAL: Tipalti Agreement](https://docs.chartboost.com/en/legal/tipalti-agreement/) (page not retrieved in full — **Tipalti's specific India rails, incl. Local Bank Transfer / Global ACH, are NOT VERIFIED from a Chartboost page**)
- **Currencies:** "Payments may be made in **USD ($), GBP (£), or EUR (€)**, as agreed between the Parties." **No INR.** — [OFFICIAL: Publisher Terms §6.e](https://docs.chartboost.com/en/legal/terms-conditions/)
- **W-8BEN is explicitly required for international vendors:** "Upload a **W-9 tax form** (for US vendors) or a **W-8BEN tax form** (**for international vendors**)." Also: "Please don't email us copies of your W-9 or W-8BEN forms!" — [OFFICIAL: Setup Payment](https://docs.chartboost.com/en/monetization/payments/setup-payment/)
  - Note the Chartboost page names only W-8BEN (not W-8BEN-E), even for entities. Whether an Indian **company** should file W-8BEN or W-8BEN-E is **NOT VERIFIED** from Chartboost's own docs (the standard US rule is W-8BEN for individuals, W-8BEN-E for entities — but I am not citing a Chartboost source for that).
- **Fees (official):** "$25 wire fee" for USD wires; for non-USD wires "a $25 wire fee and a **3% conversion fee**"; "For paper checks and **eCheck/Local Bank Transfer/Global ACH**, there's a **$10 fee**." Plus your own bank's charges. — [OFFICIAL: Payment FAQ](https://docs.chartboost.com/en/faq/payment/)
  - The mention of **"Local Bank Transfer/Global ACH"** at $10 is the most likely India-relevant rail — but the docs never state India explicitly. **NOT VERIFIED that Local Bank Transfer is offered to Indian publishers.**
- **GST / TDS:**
  - "Chartboost is **not** required to withhold any taxes. However, you're responsible for complying with local tax laws." — [OFFICIAL: Payment FAQ](https://docs.chartboost.com/en/faq/payment/)
  - "All payments are **inclusive of taxes**, excluding any taxes on each Party's income. **You are responsible for remitting any transaction taxes (including VAT, GST, or similar)** to the relevant authorities. In case applicable laws require withholding of any amount on account of withholding taxes, LoopMe **may withhold** such amounts, unless You provide a **valid exemption certificate**. **Amounts payable to You shall not be grossed up** for withholding taxes." — [OFFICIAL: Publisher Terms §6.j](https://docs.chartboost.com/en/legal/terms-conditions/)
  - **India-specific GST/TDS mechanics (e.g. LUT for zero-rated export, Form 15CA/CB, TDS u/s 195): NOT VERIFIED** from any network source.
- **Bank/transfer charges:** "Any bank or transfer charges shall be borne by You. LoopMe may deduct or offset such charges from or against amounts payable to You." — same source §6.i
- **Agency framing:** "Consistent with the **IAB standard terms version 3**, LoopMe acts **solely as agent** in facilitating payment flows between You and Demand Partners and assumes no joint or several liability." — same source §6.b
- **Contracting entities (official):**
  - **LoopMe Ltd** — English limited company, **company no. 07979184**, registered office **Second Floor, The Sans, 20 St. John's Square, London, EC1M 4AH**.
  - **Chartboost LLC** — **251 Little Falls Drive, Wilmington, County of New Castle, Delaware, DE 19808**. — same source §1
- **Governing law:** "governed by the laws of **England and Wales**. The courts of England and Wales shall have **exclusive jurisdiction**." — same source §16.a
- **Terms can be amended unilaterally:** "LoopMe may amend these Terms at any time by providing prior written notice… amendments effective immediately upon such notice," with a 14-day right to terminate on objection. — same source §16.g
- **Revenue basis:** "calculated by LoopMe based on valid impressions served on Your Supply Inventory and the pricing associated with those impressions, determined by reference to **Net Revenue**" (Revenue less taxes, agency commissions, buyer fees, carrier/partner fees, returns/discounts/promotional allowances, subject to LoopMe's prior receipt of funds from the Demand Partner). — same source §1, §6.a
- **Fraud exposure:** LoopMe may "withhold payment… credit back to advertisers, and/or withhold or offset against future payments" amounts from Fraudulent Activity, and "may at its sole discretion seek **liquidated damages up to 50%** of the amount payable to You." — same source §4.g.i

### 4.6 Live published app required?
- **YES — strictly.** App review requires "The Chartboost SDK must be present in the **live version** of the application" and "Your applications **must be live in the official App Store**," plus "**a minimum of 250 DAU constantly for 7–14 days**." — [OFFICIAL: Publisher App Review](https://docs.chartboost.com/en/monetization/publishing/publisher-app-review/)
- **Test mode before review:** allowed — "While the app is undergoing review, no ads will be served to the app **unless test mode is explicitly turned on**." Test Mode produces "one of our placeholder static/rewarded video ads" and can be run from an IDE/simulator. — same source, [Most Popular FAQs](https://docs.chartboost.com/en/faq/most-popular-faqs/), [Test Mode](https://docs.chartboost.com/en/monetization/test-mode/)
- **Store URL required:** yes — "Make sure that you imported the app and **app store URL is present** on the Apps Settings page." Also note "**Chartboost App ID is unique to your app** and using it in more than one application is strictly against our Terms & Conditions." — [OFFICIAL: Publisher App Review](https://docs.chartboost.com/en/monetization/publishing/publisher-app-review/)
- **Mediation caveat:** for mediation, the **Chartboost adapter must be integrated and initializing in the live app**, otherwise review fails; a common fix is temporarily placing Chartboost at the top of the waterfall (optionally restricted to the Netherlands). Also: "If you also use the Chartboost Mediation SDK and the Mediation product, **no ads will be served to banner ad requests while your app is still under review**. However, ads will be shown to interstitial and rewarded placements." — same source

### 4.7 Ad formats supported
- **Publisher ad formats documented: Interstitial, Rewarded, Banner.** Ad-location creation offers exactly six fields including "Select the ad format for this ad location (**Interstitial, Rewarded, or Banner**)" and the CSV `Ad Type` column accepts only `rewarded`, `interstitial`, or `banner`. — [OFFICIAL: Ad Locations](https://docs.chartboost.com/en/monetization/publishing/ad-locations/)
- **Not documented as publisher formats:** Native ❌, App Open ❌, MREC ❌ (as a distinct publisher format), Rewarded Interstitial ❌, Playable ❌. **FLAG:** Chartboost's publisher format set appears materially narrower than the other three networks.
- **Ad location type (integration/monetisation mode):**
  - **Fixed CPM** — flat CPM for interstitial/rewarded; **CPM floor** for banner. You set per-country CPM rates; countries not configured fall back to "Chartboost will automatically optimize for the publisher's best yield" (dynamic eCPM, not guaranteed). Max **100 unique location names per app and location type**.
  - **Bidding** — "for publishers who wish to bid into the Chartboost Exchange using **In-App Bidding**, Chartboost's Real Time Bidding solution" (contact `in-app-bidding@chartboost.com`). — same source
- **Mediation integrations:** AdMob, Chartboost mediation, **DT FairBid**, **MAX**, **Unity LevelPlay**. — [OFFICIAL: Monetization → Mediation](https://docs.chartboost.com/en/monetization/mediation/mediation-partner-overview/)
- **Analytics/API:** App Management API, Ad Locations API, Analytics API, List Management API, plus a Publisher CPM Management API. — [OFFICIAL: API Reference](https://docs.chartboost.com/en/monetization/reference/api-access-authentication/)

### 4.8 Chartboost — explicit gaps (NOT VERIFIED)
- India as a supported publisher/payout country.
- KYC/GST onboarding documentation requirements.
- Whether **Local Bank Transfer / Global ACH** is offered to Indian publishers (rail named in fee table only).
- Whether an India-registered **company** files W-8BEN or W-8BEN-E (page names W-8BEN only).
- Contracting-entity/tax-treaty mechanics for India (e.g. India–UK DTAA rate); no network page covers this.
- `chartboost.com` certificate-authority ID for app-ads.txt.
- Whether Chartboost accepts child-directed apps at all (Terms say no — §14.c.ii).
- Video-specific format taxonomy (Chartboost Videos page exists but ad-location types are only interstitial/rewarded/banner).

---

## 5. Cross-network summary table

| Network | Signup gating | Min payout | India payout method | Live app required |
|---|---|---|---|---|
| **Meta Audience Network** | **Gated.** Business Manager + Monetization Manager Property; **app bundle review & approval**; mandatory **app ownership verification**; app-ads.txt accuracy a pre-onboarding condition; app must be in Google Play/iTunes; admission at Meta's sole discretion. Traffic/entity bar **NOT VERIFIED**. | **NOT VERIFIED officially.** NON-OFFICIAL (2020, reseller guide): **US$100/month** rolled over, paid ~21st of following month. | **NOT VERIFIED.** NON-OFFICIAL: bank account or **PayPal**, must accept **USD**, no other currency. W-8BEN (individual) / W-8BEN-E (entity) per non-official source. Tips/TDS **NOT VERIFIED**. | **Effectively yes** for monetisation ("assumes you already have a published app"; bundle must be approved). Pre-launch **test mode + device allow-listing** supported via Monetization Manager. |
| **DT Exchange** | **Approval-gated.** DT Console signup; "**Once the DT Team approves and activates your account**"; must use an **official company email**. Traffic/KYC/entity bar **NOT VERIFIED**. | **NOT PUBLISHED. NOT VERIFIED** (DT's own docs assistant confirms it is undocumented). | **NOT VERIFIED.** Console exposes a Finance → Payment Details banking form. No currency/country/FX/tax-form information published. | **No.** "The DT Console allows you to add your app **whether or not it is published in an app store**." Test devices supported. |
| **Liftoff Monetize** | **Open self-serve** signup + email activation. No published traffic/entity/KYC bar. **Individuals explicitly contemplated** (W-8BEN guidance for "most non-US individuals"). Flat CPM & in-app bidding are **account-manager-gated**. | **Official:** PayPal **$50**, ACH **$50**, Check **$50**, Wire **$1,000**, eCheck **$1,000**. ⚠️ Contract separately says amounts **< $1,000** may be withheld — conflict. Net 60, monthly. | **PayPal** (min $50, 2% capped at $21 intl) or **international Wire** (min $1,000, $18 + **2.5% FX**); **ACH/Check are US-only**. Tipalti is the processor. **INR payout NOT VERIFIED.** W-8BEN (non-US individual) / W-8BEN-E (non-US entity). Entity: **LMI Inc.**, Palo Alto CA, USA; California law. | **No for setup, yes for real ads.** You can register a non-live app, but "you **will only be able to use test ads**" until live. Status: Active requires live on Apple/Google. |
| **Chartboost (by LoopMe)** | **Free self-serve account**, but **every app review-gated**: SDK in the **live** app + live in official store + **250 DAU sustained 7–14 days**; ~3 business days. **Individuals 18+ permitted by Terms.** Child-directed apps prohibited. Extra accounts need pre-approval. | **Official:** **USD 75** (Chartboost provider); **USD 300** for wire transfers; **USD 100** if LoopMe is the provider. Paid by **end of the 2nd calendar month** after accrual (Jan → Mar 31). | Wire Transfer / Direct Deposit-ACH / Hold. Currencies **USD, GBP, EUR — no INR**. **W-8BEN required for international vendors.** Fees: $25 USD wire, $25 + **3%** non-USD wire, **$10** for eCheck/**Local Bank Transfer**/Global ACH. Chartboost "not required to withhold"; publisher remits own GST/VAT. Entity: **LoopMe Ltd** (UK, no. 07979184) / **Chartboost LLC** (Delaware). England & Wales law. | **YES — strictly.** SDK must be in the **live** version; app must be live in the official store; **250 DAU for 7–14 days**. Test Mode available during review (placeholder ads only). |

---

## 6. Consolidated NOT VERIFIED / GAPS list

**Common to all four**
- Whether an **Indian unregistered sole proprietor** can contract and be paid — only **Chartboost** states it explicitly (individuals 18+ permitted); only **Liftoff** implies it (non-US individual → W-8BEN).
- **India GST** treatment (zero-rated export of services, LUT filing) and **TDS/withholding** mechanics — no network publishes India-specific guidance.
- Indian **tax-invoice / Form 15CA-CB** requirements.

**Meta Audience Network** — minimum payout; payment rails from India; INR support; FX/fees; W-8BEN vs W-8BEN-E; contracting entity; governing law; traffic/entity onboarding bar; current onboarding-pause status; privacy-policy link location. *(Root cause: Meta's publisher help centre is entirely login-gated; `facebook.com/legal/audience_network_terms` returns no readable body.)*

**DT Exchange** — minimum payout; payout schedule; payment methods from India; currencies; FX; W-8BEN; KYC/GST; traffic/entity bar; India support; contracting entity; explicit publisher privacy-policy obligation. *(Root cause: DT publishes no finance/eligibility page; its own docs assistant confirms the gap.)*

**Liftoff Monetize** — minimum traffic/install/revenue bar; KYC/GST docs; exact India payment-method availability; INR payout; Reward Interstitial GA status; resolution of the **$50 vs $1,000** payout-floor conflict between the help centre and the contract.

**Chartboost** — India support and India-specific payment rails; whether **Local Bank Transfer/Global ACH** is offered to Indian publishers; W-8BEN vs W-8BEN-E for Indian companies; `chartboost.com` app-ads.txt cert ID; video-format taxonomy; India–UK treaty withholding rate.

**Explicit non-finding (important):** I could **not** verify any official statement that Meta Audience Network has **paused or restricted new publisher onboarding** in 2025–2026. The public developer documentation reads as open-but-reviewed. Treat any claim of a current onboarding pause as **unverified**.

**Explicit false-lead warning:** `help.dtxplatform.com` ("DTXplatform", min payout $50, PayPal/Wire/eCheck/Paxum/Webmoney) is **not** Digital Turbine's DT Exchange. Do not cite its figures for DT Exchange.

---

## 7. Practical read for a small Indore-based developer (inference, clearly labelled)

*The following is my synthesis, not a cited fact:*
1. **Chartboost** is the most *transparent* on eligibility and payout, but has the **hardest hard gate** — 250 sustained DAU for 7–14 days per app plus a live-app SDK build. Fine if you already have traction; a blocker at zero installs.
2. **Liftoff Monetize** is the **easiest to open** (self-serve, individual-friendly, published $50 PayPal floor, published Net 60) but the contract's **$1,000 withholding clause** means small balances may sit for months — a real cash-flow issue at low revenue.
3. **DT Exchange** is the only one that **explicitly allows integrating a not-yet-published app**, making it the best pre-launch technical integration target — but you cannot get payout terms until you talk to an account manager.
4. **Meta Audience Network** has the **least publicly verifiable** commercial terms and requires a Business Manager/Property structure plus bundle approval; it is now **bidding-only**, so it must be reached through a mediation partner (AdMob/GAM/MAX/LevelPlay/DT FairBid).
