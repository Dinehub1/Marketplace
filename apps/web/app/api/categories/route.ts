import { CITY_LABEL } from '@brandcollabs/core';

const PAGE = 1000; // PostgREST max-rows cap per request

/**
 * Category counts change when a listing is added, not per request, but computing
 * them walks every business row (~25 sequential pages, ~5 s). So the answer is kept:
 *
 *   - `s-maxage` lets a CDN (Vercel's, for api.dropby.co.in) serve it for 10 minutes
 *     and `stale-while-revalidate` refresh it in the background after that, so a
 *     caller almost never waits for the walk and the function runs rarely;
 *   - the in-memory copy covers the VM, where `/api` is not edge-cached.
 */
const CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
};
const MEMO_MS = 10 * 60 * 1000;
let memo: { at: number; body: string } | null = null;

export async function GET() {
  if (memo && Date.now() - memo.at < MEMO_MS) {
    return new Response(memo.body, { status: 200, headers: CACHE_HEADERS });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const rows: { category: string | null; city: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${supabaseUrl}/rest/v1/businesses?select=category,city&city=eq.${encodeURIComponent(CITY_LABEL)}&order=id.asc`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Range: `${from}-${from + PAGE - 1}`,
      },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    const page: typeof rows = await res.json();
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  const counts = new Map<string, { category: string; city: string | null; count: number }>();
  for (const r of rows) {
    if (!r.category) continue;
    const key = r.category.toLowerCase();
    const entry = counts.get(key);
    if (entry) entry.count += 1;
    else counts.set(key, { category: r.category, city: r.city, count: 1 });
  }
  const out = [...counts.values()].sort((a, b) => b.count - a.count);
  const body = JSON.stringify(out);
  memo = { at: Date.now(), body };
  return new Response(body, { status: 200, headers: CACHE_HEADERS });
}
