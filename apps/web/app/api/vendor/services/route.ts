import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { loadOwnedBusinesses } from "@/lib/booking";
import { asRow, asRows } from "@/lib/postgrest";
import type { VendorServiceRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

/**
 * A vendor's service catalogue (what customers can book). All four verbs are
 * gated by the OTP phone token; every query is additionally scoped to the
 * businesses that phone owns, so even a crafted id for someone else's service
 * resolves to "not found".
 *
 * DELETE is a soft-deactivate (is_active=false): past bookings keep pointing
 * at a real row, and a vendor who deletes their wash package by mistake gets
 * it back with one toggle instead of retyping prices.
 */
async function requireOwner(req: NextRequest) {
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) return null;
  return loadOwnedBusinesses(phone);
}

export async function GET(req: NextRequest) {
  const owned = await requireOwner(req);
  if (!owned) return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  if (owned.length === 0) return NextResponse.json({ ok: true, businesses: [], services: [] }, { headers: noStore });

  const ids = owned.map((b) => b.id).join(",");
  const res = await db(
    `vendor_services?business_id=in.(${ids})&select=id,business_id,name,description,price_inr,duration_minutes,is_active,sort_order&order=sort_order.asc,name.asc`,
  );
  return NextResponse.json({ ok: true, businesses: owned, services: res.ok ? (await asRows<VendorServiceRow>(res)) ?? [] : [] }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const owned = await requireOwner(req);
  if (!owned) return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const businessId = Number(body.business_id);
  const name = String(body.name ?? "").trim().slice(0, 120);
  const description = String(body.description ?? "").trim().slice(0, 500) || null;
  const priceInr = Number(body.price_inr);
  const duration = Number(body.duration_minutes ?? 60);

  if (!name || !Number.isFinite(priceInr) || priceInr < 0) {
    return NextResponse.json({ error: "Service ka naam aur sahi price zaroori hai" }, { status: 400, headers: noStore });
  }
  if (!owned.some((b) => b.id === businessId)) {
    return NextResponse.json({ error: "Yeh business is phone se linked nahi hai" }, { status: 403, headers: noStore });
  }

  const ins = await db("vendor_services", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: businessId,
      name,
      description,
      price_inr: Math.round(priceInr * 100) / 100,
      duration_minutes: Math.min(600, Math.max(15, Math.round(duration) || 60)),
      is_active: true,
    }),
  });
  if (!ins.ok) return NextResponse.json({ error: "Service save nahi hui" }, { status: 500, headers: noStore });
  return NextResponse.json({ ok: true, service: await asRow<VendorServiceRow>(ins) }, { headers: noStore });
}

export async function PATCH(req: NextRequest) {
  const owned = await requireOwner(req);
  if (!owned) return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400, headers: noStore });
  }
  const ids = owned.map((b) => b.id).join(",");

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) patch.name = String(body.name).trim().slice(0, 120);
  if (body.description !== undefined) patch.description = String(body.description).trim().slice(0, 500) || null;
  if (body.price_inr !== undefined) {
    const p = Number(body.price_inr);
    if (!Number.isFinite(p) || p < 0) return NextResponse.json({ error: "Sahi price daalein" }, { status: 400, headers: noStore });
    patch.price_inr = Math.round(p * 100) / 100;
  }
  if (body.duration_minutes !== undefined) {
    patch.duration_minutes = Math.min(600, Math.max(15, Math.round(Number(body.duration_minutes)) || 60));
  }
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);

  const upd = await db(`vendor_services?id=eq.${id}&business_id=in.(${ids})`, {
    method: "PATCH",
    headers: { Prefer: "return=representation", "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!upd.ok) return NextResponse.json({ error: "Update save nahi hua" }, { status: 500, headers: noStore });
  const rows = await asRows<VendorServiceRow>(upd);
  if (rows.length === 0) return NextResponse.json({ error: "Service not found" }, { status: 404, headers: noStore });
  return NextResponse.json({ ok: true, service: rows[0] }, { headers: noStore });
}

export async function DELETE(req: NextRequest) {
  const owned = await requireOwner(req);
  if (!owned) return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400, headers: noStore });
  }
  const ids = owned.map((b) => b.id).join(",");
  // Soft-deactivate, never hard delete (see header comment).
  const upd = await db(`vendor_services?id=eq.${id}&business_id=in.(${ids})`, {
    method: "PATCH",
    headers: { Prefer: "return=representation", "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
  });
  if (!upd.ok) return NextResponse.json({ error: "Deactivate nahi hua" }, { status: 500, headers: noStore });
  const rows = await asRows<VendorServiceRow>(upd);
  if (rows.length === 0) return NextResponse.json({ error: "Service not found" }, { status: 404, headers: noStore });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
