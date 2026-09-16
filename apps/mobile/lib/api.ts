import { SUPABASE_URL, SUPABASE_KEY } from "./config";
import { TARGET } from "./target";

/**
 * Thin PostgREST client. Deliberately not the supabase-js SDK: the app only
 * reads a handful of tables and posts leads, and the SDK's realtime/auth/storage
 * modules are dead weight in a bundle that has to start fast on a mid-range
 * Android phone over a 3G connection.
 */

export type Business = {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  city: string | null;
  featured?: boolean;
  verified?: boolean;
};

const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function rest<T>(path: string, init?: RequestInit): Promise<{ rows: T[]; total: number }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...HEADERS, ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => "")}`.trim());
  const rows = (await res.json()) as T[];
  const total = Number((res.headers.get("content-range") ?? "").split("/")[1] ?? 0) || rows.length;
  return { rows, total };
}

const SELECT = "id,name,category,area,address,phone,rating,reviews_count,city,featured,website";
export const PAGE_SIZE = 20;

export function listBusinesses(opts: {
  q?: string;
  category?: string;
  page?: number;
  signal?: AbortSignal;
}) {
  const { q = "", category = "", page = 1, signal } = opts;
  const filters = [`select=${SELECT}`, "status=eq.active"];

  /**
   * Two things narrow this feed: what the search box says, and which directory app this
   * is. Both are "or" groups, and they have to be *and*-ed together — so they are
   * collected and emitted as one PostgREST expression rather than as two `or=` params,
   * which PostgREST would not combine the way it reads.
   */
  const orGroups: string[] = [];

  // The target's scope. This is the difference between SarkarHealth listing doctors and
  // SarkarCars listing garages, and all three directory apps listing the same 24,048
  // businesses — which is one app published three times.
  const scope = TARGET.scope;
  if (scope?.include?.length) {
    orGroups.push(
      scope.include.map((t) => `category.ilike.${encodeURIComponent(`*${t}*`)}`).join(","),
    );
  }

  if (q) {
    // ilike with wildcards on both sides; the term is URI-encoded so a user typing a
    // comma or a paren cannot break out of the filter expression. `*` survives
    // encodeURIComponent, which is what PostgREST wants for a wildcard.
    const term = encodeURIComponent(`*${q}*`);
    orGroups.push(`name.ilike.${term},category.ilike.${term}`);
  }

  if (orGroups.length === 1) filters.push(`or=(${orGroups[0]})`);
  else if (orGroups.length > 1) filters.push(`and=(${orGroups.map((g) => `or(${g})`).join(",")})`);

  // Exclusions are plain AND filters, so a scope can carve a false positive back out
  // ("legal aid clinic" contains "clinic" and is not a health listing).
  for (const t of scope?.exclude ?? []) {
    filters.push(`category=not.ilike.${encodeURIComponent(`*${t}*`)}`);
  }

  if (category) filters.push(`category=eq.${encodeURIComponent(category)}`);
  filters.push("order=featured.desc,priority.desc,rating.desc.nullslast,name.asc");

  const from = (page - 1) * PAGE_SIZE;
  return rest<Business>(`businesses?${filters.join("&")}`, {
    signal,
    headers: { Range: `${from}-${from + PAGE_SIZE - 1}`, Prefer: "count=exact" },
  });
}

export async function getBusiness(id: number, signal?: AbortSignal): Promise<Business | null> {
  const { rows } = await rest<Business>(`businesses?id=eq.${id}&select=*`, { signal });
  return rows[0] ?? null;
}

export async function listCategories(
  signal?: AbortSignal,
): Promise<{ category: string; count: number }[]> {
  // The web app counts categories by paging the whole table, which is fine on a
  // server with a warm cache and wrong on a phone. The app reads the same
  // aggregate the web /api/categories route exposes.
  const { rows } = await rest<{ category: string; count: number }>(
    `rpc/category_counts?select=category,count&order=count.desc&limit=60`,
    { signal },
  ).catch(() => ({ rows: [], total: 0 }));
  return rows;
}
