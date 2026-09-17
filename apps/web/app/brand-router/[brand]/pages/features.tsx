import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { ByBrandSlug, FeatureItem } from "@/lib/brand-content";

const BRAND_FEATURES: ByBrandSlug<FeatureItem> = {
  sarkardost: [
    { icon: "📍", title: "Local Search", desc: "Shops, services and experts from every Indore neighborhood — all in one place, easy and fast." },
    { icon: "⭐", title: "Verified Reviews", desc: "Ratings and reviews from real customers — choose the right service with confidence." },
    { icon: "📢", title: "Live Updates", desc: "Job openings, local events and training news — delivered straight to you." },
    { icon: "💬", title: "Direct Contact", desc: "Talk directly to service providers, no middleman — via WhatsApp, call or message." },
    { icon: "🏆", title: "Community Ranking", desc: "Rankings and badges for top providers — a guaranteed best experience." },
    { icon: "📊", title: "Business Analytics", desc: "Track your listing's performance — views, leads and customer interactions in one dashboard." },
  ],
  sarkarconnect: [
    { icon: "🔗", title: "B2B Networking", desc: "Suppliers, manufacturers, distributors and retailers — all connected in one business network." },
    { icon: "💼", title: "Digital Card", desc: "Create a professional digital card for your business — share, connect and grow." },
    { icon: "📈", title: "Deal Tracking", desc: "A complete record of every lead, proposal and closed deal — data that powers your growth." },
    { icon: "🤝", title: "Business Matching", desc: "AI-based matching connects you with the right partners — businesses that fit your needs." },
    { icon: "📋", title: "Product Catalog", desc: "List your products and services in a catalog — visible across all of India." },
    { icon: "🔔", title: "Real-time Notifications", desc: "New connection requests, messages and deal updates — instant alerts." },
  ],
  sarkarhealth: [
    { icon: "🩺", title: "Video Consultation", desc: "Meet MBBS/MD doctors over video call — from home, available 24/7." },
    { icon: "💊", title: "Medicine Delivery", desc: "All medicines delivered to your door — save up to 40% with generic options." },
    { icon: "📋", title: "Health Records", desc: "Your complete medical history, secure — reports, prescriptions and appointments." },
    { icon: "🏥", title: "Lab Test Booking", desc: "Blood tests, X-ray, ECG — sample collection at home and reports online." },
    { icon: "👨‍⚕️", title: "Find a Doctor", desc: "Find the right doctor by specialty, experience and rating — in a click." },
    { icon: "🔔", title: "Appointment Reminders", desc: "Never miss an appointment — SMS and WhatsApp reminders." },
  ],
  followup: [
    { icon: "📅", title: "Smart Reminders", desc: "WhatsApp, SMS and email — multi-channel reminders so you never forget." },
    { icon: "📋", title: "Task Tracking", desc: "See every task's status, deadline and priority — all in one place." },
    { icon: "📊", title: "Progress Analytics", desc: "Daily, weekly and monthly reports — data on your productivity." },
    { icon: "🔄", title: "Automated Follow-up", desc: "AI-powered automated messages — remind customers without manual work." },
    { icon: "👥", title: "Team Coordination", desc: "Assign, track and work together with your team members." },
    { icon: "🔗", title: "Cross-platform Sync", desc: "Google Calendar, Notion, Trello — everything synced together." },
  ],
  cloudplayer: [
      { icon: "⚡", title: "Zero Buffering", desc: "Cloud-native architecture — instant play, no lag." },
      { icon: "☁️", title: "Cloud Storage", desc: "Your whole library in the cloud — from anywhere, on any device." },
      { icon: "🎬", title: "4K HDR Support", desc: "4K, HDR, Dolby Vision — cinema-standard streaming." },
      { icon: "📱", title: "Cross-platform", desc: "Android, iOS, Web, Smart TV — a consistent experience everywhere." },
      { icon: "🔊", title: "Dolby Audio", desc: "Surround sound experience — a cinematic audio experience." },
      { icon: "📡", title: "Live Streaming", desc: "Live events, sports and webinars — on any screen." },
      { icon: "💾", title: "Offline Download", desc: "Download your favorite content and watch without the internet." },
      { icon: "👥", title: "Multi-user Profiles", desc: "Create a separate profile for each family member and get personalized recommendations." },
      { icon: "👪", title: "Parental Controls", desc: "Set age-based filters and screen-time limits so streaming stays safe for kids." },
    ],
  paisaflow: [
    { icon: "💸", title: "Smart Investment", desc: "FDs, mutual funds, stocks — a portfolio matched to your risk." },
    { icon: "📈", title: "Real-time Tracking", desc: "Real-time updates on all your investments — in one dashboard." },
    { icon: "🎯", title: "Goal-based Planning", desc: "Home, marriage, retirement — a custom plan for every goal." },
    { icon: "🛡️", title: "Risk Analysis", desc: "AI-based risk score — for safer investing." },
    { icon: "📊", title: "Return Calculator", desc: "See what you'll earn before you invest — full transparency." },
    { icon: "🏦", title: "Bank Integration", desc: "Direct connection to all major banks — fast and secure." },
  ],
  yaadrakh: [
      { icon: "🧠", title: "AI Notes", desc: "AI listens to your words and turns them into organized, searchable notes." },
      { icon: "⏰", title: "Smart Reminders", desc: "Context-aware reminders — the right memory at the right time." },
      { icon: "🔄", title: "Cross-device Sync", desc: "Phone, tablet, laptop — a consistent experience everywhere." },
      { icon: "🔍", title: "Smart Search", desc: "Find any note, task or reminder instantly — with AI." },
      { icon: "📊", title: "Productivity Dashboard", desc: "See your daily and weekly productivity trends." },
      { icon: "🔒", title: "Privacy", desc: "Everything you store is encrypted — accessible only to you." },
      { icon: "🎤", title: "Voice-to-Text Notes", desc: "Speak to create notes — AI converts your speech to text in real time and organizes it." },
      { icon: "🏷️", title: "Smart Categories", desc: "AI automatically sorts your notes into categories — meetings, personal, work and more." },
      { icon: "🤝", title: "Shared Notes", desc: "Securely share notes with your team or family — real-time collaboration and comments." },
    ],
  "sarkar-ai": [
    { icon: "🤖", title: "AI Assistant", desc: "An intelligent assistant available 24/7 — answers your questions, advises and gets work done." },
    { icon: "⚡", title: "Instant Response", desc: "Answers in milliseconds — no waiting, no delay." },
    { icon: "🧠", title: "Context Understanding", desc: "AI remembers the context of your conversation — smarter each time, not starting fresh." },
    { icon: "🔧", title: "Task Automation", desc: "Repetitive tasks, emails, reports — let AI handle them while you focus." },
    { icon: "🌐", title: "Multilingual Support", desc: "Hindi, English and 10+ languages — converse in your own language." },
    { icon: "🔗", title: "API Integration", desc: "Connect with your existing tools — Zapier, Slack, WhatsApp and more." },
  ],
  sarkarfood: [
    { icon: "🍔", title: "Indore's Better Kitchens", desc: "50+ verified restaurants and home kitchens — for every taste." },
    { icon: "⚡", title: "30-Minute Delivery", desc: "Hot, fresh food — delivered on time, or free." },
    { icon: "💰", title: "Budget-Friendly", desc: "Starting at ₹99 — delicious meals for every budget." },
    { icon: "🌿", title: "Veg & Non-Veg", desc: "Filter by personal preference — Jain, Mughlai, Continental." },
    { icon: "📍", title: "Live Tracking", desc: "Track your order live — from the partner to your doorstep." },
    { icon: "🎁", title: "Rewards & Offers", desc: "Earn points on every order, refer friends and get up to ₹100." },
  ],
  sarkarfinance: [
    { icon: "🏦", title: "Instant Loan", desc: "From ₹10,000 to ₹10 lakh — fewer documents, faster approval." },
    { icon: "📱", title: "Digital Application", desc: "The whole process is online — apply from home and upload photos." },
    { icon: "💳", title: "Flexible Repayment", desc: "EMIs from 3 to 36 months — matched to what you can afford." },
    { icon: "📊", title: "Credit Score Check", desc: "Check your CIBIL score for free — with tips to improve it." },
    { icon: "🤝", title: "Financial Advice", desc: "Registered financial advisors — guidance on loans, insurance and investment." },
    { icon: "🔒", title: "Secure Data", desc: "Bank-grade encryption — your information stays safe." },
  ],
  sarkarpay: [
    { icon: "💰", title: "All Payment Modes", desc: "UPI, cards, net banking, EMI — everything on one platform." },
    { icon: "⚡", title: "Instant Settlement", desc: "T+0 settlement — your sales land in your bank instantly." },
    { icon: "📊", title: "Transactions Dashboard", desc: "Daily sales, refunds and chargebacks — all in one place." },
    { icon: "🔒", title: "PCI DSS Compliant", desc: "International security standards — every transaction is safe." },
    { icon: "📈", title: "Revenue Analytics", desc: "Analyze sales trends, best hours and customer behavior." },
    { icon: "🌐", title: "Multi-Currency", desc: "Beyond INR — accept international payments too." },
  ],
  sarkarmart: [
    { icon: "🛍️", title: "Indore's Merchants", desc: "200+ local brands and merchants — unique products in one place." },
    { icon: "🚚", title: "Fast Delivery", desc: "Within 24 hours across the city — free delivery on ₹499+." },
    { icon: "💸", title: "Cashback Offers", desc: "5-20% cashback on every purchase — savings that add up." },
    { icon: "⭐", title: "Verified Reviews", desc: "Ratings from real customers — make the right buying decision." },
    { icon: "🎁", title: "Weekend Deals", desc: "Saturday-Sunday special discounts — bookmark them, don't miss out." },
    { icon: "🔄", title: "Easy Returns", desc: "Returns within 7 days — full refund, no questions asked." },
  ],
  sarkarlegal: [
    { icon: "⚖️", title: "Lawyer Consultation", desc: "Experienced advocates on judiciary — civil, criminal, corporate." },
    { icon: "📋", title: "Document Drafting", desc: "Agreements, affidavits, police complaints — free templates available." },
    { icon: "🏛️", title: "Court Representation", desc: "Experienced lawyers in the Indore district and high courts." },
    { icon: "📱", title: "Online Consultation", desc: "Consultations over video call — from home, no queues." },
    { icon: "💰", title: "Transparent Fees", desc: "Known in advance — no hidden fees. First consultation is free." },
    { icon: "🔒", title: "Confidentiality", desc: "Your case details are completely confidential — attorney-client privilege." },
  ],
  "justdial-agent": [
    { icon: "📇", title: "Business Directory", desc: "3,233+ verified businesses — Indore's most comprehensive listing." },
    { icon: "📊", title: "Data Analytics", desc: "Deep insight into market trends, competition and customer behavior." },
    { icon: "🎯", title: "Lead Generation", desc: "Customer information — potential deals come straight to you." },
    { icon: "📱", title: "Mobile Routing", desc: "Manage your business's mobile-friendly profile." },
    { icon: "🏆", title: "Ranking Boost", desc: "Reach the top — more customers with a premium listing." },
    { icon: "🤝", title: "B2B Connection", desc: "Connect with suppliers and buyers — expand your business network." },
  ],
  sarkarmarketplace: [
    { icon: "🧭", title: "3,233+ Businesses", desc: "Indore's largest digital directory — across every category." },
    { icon: "🔍", title: "Smart Search", desc: "Name, category, location — search instantly, find instantly." },
    { icon: "📱", title: "Mobile-First", desc: "Access from any device — beautiful and fast." },
    { icon: "⭐", title: "Review System", desc: "Ratings from a trusted community — make the right decision." },
    { icon: "📊", title: "Business Analytics", desc: "Data on your business performance — views, leads." },
    { icon: "🤝", title: "Community Network", desc: "Merchants connect, collaborate and grow together." },
  ],
  ayurvedicwebsite: [
    { icon: "🪷", title: "100% Natural", desc: "Pure herbs and ayurvedic — chemical-free, safe, effective." },
    { icon: "🏆", title: "AYUSH Certified", desc: "All products certified to government standards — guaranteed quality." },
    { icon: "👨‍⚕️", title: "Vaidya Consultation", desc: "Free consultation with an experienced ayurvedic physician." },
    { icon: "📦", title: "Home Delivery", desc: "Delivery across India — free shipping on ₹499+." },
    { icon: "🌿", title: "Food Supplements", desc: "Ashwagandha, Brahmi, Triphala — traditional and modern." },
    { icon: "💰", title: "Budget-Friendly", desc: "Starting at ₹99 — wellness for every budget." },
  ],
  sarkarghar: [
    { icon: "🏠", title: "Property Listings", desc: "500+ verified properties — apartments, villas, plots." },
    { icon: "🔍", title: "Search by Location", desc: "Area, budget, size — tailored to your needs." },
    { icon: "📊", title: "Price Estimate", desc: "AI-based price estimate — know before you buy." },
    { icon: "📋", title: "Legal Assistance", desc: "Document verification, registration — help through the whole process." },
    { icon: "🏦", title: "Loan Assistance", desc: "Bank loan facility — with you from application to approval." },
    { icon: "📱", title: "Virtual Tour", desc: "360° virtual tour — see the property from home and decide." },
  ],
  sarkarskills: [
    { icon: "🛠️", title: "Vocational Training", desc: "Digital marketing, e-commerce, AI — future-ready skills." },
    { icon: "🎓", title: "Completion Certificates", desc: "A certificate on completing training — strength in employment." },
    { icon: "👨‍🏫", title: "Industry Experts", desc: "Trainers with 10+ years of experience — practical knowledge." },
    { icon: "📱", title: "Online & Offline", desc: "Classes and in-person workshops — at your convenience." },
    { icon: "💼", title: "Job Assistance", desc: "Placement support — 60% of students land jobs after training." },
    { icon: "💰", title: "Installment Plan", desc: "Starting at ₹500/month — education is an investment, not a burden." },
  ],
  "hyperframes-realestate": [
    { icon: "🎥", title: "Video Tour", desc: "View properties from afar — 4K video delivered to you worldwide." },
    { icon: "🗺️", title: "Virtual Location", desc: "Google Maps integration — see the property's location and surroundings." },
    { icon: "📊", title: "Price Analytics", desc: "Per-square-foot rates, market trends — know before you buy." },
    { icon: "🤝", title: "Agent Matching", desc: "Connect with experienced real estate agents — directly, no middlemen." },
    { icon: "📋", title: "Document Assistance", desc: "Registration, stamp duty — complete legal assistance." },
    { icon: "💰", title: "Home Loan Assistance", desc: "15+ bank partners — from loan application to approval." },
  ],
  sikshahub: [
    { icon: "📚", title: "Course Material", desc: "CBSE, ICSE, MP Board — complete material from class 1 to 12." },
    { icon: "🎥", title: "Video Classes", desc: "Recorded classes from experienced teachers — anytime, anywhere." },
    { icon: "📝", title: "Practice Questions", desc: "Questions and tests for every chapter — fully prepared." },
    { icon: "👨‍🏫", title: "Live Tuition", desc: "Ask teachers directly — weekly live sessions." },
    { icon: "📊", title: "Progress Tracking", desc: "Data on the child's preparation — reports for parents." },
    { icon: "💰", title: "Affordable", desc: "Starting at ₹199/month — quality education for every home." },
  ],
  sarkartravel: [
    { icon: "✈️", title: "Domestic & International", desc: "Across India and abroad — flights, hotels, packages." },
    { icon: "💰", title: "Best Rates", desc: "Compare and search — save thousands of rupees." },
    { icon: "📅", title: "Flexible Booking", desc: "Change or cancel dates — with minimal fees." },
    { icon: "🎒", title: "Travel Packages", desc: "Honeymoon, family, adventure — special packages." },
    { icon: "📱", title: "24/7 Support", desc: "Any issue during travel — we're available." },
    { icon: "🛡️", title: "Travel Insurance", desc: "Protection on every trip." },
  ],
  sarkardukaan: [
    { icon: "🛒", title: "Digital Store", desc: "An online store for your shop — ready in minutes." },
    { icon: "📱", title: "Mobile Management", desc: "Orders, stock and payments from your phone — everything in hand." },
    { icon: "🚚", title: "Delivery Network", desc: "Delivery across the city — on your own or through partners." },
    { icon: "💳", title: "Digital Payments", desc: "UPI, cards, COD — however the customer prefers." },
    { icon: "📊", title: "Stock Management", desc: "Track inventory and records — never run out of a product." },
    { icon: "📈", title: "Sales Analytics", desc: "Daily sales, best products — decide with data." },
  ],
  sarkarbazaar: [
    { icon: "🏪", title: "Local Merchants", desc: "1,000+ merchants in Indore — food, apparel, electronics." },
    { icon: "🌐", title: "Global Reach", desc: "Local products worldwide — a platform for export." },
    { icon: "📱", title: "Order App", desc: "An easy app for customers — browse, order, track." },
    { icon: "💰", title: "Competitive Pricing", desc: "Wholesale rates — special for merchants." },
    { icon: "🚚", title: "Shipping Assistance", desc: "Shipping across India — DTDC, Delhivery partners." },
    { icon: "🤝", title: "Business Network", desc: "Suppliers and retailers — a platform for B2B connections." },
  ],
  sarkarjobs: [
    { icon: "💼", title: "Job Alerts", desc: "Jobs matched to your skills and location — instant alerts." },
    { icon: "🏢", title: "Verified Companies", desc: "500+ registered employers — fraud-free." },
    { icon: "📝", title: "Resume Builder", desc: "Professional resume templates — ready in a click." },
    { icon: "🎯", title: "Career Advice", desc: "Experienced career counselors — free guidance." },
    { icon: "📊", title: "Skill Assessment", desc: "Online tests — know your abilities and improve." },
    { icon: "💰", title: "Salary Comparison", desc: "Industry standards for the same role — ask for what's right." },
  ],
  sarkared: [
    { icon: "🎓", title: "Career-Oriented", desc: "Digital marketing, AI, web development — employable skills." },
    { icon: "👨‍🏫", title: "Industry Faculty", desc: "10+ years of experience — practical and theoretical knowledge." },
    { icon: "📜", title: "Certification", desc: "A certificate on completing training — strength for your career." },
    { icon: "💼", title: "Placement Assistance", desc: "70% of students land jobs after completing training." },
    { icon: "📱", title: "Online Convenience", desc: "Learn anytime, anywhere — on mobile or laptop." },
    { icon: "💰", title: "Installment Plan", desc: "Starting at ₹499/month — education is no burden." },
  ],
  sarkarsarkar: [
    { icon: "🏛️", title: "Government Services", desc: "Aadhaar, PAN, passport, ration card — all in one place." },
    { icon: "📋", title: "Application Help", desc: "Help filling forms — document checks and submission." },
    { icon: "📱", title: "Status Tracking", desc: "Live application status — always know when it'll arrive." },
    { icon: "💰", title: "Schemes", desc: "Information on government schemes — eligibility and benefits." },
    { icon: "🤝", title: "Grievance Redressal", desc: "Register grievances — tracking and resolution help." },
    { icon: "📞", title: "Helpline", desc: "Information on government services — instant help." },
  ],
  sarkarwellness: [
    { icon: "🌿", title: "Ayurvedic Treatments", desc: "Panchakarma, yoga, pranayama — ancient remedies, modern method." },
    { icon: "👨‍⚕️", title: "Vaidya Consultation", desc: "Experienced ayurvedic physician — a personalized health plan." },
    { icon: "🧘", title: "Yoga & Meditation", desc: "Daily yoga classes — physical and mental health." },
    { icon: "🥗", title: "Nutrition Advice", desc: "Ayurvedic diet plan — based on your dosha." },
    { icon: "🌱", title: "Herbs", desc: "Pure natural products — chemical-free." },
    { icon: "📊", title: "Health Tracking", desc: "Data on your health — see progress, stay motivated." },
  ],
};

const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "⚡", title: "Lightning Fast", desc: "Optimized for speed and performance. Every interaction feels instant." },
  { icon: "📱", title: "Mobile First", desc: "Designed for the way you work — flawless on every device." },
  { icon: "🔒", title: "Secure by Default", desc: "Enterprise-grade security protecting your data 24/7." },
  { icon: "📊", title: "Smart Analytics", desc: "Real-time insights that help you make better decisions." },
  { icon: "🔗", title: "Easy Integrations", desc: "Connect with the tools you already use seamlessly." },
  { icon: "🌐", title: "Global Scale", desc: "Serve customers anywhere in the world without limits." },
  { icon: "🤖", title: "AI Powered", desc: "Smart automation that saves you time and effort." },
  { icon: "💳", title: "Easy Payments", desc: "UPI, cards, net banking — pay however you prefer." },
];

export function FeaturesPage({ brand }: { brand: Brand }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const features = BRAND_FEATURES[brand.slug] ?? (brand.features_json ?? DEFAULT_FEATURES);

  // Brand-specific stats for the stats bar
    const brandStatsBar: Record<string, Array<{ v: string; l: string }>> = {
      sarkarhealth: [
        { v: "50+", l: "Verified Doctors" },
        { v: "5,000+", l: "Active Patients" },
        { v: "4.9★", l: "Average Rating" },
        { v: "24/7", l: "Helpline" },
      ],
    };
    const statsBar = brandStatsBar[brand.slug] ?? [
      { v: "500+", l: "Local Businesses" },
      { v: "25,000+", l: "Active Users" },
      { v: "4.8★", l: "Avg Rating" },
      { v: "24/7", l: "Support" },
    ];

  // Brand-specific how it works
    const brandHowItWorks: Record<string, Array<{ t: string; d: string }>> = {
      sarkarhealth: [
        { t: "Describe Symptoms", d: "Tell us about your illness — AI matches you with the right doctor." },
        { t: "Meet on Video Call", d: "A secure video consultation — your privacy stays intact." },
        { t: "Prescription & Medicine", d: "Get a digital prescription and order medicines to your door." },
      ],
    };
    const howItWorks = brandHowItWorks[brand.slug] ?? [
      { t: "Sign Up in Minutes", d: "Create an account with no credit card — just your mobile number." },
      { t: "Add Your Listing", d: "Enter your shop, service or skill details and go live instantly." },
      { t: "Get Customers & Grow", d: "Get leads, collect reviews and become known in your community." },
    ];

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="aurora" />
        <div className="grid-pattern absolute inset-0 -z-10 opacity-60" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="chip chip-brand mb-6">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand-secondary)" }} aria-hidden="true" />
            {brand.name} Features
          </div>
          <h1 className="heading-xl mb-4">
            Why is {brand.name} <span className="gradient-text">Different</span>?
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">
            Special features built for the Indore community — designed to make your business and life easier.
          </p>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i: number) => (
            <div
              key={i}
              className={`card-lift group rounded-2xl border bg-surface p-6 shadow-sm ${i === 0 || i === 4 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
              style={{ borderColor: "var(--hairline)" }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform ${i === 0 || i === 4 ? 'w-16 h-16 text-3xl' : ''}`} style={{ background: `linear-gradient(135deg, ${primary}12, ${secondary}08)` }}>
                {f.icon ?? "✦"}
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "var(--brand-secondary)" }}>{f.title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="section-tight">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
              {statsBar.map((s) => (
                <div key={s.l}>
                  <div className="text-2xl md:text-4xl font-extrabold mb-1">{s.v}</div>
                  <div className="text-sm opacity-70">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>How it works</p>
            <h2 className="heading-md" style={{ color: "var(--brand-secondary)" }}>Get started in three easy steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold animate-pulse-glow" style={{ background: "var(--brand-gradient)" }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--brand-secondary)" }}>{step.t}</h3>
                <p className="text-sm opacity-50">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
                Join {brand.name} today
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Thousands of Indore&apos;s patients are already connected — when will you join?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`/register`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: "var(--brand-secondary)" }}>
                  Get started free →
                </a>
                <a href={`/contact`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-surface/10 transition-colors">
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
