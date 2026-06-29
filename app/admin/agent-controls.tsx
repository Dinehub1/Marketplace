"use client";

import { useState } from "react";

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
    } catch (err: any) {
      setMessage("❌ " + err.message);
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
    } catch (err: any) {
      setMessage("❌ " + err.message);
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
    } catch (err: any) {
      setMessage("❌ " + err.message);
    }
    setBusy(null);
  }

  const queuedCount = tasks.filter((t) => t.status === "queued").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        <span className="text-sm text-neutral-600">
          Queue: <strong className="text-amber-600">{queuedCount}</strong> pending ·{" "}
          <strong className="text-blue-600">{runningCount}</strong> running
        </span>
        {message && (
          <span className="ml-auto text-sm font-medium text-neutral-700">{message}</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {agents.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{agent.emoji ?? "•"}</span>
                <span className="font-semibold">{agent.name}</span>
              </div>
              <StatusPill status={agent.status} />
            </div>
            <p className="mb-3 text-sm text-neutral-500 line-clamp-2">{agent.description}</p>
            <div className="mb-3 flex items-center gap-2 text-xs text-neutral-400">
              <span className="rounded bg-neutral-100 px-2 py-0.5">{agent.role}</span>
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
                className="flex-1 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {busy === agent.slug ? "⏳ Running…" : "▶ Run Now"}
              </button>
              <button
                type="button"
                onClick={() => toggleAgent(agent.slug, agent.status)}
                disabled={busy === agent.slug + "-toggle"}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                  agent.status === "paused"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                }`}
              >
                {agent.status === "paused" ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-sm">➕ Create New Task</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title (e.g., Add new feature to PaisaFlow)"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <select
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
          >
            {agents.map((a) => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy === "create" || !newTaskTitle.trim()}
            onClick={() => createTask()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
