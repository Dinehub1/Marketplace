# Word Duel — Google Play listing

Everything Play Console asks for when creating **Word Duel: Word Puzzle**
(`com.brandcollabs.wordduel`), written against what the build actually does. Copy each
field as is. If the app changes, update this file with it: a listing or a Data safety
answer that disagrees with the binary is a policy violation, not a typo.

## v1 ships without ads — answer for that build

The first release (versionCode 3+, built 2026-09-28) has **no ad SDK in it**: the AdMob
app did not exist yet, and the build had to happen first. For that build only:

- **Full description:** drop the last paragraph (the one about ads and hints).
- **App content → Ads:** **No, my app does not contain ads.**
- **Advertising ID:** **No** — no ad SDK means no `AD_ID` permission.
- **Data safety:** **No data collected or shared.** Word Duel v1 makes no network calls:
  scores stay on the phone, and the hint top-up is not offered in a release build without
  ads (`offersRewarded()` in `apps/mobile/lib/ads`).

When v2 ships with AdMob + AppLovin + InMobi, switch every one of these back to the
answers below **before** rolling out v2 — Play checks the declarations against the build.

## Create app

| Field | Value |
|---|---|
| App name | `Word Duel: Word Puzzle` (22/30) |
| Default language | English (United Kingdom) — `en-GB` (or `en-US`; pick one and keep it) |
| App or game | **Game** |
| Free or paid | **Free** (cannot be changed to paid later) |
| Declarations | Tick Developer Program Policies and US export laws |

## Main store listing

**Short description** (76/80):

```
Build as many words as you can in sixty seconds. Offline, no sign-up needed.
```

**Full description:**

```
Sixty seconds. One rack of letters. How many words can you make?

Word Duel is a quick word game you can play in a minute. Every round deals a rack of six or seven letters cut from a real word, so there is always a long word hiding in it — and always at least a handful of shorter ones.

HOW TO PLAY
• Tap letters to build a word of three letters or more
• Longer words score more: 30 points for three letters, up to 250 for seven
• Stuck? You have three hints each round
• The round ends when the clock does — then try to beat your best

WHY YOU MIGHT LIKE IT
• A full round takes one minute
• Works offline: the word list is built into the app
• No account and no sign-up
• Your best score and recent rounds are kept on your phone
• Light and dark themes

Word Duel is free and supported by ads. When your hints run out you can choose to watch a short ad for three more — it is always optional, and the clock waits while you decide.
```

| Field | Value |
|---|---|
| App icon | `docs/store/word-duel/icon-512.png` (512×512) |
| Feature graphic | `docs/store/word-duel/feature-graphic.png` (1024×500) |
| Phone screenshots | `docs/store/word-duel/screenshots/*.png` (upload in filename order) |
| Category | Games → **Word** |
| Tags | Word, Puzzle, Casual (pick what Play offers closest to these) |
| Email | `support@dropby.co.in` |
| Website | `https://apps.dropby.co.in` |
| Privacy policy | `https://apps.dropby.co.in/privacy` |

## App content (Policy → App content)

| Section | Answer | Why |
|---|---|---|
| Privacy policy | `https://apps.dropby.co.in/privacy` | Names AdMob, AppLovin and InMobi |
| Ads | **Yes, my app contains ads** | Rewarded ad for extra hints |
| App access | **All functionality is available without special access** | No login |
| Content rating | Fill the IARC questionnaire: category **Game → Puzzle/Word**; answer **No** to violence, fear, sexuality, language, drugs, gambling, user interaction/chat, sharing location, digital purchases. | Expected result: Everyone / 3+ |
| Target audience | **13–15, 16–17, 18+**. Do not tick any under-13 band. "Could it unintentionally appeal to children?" — answer honestly; it is a plain word game with no characters or child themes. | Choosing under-13 puts the app under the Families policy: only Families-certified ad SDKs (AppLovin is not), and non-personalised ads only. If you ever want under-13, rebuild with `EXPO_PUBLIC_AD_MEDIATION=inmobi` first. |
| News app | No | |
| COVID-19 app | No | |
| Data safety | See below | |
| Government app | No | |
| Financial features | None | |
| Health | No | |
| Advertising ID | **Yes** — used for **Advertising or marketing** (and **Analytics**) | The Google Mobile Ads SDK declares `AD_ID`; Play rejects an upload that uses it without this declaration |

## Data safety

Does the app collect or share user data? **Yes.** Encrypted in transit? **Yes.**
Can users request deletion? Say **Yes**, and give `support@dropby.co.in`: nothing is tied
to an account, so there is nothing user-identifiable to delete.

The in-game scores never leave the phone (stored locally), so they are **not** collected
and are not declared.

| Data type | Collected | Shared | Optional? | Purposes | Collected by |
|---|---|---|---|---|---|
| **Location → Approximate location** | Yes | Yes | Required | Advertising or marketing; Analytics; Fraud prevention, security & compliance | Ad SDKs (derived from IP) |
| **App activity → App interactions** | Yes | Yes | Required | Advertising or marketing; Analytics; Fraud prevention, security & compliance | Ad SDKs (ad views/taps); our own ad log (ad requests/impressions with a random per-launch session id) |
| **App info and performance → Diagnostics** | Yes | Yes | Required | Advertising or marketing; Analytics; Fraud prevention, security & compliance | Ad SDKs (crash/performance logs) |
| **Device or other IDs** | Yes | Yes | Required | Advertising or marketing; Analytics; Fraud prevention, security & compliance | Ad SDKs (advertising ID, app set ID) |

Nothing else: no name, email, phone, contacts, photos, files, messages, precise location,
purchase history or health data. The source for the ad SDK rows is Google's Play data
disclosure for the Mobile Ads SDK
(https://developers.google.com/admob/android/privacy/play-data-disclosure); AppLovin and
InMobi collect the same categories for serving and measuring ads.

## Release

1. **Testing → Internal testing** first: upload the `.aab`, add yourself as a tester, and
   install from the Play link to check the real Play build (ads, consent popup).
2. Then **Production → Create release** with the same `.aab`, countries **India** (add
   more later), and send for review. First reviews of a new app usually take a few days.
3. Once live, the listing URL is
   `https://play.google.com/store/apps/details?id=com.brandcollabs.wordduel` — this is
   what the AppLovin and InMobi signups ask for, and what AdMob links the app to.
