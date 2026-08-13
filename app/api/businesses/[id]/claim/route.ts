import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

/**
 * Claim a listing. Ownership is proven the same way the dashboard resolves it:
 * the OTP-verified phone must match the business's stored phone. On success the
 * listing is marked verified — which is what the Phase 2 badge now means
 * (claimed + OTP-confirmed), instead of the old blanket "verified" on every row.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const rl = rateLimit(`claim:${clientIp(req)}:${phone}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down and try again." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,name,phone,verified`);
  const biz = ((await bizRes.json()) as any[])[0];
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore });

  const bizPhone = toIndiaPhone(biz.phone ?? "");
  if (!bizPhone || bizPhone.slice(-10) !== phone.slice(-10)) {
    return NextResponse.json(
      { error: "Is number se claim nahi ho sakta — listing par jo phone hai wahi verify karein." },
      { status: 403, headers: noStore },
    );
  }
  if (biz.verified) {
    return NextResponse.json({ ok: true, already: true, verified: true }, { headers: noStore });
  }

  const patch = await db(`businesses?id=eq.${businessId}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ verified: true }),
  });
  if (!patch.ok) return NextResponse.json({ error: "Claim save nahi ho saka" }, { status: 500, headers: noStore });

  return NextResponse.json({ ok: true, verified: true }, { headers: noStore });
}
