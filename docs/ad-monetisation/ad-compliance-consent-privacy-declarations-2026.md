# Consent, Privacy & Ad Declarations — Compliance Research for a Solo Developer in Indore, India

**Scope:** Google Play + Apple App Store in-app ad monetisation (AdMob-centric), EEA/UK/Switzerland, US state privacy, COPPA/Families, and store declaration duties.
**Research date:** 18 September 2026 (all pages fetched on this date unless a different "published/effective" date is noted).
**Method:** Direct fetch of official Google/Apple/IAB/FTC pages via a text-extraction proxy. Every fact below carries its source URL. Items I could **not** confirm are explicitly marked **NOT VERIFIED**.

> ⚠️ Compliance statements below are summaries of vendor/platform rulebooks, not legal advice. The Google Play Families policy and Apple guideline 5.1.x both tell developers to consult counsel.

---

## A) Google UMP SDK + GDPR / IAB TCF

### A1. What the UMP SDK is

- The **Google User Messaging Platform (UMP) SDK** is "a privacy and messaging tool to help you manage privacy choices." It requires **Android API level 21 or higher**. Integration: add `com.google.android.ump:user-messaging-platform:4.0.0` to the app-level Gradle file, and put your AdMob app ID in `AndroidManifest.xml` as `com.google.android.gms.ads.APPLICATION_ID`.
- Required call flow: `requestConsentInfoUpdate()` **on every app launch** (it checks whether consent is required and whether a privacy-options entry point is required), then `loadAndShowConsentFormIfRequired()`, then gate ad requests on `canRequestAds()`, and expose a privacy-options entry point when `getPrivacyOptionsRequirementStatus() == REQUIRED`.
- Messages are created in the AdMob **Privacy & messaging** tab; the UMP SDK displays the message matching the AdMob Application ID in the project.
- Source: [Set up UMP SDK — developers.google.com/admob/android/privacy](https://developers.google.com/admob/android/privacy) (page content as of 18 Sep 2026; no visible "last updated" date on the page)

### A2. Is UMP *required*? What happens if you don't implement a certified CMP?

**The CMP is required. UMP specifically is not.** The binding requirement is a **Google-certified CMP integrated with the IAB TCF**, and only when serving **personalized** ads in EEA/UK/Switzerland.

- "Under the Google EU User Consent Policy, you must make certain disclosures to your users in the European Economic Area (EEA), the United Kingdom (UK), and Switzerland, and obtain their consent to use cookies or other local storage, where legally required, and to use personal data (such as AdID) to serve ads." — [Disclose to EEA users — developers.google.com/admob/android/privacy/gdpr](https://developers.google.com/admob/android/privacy/gdpr)
- Effective dates (both Google Help pages state the same): **EEA and UK — 16 January 2024**; **Switzerland — 31 July 2024**. "a certified CMP integrated with the TCF is required when serving personalized ads to users in" those regions. Sources: [Google consent management requirements for serving ads in the EEA, the UK, and Switzerland (for publishers)](https://support.google.com/admob/answer/13554116) and […(for CMPs)](https://support.google.com/admob/answer/13554020)
- **Consequence of no action** — Google's Adobe Help FAQ states verbatim: *"Beginning January 16, 2024, if a partner doesn't adopt a Google-certified CMP, only **Limited Ads** will be eligible to serve on EEA and UK traffic. Enforcement will begin January 16, 2024 on a small percentage of EEA and UK traffic and will ramp up until Google enforces across all EEA and UK traffic by the end of February 2024."* — [developers.google.com/admob/android/privacy/gdpr](https://developers.google.com/admob/android/privacy/gdpr)
- **Traffic tiering by CMP status** (important nuance):
  - *Certified CMP traffic:* "will continue to be eligible for personalized ads, non-personalized ads, and limited ads."
  - *Traffic from a non-certified CMP:* "may be eligible for non-personalized ads or limited ads."
  - Source: [support.google.com/admob/answer/13554116](https://support.google.com/admob/answer/13554116)
- **"Do I need to use Google's UMP SDK to meet the CMP requirement? No, you can use any CMP from the List of Google-certified CMP."** — [developers.google.com/admob/android/privacy/gdpr](https://developers.google.com/admob/android/privacy/gdpr)
- What Limited Ads means commercially: limited ads "disable the collection, sharing, and use of personal data for personalization"; several features are unavailable and "Campaigns will not serve in AdMob in the event of a limited ad signal" unless programmatic limited ads is enabled. — [Limited ads — support.google.com/admob/answer/10105530](https://support.google.com/admob/answer/10105530)

### A3. Is Google's UMP a registered IAB CMP?

**Evidence strongly says yes, but I could not verify Google's entry in IAB Europe's CMP list directly.**

- Google: "To integrate with the IAB Europe TCF, a publisher must implement an **IAB registered TCF CMP** on their app." and, on the same page: "**No action is required if you are using the Google CMP for your web or app properties**, as we will begin writing TCF v2.3 strings by the March 1, 2026 deadline." — [Publisher integration with the IAB Europe TCF — support.google.com/admob/answer/9760862](https://support.google.com/admob/answer/9760862)
- Google: "the European regulations message available to Ad Manager, AdSense, and AdMob publishers in the 'Privacy & messaging' tab **are certified** in accordance with the new TCF requirement." — [support.google.com/admob/answer/13554116](https://support.google.com/admob/answer/13554116)
- **NOT VERIFIED:** the actual rows of the IAB Europe CMP list at [iabeurope.eu/cmp-list/](https://iabeurope.eu/cmp-list/) — the list is loaded by client-side JS behind Cloudflare and did not render through the extraction proxy; the row data I received only reached alphabetical "B". I also could not enumerate Google's own list of Google-certified third-party CMPs — the named CMP list on [support.google.com/admob/answer/13554116](https://support.google.com/admob/answer/13554116) is rendered by a widget that the proxy did not capture. Do not quote specific third-party CMP names from this report.

### A4. IAB TCF current version and deadline status

- Version history (verbatim): "On 16 May 2023, **TCF v2.2** was launched…"; "In **April 2025**, **TCF v2.3** was launched to resolve the legitimate interest ambiguity by repurposing and making the 'Disclosed Vendors' section a mandatory section of the TC string." — [iabeurope.eu/transparency-consent-framework/](https://iabeurope.eu/transparency-consent-framework/)
- **Deadline (IAB Europe):** "TCF participants have until **28 February 2026** to adopt TCF v2.3 and make the necessary changes to their respective implementations." — [iabeurope.eu/transparency-consent-framework/](https://iabeurope.eu/transparency-consent-framework/)
- **Deadline (Google's wording, one day later):** "**The IAB's mandatory deadline for all publishers and CMPs to fully implement TCF v2.3 is March 1, 2026.**" Google's transition timeline:
  - *Now – end of February 2026:* Google treats v2.3 strings like v2.2 strings and does not validate the disclosed-vendor segment (risk-free testing window).
  - *Final deadline, 1 March 2026:* "support for new TCF v2.2 strings will be officially dropped, though we will still support TCF v2.2 strings created before March 1, 2026. TCF v2.3 is mandatory for all TC strings generated on or after March 1, 2026. **Failure to meet this requirement may cause the associated ad request to be defaulted to Limited Ads, which may impact revenue.**"
  - Source: [support.google.com/admob/answer/9760862](https://support.google.com/admob/answer/9760862)
- The Limited Ads help page (current) refers to "Other **IAB TCF v2.3** certified consent management platforms (CMPs)", confirming v2.3 is the live version. — [support.google.com/admob/answer/10105530](https://support.google.com/admob/answer/10105530)
- **Status as of Sep 2026: v2.3 is the current version and the adoption deadline has already passed (end-Feb / 1-Mar 2026).** A solo developer shipping today must be on a v2.3-writing CMP.
- Google also requires Google Mobile Ads SDK **v19.0.0+ (Android) / v7.60.0+ (iOS)** to use IAB TCF functionality. — [support.google.com/admob/answer/9760862](https://support.google.com/admob/answer/9760862)
- Google's own flexible-registration position: Google registers purposes **2, 7, 9, 10** as flexible (defaulting to legitimate interest) and **always requires consent for purposes 1, 3, and 4**. — same page.

### A5. Which networks require a registered IAB CMP?

- **Verified:** Google requires it for **Google AdSense, Ad Manager, and AdMob** publishers serving personalized ads in EEA/UK/Switzerland. — [support.google.com/admob/answer/13554116](https://support.google.com/admob/answer/13554116)
- **NOT VERIFIED:** I did not find first-party documentation confirming equivalent explicit CMP mandates for Meta Audience Network, AppLovin, Unity Ads/LevelPlay, Liftoff/Vungle, Mintegral, Pangle, etc. Do not assert a network-by-network CMP requirement without checking each network's own partner docs.

### A6. US state privacy laws and the UMP "US state regulations" message

- **Supported states (20, per the help page):** California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, Virginia. — [About US state regulations messages — support.google.com/admob/answer/10862202](https://support.google.com/admob/answer/10862202)
- The message contains a **"Do Not Sell or Share"** link, a **Confirm page**, and **Opt out / Dismiss** buttons; it communicates opt-out status to Google.
- **When it shows:** per the message-types table, the US state regulations message is shown **"At privacy options entry point."** — [Available user message types — support.google.com/admob/answer/10114020](https://support.google.com/admob/answer/10114020). (Contrast: the European regulations message shows "On app start" and "At privacy options entry point.")
- **Signal plumbing:** supports the **IAB Global Privacy Platform (GPP)**. The **US National** section carries CA, CO, CT, DE, IN, IA, KY, MD, MN, MT, NE, NH, NJ, OR, RI, TN, TX, UT, VA; the separate **Florida** section carries FL.
- **Is it mandatory?** Google frames US-state compliance as **Restricted Data Processing (RDP)** plus **options**: a CMP (Google's, third-party, or in-house) communicating GPP signals, or publisher ad tags on a per-request basis. Google's own words: "Google's consent management solution provides **optional** messaging features via the Privacy & messaging tab." Service provider terms became effective **1 January 2023**. — [Helping publishers comply with US states privacy laws — support.google.com/admob/answer/9561022](https://support.google.com/admob/answer/9561022). **Practical read: the EU/UK/CH certified-CMP rule is a hard gate to personalized ads; the US-state message is an optional (but strongly advisable) tool inside a broader RDP obligation.**
- Setup steps: [Create a US state regulations message — support.google.com/admob/answer/10860309](https://support.google.com/admob/answer/10860309)
- GPP vs deprecated string: the IAB deprecated the US Privacy String in January 2024 in favour of GPP; AdMob still reads the US Privacy String for backward compatibility but recommends GPP. — [support.google.com/admob/answer/9561022](https://support.google.com/admob/answer/9561022)

### A7. Child-directed interaction with consent (bridge to section D)

- "Regardless of consent signals, Google will not serve personalized ads to users if the publisher has indicated that a child is present, if the content has been labeled by a publisher as child-directed, or if Google has other signals to indicate that a child is present. For apps that comply with the Google Play Families policies, this treatment is **automatically applied**."
- Publishers using UMP are "responsible for tagging an ad request … as being from users under the age of consent with the **TFUA** signal using the UMP SDK to suppress GDPR-related user messages." — [support.google.com/admob/answer/13554116](https://support.google.com/admob/answer/13554116)
- On UMP you set this with `ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(true)`, and "When you set TFUA to `true`, the UMP SDK doesn't request consent from the user." For mixed-audience apps, set it only for child users. — [developers.google.com/admob/android/privacy/gdpr](https://developers.google.com/admob/android/privacy/gdpr)
- Google also warns: if you use a third-party CMP, failure to add mediation partners to the GDPR message's ad-partners list "can lead to partners failing to serve ads on your app." — same page.

---

## B) Apple App Tracking Transparency (ATT)

### B1. What ATT is and whether it is required

- Framework: "**App Tracking Transparency** — Request authorization to access app-related data that your app can use to track the person or the device." Availability listed as **iOS 14.0+, iPadOS 14.0+, Mac Catalyst 14.0+, macOS 11.0+, tvOS 14.0+, visionOS 1.0+**. — [developer.apple.com/documentation/apptrackingtransparency](https://developer.apple.com/documentation/apptrackingtransparency)
- **Yes, it is required.** Apple: "In **iOS 14.5, iPadOS 14.5, and tvOS 14.5 or later, you need to receive the user's permission through the App Tracking Transparency (ATT) framework in order to track them or access their device's advertising identifier.**" — [User Privacy and Data Use — developer.apple.com/app-store/user-privacy-and-data-use/](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- **Definition of tracking (verbatim):** "Tracking refers to the act of linking user or device data collected from your app with user or device data collected from other companies' apps, websites, or offline properties for targeted advertising or advertising measurement purposes. Tracking also refers to sharing user or device data with data brokers." — same page.
- **Examples of tracking** (same page): displaying targeted ads based on data from other companies' apps/sites; sharing emails/advertising IDs/other IDs with a third-party ad network that retargets or finds similar users; placing a third-party SDK that combines your app's user data with data from other developers' apps to target or measure advertising **"even if you don't use the SDK for these purposes."**
- **Not tracking** (no ATT permission needed): data linked to third-party data **solely on-device** and not sent off-device in an identifiable way; fraud-detection-only data-broker sharing; consumer-reporting-agency credit uses.
- **Consequence of denial:** "Unless you receive permission from the user to enable tracking, **the device's advertising identifier value will be all zeros** and you may not track them as described above." — same page.

### B2. Implementation requirements

1. Add `NSUserTrackingUsageDescription` to the app's target properties in Xcode.
2. Call `requestTrackingAuthorization(completionHandler:)` to present the request.
3. Check `trackingAuthorizationStatus`.
— [developer.apple.com/documentation/apptrackingtransparency](https://developer.apple.com/documentation/apptrackingtransparency)

- "You must also include a **purpose string** in the system prompt that explains why you'd like to track the user." — [User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- `NSUserTrackingUsageDescription` is described as "A message that explains the purpose for accessing data that an app can use to track a person or device." — [developer.apple.com/documentation/apptrackingtransparency](https://developer.apple.com/documentation/apptrackingtransparency)
- **IDFV carve-out:** "The identifier for vendor (IDFV) may be used for analytics across apps from the same content provider. In this case, the use of the App Tracking Transparency framework is **not** required. The IDFV **may not** be combined with other data to track a user across apps and websites owned by other companies." — [User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/)

### B3. Apple's ATT FAQ rulings that matter to an ad-funded app

All from [developer.apple.com/app-store/user-privacy-and-data-use/](https://developer.apple.com/app-store/user-privacy-and-data-use/):

- **Cannot gate or incentivise:** "Your app may not require users to enable system functionalities (e.g. push notifications, location services, tracking) in order to access functionality, content, use the app, or receive monetary or other compensation…" (mirrored in Guideline 5.1.2(i)). Also Guideline 5.1.1(iv): "apps must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access."
- **Pre-prompt explainers are allowed:** "Yes, so long as you are transparent to users about your use of the data in your explanation."
- **Hashed email/phone is not a loophole:** "No. You will need to receive the user's permission through the App Tracking Transparency framework to track that user."
- **Web-based consent does not substitute:** "Developers must get permission via the App Tracking Transparency prompt for data that's collected in the app and used for tracking."
- **No fingerprinting:** "Per the Apple Developer Program License Agreement, you may not derive data from a device for the purpose of uniquely identifying it. … Apps that are found to be engaging in this practice, or that reference SDKs (including but not limited to Ad Networks, Attribution services, and Analytics) that are, **may be rejected from the App Store.**"
- **Deep-linking tools:** ATT permission required if a third-party service passes unique identifiers or creates a shared identity across companies for ad targeting, ad measurement, or data-broker sharing.
- **You own your SDKs' behaviour:** "Yes. Developers are responsible for all code included in their apps."
- **Identifiers covered:** "Any user or device level identifier that is used to join data from your app with data from third parties (including SDKs used in your app) for purposes of advertising or ad measurement or sharing with a data broker. This includes, but is not limited to, the device's advertising identifier, **session ID, fingerprint IDs, and device graph identifiers**."
- **Webview tracking inside an app:** also requires the ATT prompt (FAQ listed on the page).
- **OS version trigger:** "To access the value of the IDFA for users on iOS/iPadOS version 14.5 or later, you will first need to receive permission…"

### B4. NEW in 2026 — EU alternative ATT prompt (iOS 27.2)

Verbatim from [User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/):

- "As part of agreements with select European competition authorities, Apple is introducing changes to its App Tracking Transparency framework in the European Union. **Beginning with iOS 27.2 and iPadOS 27.2**, developers will have the option to use an **alternative version** of the App Tracking Transparency system prompt in the EU. The requirements for when you must seek permission to track users will remain the same. **Due to legal requirements, only the alternative version of the system prompt is available for apps distributed in Germany, France, Italy, Poland, and Romania.**"
- The alternative prompt uses modified formatting/language and offers an optional **"Additional Information"** text button.
- "for users in the European Union, you can **re-prompt** a user via the ATT system prompt **one year after** the user's previous choice … regardless of whether that choice was to accept or reject. A user cannot be re-prompted if they have disabled 'Allow Apps to Request to Track' (renamed to 'Allow Apps to Request to Link Your Activity Across Companies' in the EU)."
- New/adjacent APIs: `requestTrackingAuthorization(usingExpandedInterface:additionalInformationAction:completionHandler:)` and `NSUserTrackingMarkdownUsageDescription` (both marked **Beta**), plus the existing `NSUserTrackingUsageDescription`.

### B5. What happens to ad revenue if a user denies tracking?

- **No official quantified number exists.** I could not find any Apple, Google, or first-party ad-network page stating a specific eCPM/revenue loss figure for denied ATT. **NOT VERIFIED** for any percentage or multiplier. Treat blog-post percentages as unverified.
- **Verified: monetisation continues without IDFA.** Google's iOS guidance for ATT explicitly keeps the no-IDFA path monetisable:
  - "The Google Mobile Ads SDK supports conversion tracking using Apple's **SKAdNetwork**, which lets Google and participating third-party buyers attribute an app install **even when the IDFA is not available**." Requires adding buyer `SKAdNetworkIdentifier` values (Google's is `cstr6suwn9.skadnetwork`) to `SKAdNetworkItems` in `Info.plist`. — [developers.google.com/admob/ios/ios14](https://developers.google.com/admob/ios/ios14)
  - "For iOS apps, you can now **create distinct mediation groups** for ad requests with and without an Identifier for Advertisers (IDFA)." — [Privacy strategies for iOS — support.google.com/admob/answer/9997589](https://support.google.com/admob/answer/9997589)
  - "With the changes around privacy on iOS, **you may experience eCPM fluctuations.** Having Google manage your eCPM floors can help limit the time spent manually adjusting eCPM floors." (Google Optimized floors) — same page.
  - "If you use **bidding**, you should continue using bidding. Bidding helps ensure your impressions get the highest revenue for both segments of traffic (with and without IDFA)." — same page.
  - Keep "the latest Google Mobile Ads SDK for iOS (**version 7.64 or later**)"; a rotating **SDK instance ID** "helps maximize your apps' ad performance." — same page.
- So: no-IDFA traffic still serves (contextual / non-personalized / limited ads) and still earns, at generally lower yield. **The specific size of the hit is NOT VERIFIED.**
- Also note AdMob's Privacy & messaging can front-run the ATT alert with an **IDFA explainer message** to improve opt-in; if you don't use it, no message appears and the system ATT alert shows directly. — [About IDFA explainer messages — support.google.com/admob/answer/10115027](https://support.google.com/admob/answer/10115027); [Available user message types — support.google.com/admob/answer/10114020](https://support.google.com/admob/answer/10114020)

### B6. App Store Connect "App Privacy" / privacy nutrition label

Source: [App Privacy Details — developer.apple.com/app-store/app-privacy-details/](https://developer.apple.com/app-store/app-privacy-details/) (page published/updated **30 January 2026**)

- **Mandatory:** "In order to submit new apps and app updates, you must provide information about your privacy practices in App Store Connect." — [User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- "You need to identify **all of the data you or your third-party partners collect**, unless the data meets all of the criteria for optional disclosure."
- "**Third-party partners**" = "analytics tools, advertising networks, third-party SDKs, or other external vendors whose code you've added to your app."
- "even if you collect the data for reasons other than analytics or advertising, it still needs to be declared."
- "You're responsible for keeping your responses accurate and up to date. … you may update your answers at any time, and you do not need to submit an app update in order to change your answers."
- **Relevant data types for an ad-funded app:** *Device ID* ("Such as the device's advertising identifier, or other device-level ID"), *Advertising Data* ("Such as information about the advertisements the user has seen"), *Product Interaction*, *Crash Data*, *Performance Data*, *Coarse Location* / *Precise Location* (IP-derived location must be declared as relevant), *Purchase History*.
- **Relevant purposes:** *Third-Party Advertising* ("Such as displaying third-party ads in your app, or sharing data with entities who display third-party ads"), *Developer's Advertising or Marketing*, *Analytics*, *App Functionality*.
- **Tracking:** the label has a tracking dimension driven by the same "Tracking" definition as ATT (see B1); the page restates the "even if you don't use the SDK for these purposes" example for third-party SDKs.

### B7. App Review Guidelines 5.1.1 and 5.1.2 — relevant text

Source: [App Review Guidelines — developer.apple.com/app-store/review/guidelines/](https://developer.apple.com/app-store/review/guidelines/) (fetched 18 Sep 2026; page carries no per-section date)

**5.1.1 Data Collection and Storage** (selected verbatim):

- **(i) Privacy Policies:** "All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner. The privacy policy must clearly and explicitly: Identify what data, if any, the app/service collects, how it collects that data, and all uses of that data. **Confirm that any third party with whom an app shares user data (in compliance with these Guidelines)—such as analytics tools, advertising networks and third-party SDKs**, as well as any parent, subsidiary or other related entities that will have access to user data—will provide the same or equal protection of user data as stated in the app's privacy policy and required by these Guidelines. Explain its data retention/deletion policies and describe how a user can revoke consent and/or request deletion of the user's data."
- **(ii) Permission:** "Apps that collect user or usage data must secure user consent for the collection, **even if such data is considered to be anonymous** at the time of or immediately following collection. **Paid functionality must not be dependent on or require a user to grant access to this data.** Apps must also provide the customer with an easily accessible and understandable way to withdraw consent."
- **(iii) Data Minimization:** "Apps should only request access to data relevant to the core functionality of the app…"
- **(iv) Access:** "Apps must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access. … Where possible, provide alternative solutions for users who don't grant consent."

**5.1.2 Data Use and Sharing** (selected verbatim):

- **(i)** "Unless otherwise permitted by law, you may not use, transmit, or share someone's personal data without first obtaining their permission. … **Data collected from apps may only be shared with third parties to improve the app or serve advertising** (in compliance with the Apple Developer Program License Agreement). **You must receive explicit permission from users via the App Tracking Transparency APIs to track their activity.** … **Your app may not require users to enable system functionalities (e.g. push notifications, location services, tracking) in order to access functionality, content, use the app, or receive monetary or other compensation, including but not limited to gift cards and codes.** Apps that share user data without user consent or otherwise complying with data privacy laws **may be removed from sale and may result in your removal from the Apple Developer Program.**"
- **(ii)** "Data collected for one purpose may not be repurposed without further consent unless otherwise explicitly permitted by law."
- **(iii)** no surreptitious profiling / de-anonymisation.
- **(iv)** "…don't collect information about which other apps are installed on a user's device for the purposes of analytics or advertising/marketing."

**5.1.4 Kids** (relevant to ad-funded kids apps):
- "(a) … it is critical to use care when dealing with personal data from kids … **Apps intended primarily for kids should not include third-party analytics or third-party advertising.** This provides a safer experience for kids. (b) In limited cases, third-party analytics and third-party advertising may be permitted provided that the services adhere to the same terms set forth in Guideline 1.3."
- "apps in the Kids Category or those that collect, transmit, or have the capability to share personal information … from a minor must include a privacy policy and must comply with all applicable children's privacy statutes."

---

## C) Google Play Data Safety form

### C1. Is it mandatory?

**Yes — for effectively every published app.**

- "**All developers that have an app published on Google Play must complete the Data safety form**, including apps on closed, open, or production testing tracks. This also applies to pregranted and preloaded apps that update through Google Play."
- "Apps that are active on **internal testing tracks** are exempt… Apps that are exclusively active on this track do not need to complete the Data safety form."
- "Even developers with apps that do not collect any user data must complete this form and provide a link to their privacy policy."
- System services and private apps are exempt.
- Source: [Provide information for Google Play's Data safety section — support.google.com/googleplay/android-developer/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469) (page change log's most recent entries: **5 December 2023**, 31 March 2023 — i.e., the help article itself has not been materially revised since Dec 2023, but it remains the live article)

### C2. Third-party ad SDK obligations

- "This includes data collected and handled through any **third-party libraries or SDKs** used in their apps. You may want to refer to your SDK providers' published Data safety information for details." Check the Play SDK Index.
- "It's your responsibility to ensure that any such code used in your app is compliant with Play Developer Program policies. **You must reflect data collection or sharing carried out by such third-party code in the Data safety form for your app.**"
- **"Sharing"** explicitly covers "[t]ransferring data collected from your app off a user's device **directly to a third party via libraries and/or SDKs** included in your app."
- Critical distinction for ad SDKs: "if an SDK provider is **building advertising profiles across multiple customers based on your app data, that would not be considered 'service provider' activity** for purposes of the Data safety section, and would need to be disclosed as **'sharing'** in your Data safety form." (Transfer to a genuine "service provider" processing only on your instructions need not be declared as sharing.)
- Guidance: "the collection of a user's **Android Advertising ID should be declared as 'Device or other identifiers.'**"
- "using data to build advertising profiles or other user profiles **cannot be treated as ephemeral** and must be declared as collection or sharing for the relevant purposes."

### C3. What Google says the Google Mobile Ads SDK collects

Source: [Google Play data disclosure — developers.google.com/admob/android/privacy/play-data-disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure). The page states it lists data collected by "the latest version (version **25.5.0**) of the Google Mobile Ads SDK (Legacy)". (Note the page's own product labelling says "Legacy" while the rest of AdMob's docs now describe a "Next-Gen" SDK — see §D4. Treat the SDK-name/lineage labelling as **partially NOT VERIFIED**; the *data categories* below are explicit and quotable.)

"collected and shared … **automatically** for advertising, analytics, and fraud prevention purposes":

| Data | What the SDK does |
|---|---|
| IP address | Collects device's IP address, "which may be used to estimate the general location of a device." |
| User product interactions | "including app launch, taps, and video views." |
| Diagnostic information | "including app launch time, hang rate, and energy usage." |
| Device and Account identifiers | "Collects **Android advertising (ad) ID**, **app set ID**, and, if applicable, other identifiers related to signed-in accounts on the device." |

- "All of the user data collected by Google Mobile Ads SDK (Legacy) is **encrypted in transit using the Transport Layer Security (TLS) protocol**."
- "Android ad ID collection is optional. … As the app developer, **you can prevent the collection of ad IDs** by updating the app's manifest file."
- "Certain other features … such as the Limited Ads feature, may also disable transmission of the ad ID and other data."
- Legal allocation: "as the app developer, **you are solely responsible** for deciding how to respond to Google Play's Data safety section form."

**Practical mapping for an AdMob-only app:** Device or other IDs (AAID, app set ID) → *collected + shared*, purpose *Advertising or marketing* (+ Analytics for diagnostics); Approximate location (IP-inferred) → *collected + shared*, *Advertising or marketing*; App interactions → *collected (+ shared)*, *Advertising or marketing* / *Analytics*; App info and performance (crash/diagnostics) → *collected*, *Analytics*; Data encrypted in transit = **Yes**. Plus a working deletion-request mechanism, and (if applicable) the "Committed to follow the Play Families Policy" badge.

### C4. Penalties for inaccurate declarations

- "You alone are responsible for making complete and accurate declarations in your app's store listing on Google Play. … **When Google becomes aware of a discrepancy between your app behavior and your declaration, we may take appropriate action, including enforcement action.**" — [support.google.com/googleplay/android-developer/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469)
- Policy rule: "All developers must complete a clear and accurate Data safety section for every app detailing collection, use, and sharing of user data. The developer is responsible for the accuracy of the label and keeping this information up-to-date." Key-considerations "Don't": "**Don't provide misleading or inaccurate information about your data practices.**" — [Developer Program Policy — support.google.com/googleplay/android-developer/answer/17105854](https://support.google.com/googleplay/android-developer/answer/17105854) (**effective 26 August 2026**)
- Escalation ladder from the same Developer Program Policy ("Enforcement Process"):
  - "Repeated or serious violations (such as malware, fraud, and apps that may cause user or device harm) of these policies or the Developer Distribution Agreement (DDA) will result in **termination of individual or related Google Play Developer accounts.**"
  - "Suspensions count as **strikes** against the good standing of your Google Play Developer account. **Multiple strikes can result in the termination** of individual and related Google Play Developer accounts."
  - **Account Termination:** "all apps in your catalog will be removed from Google Play and you will no longer be able to publish new apps. This also means that **any related Google Play developer accounts will also be permanently suspended.**" / "Any new account that you try to open will be terminated as well (without a refund of the developer registration fee)…"
  - Other actions available: app removal, suspension, **Limited Visibility**, **Limited Regions**, **Restricted Developer Account**.
- Also relevant: Play may re-enforce previously approved declarations over time — "changes and updates to our policies can result in apps which were approved earlier to be enforced upon at a later time following initial submission due to non-compliance." — [support.google.com/googleplay/android-developer/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469)

---

## D) Google Play Families policy / Designed for Families / COPPA

### D1. Ad requirements when the app targets children

From the Families policy ([support.google.com/googleplay/android-developer/answer/9893335](https://support.google.com/googleplay/android-developer/answer/9893335)) and the Developer Program Policy ([…/answer/17105854](https://support.google.com/googleplay/android-developer/answer/17105854), effective 26 Aug 2026). "If your app displays ads to children or to users of unknown age, you must:"

1. "Only use **Google Play Families Self-Certified Ads SDKs** to display ads to those users";
2. "Ensure ads displayed to those users **do not involve interest-based advertising** … **or remarketing**";
3. "Ensure ads displayed to those users present content that is **appropriate for children**";
4. "Ensure ads displayed to those users follow the **Families ad format requirements**"; and
5. "Ensure compliance with all applicable legal regulations and industry standards relating to advertising to children."

"Failure to satisfy these requirements may result in **app removal or suspension**."

### D2. Prohibited ad formats in Families apps

"When the sole target audience for your app is children … the following are prohibited. If the target audiences of your app is children and older audiences, the following are prohibited **when serving ads to children or users of unknown age**":

- "Disruptive monetization and advertising, including monetization and advertising that take up the entire screen or interfere with normal use and do not provide a clear means to dismiss the ad (for example, **Ad walls**)."
- "Monetization and advertising that interfere with normal app use or game play, including **rewarded or opt-in ads, that are not closeable after 5 seconds.**"
- "Monetization and advertising that do not interfere with normal app use or game play may persist for more than 5 seconds (for example, video content with integrated ads)."
- "**Interstitial monetization and advertising displayed immediately upon app launch.**"
- "**Multiple ad placements on a page** (for example, banner ads that show multiple offers in one placement or displaying more than one banner or video ad is not allowed)."
- "Monetization and advertising that are **not clearly distinguishable from your app content**, such as **offerwalls** and other immersive ads experiences."
- "Use of shocking or emotionally manipulative tactics to encourage ads viewing or in-app purchases."
- "Deceptive ads that force the user to click-through by using a dismiss button to trigger another ad, or by making ads suddenly appear in areas of the app where the user usually taps for another function."
- "Not providing a distinction between the use of virtual game coins versus real-life money to make in-app purchases."

**So yes: interstitials are effectively banned on launch and in disruptive placements, and every full-screen/rewarded ad must be closeable within 5 seconds.** Source: [Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)

**Contrast — general (non-Families) apps.** The same Developer Program Policy sets weaker "Better Ads Experiences" rules: full-screen interstitials that "show unexpectedly" are not allowed; interstitials before the splash screen are not allowed; full-screen interstitials "**not closeable after 15 seconds**" are not allowed (opt-in / non-interrupting ones may exceed 15s); **rewarded ads explicitly opted into are exempt**. Separately, "**Made for Ads**" — repeatedly showing interstitials to distract users from in-app tasks — is prohibited (e.g. an interstitial after each consecutive user action). Ad content must also be appropriate for the app's own content rating. Source: [Developer Program Policy §Monetization and Ads](https://support.google.com/googleplay/android-developer/answer/17105854)

### D3. Families Self-Certified Ads SDK Program

- **Mandatory where applicable.** "If you serve ads in your app, and the target audience for your app only includes children …, then you must only use ads SDK versions that have self-certified compliance with Google Play policies." For mixed audiences, "you must make sure that ads shown to children come exclusively from one of these self-certified ads SDK versions (for example, through use of neutral age screening measures)."
- **Program is closed to new applicants:** "Please note that the Google Play Families Self-Certified Ads SDK Program is **currently not accepting new applicants**. … Current participants and their program compliance requirements will remain unchanged."
- **Current self-certified list** (SDK → Maven coordinate → self-certified version), as published:

| SDK | Maven | Self-certified version(s) |
|---|---|---|
| AdColony | com.adcolony sdk | 4.8.0 or later |
| AddApptr | com.intentsoftware.addapptr AATKit-family-safe | 3.8.3 or later |
| Chartboost | com.chartboost chartboost-sdk | 9.1.1 or later |
| DT Exchange SDK | com.fyber marketplace-sdk | 8.2.1 or later |
| Google Ad Manager | com.google.ads.interactivemedia.v3 interactivemedia | 3.19.0 or later |
| Google Ad Manager | com.google.android.gms play-services-pal | 18.0.0 or later |
| **Google AdMob** | **com.google.android.gms play-services-ads** | **19.0.0 or later** |
| HyprMX | com.hyprmx.android HyprMX-SDK | 6.0.3 or later |
| InMobi | com.inmobi.monetization inmobi-ads | 10.5.5 or later |
| ironSource | com.ironsource.sdk mediationsdk | 7.2.1 or later |
| Kidoz | net.kidoz.sdk kidoz-android-native | 8.9.4 or later |
| SuperAwesome | tv.superawesome.sdk.publisher superawesome | 8.4.3 or later |
| Unity Ads | com.unity3d.ads unity-ads | 4.0.1 or later |
| Vungle | com.vungle publisher-sdk-android | 6.10.4 or later |

- **AppLovin has left the program:** "Families app developers will need to transition to a Families self-certified ads SDK version listed above by **May 31, 2023**."
- **Not required for:** "In-House Advertising, including cross promotion whereby app publishers use SDKs to manage cross promotion of their apps or other owned media and merchandising"; and "Direct deals with advertisers and only using ads SDKs for inventory management."
- Source: [Participate in the Families Self-Certified Ads SDK Program — support.google.com/googleplay/android-developer/answer/9283445](https://support.google.com/googleplay/android-developer/answer/9283445)
- Program policy page (the rules an SDK must meet, incl. per-request/per-app child-directed treatment, age-appropriate creative rating, RTB creative review + privacy indicators): [support.google.com/googleplay/android-developer/answer/9900633](https://support.google.com/googleplay/android-developer/answer/9900633) and DPP §"Families Self-Certified Ads SDK Program".

### D4. AdMob tooling for Families + the TFCD/TFUA → TFAT change ⚠️

**This is the biggest 2026 change for child-directed apps.**

- AdMob's Families guidance: update to **Android 20.6.0 GMA SDK** or later and/or **iOS GMA SDK 7.67.0** or later "to ensure that the advertising ID is not transmitted when an ad request is tagged for child-directed treatment." Non-self-certified ad sources are automatically blocked from serving in child-only apps, or in apps using the child tag. Custom events in Families apps must use self-certified sources only.
- Source: [Comply with Google Play's Families Policy using AdMob — support.google.com/admob/answer/6223431](https://support.google.com/admob/answer/6223431)
- **TFCD and TFUA are deprecated; use TFAT (Tag For Age Treatment).** Verbatim: "The tag for under age of consent (TFUA) and the tag for child-directed treatment (TFCD) are now deprecated. Instead, use the Tag for age treatment (TFAT). … The TFAT 'child' value is functionally equivalent to the TFCD or TFUA child treatment tags." — [Tag an ad request from an app for age restricted treatment — support.google.com/admob/answer/6219315](https://support.google.com/admob/answer/6219315)
- **TFAT values** (same source):
  - **CHILD (=1):** "Personalized ads and remarketing are disabled. Requests to third-party ad vendors, such as ad measurement pixels and third-party ad servers, are disabled. Ad-serving protections for children are applied. The Android Advertising Identifier (AAID) and the iOS Identifier for Advertisers (IDFA) are **not transmitted**."
  - **TEEN (=2):** "Personalized ads and remarketing are disabled. Ad-serving protections for teens are applied."
  - **UNSPECIFIED (=0):** default.
  - TFAT is described as a tool for GDPR, COPPA, the UK Age Appropriate Design Code (AADC), and the Australia Online Safety Act.
- **API:** in the GMA Next-Gen SDK, `RequestConfiguration.Builder().setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)` with `TEEN` / `UNSPECIFIED` alternatives. Legacy `.setTagForChildDirectedTreatment()` / `.setTagForUnderAgeOfConsent()` still exist; "If you set age treatment setting and TFCD or TFUA settings, **Google applies the most conservative treatment.**" Mediation adapters forward the age-treatment signal to mediated third-party SDKs (a per-adapter minimum-version table is published). — [Set the age treatment — developers.google.com/admob/android/next-gen/targeting](https://developers.google.com/admob/android/next-gen/targeting)
- **COPPA warning on the child-directed tag:** "By setting this tag, you certify that this notification is accurate and you are authorized to act on behalf of the owner of the app. **You understand that abuse of this setting may result in termination of your Google Account.**" — same page.
- AdMob's Android privacy-strategy page repeats the deprecation and recommends the GMA SDK update: [Privacy strategies for Android — support.google.com/admob/answer/11402075](https://support.google.com/admob/answer/11402075)

### D5. Play Console: target audience, neutral age screen, and identifier bans

- You "must indicate the target audience for your app, prior to publishing, by selecting from the list of age groups provided." If serving ads to children, Play Console asks about the Families Self-Certified Ads SDK Program "or whether your app has a neutral age screen." You must have declared ads and added a privacy policy before completing this section.
- **Neutral age screen definition (verbatim):** "a mechanism to verify a user's age in a way that doesn't encourage them to falsify their age … for example, an age gate. An example of this would be a system that asks users to freely enter their month, day, and year of birth. **An incorrect setup … would be presetting the birth date to the required age (for example, 13 years old) or indicating that a certain age is required** to access areas of the app."
- Source: [Target audience and content — support.google.com/googleplay/android-developer/answer/9867159](https://support.google.com/googleplay/android-developer/answer/9867159)
- **Identifier prohibitions (Families policy):**
  - "Apps that **solely target children must not transmit** Android advertising identifier (AAID), SIM Serial, Build Serial, BSSID, MAC, SSID, IMEI, and/or IMSI." Also: "Apps solely targeted to children should not request **AD_ID** permission when targeting Android API 33 or higher."
  - "Apps that target **both children and older audiences must not transmit** AAID, SIM Serial, Build Serial, BSSID, MAC, SSID, IMEI, and/or IMSI **from children or users of unknown age**."
  - "Apps that solely target children may not request location permission, or collect, use, and transmit precise location."
- **Misrepresentation in Play Console:** "Misrepresentation of any information about your app in the Play Console, including in the Target Audience and Content section, **may result in removal or suspension** of your app."
- Source: [Families policy — support.google.com/googleplay/android-developer/answer/9893335](https://support.google.com/googleplay/android-developer/answer/9893335)

### D6. COPPA — what actually binds you

- **Rule:** 16 CFR Part 312, Children's Online Privacy Protection Act of 1998, 15 U.S.C. 6501–6505. Rule summary: "COPPA imposes certain requirements on operators of websites or online services **directed to children under 13 years of age**, and on operators of other websites or online services that have **actual knowledge** that they are collecting personal information online from a child under 13 years of age." Text of the (amended) Rule links to the **Federal Register, 22 April 2025**. — [Children's Online Privacy Protection Rule (COPPA) — ftc.gov](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
- **Explicitly covers ad-network collection:** the Rule applies to operators "directed to children under 13 that collect, use, or disclose personal information from children, **or on whose behalf such information is collected or maintained (such as when personal information is collected by an ad network to serve targeted advertising)**." — [Complying with COPPA: FAQ — ftc.gov](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- **The 8 operator duties** (verbatim summary, same FAQ): (1) post a clear and comprehensive online privacy policy; (2) "**Provide direct notice to parents and obtain verifiable parental consent**, with limited exceptions, before collecting personal information online from children"; (3) give parents the choice to consent to collection/internal use but prohibit third-party disclosure; (4) parental access/review/delete; (5) let parents prevent further use or collection; (6) maintain confidentiality/security/integrity; (7) retain only as long as necessary then delete; (8) "Not condition a child's participation … on the child providing more information than is reasonably necessary."
- **Persistent identifiers are "personal information":** the definition includes "A persistent identifier that can be used to recognize a user over time and across different websites or online services", and "the Rule defines 'collection' to include the **passive tracking** of children's personal information through a persistent identifier, and not just active collection." (16 C.F.R. § 312.2.)
- **The one relevant carve-out:** persistent identifiers collected **solely** for "support for the internal operations" of the site/service do not require parental notice or consent — and that definition **includes "serve contextual advertising or cap the frequency of advertising"** but the FTC states plainly: "**The term 'support for internal operations' does not include behavioral advertising.**" Also: a child-directed site **and** a third-party plug-in can both rely on the exception. — same FAQ (FAQ J.5–J.8)
- **Mixed-audience exception:** age-screening is permitted for a "mixed audience" service, but you "**may not block children from participating altogether**"; you may offer different activities by age, but "you may not collect personal information from users who have indicated they are under 13 without first obtaining verifiable parental consent." Note: "the 'mixed audience' category is a subset of the 'directed to children' category, and a general audience site does not become 'mixed audience' just because some children use the site." — same FAQ (FAQ D.5–D.6)
- **Ad-network "actual knowledge" signals:** the Commission's 2013 Statement of Basis and Purpose lists two scenarios likely to create actual knowledge, and flags that "if a formal industry standard or convention is developed through which a site or service could signal its child-directed status to you, that would give rise to actual knowledge." — same FAQ (FAQ E.1). (This is precisely the function of Play's tag/CD tag.)
- **2025–2026 developments:** FTC Press Release, **25 February 2026** — "FTC Issues COPPA Policy Statement to Incentivize the Use of Age Verification Technologies to Protect Children Online" ([link](https://www.ftc.gov/news-events/news/press-releases/2026/02/ftc-issues-coppa-policy-statement-incentivize-use-age-verification-technologies-protect-children)). The amended Rule text is the **22 April 2025** Federal Register publication. **NOT VERIFIED:** I did not extract the amendment's specific compliance-date provisions from the Federal Register text; confirm the exact compliance date for the 2025 amendments directly from the Federal Register document before relying on a date.

---

## E) Google Play "Ads" declaration

**Where:** Play Console → **Policy and programs → App content** page → "**Ads**" section → **Start** → review the [Ads policy](https://play.google.com/about/monetization-ads/ads/) → select **Yes** or **No** → **Save**.

**Is it mandatory?** Yes. "You must declare whether or not your app contains ads. **This includes ads delivered through third-party ad SDKs (Software Development Kit), display ads, native ads, and/or banner ads.** Apps that contain ads will have a 'Contains ads' label shown on their store listing. This label will be visible to all Play Store users."

**Answer "Yes" if** (examples given): you integrate an Ad SDK to show banners and/or interstitials (including to monetise *or* promote your own products/apps); you include native ads indistinguishable from content (sponsored articles, ads in a feed); you render house ads (banner, interstitial, ad wall, widget promoting your other apps).

**You may answer "No" if** you *only* cross-promote your own apps via a "More Apps" section in the main menu that (a) does not interfere with gameplay and (b) does not confuse the user by embedding itself within gameplay. Acceptable substitute labels: *More Games, More to Explore, Full Version, More, About Us,* or your Developer Icon.

**Note:** the "Contains ads" label "isn't meant to cover … paid product placement or offers to make in-app purchases or upgrades."

**Additional monitoring:** "While you're responsible for accurately declaring ad presence in your apps, **Google may verify this at any time and display the 'Contains ads' label if appropriate.**"

**Enforcement (verbatim):** "**If you misrepresent the presence of ads in your app(s), it's considered a violation of the Google Play policies and may result in your app(s) being suspended.**"

Source: [Prepare your app for review — support.google.com/googleplay/android-developer/answer/9859455](https://support.google.com/googleplay/android-developer/answer/9859455) (page confirms the Ad content flow verbatim; the same page also confirms the Ads declaration must precede the Target audience and content section — see §D5)

**Related:** the Data safety section is on the same App content page; the "Ads" declaration and the "Contains ads" badge are separate from (and in addition to) the Data safety declarations. AdMob also notes the declaration is required: [Privacy strategies for Android](https://support.google.com/admob/answer/11402075) links "declare whether or not your app contains ads" to the same App content page.

---

## F) Apple: declaring ad SDKs (privacy manifests & third-party SDK requirements)

### F1. Privacy manifest files

- Files are named **`PrivacyInfo.xcprivacy`** (the required file name) and may be bundled by "Apps and third-party SDKs — distributed as XCFrameworks, Swift packages, or Xcode projects."
- A manifest records: (a) "The types of data collected by your app or third-party SDK. You need to provide this information for your app or third-party SDK **on all platforms**"; and (b) "The required reasons APIs your app or third-party SDK uses … **on iOS, iPadOS, tvOS, visionOS, and watchOS**."
- Top-level keys: **`NSPrivacyTracking`** (Boolean — "whether your app or third-party SDK uses data for tracking as defined under the App Tracking Transparency framework"); **`NSPrivacyTrackingDomains`** ("An array of strings that lists the internet domains your app or third-party SDK connects to that engage in tracking. **If the user has not granted tracking permission through the App Tracking Transparency framework, network requests to these domains fail and your app receives an error.**"); **`NSPrivacyCollectedDataTypes`**; **`NSPrivacyAccessedAPITypes`**.
- Source: [Privacy manifest files — developer.apple.com/documentation/bundleresources/privacy-manifest-files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) (page published/updated **17 September 2026**)

### F2. The commonly-used third-party SDK list — which ad SDKs are on it

Source: [Third-party SDK requirements — developer.apple.com/support/third-party-SDK-requirements/](https://developer.apple.com/support/third-party-SDK-requirements/) (fetched 18 Sep 2026; full list extracted and confirmed complete)

Apple's rule: "The following are commonly used SDKs in apps on the App Store. **You must include the privacy manifest for any SDK listed below** when you submit new apps in App Store Connect that include those SDKs, or when you submit an app update that adds one of the listed SDKs as part of the update. **Signatures are also required** in these cases where the listed SDKs are used as binary dependencies. **Any version of a listed SDK, as well as any SDKs that repackage those on the list, are included in the requirement.**"

**Ad/monetisation-relevant entries on the list (complete):**
- **Meta:** `FBAEMKit`, `FBLPromises`, `FBSDKCoreKit`, `FBSDKCoreKit_Basics`, `FBSDKLoginKit`, `FBSDKShareKit`
- **Google:** `GoogleDataTransport`, `GoogleToolboxForMac`, `GoogleUtilities` (these are dependencies of the Google Mobile Ads SDK)
- **Unity:** `UnityFramework`

**Important negative finding:** the list contains **no** entry named `GoogleMobileAds` / `Google-Mobile-Ads-SDK`, and **no** entry for AppLovin, ironSource/LevelPlay, Unity Ads (`UnityAds`), Liftoff/Vungle, Mintegral, Pangle, Chartboost, InMobi, DT Exchange, AdColony, or Kidoz. **Do not tell the developer that "ad SDKs are on Apple's list" by name** — the named entries are Meta/Google-utility/Unity-engine libraries, and the requirement reaches ad SDKs indirectly through "any SDKs that repackage those on the list."

### F3. Required-reason APIs (a separate, universal requirement)

- "**Since May 1, 2024** — You'll need to include **approved reasons for the listed APIs used by your app's code (including from third-party SDKs)** to upload a new or updated app to App Store Connect." — [Upcoming Requirements — developer.apple.com/news/upcoming-requirements/](https://developer.apple.com/news/upcoming-requirements/) (also listed on the SDK-requirements page as "Privacy Manifests"/"Signatures for SDKs")
- Key/value detail: [Describing use of required reason API](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api)

### F4. Toolchain and other current Apple deadlines (affect what you can even upload)

From [Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/):

- **Since 28 April 2026:** "Apps uploaded to App Store Connect must be built with **Xcode 26** or later using an SDK for **iOS 26**, iPadOS 26, tvOS 26, visionOS 26, or watchOS 26."
- **Since 31 January 2026:** "Ratings for all apps and games on the App Store have been automatically updated to align with our new age rating system"; you must "provide responses to the updated age rating questions for each of your apps by January 31, 2026, to avoid an interruption when submitting your app updates in App Store Connect."
- **Since 17 February 2025:** DSA trader status required to submit app updates for apps distributed in the EU.

### F5. Is there an App Store Connect field that enumerates each SDK?

**NOT VERIFIED.** I found no official Apple documentation describing an App Store Connect UI field where you list individual third-party SDK names. The verified mechanism is: (1) privacy manifests + signatures for the listed SDKs (enforced at upload, e.g. missing manifests surface as `ITMS-91061`-class rejections per Apple Developer Forums reports — forum posts are **not** official documentation), (2) required-reason API declarations, and (3) the App Privacy nutrition label in App Store Connect, which requires you to account for what "third-party partners" (including advertising networks and third-party SDKs) collect.

---

## Practical checklist for an Indian solo developer (AdMob-funded, Play + App Store)

**Build-time / code**
1. Depend on a current AdMob SDK: `com.google.android.ump:user-messaging-platform` (currently `4.0.0`) for consent, and a GMA SDK at or above the Families floor (`play-services-ads` ≥ 19.0.0; Apple lists GMA iOS ≥ 7.64 for ATT-era features, and ≥ 7.67.0 for the Families ad-ID rule). Keep it current — see [UMP setup](https://developers.google.com/admob/android/privacy), [AdMob Families page](https://support.google.com/admob/answer/6223431).
2. Call `requestConsentInfoUpdate()` **every launch**, then `loadAndShowConsentFormIfRequired()`, gate ads on `canRequestAds()`, and render a visible privacy-options entry point whenever `getPrivacyOptionsRequirementStatus() == REQUIRED` (GDPR consent revocation is mandatory). Source: [developers.google.com/admob/android/privacy](https://developers.google.com/admob/android/privacy)
3. Add to `AndroidManifest.xml` the AdMob `APPLICATION_ID` meta-data; declare (or suppress) the `AD_ID` permission as your target-audience decision requires. Sources: [UMP setup](https://developers.google.com/admob/android/privacy), [Privacy strategies for Android](https://support.google.com/admob/answer/11402075), [AAID terms](https://support.google.com/googleplay/android-developer/answer/9857753)
4. For child-directed requests use **TFAT** (`AgeRestrictedTreatment.CHILD`) — not the deprecated TFCD/TFUA — and set `max_ad_content_rating` to G. The CHILD value suppresses AAID/IDFA, personalized ads, remarketing, and third-party ad-vendor requests. Sources: [support.google.com/admob/answer/6219315](https://support.google.com/admob/answer/6219315), [developers.google.com/admob/android/next-gen/targeting](https://developers.google.com/admob/android/next-gen/targeting)
5. iOS: add `NSUserTrackingUsageDescription`; call `requestTrackingAuthorization` before touching IDFA; never gate content or rewards on granting tracking; never fingerprint. Sources: [ATT docs](https://developer.apple.com/documentation/apptrackingtransparency), [User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/), [Guideline 5.1.2](https://developer.apple.com/app-store/review/guidelines/)
6. iOS: ship `PrivacyInfo.xcprivacy` covering `NSPrivacyTracking`, `NSPrivacyTrackingDomains`, `NSPrivacyCollectedDataTypes`, `NSPrivacyAccessedAPITypes`; include approved reasons for required-reason APIs (mandatory since 1 May 2024); confirm each third-party SDK you bundle ships its own manifest. Sources: [privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files), [third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/), [upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)
7. iOS: add buyer `SKAdNetworkIdentifier` values (Google's is `cstr6suwn9.skadnetwork`) to `Info.plist` — this is what keeps install attribution working when IDFA is denied. Source: [developers.google.com/admob/ios/ios14](https://developers.google.com/admob/ios/ios14)
8. Build with Xcode 26 / iOS 26 SDK or later (required since 28 Apr 2026), and answer the new age-rating questions (since 31 Jan 2026). Source: [upcoming requirements](https://developer.apple.com/news/upcoming-requirements/)

**AdMob console**
9. Create a **European regulations message** for apps and **add every mediation partner to its ad-partners list** — failure to do so "can lead to partners failing to serve ads." Source: [developers.google.com/admob/android/privacy/gdpr](https://developers.google.com/admob/android/privacy/gdpr)
10. Confirm you are on a **TCF v2.3**-writing CMP path. Google's CMP/UMP writes v2.3; if you use a third-party CMP, verify it. The IAB deadline (28 Feb 2026) and Google's deadline (1 Mar 2026) have both passed; non-v2.3 strings risk defaulting to Limited Ads. Sources: [iabeurope.eu](https://iabeurope.eu/transparency-consent-framework/), [support.google.com/admob/answer/9760862](https://support.google.com/admob/answer/9760862)
11. Optionally create a **US state regulations message** (20 states) and/or configure **Restricted Data Processing** — plus GPP signals. Not a hard gate like the EU CMP rule, but it is how you operationalise US opt-out duties. Sources: [support.google.com/admob/answer/10862202](https://support.google.com/admob/answer/10862202), [support.google.com/admob/answer/9561022](https://support.google.com/admob/answer/9561022), [create message](https://support.google.com/admob/answer/10860309)
12. Optionally enable the **IDFA explainer message** to improve ATT opt-in (it shows immediately before the iOS ATT alert). Sources: [support.google.com/admob/answer/10115027](https://support.google.com/admob/answer/10115027), [message types](https://support.google.com/admob/answer/10114020)
13. For iOS, consider splitting **mediation groups by IDFA availability** and keep bidding on. Source: [support.google.com/admob/answer/9997589](https://support.google.com/admob/answer/9997589)

**Play Console**
14. On **App content**: (a) add a privacy-policy URL that covers ad SDK data practices; (b) complete the **Ads declaration** — answer **Yes** if any ad SDK is present; (c) complete the **Data safety form** (mandatory for every published app) declaring Device or other IDs (AAID/app set ID), Approximate location (IP-derived), App interactions, App info and performance, purpose *Advertising or marketing*, encrypted in transit, plus a deletion-request mechanism; (d) declare **Target audience and content**; (e) if children are in the audience, answer the ads-SDK / neutral-age-screen questions. Sources: [App content](https://support.google.com/googleplay/android-developer/answer/9859455), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [target audience](https://support.google.com/googleplay/android-developer/answer/9867159)
15. Base the Data safety answers on [Google's own AdMob disclosure page](https://developers.google.com/admob/android/privacy/play-data-disclosure), and remember that ad-profile-building via an SDK counts as **sharing**, not a service-provider transfer. Source: [support.google.com/googleplay/android-developer/answer/10787469](https://support.google.com/googleplay/android-developer/answer/10787469)
16. Keep every declaration **truthful and current**. Misrepresenting ad presence "may result in your app(s) being suspended"; inaccurate Data safety declarations trigger "enforcement action"; suspensions become **strikes** and multiple strikes can terminate the account **and related accounts**, and a terminated account's reapplications are also terminated without refund. Sources: [App content](https://support.google.com/googleplay/android-developer/answer/9859455), [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [DPP §Enforcement](https://support.google.com/googleplay/android-developer/answer/17105854)

**If you target (or might attract) children**
17. Use **only Families self-certified ad SDK versions**. AdMob's `play-services-ads` is self-certified at 19.0.0+; **AppLovin is not in the program** (since 31 May 2023). Source: [support.google.com/googleplay/android-developer/answer/9283445](https://support.google.com/googleplay/android-developer/answer/9283445)
18. Ban the prohibited formats in the child/unknown-age path: **no interstitial on app launch**, no more than one ad placement per page, no ad walls / offerwalls / non-dismissible full-screen, no rewarded or opt-in ads that aren't closeable within **5 seconds**, ads clearly distinguishable from content. Source: [Families policy](https://support.google.com/googleplay/android-developer/answer/9893335)
19. Do not transmit AAID/IMEI/MAC/etc. from children or users of unknown age; implement a proper **neutral age screen** (do not pre-fill or hint an age) if the audience is mixed. Sources: [Families policy](https://support.google.com/googleplay/android-developer/answer/9893335), [target audience](https://support.google.com/googleplay/android-developer/answer/9867159)
20. Get COPPA right independently of Google: direct notice + **verifiable parental consent** before collecting personal information from under-13s; note that persistent identifiers are "personal information," that contextual advertising/frequency capping qualify as "support for internal operations" but **behavioral advertising does not**, and that mixed-audience age-gating cannot simply block children. Sources: [COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), [COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)

**Apple, if kids are the audience**
21. Guideline 5.1.4(a): "Apps intended primarily for kids **should not include third-party analytics or third-party advertising**." If you are in the Kids Category, expect this to be applied. Source: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## Explicit NOT VERIFIED list (do not treat as fact)

1. **NOT VERIFIED** — the actual contents of IAB Europe's CMP list ([iabeurope.eu/cmp-list/](https://iabeurope.eu/cmp-list/)) and of Google's named Google-certified CMP list ([support.google.com/admob/answer/13554116](https://support.google.com/admob/answer/13554116)). Both are JS/Cloudflare-gated and did not render. I have **not** confirmed Google's UMP by CMP-ID, nor enumerated any third-party CMP names. What *is* verified: Google states its Privacy & Messaging European regulations messages "are certified," and that "no action is required if you are using the Google CMP."
2. **NOT VERIFIED** — any specific revenue/eCPM percentage impact of ATT denial. No first-party source states a figure. Verified only: ads still serve without IDFA (contextual/NPA/Limited Ads), SKAdNetwork preserves install attribution, and Google warns of "eCPM fluctuations."
3. **NOT VERIFIED** — that Meta Audience Network, AppLovin, Unity Ads/LevelPlay, Liftoff/Vungle, Mintegral, Pangle, etc. each independently require an IAB-registered CMP. Only Google's publisher products are confirmed.
4. **NOT VERIFIED** — an App Store Connect field enumerating individual third-party SDKs. The verified mechanisms are privacy manifests, signatures, required-reason APIs, and the App Privacy nutrition label.
5. **NOT VERIFIED** — the exact compliance date attached to the 2025 COPPA Rule amendments (Federal Register, 22 Apr 2025). Only the Rule's scope and the FAQ's substantive duties were verified.
6. **PARTIALLY NOT VERIFIED** — the product labelling on AdMob's [Play data disclosure page](https://developers.google.com/admob/android/privacy/play-data-disclosure) says "Google Mobile Ads SDK (**Legacy**) … version **25.5.0**", while other current AdMob docs describe a "**Next-Gen**" SDK with a different API surface (`com.google.android.libraries.ads.mobile.sdk`) and the legacy `play-services-ads` API elsewhere. The two SDK lineages and which one a new solo developer should adopt are **not** resolved in this report; the *data categories* quoted from that page are explicit and usable, but confirm which SDK you are actually shipping before copying them into the Data safety form.
7. **NOT VERIFIED** — whether any *Indian* law (e.g. DPDP Act 2023 rules) adds consent/children's-data duties beyond the platform rules covered here. Out of scope for this report and not researched.
