"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * WhatsApp OTP login — one "Sarkar ID" across every brand.
 *
 * Uses Supabase native phone auth (signInWithOtp / verifyOtp). The OTP is
 * delivered over WhatsApp by the "whatsapp-otp" Send SMS Hook (Nextel).
 * On success the Supabase session cookie is scoped to .cashcard.live, so the
 * user is logged in on every brand subdomain at once.
 */
export function WhatsAppLogin({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const bg = theme.bg ?? "#f9fafb";
  const supabase = createClient();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Normalise to E.164 for India: 10 digits → +91XXXXXXXXXX.
  function e164(raw: string): string | null {
    const d = raw.replace(/[^\d]/g, "");
    if (d.length === 10) return `+91${d}`;
    if (d.length === 12 && d.startsWith("91")) return `+${d}`;
    if (raw.trim().startsWith("+") && d.length >= 11) return `+${d}`;
    return null;
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const p = e164(phone);
    if (!p) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: p });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setPhone(p);
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code.replace(/[^\d]/g, ""),
      type: "sms",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Full reload so the new session cookie is picked up server-side.
    window.location.assign(`https://${brand.slug}.cashcard.live/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">{brand.emoji ?? "🔐"}</div>
          <h1 className="text-3xl font-bold" style={{ color: primary }}>{brand.name}</h1>
          <p className="mt-1 text-sm opacity-60">{brand.tagline}</p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: primary }}>Sign in with WhatsApp</h2>
              <p className="text-xs opacity-60">We&apos;ll send a one-time code to your WhatsApp.</p>
              <div>
                <label className="mb-1 block text-xs font-medium opacity-60">Mobile number</label>
                <div className="flex items-center rounded-lg border border-gray-300 focus-within:border-violet-500">
                  <span className="px-3 text-sm text-gray-500">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoFocus
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-r-lg px-2 py-2 text-sm outline-none"
                    placeholder="98765 43210"
                  />
                </div>
              </div>
              {error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#25D366" }}
              >
                {loading ? "Sending…" : "Send code on WhatsApp"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: primary }}>Enter the code</h2>
              <p className="text-xs opacity-60">
                Sent to <span className="font-medium">{phone}</span>{" "}
                <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(null); }} className="underline" style={{ color: primary }}>change</button>
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-violet-500"
                placeholder="••••••"
              />
              {error && <p className="rounded-lg bg-rose-50 p-2 text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.replace(/[^\d]/g, "").length < 6}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {loading ? "Verifying…" : "Verify & continue"}
              </button>
              <button
                type="button"
                onClick={(e) => sendOtp(e as unknown as React.FormEvent)}
                disabled={loading}
                className="w-full text-center text-xs opacity-60 hover:opacity-100"
              >
                Resend code
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] opacity-40">
          One login works across all Sarkar brands.
        </p>
      </div>
    </div>
  );
}
