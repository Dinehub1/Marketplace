
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const res = await fetch(`${supabaseUrl}/rest/v1/businesses?select=id&limit=1`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, Prefer: 'count=exact' },
  });
  const range = res.headers.get('content-range') ?? '';
  const total = Number(range.split('/')[1] ?? 0) || 0;
  return new Response(JSON.stringify({ businesses: total }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
