"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="relative isolate mx-auto flex min-h-[85vh] w-full max-w-sm flex-col justify-center px-6">
      <div className="aurora" />

      <div className="mb-7 text-center">
        <span
          className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl text-[1.375rem] text-white"
          style={{ background: "var(--brand-gradient)", boxShadow: "var(--shadow-brand)" }}
          aria-hidden="true"
        >
          ⚡
        </span>
        <h1 className="heading-md">
          Agent<span className="gradient-text">OS</span>
        </h1>
        <p className="mt-2 text-[0.9375rem]" style={{ color: "var(--ink-2)" }}>
          Sign in to the operator console.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card field space-y-4 p-6">
        <div>
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button disabled={busy} className="btn-primary btn-block">
          {busy ? "Signing in…" : "Sign in"}
        </button>

        {/* An error is one of the four kinds of feedback and needs to look like
            one — announced to assistive tech, and carrying the semantic colour
            rather than an arbitrary rose. */}
        {error && (
          <p
            role="alert"
            className="rounded-xl px-3.5 py-2.5 text-[0.8125rem]"
            style={{ background: "var(--critical-tint)", color: "var(--critical)" }}
          >
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
