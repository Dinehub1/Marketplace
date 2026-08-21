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
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl text-[1.375rem] text-white"
            style={{ background: "var(--brand-gradient)", boxShadow: "var(--shadow-brand)" }}
            aria-hidden="true"
          >
            ⚡
          </span>
          <div>
            <h1 className="heading-md">
              Agent<span className="gradient-text">OS</span>
            </h1>
            <p className="text-sm text-ink-3">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-positive hidden sm:inline-flex">
            ● All systems operational
          </span>
          <SignOut />
        </div>
      </header>

      {/* Metrics */}
      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <Stat label="Brands" value={`${stats.brandsOnline}/${stats.brands}`} />
        <Stat label="Listings" value={stats.businesses.toLocaleString()} />
        <Stat label="Leads" value={String(stats.leads)} accent="tone-info" />
        <Stat label="Events (30d)" value={stats.events30d.toLocaleString()} accent="tone-info" />
        <Stat label="Payments" value={String(stats.payments)} accent="tone-positive" />
        <Stat label="Agents" value={`${stats.agentsActive}/${stats.agents}`} />
        <Stat label="Queued tasks" value={String(stats.tasksQueued)} accent="tone-gold" />
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
      <div className="card mb-10 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-ink-3 mb-3">
              No tasks yet. Use the Agent Control Panel above to run an agent.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusPill status={t.status} />
                  <span className="truncate">{t.title}</span>
                  {t.assignee && (
                    <span className="text-xs text-ink-3 shrink-0">→ {t.assignee}</span>
                  )}
                </div>
                <span className="text-xs text-ink-3 shrink-0">
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
              className="card card-lift group p-5"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{b.emoji ?? "•"}</span>
                  <span className="font-[620]" style={{ color: pc, letterSpacing: "-0.012em" }}>{b.name}</span>
                </div>
                <span
                  className={`text-xs font-medium ${
                    b.status === "active" ? "tone-positive" : "tone-critical"
                  }`}
                >
                  ● {b.status === "active" ? "Online" : "Offline"}
                </span>
              </div>
              {b.tagline && (
                <p className="mb-1 text-sm font-medium opacity-70" style={{ color: pc }}>{b.tagline}</p>
              )}
              <p className="mb-3 line-clamp-2 text-xs text-ink-3">{b.description}</p>
              <div className="flex items-center justify-between text-xs text-ink-3">
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
    <div className="card p-4">
      {/* Tabular figures: a stat row with proportional numerals looks
          accidentally ragged because a "1" is narrower than a "0". */}
      <div className={`tabular text-2xl font-[720] ${accent ?? ""}`} style={{ letterSpacing: "-0.028em" }}>{value}</div>
      <div className="text-caption mt-1">{label}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="heading-sm mb-4">{children}</h2>;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "border-hairline bg-[var(--positive-tint)] tone-positive",
    running: "border-hairline bg-[var(--info-tint)] tone-info",
    queued: "border-hairline bg-[var(--gold-tint)] tone-gold",
    paused: "border-hairline bg-surface-sunken text-ink-3",
    done: "border-hairline bg-[var(--positive-tint)] tone-positive",
    failed: "border-hairline bg-[var(--critical-tint)] tone-critical",
    cancelled: "border-hairline bg-surface-sunken text-ink-3",
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
      className="card card-lift group p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-[580]">{title}</span>
        <span className="text-xs text-ink-4">{external ? "↗" : "→"}</span>
      </div>
      {desc && <p className="mt-1 text-xs text-ink-3">{desc}</p>}
    </a>
  );
}
