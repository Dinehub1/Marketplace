import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

const REPLY_MAX = 2000;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string }> },
) {
  const { id, rid } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const reply = String(body.reply ?? "").trim().slice(0, REPLY_MAX);
  const phone = toIndiaPhone(body.phone ?? "");
  if (!reply) return NextResponse.json({ error: "Reply khali nahi ho sakta" }, { status: 400, headers: noStore });
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const rl = rateLimit(`reply:${clientIp(req)}:${phone}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please slow down and try again." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const revRes = await db(`reviews?id=eq.${rid}&business_id=eq.${businessId}&select=id,business_id`);
  const rev = ((await revRes.json()) as any[])[0];
  if (!rev) return NextResponse.json({ error: "Review not found" }, { status: 404, headers: noStore });

  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,phone`);
  const biz = ((await bizRes.json()) as any[])[0];
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore });

  const bizPhone = toIndiaPhone(biz.phone ?? "");
  if (!bizPhone || bizPhone.slice(-10) !== phone.slice(-10)) {
    return NextResponse.json(
      { error: "Is review par reply karne ka permission nahi hai" },
      { status: 403, headers: noStore },
    );
  }

  const patch = await db(`reviews?id=eq.${rid}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ owner_reply: reply }),
  });
  if (!patch.ok) return NextResponse.json({ error: "Reply save nahi hui" }, { status: 500, headers: noStore });

  return NextResponse.json({ ok: true, review: (await patch.json())[0] }, { headers: noStore });
}
