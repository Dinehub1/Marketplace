import { BrandHeader, BrandFooter } from "../brand-header";

const DEFAULT_JOBS = [
  { title: "Customer Support Executive", type: "Full-time", location: "Indore", desc: "Help customers and resolve queries promptly with excellent communication skills.", remote: false },
  { title: "Sales Associate", type: "Full-time", location: "Remote", desc: "Drive growth through customer acquisition and relationship building.", remote: true },
  { title: "Social Media Manager", type: "Part-time", location: "Remote", desc: "Manage our social media presence and create engaging content.", remote: true },
  { title: "Full Stack Developer", type: "Full-time", location: "Indore", desc: "Build and maintain web applications using modern technologies.", remote: false },
];

const BENEFITS = [
  { icon: "🏖️", title: "Flexible Work", desc: "Work from anywhere with flexible hours" },
  { icon: "💰", title: "Competitive Pay", desc: "Top-of-market compensation and bonuses" },
  { icon: "📚", title: "Learning Budget", desc: "Annual budget for courses and conferences" },
  { icon: "🏥", title: "Health Coverage", desc: "Comprehensive health insurance for you and family" },
  { icon: "📈", title: "Growth Focus", desc: "Clear career paths and mentorship programs" },
  { icon: "🎯", title: "Impact Driven", desc: "Your work directly shapes our product" },
];

export function CareersPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";
  const jobs = (brand.careers_json ?? DEFAULT_JOBS) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-10 right-20 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full blur-3xl opacity-10 animate-float" style={{ background: `linear-gradient(135deg, ${accent}, ${primary})`, animationDelay: "2s" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            Join Our Team
          </div>
          <h1 className="heading-xl mb-4">
            Build your career at <span className="gradient-text">{brand.name}</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">We're building something looking for passionate people to join us</p>
        </div>
      </section>

      {/* CULTURE */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl border p-8 md:p-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}06, ${secondary}04)`, borderColor: `${accent}15` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-caption mb-3" style={{ color: primary }}>Our Culture</p>
              <h2 className="heading-md mb-4" style={{ color: primary }}>Where great people do their best work</h2>
              <p className="text-body leading-relaxed mb-6">We believe in transparency, ownership, and continuous growth. At {brand.name}, every voice matters and every contribution shapes our future.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white shadow-sm" style={{ color: primary }}>🌟 No micromanagement</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white shadow-sm" style={{ color: primary }}>✓ Results-focused</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white shadow-sm" style={{ color: primary }}>🤝 Collaborative</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <div key={i} className="card-lift rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: `${accent}20` }}>
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: primary }}>{b.title}</h3>
                  <p className="text-xs opacity-50">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-10">
            <p className="text-caption mb-3" style={{ color: primary }}>Open Positions</p>
            <h2 className="heading-md" style={{ color: primary }}>Find your next role</h2>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border" style={{ borderColor: `${accent}20` }}>
              <div className="text-6xl mb-4">💼</div>
              <p className="text-lg font-medium opacity-70">No open positions right now</p>
              <p className="text-sm opacity-50 mt-2">Send your resume to {brand.contact_email || "careers@" + brand.slug + ".cashcard.live"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map((job: any, i: number) => (
                <div key={i} className="card-lift group rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: `${accent}20` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2 group-hover:opacity-70 transition-opacity" style={{ color: primary }}>{job.title}</h3>
                      <p className="text-sm opacity-60 leading-relaxed mb-4">{job.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${primary}12`, color: primary }}>📋 {job.type}</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100">📍 {job.location}</span>
                        {job.remote && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">🏠 Remote OK</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: `${accent}15` }}>
                    {job.salary && <span className="text-sm font-medium" style={{ color: primary }}>{job.salary}</span>}
                    <a href={`/contact?job=${encodeURIComponent(job.title)}`} className="btn-primary text-xs py-2 px-4">Apply Now →</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Didn't find your role?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">We're always looking for talented people. Send us your resume and we'll keep you in mind.</p>
              <a href={`mailto:${brand.contact_email || brand.slug + ".cashcard.live"}`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg inline-block" style={{ color: primary }}>
                Send Your Resume →
              </a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
