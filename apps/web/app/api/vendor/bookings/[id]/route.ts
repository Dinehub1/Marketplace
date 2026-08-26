import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { STATUS_TRANSITIONS, loadOwnedBusinesses } from "@/lib/booking";

const noStore = { "Cache-Control": "no-store" };

type Ctx = { params: Promise<{ id: string }> };

/**
 * Move one of the vendor's bookings through its lifecycle:
 *
 *   requested -> confirmed -> in_progress -> completed
 *                       \-> cancelled / no_show (from any live state)
 *
 * The vendor can only touch bookings whose business is theirs (same phone-suffix
 * ownership proof), and only along the transition map — no jumping straight
 * from requested to completed, no reopening a cancelled job. Completing a
 * pay-at-shop booking marks it paid: at completion the money has changed hands
 * at the counter, which is exactly what payment_status tracks.
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400, headers: noStore });
  }

  const body = await req.json().catch(() => ({}));
  const nextStatus = String(body.status ?? "");
  const ownedIds = (await loadOwnedBusinesses(phone)).map((b) => b.id);
  if (ownedIds.length === 0) {
    return NextResponse.json({ error: "No businesses linked to this phone" }, { status: 403, headers: noStore });
  }

  const res = await db(
    `bookings?id=eq.${id}&business_id=in.(${ownedIds.join(",")})&select=id,status,payment_mode,payment_status`,
  );
  const booking = ((await res.json()) as any[])[0];
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404, headers: noStore });

  const allowed = STATUS_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `"${booking.status}" par "${nextStatus || "?"}" allowed nahi hai` },
      { status: 409, headers: noStore },
    );
  }

  const patch: Record<string, unknown> = { status: nextStatus, updated_at: new Date().toISOString() };
  if (nextStatus === "completed" && booking.payment_mode === "pay_at_shop") {
    patch.payment_status = "paid";
  }

  const upd = await db(`bookings?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation", "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!upd.ok) return NextResponse.json({ error: "Update save nahi hua" }, { status: 500, headers: noStore });
  const updated = ((await upd.json()) as any[])[0];
  return NextResponse.json({ ok: true, booking: updated }, { headers: noStore });
}
