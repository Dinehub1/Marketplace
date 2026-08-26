import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { loadOwnedBusinesses } from "@/lib/booking";

const noStore = { "Cache-Control": "no-store" };

type DayInput = {
  day_of_week: number;
  closed?: boolean;
  open_time?: string; // "HH:MM"
  close_time?: string;
  slot_minutes?: number;
  capacity?: number;
};

/**
 * Set a vendor's weekly hours (the slot grid customers book against). The
 * whole week is replaced in one PUT — the dashboard sends all seven days every
 * time, which keeps the client dumb and makes "closed Tuesday" just an absent
 * row rather than a flag nobody remembers to clear.
 */
export async function PUT(req: NextRequest) {
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const body = await req.json().catch(() => ({}));
  const businessId = Number(body.business_id);
  const days = Array.isArray(body.days) ? (body.days as DayInput[]) : null;
  if (!days) return NextResponse.json({ error: "days[] required" }, { status: 400, headers: noStore });

  const owned = await loadOwnedBusinesses(phone);
  if (!owned.some((b) => b.id === businessId)) {
    return NextResponse.json({ error: "Yeh business is phone se linked nahi hai" }, { status: 403, headers: noStore });
  }
  if (days.length > 7) return NextResponse.json({ error: "Max 7 days" }, { status: 400, headers: noStore });

  // Validate everything BEFORE touching the table so a bad row can't leave
  // the vendor with half a week configured.
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<number>();
  for (const d of days) {
    const day = Number(d.day_of_week);
    if (!Number.isInteger(day) || day < 0 || day > 6 || seen.has(day)) {
      return NextResponse.json({ error: `Invalid day_of_week: ${d.day_of_week}` }, { status: 400, headers: noStore });
    }
    seen.add(day);
    if (d.closed) continue;

    const open = /^\d{2}:\d{2}$/.test(d.open_time ?? "") ? `${d.open_time}:00` : null;
    const close = /^\d{2}:\d{2}$/.test(d.close_time ?? "") ? `${d.close_time}:00` : null;
    if (!open || !close || close <= open) {
      return NextResponse.json({ error: `Day ${day}: open/close times galat hain` }, { status: 400, headers: noStore });
    }
    const slotMinutes = Math.min(240, Math.max(15, Math.round(Number(d.slot_minutes ?? 60)) || 60));
    const capacity = Math.min(20, Math.max(1, Math.round(Number(d.capacity ?? 1)) || 1));
    rows.push({ business_id: businessId, day_of_week: day, open_time: open, close_time: close, slot_minutes: slotMinutes, capacity });
  }

  // Replace-the-week: absent rows mean closed. The brief window between DELETE
  // and POST reads as "unconfigured", which the public endpoints treat as the
  // default grid — never as a hard closure.
  await db(`vendor_hours?business_id=eq.${businessId}`, { method: "DELETE" });
  if (rows.length > 0) {
    const ins = await db("vendor_hours", { method: "POST", body: JSON.stringify(rows) });
    if (!ins.ok) return NextResponse.json({ error: "Hours save nahi hue" }, { status: 500, headers: noStore });
  }
  return NextResponse.json({ ok: true, days_configured: rows.length }, { headers: noStore });
}
