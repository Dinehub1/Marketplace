import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";

const noStore = { "Cache-Control": "no-store" };

/**
 * Feature/boost a listing for placement monetization. Same ownership proof as
 * claim/route.ts: the OTP-verified phone must match the business's stored phone
 * (last-10-digit comparison). On success the listing is flagged featured and its
 * priority bumped so it floats to the top of the marketplace sort.
 *
 * PAYMENT IS A STUB. Pricing is a single env-driven constant (FEATURE_PRICE_INR,
 * default "499") returned to the client so it can render "Boost for ₹499". No real
 * payment gateway is integrated here.
 */
// Single source of truth for the boost price shown across the app.
const FEATURE_PRICE_INR = Number(process.env.FEATURE_PRICE_INR ?? "499");

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,name,phone,featured,priority`);
  const biz = ((await bizRes.json()) as any[])[0];
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore });

  const bizPhone = toIndiaPhone(biz.phone ?? "");
  if (!bizPhone || bizPhone.slice(-10) !== phone.slice(-10)) {
    return NextResponse.json(
      { error: "Is number se boost nahi ho sakta — listing par jo phone hai wahi verify karein." },
      { status: 403, headers: noStore },
    );
  }

  // PAYMENT STUB: no gateway — just flag the listing and bump its priority.
  const priority = (Number(biz.priority) || 0) + 10;
  const patch = await db(`businesses?id=eq.${businessId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ featured: true, priority }),
  });
  if (!patch.ok) return NextResponse.json({ error: "Boost save nahi ho saka" }, { status: 500, headers: noStore });

  return NextResponse.json({ ok: true, featured: true, priority, price_inr: FEATURE_PRICE_INR }, { headers: noStore });
}
