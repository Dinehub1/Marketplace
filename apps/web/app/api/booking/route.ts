import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, sendTemplate, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ACTIVE_STATUSES, DEFAULT_HOURS, bookingRef, commissionSplit, computeSlots, istDayOfWeek, loadTakenSlots, loadVendorHours } from "@/lib/booking";

const noStore = { "Cache-Control": "no-store" };

/**
 * Create a booking. The customer must hold an OTP-verified phone token (same
 * proof as leads), because a phone number is how the vendor finds the car at
 * the gate — unverified numbers would poison that.
 *
 * Server-side truth for availability: whatever the /slots grid said when the
 * page loaded is advisory only; this handler recomputes it and rejects the
 * write if the slot filled up in between. The money split (commission) is
 * snapshotted here so later rate changes never rewrite history.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const businessId = Number(body.business_id);
  const serviceId = String(body.service_id ?? "");
  const slotStart = String(body.slot_start ?? "");
  const name = String(body.name ?? "").trim().slice(0, 80);
  const vehicle = String(body.vehicle ?? "").trim().slice(0, 120);
  const notes = String(body.notes ?? "").trim().slice(0, 500);
  if (!businessId || !serviceId || !name || !vehicle) {
    return NextResponse.json({ error: "business_id, service_id, name and vehicle required" }, { status: 400, headers: noStore });
  }
  const when = new Date(slotStart);
  if (!slotStart || Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "Valid slot_start required" }, { status: 400, headers: noStore });
  }

  const rl = rateLimit(`booking:${clientIp(req)}:${phone}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down and try again." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  // ── Vendor + service must exist, match each other, be bookable ────────────
  const bizRes = await db(`businesses?id=eq.${businessId}&status=eq.active&select=id,name,phone,brand_id`);
  const biz = ((await bizRes.json()) as any[])[0];
  if (!biz) return NextResponse.json({ error: "Vendor not found" }, { status: 404, headers: noStore });

  const svcRes = await db(
    `vendor_services?id=eq.${serviceId}&business_id=eq.${businessId}&is_active=eq.true&select=id,name,price_inr,duration_minutes`,
  );
  const service = ((await svcRes.json()) as any[])[0];
  if (!service) return NextResponse.json({ error: "Service not available" }, { status: 404, headers: noStore });

  // ── Availability, recomputed from source ──────────────────────────────────
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(when);
  const hoursMap = await loadVendorHours(businessId);
  const dow = istDayOfWeek(dateStr);
  const configured = hoursMap.size > 0;
  const hours = hoursMap.get(dow);
  if (configured && !hours) {
    return NextResponse.json({ error: "Vendor is closed on that day" }, { status: 409, headers: noStore });
  }
  // No configured hours = the launch fallback grid, matching /slots exactly so
  // both endpoints always agree on what is bookable.
  const gridHours = hours ?? { ...DEFAULT_HOURS.weekdays, business_id: businessId, day_of_week: dow };

  const taken = await loadTakenSlots(businessId, dateStr);
  const slots = computeSlots({ dateStr, hours: gridHours, taken, now: new Date() });
  const slot = slots.find((s) => new Date(s.start).getTime() === when.getTime());
  if (!slot || !slot.available) {
    return NextResponse.json({ error: "Wo slot abhi bhar gaya — doosra time chunein." }, { status: 409, headers: noStore });
  }

  // Idempotency: one active booking per customer per vendor per slot.
  const dupRes = await db(
    `bookings?business_id=eq.${businessId}&customer_phone=eq.${encodeURIComponent(phone)}` +
      `&slot_start=eq.${when.toISOString()}&status=in.(${ACTIVE_STATUSES.join(",")})&select=id&limit=1`,
  );
  if (dupRes.ok && ((await dupRes.json()) as any[]).length > 0) {
    return NextResponse.json({ ok: true, already: true, message: "Yeh slot pehle se book hai" }, { headers: noStore });
  }

  // ── Commission snapshot from the brand config ──────────────────────────────
  let bps = 1500; // safe default if the brand row is missing its knob
  if (biz.brand_id) {
    const brandRes = await db(`brands?id=eq.${biz.brand_id}&select=features`);
    const brand = ((await brandRes.json()) as any[])[0];
    const configuredBps = Number(brand?.features?.commission_bps);
    if (Number.isFinite(configuredBps) && configuredBps > 0) bps = Math.round(configuredBps);
  }
  const split = commissionSplit(Number(service.price_inr) || 0, bps);

  const ins = await db("bookings", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: businessId,
      brand_id: biz.brand_id ?? null,
      vendor_service_id: service.id,
      service_type: service.name,
      slot_start: when.toISOString(),
      booking_date: when.toISOString(), // legacy column kept in sync
      amount: split.amount,
      commission_bps: split.commission_bps,
      commission_amount: split.commission_amount,
      vendor_payout: split.vendor_payout,
      payment_mode: "pay_at_shop",
      payment_status: "unpaid",
      customer_name: name,
      customer_phone: phone,
      vehicle,
      notes: notes || null,
      status: "requested",
    }),
  });
  if (!ins.ok) return NextResponse.json({ error: "Booking save nahi ho saka" }, { status: 500, headers: noStore });
  const created = ((await ins.json()) as any[])[0];

  // Measurement + vendor alert: best-effort, never fails the booking.
  await db("business_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ business_id: businessId, brand_slug: "sarkarcars", type: "booking", session_id: null, referrer: null, city: null }),
  }).catch(() => {});

  let notified = false;
  const tpl = process.env.NEXTEL_BOOKING_TEMPLATE;
  const vendorWa = toIndiaPhone(biz.phone ?? "");
  if (tpl && vendorWa) {
    const label = `${dateStr} ${slot.label}`;
    notified = (
      await sendTemplate(vendorWa, tpl, [name, phone, String(service.name), label, vehicle])
    ).ok;
  }

  return NextResponse.json(
    {
      ok: true,
      booking_id: created.id,
      ref: bookingRef(created.id),
      vendor_name: biz.name,
      service_name: service.name,
      price_inr: split.amount,
      slot_label: slot.label,
      date: dateStr,
      payment_mode: "pay_at_shop",
      notified,
    },
    { headers: noStore },
  );
}
