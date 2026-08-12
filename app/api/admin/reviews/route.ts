import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/nextel";

const noStore = { "Cache-Control": "no-store" };

// Admin gate: require x-admin-token to match ADMIN_TOKEN. When ADMIN_TOKEN is
// unset we only allow access outside production, so local/dev moderation works
// without a secret but prod stays locked down.
function adminOk(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return process.env.NODE_ENV !== "production";
  return req.headers.get("x-admin-token") === token;
}

export async function GET(req: NextRequest) {
  if (!adminOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const res = await db(
    `reviews?select=id,reviewer_name,rating,comment,is_approved,created_at,business_id,businesses(name)&order=created_at.desc&limit=200`,
  );
  if (!res.ok) return NextResponse.json({ error: "Could not load reviews" }, { status: 500, headers: noStore });
  return NextResponse.json({ reviews: (await res.json()) as any[] }, { headers: noStore });
}

export async function PATCH(req: NextRequest) {
  if (!adminOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  const { id, is_approved } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400, headers: noStore });
  const patch = await db(`reviews?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ is_approved: !!is_approved }),
  });
  if (!patch.ok) return NextResponse.json({ error: "Update failed" }, { status: 500, headers: noStore });
  return NextResponse.json({ ok: true }, { headers: noStore });
}
