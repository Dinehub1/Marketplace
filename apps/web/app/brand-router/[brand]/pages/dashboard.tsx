"use client";

import { useEffect, useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  business_id: number | null;
  name: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
};
type Biz = {
  id: number;
  name: string;
  category: string | null;
  status: string | null;
  city: string | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "अभी";
  if (m < 60) return `${m} मिनट पहले`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} घंटे पहले`;
  return `${Math.floor(h / 24)} दिन पहले`;
}

function readStored(key: string): string | null {
  try {
    const ls = localStorage.getItem(key);
    if (ls) return ls;
    const c = document.cookie.split("; ").find((x) => x.startsWith(key + "="));
    return c ? decodeURIComponent(c.split("=")[1]) : null;
  } catch {
    return null;
  }
}

export function UserDashboard({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [noAuth, setNoAuth] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [biz, setBiz] = useState<Biz[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let userPhone: string | null = readStored("hermes_customer_phone");
      let token: string | null = readStored("hermes_otp_token");
      let bearer: string | null = null;

      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (data.session?.user?.phone) {
        userPhone = data.session.user.phone.replace(/^\+/, "");
        bearer = data.session.access_token;
      }
      if (!userPhone) {
        if (!cancelled) { setNoAuth(true); setLoading(false); }
        return;
      }
      const q = new URLSearchParams({ phone: userPhone });
      const headers: Record<string, string> = {};
      if (token) headers["x-phone-token"] = token;
      if (bearer) headers.Authorization = `Bearer ${bearer}`;
      try {
        const res = await fetch(`/api/customer?${q.toString()}`, { headers });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          if (!cancelled) { setNoAuth(true); setLoading(false); }
          return;
        }
        if (!cancelled) {
          setPhone(userPhone);
          setLeads(j.leads ?? []);
          setBiz(j.businesses ?? []);
        }
      } catch {
        if (!cancelled) setNoAuth(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, []);

  const phoneDisplay = phone ? (phone.startsWith("91") ? phone.slice(2) : phone) : "";

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-5xl px-6 py-8 w-full">
        {loading ? (
          <p className="py-20 text-center text-sm opacity-50">लोड हो रहा है…</p>
        ) : noAuth || !phone ? (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border bg-surface p-8 text-center shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <div className="mb-3 text-4xl">👋</div>
            <h1 className="text-xl font-bold" style={{ color: "var(--brand-secondary)" }}>अपना डैशबोर्ड देखें</h1>
            <p className="mt-2 text-sm opacity-60">साइन इन करें और देखें कि आपने कितने बिज़नेस से पूछताछ की है।</p>
            <a href="/login" className="mt-6 inline-block w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow" style={{ background: "var(--brand-gradient)" }}>साइन इन करें</a>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold" style={{ color: "var(--brand-secondary)" }}>आपका डैशबोर्ड</h1>
              <p className="text-sm opacity-60">+91 {phoneDisplay} के लिए — आपकी पूछताछ और लिस्टिंग।</p>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4">
              {[
                { label: "आपकी पूछताछ", value: String(leads.length), icon: "💬" },
                { label: "आपकी लिस्टिंग", value: String(biz.length), icon: "🏢" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="mt-2 text-2xl font-extrabold" style={{ color: "var(--brand-secondary)" }}>{s.value}</p>
                  <p className="mt-1 text-xs opacity-50">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <h2 className="mb-4 flex items-center gap-2 font-bold" style={{ color: "var(--brand-secondary)" }}>
                <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-white" style={{ background: "var(--brand-gradient)" }}>💬</span>
                आपकी पूछताछ
              </h2>
              {leads.length === 0 ? (
                <p className="py-6 text-center text-sm opacity-50">अभी कोई पूछताछ नहीं। किसी भी बिज़नेस को मैसेज करें और वो यहाँ दिखेगा।</p>
              ) : (
                <div className="space-y-4">
                  {leads.map((l) => (
                    <div key={l.id} className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "var(--brand-gradient)" }}>{l.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{l.name}</p>
                        <p className="break-words text-xs opacity-50">{l.message}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs opacity-40">{timeAgo(l.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold" style={{ color: "var(--brand-secondary)" }}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-white" style={{ background: "var(--brand-gradient)" }}>🏢</span>
                  आपकी लिस्टिंग
                </h2>
                {biz.length > 0 && (
                  <a href="/business-dashboard" className="text-xs font-semibold" style={{ color: "var(--brand-secondary)" }}>मैनेज करें →</a>
                )}
              </div>
              {biz.length === 0 ? (
                <p className="py-6 text-center text-sm opacity-50">आपने अभी कोई बिज़नेस क्लेम नहीं किया।</p>
              ) : (
                <div className="space-y-3">
                  {biz.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "var(--hairline)" }}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.name}</p>
                        <p className="text-xs opacity-50">{[b.category, b.city].filter(Boolean).join(" · ")}</p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-1 text-xs ${b.status === "approved" ? "bg-[var(--positive-tint)] tone-positive" : "bg-[var(--gold-tint)] tone-gold"}`}>{b.status ?? "pending"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
