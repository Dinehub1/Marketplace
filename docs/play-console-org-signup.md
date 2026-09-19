# Play Console organisation signup — what to enter

Companion to the form at `play.google.com/console/u/0/signup`. Written 2026-09-19,
while the account was being created with **kukrejajaydeep@gmail.com**.

## The exact values

| Field | Enter | Why |
|---|---|---|
| Account type | **Organisation** (already chosen) | An organisation account skips the personal-account rule that forces **12 testers opted in continuously for 14 days** before production. That alone saves ~3 weeks per app. |
| Organisation size | **1 – 10** | True, and it stays true as the account grows into a small studio. |
| Organisation phone number | **+91 75666 36666** | ⚠️ The number entered was `7566636666` — a bare 10-digit Indian mobile. The field asks for "+ symbol, country code, and area code", so it must be **+917566636666**. A number Google cannot parse or call is a verification failure later. |
| Organisation website | **https://apps.dropby.co.in** | Must start with `https://`. It is also the domain AdMob crawls for `app-ads.txt`, so the same host serves the developer site, the privacy policy and the seller file. |
| Developer name | **BrandCollabs** | This is the public name shown on every listing, so it must be the name you want visible to users. It must match the app-ads.txt publisher identity. |
| Payments profile | your own name / business details | Must resolve to a real bank account; AdMob payouts use the same identity. Use the PAN and bank account you want ad revenue paid into. |

## Why `apps.dropby.co.in` and not something else

- The domain already resolves (Cloudflare) and **already routes to the web app** — a
  request for `apps.dropby.co.in` reaches the Next app and returns its 404, which means
  routing works and only the pages were missing.
- The **privacy policy must be reachable at a URL**, and `app-ads.txt` must be at the
  **root** of the developer domain. One host serving all three keeps them consistent —
  which is what a reviewer checks.
- `dropby.co.in` itself is a different product ("DropBy — Restaurants & Events"), so it
  is the wrong host for this account.

## After this form

1. **Verify website ownership** — Play asks for this before you can publish. Use Google
   Search Console for `apps.dropby.co.in`; if it offers a DNS TXT record, add it in
   Cloudflare. (Optional ownership checks can be revisited later in Play Console.)
2. Wait for identity verification to complete, then create the first app.
3. In AdMob, set the SSV URL on the rewarded ad unit to
   `https://apps.dropby.co.in/api/ad-ssv` and put your publisher id in the web app's
   `ADMOB_PUBLISHER_ID` environment variable so `/app-ads.txt` publishes the real seller
   line.

## What the site serves

| Path | Serves |
|---|---|
| `/` | Developer home: who publishes the apps, the full app list, and that some apps show ads |
| `/privacy` | Ad-ready privacy policy: what is collected, the Google AdMob SDK, consent, user rights |
| `/app-ads.txt` | The seller file AdMob crawls (comment-only until `ADMOB_PUBLISHER_ID` is set) |

`npm run check:developer` asserts the site's app names and bundle ids against
`apps/mobile/targets.mjs`, so the website cannot drift from the listings it is meant to
corroborate.
