import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { createClient as createSb } from "@supabase/supabase-js";
import {asRows } from "@/lib/postgrest";
import type { LeadRow, BusinessRow } from "@/lib/db-types";

const noStore = { "Cache-Control": "no-store" };

const LEAD_SELECT = "id,business_id,name,phone,message,status,created_at";

/**
 * Dashboard data for one verified phone number. A phone can be both sides of
 * the marketplace at once — someone who enquires about a plumber may also own
 * the furniture shop two streets over — so the response carries both sides and
 * the caller picks the one its screen is about:
 *
 *  - `leads`      — leads this phone SENT (leads.phone = the caller's number)
 *  - `businesses` — businesses this phone owns (matched by phone)
 *  - `ownerLeads` — leads RECEIVED by those businesses (leads.business_id)
 *
 * `leads` and `ownerLeads` stay separate keys rather than one list with a
 * direction flag: conflating "who I enquired with" and "who enquired with me"
 * is how an owner dashboard ends up showing a business its own outgoing
 * messages as if they were customers.
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
    db(`leads?phone=eq.${phone}&order=created_at.desc&limit=50&select=${LEAD_SELECT}`),
    db(`businesses?phone=like.*${last10}&select=id,name,category,status,city`),
  ]);

  const leads = (await asRows<LeadRow>(leadsRes)) ?? [];
  const businesses = (await asRows<BusinessRow>(bizRes)) ?? [];

  // The owner side. This has to wait on `businesses` — ownership is what scopes
  // it, and it is the only thing that does: without the id filter this query
  // would read every lead in the table. businesses.id is a bigint, so coercing
  // through Number() means a non-numeric value cannot smuggle anything into the
  // in.() filter, and a phone that owns nothing costs no round trip at all.
  const ownedIds = businesses.map((b) => Number(b?.id)).filter((id) => Number.isSafeInteger(id));
  let ownerLeads: LeadRow[] = [];
  if (ownedIds.length) {
    const res = await db(
      `leads?business_id=in.(${ownedIds.join(",")})&order=created_at.desc&limit=100&select=${LEAD_SELECT}`,
    );
    ownerLeads = (await asRows<LeadRow>(res)) ?? [];
  }

  return NextResponse.json({ ok: true, leads, businesses, ownerLeads }, { headers: noStore });
}
