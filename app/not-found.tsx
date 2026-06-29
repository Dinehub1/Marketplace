import Link from "next/link";
import { getBrandFromHost } from "@/lib/brands";
import { BrandLanding } from "./brand-router/[brand]/brand-landing";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  // On a brand subdomain with no static site folder yet, fall back to the
  // database-driven landing page instead of a bare 404.
  const brand = await getBrandFromHost();
  if (brand) {
    return <BrandLanding brand={brand} />;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-3 text-neutral-500">This page doesn&apos;t exist.</p>
      <Link
        href="/admin"
        className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        ← Back to dashboard
      </Link>
    </main>
  );
}
