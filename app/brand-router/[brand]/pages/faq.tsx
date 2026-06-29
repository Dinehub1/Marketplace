"use client";
import { useState } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  sarkarhealth: [
      { q: "Video consultation kaise book karein?", a: "App ya Website par jaayein, doctor choose karein, samay choose karein aur UPI se payment karein. Link mil jayega — click karein aur consult karein." },
      { q: "Kya dawai asli hoti hai?", a: "100%! Hum sirf licensed chemists aur authorized distributors se lete hain. Har dawai ka batch number aur expiry check kar sakte hain." },
      { q: "Lab test kaise hota hai?", a: "Aapke ghar se technician aata hai — sample collect karta hai. Report 24-48 ghanton mein online aa jaati hai." },
      { q: "Kya emergency mein madad milti hai?", a: "Haan! 24/7 helpline — ambulance bhi book kar sakte hain. Nearest hospital ki bhi jaankari milti hai." },
      { q: "Doctor kaun hain?", a: "Sabhi MBBS/MD/BAMS doctors — verified, experienced aur registered practitioners." },
      { q: "Kya mera health data secure hai?", a: "Bilkul. End-to-end encrypted — sirf aap aur aapka doctor dekh sakte hain." },
      { q: "Dawai ka order kaise karein aur delivery kitni li?", a: "Doctor ki prescription upload karein, generic ya brand choose karein, address confirm karein. Express delivery mein 2-4 ghante, standard mein 24 ghante tak." },
      { q: "Lab test kaise book karein?", a: "App se test choose karein, time slot book karein, technician ghar aata hai. Report secure PDF mein email/WhatsApp par milta hai." },
      { q: "Mere medical records kaise access kar sakta hoon?", a: "App ke 'My Health' section mein sab reports, prescriptions aur consult history secure storage mein hai. Doctor ko share karne ka option bhi hai." },
      { q: "Consultation baad prescription ya follow-up kaise milega?", a: "Video consult ke baad prescription PDF mein chat mein milta hai. Follow-up appointment video call se book kar sakte hain." }
    ],
  sarkardost: [
    { q: "Listing kaise banayein?", a: "Mobile number se sign up karein, business details bharein aur submit karein — 5 minute mein live!" },
    { q: "Kya listing free hai?", a: "Haan! Basic listing bilkul free hai. Premium features ke liye paid plans hain." },
    { q: "Customer kaise milenge?", a: "Jab koi aapki category mein search karta hai, aapki listing dikhti hai — WhatsApp ya call se contact karte hain." },
    { q: "Kya main apni listing edit kar sakta hoon?", a: "Bilkul! Dashboard se kisi bhi waqt listing update karein — photos, timings, prices." },
    { q: "Ranking kaise badhayein?", a: "Reviews ikattha karein, profile complete karein, regularly active rahein — algorithm aapko upar dikhata hai." },
  ],
  followup: [
    { q: "Reminder kaise set karein?", a: "App mein task add karein, date/time set karein, channel choose karein — WhatsApp, SMS ya Email." },
    { q: "Kya automated messages bhej sakte hain?", a: "Haan! AI aapki typing pattern seekhta hai aur automated follow-up messages bhejta hai." },
    { q: "Team members ko kaise add karein?", a: "Business plan mein up to 5 team members add kar sakte hain — tasks assign karein aur track karein." },
  ],
  cloudplayer: [
      { q: "Kya offline download hai?", a: "Haan! Premium plan mein aap content download karke bina internet dek sakte hain." },
      { q: "Kitne devices par chal sakta hai?", a: "Family plan mein 5 devices — sab alag-alag content dekh sakte hain simultaneously." },
      { q: "Kya Smart TV par chalega?", a: "Bilkul! Android TV, Fire Stick, Samsung TV — sab par Cloud Player available hai." },
      { q: "Kya 4K HDR streaming available hai?", a: "Haan! Premium plan mein 4K HDR, Dolby Vision, aur Dolby Atmos support hai cinema-grade experience ke liye." },
      { q: "Kitna data consume hota hai streaming mein?", a: "Adaptive bitrate technology aapki connection hisaab se adjust hoti hai — 4K ke liye ~7-10 GB/ghanta, 1080p ke liye ~3 GB/ghanta." },
      { q: "Kya live events par bhi streaming available hai?", a: "Haan! Sports, concerts, aur live events ko real-time stream kar sakte hain minimal latency ke saath." },
    ],
  paisaflow: [
    { q: "Investment shuru kitne se kar sakte hain?", a: "₹100 se shuru kar sakte hain — SIP, FD, mutual fund sab options available hain." },
    { q: "Kya risk analysis hota hai?", a: "Haan! AI aapke risk profile ke hisaab se portfolio suggest karta hai — safe se aggressive." },
    { q: " Paisa nikalna hai toh?", a: "Kisi bhi time withdraw kar sakte hain — T+1 mein bank account mein paisa aa jata hai." },
    { q: "PaisaFlow par returns kitne ho sakte hain?", a: "Returns market conditions par depend karte hain — mutual funds mein 12-15% p.a., FD mein 7-8% p.a., stocks mein higher potential risk ke saath." },
    { q: "Tax bachat ke liye PaisaFlow kya options deta hai?", a: "ELSS mutual funds mein Section 80C ke taht ₹1.5 lakh tak tax bachat, aur tax-free bonds bhi available hain." },
    { q: "KYC process kitna time leta hai?", a: "Bas 2 minute — Aadhar aur PAN se e-KYC complete ho jata hai, bina kisi paperwork ke." },
  ],
  yaadrakh: [
    { q: "AI notes kaise ban ta hai?", a: "Aap bolte hain ya likhte hain — AI samajhta hai aur organized notes bana deta hai." },
    { q: "Kya cross-device sync hota hai?", a: "Haan! Phone, tablet, laptop — sab jagah aapke notes synchronized hain." },
    { q: "Data secure hai?", a: "Bilkul — end-to-end encrypted. Aapka sirf aapka hai." },
    { q: "YaadRakh mein voice se notes kaise banaye?", a: "Sahi! Aap bol sakte hain — AI real-time speech-to-text se notes tayar karta hai, phir unhein organize karta hai." },
    { q: "Kya meri notes kisi third-party ke saath share hoti hain?", a: "Nahi! Aapki notes sirf aapke paas rahti hain — end-to-end encryption ke saath, koi bhi third-party access nahi pay sakta." },
    { q: "Offline mode mein notes access kar sakte hain?", a: "Haan! Aapke notes sabhi devices par sync hote hain, aur offline access ke liye aap latest sync ki huyi notes ko access kar sakte hain." },
    { q: "Smart reminders kaise kaam karte hain?", a: "YaadRakh ki AI aapke notes samajhti hai — jaaki aapne 'kal 10 baje meeting' likha hai, to uske hisaab se reminder set karti hai, context-based reminders bhi deti hai." },
  ],
  "sarkar-ai": [
    { q: "AI kitni bhasha samajhta hai?", a: "Hindi, English aur 10+ Indian bhashaen — aapki bhasha mein baat karein." },
    { q: "API access kaise milega?", a: "Pro plan se API access milta hai — documentation aur SDK available hai." },
    { q: "Kya business data safe hai?", a: "Haan! Aapka data train nahi hota — privacy first approach." },
  ],
  sarkarfood: [
    { q: "Delivery time kitna hai?", a: "30 minute mein guaranteed — late hai toh free delivery coupon milta hai." },
    { q: "Kya COD available hai?", a: "Haan! Cash on delivery sabhi restaurants par available hai." },
    { q: "Premium plan kya deta hai?", a: "Free delivery, special offers aur 10% cashback har order pe." },
  ],
  sarkarfinance: [
    { q: "Loan approval kitne mein hoti hai?", a: "10 minute mein — AI-based verification se instant approval." },
    { q: "Kya documents zaroori hain?", a: "Bas Aadhar aur PAN — baar baar nahi maanga jayega." },
    { q: "EMI kaise bayenge?", a: "Auto-debit se — NACH mandate set karein, har mahina auto deduct ho jayega." },
  ],
  sarkarpay: [
    { q: "Settlement time kitna hai?", a: "T+0 — aaj ka sale aaj hi bank mein." },
    { q: "Kya international payments accept hote hain?", a: "Haan! Business plan se international cards bhi accept kar sakte hain." },
    { q: "Chargeback kaise handle hota hai?", a: "Dashboard se track karein — automated dispute resolution available hai." },
  ],
  sarkarmart: [
    { q: "Delivery kab tak hoti hai?", a: "Indore mein 24 ghante ke andar — free delivery ₹499+ orders pe." },
    { q: "Return policy kya hai?", a: "7 din mein return — full refund, no questions asked." },
    { q: "Cashback kaise milta hai?", a: "Har purchase pe 5-20% cashback — directly wallet mein credit hota hai." },
  ],
  sarkarlegal: [
    { q: "First consultation free hai?", a: "Haan! 15 minute ki first consultation bilkul free hai." },
    { q: "Online consultation kaise hoti hai?", a: "Video call par — WhatsApp ya Zoom se connect hote hain." },
    { q: "Kya court representation milta hai?", a: "Pro plan mein experienced lawyers court mein represent karte hain." },
  ],
  "justdial-agent": [
    { q: "Data analytics kaise kaam karta hai?", a: "Hum market trends, customer behavior aur competition ka data analyze karte hain — aapko actionable insights dete hain." },
    { q: "Lead generation mein kya shamil hai?", a: "Verified customer contacts, demand analysis aur targeted outreach — jo actually interested hain unhi tak pahunch." },
    { q: "Kya mobile se manage ho sakta hai?", a: "Bilkul! Poora dashboard mobile-friendly hai — kahi bhi, kabhi bhi apne business ki monitoring karein." },
  ],
  sarkarmarketplace: [
    { q: "Business kaise list karein?", a: "Free sign up — business details bharein aur turant live ho jayega." },
    { q: "Kya verification hoti hai?", a: "Haan! Hum har business verify karte hain — GST, address check." },
    { q: "Lead kaise milte hain?", a: "Jab koi aapki category mein search karta hai — aapka contact detail dikhta hai." },
  ],
  ayurvedicwebsite: [
    { q: "Kya products genuine hain?", a: "100%! AYUSH certified — batch number aur expiry check kar sakte hain." },
    { q: "Vaidya consultation free hai?", a: "Haan! Free 15-minute consultation — aapki prakriti ke hisaab se upay." },
    { q: "Shipping charges kitne?", a: "₹499+ orders pe free shipping — 3-5 din mein delivery." },
  ],
  sarkarghar: [
    { q: "Virtual tour kaise dekhein?", a: "Property page par 'Virtual Tour' button — 360° walkthrough." },
    { q: "Loan facility available hai?", a: "Haan! 15+ bank partners — application se approval tak support." },
    { q: "Kya verified listings hain?", a: "Sabhi listings verified — owner documents check kiye jate hain." },
  ],
  sarkarskills: [
    { q: "Certificate milta hai?", a: "Haan! Course complete karne par government-recognized certificate milta hai." },
    { q: "Placement assistance hai?", a: "Haan! 60% students ko placement milta hai — tie-ups with 100+ companies." },
    { q: "Installment option hai?", a: "Haan! ₹500/month se start — education loan bhi available hai." },
  ],
  "hyperframes-realestate": [
    { q: "Video tour kaise banayein?", a: "Professional team aapki property ki 4K video shoot karti hai — 360° walkthrough ke saath." },
    { q: "Kya NRI log bhi use kar sakte hain?", a: "Bilkul! Video tour se door se property dekhein, virtual meeting ke through deal close karein." },
    { q: "Price analytics kaise kaam karta hai?", a: "Area ke recent transactions, market trends aur demand-supply analysis se fair price estimate milta hai." },
  ],
  sikshahub: [
    { q: "Kya CBSE board covered hai?", a: "Haan! CBSE, ICSE aur MP Board — class 1 se 12 tak." },
    { q: "Live classes hain?", a: "Haan! Weekly live sessions — teacher se directly pooch sakte hain." },
    { q: "Progress report milti hai?", a: "Haan! Monthly report parents ko — weak areas bhi batate hain." },
  ],
  sarkartravel: [
    { q: "Best rates kaise milte hain?", a: "100+ airlines aur hotels se compare — lowest price guarantee." },
    { q: "Cancellation flexible hai?", a: "Haan! 24 ghante tak free cancellation — full refund." },
    { q: "Travel insurance included?", a: "Premium plan mein free travel insurance — medical aur trip cover." },
  ],
  sarkardukaan: [
    { q: "Store kaise banayein?", a: "Sign up karein, products add karein, payment link set karein — 10 minute mein live!" },
    { q: "Delivery kaise manage karein?", a: "Humara delivery network — ya khud bhi deliver kar sakte hain." },
    { q: "Kya custom domain milta hai?", a: "Pro plan mein — apna naam, apna brand, apna store." },
  ],
  sarkarbazaar: [
    { q: "Export kaise shuru karein?", a: "Bazaar export program join — international buyers se connect." },
    { q: "B2B orders kaise aate hain?", a: "Wholesale listing karein — bulk buyers directly contact karte hain." },
    { q: "Payment secure hai?", a: "Haan! Escrow system — buyer confirm hone ke baad payment release." },
  ],
  sarkarjobs: [
    { q: "Profile kaise banayein?", a: "Sign up — education, experience, skills bharein — 5 minute mein ready!" },
    { q: "Companies verified hain?", a: "Haan! Sabhi companies GST verified — fraud nahi hoga." },
    { q: "Resume builder hai?", a: "Haan! Professional templates — one-click apply bhi." },
  ],
  sarkared: [
    { q: "Konsi courses hain?", a: "Digital Marketing, AI, Web Development, Data Science — industry-ready skills." },
    { q: "Job guarantee hai?", a: "70% placement rate — 100+ hiring partners ke saath." },
    { q: "Kitne time ki courses?", a: "4-12 weeks — self-paced, lifetime access." },
  ],
  sarkarsarkar: [
    { q: "Kaun si services hain?", a: "Aadhar, PAN, Passport, Ration Card, Driving License — sab ek jagah." },
    { q: "Application kaise karein?", a: "Form fill karein, documents upload karein — hum baaki kaam karenge." },
    { q: "Status kaise check karein?", a: "Dashboard se live tracking — SMS aur email alerts bhi milte hain." },
  ],
  sarkarwellness: [
    { q: "Panchkarma kya hai?", a: "Ayurvedic detox therapy — 5 steps, natural healing, no side effects." },
    { q: "Yoga classes online hain?", a: "Haan! Daily live classes — beginner se advanced level tak." },
    { q: "Diet plan milta hai?", a: "Haan! Vaidya aapki prakriti ke hisaab se customized diet plan deta hai." },
  ],
};

const DEFAULT_FAQ = [
  { q: "How do I get started?", a: "Simply sign up and you can start using our services immediately. The process takes less than 2 minutes." },
  { q: "Is there a free plan?", a: "Yes! We offer a free tier with basic features. You can upgrade anytime for more advanced capabilities." },
  { q: "How do I contact support?", a: "You can reach us via email, WhatsApp, or the contact form. Our team responds within 24 hours." },
  { q: "Can I cancel anytime?", a: "Absolutely. No long-term contracts. Cancel anytime from your settings without any penalties." },
  { q: "Is my data secure?", a: "Yes, we use industry-standard encryption and follow best practices to keep your data safe at all times." },
  { q: "Do you offer custom solutions?", a: "Yes! For enterprise customers, we offer custom integrations and dedicated support. Contact us to learn more." },
];

export function FAQPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const faqs = BRAND_FAQ[brand.slug] ?? (brand.faq_json ?? DEFAULT_FAQ) as any[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>FAQ</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>�क्सर प�छे जाने वा�े सवाल</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">SarkarHealth के बारे में कुछ सवा�ों के जवा�</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq: any, i: number) => (
            <div key={i} className="rounded-xl border overflow-hidden transition-all duration-300" style={{ borderColor: open === i ? primary : `${accent}30`, boxShadow: open === i ? `0 4px 20px -5px ${primary}20` : "none" }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-sm" style={{ color: primary }}>
                {faq.q}
                <span className="text-xl transition-transform duration-300" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-96" : "max-h-0"}`}>
                <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed border-t pt-3" style={{ borderColor: `${accent}20` }}>{faq.a}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center rounded-2xl p-8" style={{ backgroundColor: `${primary}08` }}>
          <p className="opacity-70 mb-2">Aur sawal hain? Hamare doctor se baat karein.</p>
          <a href={`https://${brand.slug}.cashcard.live/contact`} className="font-bold" style={{ color: primary }}>Contact us →</a>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
