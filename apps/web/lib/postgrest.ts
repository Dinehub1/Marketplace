/**
 * The one place that turns a PostgREST `Response` into typed rows.
 *
 * Every route used to write `((await res.json()) as any[])[0]` inline — 55 times. That
 * scattered the same two facts across the codebase: PostgREST returns a bare JSON
 * array, and the row shape is asserted, not checked.
 *
 * These helpers own both. They never throw on a malformed body (a non-JSON error page
 * from a proxy becomes "no rows", which is what the call sites already did with
 * `.catch(() => [])`), so swapping a call site over cannot change its control flow.
 * They do NOT inspect `res.ok` — callers already do that where it matters, and a helper
 * that silently swallowed a failure would turn a 500 into an empty result.
 */

/** Parse a PostgREST response as an array of rows. Never throws; `[]` on any failure. */
export async function asRows<T>(res: Response): Promise<T[]> {
  const body = await res.json().catch(() => null);
  return Array.isArray(body) ? (body as T[]) : [];
}

/** The first row, or null. The common shape for a `select` that expects one record. */
export async function asRow<T>(res: Response): Promise<T | null> {
  return (await asRows<T>(res))[0] ?? null;
}

/**
 * PostgREST's `Prefer: count=exact` total, read off `Content-Range` (`0-19/24048`).
 * Returns null when the header is absent rather than pretending the page is the total.
 */
export function totalFrom(res: Response): number | null {
  const range = res.headers.get("content-range");
  const total = Number(range?.split("/")[1]);
  return Number.isFinite(total) ? total : null;
}
