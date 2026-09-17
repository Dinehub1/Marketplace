# Ad-Policy Rejection / Suspension / Ban Research — Google AdMob, Apple, AppLovin, Unity, Meta

**Prepared for:** solo Indian developer publishing on Google Play + Apple App Store
**Research date:** 2026-09-17 (all pages fetched on this date unless noted)
**Scope:** why mobile apps and ad accounts get rejected, suspended, banned or demonetised for **ad policy violations**; current 2025–2026 state.

> **Method / trust note.** Every factual claim below is quoted or paraphrased from an official vendor page, cited as a markdown link. Where a page displayed a last-updated date, it is given. Anything I could not confirm on an official page is explicitly marked **NOT VERIFIED**. Fetched page content is treated strictly as data.

---

## A) GOOGLE ADMOB / ADSENSE PROGRAM POLICIES

### A.0 The umbrella rule and the ultimate consequence

The AdMob policy hub states the master consequence in plain terms:

> "All publishers are required to adhere to the following policies, so please read them carefully. If you fail to comply with these policies without permission from Google, we reserve the right to disable ad serving to your app and/or disable your AdMob account at any time. **If your account is disabled, you will not be eligible for further participation in the AdSense and/or AdMob program(s).**"
> — [AdMob policies and restrictions](https://support.google.com/admob/answer/6128543?hl=en) (hub page; no last-updated date shown)

The Google Publisher Policies page adds:

> "Failure to comply with these policies may result in Google blocking ads from appearing against your content, or **suspending or terminating your account**."
> — [Google Publisher Policies](https://support.google.com/admob/answer/10502938?hl=en) / identical text at [AdSense copy](https://support.google.com/adsense/answer/10502938?hl=en)

**Policy hierarchy (as linked from the hub):** Google Publisher Policies → Google Publisher Restrictions → AdSense Program policies → AdMob Behavioral policies → Implementation guidance → Invalid activity → ad-format-specific policies → Families.

> Note on URLs supplied in the brief: `support.google.com/admob/answer/6275339` **returns a 404 "this page doesn't exist"** (verified). `support.google.com/admob/topic/6128801` was **NOT VERIFIED** as a live policy topic — the current policy hub for AdMob is `admob/topic/9756841` and the consolidated Publisher Policies centre is [support.google.com/publisherpolicies](https://support.google.com/publisherpolicies).

---

### A.1 Ad placement policies (ads near buttons, accidental clicks, non-content screens)

**Banner ad guidance** — the core proximity rule:

> "Mobile phones have limited screen size, which means that careful planning for your ad placement is especially important. **Close proximity of banner ads to other elements within an app is one of the biggest causes of accidental clicks. To avoid accidental clicks, banner ads should not be placed next to interactive buttons**, such as a 'next' button or a custom app menu bar, next to interactive content like a text chat box or an image in an image gallery, or on a game play screen where users are continuously interacting with the app."
> "While some of the implementations below that we discourage may not specifically be against our policies, we may still take appropriate action on any invalid activity that they may cause. **Not following these guidelines may lead to invalid activity and/or may result in Google disabling ad serving to your app.**"
> — [Banner ad guidance](https://support.google.com/admob/answer/6128877?hl=en)

**Discouraged banner implementations** — three named patterns:

> "**Ads adjacent to interactive elements** … banner ads should not be placed immediately next to interactive elements and app content, which can include (but is not limited to): Navigational buttons…; Interactive content like a text chat box or an image in an image gallery. On a game play screen where users are continuously interacting with the app. This banner ad placement **can put your app or your account at risk** if too many accidental clicks occur…"
> "**Ad sandwiched between app items** … Users are likely to cross this banner ad multiple times while at a higher level of engagement with the app… This banner ad placement can put your app or your account at risk…"
> "**Ad overlapping with app content (against policy)** — Banner ads should not float or hover over app content. If an app has a scrolling menu, banner ads should not pop-up or be placed over the content of this menu… Also, banner ads should not move as a user scrolls… **This specific implementation is against policy and we reserve the right to disable ad serving to your app.**"
> — [Discouraged banner implementations](https://support.google.com/admob/answer/6275345?hl=en)

**Publisher Policy — "Ads interfering"** (this is the *policy*, not just guidance):

> "We do not allow Google-served ads that:
> • overlay or are adjacent to navigational or other action items and may lead to unintended ad interactions,
> • severely interfere with consumption of content including overlaying the content or pushing the content off the display,
> • are placed on a 'dead end' screen where the user is not able to exit the screen without clicking the ad."
> — [Ads interfering](https://support.google.com/publisherpolicies/answer/11035030)

Expanded tips on the same page: ads should not sit next to "Previous/Next" buttons, game windows, video players, drop-down menus; "The positioning of advertising and other promotional material should not push the publisher-content off the display"; "**Google-served ads cannot overlay or obscure other ads.**"

**Ads on non-content / low-value screens** (the "ad-wrapper app" killer):

> "We do not allow Google-served ads on screens:
> • without publisher-content or with low-value content,
> • that are under construction,
> • that are used for alerts, navigation or other behavioral purposes"
> "Additional examples…: Ads should not be placed on 'dead end' or no content screens (e.g., Thank You, Exit, Error pages, etc.). Ads should not be placed within apps where the sole focus of the interaction is the user looking away from the screen. For example, **a flashlight app**. Don't place ads on automatically generated content without manual review or curation."
> — [Google-served ads on screens without publisher-content](https://support.google.com/publisherpolicies/answer/11112688)

**Accidental-click mitigation — Ad serving status "Confirmed Click":**

> "Google Ads has determined that certain ads on your app are generating unintended clicks… Google Ads has added Confirmed Click on its affected ads. Confirmed Click adds a second click that improves the user experience by letting the user confirm their intent to visit the advertised page."
> — [Understand policy issues… and ad serving statuses](https://support.google.com/admob/answer/15697162?hl=en)

**Reserve ad space / refresh behaviour** (implementation guidance):

> "Make sure to prepare fixed space for ads when loading a new screen in your app… ensure that ads do not cover or shift the other content to prevent accidental clicks."
> "We recommend that you have ads persist for 60 seconds or longer… if users navigate to and from pages with ads in an app over a short period of time, a new ad request should not be made sooner than the recommended 60 second rate."
> — [Implementation guidance](https://support.google.com/admob/answer/2936217?hl=en)

---

### A.2 Invalid traffic / invalid impressions & clicks

> "**Invalid traffic includes any clicks or impressions that may artificially inflate an advertiser's costs or a publisher's earnings. Invalid traffic covers intentionally fraudulent traffic as well as accidental clicks.**
> Invalid traffic includes, but is not limited to:
> • Clicks or impressions generated by publishers clicking on their own live ads
> • Repeated ad clicks or impressions generated by one or more users
> • Publishers encouraging clicks on their ads (examples may include: any language encouraging users to click on ads; ad implementations that may cause a high volume of accidental clicks; and so on)
> • Automated clicking tools or traffic sources, robots, or other deceptive software"
> "…if we are unable to verify the quality of your traffic, we may limit or disable your ad serving."
> "We understand that a third party may generate invalid traffic on your ads without your knowledge or permission. **However, ultimately it is your responsibility as the publisher to ensure that the traffic on your ads is valid.**"
> — [Invalid traffic](https://support.google.com/admob/answer/3342054?hl=en)

**Self-clicking / testing live ads** (Behavioral policies):

> "Publishers may not click their own ads or use any means to inflate impressions and/or clicks artificially, including manual methods. **Testing your own ads by clicking on them is not allowed.** Please use **test ads**…"
> — [Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en) (page states **Last updated: August 16, 2024**)

**Same rule restated under AdSense Program policies:**

> "**Invalid clicks and impressions** — Publishers may not click their own ads or use any means to inflate impressions and/or clicks artificially, including manual methods."
> — [AdSense Program policies](https://support.google.com/admob/answer/48182?hl=en) (page states **Last updated: August 4, 2026**)

**The legitimate alternative — test ads / test devices** (exact official wording):

> "**Don't click your own ads, even if you think it's okay to do so** … Use test ads… to avoid generating invalid clicks."
> "**Use test ads** — Clicking live ads in your own app is not allowed… If you click too many ads without being in test mode, your account can be flagged for invalid activity.
> There are two ways to implement test ads:
> 1. Use one of Google's sample ad units. Google provides sample ad unit IDs to test your ads.
> 2. Use your own ad unit and **enable test devices**. You can configure your device as a test device and use your own ad unit IDs that you've created in the AdMob UI."
> "**Avoid partnering with untrusted/low-quality parties** — Some publishers have had issues with invalid activity when partnering with low-quality ad networks or app promotion sites in efforts to increase traffic to their app."
> — [How you can prevent invalid activity](https://support.google.com/admob/answer/3342099?hl=en)

**Documented "top reasons accounts are suspended for invalid traffic":**

> "**Clicking the ads on your own app** — Publishers may not click their own ads… Testing your own ads by clicking on them is not allowed."
> "**One or more users repeatedly clicking the ads on your app** — Publishers may not ask others to click their ads. This includes asking for users to support your app, offering rewards to users for clicking ads, and promising to raise money for third parties for such behavior."
> "**Ad placement deceptive for users or generating accidental clicks** — …placing ads too close to clickable elements on the app, implementing ads in a way that prevents users from viewing the app's core content and functionality, and modifying the ad size to be nonstandard, invisible, or hard to see for the user."
> — [Invalid activity: Suspended account](https://support.google.com/admob/answer/6213019?hl=en)

**"Limited ad serving"** — the pre-ban enforcement stage:

> "Google may sometimes place a limit on the number of ads your AdMob account can show. This might be a temporary ad serving limit to evaluate your traffic quality, or it might be because we've identified invalid traffic concerns… **While this ad serving limit typically impacts publishers for less than 30 days, it may take longer in some cases.**"
> "**Invalid traffic concerns** — Ad serving on your account is currently being limited due to invalid traffic concerns… In this case, limited ad serving applies to AdMob Network only and doesn't affect third-party mediation, house ads, and direct sold campaigns."
> — [Ad serving limits](https://support.google.com/admob/answer/9493252?hl=en)

---

### A.3 Interstitial / full-screen ad policies

**Interstitial ad guidance:**

> "Interstitial ads are designed to be placed between content, so they are best placed at natural app transition points… **Not following these guidelines may lead to invalid activity and/or may result in Google disabling ad serving to your app.**"
> "Remember that **ads should never be the primary focus of the app**…"
> "Also, note that some interstitial ads may have up to a 5-second delay before providing a close option."
> — [Interstitial ad guidance](https://support.google.com/admob/answer/6066980?hl=en)

**Disallowed interstitial implementations — the launch/exit rule (exact text):**

> "**App load or exit** — Do not place interstitial ads on app load and when exiting apps as interstitials should only be placed in between pages of app content. Ads should not be placed in applications that are running in the background of the device or outside of the app environment. It should be clear to the user which application the ad is associated with or implemented on. We recommend placing an app open ad when loading an app or switching back to it."
> "**Repeated or recurring interstitials** — Don't overwhelm users with interstitial ads. Repeated interstitial ads often lead to poor user experiences and accidental clicks. Examples of non-compliant implementations include but are not limited to:
> • Placing an interstitial ad after every user action, including but not limited to clicks, swipes, etc. **You should place no more than one interstitial ad after every two user actions within your app.** Please note that this requirement also applies when a user clicks the *Back* button within the app.
> • Placing an interstitial ad immediately after another interstitial ad was shown to and closed by the user."
> "**Interstitials that impact navigation** — Ads should not be placed in a way that prevents viewing the app's core content. Ads should not be placed in a way that interferes with navigating or interacting with the app's core content and functionality."
> "**Interstitials that unexpectedly launch** — Don't surprise users with interstitial ads. Placing interstitial ads so that they suddenly appear when a user is focused on a task at hand (e.g. playing a game, filling out a form, reading content) may lead to accidental clicks… interstitial ads should only be implemented at logical breaks in between your app's content (e.g. pages, stages, or levels)… A common issue is that even though you may intend for the ad to load in between page content, the ad itself appears shortly after a new page of content has loaded due to carrier latency. **To prevent this from happening, we recommend you pre-load the interstitial in advance.**"
> — [Disallowed interstitial implementations](https://support.google.com/admob/answer/6201362?hl=en)

**Better Ads Standards (policy-level requirement):**

> "You must not: place Google-served ads on screens that do not conform to the Better Ads Standards."
> — [Better Ads Standards](https://support.google.com/publisherpolicies/answer/11127848); also in [Google Publisher Policies](https://support.google.com/admob/answer/10502938?hl=en) → "Requirements and other standards"

---

### A.4 Encouraging clicks / incentives

> "**Users should not be encouraged to click on ads.** Phrases such as 'click the ads' or similar language are not allowed. **Any compensation or other incentives to click ads are strictly prohibited.** Additionally, incentivizing users in any way to click on links and/or non-AdMob ads is also prohibited, as it may train users to perform actions (such as clicking on ads) that cause invalid activity."
> — [Implementation guidance](https://support.google.com/admob/answer/2936217?hl=en)

> "**Encouraging clicks or views (non-rewarded inventory)** — Except for rewarded inventory, publishers may not ask others to click or view their ads or use deceptive implementation methods to obtain clicks or views. This includes, but is not limited to, offering compensation to users for viewing ads or performing searches, promising to raise money for third parties for such behavior or **placing images next to individual ads**."
> — [AdSense Program policies](https://support.google.com/admob/answer/48182?hl=en)

> "**Apps that offer compensation programs** — Google ads may not be placed on apps that promise payment or incentives to users who click on or view ads. Placing Google ads on such apps may result in invalid impressions or clicks and is therefore prohibited. Similarly, Google ads may not be placed on apps that primarily drive traffic to, promote, or provide instructional materials on how to implement such services."
> — [Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en)

**Rewarded ads (the safe harbour) — key constraints, quoted:**

> "1. **Direct monetary items may not be offered as rewards under any circumstance.**
> 2. Indirect or non-monetary items may be offered as rewards, provided that: The reward is only redeemable and usable for an item or service within the publisher's platform, website or app; The reward is **non-transferable**…; Rewards that are a discount or voucher for physical items must not exceed 25% of the item's total value.
> 3. Random rewards are allowed, provided that: The chance of random rewards is disclosed to the user **prior** to Rewarded Ads being presented…; Details on all possible rewards are made easily accessible… This includes stating if not receiving a reward is a possible outcome; and **The chance for receiving a reward must be greater than 0.**"
> "…Rewarded Ads must not oblige users to interact with it (for example, it must be possible to skip or dismiss them)… **Publishers must not include any text or icons, other than to describe the reward(s) offered, to mislead or incentivize users towards a particular choice (such as by indicating 'watch this ad to support our business').**"
> — [Policies for ad units that offer rewards](https://support.google.com/admob/answer/7313578?hl=en)

> ⚠️ **The distinction that matters:** rewarding a user for **watching a rewarded video to completion** is permitted (subject to the rules above); rewarding a user for **clicking an ad** is prohibited outright.

---

### A.5 Ads in apps with plagiarised / copied / store-violating content

**Intellectual property abuse (Google Publisher Policies):**

> "We do not allow content that: infringes copyright… sells or promotes the sale of counterfeit products."
> — [Google Publisher Policies](https://support.google.com/admob/answer/10502938?hl=en)

**Framing third-party content (Behavioral policies):**

> "When an app displays someone else's site within a frame, this is considered framing content. **Publishers are not permitted to frame third party content and monetize it without permission from the owners of that content.** If a publisher owns the content, it can be framed in their app and monetized."
> — [Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en)

**Apps that violate store policy — a named Publisher *Restriction*:**

> "**App removed from Google Play Store** — Is an app that: is removed from the Google Play Store for a violation of Google Play policies."
> — [App removed from Google Play Store](https://support.google.com/publisherpolicies/answer/10437964); listed under Content restrictions in [Google Publisher Restrictions](https://support.google.com/admob/answer/10437795?hl=en)

**Dedicated AdMob help article for the store-policy case:**

> "If your app is removed from the Google Play store for a violation of Play Policies, **Google will restrict ad serving for that app until you resolve your issues with the Google Play store and your app has been reinstated.**"
> "It can take up to 2-3 days after your app reappears in the Google Play store for ad serving to be re-enabled."
> — [Google Play policy restriction: Disabled app](https://support.google.com/admob/answer/6195019?hl=en)

---

### A.6 Consequences, appeals, and the Policy center / warning system

**Ad serving statuses you can receive (official table):**

| Status | What it means |
|---|---|
| **Disabled ad serving** | "All advertising is blocked on your app. Your app isn't serving ads due to a policy violation." |
| **Restricted ad serving** | "There are restrictions on the advertisers that can bid on your inventory… likely to have little or no buyer demand." |
| **Ad serving at risk** | "Ad serving isn't affected yet, but you'll need to make changes… This is due to a **warning** on your app. Warnings typically include enforcement dates." |
| **Limited ad serving** | "Google has placed a limit on the number of ads your AdMob account can show." |
| **Confirmed Click on** | accidental-click mitigation applied to ads |
| **Restricted ad personalization** | no certified CMP (EEA/UK/CH) |

> "Repeated policy violations may lead to an **account suspension**."
> "Violations of the Program policies may result in ad serving restrictions, disabled ad serving, account suspensions, or account termination."
> — [Understand policy issues… and ad serving statuses](https://support.google.com/admob/answer/15697162?hl=en)

**Warning → enforcement flow (the "typical effect" of a policy email):**

> "Some policy issues, regulatory issues, and advertiser preferences have a **warning period before action is taken** on your ad serving. If you receive a warning, it means that your app is not currently in compliance with the Program policies… **If you don't make changes, further actions may be taken on your app or account.**"
> "Check your Policy center for the '**fix by**' date."
> — [Understand policy issues… and ad serving statuses](https://support.google.com/admob/answer/15697162?hl=en)

**Where you see it:** AdMob UI → **Policy center** in the sidebar → "Fix" → "Issue details" → optional screenshots of the violation → **Start review process**.

> "Use the Policy center to help you resolve issues quickly and efficiently to minimize the impact to your ad serving. **You can request a review of your app once you have fixed the issue, or if you believe your app has been incorrectly labelled with an issue.**"
> "**Note**: You must request a review for each app with policy enforcement(s) in your Policy center for ad serving to continue in that app."
> "If you're requesting a review because you've fixed issues in a new version of your app, **make sure you upload the new version of your app to your respective app store before you request a review.**"
> Review reasons offered in the UI: (1) fixed without a new version; (2) uploaded a new version containing the fix; (3) "There are no issues on this app".
> "**Note**: The policy violation will be removed from the Policy center once there are **no ad requests coming in from the app** that had a violation."
> — [Fix policy issues that affect ad serving](https://support.google.com/admob/answer/9192065?hl=en)

**App-level vs account-level appeals:**

> "**Appeal process for app-level violations** — For app-level violations, you'll be notified in the AdMob Policy center and via email… You can request a review of your app in the Policy center once you have fixed the issue… **If your appeal is rejected, we suggest you review the policy details and the changes you have made again… After that, please submit another appeal for the violation through the Policy center.**"
> "**Appeal process for account-level violations** — For account-level violations, you'll be notified via email… search the inbox of the email address associated with your AdMob account for emails from **admob-noreply@google.com**… you can request a review of your account by submitting an AdMob policy appeal."
> — [AdMob policy violation: Disabled app(s) or account](https://support.google.com/admob/answer/6195033?hl=en)

**Suspension (invalid traffic) — explicitly non-appealable, and can escalate to permanent disable:**

> "If we determine that your account has invalid traffic, then we may **suspend your account and refund all account earnings associated with violations** (along with Google's revenue share) to impacted advertisers (where appropriate and possible)."
> "Account suspension gives you time to investigate the sources of invalid traffic, identify and block suspicious traffic, and put measures in place to ensure clean traffic. **Suspensions are non-appealable.**"
> "**Note:** If any additional issues are found in your AdMob account in the interim period of suspension, your account may be **permanently disabled even before the suspension period ends.**"
> — [Invalid activity: Suspended account](https://support.google.com/admob/answer/6213019?hl=en)

**Permanent disable (invalid activity) — likely the worst realistic outcome for a solo dev:**

> "Because we have a need to protect our proprietary detection system, **we're unable to provide our publishers with any information about their account activity**, including any apps, users, or third-party services that might have been involved."
> "…if you can maintain in good faith that the invalid activity was not due to the actions or negligence of you or those for whom you are responsible, you may appeal the disabling of your account… **there is no guarantee that your account will be reinstated. Once we've reached a decision on your appeal, further appeals may not be considered**, and you might not receive any further communication from us."
> "**My account was disabled and my appeal was denied. Is there any way I can rejoin the program? Can I open a new account?** … Though you might be disappointed with our decision, **we are unable to reinstate your account.** Please also note that publishers disabled for invalid activity are **not allowed any further participation in AdSense**. For this reason, these publishers **may not open new accounts.**"
> "**Will I still be paid out for my earnings?** Publishers disabled for invalid traffic and/or violations of our publisher policies **may be eligible for a final payment of the portion of their revenue that has not been identified as invalid. Upon account disablement, a payment hold of at least 30 days will be applied**… Deductions from your final balance… will be refunded to affected advertisers where appropriate and possible."
> "**My account was disabled for being related to another disabled account** … Google reserves the right to disable an account for any reason. **If someone related to me creates an AdMob account, will their account be disabled as well?** If we determine that a related publisher's account might pose a risk… we may disable it."
> — [Invalid activity: Disabled account](https://support.google.com/admob/answer/6197403?hl=en)

**Closing a new account after a ban = duplicate account = both closed** (Behavioral policies):

> "Publishers whose accounts are closed for invalid activity or violating our policies may not be allowed any further participation in other Google publisher monetization solutions. This means, for example, that if a publisher had an AdMob account closed for invalid activity or policy violations, they would not be able to use AdSense to monetize, and vice versa. For this reason, these publishers may not open new accounts. **If a publisher opens additional accounts, the accounts will be flagged as duplicates and then one or both accounts will be closed.**"
> — [Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en)

**Appeals (account-level, current links):**

| Case | Form |
|---|---|
| Invalid traffic | [Invalid traffic appeal form](https://support.google.com/adsense/troubleshooter/2707037) |
| Policy reasons | [Policy violation appeal – account disabled](https://support.google.com/admob/contact/appeal_account_disable) |
| Policy disabled (from account-appeals page) | [AdMob policy account appeal](https://support.google.com/adsense/contact/policy_disabled_appeal) |

Source: [Account issues FAQ](https://support.google.com/admob/answer/9686306?hl=en)

**What does NOT stop when AdMob ad serving is disabled (important nuance):**

> "**What happens to AdMob Mediation if AdMob ad serving was disabled to my app due to a specific policy violation?** … while you are fixing the policy issue within your app(s) or account, **mediated third-party network ads, house ads, and Reservation campaigns will continue to serve as normal through AdMob Mediation**. However, if your account or app is in violation of **platform policies**, you will **not be eligible for further participation in the AdSense and/or AdMob program(s) including AdMob Mediation.**"
> — [Account issues FAQ](https://support.google.com/admob/answer/9686306?hl=en)

**Mandatory app verification (2025 rollout) — a *new* way to lose ad serving:**

> "**Starting January 2025, you will be required to verify new apps** that you set up in AdMob with an app-ads.txt file… Eventually all AdMob publishers will be required to verify their apps with an app-ads.txt file. We're continuing to roll out app verification throughout 2025."
> "Apps won't be able to fully serve ads until they're verified with an app-ads.txt file and approved after the app readiness review."
> — [Verify your app with app-ads.txt](https://support.google.com/admob/answer/14538460?hl=en)

---

### A.7 Google Play's own ad rules (an app can be pulled from Play before AdMob ever acts)

Because a Play removal automatically restricts AdMob ad serving (A.5), these matter directly.

> "**Disruptive Ads** — Disruptive ads are ads that are displayed to users in unexpected ways, that may result in inadvertent clicks, or impairing or interfering with the usability of device functions. **Your app cannot force a user to click an ad or submit personal information for advertising purposes before they can fully use an app.** Ads may only be displayed inside of the app serving them and must not interfere with other apps, ads, or the operation of the device, including system or device buttons and ports… **If your app displays ads or other ads that interfere with normal use, they must be easily dismissible without penalty.**"
> "**Better Ads Experiences** … Your ads may not be shown in the following unexpected ways for users:
> • **Full screen interstitial ads of all formats (video, GIF, static, etc.) that show unexpectedly**, typically when the user has chosen to do something else, are not allowed.
>   – Ads that appear during game play at the beginning of a level or during the beginning of a content segment are not allowed.
>   – **Full screen video interstitial ads that appear before an app's loading screen (splash screen) are not allowed.**
> • **Full screen interstitial ads of all formats that are not closeable after 15 seconds are not allowed.** Opt-in full screen interstitials or full screen interstitials that do not interrupt users in their actions (for example, after the score screen in a game app) may persist more than 15 seconds.
> This policy does not apply to rewarded ads which are explicitly opted-in by users…"
> "**Made for Ads** — We don't allow apps that display interstitial ads repeatedly to distract users from interacting with an app and performing in-app tasks."
> "**Deceptive Ads** — Ads must not simulate or impersonate the user interface of any app feature, such as notifications or warning elements of an operating system."
> "**Lockscreen Monetization** — Unless the exclusive purpose of the app is that of a lockscreen, apps may not introduce ads or features that monetize the locked display of a device."
> — [Ads (Play Console Help)](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)

**Play "Ad Fraud" policy:**

> "Ad fraud is strictly prohibited. Ad interactions generated for the purpose of tricking an ad network into believing traffic is from authentic user interest is ad fraud, which is a form of invalid traffic… Here are some examples of common violations:
> • An app that renders ads that are not visible to the user.
> • An app that automatically generates clicks on ads without the user's intention…
> • An app sending fake installation attribution clicks to get paid for installations that did not originate from the sender's network.
> • An app that pops up ads when the user is not within the app interface.
> • False representations of the ad inventory by an app, for example, an app that communicates to ad networks that it is running on an iOS device when it is in fact running on an Android device; an app that misrepresents the package name that is being monetized."
> — [Ad Fraud](https://support.google.com/googleplay/android-developer/answer/9969955?hl=en)

**Play Families ads rules (child-directed apps) — strict and highly automated:**

> "If your app displays ads to children or to users of unknown age, you must: Only use Google Play Families Self-Certified Ads SDKs…; Ensure ads displayed to those users **do not involve interest-based advertising**… or remarketing…; Ensure ads displayed to those users present content that is appropriate for children…"
> Prohibited for child/unknown-age users: "Disruptive monetization and advertising, including… that take up the entire screen or interfere with normal use and do not provide a clear means to dismiss the ad (for example, Ad walls)"; "Monetization and advertising that interfere with normal app use or game play, including rewarded or opt-in ads, **that are not closeable after 5 seconds**"; "**Interstitial monetization and advertising displayed immediately upon app launch**"; "**Multiple ad placements on a page** (for example, banner ads that show multiple offers in one placement or displaying more than one banner or video ad is not allowed)"; "**Monetization and advertising that are not clearly distinguishable from your app content, such as offerwalls and other immersive ads experiences**"; "**Deceptive ads that force the user to click-through by using a dismiss button to trigger another ad**…"
> — [Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)

**Play strikes → account termination:**

> "Multiple removals or warnings may result in an app suspension, and **app suspensions count as strikes against the good standing of your Google Play Developer account. Multiple suspensions or suspensions for egregious policy violations may also result in the termination of your Google Play Developer account.**"
> "When your developer account is terminated, **all apps in your catalog will be removed from Google Play** and the users, statistics, and ratings associated with those apps will be forfeited. Additionally, you will no longer be able to publish new apps. **Do not attempt to register for a new Google Play Developer account.**"
> "…any **related Google Play Developer accounts are also terminated**, and any new accounts that you try to open will be terminated **without a refund of the developer registration fee.**"
> "**Appeals** — … You may submit **one appeal per account termination.**"
> — [Understanding Google Play developer account terminations](https://support.google.com/googleplay/android-developer/answer/2491922?hl=en)

> "**Fair warnings** — Google is not required to send you a warning prior to suspension or termination. … A warning tells you that your app is close to being suspended. **Failure to address the issue, or launching a second app that does the same thing, will almost certainly result in your app's suspension, or even termination of your developer account.**"
> — [Fair warnings](https://support.google.com/googleplay/android-developer/answer/2985876?hl=en)

---

## B) APPLE APP STORE REVIEW GUIDELINES

**Source:** [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — Apple labels it "a living document"; the page shows **no last-updated date** (NOT VERIFIED for a specific revision date). The [App Review landing page](https://developer.apple.com/app-store/review/) reports a published time of **30 Jan 2026**. All quotes below are the current text as fetched 2026-09-17.

### B.1 Guideline 3.2.2 "Unacceptable" — the spam / ad-display rule

> **3.2.2 Unacceptable**
> "(i) Creating an interface for displaying third-party apps, extensions, or plug-ins similar to the App Store or as a general-interest collection.
> (ii) Intentionally omitted.
> **(iii) Artificially increasing the number of impressions or click-throughs of ads, as well as apps that are designed predominantly for the display of ads.**
> (iv) Unless you are an approved nonprofit or otherwise permitted under Section 3.2.1 (vi) above, collecting funds within the app for charities and fundraisers…
> (v) Arbitrarily restricting who may use the app, such as by location or carrier.
> (vi) Intentionally omitted.
> (vii) Artificially manipulating a user's visibility, status, or rank on other services unless permitted by that service's Terms and Conditions.
> (viii) Apps that facilitate binary options trading are not permitted on the App Store…
> (ix) Apps offering personal loans must clearly and conspicuously disclose all loan terms…
> **(x) Apps must not force users to rate the app, review the app, download other apps, or other store-related actions in order to access functionality, content, or use of the app. Apps may otherwise incentivize users to take specific actions within apps (e.g. completing a level, watching an ad).**"
> — [Guidelines §3.2.2](https://developer.apple.com/app-store/review/guidelines/#3.2.2)

Note (x): **watching an ad may be incentivised; a store action may not.** This is Apple's explicit carve-out for rewarded video.

### B.2 Guideline 4.2 Minimum Functionality — the "ad wrapper" killer

> **4.2 Minimum Functionality**
> "Your app should include features, content, and UI that elevate it beyond a repackaged website. **If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store. If your App doesn't provide some sort of lasting entertainment value or adequate utility, it may not be accepted.** Apps that are simply a song or movie should be submitted to the iTunes Store. Apps that are simply a book or game guide should be submitted to the Apple Books Store."
> "**4.2.2 Other than catalogs, apps shouldn't primarily be marketing materials, advertisements, web clippings, content aggregators, or a collection of links.**"
> "4.2.6 Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content…"
> — [Guidelines §4.2](https://developer.apple.com/app-store/review/guidelines/#4.2)

Apple's own App Review page names this as a common rejection reason:

> "**Not enough lasting value** — If your app doesn't offer much functionality or content, or only applies to a small niche market, it may not be approved."
> "**Web clippings, content aggregators, or a collection of links** — Your site should be engaging and useful… Websites served in an iOS app, web content that is not formatted for iOS, and limited web interactions do not make a quality app."
> — [App Review](https://developer.apple.com/app-store/review/)

### B.3 Guideline 4.3 Spam and the Developer Code of Conduct

> **4.3 Spam**
> "(a) Don't create multiple Bundle IDs of the same app… This practice results in unnecessary apps…
> (b) **Don't submit apps that are indistinguishable from what's already widely available.** Opportunistically creating variants of existing app categories or popular apps degrades App Store discovery, reduces overall app quality, and harms both users and developers. Certain kinds of apps, such as dating, flashlight, sound effects, wallpaper, simple timers, and fortune telling, are well established on the App Store and **we will not accept new submissions unless they offer a meaningfully different or improved experience**… Repeated submissions of this kind may lead to **removal from the Apple Developer Program.**"
> — [Guidelines §4.3](https://developer.apple.com/app-store/review/guidelines/#4.3)

> **5.6 Developer Code of Conduct**
> "…**Your Developer Program account will be terminated if you engage in activities or actions that are not in accordance with the Developer Code of Conduct.** To restore your account, you may provide a written statement detailing the improvements you plan to make. If your plan is approved by Apple and we confirm the changes have been made, your account may be restored."
> "Repeated manipulative or misleading behavior or other fraudulent conduct will lead to your removal from the Apple Developer Program."
> "Apps should never prey on users or attempt to rip off customers, trick them into making unwanted purchases, force them to share unnecessary data, raise prices in a tricky manner, charge for features or content that are not delivered, or engage in any other manipulative practices within or outside of the app."
> — [Guidelines §5.6](https://developer.apple.com/app-store/review/guidelines/#5.6)

And from the guidelines introduction:

> "**If you attempt to cheat the system** (for example, by trying to trick the review process, steal user data, copy another developer's work, manipulate ratings or App Store discovery) **your apps will be removed from the store and you will be expelled from the Apple Developer Program.**"
> "**You are responsible for making sure everything in your app complies with these guidelines, including ad networks, analytics services, and third-party SDKs**, so review and choose them carefully."
> — [Guidelines, Introduction](https://developer.apple.com/app-store/review/guidelines/)

### B.4 Guideline 2.5.18 — the *core* Apple ad rule (dismissibility, ad labelling, reporting)

This is the single most important Apple ad-placement rule and is directly quotable:

> **2.5.18** "Display advertising should be limited to your main app binary, and should not be included in extensions, App Clips, widgets, notifications, keyboards, watchOS apps, etc. Ads displayed in an app must be appropriate for the app's age rating, allow the user to see all information used to target them for that ad (without requiring the user to leave the app), and may not engage in targeted or behavioral advertising based on sensitive user data such as health/medical data (e.g. from the HealthKit APIs), school and classroom data (e.g. from ClassKit), or from kids (e.g. from apps in the App Store's Kids Category), etc. **Interstitial ads or ads that interrupt or block the user experience must clearly indicate that they are an ad, must not manipulate or trick users into tapping into them, and must provide easily accessible and visible close/skip buttons large enough for people to easily dismiss the ad. Apps that contain ads must also include the ability for users to report any inappropriate or age-inappropriate ads.**"
> — [Guidelines §2.5.18](https://developer.apple.com/app-store/review/guidelines/#2.5.18)

Related: **4.4 Extensions** — "the extensions **may not include marketing, advertising, or in-app purchases**"; **4.7.3 / 2.5.x** — App Clips "**cannot contain advertising**" ([§4.4](https://developer.apple.com/app-store/review/guidelines/#4.4), [§2.4.3 / App Clips](https://developer.apple.com/app-store/review/guidelines/)).

### B.5 Guideline 3.1.1 — IAP vs external payment

> **3.1.1 In-App Purchase:** "If you want to unlock features or functionality within your app, (by way of example: subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), **you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality, such as license keys, augmented reality markers, QR codes, cryptocurrencies and cryptocurrency wallets, etc.**"
> — [Guidelines §3.1.1](https://developer.apple.com/app-store/review/guidelines/#3.1.1)

> **3.1.4 Hardware-Specific Content:** "…**You may not, however, require users to purchase unrelated products or engage in advertising or marketing activities to unlock app functionality.**"
> — [Guidelines §3.1.4](https://developer.apple.com/app-store/review/guidelines/#3.1.4)

Since 2025 Apple has allowed, in some regions, **external purchase link entitlements** and, in the **United States storefront**, buttons/links to external purchase without an entitlement:

> "**3.1.1(a) Link to Other Purchase Methods:** Developers may apply for entitlements to provide a link in their app to a website the developer owns or maintains responsibility for in order to purchase digital content or services. **These entitlements are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps.** … In all other storefronts, except for the United States storefront, where this prohibition does not apply, apps and their metadata may not include buttons, external links, or other calls to action that direct customers to purchasing mechanisms other than in-app purchase."
> "If your app engages in misleading marketing practices, scams, or fraud in relation to the entitlement, **your app will be removed from the App Store and you may be removed from the Apple Developer Program.**"
> — [Guidelines §3.1.1(a)](https://developer.apple.com/app-store/review/guidelines/#3.1.1)

### B.6 Kids Category (1.3) and kids' privacy (5.1.4)

> **1.3 Kids Category** — "If you want to participate in the Kids Category… These apps **must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a parental gate.** … **Apps in the Kids Category should not include third-party analytics or third-party advertising.** … In limited cases, third-party analytics may be permitted provided that the services do not collect or transmit the IDFA or any identifiable information about children… **Third-party contextual advertising may also be permitted in limited cases provided that the services have publicly documented practices and policies for Kids Category apps that include human review of ad creatives for age appropriateness.**"
> — [Guidelines §1.3](https://developer.apple.com/app-store/review/guidelines/#1.3)

> **5.1.4 Kids** — "**Apps intended primarily for kids should not include third-party analytics or third-party advertising.** This provides a safer experience for kids."
> — [Guidelines §5.1.4](https://developer.apple.com/app-store/review/guidelines/#5.1.4)

Apple's App Review page adds a concrete submission requirement for kids' apps with ads:

> "If the app is for kids and contains third-party ads, **provide a link to the ad services' publicly documented practices and policies for Kids category apps, including human review of ad creatives for age appropriateness.**"
> — [App Review](https://developer.apple.com/app-store/review/)

### B.7 Ad identifier / tracking rules (ATT)

> **5.1.2 Data Use and Sharing (i)** — "…Data collected from apps may only be shared with third parties to improve the app or serve advertising… **You must receive explicit permission from users via the App Tracking Transparency APIs to track their activity.** … Your app may **not require users to enable system functionalities (e.g. push notifications, location services, tracking) in order to access functionality, content, use the app, or receive monetary or other compensation, including but not limited to gift cards and codes.** Apps that share user data without user consent or otherwise complying with data privacy laws **may be removed from sale and may result in your removal from the Apple Developer Program.**"
> "**(iv)** Do not use information from Contacts, Photos, or other APIs that access user data to build a contact database… and **don't collect information about which other apps are installed on a user's device for the purposes of analytics or advertising/marketing.**"
> "**(vi)** Data gathered from the HomeKit API, HealthKit… ClassKit or from depth and/or facial mapping tools… **may not be used for marketing, advertising or use-based data mining, including by third parties.**"
> — [Guidelines §5.1.2](https://developer.apple.com/app-store/review/guidelines/#5.1.2)

> **5.1.1(i) Privacy Policies** — "All apps must include a link to their privacy policy in the App Store Connect metadata field and within the app in an easily accessible manner. The privacy policy must clearly and explicitly: Identify what data, if any, the app/service collects, how it collects that data, and all uses of that data. **Confirm that any third party with whom an app shares user data… such as analytics tools, advertising networks and third-party SDKs… will provide the same or equal protection of user data as stated in the app's privacy policy**…"
> — [Guidelines §5.1.1](https://developer.apple.com/app-store/review/guidelines/#5.1.1)

### B.8 Rejection, removal and appeals process

> "**Appeals** — If your app didn't pass review and you feel we misunderstood your app's concept and functionality, or that you were treated unfairly by Apple in the course of our review, you may choose to submit an appeal to the **App Review Board**. … Provide specific reasons why you believe your app complies with the App Review Guidelines. **Submit only one appeal per submission that didn't pass review.**"
> "**Bug fix submissions** — If you're submitting a bug fix update for your app and we find additional issues during review, you have the option to resolve the additional issues with your next submission, **as long as there are no legal or safety concerns.**"
> — [App Review](https://developer.apple.com/app-store/review/)

> "If your app no longer functions as intended or you're no longer actively supporting it, **it will be removed from the App Store.**"
> — [Guidelines, Before You Submit](https://developer.apple.com/app-store/review/guidelines/)

**NOT VERIFIED:** Apple does not publish a per-guideline enforcement ladder (warning → strike → termination) equivalent to Google Play's strikes page, and I found no official Apple page enumerating a fixed number of ad-policy strikes before Developer Program termination. The guidelines state termination is discretionary ("We will reject apps for any content or behavior that we believe is over the line").

---

## C) APPLOVIN / UNITY / META POLICY ENFORCEMENT

### C.1 AppLovin (MAX)

**Policies for Publishers** — page states **Date updated: September 16, 2026**: [legal.applovin.com/policies-publishers](https://legal.applovin.com/policies-publishers/)

**Minimum content requirement — the "Made for Ads" ban:**

> "**a. Minimum Content Requirements** — In order to use the Services, your Property must contain **substantive, original content, and demonstrate signs of user engagement**. AppLovin does not work with any Property that:
> • Features mainly links or content from others without additional commentary, curation, or otherwise adding value to the content;
> • **Contains more ads than Publisher content, or appears designed primarily to display ads or low quality;**
> • Has little to no evidence of user engagement; and/or
> • Remains under construction."

**Invalid traffic / incentivised traffic (exact text):**

> "**Audience/Authenticity.** Impressions and clicks on ads must be the result of legitimate human end user activity. You may not artificially inflate impressions, clicks, or requests, or source traffic from pop-ups, pop-unders, forced redirects, or similar means. **AppLovin strictly prohibits invalid impressions, clicks, or requests, invalid traffic, or any other form of invalid activity, and any inducement, design, or encouragement of the same, including through the use of 'robots' or 'spiders' by you or any third party.** AppLovin shall determine, in AppLovin's sole discretion, what constitutes valid impressions, clicks, and requests, valid traffic, and valid activity. **Please note that payments to you may be withheld or adjusted if you engage in any actual or suspected violation of these Policies** or the AppLovin Terms of Use Agreement."

**Named prohibited traffic techniques** (from the companion [Introduction to AppLovin's Publisher Content Policies](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/)):

> "• Impressions and clicks on ads must result from legitimate human end-user activity.
> • **Do not generate or manipulate clicks or installs through click injection, click spamming, install or device farms, emulators, or undisclosed or prohibited incentivized traffic.**
> • Do not artificially inflate impressions, clicks, or requests, and do not source traffic from pop-ups, pop-unders, forced redirects, robots, spiders, or similar means.
> • **Do not misrepresent your traffic through device, SDK, or location spoofing, or by falsifying ad requests.**
> • Take steps to identify fraudulent behavior, avoid invalid activity, and maintain authentic traffic, including traffic from hijacked devices, data centers, or proxies that mask its true origin…"
> "• **Once you make an ad request through MAX, do not redirect that impression through any other auction.**
> • Every ad request must contain all requisite information about the inventory, and the actual traffic source must match the disclosed traffic source."
> "• Your property must be live in an official app store. **We do not allow content hosted by other third parties or direct APK downloads.**"

**Ad implementation / clickjacking / transparency rules:**

> "• **Integration/Ad Space Setup.** … **You may not use any technology, code, script, SDK, or other tool or mechanism to alter, override, circumvent, or otherwise interfere with AppLovin's standard ad templates or the rendering of any advertisement** delivered through the Services, including by injecting or substituting content, suppressing or replacing creative elements…
> • **Better Ads Standards.** Your Property must conform to the Better Ads Standards.
> • **Deceptive or Misleading Elements.** Your Property must not contain content, experiences, or behavior designed to be deceptive or misleading. This includes elements like redirects to unwanted content without user action, **navigation links that lead to an ad or landing page, typically non-clickable areas that lead to an ad or landing page when clicked, fake messages that lead to an ad or landing page when clicked**, social engineering… or any other elements that attempt to trick a user into interactions, engagement, or sharing their personal information.
> • **Viewability.** To ensure the authenticity of impressions or clicks, **ads must be visible (i.e., not hidden or invisible, out of page, stacked, or stuffed)** and placed reasonably and oriented correctly within the content. **Ads that are not visible or reasonably viewable may be considered, in AppLovin's sole discretion, invalid activity.**"

**Enforcement / consequences (exact text):**

> "**Enforcement** — Any actual or suspected violation of these Policies… may result, in AppLovin's sole discretion, in **AppLovin blocking or limiting ads from appearing against your Property, the suspension or termination of your account or access to the Services, the imposition of limits on your account or access to the Services, and/or the suspension, withholding, or termination of any payments potentially owed to you.**"
> — [Policies for Publishers](https://legal.applovin.com/policies-publishers/)

> "**What do I do if my account is suspended?** — Review the Terms of Use Agreement and the Policies for Publishers. If you believe your account was suspended in error, you can reach out to your account manager or contact AppLovin Support for further information."
> — [Introduction to AppLovin's Publisher Content Policies](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/)

> "We take appropriate action against flagged publishers, consistent with our Terms of Use Agreement and Policies for Publishers, **including terminating the accounts of publishers flagged for fraudulent or invalid activity.**"
> — [Platform Enforcement](https://www.applovin.com/platform-enforcement)

**AppLovin Terms of Use** (effective **July 14, 2026**): [legal.applovin.com/terms](https://legal.applovin.com/terms/)

> "…**payments to you as a Publisher may be withheld or adjusted if you engage in any actual or suspected violation** of this Agreement or the Publisher Policies, **including invalid activity.**"
> "**Termination by Us** — We may suspend or terminate this Agreement, your account(s), or your access to and use of the Platform, the Services, and the Software (or any portion of them) **at any time, for any reason or no reason, and without notice or explanation to you.**"
> Eligibility: "you may not access or use the Platform, the Services, or the Software if you… **(iii) have previously been suspended from the Services**".
> "**Time Limitation on Claims** — You agree that any claim you may have arising out of or relating to this Agreement or your relationship with us **must be filed within one (1) year** after the purported claim arose."
> "**Prohibited Content** … Launcher apps… **VPN Apps / VPN Connections.** You may not access or use the Services in connection with apps that provide virtual private networks, proxy servers, or similar products or services."
> "**Prohibition on Using the Services in Connection with 'Children'** … you may not initialize or use any AppLovin SDK… in connection with an end user who qualifies as a 'child' under applicable laws… **your account(s) may be subject to immediate termination.**"

---

### C.2 Unity (LevelPlay / ironSource / Unity Ads)

Unity's monetisation terms are split across several documents, all current as of the dates shown.

**1) Invalid Activity Policy** — [unity.com/legal/invalid-activity-policy](https://unity.com/legal/invalid-activity-policy) — **Last updated: June 23, 2021** (still the operative version at fetch time):

> "Publishers of Applications may not use or benefit from **any artificial, fraudulent, deceptive or other means to simulate, manipulate or increase impressions, views, taps, clicks, downloads, installs or any other interactions not arising from actual End-User interest** in the Ad ('**Invalid Activity**')."
> "Invalid Activity includes, but is not limited to, engaging in, facilitating, or benefiting from any of the following activities:
> • running of 'robots', 'spiders' or other automated computer generated requests;
> • **encouraging or incentivizing views, taps, clicks, downloads, installs or other End-User actions in connection with Ads other than in strict compliance with the Rewarded Inventory Policy**;
> • **using a design in an Application that encourages or is likely to lead to Invalid Activity or other unintended or accidental Ad interactions, including using an Ad placements which violate the Placement Policy**;
> • manipulating or misrepresenting device ids, device specifications, geolocation, header information or other information (including Invalid Activity arising from the spoofing of an application);
> • manipulating or hijacking an End-User's device;
> • **automatically refreshing Ads**;
> • encouraging repeated views, taps, clicks… in connection with the same Ad or series of Ads;
> • generating traffic from recognized proxy IPs;
> • generating traffic from applications which are unapproved VPN applications;
> • generating traffic from applications whose traffic appears like botnet traffic;
> • generating traffic from applications which violates the Content Policy;
> • **manually clicking on Ads by publisher's employees or agents outside of limited, customary Application testing**, or otherwise installs or other Ad engagement that appear to be coming from the publisher themselves;
> • abnormal timing in Ad surfacing or Ad engagement events…"
> "For clarity, **Invalid Activity includes both intentional and/or fraudulent traffic, as well as accidental traffic generated by publishers or End-Users.** The determination of what constitutes Invalid Activity under this policy will be made in Unity's sole discretion."

**2) Placement Policy** — [unity.com/legal/placement-policy](https://unity.com/legal/placement-policy) — **Last updated: June 23, 2021**:

> "• Placements should not be placed so close to or underneath buttons or any other object within the Application that End-Users are likely to accidentally click.
> • Placements should not be placed in areas where End-Users will randomly click or place their fingers on the screen.
> • Placements should not be placed in Applications such that they are **running in the background of the device or outside of the Application environment**… For example, **placements launched before an Application has opened or after an Application has closed would be a violation of this Placement Policy.**
> • Placements should not be placed in a way that **abnormally interferes with navigating or interacting with the Application's core content and functionality.**
> • **Placements should not be placed in screens with no or little content (e.g., log-in, error pages, etc.).**
> • **End-Users must have a means to exit any screen that contains an Ad placement without being forced to click on the Ad** (with the exception of a full-screen Ad once it starts following a related End-User initiated action).
> • **Placements may not be disguised in any way or otherwise implemented in a manner such that they might be mistaken for other Application content. This includes formatting neighboring content to look similar to Ads.**
> • Placements may not be placed on pages where dynamic content (e.g., live chats, instant messaging, auto-refreshing comments, etc.) is the primary focus of the page.
> • Placements may not be presented or located in a manner that makes it unlikely an Ad would actually be viewed."

**3) Unity Advertising Services Content Policy** — [unity.com/legal/content-policy](https://unity.com/legal/content-policy) — **Last updated: June 30, 2026**. Prohibited content includes deceptive/misleading ("Clickbait", phishing, fake ID, "get rich quick"), IP infringement ("Infringing file sharing apps", "Unauthorized video streaming apps"), malware/adware, auto-redirects and simulated clicks, and (new in this revision) **synthetic/AI-generated sexual content**. Enforcement:

> "**Actions Due to Unacceptable Content** … Unity may take some or all of following actions: … Remove/ disable access to/ restrict visibility of content; Not approve the content for upload; Require modification of content; **Suspend/ terminate portions of the service; Suspend/ terminate an account; Suspend/ terminate/ restrict monetization of content; Alert local authorities**…
> In determining whether to suspend or terminate an account, the following circumstances are taken into account: If an account provides prohibited content, particularly if such content is illegal; **If an account repeatedly violates our content restrictions.**"
> "**Appealing Content Moderation Restrictions** — If you believe we have made an incorrect decision about a content moderation restriction imposed on your content or account, you may **submit an appeal with your Covered Services point of contact**…"

**4) Unity Terms of Service** — [unity.com/legal/terms-of-service](https://unity.com/legal/terms-of-service) — **Last updated: June 30, 2026**:

> "**23. Term, Termination, Suspension** — Unity may terminate (or disable or suspend your access to and use of) any or all Offerings…, or terminate these Terms and/or your account, if … (e) **you are otherwise in breach of these Terms**…"
> "**If Unity suspends, disables or terminates your access to an Offering due to your breach, no refunds will be provided.**"
> "If your Unity Account or any Offering-specific account is canceled, terminated or suspended, you … will lose the ability to access and use such Unity Account and any User Content… **Unity may immediately delete such User Content**."

**NOT VERIFIED:** Unity's public pages do not state a maximum lookback for withheld earnings nor a defined number of violations before termination; no public "LevelPlay publisher suspension appeal form" URL was confirmed (the Content Policy directs publishers to their "Covered Services point of contact").

---

### C.3 Meta Audience Network

**Source:** [Meta Audience Network Policy](https://developers.facebook.com/docs/audience-network/policy/) — page states **Updated: Apr 20, 2026**.

**Enforcement basis:**

> "5. **Violations of these policies may result in suspension or termination of your use of our services.**
> 6. **We analyze all ad engagement (i.e. clicks, impressions, views, installs, etc.) for patterns of abuse. If we determine that a publisher account might pose a risk to Meta, our users, or our advertisers, we may limit or disable that account.**"
> "3. We reserve the right to reject, approve or remove any Publisher or app for any reason, at our sole discretion, including Publishers and apps that negatively affect our relationship with our users or advertisers…"
> "**Abnormal Behavior:** We may limit or remove your access to Audience Network if our systems detect possible violations of our policies or potential harm to our advertisers and users. For example, if our systems detect abnormal behaviors, we may suspend and/or limit your use of Audience Network to confirm compliance with our terms and policies…"

**Ad placement / UX rules most relevant to accidental clicks:**

> "**7. Accidental Engagement:** Apps must not place ads where people are likely to accidentally click.
> **8. Interactive Content:** Ensure that users can only engage with ad titles, URLs, 'Call-to-Action' buttons, and image assets; **users should not be able to engage with white space and the background of an ad**, as this is an unexpected experience for users.
> **9. Distinguishing Ads From Content:** Apps must ensure that ads are clearly distinguishable from the rest of the content within the app and ads must be clearly labeled with the expandable 'AdChoices' icon on the native ad and clearly marked with 'Sponsored', 'Promoted' or 'Ad' unless you have our prior written permission.
> **11. Forced Engagement: Publishers must ensure that engaging with an ad is not the only way to exit a screen.**
> **12. Ad Stacking:** Apps must not stack multiple ads in a single ad placement. Only one Audience Network ad may fill one placement at a time.
> **13. Unexpected Navigation:** Apps must not direct people to a place or page where they do not express an intent to be directed.
> **15. Soliciting or Incentivizing Engagement:** Apps must not bait, encourage, or provide incentives for people to engage with ads.
> **16. Auto-Refreshing Ads:** Apps must not automatically refresh Audience Network ads…
> **17. Ads Outside App:** Apps must not show ads in the background or outside of the app… Ads should not run when the user is not actively using the app.
> **18. Ads After Uninstall:** Apps must not show ads to a user if that user has uninstalled that app.
> **4. Low Quality or Disruptive Content:** Don't display ads on apps that are not fully-functional or that provide an unexpected, disruptive, or misleading experience. **This includes apps that contain a disproportionate volume of ads relative to content**…"
> "**Invalid Traffic:** Publishers must not integrate or display ads in apps whose traffic is generated from automated processes… Examples of what is not allowed: Using spiders or any other non-human traffic…; Using automated, deceptive, fraudulent or other invalid means (ex: through repeated manual clicks or the use of bots) to artificially inflate impressions or conversions, and ensure that one click on an ad only logs one click…"
> "**App Availability:** Audience Network is only available to apps offered in Apple iTunes or Google Play, unless you have our prior written approval."

**Rewarded video rules (stricter than AdMob in places):**

> "**1. Opt-In Criteria Not Met:** Users must proactively opt-in to viewing each ad at the time each ad is served. Acceptable opt-ins include, but are not limited to, a tap-to-play interaction or a countdown timer. **Offering a one-time opt-in to viewing all rewarded ads is not acceptable.** …
> **2. Financial Rewards:** Apps must not offer people monetary compensation or cash equivalents in exchange for viewing the ad. This includes but is not limited to gift cards, cryptocurrencies or in-app tokens or credits that are able to be redeemed for real money…
> **3. Injection of Rewarded Video or Rewarded Interstitial Ads:** Rewarded Video or Rewarded Interstitial Ads may only be placed after a material break in the experience (i.e. level completed in a game) or, if there are no material breaks, the developer must place limits on Rewarded Video or Rewarded Interstitial Ads (i.e. **maximum 3 Rewarded Video or Rewarded Interstitial Ads in a specific period of time**) and disclose that it uses Rewarded Video or Rewarded Interstitial Ads in the digital store where it is downloaded.
> **4. Non-Viewing Rewards: Apps must only offer users rewards for watching ads. Apps must not offer rewards for user activity outside of watching the ad.** This includes but is not limited to offers for rewards for downloading an app or other deep funnel conversion events.
> **5. Transferrable Rewards:** Apps must not offer rewards that can be transferred between users.
> **6. Rewards Probability Disclosure:** … Each ad must communicate the probability of winning on the call-to-action; **blanket disclosures within the app are not compliant.**
> **9. Interstitial Alternatives: Apps must not show an interstitial ad if users choose not to watch a Rewarded Video or Rewarded Interstitial Ad.**
> **10. Unearned Rewards:** Apps must not grant users rewards If users choose to close the ad before the end or use a report/hide flow to dismiss the ad."

---

### C.4 Does an AdMob ban cascade to AppLovin / Unity / Meta?

**What IS officially documented:**

1. **Within Google, yes — completely.** "if a publisher had an AdMob account closed for invalid activity or policy violations, they would not be able to use AdSense to monetize, and vice versa. For this reason, these publishers may not open new accounts." — [Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en). And: "if your account or app is in violation of **platform policies**, you will not be eligible for further participation in the AdSense and/or AdMob program(s) **including AdMob Mediation**." — [Account issues FAQ](https://support.google.com/admob/answer/9686306?hl=en)
2. **Related/duplicate accounts branch automatically.** "If a publisher opens additional accounts, the accounts will be flagged as duplicates and then one or both accounts will be closed." — [Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en). Same logic for Play accounts: "any **related Google Play Developer accounts are also terminated**" — [Play account terminations](https://support.google.com/googleplay/android-developer/answer/2491922?hl=en).
3. **The practical cross-network choke point is the app store, not the ad network.** All three third-party networks require the app to be live in an official store:
   - AppLovin: "Your property must be live in an official app store. **We do not allow content hosted by other third parties or direct APK downloads.**" ([Introduction](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/))
   - Meta: "Audience Network is only available to apps offered in Apple iTunes or Google Play, unless you have our prior written approval." ([AN Policy](https://developers.facebook.com/docs/audience-network/policy/))
   - Google/AdMob itself: a Play removal triggers AdMob ad-serving restriction ([AdMob 6195019](https://support.google.com/admob/answer/6195019?hl=en)) and is a named Publisher Restriction ([10437964](https://support.google.com/publisherpolicies/answer/10437964)).
4. **Unity and Meta both act on the publisher's own traffic patterns**, independently of Google — so a "wrong" traffic source you bought to boost AdMob revenue is visible to them too ([Unity Invalid Activity Policy](https://unity.com/legal/invalid-activity-policy); [Meta AN Policy §6, Abnormal Behavior](https://developers.facebook.com/docs/audience-network/policy/)).

**Explicitly NOT VERIFIED:** I found **no official AppLovin, Unity or Meta page** stating that they receive, check, or act on Google AdMob/AdSense ban status. There is **no verified official cross-network blacklist** disclosed by any of these vendors. The cascade that *is* documented is: (a) Google-internal AdMob↔AdSense↔AdMob Mediation, and (b) shared downstream cause — a Play/App Store removal or the same bad traffic source hitting every network's fraud system at once.

---

## D) SPECIFIC HIGH-RISK PRACTICES THAT GET APPS PULLED

Each row: the practice → the official rule it breaks → what it costs you.

| # | Practice | Rule it breaks (official) | Escalation path |
|---|---|---|---|
| 1 | **Interstitial on app launch / splash / app exit** | AdMob: "Do not place interstitial ads on app load and when exiting apps" ([6201362](https://support.google.com/admob/answer/6201362?hl=en)). Play: "Full screen video interstitial ads that appear before an app's loading screen (splash screen) are not allowed" ([9857753](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)). Unity: "placements launched before an Application has opened or after an Application has closed would be a violation" ([Placement Policy](https://unity.com/legal/placement-policy)). | Warning "Ad serving at risk" → Restricted/Disabled ad serving → repeated violations → account suspension ([15697162](https://support.google.com/admob/answer/15697162?hl=en)) |
| 2 | **Ads too close to / overlapping interactive buttons or content** | AdMob: "banner ads should not be placed next to interactive buttons"; floating/overlapping "is against policy and we reserve the right to disable ad serving" ([6128877](https://support.google.com/admob/answer/6128877?hl=en), [6275345](https://support.google.com/admob/answer/6275345?hl=en)). Policy: ads may not "overlay or be adjacent to navigational or other action items" ([11035030](https://support.google.com/publisherpolicies/answer/11035030)). | Accidental clicks → invalid traffic → **Confirmed Click** then **limited ad serving** then suspension/disable ([6213019](https://support.google.com/admob/answer/6213019?hl=en), [9493252](https://support.google.com/admob/answer/9493252?hl=en)) |
| 3 | **Ads on a "dead end" / no-content / exit / error screen, or in a thin utility app (e.g. flashlight)** | "We do not allow Google-served ads on screens… without publisher-content or with low-value content… Ads should not be placed on 'dead end' or no content screens (e.g., Thank You, Exit, Error pages, etc.)… For example, a flashlight app." ([11112688](https://support.google.com/publisherpolicies/answer/11112688)). AppLovin: "Contains more ads than Publisher content, or appears designed primarily to display ads" ([Policies for Publishers](https://legal.applovin.com/policies-publishers/)). | Restricted ad serving → disabled; AppLovin rejection/removal from the network |
| 4 | **Rewarding users for CLICKING an ad** (not for watching a rewarded video) | "any compensation or other incentives to click ads are strictly prohibited" ([2936217](https://support.google.com/admob/answer/2936217?hl=en)); "offering rewards to users for clicking ads… not allowed" ([6213019](https://support.google.com/admob/answer/6213019?hl=en)); Meta: "Apps must only offer users rewards for watching ads. Apps must not offer rewards for user activity outside of watching the ad" ([AN Policy](https://developers.facebook.com/docs/audience-network/policy/)). | **Account suspension** for invalid traffic (non-appealable), then permanent disable |
| 5 | **Self-clicking / testing live ads on your own device** | "Testing your own ads by clicking on them is not allowed. Please use test ads" ([2753860](https://support.google.com/admob/answer/2753860?hl=en)); "If you click too many ads without being in test mode, your account can be flagged for invalid activity" ([3342099](https://support.google.com/admob/answer/3342099?hl=en)); Unity: "manually clicking on Ads by publisher's employees or agents outside of limited, customary Application testing" ([Invalid Activity Policy](https://unity.com/legal/invalid-activity-policy)). | Suspension (non-appealable) → permanent disable → **no new AdMob/AdSense account ever, and duplicates get closed** |
| 6 | **Too many ads / ad density; interstitial after every action** | AdMob: "**no more than one interstitial ad after every two user actions**… Please note that this requirement also applies when a user clicks the *Back* button" ([6201362](https://support.google.com/admob/answer/6201362?hl=en)); refresh "60 seconds or longer" ([2936217](https://support.google.com/admob/answer/2936217?hl=en)). Play: "**Made for Ads** — We don't allow apps that display interstitial ads repeatedly to distract users" ([9857753](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)). Meta: "disproportionate volume of ads relative to content" ([AN Policy](https://developers.facebook.com/docs/audience-network/policy/)). | Restricted → disabled ad serving; Play app removal; store removal auto-restricts AdMob |
| 7 | **Clickjacking / transparent or hidden ad overlays / ad stacking** | Play: "An app that renders ads that are not visible to the user" is ad fraud ([9969955](https://support.google.com/googleplay/android-developer/answer/9969955?hl=en)); "Ad Stacking: Apps must not stack multiple ads in a single ad placement" ([Meta AN Policy](https://developers.facebook.com/docs/audience-network/policy/)); AppLovin: ads "must be visible (i.e., not hidden or invisible, out of page, stacked, or stuffed)" ([Policies for Publishers](https://legal.applovin.com/policies-publishers/)). | Ad fraud = **strictly prohibited**; Play account termination; network termination |
| 8 | **Buying installs / incentivised installs / install farms routed into monetised traffic** | AdMob: "Avoid partnering with untrusted/low-quality parties… partnering with low-quality ad networks or app promotion sites in efforts to increase traffic" ([3342099](https://support.google.com/admob/answer/3342099?hl=en)); AppLovin: "Do not generate or manipulate clicks or installs through click injection, click spamming, **install or device farms, emulators, or undisclosed or prohibited incentivized traffic**" ([Introduction](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/)); Play: "An app sending fake installation attribution clicks" ([9969955](https://support.google.com/googleplay/android-developer/answer/9969955?hl=en)). | Cross-network: hits AdMob AND Unity AND AppLovin AND Meta fraud systems simultaneously |
| 9 | **Misrepresenting ad content or ad placement (fake buttons, fake close, mislabeled ads)** | Play: "Ads must not simulate or impersonate the user interface of any app feature, such as notifications or warning elements of an operating system" ([9857753](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en)); AppLovin: "navigation links that lead to an ad or landing page, typically non-clickable areas that lead to an ad or landing page when clicked, fake messages that lead to an ad or landing page when clicked" ([Policies for Publishers](https://legal.applovin.com/policies-publishers/)); Apple 2.5.18: interstitials "must not manipulate or trick users into tapping into them" ([guidelines](https://developer.apple.com/app-store/review/guidelines/#2.5.18)). | Ad serving disabled; Apple rejection (2.5.18/2.3.1) |
| 10 | **Ads in a Kids/Families app without the right SDK + no personalised ads** | Play: "Only use Google Play Families Self-Certified Ads SDKs…; Ensure ads… do not involve interest-based advertising" ([9893335](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)); Apple 1.3/5.1.4: "Apps in the Kids Category should not include third-party analytics or third-party advertising" ([guidelines](https://developer.apple.com/app-store/review/guidelines/#1.3)); AppLovin: using the AppLovin SDK with a "child" = "your account(s) may be subject to immediate termination" ([Policies for Publishers](https://legal.applovin.com/policies-publishers/)). | App removal/suspension; network termination |
| 11 | **Mediation abuse — re-routing a MAX/LevelPlay impression to another auction** | AppLovin: "Once you make an ad request through MAX, do not redirect that impression through any other auction" ([Introduction](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/)); Google: "For a given impression, publishers may not make repeated ad calls for Google ads in a manner that attempts to interfere with, abuse, or gain an unfair advantage in the ad auction" ([Behavioral policies](https://support.google.com/admob/answer/2753860?hl=en)). | Account suspension and payment withholding (AppLovin "sole discretion") |
| 12 | **Missing / wrong app-ads.txt** | "Apps won't be able to fully serve ads until they're verified with an app-ads.txt file and approved after the app readiness review… **Starting January 2025, you will be required to verify new apps**" ([14538460](https://support.google.com/admob/answer/14538460?hl=en)); AppLovin: "Maintain an accurate app-ads.txt file that includes our line items… and truthfully declare your seller identity" ([Introduction](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/)); Meta: "Publishers that maintain an ads.txt or app-ads.txt file must include Audience Network listed accurately." ([AN Policy §2](https://developers.facebook.com/docs/audience-network/policy/)) | Ad serving withheld until verified (can look like a shadow-ban) |

---

## TOP 10 BAN TRIGGERS TO AVOID — checklist for a solo Indian developer

1. **Never click a live ad in your own app, not even once during "quick testing".** Use Google sample ad units or register your device as a **test device**; on Apple/Unity/Meta, use their test modes. Self-clicking is the #1 documented cause of AdMob suspension, suspensions are **non-appealable**, and a permanent disable means **you can never open another AdMob/AdSense account** (duplicates get closed too). Sources: [AdMob 3342099](https://support.google.com/admob/answer/3342099?hl=en), [AdMob 6213019](https://support.google.com/admob/answer/6213019?hl=en), [AdMob 6197403](https://support.google.com/admob/answer/6197403?hl=en).

2. **No interstitial at app open, splash, or app exit.** Put interstitials only at natural breaks between content/levels/pages, and **pre-load** so a slow network doesn't make the ad appear *after* the next screen renders. Sources: [AdMob 6201362](https://support.google.com/admob/answer/6201362?hl=en), [Play Ads policy](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en), [Unity Placement Policy](https://unity.com/legal/placement-policy).

3. **Cap frequency hard: no more than one interstitial per two user actions, no back-to-back interstitials, and 60s+ between banner refreshes.** The Back button counts as a user action. Source: [AdMob 6201362](https://support.google.com/admob/answer/6201362?hl=en), [AdMob 2936217](https://support.google.com/admob/answer/2936217?hl=en).

4. **Keep every ad clear of buttons, nav bars, chat inputs, galleries and gameplay areas; never let an ad float, hover, or overlap content.** Accidental clicks are treated as invalid traffic even when you didn't intend them. Sources: [AdMob 6128877](https://support.google.com/admob/answer/6128877?hl=en), [AdMob 6275345](https://support.google.com/admob/answer/6275345?hl=en), [Publisher Policy 11035030](https://support.google.com/publisherpolicies/answer/11035030).

5. **Never reward a click — only reward a completed rewarded-video view, and only for in-app, non-transferable, non-cash rewards.** No "click to support us" copy, no cash/gift-card/crypto rewards, no transfers between users. Sources: [AdMob 7313578](https://support.google.com/admob/answer/7313578?hl=en), [AdMob 2936217](https://support.google.com/admob/answer/2936217?hl=en), [Meta AN Policy](https://developers.facebook.com/docs/audience-network/policy/).

6. **Make your app genuinely useful — do not ship a webview, a link list, or an ad wrapper.** Both stores reject low-functionality apps and both ad networks ban "designed primarily to display ads" inventory. Sources: [Apple 4.2 / 4.2.2](https://developer.apple.com/app-store/review/guidelines/#4.2), [Apple 3.2.2(iii)](https://developer.apple.com/app-store/review/guidelines/#3.2.2), [Publisher Policy 11112688](https://support.google.com/publisherpolicies/answer/11112688), [AppLovin Minimum Content Requirements](https://legal.applovin.com/policies-publishers/).

7. **Never buy installs, traffic, or incentivised installs that flow into your monetised inventory.** Click injection, install farms, emulators, device farms and "undisclosed incentivized traffic" are explicitly banned by AppLovin, Unity and Meta — and the same traffic spike is visible to every network at once. Sources: [AppLovin Introduction](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/), [Unity Invalid Activity Policy](https://unity.com/legal/invalid-activity-policy), [Play Ad Fraud](https://support.google.com/googleplay/android-developer/answer/9969955?hl=en).

8. **No hidden, transparent, off-screen, auto-clicking, or stacked ads — ever.** These are classified as **ad fraud**, which triggers the harshest enforcement (network termination plus Play account termination, and Play termination removes *all* your apps and blocks new accounts). Sources: [Play Ad Fraud](https://support.google.com/googleplay/android-developer/answer/9969955?hl=en), [Play account terminations](https://support.google.com/googleplay/android-developer/answer/2491922?hl=en), [AppLovin Viewability](https://legal.applovin.com/policies-publishers/).

9. **Set up app-ads.txt correctly and early, and handle kids' apps properly.** Missing app-ads.txt blocks ad serving outright (mandatory for new apps since Jan 2025); if your app is child-directed use **only Families self-certified ad SDKs, non-personalised ads, extra-safe ad formats, and no interstitial at launch**. Sources: [AdMob 14538460](https://support.google.com/admob/answer/14538460?hl=en), [Play Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en), [Apple 1.3 / 5.1.4](https://developer.apple.com/app-store/review/guidelines/#1.3).

10. **Treat the first "policy violation"/warning email as a countdown, not a notification.** AdMob warnings carry a **"fix by" date** ("Ad serving at risk"); if you don't fix it, you move to Restricted → Disabled ad serving → account suspension. Fix, **upload the new version to the store first**, then request the review in the **AdMob Policy center**. And keep the same app content off a second Play account — "launching a second app that does the same thing, will almost certainly result in your app's suspension, or even termination of your developer account." Sources: [AdMob 15697162](https://support.google.com/admob/answer/15697162?hl=en), [AdMob 9192065](https://support.google.com/admob/answer/9192065?hl=en), [Play Fair warnings](https://support.google.com/googleplay/android-developer/answer/2985876?hl=en).

---

## APPENDIX — Everything I could NOT verify (explicit)

| Item | Status |
|---|---|
| `support.google.com/admob/answer/6275339` | **404 — page does not exist** (confirmed). Use [6128877](https://support.google.com/admob/answer/6128877?hl=en) (banner guidance) and [6275345](https://support.google.com/admob/answer/6275345?hl=en) (discouraged banners). |
| `support.google.com/admob/topic/6128801` | **NOT VERIFIED.** Could not confirm this topic ID exists; the live AdMob policy hub is [topic/9756841](https://support.google.com/admob/topic/9756841) and the consolidated centre is [support.google.com/publisherpolicies](https://support.google.com/publisherpolicies). |
| A formal, official **cross-network ban cascade** (AdMob ban → AppLovin/Unity/Meta ban) | **NOT VERIFIED.** No official AppLovin, Unity or Meta page states that they check or act on an AdMob ban. See C.4 for what *is* documented. |
| Apple App Review Guidelines **revision date** | **NOT VERIFIED.** Apple publishes no visible last-updated date on the guidelines page; it calls itself "a living document". The [App Review landing page](https://developer.apple.com/app-store/review/) reports a published time of 30 Jan 2026. |
| Apple's **numeric ad-policy strike ladder** before Developer Program termination | **NOT VERIFIED.** Apple's guidelines indicate discretionary termination; no published strike count found. |
| Unity's **lookback period for withheld earnings** / count of violations before termination | **NOT VERIFIED.** Unity's Content Policy says "repeatedly violates our content restrictions" is a factor but gives no number. |
| **AppLovin "what to do if suspended" dedicated help article** | **PARTIAL.** Only the short FAQ block on [Introduction to AppLovin's Publisher Content Policies](https://legal.applovin.com/introduction-to-applovins-publisher-content-policies/) was found; no standalone public appeal form confirmed. |
| Meta Audience Network **dedicated appeal form URL** | **NOT VERIFIED.** The policy page describes suspension/termination but does not link a publisher appeal form. |
| AdMob/AdSense **estimated vs. finalized earnings** mechanics (invalid-traffic deductions) | Referenced by Google at [AdMob 6147072](https://support.google.com/admob/answer/6147072) and [Deductions FAQ](https://support.google.com/admob/answer/7085268) but **not fetched in full** for this report. |
