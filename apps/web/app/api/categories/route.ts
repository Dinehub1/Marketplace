import { NextRequest } from 'next/server';

const PAGE = 1000; // PostgREST max-rows cap per request

export async function GET(_req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const rows: { category: string | null; city: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${supabaseUrl}/rest/v1/businesses?select=category,city&order=id.asc`, {
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
  return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
