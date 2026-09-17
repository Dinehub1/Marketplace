import { BrandHeader, BrandFooter } from "./brand-header";
import { createClient } from "@/lib/supabase/server";
import { db, toIndiaPhone } from "@/lib/nextel";
import { redirect } from "next/navigation";
import type { Brand } from "@/lib/brands";

export async function BrandSettings({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const bg = theme.bg ?? "#f9fafb";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login`);

  // Cross-tenant + authorization hardened for Phase 0 (C2). The target brand is
  // re-derived from the submitted hidden `slug` field on EVERY invocation —
  // never trusted from the component closure — and the write is authorized by
  // either (a) the phone that owns the brand (matches its contact_phone, the
  // same OTP-verified identity model claims use) or (b) an operator email from
  // BRAND_ADMIN_EMAILS. Until Phase 1 lands a real brand_owners table this is
  // the stand-in gate, and it fails closed.
  async function updateBrand(formData: FormData) {
    "use server";
    const s = await createClient();
    const { data: { user: u } } = await s.auth.getUser();
    if (!u) redirect(`/login`);

    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    if (!slug) {
      console.error("[brand-settings] missing slug on update");
      return;
    }

    const existingRes = await db(`brands?slug=eq.${encodeURIComponent(slug)}&select=id,contact_phone`);
    const existing = ((await existingRes.json()) as { id: string | null; contact_phone: string | null }[])[0];

    const callerPhone = toIndiaPhone(u.phone ?? "");
    const brandPhone = toIndiaPhone(existing?.contact_phone ?? "");
    const admins = (process.env.BRAND_ADMIN_EMAILS ?? "")
      .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    const isAdminEmail = admins.includes((u.email ?? "").toLowerCase());
    const isOwner = !!brandPhone && !!callerPhone && brandPhone.slice(-10) === callerPhone.slice(-10);
    if (!isAdminEmail && !isOwner) {
      console.error(`[brand-settings] unauthorized update attempt on brand "${slug}" by ${u.email ?? u.phone ?? "unknown"}`);
      return;
    }

    const fields = {
      name: String(formData.get("name") ?? "").trim().slice(0, 120),
      tagline: String(formData.get("tagline") ?? "").trim().slice(0, 240),
      description: String(formData.get("description") ?? "").trim().slice(0, 2000),
      contact_email: String(formData.get("contact_email") ?? "").trim().slice(0, 120),
      contact_phone: String(formData.get("contact_phone") ?? "").trim().slice(0, 20),
    };

    const res = existing?.id != null
      ? await db(`brands?id=eq.${existing.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(fields),
        })
      : await db("brands", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ slug, ...fields }),
        });
    if (!res.ok) console.error(`[brand-settings] save failed for "${slug}": ${res.status} ${res.statusText}`);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-2xl px-6 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--brand-secondary)" }}>Brand Settings</h1>

        <form action={updateBrand} className="rounded-2xl border bg-surface p-6 space-y-4">
          <input type="hidden" name="slug" value={brand.slug} />
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Brand Name</label>
            <input name="name" defaultValue={brand.name} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Tagline</label>
            <input name="tagline" defaultValue={brand.tagline ?? ""} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Description</label>
            <textarea name="description" defaultValue={brand.description ?? ""} rows={3} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Contact Email</label>
            <input name="contact_email" defaultValue={brand.contact_email ?? ""} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Contact Phone</label>
            <input name="contact_phone" defaultValue={brand.contact_phone ?? ""} className="w-full rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-[var(--brand-secondary)]" />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-white font-semibold text-sm"
            style={{ background: "var(--brand-primary)" }}
          >
            Save Changes
          </button>
        </form>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
