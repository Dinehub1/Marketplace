"use client";

import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import { ReviewsBox, type Review } from "./reviews-box";
import type { Brand } from "@/lib/brands";
import type { ReviewRow } from "@/lib/db-types";
import { asRows } from "@/lib/postgrest";

type Lead = { id: string; business_id: number; name: string; phone: string; message: string; status: string; created_at: string };
type Biz = { id: number; name: string; category: string | null; rating: number | null; address: string | null };

/** Bodies of the two routes this screen calls, so the JSON is not implicitly `any`. */
type OtpVerifyResponse = { error?: string; phone?: string; token?: string };
type LeadsResponse = { error?: string; businesses?: Biz[]; leads?: Lead[] };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function BusinessDashboard({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";

  const [step, setStep] = useState<"phone" | "otp" | "dash">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  /** When `leads` were fetched, for the "last 7 days" count. See loadLeads(). */
  const [leadsAt, setLeadsAt] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [reviewsById, setReviewsById] = useState<Record<number, Review[]>>({});
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Code send failed"); return; }
      setInfo(j.delivered ? "WhatsApp par code bheja gaya" : (j.deliveryError ?? "Delivery issue — retry karein"));
      setStep("otp");
    } finally { setBusy(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const vres = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const vj = (await vres.json()) as OtpVerifyResponse;
      if (!vres.ok) { setError(vj.error ?? "Galat code"); return; }
      // A 200 without a phone/token would have been sent as `undefined` in the headers
      // below and come back as a confusing 401. Fail here, where the cause is visible.
      const { phone: verified, token: vtoken } = vj;
      if (!verified || !vtoken) { setError("Server ne session nahi diya"); return; }
      const lres = await fetch(`/api/leads?phone=${encodeURIComponent(verified)}`, {
        headers: { "x-phone": verified, "x-phone-token": vtoken },
      });
      const lj = (await lres.json()) as LeadsResponse;
      if (!lres.ok) { setError(lj.error ?? "Leads load nahi hue"); return; }
      setBusinesses(lj.businesses ?? []);
      setLeads(lj.leads ?? []);
      // Stamped when the leads land, not during render: `Date.now()` in a render body
      // is impure and made the "last 7 days" window depend on when React happened to
      // re-render rather than on when the data was fetched.
      setLeadsAt(Date.now());
      setVerifiedPhone(verified);
      setVerifiedToken(vtoken);
      const ids = (lj.businesses ?? []).map((b) => b.id).filter(Boolean);
      if (ids.length) loadReviewsFor(ids);
      loadStats(verified, vtoken);
      setStep("dash");
    } finally { setBusy(false); }
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  async function loadBizReviews(id: number): Promise<Review[]> {
    if (!supaUrl || !supaKey) return [];
    const res = await fetch(
      `${supaUrl}/rest/v1/reviews?business_id=eq.${id}&is_approved=eq.true` +
        `&select=id,reviewer_name,rating,comment,created_at,owner_reply&order=created_at.desc&limit=50`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } },
    );
    if (!res.ok) return [];
    const rows = await asRows<ReviewRow>(res);
    return rows.map((r) => ({
      id: r.id,
      author_name: r.reviewer_name,
      body: r.comment,
      rating: r.rating,
      created_at: r.created_at,
      owner_reply: r.owner_reply ?? null,
    }));
  }

  async function loadReviewsFor(ids: number[]) {
    for (const id of ids) {
      const rs = await loadBizReviews(id);
      setReviewsById((m) => ({ ...m, [id]: rs }));
    }
  }

  async function loadStats(phone: string, token: string) {
    try {
      const res = await fetch("/api/events", {
        headers: { "x-phone": phone, "x-phone-token": token },
      });
      const j = await res.json();
      if (!res.ok) return;
      setStats(j.stats ?? {});
      setTotals(j.totals ?? {});
    } catch {
      /* stats are best-effort; the leads list must still render */
    }
  }

  const [boostId, setBoostId] = useState<number | null>(null);
  const [boostBusy, setBoostBusy] = useState(false);
  const [boostInfo, setBoostInfo] = useState("");

  async function boostListing(id: number) {
    setBoostBusy(true); setBoostInfo(""); setBoostId(id);
    try {
      const res = await fetch(`/api/businesses/${id}/feature`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: verifiedPhone, token: verifiedToken }),
      });
      const j = await res.json().catch(() => ({}));
      const price = j?.price ?? j?.data?.price;
      setBoostInfo(price ? `Boost price: ₹${price}` : (j?.message ?? "Boost request bhej di gayi"));
    } catch {
      setBoostInfo("Boost request bhejne mein dikkat aayi");
    } finally { setBoostBusy(false); setBoostId(null); }
  }


  if (step !== "dash") {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader brand={brand} />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border bg-surface p-8 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">📊</div>
              <h1 className="text-xl font-bold" style={{ color: "var(--brand-secondary)" }}>Business Dashboard</h1>
              <p className="text-sm opacity-50 mt-1">Apne business ke WhatsApp number se login karein — aapke saare leads yahan milenge.</p>
            </div>
            <form onSubmit={step === "phone" ? sendOtp : verify} className="space-y-4">
              {step === "phone" ? (
                <div className="flex gap-2">
                  <span className="rounded-xl border px-3 py-2.5 text-sm opacity-60" style={{ borderColor: "var(--hairline)" }}>+91</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={10} required
                         placeholder="Business ka mobile number"
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
                {busy ? "..." : step === "phone" ? "WhatsApp OTP bhejein" : "Login karein"}
              </button>
            </form>
          </div>
        </main>
        <BrandFooter brand={brand} />
      </div>
    );
  }

  const newLeads = leads.filter((l) => l.status === "new");
  const weekLeads = leadsAt
    ? leads.filter((l) => leadsAt - new Date(l.created_at).getTime() < 7 * 86400e3)
    : [];
  const totalViews = totals["view"] ?? 0;
  const totalCalls = totals["call_click"] ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-secondary)" }}>Business Dashboard</h1>
          <p className="text-sm opacity-60">
            {businesses.length > 0
              ? `${businesses.map((b) => b.name).slice(0, 2).join(", ")}${businesses.length > 2 ? ` +${businesses.length - 2} aur` : ""}`
              : "Is number se koi listing nahi mili"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Kul Leads", value: String(leads.length), icon: "📥" },
            { label: "Naye Leads", value: String(newLeads.length), icon: "🆕" },
            { label: "Is Hafte", value: String(weekLeads.length), icon: "📅" },
            { label: "Views (30 din)", value: String(totalViews), icon: "👁" },
            { label: "Calls (30 din)", value: String(totalCalls), icon: "📞" },
            { label: "Listings", value: String(businesses.length), icon: "🏢" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <span className="text-2xl">{s.icon}</span>
              <p className="text-2xl font-extrabold mt-2" style={{ color: "var(--brand-secondary)" }}>{s.value}</p>
              <p className="text-xs opacity-50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leads list */}
          <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>📥</span>
              Leads
            </h2>
            {leads.length === 0 ? (
              <p className="text-sm opacity-50 py-6 text-center">Abhi koi lead nahi. Aapki listing directory mein live hai — leads yahan dikhenge.</p>
            ) : (
              <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: "var(--brand-gradient)" }}>
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{lead.name} {lead.status === "new" && <span className="ml-1 inline-block w-2 h-2 rounded-full bg-[var(--positive)]" />}</p>
                      <p className="text-xs opacity-50 break-words">{lead.message}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "var(--whatsapp)" }}>💬 WhatsApp</a>
                        <a href={`tel:+${lead.phone}`} className="text-xs font-semibold" style={{ color: "var(--brand-secondary)" }}>📞 Call</a>
                      </div>
                    </div>
                    <span className="text-xs opacity-40 flex-shrink-0">{timeAgo(lead.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listings */}
          <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--brand-secondary)" }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: "var(--brand-gradient)" }}>🏢</span>
              Aapki Listings
            </h2>
            {businesses.length === 0 ? (
              <div className="text-sm opacity-60 py-6 text-center">
                <p>Is number se koi business listed nahi hai.</p>
                <a href={`/contact`} className="underline mt-1 inline-block" style={{ color: "var(--brand-secondary)" }}>Apna business list karwayein →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {businesses.map((b) => (
                  <div key={b.id} className="rounded-xl border p-4" style={{ borderColor: "var(--hairline)" }}>
                    <a href={`/business/${b.id}`} className="block hover:shadow-md transition-shadow">
                      <p className="font-semibold text-sm" style={{ color: "var(--brand-secondary)" }}>{b.name}</p>
                      <p className="text-xs opacity-50 mt-0.5">{[b.category, b.rating ? `★ ${b.rating}` : null].filter(Boolean).join(" · ")}</p>
                      {b.address && <p className="text-xs opacity-40 mt-0.5 truncate">📍 {b.address}</p>}
                      <p className="text-xs opacity-50 mt-1">
                        👁 {stats[b.id]?.view ?? 0} views · 📞 {stats[b.id]?.call_click ?? 0} calls · 💬 {stats[b.id]?.whatsapp_click ?? 0}
                      </p>
                    </a>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => boostListing(b.id)} disabled={boostBusy && boostId === b.id} className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                              style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
                        {boostBusy && boostId === b.id ? "..." : "🚀 Boost listing"}
                      </button>
                    </div>
                    {boostBusy && boostId === b.id && boostInfo && <p className="text-xs opacity-60 mt-1">{boostInfo}</p>}
                    {!(boostBusy && boostId === b.id) && boostInfo && <p className="text-xs opacity-60 mt-1">{boostInfo}</p>}

                    <ReviewsBox
                      businessId={b.id}
                      initialReviews={reviewsById[b.id] ?? []}
                      avg={null}
                      count={0}
                      primary={primary}
                      secondary={secondary}
                      accent={accent}
                      brandName={brand.name}
                      canReply
                      replyPhone={verifiedPhone}
                      replyToken={verifiedToken}
                      key={`rev-${b.id}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
