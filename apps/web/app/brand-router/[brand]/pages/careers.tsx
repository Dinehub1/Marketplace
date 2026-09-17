import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { JobOpening } from "@/lib/brand-content";

const DEFAULT_JOBS: JobOpening[] = [
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

export function CareersPage({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const jobs = (brand.careers_json ?? DEFAULT_JOBS);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            Join Our Team
          </div>
          <h1 className="heading-xl mb-4">
            Build your career at <span className="gradient-text">{brand.name}</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">We&apos;re building something looking for passionate people to join us</p>
        </div>
      </section>

      {/* CULTURE */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl border p-8 md:p-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}06, ${secondary}04)`, borderColor: "var(--hairline)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>Our Culture</p>
              <h2 className="heading-md mb-4" style={{ color: "var(--brand-secondary)" }}>Where great people do their best work</h2>
              <p className="text-body leading-relaxed mb-6">We believe in transparency, ownership, and continuous growth. At {brand.name}, every voice matters and every contribution shapes our future.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface shadow-sm" style={{ color: "var(--brand-secondary)" }}>🌟 No micromanagement</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface shadow-sm" style={{ color: "var(--brand-secondary)" }}>✓ Results-focused</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface shadow-sm" style={{ color: "var(--brand-secondary)" }}>🤝 Collaborative</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <div key={i} className="card-lift rounded-2xl border bg-surface p-4 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
                  <div className="text-2xl mb-2">{b.icon}</div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "var(--brand-secondary)" }}>{b.title}</h3>
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
            <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>Open Positions</p>
            <h2 className="heading-md" style={{ color: "var(--brand-secondary)" }}>Find your next role</h2>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-6xl mb-4">💼</div>
              <p className="text-lg font-medium opacity-70">No open positions right now</p>
              <p className="text-sm opacity-50 mt-2">Send your resume to {brand.contact_email || "careers@" + brand.slug + ".cashcard.live"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map((job, i: number) => (
                <div key={i} className="card-lift group rounded-2xl border bg-surface p-6 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2 group-hover:opacity-70 transition-opacity" style={{ color: "var(--brand-secondary)" }}>{job.title}</h3>
                      <p className="text-sm opacity-60 leading-relaxed mb-4">{job.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "var(--brand-tint)", color: "var(--brand-secondary)" }}>📋 {job.type}</span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-sunken">📍 {job.location}</span>
                        {job.remote && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--positive-tint)] tone-positive">🏠 Remote OK</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--hairline)" }}>
                    {job.salary && <span className="text-sm font-medium" style={{ color: "var(--brand-secondary)" }}>{job.salary}</span>}
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
          <div className="rounded-3xl p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Didn&apos;t find your role?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">We&apos;re always looking for talented people. Send us your resume and we&apos;ll keep you in mind.</p>
              <a href={`mailto:${brand.contact_email || brand.slug + ".cashcard.live"}`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg inline-block" style={{ color: "var(--brand-secondary)" }}>
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
