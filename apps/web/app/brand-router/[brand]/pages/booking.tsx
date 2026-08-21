"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

export function BookingPage({ brand }: { brand: any }) {

  const [selectedDay, setSelectedDay] = useState(28);
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [service, setService] = useState("General Consultation");
  const [booked, setBooked] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 5, 28 + i);
    return { day: d.getDate(), name: d.toLocaleDateString('en', { weekday: 'short' }), month: d.toLocaleDateString('en', { month: 'short' }) };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-24">
        <div className="absolute inset-0 opacity-[0.03]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            Book </div>
          <h1 className="heading-xl mb-4">
            Apni <span className="gradient-text">Appointment</span> Book Karein
          </h1>
          <p className="text-lg opacity-60">Apne hisaab se date aur time chunein — doctor ghar par aayega ya video par milega</p>
        </div>
      </section>

      {/* BOOKING UI */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="md:col-span-1 rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--brand-secondary)" }}>Select Date</h3>
            <div className="grid grid-cols-7 gap-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs font-medium opacity-40 pb-1">{d}</div>
              ))}
              {days.map((d, i) => (
                <button key={i} onClick={() => setSelectedDay(d.day)} className={`text-xs py-2.5 rounded-lg transition-all ${selectedDay === d.day ? 'text-white font-bold shadow-sm' : 'hover:bg-surface-sunken'}`} style={selectedDay === d.day ? { background: "var(--brand-gradient)" } : {}}>
                  {d.day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="md:col-span-2 rounded-2xl border bg-surface p-5 shadow-sm" style={{ borderColor: "var(--hairline)" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--brand-secondary)" }}>Select Time</h3>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {TIME_SLOTS.map((t) => (
                <button key={t} onClick={() => setSelectedTime(t)} className={`text-xs py-3 rounded-xl font-medium transition-all ${selectedTime === t ? 'text-white shadow-sm' : 'border hover:border-hairline'}`} style={selectedTime === t ? { background: "var(--brand-gradient)" } : { borderColor: "var(--hairline)" }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Service */}
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--brand-secondary)" }}>Service Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {["Video Consultation", "Home Visit", "Lab Test Booking", "Follow-up"].map((s) => (
                <button key={s} onClick={() => setService(s)} className={`text-left text-sm py-3 px-4 rounded-xl transition-all ${service === s ? 'font-bold border-2' : 'border hover:border-hairline'}`} style={service === s ? { borderColor: "var(--brand-secondary)", background: "var(--brand-tint)" } : { borderColor: "var(--hairline)" }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Confirm */}
            {!booked ? (
              <button onClick={() => setBooked(true)} className="btn-primary w-full py-3.5 text-sm">
                Confirm Appointment: {selectedTime} June {selectedDay}
              </button>
            ) : (
              <div className="rounded-2xl p-6 text-center border-2 border-hairline" style={{ background: "var(--positive-tint)" }}>
                <div className="text-4xl mb-2">✅</div>
                <p className="font-bold tone-positive">Appointment Confirmed!</p>
                <p className="text-sm tone-positive mt-1">{service} · June {selectedDay}, 2026 at {selectedTime}</p>
                <p className="text-xs tone-positive mt-2">A confirmation has been sent to your phone</p>
                <button onClick={() => setBooked(false)} className="mt-4 text-xs opacity-60 hover:opacity-100">Book another →</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
