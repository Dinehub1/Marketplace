import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBrands } from "@/lib/brands";
import { getAgents, getRecentTasks, getPlatformStats } from "@/lib/agentos";
import { getGatewayStatus } from "@/lib/hermes";
import { SignOut } from "./sign-out";
import { HermesPanel } from "./hermes-panel";
import { AgentControls } from "./agent-controls";

export const dynamic = "force-dynamic";

const SUPABASE_PROJECT = "https://supabase.com/dashboard/project/xpfmqpmhmcouwzebfwhb";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [brands, agents, tasks, stats] = await Promise.all([
    getBrands(),
    getAgents(),
    getRecentTasks(10),
    getPlatformStats(),
  ]);
  const hermes = getGatewayStatus();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Agent<span className="text-violet-600">OS</span>
            </h1>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
            ● All systems operational
          </span>
          <SignOut />
        </div>
      </header>

      {/* Metrics */}
      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Brands" value={`${stats.brandsOnline}/${stats.brands}`} />
        <Stat label="Listings" value={stats.businesses.toLocaleString()} />
        <Stat label="Leads" value={String(stats.leads)} accent="text-violet-600" />
        <Stat label="Payments" value={String(stats.payments)} accent="text-emerald-600" />
        <Stat label="Agents" value={`${stats.agentsActive}/${stats.agents}`} />
        <Stat label="Queued tasks" value={String(stats.tasksQueued)} accent="text-amber-600" />
      </section>

      {/* Hermes agent */}
      <SectionTitle>🛰️ Hermes Agent</SectionTitle>
      <div className="mb-10">
        <HermesPanel status={hermes} />
      </div>

      {/* Agent Controls — NEW */}
      <SectionTitle>🤖 Agent Control Panel</SectionTitle>
      <div className="mb-10">
        <AgentControls agents={agents} tasks={tasks} />
      </div>

      {/* Task queue */}
      <SectionTitle>📋 Recent tasks</SectionTitle>
      <div className="mb-10 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-neutral-400 mb-3">
              No tasks yet. Use the Agent Control Panel above to run an agent.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusPill status={t.status} />
                  <span className="truncate">{t.title}</span>
                  {t.assignee && (
                    <span className="text-xs text-neutral-400 shrink-0">→ {t.assignee}</span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 shrink-0">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tools */}
      <SectionTitle>🛠️ Tools</SectionTitle>
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card href={SUPABASE_PROJECT} title="Supabase project" desc="Database home & settings" external />
        <Card href={`${SUPABASE_PROJECT}/editor`} title="Table editor" desc="brands · leads · payments · businesses" external />
        <Card href={`${SUPABASE_PROJECT}/auth/users`} title="Auth / users" desc="Manage admin logins · change password" external />
        <Card href={`${SUPABASE_PROJECT}/sql/new`} title="SQL editor" desc="Run queries" external />
        <Card href="https://sarkar.cashcard.live" title="Marketplace" desc="Indore directory (3,233 listings)" external />
        <Card href={`${SUPABASE_PROJECT}/database/backups`} title="Database backups" desc="Restore points" external />
      </div>

      {/* Brand sites */}
      <SectionTitle>🗂️ Brand sites ({brands.length})</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const t = (b.theme ?? {}) as Record<string, string>;
          const pc = t.primary ?? "#6d28d9";
          return (
            <Link
              key={b.id}
              href={`/${b.slug}`}
              target="_blank"
              className="group rounded-xl border bg-white p-5 transition hover:shadow-lg"
              style={{ borderColor: `${pc}30` }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{b.emoji ?? "•"}</span>
                  <span className="font-semibold group-hover:opacity-80" style={{ color: pc }}>{b.name}</span>
                </div>
                <span
                  className={`text-xs font-medium ${
                    b.status === "active" ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  ● {b.status === "active" ? "Online" : "Offline"}
                </span>
              </div>
              {b.tagline && (
                <p className="mb-1 text-sm font-medium opacity-70" style={{ color: pc }}>{b.tagline}</p>
              )}
              <p className="mb-3 line-clamp-2 text-xs text-neutral-400">{b.description}</p>
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="rounded-full px-2 py-0.5 text-white text-[10px] font-semibold" style={{ backgroundColor: pc }}>
                  {b.category}
                </span>
                <span>↗ open site</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-lg font-semibold">{children}</h2>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    running: "border-blue-200 bg-blue-50 text-blue-700",
    queued: "border-amber-200 bg-amber-50 text-amber-700",
    paused: "border-neutral-200 bg-neutral-100 text-neutral-500",
    done: "border-emerald-200 bg-emerald-50 text-emerald-700",
    failed: "border-rose-200 bg-rose-50 text-rose-600",
    cancelled: "border-neutral-200 bg-neutral-100 text-neutral-400",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${map[status] ?? map.paused}`}>
      {status}
    </span>
  );
}

function Card({ href, title, desc, external }: { href: string; title: string; desc: string; external?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium group-hover:text-violet-700">{title}</span>
        <span className="text-xs text-neutral-300">{external ? "↗" : "→"}</span>
      </div>
      {desc && <p className="mt-1 text-xs text-neutral-500">{desc}</p>}
    </a>
  );
}
