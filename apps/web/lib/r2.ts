import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";

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

async function signedFetch(method: "PUT" | "DELETE" | "GET", key: string, body?: Buffer, contentType?: string) {
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

/**
 * Object key for a product's watermarked preview.
 *
 * Takes its OWN random id on purpose. Deriving it from the clean key
 * (`<uuid>.jpg` -> `<uuid>.preview.jpg`) would let anyone holding the free
 * preview URL edit it into the URL of the paid sheet, which is the whole paywall
 * gone. Nothing the client sees may point at `output_key`.
 */
export function productPreviewKey(product: string, id: string, ext = "jpg"): string {
  return `${R2_PREFIX}/products/${product}/preview/${id}.${ext}`;
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

/** Read an object back, server-side. Null when it is missing or unreadable. */
export async function getObject(key: string): Promise<{ bytes: Buffer; type: string } | null> {
  const res = await signedFetch("GET", key).catch(() => null);
  if (!res || !res.ok) return null;
  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    type: (res.headers.get("content-type") ?? "").split(";")[0].trim(),
  };
}

/** SigV4's URI encoding: everything but the unreserved set, slashes included. */
function awsEncode(v: string): string {
  return encodeURIComponent(v).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * A presigned PUT: the phone uploads the file straight to R2, so it never passes
 * through a serverless function (Vercel caps a request body at 4.5 MB; phone photos
 * and scanned PDFs are larger).
 *
 * The content type **and the exact length** are signed headers. A client cannot use
 * the URL to store a different kind of file, or a bigger one, than the job route
 * approved — the size limits hold even though the bytes never reach our server.
 */
export function presignPut(key: string, contentType: string, contentLength: number, expiresSec = 900): string {
  if (!r2Configured) throw new Error("R2 is not configured");
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${BUCKET}/${encodeKey(key)}`;
  const signedHeaders = "content-length;content-type;host";
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${ACCESS_KEY}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSec),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${awsEncode(k)}=${awsEncode(query[k])}`)
    .join("&");
  const canonicalHeaders = `content-length:${contentLength}\ncontent-type:${contentType}\nhost:${host()}\n`;
  const canonicalRequest = ["PUT", canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const hmac = (k: Buffer | string, msg: string) => createHmac("sha256", k).update(msg).digest();
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${SECRET_KEY}`, dateStamp), "auto"), "s3"), "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return `https://${host()}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/**
 * An upload ticket: proof that *this server* issued an input key, for this product,
 * type and size, recently.
 *
 * `/api/job` accepts a staged input only with a valid ticket. Without it a caller
 * could name any object in the bucket as "their" input — another job's paid output,
 * say — and have a free product hand it back.
 */
export type UploadClaim = { key: string; type: string; size: number; exp: number };

function ticketMac(payload: string): Buffer {
  return createHmac("sha256", `upload-ticket:${SECRET_KEY}`).update(payload).digest();
}

export function signUploadTicket(claim: UploadClaim): string {
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  return `${payload}.${ticketMac(payload).toString("base64url")}`;
}

export function verifyUploadTicket(ticket: string, now = Date.now()): UploadClaim | null {
  const [payload, mac] = String(ticket ?? "").split(".");
  if (!payload || !mac || !SECRET_KEY) return null;
  const want = ticketMac(payload);
  const got = Buffer.from(mac, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadClaim;
    if (typeof claim.key !== "string" || typeof claim.type !== "string" || !Number.isInteger(claim.size)) return null;
    if (typeof claim.exp !== "number" || claim.exp < now) return null;
    return claim;
  } catch {
    return null;
  }
}
