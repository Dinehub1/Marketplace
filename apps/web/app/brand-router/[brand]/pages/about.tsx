import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_ABOUT: Record<string, { story: string; mission: string; vision?: string; values: Array<{ icon: string; title: string; desc: string }>; whyChoose?: Array<{ title: string; desc: string }>; stats?: Array<{ label: string; value: string }> }> = {
  sarkarconnect: {
    story: "SarkarConnect was born from a question — millions of small and medium businesses across India exist, yet they lack access to the right B2B network.\n\nIn 2024, we launched SarkarConnect — a platform that connects merchants based on their industry, location, and needs.\n\nToday, SarkarConnect connects 10,000+ verified businesses across manufacturing, electronics, textiles, food processing, and dozens of other sectors. Hundreds of new deals close every month.",
    mission: "Our mission is to make B2B trade digital and transparent for India's MSMEs — so every merchant can reach the right partner, without middlemen.",
    values: [
      { icon: "🔗", title: "Connection", desc: "We don't just build a platform, we build relationships — we value every connection." },
      { icon: "✅", title: "Verification", desc: "Every business is verified — a real network for real merchants." },
      { icon: "📈", title: "Growth", desc: "Our goal is your growth — every feature is built to grow your business." },
      { icon: "🇮🇳", title: "India Tradition", desc: "We promote indigenous business — we are committed to Make in India." },
    ],
  },
  sarkarhealth: {
    story: "SarkarHealth began in a government hospital in Indore — where a young doctor noticed patients waiting hours to see the right doctor.\n\nIn 2025, we launched SarkarHealth — a digital healthcare platform that connects patients with verified doctors, lab tests, and medicine delivery.\n\nToday, SarkarHealth serves 50+ verified doctors, 10+ lab partners, and 5,000+ active patients — Indore's fastest-growing digital healthcare network.",
    mission: "Our mission is to provide every resident of Indore with affordable, quality healthcare — regardless of neighborhood or income level.",
    values: [
      { icon: "🩺", title: "Medical Responsibility", desc: "Every doctor is licensed and verified — your health is our responsibility." },
      { icon: "💰", title: "Affordability", desc: "Rates like a public hospital — with no hidden fees." },
      { icon: "🔒", title: "Privacy", desc: "Your health data is fully encrypted and secure." },
      { icon: "❤️", title: "Patient-Centric", desc: "Every feature is built for patient convenience — healthcare made easy." },
    ],
  },
  sarkardost: {
      story: "SarkarDost started in Indore — where two friends who met at a humble tea stall saw that local merchants struggled to reach their customers.\\n\\nIn 2024, we decided that every shopkeeper, service provider, and specialist in Indore deserves an equal platform — where they can find customers through their own merit, without paying the heavy fees of large platforms.\\n\\nToday SarkarDost connects 800+ local businesses, 40,000+ active users, and 25+ neighborhoods in Indore — a community where trust, locality, and technology come together. Our journey began at a small tea stall in Rajwada, where Raju bhai built his shop's online presence and saw 3x growth in his daily customers. Today, with that same spirit, we are committed to bringing digital success to every small business.",
      mission: "Our mission is to digitally empower every business in Indore — so they are no longer confined to their locality and can reach customers across the whole city. We believe every local shop, whether a tea stall or a professional service, deserves to grow in the digital age.",
      vision: "To become Indore's most trusted local business network, where every merchant can connect with customers in their neighborhood and every citizen can easily discover services near them.",
      values: [
        { icon: "🤝", title: "Trust", desc: "Every listing and review is verified — we prioritize transparency." },
        { icon: "📍", title: "Localness", desc: "Indore first — every feature is built around the city's needs." },
        { icon: "🚀", title: "Simplicity", desc: "Technology should be simple — our platform can be run by merchants of any age." },
        { icon: "💚", title: "Community", desc: "We build relationships, not just business — we treat every interaction as equal." },
        { icon: "📈", title: "Growth", desc: "Merchants listed on our platform get an average of 60% more customers." },
      ],
      whyChoose: [
        { title: "Trusted Community", desc: "Build trust through verified listings and genuine customer reviews." },
        { title: "Local Focus", desc: "Every area of Indore — from Vijay Nagar to Rajwada — is served specially." },
        { title: "Simple Management", desc: "Manage your listings, appointments, and customer messages from a single dashboard." },
        { title: "Growth-Focused", desc: "Our marketing tools and analytics help expand your business." },
        { title: "Affordable Solution", desc: "Get the essential features without expensive platform fees — our pricing is designed for local merchants." },
      ],
      stats: [
        { label: "Active Merchants", value: "800+" },
        { label: "Monthly Users", value: "40,000+" },
        { label: "Areas Served", value: "25+" },
        { label: "Avg Customer Growth", value: "60%" },
        { label: "Verified Reviews", value: "15,000+" },
        { label: "Team Members", value: "15+" },
      ],
    },
  followup: {
    story: "FollowUp was born from a common problem — merchants, doctors, lawyers, and professionals have hundreds of clients, but deals fall through when follow-ups are forgotten.\n\nIn 2025, we launched FollowUp — a smart reminder and task management platform powered by AI.\n\nToday, FollowUp helps 2,000+ professionals organize their work — Indore's fastest-growing productivity tool.",
    mission: "Our mission is to help every professional automate their work — so they never miss a follow-up and can grow their business.",
    values: [
      { icon: "📅", title: "Smart", desc: "AI-powered reminders — the right message at the right time." },
      { icon: "🔄", title: "Automation", desc: "Repetitive tasks automated — save time." },
      { icon: "📊", title: "Data", desc: "Productivity data — suggestions to improve." },
      { icon: "🤝", title: "Team", desc: "Collaborate with your team — all together." },
    ],
  },
  cloudplayer: {
    story: "Cloud Player began when a media company saw that users were frustrated with buffering and lag in cloud streaming.\n\nIn 2024, we launched Cloud Player — zero-buffering streaming built on cloud-native architecture.\n\nToday, Cloud Player delivers 4K HDR content to 10,000+ active users — India's fastest cloud streaming platform.",
    mission: "Our mission is to give every Indian a premium media experience at an unbeatable value — without buffering.",
    values: [
      { icon: "⚡", title: "Speed", desc: "Zero buffering — instant play." },
      { icon: "☁️", title: "Cloud", desc: "Anywhere, on any device." },
      { icon: "🎬", title: "Quality", desc: "4K HDR — a cinematic experience." },
      { icon: "🔊", title: "Audio", desc: "Dolby Atmos — an immersive sound experience." },
    ],
  },
  paisaflow: {
    story: "PaisaFlow was born from a question — millions of Indians want to invest, but lack the right guidance.\n\nIn 2025, we launched PaisaFlow — a smart investment platform offering AI-based risk analysis.\n\nToday, PaisaFlow helps 5,000+ investors make the right investment decisions — Indore's most trusted financial platform.",
    mission: "Our mission is to provide every Indian with safe and profitable investment opportunities — from small investors to large.",
    values: [
      { icon: "💸", title: "Profit", desc: "Smart investing — better returns." },
      { icon: "🛡️", title: "Security", desc: "AI risk score — safe investing." },
      { icon: "📈", title: "Tracking", desc: "Real-time portfolio." },
      { icon: "🏦", title: "Bank", desc: "Connected to all major banks." },
    ],
  },
  yaadrakh: {
    story: "YaadRakh was born from a personal problem — life is so busy that something or the other is always forgotten.\n\nIn 2025, we launched YaadRakh — an AI-powered notes and reminder app that turns your thoughts into easy notes.\n\nToday, YaadRakh helps 3,000+ users remember their daily responsibilities — Indore's best productivity app.",
    mission: "Our mission is to help every person remember their daily responsibilities — with the help of AI.",
    values: [
      { icon: "🧠", title: "AI", desc: "AI notes — organized and searchable." },
      { icon: "⏰", title: "Reminder", desc: "Smart reminders — never forget." },
      { icon: "🔄", title: "Sync", desc: "Cross-device — everywhere." },
      { icon: "🔒", title: "Security", desc: "Encrypted — just yours." },
    ],
  },
  "sarkar-ai": {
    story: "Sarkar AI was born in 2024 — when AI technology advanced rapidly in India.\n\nWe saw that small merchants and teachers lacked the means to use AI — Sarkar AI bridged that gap.\n\nToday, Sarkar AI provides 2,000+ users with an AI assistant, task automation, and multilingual support.",
    mission: "Our mission is to give every Indian the benefit of AI technology — simple, affordable, and effective.",
    values: [
      { icon: "🤖", title: "AI", desc: "Available 24/7 — an intelligent assistant." },
      { icon: "⚡", title: "Fast", desc: "Answers in milliseconds." },
      { icon: "🌐", title: "Language", desc: "Hindi and 10+ languages." },
      { icon: "🔧", title: "Automation", desc: "Tasks automated — save time." },
    ],
  },
  sarkarfood: {
    story: "SarkarFood began in 2024 — to bring Indore's delicious food to every home.\n\nWe saw that local restaurants and home cooks have to pay heavy fees to large platforms just to reach customers.\n\nToday, SarkarFood connects 50+ restaurants and 10,000+ active customers — Indore's own food platform.",
    mission: "Our mission is to bring Indore's delicious food to every home — with fast delivery and affordable prices.",
    values: [
      { icon: "🍔", title: "Taste", desc: "50+ kitchens — for every palate." },
      { icon: "⚡", title: "Fast", desc: "30-minute delivery." },
      { icon: "💰", title: "Affordable", desc: "Starting at ₹99." },
      { icon: "🎁", title: "Rewards", desc: "Points on every order." },
    ],
  },
  sarkarfinance: {
    story: "SarkarFinance was born in 2025 — when small merchants and individuals in India couldn't get loans on time.\n\nWe saw that traditional bank processes are complex and time-consuming — SarkarFinance simplified them.\n\nToday, SarkarFinance provides 3,000+ customers with instant loans and financial advice.",
    mission: "Our mission is to provide every Indian with timely financial assistance — without complex procedures.",
    values: [
      { icon: "🏦", title: "Instant", desc: "Instant approval — minimal documents." },
      { icon: "📱", title: "Digital", desc: "Online process — from home." },
      { icon: "💳", title: "Flexibility", desc: "EMI from 3 to 36 months." },
      { icon: "🔒", title: "Security", desc: "Bank-level encryption." },
    ],
  },
  sarkarpay: {
    story: "SarkarPay was born in 2024 — when UPI and digital payments transformed India.\n\nWe saw that small merchants struggle to collect payments — SarkarPay offered a simple solution.\n\nToday, SarkarPay gives 5,000+ merchants every payment mode in one place.",
    mission: "Our mission is to give every merchant a simple and secure payment solution — with no hidden fees.",
    values: [
      { icon: "💰", title: "Everything", desc: "UPI, card, net banking." },
      { icon: "⚡", title: "Instant", desc: "T+0 settlement." },
      { icon: "🔒", title: "Security", desc: "PCI DSS compliant." },
      { icon: "📈", title: "Analytics", desc: "Sales data in one place." },
    ],
  },
  sarkarmart: {
    story: "SarkarMart was born in 2024 — to give Indore's local merchants an online platform.\n\nWe saw that local brands and merchants were helpless before large platforms — SarkarMart empowered them.\n\nToday, SarkarMart connects 200+ local brands and 15,000+ customers.",
    mission: "Our mission is to bring Indore's local merchants to the global market.",
    values: [
      { icon: "🛍️", title: "Local", desc: "200+ local brands." },
      { icon: "🚚", title: "Delivery", desc: "Within 24 hours." },
      { icon: "💸", title: "Cashback", desc: "5-20% on every purchase." },
      { icon: "🔄", title: "Returns", desc: "7-day easy returns." },
    ],
  },
  sarkarlegal: {
    story: "SarkarLegal was born in 2025 — when ordinary people in India most needed legal help.\n\nWe saw that reaching lawyers is expensive and complex — SarkarLegal made it simple and affordable.\n\nToday, SarkarLegal provides 1,000+ customers with lawyer consultations and document assistance.",
    mission: "Our mission is to provide every Indian with easy access to legal help — from home, at affordable fees.",
    values: [
      { icon: "⚖️", title: "Consultation", desc: "Experienced lawyers." },
      { icon: "📋", title: "Documents", desc: "Free templates." },
      { icon: "📱", title: "Online", desc: "Over video call." },
      { icon: "💰", title: "Fees", desc: "First consultation free." },
    ],
  },
  "justdial-agent": {
    story: "JustDial Agent was born in 2024 — to connect Indore's merchants with the right customers.\n\nWe saw that local merchants need data to reach their customers — JustDial Agent fulfilled that need.\n\nToday, JustDial Agent connects 3,233+ businesses and 50,000+ users.",
    mission: "Our mission is to make every business in Indore visible in a digital directory.",
    values: [
      { icon: "📇", title: "Directory", desc: "3,233+ businesses." },
      { icon: "📊", title: "Analytics", desc: "Market data." },
      { icon: "🎯", title: "Leads", desc: "Potential customers." },
      { icon: "🏆", title: "Ranking", desc: "Premium listing." },
    ],
  },
  sarkarmarketplace: {
    story: "SarkarMarketplace was born in 2024 — to build Indore's largest digital directory.\n\nWe saw that Indore's merchants needed a centralized platform — SarkarMarketplace empowered it.\n\nToday, SarkarMarketplace serves 3,233+ businesses and 100,000+ monthly users.",
    mission: "Our mission is to bring every business in Indore onto a single platform — simple and effective.",
    values: [
      { icon: "🧭", title: "Business", desc: "3,233+ businesses." },
      { icon: "🔍", title: "Search", desc: "Instant search." },
      { icon: "⭐", title: "Review", desc: "Community ratings." },
      { icon: "🤝", title: "Network", desc: "Connect with merchants." },
    ],
  },
  ayurvedicwebsite: {
    story: "Mera Ayurvedic was born in 2024 — to bring pure Ayurvedic products to every Indian.\n\nWe saw that the market is flooded with fake Ayurvedic products — Mera Ayurvedic built a platform for genuine, certified products.\n\nToday, Mera Ayurvedic provides AYUSH-certified products to 5,000+ customers.",
    mission: "Our mission is to give every Indian pure and certified Ayurvedic products — at affordable prices.",
    values: [
      { icon: "🪷", title: "Pure", desc: "100% natural." },
      { icon: "🏆", title: "Certification", desc: "AYUSH certified." },
      { icon: "👨‍⚕️", title: "Consultation", desc: "Free vaidya consultation." },
      { icon: "💰", title: "Value", desc: "Starting at ₹99." },
    ],
  },
  sarkarghar: {
    story: "SarkarGhar was born in 2025 — to simplify the home-finding process in Indore.\n\nWe saw that finding and buying property is complex — SarkarGhar made it simple and transparent.\n\nToday, SarkarGhar serves 500+ properties and 2,000+ active users.",
    mission: "Our mission is to give every resident of Indore their dream home — without any hassle.",
    values: [
      { icon: "🏠", title: "Property", desc: "500+ verified." },
      { icon: "🔍", title: "Search", desc: "By location." },
      { icon: "📊", title: "Value", desc: "AI estimate." },
      { icon: "🏦", title: "Loan", desc: "Bank assistance." },
    ],
  },
  sarkarskills: {
    story: "SarkarSkills was born in 2024 — to teach India's youth employable skills.\n\nWe saw that thousands of young people finish their studies without skills — SarkarSkills empowered them.\n\nToday, SarkarSkills provides vocational training and placement to 2,000+ students.",
    mission: "Our mission is to teach every Indian youth employable skills — at affordable fees.",
    values: [
      { icon: "🛠️", title: "Skill", desc: "Vocational training." },
      { icon: "🎓", title: "Certificate", desc: "On training completion." },
      { icon: "💼", title: "Job", desc: "60% placement." },
      { icon: "💰", title: "Installment", desc: "From ₹500/month." },
    ],
  },
  "hyperframes-realestate": {
    story: "Hyperframes Real Estate was born in 2025 — to make real estate video-based.\n\nWe saw that you have to travel to view properties — Hyperframes made it easy with video tours.\n\nToday, Hyperframes provides video-based services to 200+ properties and 5,000+ users.",
    mission: "Our mission is to make real estate video-based and transparent — view properties from home.",
    values: [
      { icon: "🎥", title: "Video", desc: "4K video tours." },
      { icon: "🗺️", title: "Location", desc: "Google Maps." },
      { icon: "📊", title: "Value", desc: "Market trends." },
      { icon: "💰", title: "Loan", desc: "15+ bank partners." },
    ],
  },
  sikshahub: {
    story: "SikshaHub was born in 2024 — to bring quality education to every home.\n\nWe saw that the quality of education in small towns is low — SikshaHub built an online platform.\n\nToday, SikshaHub provides CBSE/ICSE/MP Board material and video classes to 3,000+ students.",
    mission: "Our mission is to give every Indian child quality education — at affordable fees.",
    values: [
      { icon: "📚", title: "Content", desc: "CBSE, ICSE, MP Board." },
      { icon: "🎥", title: "Classes", desc: "Video classes." },
      { icon: "👨‍🏫", title: "Tuition", desc: "Live sessions." },
      { icon: "💰", title: "Fees", desc: "From ₹199/month." },
    ],
  },
  sarkartravel: {
    story: "SarkarTravel was born in 2024 — to make travel simple and affordable.\n\nWe saw that travel booking has many middlemen — SarkarTravel built a direct platform.\n\nToday, SarkarTravel provides flight, hotel, and package booking to 2,000+ travelers.",
    mission: "Our mission is to make travel simple and affordable for every Indian.",
    values: [
      { icon: "✈️", title: "Booking", desc: "Flight, hotel, package." },
      { icon: "💰", title: "Rate", desc: "Best rates." },
      { icon: "📅", title: "Flexibility", desc: "Change or cancel." },
      { icon: "🛡️", title: "Insurance", desc: "Travel insurance." },
    ],
  },
  sarkardukaan: {
    story: "SarkarDukaan was born in 2024 — to digitize small shopkeepers.\n\nWe saw that shopkeepers want to go online but lack the technical know-how — SarkarDukaan offered an easy solution.\n\nToday, SarkarDukaan provides a digital store and delivery network to 1,000+ shopkeepers.",
    mission: "Our mission is to digitize every small shopkeeper — in a simple and affordable way.",
    values: [
      { icon: "🛒", title: "Store", desc: "Ready in minutes." },
      { icon: "📱", title: "Management", desc: "Everything from your phone." },
      { icon: "🚚", title: "Delivery", desc: "Across the city." },
      { icon: "💳", title: "Payment", desc: "UPI, card, COD." },
    ],
  },
  sarkarbazaar: {
    story: "SarkarBazaar was born in 2024 — to bring Indore's local merchants to the global market.\n\nWe saw that local products don't get a global platform — SarkarBazaar built an export platform.\n\nToday, SarkarBazaar provides both B2B and B2C platforms to 1,000+ merchants.",
    mission: "Our mission is to take Indore's local products across the world.",
    values: [
      { icon: "🏪", title: "Local", desc: "1,000+ merchants." },
      { icon: "🌐", title: "Export", desc: "Global reach." },
      { icon: "💰", title: "Value", desc: "Wholesale rates." },
      { icon: "🚚", title: "Shipping", desc: "Across India." },
    ],
  },
  sarkarjobs: {
    story: "SarkarJobs was born in 2024 — to connect India's youth with the right jobs.\n\nWe saw that job hunting involves fraud — SarkarJobs built a platform of verified employers.\n\nToday, SarkarJobs connects 500+ companies and 10,000+ candidates.",
    mission: "Our mission is to give every Indian youth the right and verified job.",
    values: [
      { icon: "💼", title: "Job", desc: "As per your qualification." },
      { icon: "🏢", title: "Companies", desc: "500+ verified." },
      { icon: "📝", title: "Resume", desc: "Professional template." },
      { icon: "💰", title: "Salary", desc: "Industry standard." },
    ],
  },
  sarkared: {
    story: "SarkarEd was born in 2024 — to teach India's youth career-oriented skills.\n\nWe saw that traditional education is not enough for employment — SarkarEd started vocational training.\n\nToday, SarkarEd teaches 3,000+ students digital marketing, AI, and web development.",
    mission: "Our mission is to teach every Indian youth career-oriented skills.",
    values: [
      { icon: "🎓", title: "Courses", desc: "AI, web, marketing." },
      { icon: "👨‍🏫", title: "Teacher", desc: "10+ years experience." },
      { icon: "📜", title: "Certificate", desc: "On training completion." },
      { icon: "💼", title: "Job", desc: "70% placement." },
    ],
  },
  sarkarsarkar: {
    story: "SarkarSarkar was born in 2025 — to bring government services to every Indian.\n\nWe saw that government services involve queues and delays — SarkarSarkar made them digital.\n\nToday, SarkarSarkar provides Aadhaar, PAN, passport, and other services to 5,000+ citizens.",
    mission: "Our mission is to give every Indian easy access to government services — from home.",
    values: [
      { icon: "🏛️", title: "Services", desc: "Aadhaar, PAN, passport." },
      { icon: "📋", title: "Application", desc: "Help filling forms." },
      { icon: "📱", title: "Tracking", desc: "Live status." },
      { icon: "💰", title: "Schemes", desc: "Government schemes." },
    ],
  },
  sarkarwellness: {
    story: "SarkarWellness was born in 2024 — to combine Ayurveda and yoga with modern methods.\n\nWe saw that people are seeking natural ways for health — SarkarWellness built a platform for panchakarma, yoga, and nutrition.\n\nToday, SarkarWellness provides Ayurvedic treatments and wellness plans to 2,000+ customers.",
    mission: "Our mission is to give every Indian natural and Ayurvedic health services.",
    values: [
      { icon: "🌿", title: "Treatment", desc: "Panchakarma, yoga." },
      { icon: "👨‍⚕️", title: "Consultation", desc: "Vaidya advice." },
      { icon: "🥗", title: "Diet", desc: "Ayurvedic nutrition." },
      { icon: "📊", title: "Tracking", desc: "Health progress." },
    ],
  },
};

export function AboutPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const team = (brand.team_json ?? []) as any[];
  const about = BRAND_ABOUT[brand.slug];

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
            {brand.name} — About
          </div>
          {/* One emphasis, not two. The brand name in brand green *and* the
              phrase in a brand gradient meant nothing was actually emphasised. */}
          <h1 className="heading-xl mb-6">
            {brand.name} <span className="gradient-text">— Our Story</span>
          </h1>
          <p className="text-lede mx-auto max-w-2xl">{brand.tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`/contact`} className="btn-primary">Contact Us</a>
            <a href={`/services`} className="btn-secondary">Our Services</a>
          </div>
        </div>
      </section>

      {/* STORY */}
      {about && (
        <section className="section">
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>Our Story</p>
              <h2 className="heading-md mb-4" style={{ color: "var(--brand-secondary)" }}>From Indore, for Indore</h2>
              <p className="text-body leading-relaxed whitespace-pre-line mb-4">
                {about.story}
              </p>
              {about.mission && (
                <div className="rounded-2xl p-5 border-l-4" style={{ borderColor: "var(--brand-secondary)", background: "var(--brand-tint)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--brand-secondary)" }}>Our Mission</p>
                  <p className="text-sm opacity-70">{about.mission}</p>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">{brand.emoji ?? "🤝"}</div>
                    <p className="text-2xl font-bold" style={{ color: "var(--brand-secondary)" }}>{brand.name}</p>
                    <p className="text-sm opacity-50 mt-1">Indore's Community Network</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl shadow-lg flex items-center justify-center text-3xl animate-float" style={{ background: "var(--brand-gradient)" }}>🏙️</div>
            </div>
          </div>
        </section>
      )}

      {/* VALUES */}
      {about && (
        <section className="section-tight">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>Our Values</p>
              <h2 className="heading-md" style={{ color: "var(--brand-secondary)" }}>What Makes Us Different</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {about.values.map((v, i) => (
                <div key={i} className="rounded-2xl border bg-surface p-6 text-center" style={{ borderColor: "var(--hairline)" }}>
                  <div className="text-4xl mb-3">{v.icon}</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: "var(--brand-secondary)" }}>{v.title}</h3>
                  <p className="text-sm opacity-60">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="section-tight">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl p-8 md:p-12" style={{ background: `linear-gradient(135deg, ${primary}08, ${secondary}05)` }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { v: "50+", l: "Verified Doctors" },
                { v: "5,000+", l: "Active Patients" },
                { v: "4.9★", l: "Avg Rating" },
                { v: "15+", l: "Indore Areas" },
              ].map((s) => (
                <div key={s.l} className="text-center rounded-2xl border p-6 bg-surface" style={{ borderColor: "var(--hairline)" }}>
                  <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: "var(--brand-secondary)" }}>{s.v}</div>
                  <div className="text-sm opacity-50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      {team.length > 0 && (
        <section className="section">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <p className="text-caption mb-3" style={{ color: "var(--brand-secondary)" }}>People</p>
              <h2 className="heading-md mb-4" style={{ color: "var(--brand-secondary)" }}>Meet Our Team</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {team.map((m: any, i: number) => (
                <div key={i} className="card-lift rounded-2xl border bg-surface p-6 text-center" style={{ borderColor: "var(--hairline)" }}>
                  {m.photo ? <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover shadow-md" /> : <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-md" style={{ background: "var(--brand-gradient)" }}>{m.name?.charAt(0) ?? "?"}</div>}
                  <p className="font-bold">{m.name}</p>
                  {m.role && <p className="text-sm opacity-50">{m.role}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: "var(--brand-gradient)" }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Ready to Grow Together?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                {brand.name} — take care of your health, download today.
              </p>
              <a href={`/contact`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: "var(--brand-secondary)" }}>Start the Conversation →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
