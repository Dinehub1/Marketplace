"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import { BRAND_CATEGORY_KEYWORDS } from "@/lib/brand-categories";
import type { Brand } from "@/lib/brands";

/**
 * The car-service booking flow: vendor -> service -> date -> slot -> contact.
 *
 * Everything talks to the booking APIs (/api/booking/*), which re-validate
 * availability server-side on submit — the slot grid here can go stale while
 * the customer types, and the API is the source of truth.
 */

type Vendor = { id: number; name: string; area: string | null; rating: number | null; reviews_count: number | null };
type Service = { id: string; name: string; description: string | null; price_inr: number; duration_minutes: number };
type Slot = { start: string; label: string; available: boolean };

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

/** The next `count` IST calendar dates as YYYY-MM-DD strings. */
function upcomingIstDates(count: number): string[] {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => fmt.format(new Date(now + i * 86_400_000)));
}

function dayMeta(dateStr: string): { dow: string; day: string; month: string } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    dow: d.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en", { day: "numeric", timeZone: "UTC" }),
    month: d.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
  };
}

export function BookingPage({ brand, initialVendorId }: { brand: Brand; initialVendorId?: number | null }) {
  // ── Selection state ────────────────────────────────────────────────────────
  const [vendorId, setVendorId] = useState<number | null>(initialVendorId ?? null);
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);

  // ── Availability state ────────────────────────────────────────────────────
  const dates = useMemo(() => upcomingIstDates(7), []);
  const [dateStr, setDateStr] = useState<string>(dates[0]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotStart, setSlotStart] = useState<string | null>(null);

  // ── Contact / OTP state ───────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ ref: string; service_name: string; price_inr: number; slot_label: string; date: string; vendor_name: string } | null>(null);

  const selectedVendor = vendors?.find((v) => v.id === vendorId) ?? null;
  const selectedService = services.find((s) => s.id === serviceId) ?? null;

  /**
   * Clear the slot list when the vendor or the day changes.
   *
   * This is React's documented "adjust state when a prop changes" pattern rather than
   * an effect: an effect runs *after* paint, so the previous day's slots (and the slot
   * the customer had already picked, which is no longer a real time on the new day)
   * would be on screen for a frame before being cleared.
   */
  const slotKey = vendorId ? `${vendorId}|${dateStr}` : null;
  const [slotsFor, setSlotsFor] = useState<string | null>(null);
  if (slotKey !== slotsFor) {
    setSlotsFor(slotKey);
    setSlots(null);
    setSlotStart(null);
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!vendorId || services.length > 0) return;
    (async () => {
      try {
        const res = await fetch(`/api/booking/services?business_id=${vendorId}`);
        const j = await res.json();
        setServices(j.services ?? []);
      } catch { setError("Services load nahi hue"); }
    })();
  }, [vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!vendorId) return;
    // The reset above already happened during render; this only fetches.
    (async () => {
      try {
        const res = await fetch(`/api/booking/slots?business_id=${vendorId}&date=${dateStr}`);
        const j = await res.json();
        setSlots(j.closed ? [] : j.slots ?? []);
      } catch { setSlots([]); }
    })();
  }, [vendorId, dateStr]);

  // The vendor picker's list. Inline rather than a `useCallback` invoked from the
  // effect: the effect should own its async work, so the single state write is
  // unambiguously behind an await and gets a proper cancel on unmount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supaKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const creds = supaUrl && supaKey ? { url: supaUrl, key: supaKey } : null;
      // Same keyword ownership as lib/brand-categories.ts — the vertical's own
      // categories, matched as substrings against Google Maps' classifications.
      const kws = BRAND_CATEGORY_KEYWORDS["sarkarcars"] ?? [];
      const or = kws.map((k) => `category.ilike.*${encodeURIComponent(k)}*`).join(",");
      const rows = await (creds
        ? fetch(
            `${creds.url}/rest/v1/businesses?select=id,name,area,rating,reviews_count&status=eq.active&or=(${or})&order=rating.desc.nullslast&limit=60`,
            { headers: { apikey: creds.key, Authorization: `Bearer ${creds.key}` } },
          )
            .then((res) => (res.ok ? res.json() : []))
            .catch(() => [])
        : Promise.resolve([])) as Vendor[];
      if (!cancelled) setVendors(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── OTP + submit ──────────────────────────────────────────────────────────
  async function sendOtp() {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Code send nahi hua"); return; }
      if (j.devCode) setDevCode(j.devCode);
      setOtpSent(true);
    } finally { setBusy(false); }
  }

  async function verifyOtp() {
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Galat code"); return; }
      setVerifiedToken(j.token);
    } finally { setBusy(false); }
  }

  async function book() {
    if (!vendorId || !serviceId || !slotStart) return;
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ business_id: vendorId, service_id: serviceId, slot_start: slotStart, name, vehicle, notes, phone, token: verifiedToken }),
      });
      const j = await res.json();
      if (!res.ok) { setError(j.error ?? "Booking fail ho gayi"); return; }
      setDone({ ref: j.ref, service_name: j.service_name, price_inr: j.price_inr, slot_label: j.slot_label, date: j.date, vendor_name: j.vendor_name });
    } finally { setBusy(false); }
  }

  const canSubmit = Boolean(vendorId && serviceId && slotStart && name.trim() && vehicle.trim() && verifiedToken);

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <BrandHeader brand={brand} />
        <section className="flex-1 mx-auto max-w-lg w-full px-6 py-20">
          <div className="rounded-2xl p-8 text-center border-2" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
            <div className="text-5xl mb-3">✅</div>
            <h1 className="heading-md mb-1">Booking Confirm!</h1>
            <p className="text-sm opacity-60 mb-6">Reference: <span className="font-bold tabular">{done.ref}</span></p>
            <div className="text-left text-sm space-y-2 rounded-xl p-4 mb-6" style={{ background: "var(--brand-tint)" }}>
              <p><span className="opacity-60">Vendor:</span> <b>{done.vendor_name}</b></p>
              <p><span className="opacity-60">Service:</span> <b>{done.service_name}</b> · {inr(done.price_inr)}</p>
              <p><span className="opacity-60">Slot:</span> <b>{done.slot_label}</b>, {dayMeta(done.date).dow}, {dayMeta(done.date).day} {dayMeta(done.date).month}</p>
              <p><span className="opacity-60">Payment:</span> Shop par pay karein</p>
            </div>
            <button onClick={() => { setDone(null); setServiceId(null); setSlotStart(null); setVerifiedToken(null); }} className="btn-primary w-full py-3 text-sm">
              Ek aur booking karein
            </button>
          </div>
        </section>
        <BrandFooter brand={brand} />
      </div>
    );
  }

  // ── Main flow ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-14 md:py-16">
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="chip chip-brand mb-5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />Car Wash & Service</div>
          <h1 className="heading-xl mb-3">Apni Gaadi ka <span className="gradient-text">Slot Book Karein</span></h1>
          <p className="text-base opacity-60">Dukaan chunein, time choosein — confirm ho jayega turant. Payment shop par.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl w-full px-6 pb-20 space-y-6">
        {/* Step 1 — vendor */}
        {!vendorId && (
          <div className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <h2 className="font-bold text-sm mb-1" style={{ color: "var(--brand-secondary)" }}>1 · Dukaan chunein</h2>
            <p className="text-xs opacity-50 mb-4">{vendors === null ? "Load ho raha hai…" : `${vendors.length} verified workshops available`}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(vendors ?? []).map((v) => (
                <button key={v.id} onClick={() => setVendorId(v.id)}
                  className="text-left rounded-xl border p-4 transition-all hover:shadow-md"
                  style={{ borderColor: "var(--hairline)" }}>
                  <p className="font-bold text-sm">{v.name}</p>
                  <p className="text-xs opacity-50 mt-0.5">{v.area ?? ""}{v.rating ? ` · ★ ${Number(v.rating).toFixed(1)}` : ""}{v.reviews_count ? ` (${v.reviews_count})` : ""}</p>
                  <span className="inline-block mt-2 text-xs font-bold" style={{ color: "var(--brand-secondary)" }}>Book →</span>
                </button>
              ))}
            </div>
            {vendors !== null && vendors.length === 0 && (
              <p className="text-sm opacity-60">Abhi koi workshop enroll nahi hui. Apni dukaan add karne ke liye <b>/vendor-bookings</b> par jayein.</p>
            )}
          </div>
        )}

        {vendorId !== null && (
          <>
            {/* Step 2 — service */}
            <div className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm" style={{ color: "var(--brand-secondary)" }}>2 · Service chunein {selectedVendor ? `— ${selectedVendor.name}` : ""}</h2>
                <button onClick={() => { setVendorId(null); setServiceId(null); }} className="text-xs underline opacity-50 hover:opacity-100">badlein</button>
              </div>
              {services.length === 0 ? (
                <p className="text-sm opacity-60">Is dukaan ki services abhi list nahi hui.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((s) => (
                    <button key={s.id} onClick={() => setServiceId(s.id)}
                      className={`text-left rounded-xl p-4 transition-all border ${serviceId === s.id ? "border-2" : "hover:border-[var(--hairline)]"}`}
                      style={serviceId === s.id ? { borderColor: "var(--brand-secondary)", background: "var(--brand-tint)" } : { borderColor: "var(--hairline)" }}>
                      <div className="flex justify-between gap-2">
                        <p className="font-bold text-sm">{s.name}</p>
                        <p className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--brand-secondary)" }}>{inr(Number(s.price_inr))}</p>
                      </div>
                      <p className="text-xs opacity-50 mt-1">~{s.duration_minutes} min{s.description ? ` · ${s.description}` : ""}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3 — date + slot */}
            {serviceId && (
              <div className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
                <h2 className="font-bold text-sm mb-3" style={{ color: "var(--brand-secondary)" }}>3 · Din aur time chunein</h2>
                <div className="grid grid-cols-7 gap-1 mb-5">
                  {dates.map((d) => {
                    const m = dayMeta(d);
                    const active = d === dateStr;
                    return (
                      <button key={d} onClick={() => setDateStr(d)}
                        className={`py-2 rounded-lg text-center transition-all ${active ? "text-white font-bold shadow-sm" : "hover:bg-surface-sunken"}`}
                        style={active ? { background: "var(--brand-gradient)" } : {}}>
                        <span className="block text-[10px] uppercase opacity-70">{m.dow}</span>
                        <span className="block text-sm font-bold">{m.day}</span>
                        <span className="block text-[10px] opacity-60">{m.month}</span>
                      </button>
                    );
                  })}
                </div>
                {slots === null ? (
                  <p className="text-sm opacity-50">Slots load ho raha hai…</p>
                ) : slots.filter((s) => s.available).length === 0 ? (
                  <p className="text-sm opacity-60">Is din ke slots bhar gaye ya band hai — doosra din dekhein.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <button key={s.start} disabled={!s.available} onClick={() => setSlotStart(s.start)}
                        className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${!s.available ? "opacity-30 cursor-not-allowed line-through" : slotStart === s.start ? "text-white shadow-sm" : "hover:border-[var(--hairline)]"}`}
                        style={slotStart === s.start && s.available ? { background: "var(--brand-gradient)" } : { borderColor: "var(--hairline)" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — details */}
            {slotStart && (
              <div className="rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
                <h2 className="font-bold text-sm mb-3" style={{ color: "var(--brand-secondary)" }}>4 · Apni details daalein</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" maxLength={80}
                    className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-secondary)]" style={{ borderColor: "var(--hairline)" }} />
                  <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Gaadi — model + number (Swift MP09…)" maxLength={120}
                    className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-secondary)]" style={{ borderColor: "var(--hairline)" }} />
                </div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Koi note? (optional)" rows={2} maxLength={500}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-secondary)] mb-3" style={{ borderColor: "var(--hairline)" }} />

                {!verifiedToken ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number" inputMode="tel" maxLength={15}
                        className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-secondary)]" style={{ borderColor: "var(--hairline)" }} />
                      <button onClick={sendOtp} disabled={busy || phone.replace(/\D/g, "").length < 10} className="px-5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "var(--brand-primary)" }}>
                        {otpSent ? "Resend" : "OTP bhejein"}
                      </button>
                    </div>
                    {otpSent && (
                      <div className="space-y-2">
                        {devCode && <p className="text-xs opacity-60">Dev code: <b className="tabular" style={{ color: "var(--brand-secondary)" }}>{devCode}</b></p>}
                        <div className="flex gap-2">
                          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" maxLength={6}
                            className="flex-1 rounded-xl border px-4 py-3 text-sm tracking-widest outline-none focus:border-[var(--brand-secondary)]" style={{ borderColor: "var(--hairline)" }} />
                          <button onClick={verifyOtp} disabled={busy || code.length < 4} className="px-5 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: "var(--brand-primary)" }}>Verify</button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs opacity-50">Confirm karne ke liye number verify zaroori hai — dukaan wale aapko isi par dhundhenge.</p>
                  </div>
                ) : (
                  <p className="text-xs mb-3" style={{ color: "var(--positive, #16a34a)" }}>✓ {phone} verified</p>
                )}

                {error && <p className="text-xs tone-negative mt-3">{error}</p>}

                <button onClick={book} disabled={!canSubmit || busy} className="btn-primary w-full py-3.5 text-sm mt-3 disabled:opacity-40">
                  {busy ? "Book ho raha hai…" : selectedService ? `Confirm: ${selectedService.name} · ${inr(Number(selectedService.price_inr))}` : "Confirm Booking"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
