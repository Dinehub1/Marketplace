/**
 * Store purchases, as RevenueCat's server reports them — the witness for an in-app unlock.
 *
 * The app sells a clean file through Apple / Google billing (RevenueCat on the phone).
 * Nothing the phone says about a purchase is believed: the unlock route asks RevenueCat's
 * REST API, with the secret key, whether that customer really holds that transaction for
 * that product. This mirrors the rewarded-ad rule (`/api/ad-ssv`): the phone asks, a
 * server that the phone cannot impersonate answers.
 *
 * Deliberately imports nothing from the app and nothing through `@/`, so the matching rules
 * can be exercised under plain node by `scripts/check-iap.mjs`.
 */

/** Which in-app product unlocks which job product. Must match App Store Connect / Play Console / RevenueCat. */
export const IAP_PRODUCT_FOR: Readonly<Record<string, string>> = {
  "passport-photo": "passport_sheet",
};

/** The stores whose purchases may release a file; RevenueCat also reports promotional/stripe grants. */
export type StoreName = "app_store" | "play_store";
const STORES: readonly string[] = ["app_store", "play_store"];

/** One entry of `subscriber.non_subscriptions[<product_id>]` in RevenueCat's v1 API. */
export type NonSubscription = {
  id: string;
  store_transaction_id?: string | null;
  store: string;
  is_sandbox?: boolean;
  purchase_date?: string;
};

export type Subscriber = {
  original_app_user_id?: string;
  non_subscriptions?: Record<string, NonSubscription[] | undefined>;
};

export type VerifiedPurchase = {
  /** RevenueCat's own id for the transaction — the key the ledger is unique on. */
  id: string;
  storeTransactionId: string | null;
  store: StoreName;
  productId: string;
  isSandbox: boolean;
  purchaseDate: string | null;
};

export type MatchResult =
  | { ok: true; purchase: VerifiedPurchase }
  | { ok: false; reason: "no_such_purchase" | "wrong_store" };

/**
 * Find the transaction the phone named, under the product the job needs.
 *
 * The phone sends the SDK's `transactionIdentifier`; depending on platform and SDK version
 * that is RevenueCat's id or the store's, so both are accepted — but only under
 * `productId`, so a cheaper product (or another app's) can never stand in for this one.
 */
export function matchPurchase(subscriber: Subscriber | null | undefined, productId: string, transactionId: string): MatchResult {
  const txn = transactionId.trim();
  if (!txn) return { ok: false, reason: "no_such_purchase" };
  const entries = subscriber?.non_subscriptions?.[productId] ?? [];
  const hit = entries.find((e) => e && (e.id === txn || (e.store_transaction_id ?? "") === txn));
  if (!hit) return { ok: false, reason: "no_such_purchase" };
  if (!STORES.includes(hit.store)) return { ok: false, reason: "wrong_store" };
  return {
    ok: true,
    purchase: {
      id: hit.id,
      storeTransactionId: hit.store_transaction_id ?? null,
      store: hit.store as StoreName,
      productId,
      isSandbox: hit.is_sandbox === true,
      purchaseDate: hit.purchase_date ?? null,
    },
  };
}

export type FetchSubscriber =
  | { ok: true; subscriber: Subscriber }
  | { ok: false; status: number; error: string };

/**
 * GET /v1/subscribers/<app_user_id> with the secret key.
 *
 * Sandbox purchases are returned too, and they must be: App Review buys with a sandbox
 * account against the production build. `is_sandbox` is recorded on the unlock so the
 * books can tell a review purchase from a sale.
 */
export async function fetchSubscriber(
  appUserId: string,
  opts: { secretKey?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<FetchSubscriber> {
  const key = opts.secretKey ?? process.env.REVENUECAT_SECRET_KEY ?? "";
  if (!key) return { ok: false, status: 503, error: "REVENUECAT_SECRET_KEY is not configured" };
  const doFetch = opts.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
  try {
    const res = await doFetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, status: res.status, error: `RevenueCat answered ${res.status}` };
    const body = (await res.json()) as { subscriber?: Subscriber };
    return { ok: true, subscriber: body.subscriber ?? {} };
  } catch (e) {
    return { ok: false, status: 502, error: e instanceof Error ? e.message : "RevenueCat unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
