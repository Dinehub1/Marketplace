import { brandPublishesDirectory } from "@/lib/brand-categories";
import { BrandHeader, BrandFooter } from "./brand-header";
import type { Brand } from "@/lib/brands";
import { getBrandBusinesses } from "@/lib/brands";
import { BusinessCard } from "@/components/directory/BusinessCard";
import { SectionHeading } from "@/components/directory/SectionHeading";

export async function BrandLanding({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";

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

  // Same predicate the router uses to decide whether /marketplace exists.
  const isCustomerSite = brandPublishesDirectory(brand);

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
    <div className="flex min-h-screen flex-col">
      <BrandHeader brand={brand} />

      {/* ── Hero ──────────────────────────────────────────────────────────
          Ambient brand light rather than a decorative blob: two soft radial
          pools read as light falling into a room, one blob reads as a graphic.
          The grid is masked so it fades out instead of hitting a hard edge. */}
      <section className="relative isolate overflow-hidden">
        <div className="aurora" />
        <div className="grid-pattern absolute inset-0 -z-10 opacity-60" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 text-center md:pb-28 md:pt-28">
          <span className="chip chip-brand mb-7">
            {brand.emoji && <span className="text-[0.9375rem] leading-none">{brand.emoji}</span>}
            <span className="font-[620]">{brand.name}</span>
          </span>

          <h1 className="heading-hero">{hero.headline}</h1>

          <p className="text-lede mx-auto mt-6 max-w-2xl">{hero.subheadline}</p>

          {/* Primary action first and visually dominant; the secondary is a
              real alternative, not a second primary competing for the eye. */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={isCustomerSite ? "/marketplace" : "/login"} className="btn-primary btn-lg">
              {isCustomerSite ? "Browse businesses" : "Get started"}
              <span aria-hidden="true">→</span>
            </a>
            <a href="/about" className="btn-secondary btn-lg">Learn more</a>
          </div>

          {/* Capability chips. Specific labels ("2,431 listings") beat generic
              ones ("Lots of listings") — specificity is what creates trust. */}
          {(brand.features?.leads || brand.features?.payments || showListings) && (
            <div className="mt-9 flex flex-wrap justify-center gap-2">
              {showListings && (
                <span className="chip tabular">{total.toLocaleString("en-IN")} verified listings</span>
              )}
              {brand.features?.leads && <span className="chip">Lead capture</span>}
              {brand.features?.payments && <span className="chip">UPI payments</span>}
            </div>
          )}
        </div>

        {/* Highlights. Promoted out of the hero chip-soup into a real three-up
            card row: they are the product's substance, not decoration, and at
            chip size nobody read past the emoji. */}
        {hero.highlights.length > 0 && (
          <div className="relative mx-auto max-w-6xl px-6 pb-20">
            <div className="grid gap-4 md:grid-cols-3">
              {hero.highlights.map((h: string, i: number) => {
                const icon = h.split(" ")[0];
                const rest = h.substring(h.indexOf(" ") + 1);
                const [title, ...body] = rest.split(" — ");
                return (
                  <div key={i} className="card p-6 text-left">
                    <span
                      className="mb-4 grid h-11 w-11 place-items-center rounded-xl text-[1.25rem]"
                      style={{ background: "var(--brand-tint)" }}
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                    <h3 className="heading-sm">{title}</h3>
                    {body.length > 0 && (
                      <p className="mt-1.5 text-[0.875rem]" style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>
                        {body.join(" — ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Trust stats ───────────────────────────────────────────────────
          Figures are tabular so the column edges align; proportional numerals
          shift a "1" by nearly a full character and make a stat row look
          accidentally ragged. */}
      <section style={{ borderTop: "1px solid var(--hairline)", background: "var(--surface-sunken)" }}>
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {stats.map((s, i) => (
              <div key={i} className="card p-6 text-center">
                <div className="mb-2 text-[1.375rem]" aria-hidden="true">{s.icon}</div>
                <div
                  className="tabular gradient-text"
                  style={{ fontSize: "clamp(1.5rem, 1.2rem + 1.1vw, 2rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
                >
                  {s.v}
                </div>
                <div className="mt-1.5 text-[0.8125rem]" style={{ color: "var(--ink-3)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────
          The connector line between steps encodes sequence spatially, so the
          order is legible before a single word is read. */}
      <section style={{ borderTop: "1px solid var(--hairline)" }}>
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <div className="mb-14 text-center">
            <p className="eyebrow mb-3">How it works</p>
            <h2 className="heading-lg">Start in three easy steps</h2>
          </div>

          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            <div
              className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-px md:block"
              style={{ background: "linear-gradient(90deg, transparent, var(--brand-hairline) 12%, var(--brand-hairline) 88%, transparent)" }}
              aria-hidden="true"
            />
            {steps.map((step) => (
              <div key={step.n} className="relative text-center">
                <div
                  className="tabular mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl text-[1.5rem] font-[720] text-white"
                  style={{ background: "var(--brand-gradient)", boxShadow: "var(--shadow-brand)", letterSpacing: "-0.02em" }}
                >
                  {step.n}
                </div>
                <h3 className="heading-sm">{step.t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-[0.9375rem]" style={{ color: "var(--ink-2)", lineHeight: 1.6, textWrap: "pretty" }}>
                  {step.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community ─────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--hairline)", background: "var(--surface-sunken)" }}>
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="mb-12 text-center">
            <p className="eyebrow mb-3">Join the community</p>
            <h2 className="heading-lg">Who uses {brand.name}?</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {community.map((u, i) => (
              <div key={i} className="card p-6">
                <span
                  className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-[1.5rem]"
                  style={{ background: "var(--brand-tint)" }}
                  aria-hidden="true"
                >
                  {u.icon}
                </span>
                <h3 className="heading-sm">{u.t}</h3>
                <p className="mt-1.5 text-[0.875rem]" style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ─────────────────────────────────────────── */}
      {showListings && rows.length > 0 && (
        <section style={{ borderTop: "1px solid var(--hairline)" }}>
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <SectionHeading
              eyebrow="Directory"
              title="Featured businesses"
              subtitle={`${total.toLocaleString("en-IN")} verified listings in Indore`}
              viewAllHref={isCustomerSite ? "/marketplace" : "/contact"}
              viewAllLabel="Browse all"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((b) => (
                <BusinessCard key={b.id} b={b} primary={primary} secondary={secondary} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* The page-level CTA section that used to sit here was a near-verbatim
          duplicate of the one BrandFooter already renders — two full-width
          brand-gradient panels stacked back to back, asking for the same thing
          twice. Asking once, at the end, is the stronger ask. */}
      <BrandFooter brand={brand} />
    </div>
  );
}
