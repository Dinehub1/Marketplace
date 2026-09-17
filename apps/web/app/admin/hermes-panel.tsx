import type { GatewayStatus } from "@/lib/hermes";

/**
 * Hermes gateway status.
 *
 * This panel used to render a "Message Hermes…" textarea and a "Send to Hermes"
 * button. That whole form was dead three times over:
 *
 *   1. it POSTed to `/admin/api/hermes`, and no such route handler has ever existed
 *      (`apps/web/app/admin/` has no `api/` directory) — the request 404s;
 *   2. the button was `type="button"`, so it did not submit the form even when
 *      clicked;
 *   3. the only field was a `<textarea>`, where Enter inserts a newline rather than
 *      submitting, so there was no way to trigger `onSubmit` from the keyboard either.
 *
 * The gateway has no HTTP chat surface to implement it against — it is driven over
 * Discord and the `hermes chat` CLI (see docs/hermes-architecture-audit.md) — so the
 * honest fix is to delete the form rather than invent an endpoint behind it. What
 * remains is the half that really worked: reading `gateway_state.json` off disk.
 *
 * A server component on purpose: nothing here is interactive.
 */
export function HermesPanel({ status }: { status: GatewayStatus }) {
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
        Read from <code className="rounded bg-surface-sunken px-1">gateway_state.json</code> on the VM. To
        drive the agent, use Discord or <code className="rounded bg-surface-sunken px-1">ssh exness-vm</code> →{" "}
        <code className="rounded bg-surface-sunken px-1">hermes chat</code>.
      </p>
    </div>
  );
}
