import { createHash, createHmac, randomUUID } from "crypto";

/**
 * Cloudflare R2 client — S3-compatible PUT/DELETE signed with SigV4.
 *
 * Written by hand rather than pulling in @aws-sdk/client-s3: this VM installs
 * packages in 20-minute chunks, and signing is ~40 lines of node:crypto.
 *
 * The bucket (cashcard-data-storage) is shared with other apps of the user's, so
 * every object this platform writes lives under R2_PREFIX (`marketplace/`):
 * marketplace/listings/<business_id>/<uuid>.<ext>. That is what keeps listing
 * photos from mixing with the checkins/ and menu/ folders of the other apps.
 *
 * R2 is optional: when the keys are absent the helpers report it instead of
 * throwing, so the site keeps working and the upload route returns a clear error.
 */
const ACCOUNT = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "";
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "";
const ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "";
const SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "";

export const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
  process.env.CLOUDFLARE_R2_PUBLIC_URL ??
  ""
).replace(/\/+$/, "");

export const R2_PREFIX = (process.env.R2_PREFIX ?? "marketplace").replace(/^\/+|\/+$/g, "");

export const r2Configured = Boolean(ACCOUNT && BUCKET && ACCESS_KEY && SECRET_KEY && R2_PUBLIC_URL);

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function host(): string {
  return `${ACCOUNT}.r2.cloudflarestorage.com`;
}

function encodeKey(key: string): string {
  // Each segment is encoded but the slashes are preserved.
  return key.split("/").map(encodeURIComponent).join("/");
}

async function signedFetch(method: "PUT" | "DELETE", key: string, body?: Buffer, contentType?: string) {
  if (!r2Configured) throw new Error("R2 is not configured");
  const payloadHash = createHash("sha256").update(body ?? Buffer.alloc(0)).digest("hex");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20260914T101112Z
  const dateStamp = amzDate.slice(0, 8);
  const canonicalUri = `/${BUCKET}/${encodeKey(key)}`;

  const headers: Record<string, string> = {
    host: host(),
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((h) => `${h}:${headers[h]}\n`).join("");
  const canonicalRequest = [
    method,
    canonicalUri,
    "", // query string: none
    canonicalHeaders,
    signedHeaderNames.join(";"),
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const hmac = (keyOrSeed: Buffer | string, msg: string) =>
    createHmac("sha256", keyOrSeed).update(msg).digest();
  const kDate = hmac(`AWS4${SECRET_KEY}`, dateStamp);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  headers.Authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope}, ` +
    `SignedHeaders=${signedHeaderNames.join(";")}, Signature=${signature}`;

  return fetch(`https://${host()}${canonicalUri}`, {
    method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
  });
}

/** Object key for a listing photo, inside this platform's own namespace. */
export function listingKey(businessId: number, ext: string): string {
  return `${R2_PREFIX}/listings/${businessId}/${randomUUID()}.${ext}`;
}

export function publicUrlFor(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<boolean> {
  const res = await signedFetch("PUT", key, body, contentType);
  return res.ok;
}

export async function deleteObject(key: string): Promise<boolean> {
  const res = await signedFetch("DELETE", key);
  return res.ok || res.status === 404;
}
