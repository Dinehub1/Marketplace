import { CategoryIcon } from "@/lib/icons";
import { categoryPath } from "@/lib/categories";

/**
 * Category tile used on the marketplace, category landing pages and the
 * homepage. Icon + name + optional count, with the shared card-lift press
 * response. Keeping it here means every category list in the app looks
 * identical.
 */
export function CategoryCard({
  category,
  count,
  primary,
  secondary,
}: {
  category: string;
  count?: number;
  primary: string;
  secondary?: string;
}) {
  const href = categoryPath(category);
  const label = category.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return (
    <a
      href={href}
      className="card-lift group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.05] shadow-[0_1px_2px_rgba(16,16,24,0.04)] hover:shadow-[0_12px_36px_-14px_rgba(16,16,24,0.18)]"
    >
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${primary}12`, color: primary }}
      >
        <CategoryIcon category={category} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-snug text-neutral-800">{label}</span>
        {count != null && (
          <span className="block text-xs text-neutral-400">{count.toLocaleString("en-IN")} listings</span>
        )}
      </span>
    </a>
  );
}
