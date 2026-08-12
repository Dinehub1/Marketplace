import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_PLANS: Record<string, Array<{ name: string; price: string; period: string; features: string[]; highlighted: boolean; tagline?: string }>> = {
  sarkarconnect: [
    {
      name: "Starter",
      price: "Free",
      period: "",
      features: [
        "Basic digital card",
        "5 connects/month",
        "3 products in catalog",
        "Community access",
      ],
      highlighted: false,
      tagline: "Get started for new businesses",
    },
    {
      name: "Business",
      price: "₹799",
      period: "/mo",
      features: [
        "Everything in Starter",
        "Unlimited connects",
        "Unlimited product catalog",
        "Deal tracking dashboard",
        "Priority support",
        "WhatsApp Business badge",
      ],
      highlighted: true,
      tagline: "⭐ Most popular — for growing businesses",
    },
    {
      name: "Enterprise",
      price: "₹2,499",
      period: "/mo",
      features: [
        "Everything in Business",
        "AI partner matching",
        "Team members (up to 5)",
        "API access",
        "Custom branding",
        "Dedicated account manager",
      ],
      highlighted: false,
      tagline: "For large businesses",
    },
  ],
  sarkarhealth: [
    {
      name: "Basic",
      price: "Free",
      period: "",
      features: [
        "Doctor search and profile view",
        "2 appointments/month",
        "Basic health records",
        "Community forum access",
      ],
      highlighted: false,
      tagline: "Essential health care",
    },
    {
      name: "Health Pro",
      price: "₹299",
      period: "/mo",
      features: [
        "Everything in Basic",
        "Unlimited video consultations",
        "Medicine delivery (15% off)",
        "Lab test booking (10% off)",
        "Priority appointments",
        "Download health reports",
      ],
      highlighted: true,
      tagline: "⭐ Most popular — for your family's health",
    },
    {
      name: "Family Plan",
      price: "₹699",
      period: "/mo",
      features: [
        "Everything in Health Pro",
        "Coverage for 6 members",
        "Unlimited consultations for all",
        "Free lab sample collection",
        "Doctor home visit (1 per month)",
        "24/7 emergency helpline",
      ],
      highlighted: false,
      tagline: "Complete protection for the whole family",
    },
  ],
  sarkardost: [
    {
      name: "Needy Business",
      price: "Free",
      period: "",
      features: [
        "Basic listing (name, phone, address)",
        "Appear in community search",
        "5 leads/month",
        "Mobile number verification",
      ],
      highlighted: false,
      tagline: "Get started — at no cost",
    },
    {
      name: "Pro Business",
      price: "₹499",
      period: "/mo",
      features: [
        "Everything in Needy",
        "Priority in search (top placement)",
        "Unlimited leads",
        "WhatsApp notifications",
        "Photo gallery (10 photos)",
        "Category expertise badge",
        "Analytics dashboard",
      ],
      highlighted: true,
      tagline: "Most popular — grow faster",
    },
    {
      name: "Premium Partner",
      price: "₹1,499",
      period: "/mo",
      features: [
        "Everything in Pro",
        "Ad banner display",
        "API access (CRM integration)",
        "Dedicated account manager",
        "Custom brand profile page",
        "Direct customer contact",
        "20% off on pricing",
      ],
      highlighted: false,
      tagline: "For large businesses",
    },
  ],
  followup: [
    { name: "Starter", price: "Free", period: "", features: ["5 reminders/month", "Basic tasks", "Email notifications"], highlighted: false, tagline: "For personal use" },
    { name: "Pro", price: "₹199", period: "/mo", features: ["Unlimited reminders", "WhatsApp SMS", "Team (3 members)", "AI automation"], highlighted: true, tagline: "⭐ For professionals" },
    { name: "Business", price: "₹499", period: "/mo", features: ["Everything in Pro", "Unlimited team", "API access", "Custom branding"], highlighted: false, tagline: "For teams" },
  ],
  cloudplayer: [
    { name: "Basic", price: "Free", period: "", features: ["HD streaming", "5GB storage", "Mobile app"], highlighted: false, tagline: "To get started" },
    { name: "Premium", price: "₹299", period: "/mo", features: ["4K HDR", "100GB storage", "Offline download", "Dolby audio"], highlighted: true, tagline: "⭐ Best experience" },
    { name: "Family", price: "₹499", period: "/mo", features: ["5 profiles", "200GB storage", "Priority support"], highlighted: false, tagline: "For the whole family" },
  ],
  paisaflow: [
    { name: "Starter", price: "Free", period: "", features: ["Basic portfolio", "Return calculator", "Market news"], highlighted: false, tagline: "To start investing" },
    { name: "Gold", price: "₹499", period: "/mo", features: ["AI risk analysis", "Goal-based planning", "Real-time alerts", "Financial advice"], highlighted: true, tagline: "⭐ For serious investors" },
    { name: "Platinum", price: "₹999", period: "/mo", features: ["Everything in Gold", "Dedicated advisor", "Tax planning", "Priority support"], highlighted: false, tagline: "For high-net-worth individuals" },
  ],
  yaadrakh: [
    { name: "Starter", price: "Free", period: "", features: ["10 notes/month", "Basic reminders", "Mobile app"], highlighted: false, tagline: "Personal use" },
    { name: "Pro", price: "₹149", period: "/mo", features: ["Unlimited notes", "AI notes", "Cross-device sync", "Smart search"], highlighted: true, tagline: "⭐ Best value" },
    { name: "Team", price: "₹399", period: "/mo", features: ["5 members", "Team notes", "Shared reminders", "API access"], highlighted: false, tagline: "For teams" },
  ],
  "sarkar-ai": [
    { name: "Starter", price: "Free", period: "", features: ["100 queries/month", "Basic AI", "Hindi support"], highlighted: false, tagline: "Try AI" },
    { name: "Pro", price: "₹499", period: "/mo", features: ["Unlimited queries", "Context understanding", "Task automation", "API access"], highlighted: true, tagline: "⭐ For professional use" },
    { name: "Enterprise", price: "₹1,999", period: "/mo", features: ["Custom model", "Dedicated support", "SLA", "Batch processing"], highlighted: false, tagline: "For large organizations" },
  ],
  sarkarfood: [
    { name: "Customer", price: "Free", period: "", features: ["Order tracking", "Ratings and reviews", "Basic offers"], highlighted: false, tagline: "For food lovers" },
    { name: "Premium", price: "₹99", period: "/mo", features: ["Free delivery", "Exclusive offers", "Priority support", "10% cashback"], highlighted: true, tagline: "⭐ For regular customers" },
  ],
  sarkarfinance: [
    { name: "Basic", price: "Free", period: "", features: ["Credit score check", "Loan calculator", "Basic advice"], highlighted: false, tagline: "Financial awareness" },
    { name: "Premium", price: "₹299", period: "/mo", features: ["Instant loan", "Financial advice", "EMI tracker", "Credit repair"], highlighted: true, tagline: "⭐ Best service" },
  ],
  sarkarpay: [
    { name: "Starter", price: "Free", period: "", features: ["Accept UPI", "Basic dashboard", "₹50,000/month limit"], highlighted: false, tagline: "For small merchants" },
    { name: "Business", price: "₹499", period: "/mo", features: ["All modes", "Unlimited transactions", "Analytics", "API access"], highlighted: true, tagline: "⭐ For growing businesses" },
    { name: "Enterprise", price: "₹1,499", period: "/mo", features: ["Custom branding", "Dedicated support", "SLA", "Multi-currency"], highlighted: false, tagline: "For large organizations" },
  ],
  sarkarmart: [
    { name: "Starter", price: "Free", period: "", features: ["Basic listing", "5 products", "Community"], highlighted: false, tagline: "To get started" },
    { name: "Seller", price: "₹399", period: "/mo", features: ["Unlimited products", "Delivery network", "Analytics", "Cashback"], highlighted: true, tagline: "⭐ For active sellers" },
    { name: "Premium", price: "₹999", period: "/mo", features: ["Premium placement", "Advertising", "API access", "Dedicated support"], highlighted: false, tagline: "For large sellers" },
  ],
  sarkarlegal: [
    { name: "Basic", price: "Free", period: "", features: ["Consultation (15 minutes)", "Document templates", "Legal articles"], highlighted: false, tagline: "Basic information" },
    { name: "Pro", price: "₹499", period: "/mo", features: ["Unlimited consultations", "Document preparation", "Court assistance"], highlighted: true, tagline: "⭐ Full legal assistance" },
  ],
  "justdial-agent": [
    { name: "Starter", price: "Free", period: "", features: ["Basic listing", "5 leads/month", "Rating profile"], highlighted: false, tagline: "To get started" },
    { name: "Premium", price: "₹799", period: "/mo", features: ["Premium placement", "Unlimited leads", "Analytics", "API access"], highlighted: true, tagline: "⭐ For growing businesses" },
  ],
  sarkarmarketplace: [
    { name: "Starter", price: "Free", period: "", features: ["Basic listing", "3 categories", "Community"], highlighted: false, tagline: "To get started" },
    { name: "Business", price: "₹599", period: "/mo", features: ["Unlimited listings", "Analytics", "Lead generation"], highlighted: true, tagline: "⭐ For active merchants" },
  ],
  ayurvedicwebsite: [
    { name: "Customer", price: "Free", period: "", features: ["Browse products", "Basic advice", "Order tracking"], highlighted: false, tagline: "For buyers" },
    { name: "VIP", price: "₹199", period: "/mo", features: ["15% off", "Free shipping", "Ayurvedic consultation", "Exclusive products"], highlighted: true, tagline: "⭐ For regular customers" },
  ],
  sarkarghar: [
    { name: "Explorer", price: "Free", period: "", features: ["Browse properties", "Basic filters", "Contact"], highlighted: false, tagline: "For searchers" },
    { name: "Premium", price: "₹499", period: "/mo", features: ["Virtual tour", "Loan assistance", "Priority", "Analytics"], highlighted: true, tagline: "⭐ For serious buyers" },
  ],
  sarkarskills: [
    { name: "Starter", price: "Free", period: "", features: ["Basic course", "Community", "Basic content"], highlighted: false, tagline: "To get started" },
    { name: "Pro", price: "₹500", period: "/mo", features: ["All courses", "Certificate", "Placement assistance", "Live sessions"], highlighted: true, tagline: "⭐ For your career" },
  ],
  "hyperframes-realestate": [
    { name: "Basic", price: "Free", period: "", features: ["Browse properties", "Contact"], highlighted: false, tagline: "For searchers" },
    { name: "Pro", price: "₹999", period: "/mo", features: ["Video tour", "Loan assistance", "Agent matching", "Analytics"], highlighted: true, tagline: "⭐ For serious buyers and agents" },
  ],
  sikshahub: [
    { name: "Starter", price: "Free", period: "", features: ["Basic content", "5 videos/month", "Community"], highlighted: false, tagline: "To get started" },
    { name: "Pro", price: "₹199", period: "/mo", features: ["All content", "Unlimited videos", "Live tuition", "Progress report"], highlighted: true, tagline: "⭐ For complete preparation" },
  ],
  sarkartravel: [
    { name: "Basic", price: "Free", period: "", features: ["Rate comparison", "Basic booking", "Travel suggestions"], highlighted: false, tagline: "For travelers" },
    { name: "Premium", price: "₹299", period: "/mo", features: ["Special rates", "Insurance", "24/7 support", "Flexible booking"], highlighted: true, tagline: "⭐ For frequent travelers" },
  ],
  sarkardukaan: [
    { name: "Starter", price: "Free", period: "", features: ["Basic store", "5 products", "UPI payment"], highlighted: false, tagline: "To get started" },
    { name: "Pro", price: "₹399", period: "/mo", features: ["Unlimited products", "Delivery network", "Analytics", "Custom domain"], highlighted: true, tagline: "⭐ For growing shopkeepers" },
  ],
  sarkarbazaar: [
    { name: "Starter", price: "Free", period: "", features: ["Basic listing", "3 products", "Local reach"], highlighted: false, tagline: "To get started" },
    { name: "Business", price: "₹599", period: "/mo", features: ["Unlimited products", "B2B network", "Export assistance", "Analytics"], highlighted: true, tagline: "⭐ For active merchants" },
  ],
  sarkarjobs: [
    { name: "Candidate", price: "Free", period: "", features: ["Create profile", "5 applications/month", "Basic resume"], highlighted: false, tagline: "For job seekers" },
    { name: "Pro", price: "₹199", period: "/mo", features: ["Unlimited applications", "Premium resume", "Career advice", "Priority"], highlighted: true, tagline: "⭐ For serious candidates" },
  ],
  sarkared: [
    { name: "Starter", price: "Free", period: "", features: ["Basic course", "Community", "Basic content"], highlighted: false, tagline: "To get started" },
    { name: "Pro", price: "₹499", period: "/mo", features: ["All courses", "Certificate", "Placement", "Live sessions"], highlighted: true, tagline: "⭐ For your career" },
  ],
  sarkarsarkar: [
    { name: "Citizen", price: "Free", period: "", features: ["Service list", "Application assistance", "Status tracking"], highlighted: false, tagline: "For all citizens" },
    { name: "Premium", price: "₹199", period: "/mo", features: ["Priority assistance", "Home visit", "Document pickup", "Dedicated support"], highlighted: true, tagline: "⭐ For full facilities" },
  ],
  sarkarwellness: [
    { name: "Basic", price: "Free", period: "", features: ["Health advice", "Yoga videos", "Nutrition plan"], highlighted: false, tagline: "Health awareness" },
    { name: "Premium", price: "₹499", period: "/mo", features: ["Ayurvedic consultation", "Personalized plan", "Panchakarma booking", "Yoga classes"], highlighted: true, tagline: "⭐ Complete health management" },
  ],
};

const DEFAULT_PLANS = [
  { name: "Starter", price: "Free", period: "", features: ["Basic listing", "Community support", "1 project", "Email notifications"], highlighted: false },
  { name: "Pro", price: "₹999", period: "/mo", features: ["Everything in Starter", "Priority support", "10 projects", "Analytics dashboard", "Custom domain", "API access"], highlighted: true },
  { name: "Enterprise", price: "₹4,999", period: "/mo", features: ["Everything in Pro", "Dedicated manager", "Unlimited projects", "Advanced analytics", "SLA guarantee", "White-label"], highlighted: false },
];

export function PricingPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const plans = BRAND_PLANS[brand.slug] ?? (brand.pricing_json ?? DEFAULT_PLANS) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-20 right-20 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>Pricing</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>Clear and straightforward pricing</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">
            Choose a plan based on your business. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan: any, i: number) => (
              <div key={i} className={`card-lift rounded-2xl p-6 flex flex-col ${plan.highlighted ? "md:scale-105 shadow-2xl" : "shadow-sm"}`} style={plan.highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { border: `1px solid ${accent}30` }}>
                {plan.highlighted && <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">⭐ Most popular</div>}
                {plan.tagline && <div className={`text-xs font-medium mb-2 ${plan.highlighted ? "text-white/70" : "opacity-50"}`}>{plan.tagline}</div>}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-white" : ""}`} style={!plan.highlighted ? { color: primary } : {}}>{plan.name}</h3>
                <div className="mb-4">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : ""}`} style={!plan.highlighted ? { color: primary } : {}}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.highlighted ? "text-white/70" : "opacity-50"}`}>{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {(plan.features ?? []).map((f: string, j: number) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-white/90" : "opacity-70"}`}>
                      <span style={!plan.highlighted ? { color: primary } : {}}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={`/register`} className={`block text-center rounded-xl py-3 text-sm font-bold transition-all hover:translate-y-[-2px] ${plan.highlighted ? "bg-white" : "text-white"}`} style={!plan.highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { color: primary }}>
                  {plan.price === "Free" ? "Get started free" : "Subscribe"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="heading-md" style={{ color: primary }}>Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Can I talk to a doctor for free?", a: "Your first consultation is free! After that, the Health Pro plan gives you unlimited video consultations for just ₹299/month." },
              { q: "Will a doctor visit my home?", a: "Yes, the Family Plan (₹699/month) includes 1 monthly doctor home visit — a specialist physician comes to your home." },
              { q: "How do I order medicine?", a: "Upload your prescription or order directly — save up to 40% on generic options. Same-day delivery in Indore." },
              { q: "Is insurance claim supported?", a: "We are tied up with TPAs — cashless claims are processed easily. Billing documents are available directly in the app." },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border bg-white p-5" style={{ borderColor: `${accent}30` }}>
                <h3 className="font-bold mb-2" style={{ color: primary }}>{faq.q}</h3>
                <p className="text-sm opacity-60">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Need a Custom Plan?</h2>
          <p className="text-white/80 mb-8">Special pricing is available for large hospitals, clinics, and chains.</p>
              <a href={`/quote`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>Request a custom quote →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
