import type { GatewayStatus } from "@/lib/hermes";

/**
 * Agent gateway status.
 *
 * This panel renders live gateway status by reading `gateway_state.json` off disk.
 * To drive the background agent, use Discord or the CLI.
 *
 * A server component on purpose: nothing here is interactive.
 */
export function AgentStatusPanel({ status }: { status: GatewayStatus }) {
  const updated = status.updatedAt ? new Date(status.updatedAt) : null;
  const updatedLabel =
    updated && !Number.isNaN(updated.getTime())
      ? updated.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : null;

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
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
        {updatedLabel && (
          <span className="text-xs text-ink-3">as of {updatedLabel}</span>
        )}
      </div>

      <p className="mt-3 text-xs text-ink-3">
        Read from <code className="rounded bg-surface-sunken px-1">gateway_state.json</code> on the VM.
      </p>
    </div>
  );
}

export const HermesPanel = AgentStatusPanel;
