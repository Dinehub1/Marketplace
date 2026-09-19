/**
 * AdMob SSV verifier self-check — "does it actually refuse a forgery?"
 *
 * This is the part of the ad system where a bug means free files, so the verifier
 * gets a real cryptographic test rather than a mock: a genuine ES256 key pair is
 * generated, Google's key file is served from a local socket, callbacks are signed
 * the way AdMob signs them, and then the verifier is attacked.
 *
 * The cases that matter, and why:
 *   - a correctly signed callback verifies        (it is not broken by default)
 *   - a tampered payload is refused               (the attack we are defending against)
 *   - a signature from a different key is refused (key confusion)
 *   - a replayed old callback is refused          (a receipt is not a bearer token)
 *   - a key id Google does not publish is refused (no trusting the payload)
 *   - a callback signed over DIFFERENT bytes than
 *     the ones we verify is refused               (the "helpful normalisation" bug)
 *
 * Run: node apps/web/scripts/check-ad-ssv.mjs
 */
import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${label}${ok ? "" : ` (got ${actual}, wanted ${expected})`}`);
}

// --- a stand-in for AdMob's signing key, plus a decoy -------------------------
const real = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const decoy = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const KEY_ID = "3335741209";
const DECOY_ID = "9999999999";

const keysJson = JSON.stringify({
  keys: [
    { keyId: Number(KEY_ID), pem: real.publicKey.export({ type: "spki", format: "pem" }) },
  ],
});

// Serve the key file over HTTP, because the verifier fetches it.
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(keysJson);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const keysUrl = `http://127.0.0.1:${server.address().port}/verifier-keys.json`;

const mod = await import(pathToFileURL(path.join(ROOT, "lib/ad-ssv.ts")).href.replace(/\.ts$/, ".ts"));
// Next's TS loader is not available here; use the transpiled-free route: node runs TS natively in v26.

mod.__setKeysUrlForTests(keysUrl);

function buildCallback({ keyPair = real, keyId = KEY_ID, timestamp = Math.floor(Date.now() / 1000), tamper = false, reencode = false } = {}) {
  const pairs = [
    ["ad_network", "5450213213286189855"],
    ["ad_unit", "ca-app-pub-3940256099942544/5224354917"],
    ["custom_data", "job=158"],
    ["reward_amount", "1"],
    ["reward_item", "file_unlock"],
    ["timestamp", String(timestamp)],
    ["transaction_id", "e2e-txn-0001"],
    ["user_id", "claim-abc123"],
  ];
  // What Google signs:
  const signed = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

  // What is served. An attacker who cannot produce a signature can still change
  // these bytes — the whole point of the test is that the signature no longer
  // matches them.
  let served = signed;
  if (tamper) served = served.replace("job%3D158", "job%3D999");
  // A "helpful" verifier that re-encodes parsed values would accept this; one that
  // verifies the raw bytes must not.
  if (reencode) served = served.replace("custome_data", "").replace("custom_data=job%3D158", "custom_data=job=158");

  const sig = crypto.sign("sha256", Buffer.from(signed), { key: keyPair.privateKey, dsaEncoding: "ieee-p1363" });
  const b64url = sig.toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  return `${served}&signature=${b64url}&key_id=${keyId}`;
}

console.log("\nAdMob SSV verifier\n");

// 1. the happy path
{
  const v = await mod.verifySsv(buildCallback());
  check("a genuine callback verifies", v.ok, true);
  if (v.ok) {
    check("  transaction id read back", v.transactionId, "e2e-txn-0001");
    check("  claim nonce read back", v.userId, "claim-abc123");
  }
}

// 2. tampered payload, signature left as-is
{
  const v = await mod.verifySsv(buildCallback({ tamper: true }));
  check("a tampered payload is refused", v.ok, false);
  check("  and refused as a bad signature", v.ok === false ? v.reason : "", "bad_signature");
}

// 3. signed by a key Google does not publish
{
  const v = await mod.verifySsv(buildCallback({ keyPair: decoy }));
  check("a signature from another key is refused", v.ok, false);
}

// 4. replay of an old (still correctly signed) callback
{
  const old = Math.floor((Date.now() - 3 * 60 * 60 * 1000) / 1000);
  const v = await mod.verifySsv(buildCallback({ timestamp: old }));
  check("an old callback is refused", v.ok, false);
  check("  and refused as stale", v.ok === false ? v.reason : "", "stale_timestamp");
}

// 5. a key id that is not in Google's file
{
  const v = await mod.verifySsv(buildCallback({ keyId: DECOY_ID }));
  check("an unpublished key id is refused", v.ok, false);
  check("  and refused as unknown key", v.ok === false ? v.reason : "", "unknown_key");
}

// 6. the encoding trap: same logical value, different bytes on the wire
{
  const v = await mod.verifySsv(buildCallback({ reencode: true }));
  check("a re-encoded payload does not verify", v.ok, false);
  check("  and refused as a bad signature", v.ok === false ? v.reason : "", "bad_signature");
}

// 7. missing pieces
{
  check("an empty query is refused", (await mod.verifySsv("")).ok, false);
  const noSig = "ad_network=1&transaction_id=x&timestamp=1";
  check("a callback with no signature is refused", (await mod.verifySsv(noSig)).ok, false);
}

server.close();
console.log(`\n${failures === 0 ? "✓ every SSV rule holds." : `✗ ${failures} rule(s) failed.`}\n`);
process.exit(failures === 0 ? 0 : 1);
