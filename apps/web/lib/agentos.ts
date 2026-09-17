import { createClient as createSupabase } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadKey } from "./keyLoader";

// The admin console reads ops tables (leads, payments, dev_tasks, agents) that
// are NOT part of the public read surface after the Phase 0 RLS lockdown. Those
// tables carry customer data, so the browser key must never see them — reads go
// through the service role here, same privilege as every other server write.
// The key is resolved lazily so the admin pages still build without a .env.
function admin() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    loadKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type Agent = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  role: string | null;
  schedule: string | null;
  description: string | null;
  status: string;
  last_run: string | null;
  sort_order: number;
};

export type DevTask = {
  id: string;
  title: string;
  status: string;
  priority: number;
  assignee: string;
  brand_id: string | null;
  created_at: string;
};

export type PlatformStats = {
  brands: number;
  brandsOnline: number;
  businesses: number;
  leads: number;
  payments: number;
  agents: number;
  agentsActive: number;
  tasksQueued: number;
  events30d: number;
};

/** The builder `.select()` returns, so `filter` can call `.eq()`/`.in()`/`.gte()`. */
type CountBuilder = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

async function count(table: string, filter?: (q: CountBuilder) => CountBuilder): Promise<number> {
  const supabase = admin();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export async function getAgents(): Promise<Agent[]> {
  const supabase = admin();
  const { data } = await supabase.from("agents").select("*").order("sort_order");
  return (data as Agent[]) ?? [];
}

export async function getRecentTasks(limit = 6): Promise<DevTask[]> {
  const supabase = admin();
  const { data } = await supabase
    .from("dev_tasks")
    .select("id,title,status,priority,assignee,brand_id,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as DevTask[]) ?? [];
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const since = new Date(Date.now() - 30 * 86400e3).toISOString();
  const [brands, brandsOnline, businesses, leads, payments, agents, agentsActive, tasksQueued, events30d] =
    await Promise.all([
      count("brands"),
      count("brands", (q) => q.eq("status", "active")),
      count("businesses"),
      count("leads"),
      count("payments"),
      count("agents"),
      count("agents", (q) => q.in("status", ["active", "running"])),
      count("dev_tasks", (q) => q.eq("status", "queued")),
      count("business_events", (q) => q.gte("created_at", since)),
    ]);
  return { brands, brandsOnline, businesses, leads, payments, agents, agentsActive, tasksQueued, events30d };
}
