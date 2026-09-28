/**
 * The bidders' `app-ads.txt` blocks, pasted from their dashboards.
 *
 * AdMob's own line is one line built from `ADMOB_PUBLISHER_ID` (see `catalog.ts`). The
 * bidders are different: each hands out a personalised block of many lines — its own
 * DIRECT line carrying our account id, plus RESELLER lines for the exchanges it buys
 * through — and without it their buyers skip our inventory as unauthorised. The blocks
 * are public by design (the whole file is served to anyone), so they live in the repo
 * rather than in the environment, where a fifty-line value is unmanageable.
 *
 * Where to get them:
 *   - AppLovin: dashboard → Account → app-ads.txt (the "MAX" / AppLovin block).
 *   - InMobi:   publisher dashboard → Inventory → app-ads.txt → download. Paste both the
 *               Direct and Reseller tabs. InMobi's crawler activates only after one app
 *               has sent ~10,000 bid requests, so "not verified" before then is expected.
 *
 * Paste verbatim between the backticks. Comments and blank lines are fine; any line that
 * is not `domain, account id, DIRECT|RESELLER[, cert id]` is dropped rather than served.
 * Empty means that network's lines are not published yet — the honest state before its
 * account exists.
 */

export const APPLOVIN_APP_ADS_TXT = `
`;

export const INMOBI_APP_ADS_TXT = `
`;
