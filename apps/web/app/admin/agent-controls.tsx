"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/errors";

type Agent = {
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

type Task = {
  id: string;
  title: string;
  status: string;
  assignee: string;
  priority: number;
  created_at: string;
};

export function AgentControls({ agents, tasks }: { agents: Agent[]; tasks: Task[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("dev-agent");

  async function doAction(action: string, body: Record<string, unknown>) {
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    return res;
  }

  async function runAgent(slug: string) {
    setBusy(slug);
    setMessage("");
    try {
      const res = await doAction("run_agent", { slug });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ " + data.message);
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (err) {
      setMessage("❌ " + errorMessage(err));
    }
    setBusy(null);
  }

  async function toggleAgent(slug: string, currentStatus: string) {
    const newStatus = currentStatus === "paused" ? "active" : "paused";
    setBusy(slug + "-toggle");
    try {
      const res = await doAction("update_agent", { slug, status: newStatus });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Agent " + newStatus);
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (err) {
      setMessage("❌ " + errorMessage(err));
    }
    setBusy(null);
  }

  async function createTask() {
    if (!newTaskTitle.trim()) return;
    setBusy("create");
    try {
      const res = await doAction("create_task", {
        title: newTaskTitle,
        assignee: newTaskAssignee,
        spec: newTaskTitle,
        priority: 50,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Task created and queued");
        setNewTaskTitle("");
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (err) {
      setMessage("❌ " + errorMessage(err));
    }
    setBusy(null);
  }

  const queuedCount = tasks.filter((t) => t.status === "queued").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3">
        <span className="text-sm text-ink-2">
          Queue: <strong className="tone-gold">{queuedCount}</strong> pending ·{" "}
          <strong className="tone-info">{runningCount}</strong> running
        </span>
        {message && (
          <span className="ml-auto text-sm font-medium text-ink-2">{message}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-hairline bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{agent.emoji ?? "•"}</span>
                <span className="font-semibold">{agent.name}</span>
              </div>
              <StatusPill status={agent.status} />
            </div>
            <p className="mb-3 text-sm text-ink-3 line-clamp-2">{agent.description}</p>
            <div className="mb-3 flex items-center gap-2 text-xs text-ink-3">
              <span className="rounded bg-surface-sunken px-2 py-0.5">{agent.role}</span>
              <span>{agent.schedule}</span>
              {agent.last_run && (
                <span className="ml-auto">Last: {new Date(agent.last_run).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => runAgent(agent.slug)}
                disabled={busy === agent.slug}
                className="flex-1 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {busy === agent.slug ? "⏳ Running…" : "▶ Run Now"}
              </button>
              <button
                type="button"
                onClick={() => toggleAgent(agent.slug, agent.status)}
                disabled={busy === agent.slug + "-toggle"}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                  agent.status === "paused"
                    ? "bg-[var(--positive)] text-white hover:opacity-90"
                    : "bg-surface-sunken text-ink-2 hover:bg-surface-sunken"
                }`}
              >
                {agent.status === "paused" ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-hairline bg-surface p-5">
        <h3 className="mb-3 font-semibold text-sm">➕ Create New Task</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title (e.g., Add new feature to PaisaFlow)"
            className="flex-1 rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]"
          />
          <select
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            className="rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]"
          >
            {agents.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy === "create" || !newTaskTitle.trim()}
            onClick={() => createTask()}
            className="rounded-lg bg-[var(--positive)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy === "create" ? "⏳" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
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
