"use client";

import { useState } from "react";

export function LeadForm({ brandSlug, primaryColor = "#6d28d9" }: { brandSlug: string; primaryColor?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandSlug,
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        message: fd.get("message"),
        source_path: typeof window !== "undefined" ? window.location.pathname : null,
      }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        ✓ Thanks! We&apos;ve received your details and will reach out.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="name" required placeholder="Your name" className={input} />
      <input name="phone" required placeholder="Phone" className={input} />
      <input name="email" type="email" placeholder="Email (optional)" className={input} />
      <textarea name="message" rows={3} placeholder="How can we help?" className={input} />
      <button
        disabled={state === "sending"}
        className="w-full rounded-lg px-4 py-2.5 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: primaryColor }}
      >
        {state === "sending" ? "Sending…" : "Submit"}
      </button>
      {state === "error" && (
        <p className="text-sm text-rose-500">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}

const input =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-violet-500";
