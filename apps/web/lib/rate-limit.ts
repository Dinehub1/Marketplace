// In-process sliding-window rate limiter for the API routes.
//
// PM2 runs a single fork, so a module-level Map is a real shared counter on the
// production host. On serverless it silently becomes per-instance — still a net
// improvement over no limit at all, and the write endpoints also carry
// DB-backed dedupe/idempotency guards where it matters (leads, otp_codes).

const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = { ok: boolean; retryAfterMs?: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const t = Date.now();
  const cutoff = t - windowMs;
  let hits = buckets.get(key);

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, arr] of buckets) {
      if (!arr.length || arr[arr.length - 1] <= cutoff) buckets.delete(k);
    }
  }

  if (!hits) {
    hits = [];
    buckets.set(key, hits);
  }
  while (hits.length > 0 && hits[0] <= cutoff) hits.shift();

  if (hits.length >= limit) {
    const oldest = hits[0];
    return { ok: false, retryAfterMs: Math.max(0, oldest + windowMs - t) };
  }
  hits.push(t);
  return { ok: true };
}

/** Best-effort caller IP taken from proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const first = fwd.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}