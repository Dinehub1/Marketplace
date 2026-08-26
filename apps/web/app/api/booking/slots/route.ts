import { NextRequest, NextResponse } from "next/server";
import {
  BOOKING_WINDOW_DAYS,
  computeSlots,
  istDayOfWeek,
  istDateString,
  loadTakenSlots,
  loadVendorHours,
  DEFAULT_HOURS,
} from "@/lib/booking";

const noStore = { "Cache-Control": "no-store" };

/**
 * Public availability: the bookable slots for one vendor on one IST date.
 * Availability = weekly hours grid minus already-taken slots (any active
 * booking counts against capacity) minus past/last-minute starts. The exact
 * same validation runs again inside POST /api/booking, so a stale slot grid
 * can never produce a double-booking — worst case the customer is told
 * "just gone" at submit time.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const businessId = Number(url.searchParams.get("business_id"));
  const dateStr = (url.searchParams.get("date") ?? "").trim();
  if (!Number.isFinite(businessId) || businessId <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "business_id and date (YYYY-MM-DD) required" }, { status: 400, headers: noStore });
  }

  // The date must sit inside the bookable window: today (IST) .. today+N.
  const now = new Date();
  const todayStr = istDateString(now);
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60_000);
  if (dateStr < todayStr || dateStr > istDateString(windowEnd)) {
    return NextResponse.json({ error: "Date outside the booking window" }, { status: 400, headers: noStore });
  }

  const hoursMap = await loadVendorHours(businessId);
  const dow = istDayOfWeek(dateStr);
  const configured = hoursMap.size > 0;
  const hours =
    hoursMap.get(dow) ??
    (configured ? null : { ...DEFAULT_HOURS.weekdays, business_id: businessId, day_of_week: dow });

  if (!hours) {
    return NextResponse.json({ ok: true, date: dateStr, closed: true, slots: [] }, { headers: noStore });
  }

  const taken = await loadTakenSlots(businessId, dateStr);
  const slots = computeSlots({ dateStr, hours, taken, now });
  return NextResponse.json(
    { ok: true, date: dateStr, closed: false, open_time: hours.open_time.slice(0, 5), close_time: hours.close_time.slice(0, 5), slots },
    { headers: noStore },
  );
}
