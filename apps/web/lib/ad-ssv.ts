/**
 * AdMob server-side verification (SSV) — the part that stops the phone being the witness.
 *
 * ## Why this file exists
 *
 * An unlock used to be granted on the app's word: "a rewarded ad completed". Anybody
 * who knew the route could say those words without watching anything. SSV replaces
 * the witness: when a rewarded ad is watched, **Google's server** calls ours with a
 * signed receipt, and only a receipt whose signature verifies against Google's
 * published key is allowed to open a file.
 *
 * ```
 *   before:  AdMob → phone → app claims reward → server grants      (phone is trusted)
 *   after:   AdMob → phone → AdMob's server → signed callback → server verifies → grant
 * ```
 *
 * ## What is actually verified, and what is not
 *
 * - **Verified:** the callback really came from AdMob (ECDSA P-256 signature over the
 *   raw query string), for the ad unit and reward we expect, and it is recent.
 * - **Not claimed here:** that the user is who they say. `user_id` and `custom_data`
 *   are set by *our own app*, so they are attacker-controlled and are treated purely
 *   as a lookup key. The security is the signature, never the payload.
 *
 * ## The detail that is easy to get wrong
 *
 * The signature covers the query string **up to and including `signature=`**, with
 * `key_id` appended after. So verification must run against the raw bytes as Google
 * sent them — re-encoding parsed parameters (different ordering, different escaping)
 * produces a valid-looking callback that fails to verify, or worse, a verifier that
 * "normalises" the very thing it is checking. Hence `rawQuery` all the way through.
 */
import crypto from "crypto";

/** Where AdMob publishes the keys that sign rewards callbacks. */
const KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";

/**
 * Override, for integration testing only.
 *
 * Verifying a real callback means holding Google's private key, which nobody does —
 * so the only way to exercise this end to end (dev server, real route, real
 * signature) is to serve a key file of our own and point the verifier at it. The
 * self-check in `scripts/check-ad-ssv.mjs` covers the crypto; this env var is what
 * lets the *wired* route be tested the same way.
 *
 * It is not a bypass: the verification still runs in full, against a key set the
 * operator deliberately chose. It is honoured only when set, and reading it in
 * production is a misconfiguration, so it is asserted below rather than silently
 * trusted.
 */
/** How long a fetched key set is trusted before a re-fetch. Google rotates keys. */
const KEYS_TTL_MS = 6 * 60 * 60 * 1000;

const KEYS_URL_OVERRIDE = process.env.ADMOB_SSV_KEYS_URL ?? "";

/** A callback older than this is refused: a receipt is not a bearer token forever. */
const MAX_AGE_MS = 60 * 60 * 1000;

type GoogleKey = { keyId: number; pem: string; base64?: string };

let cachedKeys: { at: number; byId: Map<string, string> } | null = null;

/** Injectable for tests, so verification can be exercised without the network. */
let keysUrl = KEYS_URL_OVERRIDE || KEYS_URL;
let now = () => Date.now();

export function __setKeysUrlForTests(url: string | null): void {
  keysUrl = url ?? KEYS_URL;
  cachedKeys = null;
}

export function __setClockForTests(clock: (() => number) | null): void {
  now = clock ?? (() => Date.now());
}

async function loadKeys(): Promise<Map<string, string>> {
  if (cachedKeys && now() - cachedKeys.at < KEYS_TTL_MS) return cachedKeys.byId;

  const res = await fetch(keysUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not fetch AdMob verification keys (${res.status})`);
  const body = (await res.json()) as { keys?: GoogleKey[] };
  const byId = new Map<string, string>();
  for (const k of body.keys ?? []) {
    if (k?.keyId !== undefined && typeof k.pem === "string") byId.set(String(k.keyId), k.pem);
  }
  if (byId.size === 0) throw new Error("AdMob returned no verification keys");
  cachedKeys = { at: now(), byId };
  return byId;
}

export type SsvRejection =
  | "missing_params"
  | "unknown_key"
  | "bad_signature"
  | "stale_timestamp"
  | "future_timestamp"
  | "keys_unavailable";

export type SsvVerification =
  | {
      ok: true;
      transactionId: string;
      /** Our claim nonce. Attacker-controlled data used only as a lookup key. */
      userId: string | null;
      customData: string | null;
      adUnitId: string | null;
      adNetwork: string | null;
      rewardItem: string | null;
      rewardAmount: number | null;
      timestampMs: number;
    }
  | { ok: false; reason: SsvRejection; detail?: string };

/**
 * Verify one SSV callback.
 *
 * `rawQuery` must be the query string exactly as received (no leading `?`).
 */
export async function verifySsv(rawQuery: string): Promise<SsvVerification> {
  if (!rawQuery) return { ok: false, reason: "missing_params" };

  // Parse for values; verify against the raw string. The two are deliberately separate.
  const params = new URLSearchParams(rawQuery);
  const signature = params.get("signature");
  const keyId = params.get("key_id");
  const transactionId = params.get("transaction_id");
  if (!signature || !keyId || !transactionId) {
    return { ok: false, reason: "missing_params" };
  }

  // Google's contract: the signature is over everything before `&signature=`.
  const sigIndex = rawQuery.indexOf("&signature=");
  if (sigIndex < 0) return { ok: false, reason: "missing_params" };
  const signedPayload = rawQuery.slice(0, sigIndex);

  let keys: Map<string, string>;
  try {
    keys = await loadKeys();
  } catch (e) {
    // Refuse rather than guess: an unverifiable callback must never open a file.
    return { ok: false, reason: "keys_unavailable", detail: String(e).slice(0, 200) };
  }

  const pem = keys.get(keyId);
  if (!pem) return { ok: false, reason: "unknown_key", detail: `key_id ${keyId}` };

  // Signature arrives base64url (sometimes padded). Decode, then verify as raw
  // P-1363 — Node's default DER expectation would reject every genuine callback.
  const raw = Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  let valid = false;
  try {
    valid = crypto.verify(
      "sha256",
      Buffer.from(signedPayload),
      { key: pem, dsaEncoding: "ieee-p1363" },
      raw,
    );
  } catch (e) {
    return { ok: false, reason: "bad_signature", detail: String(e).slice(0, 200) };
  }
  if (!valid) return { ok: false, reason: "bad_signature" };

  // Timestamp: seconds since epoch, per Google's payload. Bounded in both
  // directions so a captured callback cannot be replayed later or pre-dated.
  const tsRaw = params.get("timestamp");
  const timestampMs = tsRaw ? Number(tsRaw) * 1000 : NaN;
  if (!Number.isFinite(timestampMs)) return { ok: false, reason: "missing_params", detail: "timestamp" };
  const age = now() - timestampMs;
  if (age > MAX_AGE_MS) return { ok: false, reason: "stale_timestamp", detail: `${Math.round(age / 1000)}s old` };
  if (age < -5 * 60 * 1000) return { ok: false, reason: "future_timestamp" };

  const amount = params.get("reward_amount");

  return {
    ok: true,
    transactionId,
    userId: params.get("user_id"),
    customData: params.get("custom_data"),
    adUnitId: params.get("ad_unit"),
    adNetwork: params.get("ad_network"),
    rewardItem: params.get("reward_item"),
    rewardAmount: amount && Number.isFinite(Number(amount)) ? Number(amount) : null,
    timestampMs,
  };
}

/** Test seam only. */
export function __resetKeyCacheForTests(): void {
  cachedKeys = null;
}
