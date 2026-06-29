"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

const STEPS = [1, 2, 3, 4];

export function QuotePage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
        <div className="absolute top-10 right-20 w-72 h-72 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="heading-xl mb-4">Get a <span className="gradient-text">custom quote</span></h1>
          <p className="text-lg opacity-60">Tell us about your requirements and we'll prepare a personalized quote</p>
        </div>
      </section>

      {/* PROGRESS BAR */}
      <section className="mx-auto max-w-2xl px-6 pb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'text-white shadow-sm' : 'border opacity-40'}`} style={step >= s ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { borderColor: `${accent}30` }}>
                {step > s ? "✓" : s}
              </div>
              {s < 4 && <div className="w-12 md:w-20 h-1 rounded-full overflow-hidden bg-gray-100"><div className="h-full rounded-full transition-all duration-500" style={{ width: step > s ? "100%" : "0%", background: `linear-gradient(135deg, ${primary}, ${secondary})` }} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* FORM STEPS */}
      <section className="mx-auto max-w-2xl px-6 pb-16">
        <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm" style={{ borderColor: `${accent}20` }}>
          {!submitted ? (
            <>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: primary }}>Your Details</h2>
                  <p className="text-sm opacity-50 mb-6">Let's start with your contact information</p>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium opacity-70 mb-1">Full Name</label><input type="text" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2" style={{ borderColor: `${accent}50` }} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium opacity-70 mb-1">Email</label><input type="email" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2" style={{ borderColor: `${accent}50` }} /></div>
                      <div><label className="block text-sm font-medium opacity-70 mb-1">Phone</label><input type="tel" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: `${accent}50` }} /></div>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: primary }}>Service Needed</h2>
                  <p className="text-sm opacity-50 mb-6">What do you need help with?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["General Inquiry", "Bulk Order", "Custom Solution", "Partnership"].map((s) => (
                      <button key={s} onClick={() => setStep(3)} className="text-left py-4 px-5 rounded-xl border hover:border-gray-300 transition-all" style={{ borderColor: `${accent}30` }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: primary }}>Budget Range</h2>
                  <p className="text-sm opacity-50 mb-6">What's your budget range?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Under ₹5,000", "₹5,000 - ₹25,000", "₹25,000 - ₹1,00,000", "Above ₹1,00,000"].map((b) => (
                      <button key={b} onClick={() => setStep(4)} className="text-left py-4 px-5 rounded-xl border transition-all" style={{ borderColor: `${accent}30` }}>{b}</button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: primary }}>Details</h2>
                  <p className="text-sm opacity-50 mb-6">Tell us more about your requirements</p>
                  <textarea rows={5} placeholder="Describe your project, timeline, and any specific needs..." className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: `${accent}50` }} />
                </div>
              )}

              <div className="flex justify-between items-center mt-6 pt-5 border-t" style={{ borderColor: `${accent}15` }}>
                {step > 1 ? <button onClick={() => setStep(step - 1)} className="text-sm font-medium opacity-60 hover:opacity-100">← Back</button> : <div />}
                {step < 4 ? (
                  <button onClick={() => setStep(step + 1)} className="btn-primary text-sm">Continue →</button>
                ) : (
                  <button onClick={() => setSubmitted(true)} className="btn-primary text-sm">Submit Quote Request</button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb--scale-in">🎉</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: primary }}>Quote Request Submitted!</h2>
              <p className="opacity-60 mb-2">We've received your request and will prepare your custom quote within 24 hours.</p>
              <p className="text-sm opacity-40">Confirmation sent to your email</p>
              <button onClick={() => { setSubmitted(false); setStep(1); }} className="btn-secondary text-sm mt-6">Submit Another Request</button>
            </div>
          )}
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
