"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

const STEPS = [1, 2, 3, 4];

export function QuotePage({ brand }: { brand: any }) {

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-16 md:py-20">
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
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'text-white shadow-sm' : 'border opacity-40'}`} style={step >= s ? { background: "var(--brand-gradient)" } : { borderColor: "var(--hairline)" }}>
                {step > s ? "✓" : s}
              </div>
              {s < 4 && <div className="w-12 md:w-20 h-1 rounded-full overflow-hidden bg-surface-sunken"><div className="h-full rounded-full transition-all duration-500" style={{ width: step > s ? "100%" : "0%", background: "var(--brand-gradient)" }} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* FORM STEPS */}
      <section className="mx-auto max-w-2xl px-6 pb-16">
        <div className="rounded-3xl border bg-surface p-6 md:p-8 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
          {!submitted ? (
            <>
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "var(--brand-secondary)" }}>Your Details</h2>
                  <p className="text-sm opacity-50 mb-6">Let's start with your contact information</p>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium opacity-70 mb-1">Full Name</label><input type="text" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2" style={{ borderColor: "var(--hairline)" }} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium opacity-70 mb-1">Email</label><input type="email" className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2" style={{ borderColor: "var(--hairline)" }} /></div>
                      <div><label className="block text-sm font-medium opacity-70 mb-1">Phone</label><input type="tel" className="w-full rounded-xl border px-4 py-3 text-sm outline-none" style={{ borderColor: "var(--hairline)" }} /></div>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "var(--brand-secondary)" }}>Service Needed</h2>
                  <p className="text-sm opacity-50 mb-6">What do you need help with?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["General Inquiry", "Bulk Order", "Custom Solution", "Partnership"].map((s) => (
                      <button key={s} onClick={() => setStep(3)} className="text-left py-4 px-5 rounded-xl border hover:border-hairline transition-all" style={{ borderColor: "var(--hairline)" }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "var(--brand-secondary)" }}>Budget Range</h2>
                  <p className="text-sm opacity-50 mb-6">What's your budget range?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Under ₹5,000", "₹5,000 - ₹25,000", "₹25,000 - ₹1,00,000", "Above ₹1,00,000"].map((b) => (
                      <button key={b} onClick={() => setStep(4)} className="text-left py-4 px-5 rounded-xl border transition-all" style={{ borderColor: "var(--hairline)" }}>{b}</button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: "var(--brand-secondary)" }}>Details</h2>
                  <p className="text-sm opacity-50 mb-6">Tell us more about your requirements</p>
                  <textarea rows={5} placeholder="Describe your project, timeline, and any specific needs..." className="w-full rounded-xl border px-4 py-3 text-sm outline-none resize-none" style={{ borderColor: "var(--hairline)" }} />
                </div>
              )}

              <div className="flex justify-between items-center mt-6 pt-5 border-t" style={{ borderColor: "var(--hairline)" }}>
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
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-secondary)" }}>Quote Request Submitted!</h2>
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
