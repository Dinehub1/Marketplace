import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { createClient as createSb } from "@supabase/supabase-js";

const noStore = { "Cache-Control": "no-store" };

/**
 * Customer ("end user") dashboard data:
 *  - leads they sent (leads.phone = the customer's own number)
 *  - businesses they own (matched by phone)
 *
 * Auth: either the custom phone token (dev / WhatsApp OTP) or a Supabase
 * session bearer (prod). Both prove ownership of the phone.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const auth = req.headers.get("authorization") ?? "";
  // Token travels in a header, never the query string (referrer/log leakage).
  // The query-param forms below are accepted as a short migration bridge only.
  let phone = toIndiaPhone(req.headers.get("x-phone") ?? url.searchParams.get("phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? url.searchParams.get("token") ?? "";

  let verified = false;

  if (auth.startsWith("Bearer ")) {
    try {
      const sb = createSb(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data } = await sb.auth.getUser(auth.slice(7));
      if (data.user?.phone) {
        phone = toIndiaPhone(data.user.phone) ?? phone;
        verified = true;
      }
    } catch {}
  }

  if (!verified && phone && token && checkPhoneToken(phone, token)) verified = true;

  if (!phone || !verified) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const last10 = phone.slice(-10);
  const [leadsRes, bizRes] = await Promise.all([
    db(`leads?phone=eq.${phone}&order=created_at.desc&limit=50&select=id,business_id,name,phone,message,status,created_at`),
    db(`businesses?phone=like.*${last10}&select=id,name,category,status,city`),
  ]);

  const leads = ((await leadsRes.json().catch(() => [])) as any[]) ?? [];
  const businesses = ((await bizRes.json().catch(() => [])) as any[]) ?? [];

  return NextResponse.json({ ok: true, leads, businesses }, { headers: noStore });
}
