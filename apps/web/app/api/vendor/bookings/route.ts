import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { loadOwnedBusinesses } from "@/lib/booking";
import {asRows } from "@/lib/postgrest";
import type { BookingRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

/**
 * Vendor view of their bookings. Auth is the same OTP phone token everywhere
 * else in this codebase; scoping comes from `businesses.phone` ending with the
 * verified number, so a vendor sees bookings only for listings that are theirs.
 *
 * Returns upcoming-or-active first (what needs a decision today), capped at
 * 100, with the service name and business name embedded via FKs.
 */
export async function GET(req: NextRequest) {
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const businesses = await loadOwnedBusinesses(phone);
  if (businesses.length === 0) {
    return NextResponse.json({ ok: true, businesses: [], bookings: [] }, { headers: noStore });
  }
  const ids = businesses.map((b) => b.id).join(",");

  const nowIso = new Date().toISOString();
  const res = await db(
    `bookings?business_id=in.(${ids})` +
      // Anything still needing action, plus anything from now on — a missed
      // confirmation must not vanish just because its slot passed.
      `&or=(slot_start.gte.${nowIso},status.in.(requested,confirmed,in_progress))` +
      `&order=slot_start.asc&limit=100` +
      `&select=id,business_id,status,slot_start,customer_name,customer_phone,vehicle,notes,amount,vendor_payout,commission_amount,payment_status,payment_mode,created_at` +
      `,vendor_services(name),businesses(name,area,phone)`,
  );
  const bookings = res.ok ? (await asRows<BookingRow>(res)) ?? [] : [];
  return NextResponse.json({ ok: true, businesses, bookings }, { headers: noStore });
}
