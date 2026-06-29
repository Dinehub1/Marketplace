"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* ── Reveal on scroll wrapper ── */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${delay ? `reveal-delay-${delay}` : ""} ${className}`}>{children}</div>;
}

/* ── Animated counter ── */
export function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const dur = 2000;
        const step = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / dur, 1);
          setVal(Math.floor(p * end));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Section heading ── */
export function SectionHeading({ label, title, subtitle, center = true, theme }: { label?: string; title: string; subtitle?: string; center?: boolean; theme?: any }) {
  const primary = theme?.primary ?? "#6d28d9";
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""} mb-12 md:mb-16`}>
      {label && <p className="text-caption mb-3" style={{ color: primary }}>{label}</p>}
      <h2 className="heading-lg mb-4" style={{ color: primary }}>{title}</h2>
      {subtitle && <p className="text-body max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}

/* ── Feature card ── */
export function FeatureCard({ icon, title, desc, theme, i = 0 }: { icon: string; title: string; desc: string; theme?: any; i?: number }) {
  const primary = theme?.primary ?? "#6d28d9";
  const secondary = theme?.secondary ?? "#8b5cf6";
  const accent = theme?.accent ?? "#c4b5fd";
  return (
    <Reveal delay={i % 3}>
      <div className="card-lift rounded-2xl border bg-white p-6 h-full" style={{ borderColor: `${accent}30` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>{icon}</div>
        <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{title}</h3>
        <p className="text-sm opacity-60 leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ── Stat card ── */
export function StatCard({ value, label, theme }: { value: string; label: string; theme?: any }) {
  const primary = theme?.primary ?? "#6d28d9";
  const accent = theme?.accent ?? "#c4b5fd";
  return (
    <div className="text-center rounded-2xl border p-6 bg-white" style={{ borderColor: `${accent}30` }}>
      <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: primary }}>{value}</div>
      <div className="text-sm opacity-50">{label}</div>
    </div>
  );
}

/* ── Testimonial card ── */
export function TestimonialCard({ name, text, rating, role, theme, i = 0 }: { name: string; text: string; rating?: number; role?: string; theme?: any; i?: number }) {
  const primary = theme?.primary ?? "#6d28d9";
  const accent = theme?.accent ?? "#c4b5fd";
  return (
    <Reveal delay={i % 3}>
      <div className="card-lift rounded-2xl border bg-white p-6 h-full flex flex-col" style={{ borderColor: `${accent}30` }}>
        <div className="flex items-center gap-1 mb-4">{[1,2,3,4,5].map((s) => <span key={s} className={s <= (rating ?? 5) ? "text-amber-400" : "text-gray-200"}>★</span>)}</div>
        <p className="text-sm opacity-70 italic leading-relaxed flex-1">"{text}"</p>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: `${accent}20` }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>{name.charAt(0)}</div>
          <div><p className="font-semibold text-sm">{name}</p>{role && <p className="text-xs opacity-50">{role}</p>}</div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Pricing card ── */
export function PricingCard({ name, price, period, features, highlighted, theme, cta }: { name: string; price: string; period?: string; features: string[]; highlighted?: boolean; theme?: any; cta?: string }) {
  const primary = theme?.primary ?? "#6d28d9";
  const secondary = theme?.secondary ?? "#8b5cf6";
  return (
    <div className={`card-lift rounded-2xl p-6 flex flex-col ${highlighted ? "scale-105 shadow-2xl" : "shadow-sm"}`} style={highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { border: `1px solid ${(theme?.accent ?? "#c4b5fd")}30` }}>
      {highlighted && <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">Most Popular</div>}
      <h3 className={`text-xl font-bold mb-1 ${highlighted ? "text-white" : ""}`} style={!highlighted ? { color: primary } : {}}>{name}</h3>
      <div className="mb-4">
        <span className={`text-4xl font-extrabold ${highlighted ? "text-white" : ""}`} style={!highlighted ? { color: primary } : {}}>{price}</span>
        {period && <span className={`text-sm ${highlighted ? "text-white/70" : "opacity-50"}`}>{period}</span>}
      </div>
      <ul className="space-y-3 mb-6 flex-1">
        {features.map((f, j) => (
          <li key={j} className={`flex items-center gap-2 text-sm ${highlighted ? "text-white/90" : "opacity-70"}`}>
            <span className={highlighted ? "text-white" : ""} style={!highlighted ? { color: primary } : {}}>✓</span> {f}
          </li>
        ))}
      </ul>
      <a href="#" className={`block text-center rounded-xl py-3 text-sm font-bold transition-all hover:translate-y-[-2px] ${highlighted ? "bg-white" : "text-white"}`} style={!highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { color: primary }}>
        {cta ?? "Get Started"}
      </a>
    </div>
  );
}

/* ── FAQ accordion ── */
export function FAQItem({ q, a, theme, i }: { q: string; a: string; theme?: any; i: number }) {
  const [open, setOpen] = useState(false);
  const primary = theme?.primary ?? "#6d28d9";
  const accent = theme?.accent ?? "#c4b5fd";
  return (
    <Reveal delay={i % 4}>
      <div className="rounded-xl border overflow-hidden transition-all" style={{ borderColor: open ? primary : `${accent}30`, boxShadow: open ? `0 4px 20px -5px ${primary}20` : "none" }}>
        <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-sm" style={{ color: primary }}>
          {q}
          <span className={`text-xl transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-96" : "max-h-0"}`}>
          <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed border-t pt-3" style={{ borderColor: `${accent}20` }}>{a}</div>
        </div>
      </div>
    </Reveal>
  );
}

/* ── Breadcrumb ── */
export function Breadcrumb({ items, theme }: { items: { label: string; href?: string }[]; theme?: any }) {
  const primary = theme?.primary ?? "#6d28d9";
  return (
    <nav className="flex items-center gap-2 text-xs opacity-60 mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {item.href ? <a href={item.href} className="hover:opacity-100" style={{ color: primary }}>{item.label}</a> : <span>{item.label}</span>}
          {i < items.length - 1 && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}
