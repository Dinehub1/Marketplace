import { BrandHeader, BrandFooter } from "./brand-header";
import { getBrandBusinesses } from "@/lib/brands";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { SectionHeading } from "@/components/directory/SectionHeading";

export async function BrandLanding({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";

  const showListings = brand.features?.listings === true;
  const { rows, total } = showListings ? await getBrandBusinesses(brand.slug, 12) : { rows: [], total: 0 };

  // Brand-specific hero content
  const brandHero: Record<string, { headline: string; subheadline: string; highlights: string[] }> = {
    "sarkardost": {
      headline: "Indore's strength, your connection",
      subheadline: "SarkarDost connects you with your community — services, opportunities and trusted local leaders, all in one place.",
      highlights: [
        "📍 Local Indore search — shops, services, and experts",
        "🤝 Community trust — reviews, ratings and real feedback",
        "📢 Opportunities & updates — jobs, events and training",
      ],
    },
    "sarkarconnect": {
      headline: "B2B connections that work",
      subheadline: "SarkarConnect links Indian businesses — from supplier to distributor, all on one platform.",
      highlights: [
        "🔗 Verified business network — thousands of active traders",
        "📈 Deal tracking — a clear record from lead to close",
        "💼 Digital cards — present your business professionally",
      ],
    },
    "sarkarhealth": {
      headline: "Your health, our responsibility",
      subheadline: "SarkarHealth is a complete healthcare solution for Indore — from doctor to medicine, all in one app.",
      highlights: [
        "🩺 Video consultation — meet a doctor anywhere, anytime",
        "💊 Online medicine orders — get medicines delivered home",
        "📋 Health records — all your medical info, safely in one place",
      ],
    },
    "followup": {
      headline: "Never miss a follow-up, never waste work",
      subheadline: "FollowUp is your productivity partner — reminders, task tracking, every job done.",
      highlights: [
        "📅 Smart reminders — via WhatsApp and SMS",
        "📋 Task tracking — a record of every follow-up",
        "📊 Progress reports — daily, weekly and monthly dashboards",
      ],
    },
    "cloudplayer": {
      headline: "A new standard for streaming",
      subheadline: "Cloud Player — a cloud-powered media player that streams your favourite content without buffering.",
      highlights: [
        "⚡ Zero buffering — play instantly, no waiting",
        "☁️ Cloud storage — anywhere, on any device",
        "🎬 4K support — high-quality content, uninterrupted",
      ],
    },
    "paisaflow": {
      headline: "Smart returns on every rupee",
      subheadline: "PaisaFlow — turn your savings into investments and earn daily returns.",
      highlights: [
        "💸 Smart returns — from FDs to mutual funds",
        "📈 Portfolio tracking — real-time updates",
        "🎯 Goal-based investment — tailored to your aims",
      ],
    },
    "yaadrakh": {
      headline: "Remember, move forward",
      subheadline: "YaadRakh — your AI productivity companion that turns memory into strength.",
      highlights: [
        "🧠 Smart notes — organised and searchable with AI",
        "⏰ Intelligent reminders — at the right time",
        "🔄 Cross-device sync — phone, tablet and laptop",
      ],
    },
    "sarkar-ai": {
      headline: "With AI, the government is your empire",
      subheadline: "Sarkar AI — build AI-powered business tools without writing code. Create content, analyse data, all on one platform.",
      highlights: ["🤖 AI content generator — posts, emails and ads in seconds", "📊 Smart analytics — insights and reports", "💬 AI chatbot — automated 24/7 support"],
    },
    "sarkarfinance": {
      headline: "Money when you need it — finance made easy",
      subheadline: "SarkarFinance — loans, mutual funds and financial services, now digital and transparent.",
      highlights: ["📈 Loan calculator — instant EMI and interest rates", "💳 Check credit score — free", "🏦 Digital banking — no branch visit needed"],
    },
    "sarkarpay": {
      headline: "Payments in, business grows — fast and secure",
      subheadline: "SarkarPay — UPI, QR codes and online payment solutions for your business.",
      highlights: ["⚡ UPI payments — instant transfers, no delay", "📱 QR code — scan and pay", "🔒 100% secure — bank-grade encryption"],
    },
    "sarkarmart": {
      headline: "Indore's own mart — local business, global reach",
      subheadline: "SarkarMart — take your shop digital and reach all of Indore.",
      highlights: ["🛒 Online store — set up in minutes", "📦 Inventory management — auto-tracked stock", "📊 Sales dashboard — real-time analytics"],
    },
    "sarkarlegal": {
      headline: "Legal help, now easy — your legal companion",
      subheadline: "SarkarLegal — talk to a lawyer, generate documents, get advice from home.",
      highlights: ["⚖️ Online lawyer consultation — real-time", "📄 Document generator — agreements, notices", "🔍 Legal search — thousands of case laws in one place"],
    },
    "justdial-agent": {
      headline: "Data means deals — data-driven business intelligence",
      subheadline: "JustDial Agent — make smart decisions from business data and generate leads.",
      highlights: ["📊 Business analytics — trends and insights", "🎯 Lead generation — find potential customers", "📱 Mobile dashboard — monitor from anywhere"],
    },
    "sarkarmarketplace": {
      headline: "Indore's largest directory — thousands of businesses, one platform",
      subheadline: "SarkarMarketplace — find 3,233+ verified businesses in one place.",
      highlights: ["🔍 Smart search — by zip code and category", "⭐ Verified ratings — real customer reviews", "📍 Local discovery — find the best nearby"],
    },
    "ayurvedicwebsite": {
      headline: "100% natural, 100% trustworthy — Ayurvedic wellness",
      subheadline: "Mera Ayurvedic — 5,000 years of Ayurvedic tradition, with modern science.",
      highlights: ["🌿 Natural products — no chemicals", "👨‍⚕️ Ayurvedic consultation — online doctor", "💊 Personalised treatment — for your body type"],
    },
    "sarkarghar": {
      headline: "Find a home, no tension — Indore's perfect home",
      subheadline: "SarkarGhar — search real estate, rent or buy, all digital.",
      highlights: ["🏠 Smart search — by budget and location", "📊 Price analytics — know the market trend", "🔑 Virtual tour — see the home without going"],
    },
    "sarkarskills": {
      headline: "Build skills, change life — learn something new",
      subheadline: "SarkarSkills — online courses, certification and career guidance in one place.",
      highlights: ["📚 500+ courses — tech, business, creative", "🏅 Certificate — job-ready credentials", "👨‍🏫 Expert mentoring — one-on-one guidance"],
    },
    "hyperframes-realestate": {
      headline: "See the home on video — virtual tour, real decision",
      subheadline: "Hyperframes — revolutionising real estate with 3D virtual tours and video visualisation.",
      highlights: ["🎥 3D virtual tour — walk the home without going", "📹 Professional video — make the property a star", "🗺️ Interactive map — see the property layout"],
    },
    "sikshahub": {
      headline: "Education for every home — study anywhere",
      subheadline: "SikshaHub — online classes, tutors and study material — without limits.",
      highlights: ["📖 Live classes — real-time interaction", "🎯 Practice tests — weekly mock exams", "👨‍🏫 Expert teachers — learn from top educators"],
    },
    "sarkartravel": {
      headline: "Travel more, make memories — travel, worry less",
      subheadline: "SarkarTravel — booking, planning and travel guides, all in one app.",
      highlights: ["✈️ Flight booking — find cheap tickets", "🏨 Hotel reservation — best deals", "🗺️ Travel planner — AI-based itinerary"],
    },
    "sarkardukaan": {
      headline: "Your shop, now digital — a user-friendly online store",
      subheadline: "SarkarDukaan — take your business digital and build an online store in minutes.",
      highlights: ["🛍️ Online store builder — drag and drop", "📦 Inventory tracking — auto-managed stock", "💳 Payment gateway — UPI, card, net banking"],
    },
    "sarkarbazaar": {
      headline: "Indore's market, now online — local business, global reach",
      subheadline: "SarkarBazaar — connects local traders with the global market.",
      highlights: ["🏪 Multi-vendor marketplace — hundreds of sellers", "📦 Logistics support — delivery partner network", "📊 Market analytics — sales trends and insights"],
    },
    "sarkarjobs": {
      headline: "Find a job, build a career — jobs that match",
      subheadline: "SarkarJobs — AI-powered job matching, resume builder and career guidance.",
      highlights: ["🎯 AI job match — by your skills", "📝 Resume builder — professional templates", "📊 Salary insight — industry benchmarks"],
    },
    "sarkared": {
      headline: "Learn, grow, become — skills that pay",
      subheadline: "SarkarEd — online certification, skill development and career-focused courses.",
      highlights: ["🎓 Certificate courses — globally recognised", "💻 Live projects — real-world experience", "🤝 Placement support — interview prep"],
    },
    "sarkarsarkar": {
      headline: "Your government, in your hands — government services, now digital",
      subheadline: "SarkarSarkar — government services, documents and rights — all in one window.",
      highlights: ["🏛️ Digital services — Aadhaar, PAN, passport", "📄 Document generator — forms and applications", "🔍 RTI online — right to information, made easy"],
    },
    "sarkarwellness": {
      headline: "Wellness from Ayurveda — ancient wellness, modern healing",
      subheadline: "SarkarWellness — yoga, Ayurveda and natural treatment for you.",
      highlights: ["🧘 Yoga classes — online and offline", "🌿 Ayurvedic treatment — personalised plans", "🧠 Mental wellness — meditation and counselling"],
    },
    "sarkarfood": {
      headline: "Indore's Best Food, Delivered to Your Door in 30 Minutes",
      subheadline: "Order from 200+ top-rated restaurants across Indore. From street food to fine dining — we bring it all, hot and fresh.",
      highlights: ["🚀 Live Order Tracking — Track your meal from kitchen to doorstep", "⚡ 30-Min Express Delivery — Hot, fresh food in half an hour", "🏪 200+ Restaurant Partners — Indore's best kitchens on one app"],
    },
  };

  const hero = brandHero[brand.slug] || {
    headline: brand.tagline || brand.name,
    subheadline: brand.description || `${brand.name} — your trusted platform.`,
    highlights: [],
  };

  // Brand-specific stats
    const brandStats: Record<string, Array<{ v: string; label: string; icon: string }>> = {
      sarkarhealth: [
        { v: "50+", label: "Verified doctors", icon: "🩺" },
        { v: "5,000+", label: "Active patients", icon: "👥" },
        { v: "4.9★", label: "Doctor rating", icon: "⭐" },
        { v: "24/7", label: "Helpline", icon: "🚑" },
      ],
    };
    const stats = brandStats[brand.slug] ?? [
      { v: "10,000+", label: "Active users", icon: "👥" },
      { v: "5,000+", label: "Successful interactions", icon: "✅" },
      { v: "4.9★", label: "Average rating", icon: "⭐" },
      { v: "24/7", label: "Support available", icon: "🛟" },
    ];

  const isCustomerSite = !!brand.features?.listings;

  // Brand-specific steps
    const brandSteps: Record<string, Array<{ n: string; t: string; d: string }>> = {
      sarkarhealth: [
        { n: "1", t: "Choose a doctor", d: "Find the right doctor by expertise and experience — read profiles, see ratings." },
        { n: "2", t: "Book an appointment", d: "Video or in-person — choose what suits you. Instant confirmation." },
        { n: "3", t: "Consult", d: "Meet the doctor, get a prescription, order medicine — all in one place." },
      ],
    };
    const steps = brandSteps[brand.slug] ?? (isCustomerSite ? [
      { n: "1", t: "Sign Up", d: "Create a free account in minutes — just your mobile number." },
      { n: "2", t: "Search & Discover", d: "Browse thousands of verified businesses by category, area or service." },
      { n: "3", t: "Connect & Book", d: "Call, WhatsApp or visit — reach the right business instantly." },
    ] : [
      { n: "1", t: "Sign Up", d: "Create an account in minutes — no complexity, just your mobile number." },
      { n: "2", t: "Find or Sell Services", d: "Search for what you need or promote your own business." },
      { n: "3", t: "Connect and Grow", d: "Build connections, close deals and progress in your community." },
    ]);

  // Brand-specific community
    const brandCommunity: Record<string, Array<{ icon: string; t: string; d: string }>> = {
      sarkarhealth: [
        { icon: "🏥", t: "Hospitals & clinics", d: "50+ partner hospitals — the largest network in Indore" },
        { icon: "👨‍⚕️", t: "Doctors", d: "MBBS, MD, BAMS — verified practitioners of every specialty" },
        { icon: "👨‍👩‍👧‍👦", t: "Families", d: "Patients of every age — complete care from children to elders" },
        { icon: "🔬", t: "Lab partners", d: "NABL-certified labs — accurate reports, fast delivery" },
      ],
    };
    const community = brandCommunity[brand.slug] ?? (isCustomerSite ? [
      { icon: "🔍", t: "Explore", d: "Discover businesses, services and professionals near you" },
      { icon: "⭐", t: "Verified", d: "Every listing is verified, with real customer ratings" },
      { icon: "📍", t: "Local", d: "Find the best options across Indore, by area and category" },
      { icon: "🏠", t: "Families", d: "The right service for your family's needs — all in one place" },
    ] : [
      { icon: "👤", t: "Users", d: "Find services for your needs and meet trusted partners" },
      { icon: "🏪", t: "Businesses", d: "Take your business online and reach new customers" },
      { icon: "👨‍💼", t: "Professionals", d: "Promote your skills and find the right opportunities" },
      { icon: "🏠", t: "Families", d: "The right service for your family's needs — all in one place" },
    ]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10"
             style={{ background: `radial-gradient(110% 90% at 15% 0%, ${primary}14 0%, transparent 55%), radial-gradient(90% 80% at 95% 100%, ${secondary}12 0%, transparent 55%)` }} />
        <div className="absolute inset-0 -z-10 opacity-[0.5]"
             style={{ backgroundImage: "radial-gradient(rgba(16,16,24,0.05) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="absolute -top-16 -right-10 -z-10 h-72 w-72 rounded-full blur-3xl opacity-25"
             style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-1.5 text-xs font-semibold backdrop-blur"
               style={{ borderColor: `${accent}40`, color: primary }}>
            <span className="text-base leading-none">{brand.emoji ?? "🤝"}</span>
            {brand.name}
          </div>

          <h1 className="text-[2.6rem] font-extrabold tracking-tight sm:text-5xl" style={{ color: primary }}>
            {hero.headline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium opacity-70 leading-relaxed">
            {hero.subheadline}
          </p>

          {/* Highlights as chips */}
          {hero.highlights.length > 0 && (
            <div className="mt-7 mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
              {hero.highlights.map((h: string, i: number) => (
                <span key={i}
                      className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm font-medium backdrop-blur"
                      style={{ borderColor: `${accent}30`, color: primary }}>
                  <span className="text-base leading-none">{h.split(" ")[0]}</span>
                  <span className="opacity-75">{h.substring(h.indexOf(" ") + 1)}</span>
                </span>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {brand.features?.leads && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                📥 Lead capture
              </span>
            )}
            {brand.features?.payments && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                💳 UPI payments
              </span>
            )}
            {showListings && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                🗂️ {total.toLocaleString()} listings
              </span>
            )}
            {!brand.features?.leads && !brand.features?.payments && !showListings && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                🏘️ {total > 0 ? `${total.toLocaleString()}+` : "thousands of"} local businesses in Indore
              </span>
            )}
          </div>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {isCustomerSite ? (
              <a
                href={`/marketplace`}
                className="press inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                style={{ backgroundColor: primary }}
              >
                Browse Businesses →
              </a>
            ) : (
              <a
                href={`/login`}
                className="press inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                style={{ backgroundColor: primary }}
              >
                Get started →
              </a>
            )}
            <a
              href={`/about`}
              className="press inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold border-2 hover:bg-white/60 transition-all"
              style={{ borderColor: accent, color: primary }}
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="border-t" style={{ borderColor: `${accent}20` }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl p-6 border bg-white text-center shadow-[0_1px_2px_rgba(16,16,24,0.04)]" style={{ borderColor: `${accent}20` }}>
                <div className="text-2xl mb-1.5">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-extrabold" style={{ color: primary }}>{s.v}</div>
                <div className="text-sm opacity-60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t" style={{ borderColor: `${accent}20`, backgroundColor: `${primary}04` }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>Start in three easy steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.n} className="text-center relative">
                <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  {step.n}
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ color: primary }}>{step.t}</h3>
                <p className="text-sm opacity-60 leading-relaxed max-w-xs mx-auto">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="border-t" style={{ borderColor: `${accent}20` }}>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>Join the community</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>Who uses {brand.name}?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {community.map((u, i) => (
              <div key={i} className="rounded-2xl border bg-white p-6 text-center shadow-[0_1px_2px_rgba(16,16,24,0.04)]" style={{ borderColor: `${accent}30` }}>
                <div className="text-4xl mb-3">{u.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{u.t}</h3>
                <p className="text-sm opacity-60">{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      {showListings && rows.length > 0 && (
        <section className="border-t" style={{ borderColor: `${accent}20` }}>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <SectionHeading
              title="Featured businesses"
              subtitle={`${total.toLocaleString("en-IN")} verified listings in Indore`}
              viewAllHref="/marketplace"
              viewAllLabel="Browse all"
            />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((b: any) => (
                <BusinessCard key={b.id} b={b} primary={primary} secondary={secondary} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
            {isCustomerSite ? `Find what you need on ${brand.name}` : `Get started today — join ${brand.name}`}
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            {isCustomerSite ? `Browse thousands of verified local businesses and services — all in one place.` : `Sign up free and start your journey with ${brand.name} — from home.`}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {isCustomerSite ? (
              <a href={`/marketplace`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>
                Browse Businesses →
              </a>
            ) : (
              <a href={`/register`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>
                Start free →
              </a>
            )}
            <a href={`/contact`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
              Contact us
            </a>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
