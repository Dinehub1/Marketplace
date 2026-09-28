/**
 * The in-app purchase witness, asserted without a store, a device or a network.
 *
 * `apps/web/lib/revenuecat.ts` decides whether a transaction the phone names really
 * belongs to that customer, for the product a job needs. A bug there is a free file, so
 * it gets the forgeries, not just the happy path: an invented transaction, a real
 * transaction for a cheaper product, a promotional grant, an empty id — and the lookup
 * itself against a fake RevenueCat (auth header, URL encoding, failures, missing key).
 *
 * Run: npm run check:iap
 */
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const { IAP_PRODUCT_FOR, matchPurchase, fetchSubscriber } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/revenuecat.ts")).href
);

let passed = 0;
const check = (name, fn) =>
  Promise.resolve()
    .then(fn)
    .then(() => { passed++; console.log(`  ✓ ${name}`); })
    .catch((e) => { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; });

const PRODUCT = IAP_PRODUCT_FOR["passport-photo"];
const subscriber = {
  original_app_user_id: "$RCAnonymousID:abc",
  non_subscriptions: {
    [PRODUCT]: [
      { id: "rc_1", store_transaction_id: "2000000111", store: "app_store", is_sandbox: true, purchase_date: "2026-09-28T10:00:00Z" },
      { id: "rc_2", store_transaction_id: "GPA.1234-5678", store: "play_store", is_sandbox: false },
      { id: "rc_3", store_transaction_id: "promo_9", store: "promotional" },
    ],
    cheap_sticker: [{ id: "rc_cheap", store_transaction_id: "2000000999", store: "app_store" }],
  },
};

console.log("matchPurchase");
await check("the passport product has an in-app product id", () => assert.equal(PRODUCT, "passport_sheet"));
await check("RevenueCat id matches and returns RevenueCat's id", () => {
  const r = matchPurchase(subscriber, PRODUCT, "rc_1");
  assert.equal(r.ok, true);
  assert.equal(r.purchase.id, "rc_1");
  assert.equal(r.purchase.store, "app_store");
  assert.equal(r.purchase.isSandbox, true);
});
await check("store transaction id also matches, keyed back to RevenueCat's id", () => {
  const r = matchPurchase(subscriber, PRODUCT, "GPA.1234-5678");
  assert.equal(r.ok, true);
  assert.equal(r.purchase.id, "rc_2");
  assert.equal(r.purchase.store, "play_store");
  assert.equal(r.purchase.isSandbox, false);
});
await check("an invented transaction is refused", () => {
  assert.deepEqual(matchPurchase(subscriber, PRODUCT, "rc_404"), { ok: false, reason: "no_such_purchase" });
});
await check("a real purchase of another product cannot stand in", () => {
  assert.equal(matchPurchase(subscriber, PRODUCT, "rc_cheap").ok, false);
  assert.equal(matchPurchase(subscriber, PRODUCT, "2000000999").ok, false);
});
await check("a promotional grant is not a store purchase", () => {
  assert.deepEqual(matchPurchase(subscriber, PRODUCT, "rc_3"), { ok: false, reason: "wrong_store" });
});
await check("empty / whitespace ids match nothing", () => {
  assert.equal(matchPurchase(subscriber, PRODUCT, "").ok, false);
  assert.equal(matchPurchase(subscriber, PRODUCT, "   ").ok, false);
  // An entry with no store_transaction_id must not match an empty string either.
  assert.equal(matchPurchase({ non_subscriptions: { [PRODUCT]: [{ id: "x", store: "app_store" }] } }, PRODUCT, " ").ok, false);
});
await check("a customer with no purchases matches nothing", () => {
  assert.equal(matchPurchase({}, PRODUCT, "rc_1").ok, false);
  assert.equal(matchPurchase(null, PRODUCT, "rc_1").ok, false);
});

console.log("fetchSubscriber");
await check("sends the secret key as a bearer token to the encoded customer URL", async () => {
  let seen;
  const fake = async (url, init) => {
    seen = { url, auth: init.headers.Authorization };
    return new Response(JSON.stringify({ subscriber }), { status: 200 });
  };
  const r = await fetchSubscriber("$RCAnonymousID:a/b", { secretKey: "sk_test", fetchImpl: fake });
  assert.equal(r.ok, true);
  assert.equal(seen.auth, "Bearer sk_test");
  assert.equal(seen.url, "https://api.revenuecat.com/v1/subscribers/%24RCAnonymousID%3Aa%2Fb");
  assert.equal(r.subscriber.non_subscriptions[PRODUCT].length, 3);
});
await check("no secret key → refuses without calling out", async () => {
  let called = false;
  const saved = process.env.REVENUECAT_SECRET_KEY;
  delete process.env.REVENUECAT_SECRET_KEY;
  const r = await fetchSubscriber("u", { fetchImpl: async () => { called = true; return new Response("{}"); } });
  if (saved !== undefined) process.env.REVENUECAT_SECRET_KEY = saved;
  assert.equal(r.ok, false);
  assert.equal(r.status, 503);
  assert.equal(called, false);
});
await check("a RevenueCat error is reported, not treated as an empty customer", async () => {
  const r = await fetchSubscriber("u", { secretKey: "k", fetchImpl: async () => new Response("no", { status: 401 }) });
  assert.equal(r.ok, false);
  assert.equal(r.status, 401);
});
await check("a network failure is reported", async () => {
  const r = await fetchSubscriber("u", { secretKey: "k", fetchImpl: async () => { throw new Error("ECONNRESET"); } });
  assert.equal(r.ok, false);
  assert.equal(r.status, 502);
});

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
