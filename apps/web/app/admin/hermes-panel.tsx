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
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            status.running
              ? "border-hairline bg-[var(--positive-tint)] tone-positive"
              : "border-hairline bg-[var(--critical-tint)] tone-critical"
          }`}
        >
          ● Gateway {status.running ? "running" : "down"}
        </span>
        {status.platforms.map((p) => (
          <span
            key={p.name}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
              p.state === "connected"
                ? "border-hairline bg-[var(--positive-tint)] tone-positive"
                : "border-hairline bg-[var(--gold-tint)] tone-gold"
            }`}
          >
            {p.name}: {p.state}
          </span>
        ))}
        <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 text-xs text-ink-3">
          {status.activeAgents} active agent{status.activeAgents === 1 ? "" : "s"}
        </span>
      </div>

      <form onSubmit={send} className="space-y-2">
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={2}
          placeholder="Message Hermes… (delivered to Discord; it replies there)"
          className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={state === "sending"}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send to Hermes"}
          </button>
          {state === "sent" && <span className="text-sm tone-positive">✓ Sent — check Discord for the reply</span>}
          {state === "error" && <span className="text-sm tone-critical">{err}</span>}
        </div>
      </form>

      <p className="mt-3 text-xs text-ink-3">
        Also reachable via Discord (connected) or <code className="rounded bg-surface-sunken px-1">ssh exness-vm</code> →{" "}
        <code className="rounded bg-surface-sunken px-1">hermes chat</code>.
      </p>
    </div>
  );
}
