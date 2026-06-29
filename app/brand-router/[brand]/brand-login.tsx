"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BrandLogin({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const bg = theme.bg ?? "#f9fafb";
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push(`https://${brand.slug}.cashcard.live/dashboard`);
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `https://${brand.slug}.cashcard.live/dashboard` } });
      if (error) setError(error.message);
      else setError("Check your email for a confirmation link.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold" style={{ color: primary }}>{brand.name}</h1>
          <p className="mt-1 text-sm opacity-60">{brand.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: primary }}>
            {mode === "login" ? "Sign in to your account" : "Create an account"}
          </h2>

          <div>
            <label className="block text-xs font-medium opacity-60 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium opacity-60 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-rose-500 rounded-lg bg-rose-50 p-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Sign Up"}
          </button>

          <p className="text-center text-xs opacity-50">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="underline font-medium" style={{ color: primary }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
