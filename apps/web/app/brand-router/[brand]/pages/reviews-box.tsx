"use client";

import { useState } from "react";

type Review = { id: string; author_name: string; rating: number; body: string; created_at: string; owner_reply?: string | null };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type Props = {
  businessId: number;
  initialReviews: Review[];
  avg: number | null;
  count: number;
  primary: string;
  secondary: string;
  accent: string;
  brandName: string;
  /** When true, the viewer owns this business and may post owner replies. */
  canReply?: boolean;
  /** Verified owner phone + token, required for posting replies when canReply. */
  replyPhone?: string;
  replyToken?: string;
};

export function ReviewsBox({ businessId, initialReviews, avg, count, primary, secondary, accent, brandName, canReply, replyPhone, replyToken }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [step, setStep] = useState<"view" | "input" | "otp" | "done">("view");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState("");

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    setReplyError("");
    if (!replyTo) return;
    if (!replyText.trim()) { setReplyError("Reply likhein"); return; }
    if (!replyPhone || !replyToken) { setReplyError("Owner verify nahi hua"); return; }
    setReplyBusy(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/reviews/${replyTo}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reply: replyText.trim(), phone: replyPhone, token: replyToken }),
      });
      const j = await res.json();
      if (!res.ok) { setReplyError(j.error ?? "Reply save nahi hui"); return; }
      if (j.review) {
        const r = j.review as Review;
        setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, owner_reply: r.owner_reply } : x)));
      }
      setReplyTo(null);
      setReplyText("");
    } finally { setReplyBusy(false); }
  }

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

  async function verifyAndPost(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const vres = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const vj = await vres.json();
      if (!vres.ok) { setError(vj.error ?? "Code galat hai"); return; }
      const pres = await fetch(`/api/businesses/${businessId}/reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, rating, body, phone: vj.phone, token: vj.token }),
      });
      const pj = await pres.json();
      if (!pres.ok) { setError(pj.error ?? "Review save nahi ho saki"); return; }
      if (pj.review) setReviews((r) => [pj.review as Review, ...r]);
      setStep("done");
    } finally { setBusy(false); }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border bg-surface p-6 text-center shadow-sm" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-4xl mb-2">✅</div>
        <h3 className="font-bold" style={{ color: "var(--brand-secondary)" }}>Review published</h3>
        <p className="text-sm opacity-60 mt-1">Thanks — your review helps others in {brandName}.</p>
        <button onClick={() => setStep("view")} className="press mt-4 text-sm font-semibold underline" style={{ color: "var(--brand-secondary)" }}>Back to reviews</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>★</span>
          Customer reviews
        </h2>
        {count > 0 && (
          <span className="text-sm font-semibold tone-gold">
            ★ {avg?.toFixed(1)} <span className="font-normal text-ink-3">({count})</span>
          </span>
        )}
      </div>

      {step === "view" && (
        <>
          {reviews.length === 0 ? (
            <p className="text-sm opacity-50 py-4 text-center">No reviews yet. Be the first to share your experience.</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {reviews.map((r) => (
                <div key={r.id} className="border-t pt-3" style={{ borderColor: "var(--hairline)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.author_name}</p>
                    <span className="text-xs tone-gold font-semibold">★ {r.rating}</span>
                  </div>
                  <p className="text-sm opacity-70 mt-1">{r.body}</p>
                  <p className="text-xs opacity-40 mt-1">{timeAgo(r.created_at)}</p>

                  {r.owner_reply ? (
                    <div className="mt-2 ml-4 pl-3 border-l-2 text-sm" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
                      <p className="text-xs font-semibold opacity-80">Owner replies:</p>
                      <p className="opacity-80 mt-0.5">{r.owner_reply}</p>
                    </div>
                  ) : null}

                  {canReply && (
                    <div className="mt-2">
                      {replyTo === r.id ? (
                        <form onSubmit={sendReply} className="space-y-2">
                          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={2000} required rows={2}
                                    placeholder="Apna reply likhein…"
                                    className="w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--hairline)" }} />
                          {replyError && <p className="text-xs tone-critical">{replyError}</p>}
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setReplyTo(null); setReplyText(""); }} className="rounded-xl px-3 py-1.5 text-xs font-semibold opacity-60">Cancel</button>
                            <button type="submit" disabled={replyBusy} className="flex-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow disabled:opacity-50"
                                    style={{ background: "var(--brand-gradient)" }}>{replyBusy ? "..." : "Reply karein"}</button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => { setReplyTo(r.id); setReplyText(""); setReplyError(""); }}
                                className="text-xs font-semibold underline opacity-70" style={{ color: "var(--brand-secondary)" }}>
                          {r.owner_reply ? "Edit reply" : "Reply karein"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setStep("input")} className="press mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow"
                  style={{ background: "var(--brand-gradient)" }}>
            Write a review
          </button>
        </>
      )}

      {step === "input" && (
        <form onSubmit={sendOtp} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Your name"
                 className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--hairline)" }} />
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-60">Rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}
                      className="text-xl leading-none" style={{ color: n <= rating ? "var(--gold)" : "var(--ink-4)" }} aria-label={`${n} star`}>★</button>
            ))}
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} required rows={3} placeholder="Share your experience…"
                    className="w-full rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--hairline)" }} />
          <div className="flex gap-2">
            <span className="rounded-xl border px-3 py-2.5 text-sm opacity-60" style={{ borderColor: "var(--hairline)" }}>+91</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={10} required placeholder="WhatsApp number (for OTP)"
                   className="flex-1 rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "var(--hairline)" }} />
          </div>
          {error && <p className="text-xs tone-critical">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("view")} className="rounded-xl px-4 py-2.5 text-sm font-semibold opacity-60">Cancel</button>
            <button type="submit" disabled={busy} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
                    style={{ background: "var(--brand-gradient)" }}>{busy ? "..." : "Continue"}</button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyAndPost} className="space-y-3">
          <p className="text-sm opacity-60">Verify <span className="font-semibold opacity-80">{phone}</span> to publish your review.</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus placeholder="6-digit code"
                 className="w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-[0.4em] font-bold" style={{ borderColor: "var(--hairline)" }} />
          {info && <p className="text-xs tone-positive">{info}</p>}
          {error && <p className="text-xs tone-critical">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("input")} className="rounded-xl px-4 py-2.5 text-sm font-semibold opacity-60">Back</button>
            <button type="submit" disabled={busy} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
                    style={{ background: "var(--brand-gradient)" }}>{busy ? "..." : "Publish review"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
