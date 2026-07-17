import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, sendTemplate, toIndiaPhone } from "@/lib/nextel";

const noStore = { "Cache-Control": "no-store" };

/** Create a lead (customer must have a verified-phone token). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  const businessId = Number(body.business_id);
  const name = String(body.name ?? "").trim().slice(0, 120);
  const message = String(body.message ?? "").trim().slice(0, 1000);

  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }
  if (!businessId || !name) {
    return NextResponse.json({ error: "business_id and name required" }, { status: 400, headers: noStore });
  }

  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,name,phone,category,brand_id`);
  const biz = ((await bizRes.json()) as any[])[0];
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore });

  const ins = await db("leads", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: biz.id,
      brand_id: biz.brand_id,
      name,
      phone,
      message: message || `Interested in ${biz.name}`,
      status: "new",
      source_path: "/business/" + biz.id,
      meta: { business_name: biz.name, business_phone: biz.phone, verified: true },
    }),
  });
  if (!ins.ok) return NextResponse.json({ error: "Could not save lead" }, { status: 500, headers: noStore });

  // Best-effort WhatsApp alert to the business (requires an approved template).
  let notified = false;
  const leadTemplate = process.env.NEXTEL_LEAD_TEMPLATE;
  if (leadTemplate && biz.phone) {
    notified = (await sendTemplate(biz.phone, leadTemplate, [name, phone, message || "New enquiry"])).ok;
  }

  // wa.me deep link so the customer can message the business directly.
  const bizWa = toIndiaPhone(biz.phone ?? "");
  const waText = encodeURIComponent(`Namaste! Maine aapko ${"SarkarMarketplace"} par dekha. ${message || "Mujhe aapki services mein interest hai."} — ${name}`);
  const wa_link = bizWa ? `https://wa.me/${bizWa}?text=${waText}` : null;

  return NextResponse.json({ ok: true, notified, wa_link }, { headers: noStore });
}

/** List leads for a business owner (verified by their own phone token). */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const phone = toIndiaPhone(url.searchParams.get("phone") ?? "");
  const token = url.searchParams.get("token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  // Businesses whose stored phone ends with the owner's 10-digit number.
  const last10 = phone.slice(-10);
  const bizRes = await db(`businesses?phone=like.*${last10}&select=id,name,category,rating,address`);
  const businesses = ((await bizRes.json()) as any[]) ?? [];
  if (businesses.length === 0) {
    return NextResponse.json({ ok: true, businesses: [], leads: [] }, { headers: noStore });
  }

  const ids = businesses.map((b) => b.id).join(",");
  const leadsRes = await db(`leads?business_id=in.(${ids})&order=created_at.desc&limit=100&select=id,business_id,name,phone,message,status,created_at`);
  const leads = ((await leadsRes.json()) as any[]) ?? [];
  return NextResponse.json({ ok: true, businesses, leads }, { headers: noStore });
}
