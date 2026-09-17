import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { asRow} from "@/lib/postgrest";
import type { BusinessRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

// Editable columns for a claimed listing. `phone` is the business's contact
// number and is taken from `business_phone` in the body so it never collides
// with the `phone`+`token` pair used to prove ownership.
const EDITABLE = ["name", "description", "address", "area", "city", "category"] as const;
const LIMITS: Record<string, number> = {
  name: 200,
  description: 5000,
  address: 500,
  area: 150,
  city: 150,
  category: 150,
  business_phone: 20,
};

function clean(v: unknown, max: number): string | null {
  return typeof v === "string" ? v.trim().slice(0, max) : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  if (!phone || !checkPhoneToken(phone, String(body.token ?? ""))) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const bizRes = await db(`businesses?id=eq.${businessId}&select=id,phone`);
  const biz = await asRow<BusinessRow>(bizRes);
  if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore });

  const bizPhone = toIndiaPhone(biz.phone ?? "");
  if (!bizPhone || bizPhone.slice(-10) !== phone.slice(-10)) {
    return NextResponse.json(
      { error: "Is number se edit nahi ho sakta — listing par jo phone hai wahi verify karein." },
      { status: 403, headers: noStore },
    );
  }

  const update: Record<string, string> = {};
  for (const k of EDITABLE) {
    if (k in body) {
      const v = clean(body[k], LIMITS[k]);
      if (v) update[k] = v;
    }
  }
  const newPhone = clean(body.business_phone, LIMITS.business_phone);
  if (newPhone) update.phone = newPhone;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Kuch badlav to bhejein" }, { status: 400, headers: noStore });
  }

  const patch = await db(`businesses?id=eq.${businessId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(update),
  });
  if (!patch.ok) return NextResponse.json({ error: "Listing update nahi ho saki" }, { status: 500, headers: noStore });

  return NextResponse.json({ ok: true, business: (await patch.json())[0] }, { headers: noStore });
}
