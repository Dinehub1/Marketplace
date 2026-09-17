"use client";

import { useState } from "react";

type Props = {
  businessId: number;
  businessName: string;
  businessPhone: string;
  primary: string;
  secondary: string;
  accent: string;
};

/**
 * Inline "claim this business" flow. Reuses the same OTP pipeline as the
 * dashboard/login: verify the WhatsApp number, then claim. Ownership is proven
 * by matching the verified phone to the listing's stored phone.
 */
export function ClaimBox({ businessId, businessName, businessPhone }: Props) {
  const [step, setStep] = useState<"phone" | "otp" | "done">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").replace(/^91/, ""))) { setError("10-digit mobile number likhein"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Code nahi bheja ja saka"); return; }
      setInfo(j.delivered ? "WhatsApp par 6-digit code bheja gaya hai" : (j.deliveryError ?? "Code create hua, delivery mein dikkat"));
      setStep("otp");
    } finally { setBusy(false); }
  }

  async function verifyAndClaim(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const vres = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const vj = await vres.json();
      if (!vres.ok) { setError(vj.error ?? "Code galat hai"); return; }
      const cres = await fetch(`/api/businesses/${businessId}/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: vj.phone, token: vj.token }),
      });
      const cj = await cres.json();
      if (!cres.ok) { setError(cj.error ?? "Claim nahi ho saka"); return; }
      setStep("done");
    } finally { setBusy(false); }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--positive-tint)] tone-positive">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.5 16.2 4.8 11.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4z"/></svg>
          </span>
          <div>
            <h2 className="font-bold" style={{ color: "var(--brand-secondary)" }}>Claimed & verified</h2>
            <p className="text-sm opacity-60 mt-0.5">
              {businessName} is now verified. Manage enquiries from your{" "}
              <a href="/business-dashboard" className="underline font-semibold" style={{ color: "var(--brand-secondary)" }}>business dashboard</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
      <h2 className="font-bold text-lg mb-1" style={{ color: "var(--brand-secondary)" }}>Own this business?</h2>
      <p className="text-sm opacity-60 mb-4">
        Claim it to verify your listing and reply to customer enquiries. Verify the WhatsApp number on the listing:{" "}
        <span className="font-semibold opacity-80">{businessPhone || "your business number"}</span>.
      </p>
      <form onSubmit={step === "phone" ? sendOtp : verifyAndClaim} className="space-y-3">
        {step === "phone" ? (
          <div className="flex gap-2">
            <span className="rounded-xl border px-3 py-2.5 text-sm opacity-60" style={{ borderColor: "var(--hairline)" }}>+91</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={10} required
                   placeholder="WhatsApp number on listing"
                   className="flex-1 rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--hairline)" }} />
          </div>
        ) : (
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus
                 placeholder="6-digit code"
                 className="w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-[0.4em] font-bold" style={{ borderColor: "var(--hairline)" }} />
        )}
        {info && <p className="text-xs tone-positive">{info}</p>}
        {error && <p className="text-xs tone-critical">{error}</p>}
        <button type="submit" disabled={busy}
                className="w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow disabled:opacity-50"
                style={{ background: "var(--brand-gradient)" }}>
          {busy ? "..." : step === "phone" ? "Send OTP & claim" : "Verify & claim"}
        </button>
      </form>
    </div>
  );
}
