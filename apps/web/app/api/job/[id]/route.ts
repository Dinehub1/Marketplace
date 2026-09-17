import { NextRequest, NextResponse } from "next/server";
import { checkPhoneToken, db, toIndiaPhone } from "@/lib/nextel";
import { publicUrlFor } from "@/lib/r2";
import { paidOrderFor, productPrice } from "@/lib/product-orders";
import { asRow} from "@/lib/postgrest";
import type { ProductJobRow } from "@/lib/db-types";

/**
 * GET /api/job/<id> — what state is this job in, and may this caller have the
 * clean sheet?
 *
 * The clean key is returned only when an `orders` row for THIS job and THIS phone
 * is paid. Ownership is proven the same way claiming is (OTP-signed phone token),
 * and a job that belongs to another number answers 404 rather than 403: job ids
 * are sequential, so a 403 would confirm which ids exist to a stranger.
 *
 * An unclaimed job (phone null) is also 404 here — the caller claims it by
 * ordering (see POST /api/orders), which is the step that needs a verified phone.
 */
const noStore = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isFinite(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400, headers: noStore });
  }

  const url = new URL(req.url);
  // Token travels in a header, never the query string (referrer/log leakage).
  const phone = toIndiaPhone(req.headers.get("x-phone") ?? url.searchParams.get("phone") ?? "");
  const token = req.headers.get("x-phone-token") ?? url.searchParams.get("token") ?? "";
  if (!phone || !checkPhoneToken(phone, token)) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 401, headers: noStore });
  }

  const res = await db(`product_jobs?id=eq.${jobId}&select=id,product,phone,output_key,preview_key,status,error,created_at`);
  const job = await asRow<ProductJobRow>(res);
  if (!job || !job.phone || job.phone !== phone) {
    return NextResponse.json({ error: "Job not found" }, { status: 404, headers: noStore });
  }

  const pricePaise = await productPrice(job.product);
  // The preview key is the job's own, never derived from output_key, so this
  // response cannot be edited into the paid URL.
  const previewUrl = job.preview_key ? publicUrlFor(job.preview_key) : null;

  if (job.status !== "done" || !job.output_key) {
    return NextResponse.json(
      { job_id: jobId, product: job.product, status: job.status, preview_url: previewUrl, locked: true, output_url: null, price_paise: pricePaise, error: job.error ?? null },
      { headers: noStore },
    );
  }

  const order = await paidOrderFor(jobId, phone);
  const paid = Boolean(order);

  return NextResponse.json(
    {
      job_id: jobId,
      product: job.product,
      status: job.status,
      preview_url: previewUrl,
      locked: !paid,
      output_url: paid ? publicUrlFor(job.output_key) : null,
      price_paise: pricePaise,
      paid_at: order?.created_at ?? null,
      amount_paise: order?.amount_paise ?? null,
    },
    { headers: noStore },
  );
}
