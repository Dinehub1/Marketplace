import { BrandHeader, BrandFooter } from "./brand-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function BrandSettings({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const bg = theme.bg ?? "#f9fafb";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`https://${brand.slug}.cashcard.live/login`);

  async function updateBrand(formData: FormData) {
    "use server";
    const s = await createClient();
    await s.from("brands").upsert({
      slug: brand.slug,
      name: formData.get("name") as string,
      tagline: formData.get("tagline") as string,
      description: formData.get("description") as string,
      contact_email: formData.get("contact_email") as string,
      contact_phone: formData.get("contact_phone") as string,
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-2xl px-6 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6" style={{ color: primary }}>Brand Settings</h1>

        <form action={updateBrand} className="rounded-2xl border bg-white p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Brand Name</label>
            <input name="name" defaultValue={brand.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Tagline</label>
            <input name="tagline" defaultValue={brand.tagline ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Description</label>
            <textarea name="description" defaultValue={brand.description ?? ""} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Contact Email</label>
            <input name="contact_email" defaultValue={brand.contact_email ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50 mb-1">Contact Phone</label>
            <input name="contact_phone" defaultValue={brand.contact_phone ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500" />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-white font-semibold text-sm"
            style={{ backgroundColor: primary }}
          >
            Save Changes
          </button>
        </form>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
