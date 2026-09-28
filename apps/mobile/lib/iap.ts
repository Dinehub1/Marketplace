/**
 * In-app purchases: the store-billing way to buy one clean file.
 *
 * Inside the iOS/Android apps a clean file is a digital good, so it is sold through Apple /
 * Google billing (RevenueCat on the phone), never through the Razorpay web paywall — that
 * one is for the website (Apple 3.1.1, Play Payments policy).
 *
 * The phone is not the witness here either. The order is:
 *
 *   1. **Buy** — RevenueCat runs the store sheet and hands back a transaction id.
 *   2. **Remember it** — the unspent purchase is saved on the device *before* the server is
 *      asked, so a crash, a dead network or a killed app never loses something paid for.
 *   3. **Claim** — `/api/job/<id>/iap-unlock` asks RevenueCat's server (secret key) whether
 *      this customer holds that transaction, and only then releases the file.
 *
 * An unspent purchase (claim failed, or the job was already open) is applied to the next
 * photo before a new sheet is shown, so the customer is never charged twice for one file.
 *
 * The SDK is a native module that only some builds link (see react-native.config.js), so it
 * is `require`d lazily and every entry point answers "not available" in a build without it —
 * Expo Go, the web export, screenshot runs, and every target that sells nothing.
 */
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/lib/config";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

/** Build-time switch, set per EAS profile from targets.mjs (`iap: true`). */
export const IAP_ENABLED =
  String(process.env.EXPO_PUBLIC_IAP_ENABLED ?? "0") === "1" || extra.iapEnabled === true;

/** Which store product unlocks which job product. Mirrors apps/web/lib/revenuecat.ts. */
export const IAP_PRODUCT_FOR: Readonly<Record<string, string>> = {
  "passport-photo": "passport_sheet",
};

function apiKey(): string {
  const key = Platform.OS === "ios" ? extra.revenuecatIosKey : Platform.OS === "android" ? extra.revenuecatAndroidKey : "";
  return typeof key === "string" ? key : "";
}

// Typed loosely on purpose: the package is only linked in some builds, and this file must
// compile in all of them.
type PurchasesSdk = {
  configure(o: { apiKey: string }): void;
  getProducts(ids: string[], category?: string): Promise<{ identifier: string; priceString: string }[]>;
  purchaseStoreProduct(p: unknown): Promise<{ productIdentifier: string; transaction: { transactionIdentifier: string } }>;
  getAppUserID(): Promise<string>;
};

let sdkCache: { sdk: PurchasesSdk; nonSubscription: string } | null | undefined;

function sdk(): { sdk: PurchasesSdk; nonSubscription: string } | null {
  if (sdkCache !== undefined) return sdkCache;
  sdkCache = null;
  if (!IAP_ENABLED || Platform.OS === "web" || !apiKey()) return null;
  try {
    const mod = require("react-native-purchases");
    const Purchases = (mod.default ?? mod) as PurchasesSdk;
    Purchases.configure({ apiKey: apiKey() });
    sdkCache = { sdk: Purchases, nonSubscription: mod.PRODUCT_CATEGORY?.NON_SUBSCRIPTION ?? "NON_SUBSCRIPTION" };
  } catch {
    // Not linked in this binary (Expo Go, or a build without the switch).
    sdkCache = null;
  }
  return sdkCache;
}

/** True when this build can sell `product` through the store. */
export function iapAvailable(product: string): boolean {
  return Boolean(IAP_PRODUCT_FOR[product]) && sdk() !== null;
}

/** The store's own localized price ("₹49.00"), or null when it can't be read. */
export async function storePrice(product: string): Promise<string | null> {
  const s = sdk();
  const id = IAP_PRODUCT_FOR[product];
  if (!s || !id) return null;
  try {
    const [p] = await s.sdk.getProducts([id], s.nonSubscription);
    return p?.priceString ?? null;
  } catch {
    return null;
  }
}

export type IapUnlockResult =
  | { ok: true; outputUrl: string }
  | { ok: false; cancelled?: boolean; error: string };

type Unspent = { transactionId: string; appUserId: string; productId: string };

const pendingKey = (productId: string) => `iap-unspent:${productId}`;

async function readUnspent(productId: string): Promise<Unspent | null> {
  try {
    const raw = await AsyncStorage.getItem(pendingKey(productId));
    return raw ? (JSON.parse(raw) as Unspent) : null;
  } catch {
    return null;
  }
}

async function writeUnspent(u: Unspent | null, productId: string): Promise<void> {
  try {
    if (u) await AsyncStorage.setItem(pendingKey(productId), JSON.stringify(u));
    else await AsyncStorage.removeItem(pendingKey(productId));
  } catch {
    /* storage unavailable: the claim below is still attempted */
  }
}

type ClaimOutcome =
  | { kind: "unlocked"; outputUrl: string; keepUnspent: boolean }
  | { kind: "spent" }
  | { kind: "retry"; error: string }
  | { kind: "refused"; error: string };

/** Ask the server to release the file for this purchase. Retries while the store catches up. */
async function claim(jobId: number, u: Unspent): Promise<ClaimOutcome> {
  const delays = [0, 1200, 2500];
  let last: ClaimOutcome = { kind: "retry", error: "Could not reach the server." };
  for (const d of delays) {
    if (d) await new Promise((r) => setTimeout(r, d));
    try {
      const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/api/job/${jobId}/iap-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_user_id: u.appUserId, transaction_id: u.transactionId, product_id: u.productId }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; output_url?: string; unspent?: boolean; state?: string; error?: string }
        | null;
      if (res.ok && body?.output_url) return { kind: "unlocked", outputUrl: body.output_url, keepUnspent: body.unspent === true };
      if (res.status === 409 && body?.state === "spent") return { kind: "spent" };
      // 402: RevenueCat has not seen the receipt yet; 5xx: try again.
      if (res.status === 402 || res.status >= 500) {
        last = { kind: "retry", error: body?.error ?? `The purchase is not confirmed yet (${res.status}).` };
        continue;
      }
      return { kind: "refused", error: body?.error ?? `The unlock was refused (${res.status}).` };
    } catch {
      last = { kind: "retry", error: "Could not reach the server." };
    }
  }
  return last;
}

/**
 * Unlock `jobId` with one store purchase of `product`.
 *
 * An unspent purchase from earlier is used first; a new store sheet is shown only when
 * there is none (or it turned out to be spent already).
 */
export async function buyUnlock(jobId: number, product: string): Promise<IapUnlockResult> {
  const s = sdk();
  const productId = IAP_PRODUCT_FOR[product];
  if (!s || !productId) return { ok: false, error: "Purchases aren't available in this version of the app." };

  // 1. An earlier purchase that never opened a file.
  const earlier = await readUnspent(productId);
  if (earlier) {
    const r = await claim(jobId, earlier);
    if (r.kind === "unlocked") {
      if (!r.keepUnspent) await writeUnspent(null, productId);
      return { ok: true, outputUrl: r.outputUrl };
    }
    if (r.kind === "retry") {
      return { ok: false, error: `Your earlier purchase is saved and will be used — ${r.error} Try again in a moment.` };
    }
    // Spent or refused: forget it and sell a new one.
    await writeUnspent(null, productId);
  }

  // 2. Buy.
  let bought: Unspent;
  try {
    const [storeProduct] = await s.sdk.getProducts([productId], s.nonSubscription);
    if (!storeProduct) return { ok: false, error: "This item isn't available in the store right now." };
    const result = await s.sdk.purchaseStoreProduct(storeProduct);
    bought = {
      transactionId: result.transaction.transactionIdentifier,
      appUserId: await s.sdk.getAppUserID(),
      productId,
    };
  } catch (e: any) {
    if (e?.userCancelled || e?.code === "1" || e?.code === 1) {
      return { ok: false, cancelled: true, error: "Purchase cancelled. Nothing was charged." };
    }
    return { ok: false, error: e?.message || "The store could not complete the purchase." };
  }

  // 3. Save before claiming, so a paid purchase survives anything that happens next.
  await writeUnspent(bought, productId);
  const r = await claim(jobId, bought);
  if (r.kind === "unlocked") {
    if (!r.keepUnspent) await writeUnspent(null, productId);
    return { ok: true, outputUrl: r.outputUrl };
  }
  if (r.kind === "spent") {
    await writeUnspent(null, productId);
    return { ok: false, error: "That purchase was already used. Contact support if this is wrong." };
  }
  return { ok: false, error: `Payment received — ${r.error} Tap again to finish; you won't be charged twice.` };
}
