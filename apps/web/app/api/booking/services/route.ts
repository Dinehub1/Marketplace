import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/nextel";
import { DEFAULT_HOURS, loadVendorHours } from "@/lib/booking";
import { asRow, asRows } from "@/lib/postgrest";
import type { BusinessRow, VendorServiceRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Public catalogue for one vendor's booking page: the business card, its
 * active services and its weekly hours. Read-only; nothing here needs auth —
 * it is exactly what the public page renders.
 *
 * Vendors with no hours configured fall back to DEFAULT_HOURS so a shop that
 * just enrolled is bookable on day one (`hours_is_default` tells the UI to
 * show "default timings" rather than inventing specificity).
 */
export async function GET(req: NextRequest) {
  const businessId = Number(new URL(req.url).searchParams.get("business_id"));
  if (!Number.isFinite(businessId) || businessId <= 0) {
    return NextResponse.json({ error: "business_id required" }, { status: 400, headers: noStore });
  }

  const bizRes = await db(
    `businesses?id=eq.${businessId}&status=eq.active&select=id,name,category,area,address,phone,rating,reviews_count,image_url`,
  );
  const biz = await asRow<BusinessRow>(bizRes);
  if (!biz) return NextResponse.json({ error: "Vendor not found" }, { status: 404, headers: noStore });

  const svcRes = await db(
    `vendor_services?business_id=eq.${businessId}&is_active=eq.true&select=id,name,description,price_inr,duration_minutes&order=sort_order.asc,name.asc`,
  );
  const services = svcRes.ok ? (await asRows<VendorServiceRow>(svcRes)) ?? [] : [];

  const hoursMap = await loadVendorHours(businessId);
  const configured = hoursMap.size > 0;
  // Render all seven days so the UI can grey out closed days explicitly
  // instead of leaving customers guessing why Tuesday vanished.
  const hours = Array.from({ length: 7 }, (_, day) => {
    const h =
      hoursMap.get(day) ??
      (configured
        ? null
        : { open_time: DEFAULT_HOURS.weekdays.open_time, close_time: DEFAULT_HOURS.weekdays.close_time });
    return h
      ? { day_of_week: day, day: DAY_NAMES[day], open_time: h.open_time.slice(0, 5), close_time: h.close_time.slice(0, 5), closed: false }
      : { day_of_week: day, day: DAY_NAMES[day], open_time: null, close_time: null, closed: true };
  });

  return NextResponse.json({ ok: true, business: biz, services, hours, hours_is_default: !configured }, { headers: noStore });
}
