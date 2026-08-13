"use client";

import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import { ReviewsBox } from "./reviews-box";

type Lead = { id: string; business_id: number; name: string; phone: string; message: string; status: string; created_at: string };
type Biz = { id: number; name: string; category: string | null; rating: number | null; address: string | null };
type EditFields = { name: string; description: string; address: string; area: string; city: string; business_phone: string; category: string };

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function BusinessDashboard({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  const [step, setStep] = useState<"phone" | "otp" | "dash">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [reviewsById, setReviewsById] = useState<Record<number, any[]>>({});

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
      const vj = await vres.json();
      if (!vres.ok) { setError(vj.error ?? "Galat code"); return; }
      const lres = await fetch(`/api/leads?phone=${encodeURIComponent(vj.phone)}`, {
        headers: { "x-phone": vj.phone, "x-phone-token": vj.token },
      });
      const lj = await lres.json();
      if (!lres.ok) { setError(lj.error ?? "Leads load nahi hue"); return; }
      setBusinesses(lj.businesses ?? []);
      setLeads(lj.leads ?? []);
      setVerifiedPhone(vj.phone ?? "");
      setVerifiedToken(vj.token ?? "");
      const ids = (lj.businesses ?? []).map((b: any) => b.id).filter(Boolean);
      if (ids.length) loadReviewsFor(ids);
      setStep("dash");
    } finally { setBusy(false); }
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  async function loadBiz(id: number): Promise<EditFields | null> {
    if (!supaUrl || !supaKey) return null;
    const res = await fetch(`${supaUrl}/rest/v1/businesses?id=eq.${id}&select=name,description,address,area,city,phone,category`, {
      headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    const b = rows[0];
    return b ? { name: b.name ?? "", description: b.description ?? "", address: b.address ?? "", area: b.area ?? "", city: b.city ?? "", business_phone: b.phone ?? "", category: b.category ?? "" } : null;
  }

  async function loadBizReviews(id: number): Promise<any[]> {
    if (!supaUrl || !supaKey) return [];
    const res = await fetch(
      `${supaUrl}/rest/v1/reviews?business_id=eq.${id}&is_approved=eq.true` +
        `&select=id,reviewer_name,rating,comment,created_at,owner_reply&order=created_at.desc&limit=50`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as any[];
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

  // Edit-listing state (keyed by business id so each card manages its own form).
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<EditFields | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [editInfo, setEditInfo] = useState("");

  async function startEdit(id: number) {
    setEditError(""); setEditInfo("");
    const f = await loadBiz(id);
    if (!f) { setEditError("Listing load nahi hui"); return; }
    setEditFields(f);
    setEditingId(id);
  }

  function setField(k: keyof EditFields, v: string) {
    setEditFields((f) => (f ? { ...f, [k]: v } : f));
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editFields || editingId == null) return;
    setEditError(""); setEditBusy(true);
    try {
      const res = await fetch(`/api/businesses/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...editFields, phone: verifiedPhone, token: verifiedToken }),
      });
      const j = await res.json();
      if (!res.ok) { setEditError(j.error ?? "Listing update nahi hui"); return; }
      setEditInfo("Listing update ho gayi ✓");
      setEditingId(null);
      setEditFields(null);
    } finally { setEditBusy(false); }
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
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
        <BrandHeader brand={brand} />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm" style={{ borderColor: `${accent}30` }}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">📊</div>
              <h1 className="text-xl font-bold" style={{ color: primary }}>Business Dashboard</h1>
              <p className="text-sm opacity-50 mt-1">Apne business ke WhatsApp number se login karein — aapke saare leads yahan milenge.</p>
            </div>
            <form onSubmit={step === "phone" ? sendOtp : verify} className="space-y-4">
              {step === "phone" ? (
                <div className="flex gap-2">
                  <span className="rounded-xl border px-3 py-2.5 text-sm opacity-60" style={{ borderColor: `${accent}50` }}>+91</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={10} required
                         placeholder="Business ka mobile number"
                         className="flex-1 rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: `${accent}50` }} />
                </div>
              ) : (
                <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} required autoFocus
                       placeholder="6-digit code"
                       className="w-full rounded-xl border px-4 py-2.5 text-center text-lg tracking-[0.4em] font-bold" style={{ borderColor: `${accent}50` }} />
              )}
              {info && <p className="text-xs text-green-600">{info}</p>}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" disabled={busy}
                      className="w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
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
  const weekLeads = leads.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 86400e3);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-6xl px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: primary }}>Business Dashboard</h1>
          <p className="text-sm opacity-60">
            {businesses.length > 0
              ? `${businesses.map((b) => b.name).slice(0, 2).join(", ")}${businesses.length > 2 ? ` +${businesses.length - 2} aur` : ""}`
              : "Is number se koi listing nahi mili"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Kul Leads", value: String(leads.length), icon: "📥" },
            { label: "Naye Leads", value: String(newLeads.length), icon: "🆕" },
            { label: "Is Hafte", value: String(weekLeads.length), icon: "📅" },
            { label: "Listings", value: String(businesses.length), icon: "🏢" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${accent}20` }}>
              <span className="text-2xl">{s.icon}</span>
              <p className="text-2xl font-extrabold mt-2" style={{ color: primary }}>{s.value}</p>
              <p className="text-xs opacity-50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leads list */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: primary }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>📥</span>
              Leads
            </h2>
            {leads.length === 0 ? (
              <p className="text-sm opacity-50 py-6 text-center">Abhi koi lead nahi. Aapki listing directory mein live hai — leads yahan dikhenge.</p>
            ) : (
              <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
                {leads.map((lead) => (
                  <div key={lead.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{lead.name} {lead.status === "new" && <span className="ml-1 inline-block w-2 h-2 rounded-full bg-green-400" />}</p>
                      <p className="text-xs opacity-50 break-words">{lead.message}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: "#25D366" }}>💬 WhatsApp</a>
                        <a href={`tel:+${lead.phone}`} className="text-xs font-semibold" style={{ color: primary }}>📞 Call</a>
                      </div>
                    </div>
                    <span className="text-xs opacity-40 flex-shrink-0">{timeAgo(lead.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listings */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
            <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: primary }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>🏢</span>
              Aapki Listings
            </h2>
            {businesses.length === 0 ? (
              <div className="text-sm opacity-60 py-6 text-center">
                <p>Is number se koi business listed nahi hai.</p>
                <a href={`/contact`} className="underline mt-1 inline-block" style={{ color: primary }}>Apna business list karwayein →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {businesses.map((b) => (
                  <div key={b.id} className="rounded-xl border p-4" style={{ borderColor: `${accent}30` }}>
                    <a href={`/business/${b.id}`} className="block hover:shadow-md transition-shadow">
                      <p className="font-semibold text-sm" style={{ color: primary }}>{b.name}</p>
                      <p className="text-xs opacity-50 mt-0.5">{[b.category, b.rating ? `★ ${b.rating}` : null].filter(Boolean).join(" · ")}</p>
                      {b.address && <p className="text-xs opacity-40 mt-0.5 truncate">📍 {b.address}</p>}
                    </a>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => startEdit(b.id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow"
                              style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                        ✏️ Edit listing
                      </button>
                      <button onClick={() => boostListing(b.id)} disabled={boostBusy && boostId === b.id} className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                              style={{ borderColor: `${accent}60`, color: primary }}>
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
