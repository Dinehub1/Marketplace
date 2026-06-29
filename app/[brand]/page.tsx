import { notFound } from "next/navigation";
import { getBrand } from "@/lib/brands";

export const dynamic = "force-dynamic";

/**
 * Legacy brand page — kept for direct navigation.
 * The middleware handles all *.cashcard.live host-based routing.
 * This route is a fallback for non-host-based access.
 */
export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: raw } = await params;
  const slug = raw.toLowerCase();
  const brand = await getBrand(slug);
  if (!brand) notFound();

  // Redirect to the canonical subdomain URL
  const target = brand.domain ?? `https://${brand.slug}.cashcard.live`;
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{brand.name}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Visit <a href={target} className="text-violet-600 underline">{target}</a>
        </p>
      </div>
    </main>
  );
}
