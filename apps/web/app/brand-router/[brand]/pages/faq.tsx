"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { ByBrandSlug, FaqItem } from "@/lib/brand-content";

const BRAND_FAQ: ByBrandSlug<FaqItem> = {
  sarkarhealth: [
      { q: "How do I book a video consultation?", a: "Go to the app or website, choose a doctor, pick a time slot, and pay via UPI. You'll receive a link — click it to start your consultation." },
      { q: "Are the medicines genuine?", a: "100%! We source only from licensed chemists and authorized distributors. You can verify the batch number and expiry of every medicine." },
      { q: "How does the lab test work?", a: "A technician visits your home to collect the sample. Reports are available online within 24-48 hours." },
      { q: "Is help available in emergencies?", a: "Yes! We have a 24/7 helpline — you can also book an ambulance. Information about the nearest hospital is also provided." },
      { q: "Who are the doctors?", a: "All are MBBS/MD/BAMS doctors — verified, experienced, and registered practitioners." },
      { q: "Is my health data secure?", a: "Absolutely. It's end-to-end encrypted — only you and your doctor can view it." },
      { q: "How do I order medicine and how long does delivery take?", a: "Upload your doctor's prescription, choose generic or branded medicine, and confirm your address. Express delivery takes 2-4 hours; standard takes up to 24 hours." },
      { q: "How do I book a lab test?", a: "Choose a test in the app, book a time slot, and a technician visits your home. The report is sent to you via email or WhatsApp as a secure PDF." },
      { q: "How can I access my medical records?", a: "All your reports, prescriptions, and consultation history are stored securely in the 'My Health' section of the app. You can also share them with your doctor." },
      { q: "How do I get my prescription or follow-up after a consultation?", a: "After a video consultation, your prescription is shared in the chat as a PDF. You can book a follow-up appointment via video call." }
    ],
  sarkardost: [
    { q: "How do I create a listing?", a: "Sign up with your mobile number, fill in your business details, and submit — you're live in 5 minutes!" },
    { q: "Is listing free?", a: "Yes! Basic listing is completely free. Paid plans are available for premium features." },
    { q: "How will I get customers?", a: "When someone searches in your category, your listing appears — they contact you via WhatsApp or call." },
    { q: "Can I edit my listing?", a: "Absolutely! Update your listing anytime from the dashboard — photos, timings, prices." },
    { q: "How do I improve my ranking?", a: "Collect reviews, complete your profile, and stay active regularly — our algorithm ranks you higher." },
  ],
  followup: [
    { q: "How do I set a reminder?", a: "Add a task in the app, set a date/time, and choose a channel — WhatsApp, SMS, or Email." },
    { q: "Can I send automated messages?", a: "Yes! Our AI learns your typing patterns and sends automated follow-up messages." },
    { q: "How do I add team members?", a: "On the Business plan, you can add up to 5 team members — assign and track tasks." },
  ],
  cloudplayer: [
      { q: "Is offline download available?", a: "Yes! On the Premium plan, you can download content and watch without the internet." },
      { q: "How many devices can use it?", a: "The Family plan supports 5 devices — each can watch different content simultaneously." },
      { q: "Does it work on Smart TV?", a: "Absolutely! Cloud Player is available on Android TV, Fire Stick, and Samsung TV." },
      { q: "Is 4K HDR streaming available?", a: "Yes! The Premium plan supports 4K HDR, Dolby Vision, and Dolby Atmos for a cinema-grade experience." },
      { q: "How much data does streaming use?", a: "Adaptive bitrate technology adjusts to your connection — about 7-10 GB/hour for 4K and ~3 GB/hour for 1080p." },
      { q: "Is streaming available for live events too?", a: "Yes! You can stream sports, concerts, and live events in real time with minimal latency." },
    ],
  paisaflow: [
    { q: "What is the minimum to start investing?", a: "You can start from ₹100 — SIP, FD, and mutual fund options are all available." },
    { q: "Is there risk analysis?", a: "Yes! Our AI suggests a portfolio based on your risk profile — from safe to aggressive." },
    { q: "What if I want to withdraw money?", a: "You can withdraw anytime — funds reach your bank account within T+1." },
    { q: "What returns can I expect on PaisaFlow?", a: "Returns depend on market conditions — 12-15% p.a. for mutual funds, 7-8% p.a. for FDs, and higher potential (with risk) for stocks." },
    { q: "What tax-saving options does PaisaFlow offer?", a: "ELSS mutual funds offer tax savings of up to ₹1.5 lakh under Section 80C, and tax-free bonds are also available." },
    { q: "How long does KYC take?", a: "Just 2 minutes — e-KYC is completed using Aadhaar and PAN, with no paperwork." },
  ],
  yaadrakh: [
    { q: "How are AI notes created?", a: "You speak or type — the AI understands and creates organized notes." },
    { q: "Is there cross-device sync?", a: "Yes! Your notes are synchronized across phone, tablet, and laptop." },
    { q: "Is my data secure?", a: "Absolutely — end-to-end encrypted. Your data is yours alone." },
    { q: "How do I create notes by voice in YaadRakh?", a: "Right! You can speak — the AI uses real-time speech-to-text to prepare notes, then organizes them." },
    { q: "Are my notes shared with any third party?", a: "No! Your notes stay with you — protected by end-to-end encryption, no third party can access them." },
    { q: "Can I access notes in offline mode?", a: "Yes! Your notes sync across all devices, and you can access the most recently synced notes offline." },
    { q: "How do smart reminders work?", a: "YaadRakh's AI understands your notes — if you write 'meeting tomorrow at 10', it sets a reminder accordingly and also provides context-based reminders." },
  ],
  "sarkar-ai": [
    { q: "How many languages does the AI understand?", a: "Hindi, English, and 10+ Indian languages — talk in your own language." },
    { q: "How do I get API access?", a: "API access is available on the Pro plan — documentation and SDK are provided." },
    { q: "Is my business data safe?", a: "Yes! Your data is not used for training — we take a privacy-first approach." },
  ],
  sarkarfood: [
    { q: "What is the delivery time?", a: "Guaranteed within 30 minutes — if late, you get a free delivery coupon." },
    { q: "Is cash on delivery available?", a: "Yes! Cash on delivery is available at all restaurants." },
    { q: "What does the Premium plan offer?", a: "Free delivery, special offers, and 10% cashback on every order." },
  ],
  sarkarfinance: [
    { q: "How long does loan approval take?", a: "Within 10 minutes — instant approval through AI-based verification." },
    { q: "What documents are required?", a: "Just Aadhaar and PAN — you won't be asked repeatedly." },
    { q: "How do I pay the EMI?", a: "Via auto-debit — set up a NACH mandate and it deducts automatically every month." },
  ],
  sarkarpay: [
    { q: "What is the settlement time?", a: "T+0 — today's sales land in your bank account the same day." },
    { q: "Are international payments accepted?", a: "Yes! On the Business plan, you can also accept international cards." },
    { q: "How are chargebacks handled?", a: "Track them from the dashboard — automated dispute resolution is available." },
  ],
  sarkarmart: [
    { q: "When is delivery completed?", a: "Within 24 hours in Indore — free delivery on orders of ₹499 and above." },
    { q: "What is the return policy?", a: "Return within 7 days — full refund, no questions asked." },
    { q: "How do I get cashback?", a: "5-20% cashback on every purchase — credited directly to your wallet." },
  ],
  sarkarlegal: [
    { q: "Is the first consultation free?", a: "Yes! The first 15-minute consultation is completely free." },
    { q: "How does online consultation work?", a: "Over a video call — you connect via WhatsApp or Zoom." },
    { q: "Is court representation available?", a: "On the Pro plan, experienced lawyers represent you in court." },
  ],
  "justdial-agent": [
    { q: "How does data analytics work?", a: "We analyze market trends, customer behavior, and competition data — giving you actionable insights." },
    { q: "What is included in lead generation?", a: "Verified customer contacts, demand analysis, and targeted outreach — reaching only those who are genuinely interested." },
    { q: "Can it be managed from mobile?", a: "Absolutely! The entire dashboard is mobile-friendly — monitor your business anytime, anywhere." },
  ],
  sarkarmarketplace: [
    { q: "How do I list my business?", a: "Sign up for free — fill in your business details and you're instantly live." },
    { q: "Is verification done?", a: "Yes! We verify every business — GST and address checks." },
    { q: "How do I get leads?", a: "When someone searches your category, your contact details appear." },
  ],
  ayurvedicwebsite: [
    { q: "Are the products genuine?", a: "100%! AYUSH certified — you can verify batch numbers and expiry." },
    { q: "Is the Vaidya consultation free?", a: "Yes! Free 15-minute consultation — remedies tailored to your constitution (prakriti)." },
    { q: "What are the shipping charges?", a: "Free shipping on orders of ₹499 and above — delivered in 3-5 days." },
  ],
  sarkarghar: [
    { q: "How do I view the virtual tour?", a: "Click the 'Virtual Tour' button on the property page — a 360° walkthrough." },
    { q: "Is a loan facility available?", a: "Yes! 15+ bank partners — support from application to approval." },
    { q: "Are the listings verified?", a: "All listings are verified — owner documents are checked." },
  ],
  sarkarskills: [
    { q: "Do I get a certificate?", a: "Yes! You receive a government-recognized certificate upon course completion." },
    { q: "Is placement assistance provided?", a: "Yes! 60% of students get placed — through tie-ups with 100+ companies." },
    { q: "Is there an installment option?", a: "Yes! Starting at ₹500/month — education loans are also available." },
  ],
  "hyperframes-realestate": [
    { q: "How do I create a video tour?", a: "Our professional team shoots a 4K video of your property — with a 360° walkthrough." },
    { q: "Can NRI users also use it?", a: "Absolutely! View properties remotely via video tour and close deals through virtual meetings." },
    { q: "How does price analytics work?", a: "You get a fair price estimate based on recent local transactions, market trends, and demand-supply analysis." },
  ],
  sikshahub: [
    { q: "Is the CBSE board covered?", a: "Yes! CBSE, ICSE, and MP Board — from class 1 to 12." },
    { q: "Are there live classes?", a: "Yes! Weekly live sessions — you can ask the teacher directly." },
    { q: "Do I get a progress report?", a: "Yes! A monthly report for parents — including weak areas." },
  ],
  sarkartravel: [
    { q: "How do I get the best rates?", a: "Compare across 100+ airlines and hotels — lowest price guaranteed." },
    { q: "Is cancellation flexible?", a: "Yes! Free cancellation up to 24 hours — full refund." },
    { q: "Is travel insurance included?", a: "Free travel insurance on the Premium plan — covering medical and trip disruptions." },
  ],
  sarkardukaan: [
    { q: "How do I create a store?", a: "Sign up, add products, and set up a payment link — you're live in 10 minutes!" },
    { q: "How do I manage delivery?", a: "Use our delivery network — or deliver on your own." },
    { q: "Do I get a custom domain?", a: "Yes, on the Pro plan — your own name, your own brand, your own store." },
  ],
  sarkarbazaar: [
    { q: "How do I start exporting?", a: "Join the Bazaar export program — connect with international buyers." },
    { q: "How do B2B orders come in?", a: "List wholesale — bulk buyers contact you directly." },
    { q: "Is payment secure?", a: "Yes! An escrow system — payment is released only after the buyer confirms." },
  ],
  sarkarjobs: [
    { q: "How do I create a profile?", a: "Sign up — fill in your education, experience, and skills — ready in 5 minutes!" },
    { q: "Are companies verified?", a: "Yes! All companies are GST verified — no fraud." },
    { q: "Is there a resume builder?", a: "Yes! Professional templates — with one-click apply." },
  ],
  sarkared: [
    { q: "Which courses are available?", a: "Digital Marketing, AI, Web Development, Data Science — industry-ready skills." },
    { q: "Is there a job guarantee?", a: "70% placement rate — with 100+ hiring partners." },
    { q: "How long are the courses?", a: "4-12 weeks — self-paced, with lifetime access." },
  ],
  sarkarsarkar: [
    { q: "What services are available?", a: "Aadhaar, PAN, Passport, Ration Card, Driving License — all in one place." },
    { q: "How do I apply?", a: "Fill the form, upload documents — we'll handle the rest." },
    { q: "How do I check the status?", a: "Live tracking from the dashboard — with SMS and email alerts." },
  ],
  sarkarwellness: [
    { q: "What is Panchakarma?", a: "An Ayurvedic detox therapy — 5 steps, natural healing, no side effects." },
    { q: "Are yoga classes online?", a: "Yes! Daily live classes — from beginner to advanced level." },
    { q: "Do I get a diet plan?", a: "Yes! The Vaidya provides a customized diet plan based on your constitution (prakriti)." },
  ],
};

const DEFAULT_FAQ: FaqItem[] = [
  { q: "How do I get started?", a: "Simply sign up and you can start using our services immediately. The process takes less than 2 minutes." },
  { q: "Is there a free plan?", a: "Yes! We offer a free tier with basic features. You can upgrade anytime for more advanced capabilities." },
  { q: "How do I contact support?", a: "You can reach us via email, WhatsApp, or the contact form. Our team responds within 24 hours." },
  { q: "Can I cancel anytime?", a: "Absolutely. No long-term contracts. Cancel anytime from your settings without any penalties." },
  { q: "Is my data secure?", a: "Yes, we use industry-standard encryption and follow best practices to keep your data safe at all times." },
  { q: "Do you offer custom solutions?", a: "Yes! For enterprise customers, we offer custom integrations and dedicated support. Contact us to learn more." },
];

export function FAQPage({ brand }: { brand: Brand }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const accent = t.accent ?? "#c4b5fd";
  const faqs = BRAND_FAQ[brand.slug] ?? (brand.faq_json ?? DEFAULT_FAQ);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: "var(--brand-gradient)" }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>FAQ</div>
          <h1 className="heading-xl mb-6"><span style={{ color: "var(--brand-secondary)" }}>Frequently asked questions</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">Answers to some common questions about SarkarHealth</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, i: number) => (
            <div key={i} className="rounded-xl border overflow-hidden transition-all duration-300" style={{ borderColor: open === i ? primary : `${accent}30`, boxShadow: open === i ? `0 4px 20px -5px ${primary}20` : "none" }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-sm" style={{ color: "var(--brand-secondary)" }}>
                {faq.q}
                <span className="text-xl transition-transform duration-300" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-96" : "max-h-0"}`}>
                <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed border-t pt-3" style={{ borderColor: "var(--hairline)" }}>{faq.a}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center rounded-2xl p-8" style={{ background: "var(--brand-tint)" }}>
           <p className="opacity-70 mb-2">More questions? Talk to our doctor.</p>
          <a href={`/contact`} className="font-bold" style={{ color: "var(--brand-secondary)" }}>Contact us →</a>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
