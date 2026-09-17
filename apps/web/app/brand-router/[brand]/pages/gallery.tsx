import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { GalleryItem } from "@/lib/brand-content";

const DEFAULT_GALLERY: GalleryItem[] = [
  { title: "Project Alpha", emoji: "🏗️" }, { title: "Workspace", emoji: "🏢" },
  { title: "Team Event", emoji: "🎉" }, { title: "Product Launch", emoji: "🚀" },
  { title: "Client Meet", emoji: "🤝" }, { title: "Office Tour", emoji: "🏛️" },
  { title: "Award Ceremony", emoji: "🏆" }, { title: "Innovation Lab", emoji: "🔬" },
];

export function GalleryPage({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const gallery = (brand.gallery_json ?? DEFAULT_GALLERY);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            Our Gallery
          </div>
          <h1 className="heading-xl mb-4">
            See us <span className="gradient-text">in action</span>
          </h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">A visual journey through our work, team, and milestones</p>
        </div>
      </section>

      {/* MASONRY GRID */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {gallery.map((item, i: number) => {
            const isLarge = i % 5 === 0;
            return (
              <div
                key={i}
                className="group relative break-inside-avoid rounded-2xl overflow-hidden card-lift border bg-surface shadow-sm"
                style={{ borderColor: "var(--hairline)", height: isLarge ? "320px" : "220px" }}
              >
                {item.img ? (
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}${12 + (i % 4) * 3}, ${secondary}${8 + (i % 3) * 2})` }}>
                    <span className="text-6xl group-hover:scale-125 transition-transform duration-500">{item.emoji ?? "🖼️"}</span>
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                  <div className="text-white">
                    <p className="font-bold text-sm">{item.title}</p>
                    {item.category && <p className="text-xs opacity-70 mt-0.5">{item.category}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Want to be part of our story?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">Join the families who trust {brand.name} for their needs</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`/contact`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: "var(--brand-secondary)" }}>Get in Touch →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
