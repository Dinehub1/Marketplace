import { db } from "@/lib/nextel";
import { productPrice } from "@/lib/product-orders";
import { publicUrlFor } from "@/lib/r2";
import PayPanel from "./pay-panel";

/**
 * /unlock/<job_id> — the standalone product paywall.
 *
 * Rendered with the platform's own design system (token utilities and the
 * component classes in globals.css) rather than local colours, so it belongs to
 * the site and follows dark mode.
 *
 * It deliberately does NOT need a phone token to render: the preview URL is a
 * capability URL the app already holds, and the job id is what the customer came
 * here with. Nothing about the clean file appears in the HTML — the panel asks
 * for it only after a paid order exists.
 */
export const dynamic = "force-dynamic";

export default async function UnlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);

  let job: any = null;
  if (Number.isFinite(jobId) && jobId > 0) {
    const res = await db(`product_jobs?id=eq.${jobId}&select=id,product,status,preview_key,output_key`);
    job = ((await res.json()) as any[])[0] ?? null;
  }

  if (!job || job.status !== "done") {
    return (
      <main className="section container-narrow">
        <h1 className="heading-lg">This file is not ready</h1>
        <p className="text-ink-2">
          The link may be old, or the job may have failed. Make it again from the app.
        </p>
      </main>
    );
  }

  const pricePaise = await productPrice(job.product);

  return (
    <main className="section container-narrow">
      <span className="badge badge-info">Print-ready · 300 dpi</span>
      <h1 className="heading-lg mt-3 mb-2">Unlock the clean file</h1>
      <p className="text-ink-2 mb-5">
        The preview below is watermarked. The file you unlock is not, and it downloads at full
        quality.
      </p>

      <PayPanel
        jobId={jobId}
        pricePaise={pricePaise}
        // Not the clean key: the page renders the watermarked object only.
        previewUrl={job.preview_key ? publicUrlFor(job.preview_key) : null}
      />
    </main>
  );
}
