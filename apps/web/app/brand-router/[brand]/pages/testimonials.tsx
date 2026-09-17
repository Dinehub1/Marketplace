import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";
import type { ByBrandSlug, Testimonial } from "@/lib/brand-content";

const BRAND_TESTIMONIALS: ByBrandSlug<Testimonial> = {
  sarkarhealth: [
    { name: "Sunita Sharma", text: "So simple! I consulted a doctor right from home, and the medicine was delivered to my doorstep. I've never had such a facility in Indore.", rating: 5, role: "Housewife, Rajwada" },
    { name: "Ramesh Patel", text: "My father's ECG was done at home, and the report came online too. It saved us a lot of hassle — thank you SarkarHealth!", rating: 5, role: "Son of patient, Palasia" },
    { name: "Dr. Anant Mishra", text: "I've been treating 50+ patients for over a month. The patients are happy, and so am I.", rating: 5, role: "MBBS Doctor, SarkarHealth Partner" },
    { name: "Priyanka Jain", text: "Consultation over a video call — no parking, no queue. Met a doctor within 30 minutes — excellent!", rating: 4, role: "Working Professional, Vijay Nagar" },
    { name: "Mohanlal Yadav", text: "I'm a senior citizen and used to struggle going alone. SarkarHealth sent a home visit — the doctors are wonderful.", rating: 5, role: "Retired Teacher, Sudama Nagar" },
    { name: "Neha Agarwal", text: "Medicines were 40% cheaper! A generic option was also available — I'm saving a lot every month.", rating: 4, role: "Mother, Saket Nagar" },
    { name: "Anita Khan", text: "The doctor checked my diabetes and prescribed medicine online. I received treatment from the comfort of my home.", rating: 5, role: "Patient, Geeta Bhawan" },
    { name: "Dr. Sunil Joshi", text: "SarkarHealth brought my clinic online. Now I see 20+ online patients every day.", rating: 5, role: "MD Physician, Partner Doctor" },
    { name: "Vijay Kumar", text: "My son's tonsillitis treatment happened over a video call. The medicine was delivered home too. So easy!", rating: 4, role: "Father, Navlakha" },
    { name: "SarkarHealth Trust Badge", text: "Served 5000+ patients | 50+ verified doctors", rating: 5, role: "Trusted Healthcare Partner" },
  ],
  sarkardost: [
    { name: "Raju Tea Stall", text: "After listing on SarkarDost, my customers grew — people call me directly now.", rating: 5, role: "Tea Stall Owner, Rajwada" },
    { name: "Meena Tailor", text: "Earlier I only got walk-in customers — now new customers are coming too. It's a great platform!", rating: 5, role: "Tailor, Palasia" },
    { name: "Pandit Electrician", text: "I put my service online — now I get 5-6 calls daily. Earlier it used to be 1-2.", rating: 5, role: "Electrician, Sudama Nagar" },
    { name: "Sita Devi", text: "SarkarDost built an online booking system for my beauty parlour — now clients easily book appointments.", rating: 5, role: "Beauty Parlour Owner, Vijay Nagar" },
    { name: "Ashok Kumar", text: "I got my grocery store listed online — and started doorstep delivery too. Sales grew 40%!", rating: 4, role: "Grocery Store Owner, Rajwada" },
    { name: "Deepika Joshi", text: "I promoted my yoga classes through SarkarDost — now every batch is full. Best platform for Zumba and meditation too!", rating: 5, role: "Yoga Instructor, Palasia" },
    { name: "Rajesh Malviya", text: "SarkarDost built me a free website — now my coaching institute's details are online. Parents contact easily.", rating: 5, role: "Tutor, Sudama Nagar" },
  ],
  followup: [
    { name: "Amit Sales", text: "With FollowUp I never miss my clients — automated messages remind everyone.", rating: 5, role: "Sales Executive" },
    { name: "Dr. Priya", text: "Reminding patients about appointments used to be hard — FollowUp made it all easy.", rating: 5, role: "Dentist" },
  ],
  cloudplayer: [
    { name: "Vikram M.", text: "4K streaming with zero buffering — best cloud player I've used. Period.", rating: 5, role: "Tech Enthusiast" },
    { name: "Sneha K.", text: "Family plan is amazing — all of us watch different things, no conflicts!", rating: 5, role: "Mother of two" },
    { name: "Alex Rivera", text: "The adaptive bitrate is incredible — switched from hotel WiFi to 5G without missing a frame. My viewers noticed the quality jump immediately.", rating: 5, role: "Live Streamer" },
    { name: "Priya Desai", text: "Cloud storage means I never worry about device storage again. My entire 4K library is accessible instantly from any device.", rating: 5, role: "Content Creator" },
    { name: "Marcus Chen", text: "Parental controls gave me peace of mind. My kids can explore safely while I enjoy my own content in 4K HDR.", rating: 4, role: "Father of Three" },
  ],
  paisaflow: [
    { name: "Rohit Jain", text: "Thanks to PaisaFlow I started mutual fund investing — the returns are good.", rating: 4, role: "First-time Investor" },
    { name: "Pooja Sharma", text: "Goal-based planning removed my retirement worry — I'm confident now.", rating: 5, role: "Working Professional" },
    { name: "Amit Patel", text: "PaisaFlow's SIP made my mutual fund investment systematic — 12% p.a. returns on large-cap funds.", rating: 5, role: "Software Engineer, Indore" },
    { name: "Anita Joshi", text: "PaisaFlow's FD scheme gives me 7.5% annual interest — more return than the bank!", rating: 4, role: "Retired Teacher, Bhopal" },
    { name: "Vikram Singh", text: "PaisaFlow's stock recommendations gave 18% return in 6 months — the research reports are very helpful!", rating: 5, role: "Stock Trader, Jaipur" },
  ],
  yaadrakh: [
    { name: "Karan T.", text: "Since using YaadRakh nothing is missed — AI notes are created automatically too.", rating: 5, role: "Student" },
    { name: "Anita D.", text: "Smart reminders understand context — very useful in daily life.", rating: 4, role: "Homemaker" },
    { name: "Rohan S.", text: "YaadRakh's AI notes automatically organize my lecture notes — now revision takes 50% less time.", rating: 5, role: "Computer Science Student" },
    { name: "Priya M.", text: "Meeting notes are automatically summarized — now sending follow-up emails takes 10 minutes less.", rating: 5, role: "Project Manager" },
    { name: "Dadi Sunder", text: "Medicine delivery reminders never get missed — the medication schedule is perfect, and grandma's health has improved.", rating: 5, role: "Retired Teacher" },
  ],
  "sarkar-ai": [
    { name: "Deepak C.", text: "Sarkar AI analyzed my business data — it used to take 10 hours manually!", rating: 5, role: "Business Owner" },
    { name: "Neha P.", text: "An AI chatbot in Hindi — finally someone who talks in our language!", rating: 5, role: "Content Creator" },
  ],
  sarkarfood: [
    { name: "Ravi I.", text: "Found Indore's best poha-jalebi on the app — hot and fresh in 30 minutes!", rating: 5, role: "Foodie" },
    { name: "Sunita J.", text: "A full meal for ₹99 from the budget menu — best for students.", rating: 4, role: "College Student" },
  ],
  sarkarfinance: [
    { name: "Manoj K.", text: "₹2 lakh loan in my account in 10 minutes — no branch visit, no paperwork!", rating: 5, role: "Small Business Owner" },
    { name: "Geeta S.", text: "Credit score check is free — and I got tips to improve it too. Very helpful!", rating: 4, role: "Homemaker" },
  ],
  sarkarpay: [
    { name: "Rajesh M.", text: "Everything in one place — UPI, card, net banking. Settlement is same-day too.", rating: 5, role: "Shop Owner" },
    { name: "Pooja T.", text: "The analytics dashboard shows which product is selling the most.", rating: 4, role: "Online Seller" },
  ],
  sarkarmart: [
    { name: "Anil S.", text: "Found Indore's local brands all in one place — shopping became very easy.", rating: 5, role: "Customer" },
    { name: "Kavita D.", text: "Got cashback on every purchase — good savings.", rating: 4, role: "Regular Buyer" },
  ],
  sarkarlegal: [
    { name: "Ramesh L.", text: "The free consultation helped me understand how my case would proceed — saved money and stress.", rating: 5, role: "Small Business Dispute" },
    { name: "Sita R.", text: "Met a lawyer over an online video call — everything was solved from home.", rating: 5, role: "Property Issue" },
  ],
  "justdial-agent": [
    { name: "Suresh A.", text: "After listing, calls started coming — business grew 30% in 2 months.", rating: 5, role: "AC Repair Business" },
    { name: "Ashok Kumar", text: "The JustDial agent got my shop's listing to the top — now phones don't ring, messages come instead.", rating: 5, role: "Shop Owner, Sarafa Bazaar" },
    { name: "Deepika Singh", text: "The review management feature is very helpful — we can resolve negative feedback quickly.", rating: 4, role: "Restaurant Manager, Vijay Nagar" },
    { name: "Sanjay Patel", text: "The analytics dashboard shows which keywords bring more traffic — ROI improved.", rating: 5, role: "Business Consultant, Indore" },
    { name: "Deepak R.", text: "The lead generation feature gave me 15 new clients in just 1 month. ROI is very fast!", rating: 5, role: "Salon Owner, Vijay Nagar" },
    { name: "Kavita S.", text: "Data analytics showed which product has higher margins — now I'm making smart decisions.", rating: 5, role: "Electronics Store Owner" },
  ],
  sarkarmarketplace: [
    { name: "Meera J.", text: "Indore's biggest directory — found verified businesses in every category.", rating: 5, role: "Customer" },
    { name: "Rajesh K.", text: "I put my sugar shop online — now orders come quickly from across the district.", rating: 5, role: "Kirana Merchant, Palasia" },
    { name: "Anita M.", text: "I needed a good place for catering — found it instantly in the directory, and the event was a super hit!", rating: 4, role: "Event Planner" },
  ],
  ayurvedicwebsite: [
    { name: "Ashok P.", text: "Ashwagandha boosted my energy — it's AYUSH certified so I trust it.", rating: 5, role: "Fitness Enthusiast" },
    { name: "Radha K.", text: "Triphala fixed my digestion — starts at ₹99, best value.", rating: 4, role: "Senior Citizen" },
  ],
  sarkarghar: [
    { name: "Vikram S.", text: "Decided after seeing the virtual tour — saved the time of visiting homes and found the perfect one.", rating: 5, role: "Home Buyer" },
    { name: "Sunita P.", text: "Got loan assistance from the platform too — help reaching the bank, and the process was smooth.", rating: 5, role: "First-time Buyer, Rajwada" },
    { name: "Amit J.", text: "Price analytics showed the right rate — saved ₹2 lakh and avoided fraud.", rating: 4, role: "Investor, Scheme No. 78" },
  ],
  sarkarskills: [
    { name: "Rahul Y.", text: "Completed the digital marketing course — now I earn ₹25,000/month freelancing.", rating: 5, role: "Graduate" },
    { name: "Neha G.", text: "Got a certificate on completing the course — made a great impression in interviews.", rating: 4, role: "Job Seeker" },
  ],
  "hyperframes-realestate": [
    { name: "Sanjay M.", text: "Saw the property via video tour — no need to travel to Indore. Saved both time and money!", rating: 5, role: "NRI Buyer" },
    { name: "Priyanka S.", text: "The 360° virtual tour showed the property so well — even after visiting in person it looked the same. Fully accurate!", rating: 5, role: "Home Buyer, Mumbai" },
    { name: "Rajiv T.", text: "Just after posting the video listing, 3 buyers showed interest — after a personal visit, one booked immediately.", rating: 5, role: "Property Seller" },
  ],
  sikshahub: [
    { name: "Priyanka T.", text: "Bought SikshaHub for my daughter — CBSE syllabus, video classes, all for ₹199. Best investment!", rating: 5, role: "Parent" },
    { name: "Rohit K.", text: "Live tuition sessions helped me understand what school didn't — 40% improvement in maths!", rating: 5, role: "Class 10 Student" },
    { name: "Meena D.", text: "For MP Board, everything is available here — notes, videos, practice tests. My son now studies on his own.", rating: 4, role: "Mother, Sudama Nagar" },
  ],
  sarkartravel: [
    { name: "Amit J.", text: "Compared flight + hotel packages — saved ₹3,000!", rating: 5, role: "Frequent Traveler" },
    { name: "Kavita N.", text: "Booked a Shimla honeymoon package — beautiful hotels and a perfectly planned itinerary.", rating: 5, role: "Newlywed, Indore" },
    { name: "Sunil P.", text: "Couldn't get train tickets — Travel gave a waitlist suggestion, and it got confirmed from WL2. Very helpful!", rating: 4, role: "Regular Commuter" },
  ],
  sarkardukaan: [
    { name: "Ganesh P.", text: "My shop went online in 10 minutes — now orders come from across the city.", rating: 5, role: "Kirana Shop Owner" },
    { name: "Lalita B.", text: "I sell clothes online — Dukaan brought my entire shop to my smartphone. No shop rent to pay!", rating: 5, role: "Boutique Owner, Palasia" },
    { name: "Mohammed S.", text: "Managing inventory became so easy — it automatically shows when to restock.", rating: 4, role: "Mobile Accessories Shop" },
  ],
  sarkarbazaar: [
    { name: "Lata S.", text: "I can sell local crafts online — Bazaar gave me worldwide reach.", rating: 5, role: "Handicraft Seller" },
    { name: "Prakash J.", text: "B2B orders started coming directly from suppliers — removing the middleman increased margins.", rating: 5, role: "Wholesaler, Cloth Market" },
    { name: "Nisha A.", text: "The shipping partner network made delivery easy — orders reach home safely via DTDC.", rating: 4, role: "Home Baker" },
  ],
  sarkarjobs: [
    { name: "Ravi K.", text: "Found verified companies — earlier I feared fraud, not anymore.", rating: 5, role: "Fresh Graduate" },
    { name: "Sneha M.", text: "AI job matching sent the right company — cleared 3 interviews, final selection!", rating: 5, role: "BBA Graduate, Palasia" },
    { name: "Arvind P.", text: "The salary comparison tool showed I was being paid less — I negotiated with the company using this data.", rating: 5, role: "Sales Executive" },
  ],
  sarkared: [
    { name: "Pooja M.", text: "Learned web development — now I build my own website. ₹499/month, best course!", rating: 5, role: "Aspiring Developer" },
    { name: "Amit S.", text: "Built a chatbot for my business from the AI course — customer support is now automated.", rating: 5, role: "Startup Founder" },
    { name: "Kiran B.", text: "Got a certificate after the course — HR said it's practical knowledge, and I got the offer letter!", rating: 5, role: "BCA Student" },
  ],
  sarkarsarkar: [
    { name: "Bhagirath J.", text: "Used SarkarSarkar for Aadhar card correction — done from home!", rating: 5, role: "Senior Citizen" },
    { name: "Rekha D.", text: "I needed to make a ration card — earlier my documents kept getting prepared wrong, the platform set everything right.", rating: 5, role: "Homemaker, Rajwada" },
    { name: "Ghanshyam K.", text: "Filed an RTI online — got a reply in 15 days. Earlier it used to take months.", rating: 4, role: "RTI Activist" },
  ],
  sarkarwellness: [
    { name: "Meera D.", text: "Panchakarma treatment relieved my back pain — natural and effective.", rating: 5, role: "Yoga Practitioner" },
    { name: "Dr. Ashok T.", text: "Ayurvedic consultation solved my skin problem in 3 months — more effective than chemical creams.", rating: 5, role: "Retired Teacher" },
    { name: "Priyanka R.", text: "Joined daily yoga classes — stress reduced, sleep improved. Best wellness decision!", rating: 4, role: "Working Mom, Vijay Nagar" },
  ],
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { name: "Rahul S.", text: "Amazing service! Highly recommended to everyone.", rating: 5 },
  { name: "Priya M.", text: "Best experience ever. Will definitely come back.", rating: 5 },
  { name: "Amit K.", text: "Great quality and fast delivery. Very satisfied.", rating: 4 },
  { name: "Sneha R.", text: "Professional team, excellent results.", rating: 5 },
  { name: "Vikram P.", text: "They transformed our business completely.", rating: 5 },
  { name: "Neha T.", text: "Outstanding support and service quality.", rating: 4 },
];

export function TestimonialsPage({ brand }: { brand: Brand }) {
  const testimonials = BRAND_TESTIMONIALS[brand.slug] ?? (brand.testimonials_json ?? DEFAULT_TESTIMONIALS);

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: "var(--brand-gradient)" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>Testimonials</div>
          <h1 className="heading-xl mb-6"><span style={{ color: "var(--brand-secondary)" }}>What our patients say</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">Real opinions from patients who trust SarkarHealth</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item, i: number) => (
              <div key={i} className="card-lift rounded-2xl border bg-surface p-6 h-full flex flex-col" style={{ borderColor: "var(--hairline)" }}>
                <div className="flex items-center gap-1 mb-4">{[1,2,3,4,5].map((s) => <span key={s} className={s <= (item.rating ?? 5) ? "tone-gold" : "text-ink-4"}>★</span>)}</div>
                <p className="text-sm opacity-70 italic leading-relaxed flex-1">&quot;{item.text}&quot;</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--brand-gradient)" }}>{item.name?.charAt(0) ?? "?"}</div>
                  <div><p className="font-semibold text-sm">{item.name}</p>{item.role && <p className="text-xs opacity-50">{item.role}</p>}</div>
                </div>
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
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Join our happy patients</h2>
              <p className="text-white/80 mb-8">Experience the {brand.name} difference today — 5000+ patients already trust us.</p>
              <a href={`/contact`} className="bg-surface px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: "var(--brand-secondary)" }}>Get Started →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
