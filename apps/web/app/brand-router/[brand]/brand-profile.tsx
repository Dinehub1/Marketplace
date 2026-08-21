import { BrandHeader, BrandFooter } from "./brand-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function BrandProfile({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const bg = theme.bg ?? "#f9fafb";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login`);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <main className="flex-1 mx-auto max-w-2xl px-6 py-8 w-full">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--brand-secondary)" }}>Your Profile</h1>

        <div className="rounded-2xl border bg-surface p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium opacity-50">Email</label>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50">User ID</label>
            <p className="text-xs font-mono opacity-40">{user.id}</p>
          </div>
          <div>
            <label className="block text-xs font-medium opacity-50">Joined</label>
            <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </main>
      <BrandFooter brand={brand} />
    </div>
  );
}
