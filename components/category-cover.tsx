import { slugifyCategory } from "@/lib/categories";

const R2 = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

/**
 * Cover image for a listing/category card. Source is a per-category stock photo
 * hosted in R2 (categories/<slug>.jpg). If the photo is missing or fails to
 * load, the gradient underneath shows through — so a card is never broken.
 */
export function CategoryCover({
  category,
  primary = "#6d28d9",
  secondary = "#8b5cf6",
  className = "",
}: {
  category?: string | null;
  primary?: string;
  secondary?: string;
  className?: string;
}) {
  const slug = category ? slugifyCategory(category) : "";
  const src = slug ? `${R2}/categories/${slug}.jpg` : "";
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        backgroundColor: `${primary}1a`,
        backgroundImage: src
          ? `url(${src}), linear-gradient(135deg, ${primary}, ${secondary})`
          : `linear-gradient(135deg, ${primary}, ${secondary})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}
