import { CITY_LABEL } from '@hermes/core';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = (url.searchParams.get('search') ?? url.searchParams.get('q') ?? '').trim();
  // Default to the directory's city. Leaving this empty searched EVERY city at
  // once, so a query with no ?city= could return Mumbai listings from an Indore
  // surface. (2026-09-19)
  const city = (url.searchParams.get('city') ?? CITY_LABEL).trim();
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const filter: string[] = [];
  if (city) filter.push(`city=eq.${encodeURIComponent(city)}`);
  if (search) {
    const term = encodeURIComponent(`*${search}*`);
    filter.push(`or=(name.ilike.${term},category.ilike.${term})`);
  }
  filter.push('select=*', `limit=${limit}`, 'order=rating.desc.nullslast');

  const res = await fetch(`${supabaseUrl}/rest/v1/businesses?${filter.join('&')}`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
