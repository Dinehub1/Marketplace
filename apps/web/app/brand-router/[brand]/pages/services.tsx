import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { ByBrandSlug, ServiceItem } from "@/lib/brand-content";

const BRAND_SERVICES: ByBrandSlug<ServiceItem> = {
  sarkarconnect: [
    { icon: "🔗", title: "B2B Connect", desc: "Connect with suppliers, buyers, and distributors — in the largest network of your industry." },
    { icon: "💼", title: "Digital Card", desc: "Your business's professional digital card — share via QR code, connect instantly." },
    { icon: "📋", title: "Product Catalog", desc: "List your products in a detailed catalog — with images, prices, and descriptions." },
    { icon: "📈", title: "Deal Management", desc: "Track every lead and deal — from proposal to close, end to end." },
    { icon: "🤖", title: "AI Matching", desc: "Our AI finds partners that match your needs — saving time and money." },
    { icon: "📊", title: "Analytics Dashboard", desc: "See your network's performance, deal success, and growth trends." },
  ],
  sarkarhealth: [
      { icon: "🩺", title: "Doctor Consultation", desc: "MBBS, MD, Ayurvedic — book video or in-person consultations with any specialist." },
      { icon: "💊", title: "Medicine Delivery", desc: "All branded and generic medicines — at your doorstep, with savings up to 40%." },
      { icon: "🏥", title: "Lab Tests", desc: "Blood, urine, ECG, X-Ray — sample collection from your home and digital reports." },
      { icon: "📋", title: "Health Profile", desc: "Your complete medical history in one place — share with your doctor in one click." },
      { icon: "👨‍⚕️", title: "Find a Doctor", desc: "Find the right doctor by specialty, experience, rating, and availability." },
      { icon: "🚑", title: "Emergency", desc: "24/7 emergency helpline — ambulance booking and immediate assistance." },
      { icon: "🧠", title: "Mental Health Counseling", desc: "Video counseling with licensed psychologists and counselors — confidential support for stress, anxiety, and depression." },
      { icon: "👵", title: "Senior Citizen Care", desc: "Elderly care at home — medication management, nursing support, regular check-ups, and companionship services." },
      { icon: "👶", title: "Pediatrician", desc: "Infant and child care from experienced pediatricians — vaccination, growth monitoring, illness treatment." },
    ],
  sarkardost: [
    { icon: "🏪", title: "Local Business Listing", desc: "List your shop, office, or service on Indore's largest digital directory." },
    { icon: "📢", title: "Lead Generation", desc: "Get potential customer details directly — instant notifications on WhatsApp and SMS." },
    { icon: "📊", title: "Business Analytics", desc: "Deep insight into your listing's performance, customer interactions, and competition." },
    { icon: "🎯", title: "Targeted Promotion", desc: "Reach customers by your area and category — budget-friendly advertising." },
    { icon: "📱", title: "Mobile Profile", desc: "A beautiful mobile-friendly profile page — your digital identity." },
    { icon: "🤝", title: "Community Networking", desc: "Connect with other local businesses, build collaboration, and promote each other." },
  ],
  followup: [
    { icon: "📅", title: "Reminder Setup", desc: "Set automated reminders across channels — WhatsApp, SMS, and email." },
    { icon: "📋", title: "Task Management", desc: "Create tasks, assign them, set deadlines, and track progress." },
    { icon: "🔄", title: "Automated Follow-up", desc: "AI-powered messages — remind customers on time without manual effort." },
    { icon: "📊", title: "Productivity Report", desc: "Daily and weekly reports — data on your team's progress." },
    { icon: "👥", title: "Team Coordination", desc: "Assign tasks to team members and work together." },
    { icon: "🔗", title: "Calendar Sync", desc: "Connect with Google Calendar, Outlook — your existing tools." },
  ],
  cloudplayer: [
    { icon: "🎬", title: "Media Streaming", desc: "Films, series, documentaries — stream on any device." },
    { icon: "☁️", title: "Cloud Library", desc: "Your entire media library safe in the cloud — access from anywhere." },
    { icon: "📡", title: "Live Broadcast", desc: "Live events and webinars — reach thousands of viewers at once." },
    { icon: "📱", title: "Offline Download", desc: "Even without internet — download to watch offline." },
    { icon: "🔊", title: "Premium Audio", desc: "Dolby Atmos, surround sound — a cinema-like experience." },
    { icon: "👨‍👩‍👧", title: "Family Plan", desc: "Up to 5 members — one account, multiple profiles." },
  ],
  paisaflow: [
    { icon: "💸", title: "Investment Plan", desc: "Mutual funds, FD, stocks — a portfolio tailored to your goals." },
    { icon: "📈", title: "Portfolio Tracking", desc: "Real-time updates — all your investments in one dashboard." },
    { icon: "🎯", title: "Goal-Based Plan", desc: "Home, wedding, child's education — a custom plan for every goal." },
    { icon: "🛡️", title: "Risk Management", desc: "AI-based risk score — guidance for safe investing." },
    { icon: "📊", title: "Return Analytics", desc: "Your investment performance — comparison and improvement suggestions." },
    { icon: "🏦", title: "Bank Link", desc: "Direct connection with all major banks — fast and secure." },
  ],
  yaadrakh: [
    { icon: "🧠", title: "AI Notes", desc: "AI creates notes from conversations — organized and searchable." },
    { icon: "⏰", title: "Smart Reminder", desc: "The right reminder at the right time — never forget anything." },
    { icon: "🔄", title: "Cross-Device Sync", desc: "Phone, tablet, laptop — a consistent experience everywhere." },
    { icon: "🔍", title: "Smart Search", desc: "Find any note or task instantly — with AI." },
    { icon: "📊", title: "Dashboard", desc: "Data on your productivity — suggestions to improve." },
    { icon: "🔒", title: "Encryption", desc: "Everything you have is encrypted — security first." },
  ],
  "sarkar-ai": [
    { icon: "🤖", title: "AI Assistant", desc: "An intelligent assistant available 24/7 — questions, advice, tasks." },
    { icon: "⚡", title: "Instant Answers", desc: "Response in milliseconds — no waiting." },
    { icon: "🧠", title: "Context Understanding", desc: "AI remembers the context of conversations — intelligent dialogue." },
    { icon: "🔧", title: "Task Automation", desc: "Repetitive tasks — let AI do them while you focus." },
    { icon: "🌐", title: "Multilingual", desc: "Hindi, English, and 10+ languages — in your language." },
    { icon: "🔗", title: "API Access", desc: "API for developers — integrate AI into your apps." },
  ],
  sarkarfood: [
    { icon: "🍔", title: "Online Order", desc: "50+ restaurants — browse, order, and relax." },
    { icon: "⚡", title: "Fast Delivery", desc: "Hot food in 30 minutes — within the promised time." },
    { icon: "💰", title: "Budget Menu", desc: "Starting at ₹99 — for every pocket." },
    { icon: "🌿", title: "Special Filters", desc: "Jain, Mughlai, Continental — by taste." },
    { icon: "📍", title: "Live Tracking", desc: "Live order status — from partner to your door." },
    { icon: "🎁", title: "Rewards", desc: "Points on every order — earn free food." },
  ],
  sarkarfinance: [
    { icon: "🏦", title: "Personal Loan", desc: "₹10,000 to ₹10 lakh — instant approval, minimal documents." },
    { icon: "📱", title: "Online Application", desc: "Complete process from home — photo upload, verification." },
    { icon: "💳", title: "EMI Calculator", desc: "Know in advance — how much EMI, how much interest." },
    { icon: "📊", title: "Credit Score", desc: "Free CIBIL score check — tips to improve." },
    { icon: "🤝", title: "Financial Advice", desc: "Registered advisors — loans, insurance, investment." },
    { icon: "🔒", title: "Security", desc: "Bank-level encryption — your data is safe." },
  ],
  sarkarpay: [
    { icon: "💰", title: "Payment Gateway", desc: "UPI, card, net banking — all modes in one place." },
    { icon: "⚡", title: "Instant Settlement", desc: "T+0 — sales credited to your bank instantly." },
    { icon: "📊", title: "Dashboard", desc: "Daily sales, refunds, chargebacks — in one place." },
    { icon: "🔒", title: "Security", desc: "PCI DSS compliant — every transaction secure." },
    { icon: "📈", title: "Analytics", desc: "Sales trends, best hours — decide with data." },
    { icon: "🌐", title: "International", desc: "Accept payments in foreign currency too." },
  ],
  sarkarmart: [
    { icon: "🛍️", title: "Online Store", desc: "200+ local brands — unique products." },
    { icon: "🚚", title: "Delivery", desc: "Across the city within 24 hours." },
    { icon: "💸", title: "Cashback", desc: "5-20% cashback on every purchase." },
    { icon: "⭐", title: "Reviews", desc: "Verified reviews — make the right decision." },
    { icon: "🎁", title: "Offers", desc: "Weekend deals and special discounts." },
    { icon: "🔄", title: "Returns", desc: "Easy returns within 7 days." },
  ],
  sarkarlegal: [
    { icon: "⚖️", title: "Consultation", desc: "Experienced lawyers — civil, criminal, corporate." },
    { icon: "📋", title: "Documents", desc: "Agreements, affidavits — free templates." },
    { icon: "🏛️", title: "Court", desc: "Representation in Indore courts." },
    { icon: "📱", title: "Online", desc: "Consultation over video call — from home." },
    { icon: "💰", title: "Fees", desc: "Transparent — first consultation free." },
    { icon: "🔒", title: "Confidentiality", desc: "Case information is fully confidential." },
  ],
  "justdial-agent": [
    { icon: "📇", title: "Directory", desc: "3,233+ businesses — Indore's largest listing." },
    { icon: "📊", title: "Analytics", desc: "Market trends and competition insights." },
    { icon: "🎯", title: "Leads", desc: "Information on potential customers." },
    { icon: "📱", title: "Profile", desc: "Mobile-friendly business profile." },
    { icon: "🏆", title: "Ranking", desc: "Top the charts with premium listing." },
    { icon: "🤝", title: "B2B", desc: "Connect with suppliers and buyers." },
  ],
  sarkarmarketplace: [
    { icon: "🧭", title: "Directory", desc: "3,233+ businesses — in every category." },
    { icon: "🔍", title: "Search", desc: "Name, category, location — find instantly." },
    { icon: "📱", title: "Mobile", desc: "Access from any device." },
    { icon: "⭐", title: "Reviews", desc: "Community ratings." },
    { icon: "📊", title: "Analytics", desc: "Data on business performance." },
    { icon: "🤝", title: "Network", desc: "Connect with merchants and collaborate." },
  ],
  ayurvedicwebsite: [
    { icon: "🪷", title: "Products", desc: "Pure Ayurvedic — chemical-free." },
    { icon: "🏆", title: "Certification", desc: "AYUSH certified — guaranteed quality." },
    { icon: "👨‍⚕️", title: "Consultation", desc: "Free consultation with a Vaidya." },
    { icon: "📦", title: "Delivery", desc: "Across India — free on ₹499+." },
    { icon: "🌿", title: "Supplements", desc: "Ashwagandha, Brahmi, Triphala." },
    { icon: "💰", title: "Pricing", desc: "Starting at ₹99 — for every pocket." },
  ],
  sarkarghar: [
    { icon: "🏠", title: "Listings", desc: "500+ properties — apartments, villas, plots." },
    { icon: "🔍", title: "Search", desc: "By location, budget, size." },
    { icon: "📊", title: "Pricing", desc: "AI estimate — know before buying." },
    { icon: "📋", title: "Legal", desc: "Document verification and registration." },
    { icon: "🏦", title: "Loan", desc: "Bank loan assistance." },
    { icon: "📱", title: "Tour", desc: "360° virtual tour." },
  ],
  sarkarskills: [
    { icon: "🛠️", title: "Training", desc: "Digital marketing, AI, e-commerce." },
    { icon: "🎓", title: "Certificate", desc: "On completion of training." },
    { icon: "👨‍🏫", title: "Trainers", desc: "With 10+ years of experience." },
    { icon: "📱", title: "Convenience", desc: "Both online and offline." },
    { icon: "💼", title: "Placement", desc: "60% of students get jobs." },
    { icon: "💰", title: "Installments", desc: "Starting at ₹500/month." },
  ],
  "hyperframes-realestate": [
    { icon: "🎥", title: "Video Tour", desc: "4K video — view property from afar." },
    { icon: "🗺️", title: "Location", desc: "Google Maps — see the surroundings." },
    { icon: "📊", title: "Pricing", desc: "Per square foot rate and trends." },
    { icon: "🤝", title: "Agent", desc: "From an experienced real estate agent." },
    { icon: "📋", title: "Documents", desc: "Registration and legal assistance." },
    { icon: "💰", title: "Loan", desc: "15+ bank partners." },
  ],
  sikshahub: [
    { icon: "📚", title: "Content", desc: "CBSE, ICSE, MP Board — classes 1-12." },
    { icon: "🎥", title: "Classes", desc: "Recorded videos — anytime, anywhere." },
    { icon: "📝", title: "Practice", desc: "Questions and tests." },
    { icon: "👨‍🏫", title: "Tuition", desc: "Live sessions — ask questions directly." },
    { icon: "📊", title: "Reports", desc: "Progress for parents." },
    { icon: "💰", title: "Fees", desc: "From ₹199/month." },
  ],
  sarkartravel: [
    { icon: "✈️", title: "Booking", desc: "Flights, hotels, packages — domestic and international." },
    { icon: "💰", title: "Rates", desc: "Compare — save thousands of rupees." },
    { icon: "📅", title: "Flexibility", desc: "Change or cancel dates." },
    { icon: "🎒", title: "Packages", desc: "Honeymoon, family, adventure." },
    { icon: "📱", title: "Support", desc: "24/7 support." },
    { icon: "🛡️", title: "Insurance", desc: "Travel insurance — safety at every step." },
  ],
  sarkardukaan: [
    { icon: "🛒", title: "Store", desc: "Online shop — ready in minutes." },
    { icon: "📱", title: "Management", desc: "Everything from your phone." },
    { icon: "🚚", title: "Delivery", desc: "Across the city." },
    { icon: "💳", title: "Payment", desc: "UPI, card, COD." },
    { icon: "📊", title: "Stock", desc: "Track inventory." },
    { icon: "📈", title: "Analytics", desc: "Sales data." },
  ],
  sarkarbazaar: [
    { icon: "🏪", title: "Merchants", desc: "1,000+ local merchants." },
    { icon: "🌐", title: "Export", desc: "Local products worldwide." },
    { icon: "📱", title: "App", desc: "Easy ordering app." },
    { icon: "💰", title: "Pricing", desc: "Wholesale rates — special." },
    { icon: "🚚", title: "Shipping", desc: "Across India." },
    { icon: "🤝", title: "Network", desc: "B2B connections." },
  ],
  sarkarjobs: [
    { icon: "💼", title: "Jobs", desc: "Matches based on your qualification." },
    { icon: "🏢", title: "Companies", desc: "500+ verified employers." },
    { icon: "📝", title: "Resume", desc: "Professional templates." },
    { icon: "🎯", title: "Advice", desc: "Career counselor." },
    { icon: "📊", title: "Tests", desc: "Skill assessment." },
    { icon: "💰", title: "Salary", desc: "Industry standard comparison." },
  ],
  sarkared: [
    { icon: "🎓", title: "Courses", desc: "Digital marketing, AI, web." },
    { icon: "👨‍🏫", title: "Trainers", desc: "10+ years of experience." },
    { icon: "📜", title: "Certificate", desc: "Certificate — power in your career." },
    { icon: "💼", title: "Jobs", desc: "70% placement." },
    { icon: "📱", title: "Online", desc: "Anytime, anywhere." },
    { icon: "💰", title: "Installments", desc: "From ₹499/month." },
  ],
  sarkarsarkar: [
    { icon: "🏛️", title: "Services", desc: "Aadhaar, PAN, passport, ration." },
    { icon: "📋", title: "Application", desc: "Help filling out forms." },
    { icon: "📱", title: "Tracking", desc: "Status live." },
    { icon: "💰", title: "Schemes", desc: "Information on government schemes." },
    { icon: "🤝", title: "Complaint", desc: "Register grievance." },
    { icon: "📞", title: "Helpline", desc: "Immediate assistance." },
  ],
  sarkarwellness: [
    { icon: "🌿", title: "Treatment", desc: "Panchakarma, yoga, pranayama." },
    { icon: "👨‍⚕️", title: "Consultation", desc: "Personalized plan from a Vaidya." },
    { icon: "🧘", title: "Yoga", desc: "Daily classes." },
    { icon: "🥗", title: "Diet", desc: "Ayurvedic nutrition." },
    { icon: "🌱", title: "Herbs", desc: "Pure and natural." },
    { icon: "📊", title: "Tracking", desc: "Health progress." },
  ],
};

const DEFAULT_SERVICES: ServiceItem[] = [
  { icon: "⭐", title: "Premium Quality", desc: "Only the best for our customers. We never compromise on quality." },
  { icon: "🚀", title: "Fast Delivery", desc: "Quick and reliable service that respects your time." },
  { icon: "💬", title: "24/7 Support", desc: "Our team is always here to help you, any time of day." },
  { icon: "🔒", title: "Secure & Safe", desc: "Your data and transactions are protected with enterprise-grade security." },
  { icon: "💡", title: "Innovation First", desc: "We constantly improve our offerings with the latest technology." },
  { icon: "🤝", title: "Trusted by Thousands", desc: "Join our community of satisfied customers across India." },
];

export function ServicesPage({ brand }: { brand: Brand }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const services = BRAND_SERVICES[brand.slug] ?? (brand.services_json ?? DEFAULT_SERVICES);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "var(--brand-gradient)" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>Our Services</div>
          <h1 className="heading-xl mb-6"><span style={{ color: "var(--brand-secondary)" }}>{brand.name} — what can it do for you?</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">
          Complete healthcare from home — meet doctors, get medicines, access reports — all in one place.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i: number) => (
              <div key={i} className="card-lift rounded-2xl border bg-surface p-6 h-full" style={{ borderColor: "var(--hairline)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>{s.icon ?? "✦"}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--brand-secondary)" }}>{s.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{s.desc}</p>
                {s.price && <p className="mt-3 text-sm font-semibold" style={{ color: "var(--brand-secondary)" }}>{s.price}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>How It Works</p>
            <h2 className="heading-md mb-4" style={{ color: "var(--brand-secondary)" }}>Simple and Straightforward Process</h2>
            <p className="text-body max-w-2xl mx-auto">Take your business online in just a few steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: "1", t: "Sign Up", d: "Create an account in minutes with your mobile number" },
              { n: "2", t: "Fill Details", d: "Add your business information, photos, and services" },
              { n: "3", t: "Get Verified", d: "Our team will verify your information — for security" },
              { n: "4", t: "Go Live", d: "Now every customer in Indore can find you!" },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white mx-auto mb-4 shadow-lg" style={{ background: "var(--brand-gradient)" }}>{step.n}</div>
                <h3 className="font-bold mb-1" style={{ color: "var(--brand-secondary)" }}>{step.t}</h3>
                <p className="text-sm opacity-60">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
              <p className="text-white/80 mb-8">Create your family&apos;s health profile today — first consultation free!</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`/contact`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: "var(--brand-secondary)" }}>Contact Us →</a>
                <a href={`/pricing`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-surface/10 transition-colors">View Pricing</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
