"use client";

import { useState } from "react";

type Props = {
  businessId: number;
  businessName: string;
  primary: string;
  secondary: string;
  accent: string;
};

export function LeadForm({ businessId, businessName, primary, secondary, accent }: Props) {
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [waLink, setWaLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    if (!name.trim()) { setError("Apna naam likhein"); return; }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").replace(/^91/, ""))) { setError("10-digit mobile number likhein"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Code nahi bheja ja saka"); return; }
      setInfo(j.delivered ? "WhatsApp par 6-digit code bheja gaya hai" : (j.deliveryError ?? "Code created — delivery mein dikkat, thodi der mein retry karein"));
      setStep("otp");
    } finally { setBusy(false); }
  }

  async function verifyAndSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const vres = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const vj = await vres.json();
      if (!vres.ok) { setError(vj.error ?? "Code galat hai"); return; }
      setToken(vj.token);
      const lres = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ business_id: businessId, name, phone: vj.phone, token: vj.token, message }),
      });
      const lj = await lres.json();
      if (!lres.ok) { setError(lj.error ?? "Lead save nahi ho saka"); return; }
      setWaLink(lj.wa_link ?? null);
      setStep("done");
    } finally { setBusy(false); }
  }

  if (step === "done") {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-lg font-bold mb-1" style={{ color: primary }}>Enquiry bheja gaya!</h3>
        <p className="text-sm opacity-60 mb-5">{businessName} ko aapki details mil gayi hain. Ve jald hi contact karenge.</p>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow"
             style={{ backgroundColor: "#25D366" }}>
            💬 WhatsApp par abhi baat karein
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={step === "form" ? sendOtp : verifyAndSubmit} className="space-y-4">
      {step === "form" ? (
        <>
          <div>
            <label className="block text-sm font-medium opacity-70 mb-1">Aapka naam</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
                   className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} />
          </div>
          <div>
            <label className="block text-sm font-medium opacity-70 mb-1">WhatsApp number</label>
            <div className="flex gap-2">
              <span className="rounded-xl border px-3 py-2.5 text-sm opacity-60" style={{ borderColor: `${accent}50` }}>+91</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={10} required
                     placeholder="98XXXXXXXX"
                     className="flex-1 rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium opacity-70 mb-1">Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                      placeholder="Kya chahiye? Timing, budget, requirement..."
                      className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium opacity-70 mb-1">WhatsApp par aaya 6-digit code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus
                 placeholder="123456"
                 className="w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-[0.4em] font-bold" style={{ borderColor: `${accent}50` }} />
          <button type="button" onClick={(e) => sendOtp(e as unknown as React.FormEvent)}
                  className="mt-2 text-xs underline opacity-50">Code dobara bhejein</button>
        </div>
      )}

      {info && <p className="text-xs text-green-600">{info}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <button type="submit" disabled={busy}
              className="w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
        {busy ? "..." : step === "form" ? "WhatsApp se verify karein →" : "Verify & enquiry bhejein"}
      </button>
      <p className="text-[11px] text-center opacity-40">Aapka number sirf is business ke saath share hoga.</p>
    </form>
  );
}
