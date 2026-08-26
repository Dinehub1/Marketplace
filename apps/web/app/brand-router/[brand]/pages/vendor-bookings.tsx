"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

/**
 * The vendor cockpit: today's jobs, the service catalogue and weekly timings.
 *
 * Auth is the WhatsApp OTP every owner surface uses; scoping is server-side
 * (phone suffix -> owned businesses), so this component only renders what the
 * APIs return.
 */

type Booking = {
  id: string; business_id: number; status: string; slot_start: string;
  customer_name: string; customer_phone: string; vehicle: string; notes: string | null;
  amount: number; vendor_payout: number | null; payment_status: string;
  vendor_services?: { name: string } | null; businesses?: { name: string; area: string | null } | null;
};
type Service = { id: string; name: string; price_inr: number; duration_minutes: number; is_active: boolean };
type Biz = { id: number; name: string };
type DayHours = { day_of_week: number; day: string; closed: boolean; open_time: string; close_time: string; slot_minutes: number; capacity: number };

const inr = (n: number) => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
const STATUS_LABEL: Record<string, string> = {
  requested: "Nayi request", confirmed: "Confirm", in_progress: "Chal rahi hai",
  completed: "Ho gayi", cancelled: "Cancel", no_show: "No-show",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaultWeek(): DayHours[] {
  return Array.from({ length: 7 }, (_, d) => ({
    day_of_week: d, day: DAY_NAMES[d], closed: false,
    open_time: "09:00", close_time: "19:00", slot_minutes: 60, capacity: 1,
  }));
}

export function VendorBookingsPage({ brand }: { brand: any }) {
  const [step, setStep] = useState<"phone" | "otp" | "ready">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"jobs" | "services" | "hours">("jobs");

  const [bizs, setBizs] = useState<Biz[]>([]);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [week, setWeek] = useState<DayHours[]>(defaultWeek);
  const [hoursBizId, setHoursBizId] = useState<number | null>(null);

  // Token lives outside React state so the fetch helpers below stay stable.
  const tokenStore = useMemo(() => {
    let t = "";
    return {
      get: () => t,
      set: (v: string) => { t = v; },
    };
  }, []);

  const authHeaders = useCallback((): Record<string, string> => ({ "x-phone": phone, "x-phone-token": tokenStore.get() }), [phone, tokenStore]);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Code send nahi hua"); return; }
      // Local dev echoes the code so the flow works without WhatsApp.
      if (j.devCode) setDevCode(j.devCode);
      setStep("otp");
    } finally { setBusy(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const j = await res.json();
      if (!res.ok || !j.token) { setError(j.error ?? "Galat code"); return; }
      tokenStore.set(j.token);
      await loadAll();
      setStep("ready");
    } finally { setBusy(false); }
  }

  async function loadAll() {
    const h = authHeaders();
    const [bRes, sRes] = await Promise.all([
      fetch("/api/vendor/bookings", { headers: h }),
      fetch("/api/vendor/services", { headers: h }),
    ]);
    const bj = await bRes.json().catch(() => ({}));
    const sj = await sRes.json().catch(() => ({}));
    setBizs(bj.businesses ?? []);
    setBookings(bj.bookings ?? []);
    setServices(sj.services ?? []);
    if ((bj.businesses ?? []).length > 0 && hoursBizId === null) {
      loadHours(bj.businesses[0].id, h);
    }
  }

  const loadHours = async (businessId: number, h?: Record<string, string>) => {
    const headers = h ?? authHeaders();
    const res = await fetch(`/api/booking/services?business_id=${businessId}`);
    const j = await res.json().catch(() => ({}));
    setHoursBizId(businessId);
    const incoming: any[] = j.hours ?? [];
    if (incoming.length === 7 && !j.hours_is_default) {
      setWeek(incoming.map((row: any) => ({
        day_of_week: row.day_of_week, day: row.day,
        closed: Boolean(row.closed),
        open_time: row.open_time ?? "09:00", close_time: row.close_time ?? "19:00",
        slot_minutes: 60, capacity: 1,
      })));
    } else {
      setWeek(defaultWeek());
    }
  };

  async function moveBooking(id: string, status: string) {
    setError(""); setBusy(true);
    try {
      const res = await fetch(`/api/vendor/bookings/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Update fail"); return; }
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...j.booking } : b)));
    } finally { setBusy(false); }
  }

  async function addService(form: FormData) {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/vendor/services", {
        method: "POST", headers: { "content-type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          business_id: Number(form.get("business_id")), name: form.get("name"),
          description: form.get("description"), price_inr: Number(form.get("price_inr")),
          duration_minutes: Number(form.get("duration_minutes") || 60),
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Save fail"); return; }
      setServices((prev) => [...prev, j.service]);
    } finally { setBusy(false); }
  }

  async function toggleService(s: Service) {
    await fetch("/api/vendor/services", {
      method: "PATCH", headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
  }

  async function saveHours() {
    if (!hoursBizId) return;
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/vendor/hours", {
        method: "PUT", headers: { "content-type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          business_id: hoursBizId,
          days: week.map(({ day_of_week, closed, open_time, close_time, slot_minutes, capacity }) =>
            ({ day_of_week, closed, open_time, close_time, slot_minutes, capacity })),
        }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Save fail"); return; }
      setError(""); setTab("jobs");
    } finally { setBusy(false); }
  }

  function fmtSlot(iso: string) {
    return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
  }

  const nextAction = (b: Booking): { label: string; to: string } | null => {
    switch (b.status) {
      case "requested": return { label: "Confirm karein", to: "confirmed" };
      case "confirmed": return { label: "Kaam shuru", to: "in_progress" };
      case "in_progress": return { label: "Complete + Paid", to: "completed" };
      default: return null;
    }
  };

  // ── Login screens ─────────────────────────────────────────────────────────
  if (step !== "ready") {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader brand={brand} />
        <section className="flex-1 mx-auto max-w-md w-full px-6 py-20">
          <h1 className="text-2xl font-bold mb-1 text-center" style={{ color: "var(--brand-secondary)" }}>Dukaan Dashboard</h1>
          <p className="text-sm opacity-60 text-center mb-8">Apne bookings, services aur timings yahan manage karein</p>
          <form onSubmit={step === "phone" ? sendOtp : verify} className="space-y-3 rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            {step === "phone" ? (
              <>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" inputMode="tel"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-secondary)]" style={{ borderColor: "var(--hairline)" }} />
                <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-sm">{busy ? "…" : "OTP bhejein"}</button>
              </>
            ) : (
              <>
                {devCode && (
                  <p className="text-center text-xs opacity-60">Dev code: <b className="tabular text-lg" style={{ color: "var(--brand-secondary)" }}>{devCode}</b></p>
                )}
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric"
                  className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-[var(--brand-secondary)]" style={{ borderColor: "var(--hairline)" }} />
                <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-sm">{busy ? "…" : "Verify karein"}</button>
              </>
            )}
            {error && <p className="text-xs tone-negative text-center">{error}</p>}
          </form>
        </section>
        <BrandFooter brand={brand} />
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />
      <section className="mx-auto max-w-4xl w-full px-6 py-10 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: "var(--brand-secondary)" }}>Dukaan Dashboard</h1>
          <span className="text-xs opacity-50">{bizs.length ? bizs.map((b) => b.name).join(", ") : ""}</span>
        </div>

        <div className="flex gap-2 mb-6">
          {([["jobs", `Bookings (${bookings.length})`], ["services", `Services (${services.length})`], ["hours", "Timings"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === key ? "text-white shadow-sm" : "bg-surface border hover:shadow-sm"}`}
              style={tab === key ? { background: "var(--brand-gradient)" } : { borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-xs tone-negative mb-4">{error}</p>}

        {tab === "jobs" && (
          <div className="space-y-3">
            {bookings.length === 0 && <p className="text-sm opacity-50">Abhi koi aane wali booking nahi.</p>}
            {bookings.map((b) => {
              const action = nextAction(b);
              return (
                <div key={b.id} className="rounded-2xl border bg-surface p-4 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{b.customer_name} · <span className="tabular">{b.customer_phone}</span></p>
                      <p className="text-xs opacity-60 mt-0.5">{b.vehicle}{b.vendor_services?.name ? ` · ${b.vendor_services.name}` : ""} · {inr(Number(b.amount))}</p>
                      <p className="text-xs opacity-60">🕐 {fmtSlot(b.slot_start)}{b.notes ? ` · 📝 ${b.notes}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                      {action && (
                        <button disabled={busy} onClick={() => moveBooking(b.id, action.to)}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-bold disabled:opacity-40" style={{ background: "var(--brand-primary)" }}>
                          {action.label}
                        </button>
                      )}
                      {(b.status === "requested" || b.status === "confirmed") && (
                        <button disabled={busy} onClick={() => moveBooking(b.id, "cancelled")}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold disabled:opacity-40" style={{ borderColor: "var(--hairline)" }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "services" && (
          <div className="space-y-4">
            <form action={(fd) => addService(fd)} className="rounded-2xl border bg-surface p-4 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-2 items-end" style={{ borderColor: "var(--hairline)" }}>
              <select name="business_id" className="col-span-2 sm:col-span-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--hairline)" }}>
                {bizs.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input name="name" required placeholder="Service (Car Wash)" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--hairline)" }} />
              <input name="price_inr" type="number" min="0" required placeholder="₹ Price" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--hairline)" }} />
              <input name="duration_minutes" type="number" min="15" max="600" placeholder="Mins" defaultValue={60} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--hairline)" }} />
              <button type="submit" disabled={busy} className="rounded-lg text-white py-2 text-sm font-bold disabled:opacity-40" style={{ background: "var(--brand-primary)" }}>Add</button>
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <div key={s.id} className="rounded-2xl border bg-surface p-4 shadow-sm flex items-center justify-between" style={{ borderColor: "var(--hairline)", opacity: s.is_active ? 1 : 0.45 }}>
                  <div>
                    <p className="font-bold text-sm">{s.name} {!s.is_active && <span className="text-xs">(band)</span>}</p>
                    <p className="text-xs opacity-60">{inr(Number(s.price_inr))} · ~{s.duration_minutes} min</p>
                  </div>
                  <button onClick={() => toggleService(s)} className="text-xs font-bold underline" style={{ color: "var(--brand-secondary)" }}>
                    {s.is_active ? "Band karein" : "Wapas chalu"}
                  </button>
                </div>
              ))}
              {services.length === 0 && <p className="text-sm opacity-50">Pehli service add karein — tabhi customer book kar payega.</p>}
            </div>
          </div>
        )}

        {tab === "hours" && (
          <div className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs opacity-60">Har din ka timing set karein — band din ke liye &quot;Band&quot; tick karein.</p>
              {bizs.length > 1 && (
                <select value={hoursBizId ?? undefined} onChange={(e) => loadHours(Number(e.target.value))} className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--hairline)" }}>
                  {bizs.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2">
              {week.map((d, i) => (
                <div key={d.day_of_week} className="flex flex-wrap items-center gap-2 text-sm">
                  <label className="flex items-center gap-1 w-20 font-medium">
                    <input type="checkbox" checked={d.closed} onChange={(e) => setWeek((w) => w.map((x, xi) => (xi === i ? { ...x, closed: e.target.checked } : x)))} />
                    {d.day}
                  </label>
                  {!d.closed && (
                    <>
                      <input type="time" value={d.open_time} onChange={(e) => setWeek((w) => w.map((x, xi) => (xi === i ? { ...x, open_time: e.target.value } : x)))}
                        className="rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--hairline)" }} />
                      <span className="opacity-40">–</span>
                      <input type="time" value={d.close_time} onChange={(e) => setWeek((w) => w.map((x, xi) => (xi === i ? { ...x, close_time: e.target.value } : x)))}
                        className="rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--hairline)" }} />
                      <label className="text-xs opacity-60 ml-2">Slot:
                        <select value={d.slot_minutes} onChange={(e) => setWeek((w) => w.map((x, xi) => (xi === i ? { ...x, slot_minutes: Number(e.target.value) } : x)))}
                          className="ml-1 rounded-lg border px-2 py-1" style={{ borderColor: "var(--hairline)" }}>
                          {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m}m</option>)}
                        </select>
                      </label>
                      <label className="text-xs opacity-60">Cars/slot:
                        <input type="number" min={1} max={20} value={d.capacity} onChange={(e) => setWeek((w) => w.map((x, xi) => (xi === i ? { ...x, capacity: Math.max(1, Number(e.target.value) || 1) } : x)))}
                          className="ml-1 w-14 rounded-lg border px-2 py-1" style={{ borderColor: "var(--hairline)" }} />
                      </label>
                    </>
                  )}
                  {d.closed && <span className="text-xs opacity-40">Band hai</span>}
                </div>
              ))}
            </div>
            <button onClick={saveHours} disabled={busy || !hoursBizId} className="btn-primary w-full py-3 text-sm mt-5 disabled:opacity-40">
              {busy ? "…" : "Timings save karein"}
            </button>
          </div>
        )}
      </section>
      <BrandFooter brand={brand} />
    </div>
  );
}
