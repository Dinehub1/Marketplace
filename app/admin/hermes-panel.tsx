"use client";

import { useState } from "react";

type Status = {
  running: boolean;
  activeAgents: number;
  platforms: { name: string; state: string }[];
  updatedAt: string | null;
};

export function HermesPanel({ status }: { status: Status }) {
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    setState("sending");
    setErr("");
    const r = await fetch("/admin/api/hermes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    if (r.ok) {
      setState("sent");
      setMsg("");
    } else {
      const j = await r.json().catch(() => ({}));
      setErr(j.error ?? "Send failed");
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            status.running
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-600"
          }`}
        >
          ● Gateway {status.running ? "running" : "down"}
        </span>
        {status.platforms.map((p) => (
          <span
            key={p.name}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
              p.state === "connected"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {p.name}: {p.state}
          </span>
        ))}
        <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500">
          {status.activeAgents} active agent{status.activeAgents === 1 ? "" : "s"}
        </span>
      </div>

      <form onSubmit={send} className="space-y-2">
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={2}
          placeholder="Message Hermes… (delivered to Discord; it replies there)"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={state === "sending"}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send to Hermes"}
          </button>
          {state === "sent" && <span className="text-sm text-emerald-600">✓ Sent — check Discord for the reply</span>}
          {state === "error" && <span className="text-sm text-rose-500">{err}</span>}
        </div>
      </form>

      <p className="mt-3 text-xs text-neutral-400">
        Also reachable via Discord (connected) or <code className="rounded bg-neutral-100 px-1">ssh exness-vm</code> →{" "}
        <code className="rounded bg-neutral-100 px-1">hermes chat</code>.
      </p>
    </div>
  );
}
