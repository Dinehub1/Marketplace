import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, deleteObject, listingKey,
  publicUrlFor, putObject, r2Configured,
} from "@/lib/r2";

const noStore = { "Cache-Control": "no-store" };

/**
 * Listing photos for a claimed business.
 *
 * Ownership is proven exactly the way claiming is: an OTP-verified phone that
 * matches the number stored on the listing (see ../claim/route.ts). A business
 * that has not proven that number cannot add or delete photos, which matters
 * because the object lands in a public bucket.
 *
 * Objects go to marketplace/listings/<business_id>/<uuid>.<ext> — this
 * platform's own namespace inside a bucket shared with the user's other apps.
 */
async function authorize(businessId: number, phone: string, token: string) {
  if (!phone || !checkPhoneToken(phone, token)) {
    return { error: NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore }) };
  }
  const res = await db(`businesses?id=eq.${businessId}&select=id,name,phone,verified`);
  const biz = ((await res.json()) as any[])[0];
  if (!biz) return { error: NextResponse.json({ error: "Business not found" }, { status: 404, headers: noStore }) };
  const bizPhone = toIndiaPhone(biz.phone ?? "");
  if (!bizPhone || bizPhone.slice(-10) !== phone.slice(-10)) {
    return { error: NextResponse.json({ error: "This number does not own this listing" }, { status: 403, headers: noStore }) };
  }
  return { biz };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });
  if (!r2Configured) {
    return NextResponse.json({ error: "Photo storage is not configured yet" }, { status: 503, headers: noStore });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected a file upload" }, { status: 400, headers: noStore });

  const phone = toIndiaPhone(String(form.get("phone") ?? ""));
  const token = String(form.get("token") ?? "");
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400, headers: noStore });
  }

  const authed = await authorize(businessId, phone ?? "", token);
  if (authed.error) return authed.error;

  const rl = rateLimit(`media:${clientIp(req)}:${phone}`, 20, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, {
      status: 429,
      headers: { ...noStore, "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) },
    });
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPG, PNG or WebP images are accepted" }, { status: 415, headers: noStore });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is larger than 5 MB" }, { status: 413, headers: noStore });
  }

  const key = listingKey(businessId, ext);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!(await putObject(key, bytes, file.type))) {
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 502, headers: noStore });
  }

  const url = publicUrlFor(key);
  const insert = await db("business_media", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      business_id: businessId, url, object_key: key, kind: "photo",
      content_type: file.type, bytes: file.size,
    }]),
  });
  if (!insert.ok) {
    // Do not leave an orphan object in the bucket if the row could not be saved.
    await deleteObject(key);
    return NextResponse.json({ error: "Could not save the photo record" }, { status: 500, headers: noStore });
  }
  const [row] = (await insert.json()) as any[];
  return NextResponse.json({ ok: true, id: row?.id, url }, { headers: noStore });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });

  const body = await req.json().catch(() => ({}));
  const phone = toIndiaPhone(body.phone ?? "");
  const authed = await authorize(businessId, phone ?? "", String(body.token ?? ""));
  if (authed.error) return authed.error;

  const mediaId = Number(body.mediaId);
  if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400, headers: noStore });

  const res = await db(`business_media?id=eq.${mediaId}&business_id=eq.${businessId}&select=id,object_key`);
  const row = ((await res.json()) as any[])[0];
  if (!row) return NextResponse.json({ error: "Photo not found" }, { status: 404, headers: noStore });

  await deleteObject(row.object_key);
  await db(`business_media?id=eq.${mediaId}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return NextResponse.json({ ok: true }, { headers: noStore });
}

/** Public list of a listing's photos, newest first. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!businessId) return NextResponse.json({ error: "Invalid business" }, { status: 400, headers: noStore });
  const res = await db(`business_media?business_id=eq.${businessId}&select=id,url,kind,position&order=position.asc,id.asc`);
  return NextResponse.json({ photos: await res.json() }, { headers: noStore });
}
