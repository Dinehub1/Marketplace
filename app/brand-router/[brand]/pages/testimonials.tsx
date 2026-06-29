import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_TESTIMONIALS: Record<string, Array<{ name: string; text: string; rating: number; role?: string }>> = {
  sarkarhealth: [
    { name: "Sunita Sharma", text: "Bahut aasan! Ghar baithke doctor se mil payin, dawai bhi darwaze par aa gayi. Mujhe Indore mein kabhi aisi suvidha nahi mili.", rating: 5, role: "Housewife, Rajwada" },
    { name: "Ramesh Patel", text: "Papa ka ECG ghar par hua — report bhi online aa gayi. Bahut pareshani se bach liya — dhanyavaad SarkarHealth!", rating: 5, role: "Son of patient, Palasia" },
    { name: "Dr. Anant Mishra", text: "Ek mahine se 50+ marizon ka ilaj kar raha hoon. Mariz khush hain, main khush hoon.", rating: 5, role: "MBBS Doctor, SarkarHealth Partner" },
    { name: "Priyanka Jain", text: "Video call par consultation — koi parking, koi line. 30 minute mein doctor mil payi — badhiya!", rating: 4, role: "Working Professional, Vijay Nagar" },
    { name: "Mohanlal Yadav", text: "Budhurg hoon, akele jaane mein dikkat hoti thi. SarkarHealth se home visit aayi — doctor bahut acche hain.", rating: 5, role: "Retired Teacher, Sudama Nagar" },
    { name: "Neha Agarwal", text: "Dawaiyaan 40% sasti gayin! Generic option bhi mila — bahut bachat ho rahi hai maasik.", rating: 4, role: "Mother, Saket Nagar" },
  ],
  sarkardost: [
    { name: "Raju Tea Stall", text: "SarkarDost par listing karne ke baad mere customers badh gaye — log directly call karte hain ab.", rating: 5, role: "Chaiwala, Rajwada" },
    { name: "Meena Tailor", text: "Pehle sirf mile jo aate the — ab naye customers bhi mil rahe hain. Bahut achha platform hai!", rating: 5, role: "Tailor, Palasia" },
    { name: "Pandit Electrician", text: "Maine apni service online lagayi — ab 5-6 calls daily aati hain. Pehle 1-2 hoti the.", rating: 5, role: "Electrician, Sudama Nagar" },
  ],
  followup: [
    { name: "Amit Sales", text: "FollowUp se mere clients ko kabhi miss nahi karna padta — automated messages sab yaad dilate hain.", rating: 5, role: "Sales Executive" },
    { name: "Dr. Priya", text: "Patients ko appointment yaad dilwana mushkil tha — FollowUp ne sab aasan kar diya.", rating: 5, role: "Dentist" },
  ],
  cloudplayer: [
    { name: "Vikram M.", text: "4K streaming with zero buffering — best cloud player I've used. Period.", rating: 5, role: "Tech Enthusiast" },
    { name: "Sneha K.", text: "Family plan is amazing — all of us watch different things, no conflicts!", rating: 5, role: "Mother of two" },
  ],
  paisaflow: [
    { name: "Rohit Jain", text: "PaisaFlow ki wajah se mutual fund investment start kiya — returns acche aa rahe hain.", rating: 4, role: "First-time Investor" },
    { name: "Pooja Sharma", text: "Goal-based planning ne retirement ka tension hataya — ab confident hoon.", rating: 5, role: "Working Professional" },
  ],
  yaadrakh: [
    { name: "Karan T.", text: "YaadRakh ke baad kuch bhi miss nahi hota — AI notes bhi ban jaate hain automatically.", rating: 5, role: "Student" },
    { name: "Anita D.", text: "Smart reminders context samajhte hain — bahut useful hai daily life mein.", rating: 4, role: "Homemaker" },
  ],
  "sarkar-ai": [
    { name: "Deepak C.", text: "Sarkar AI ne mere business ka data analysis kar diya — manually 10 ghanta lagta tha!", rating: 5, role: "Business Owner" },
    { name: "Neha P.", text: "Hindi mein AI chatbot — finally koi hamari bhai mein baat karta hai!", rating: 5, role: "Content Creator" },
  ],
  sarkarfood: [
    { name: "Ravi I.", text: "Indore ki best poha-jalebi mil gayi app se — 30 minute mein garam garam!", rating: 5, role: "Foodie" },
    { name: "Sunita J.", text: "Budget menu se ₹99 mein full meal — students ke liye best hai.", rating: 4, role: "College Student" },
  ],
  sarkarfinance: [
    { name: "Manoj K.", text: "₹2 lakh loan 10 minute mein account mein — no branch visit, no paperwork!", rating: 5, role: "Small Business Owner" },
    { name: "Geeta S.", text: "Credit score check free mein — improve karne ke tips bhi mile. Bahut helpful!", rating: 4, role: "Homemaker" },
  ],
  sarkarpay: [
    { name: "Rajesh M.", text: "Sab ek jagah — UPI, card, net banking. Settlement bhi same day milta hai.", rating: 5, role: "Shop Owner" },
    { name: "Pooja T.", text: "Analytics dashboard se pata chalta hai kaunsa product zada bik raha hai.", rating: 4, role: "Online Seller" },
  ],
  sarkarmart: [
    { name: "Anil S.", text: "Indore ke local brands mil gaye ek jagah — shopping bahut aasan ho gayi.", rating: 5, role: "Customer" },
    { name: "Kavita D.", text: "Cashback mila har purchase pe — achhi savings ho rahi hai.", rating: 4, role: "Regular Buyer" },
  ],
  sarkarlegal: [
    { name: "Ramesh L.", text: "Free consultation se samajh aaya case kaise hoga — paisa bhi bachaya, tension bhi nahi.", rating: 5, role: "Small Business Dispute" },
    { name: "Sita R.", text: "Online video call par lawyer se mili — ghar baithke sab solve ho gaya.", rating: 5, role: "Property Issue" },
  ],
  "justdial-agent": [
    { name: "Suresh A.", text: "Listing ke baad calls aane lage — business 30% badh gayi 2 mahine mein.", rating: 5, role: "AC Repair Business" },
    { name: "Ashok Kumar", text: "JustDial agent ne mere shop ki listing top kar di — ab phone nahi bajate, message aate hain.", rating: 5, role: "Shop Owner, Sarafa Bazaar" },
    { name: "Deepika Singh", text: "Review management feature bahut helpful hai — negative feedback ko jaldi se resolve kar paa rahe hain.", rating: 4, role: "Restaurant Manager, Vijay Nagar" },
    { name: "Sanjay Patel", text: "Analytics dashboard se pata chalta hai kaunse keywords se zyada traffic aa raha hai — ROI improve hua.", rating: 5, role: "Business Consultant, Indore" },
    { name: "Deepak R.", text: "Lead generation feature ne mujhe 15 naye clients diye sirf 1 mahine mein. ROI bahut fast hai!", rating: 5, role: "Salon Owner, Vijay Nagar" },
    { name: "Kavita S.", text: "Data analytics se pata chala kaunse product mein zyada margin hai — ab smart decisions le raha hoon.", rating: 5, role: "Electronics Store Owner" },
  ],
  sarkarmarketplace: [
    { name: "Meera J.", text: "Indore ka sabse bada directory — har category mein verified businesses mil gayi.", rating: 5, role: "Customer" },
    { name: "Rajesh K.", text: "Apni chini ki dukaan online laga di — ab poore district mein orders aate hain jaldi.", rating: 5, role: "Kirana Merchant, Palasia" },
    { name: "Anita M.", text: "Mujhe ek achhi jagah chahiye thi catering ke liye — directory se turant mil gayi, event super hit raha!", rating: 4, role: "Event Planner" },
  ],
  ayurvedicwebsite: [
    { name: "Ashok P.", text: "Ashwagandha ne energy badhayi — AYUSH certified hai toh bharosa bhi hai.", rating: 5, role: "Fitness Enthusiast" },
    { name: "Radha K.", text: "Triphal ne digestion theek kiya — ₹99 se start ho raha hai, best value.", rating: 4, role: "Senior Citizen" },
  ],
  sarkarghar: [
    { name: "Vikram S.", text: "Virtual tour dekhke decide kiya — ghar jaane ka time bachaya aur perfect mill gaya.", rating: 5, role: "Home Buyer" },
    { name: "Sunita P.", text: "Loan assistance bhi mili platform se — bank tak pahunchne mein madad mili, process smooth raha.", rating: 5, role: "First-time Buyer, Rajwada" },
    { name: "Amit J.", text: "Price analytics se pata chala sahi rate kya hai — ₹2 lakh bachaye fraud se bach gaye.", rating: 4, role: "Investor, Scheme No. 78" },
  ],
  sarkarskills: [
    { name: "Rahul Y.", text: "Digital marketing course pura kiya — ab freelance se ₹25,000/month kamata hoon.", rating: 5, role: "Graduate" },
    { name: "Neha G.", text: "Certificate mila course complete karne par — interview mein impression ban gaya.", rating: 4, role: "Job Seeker" },
  ],
  "hyperframes-realestate": [
    { name: "Sanjay M.", text: "Video tour se property dekh liya — Indore aane ki zarurat nahi padi. Time and money dono bachaya!", rating: 5, role: "NRI Buyer" },
    { name: "Priyanka S.", text: "360° virtual tour ne itni achhi dikhi property ki — actually jaake dekhne ke baad bhi same laga. Fully accurate!", rating: 5, role: "Home Buyer, Mumbai" },
    { name: "Rajiv T.", text: "Video listing daalne ke baad hi 3 buyer interested hue — personally visit karne ke baad ek ne turant booking kar li.", rating: 5, role: "Property Seller" },
  ],
  sikshahub: [
    { name: "Priyanka T.", text: "Beti ke liye SikshaHub liya — CBSE syllabus, video classes, sab ₹199 mein. Best investment!", rating: 5, role: "Parent" },
    { name: "Rohit K.", text: "Live tuition sessions ne samjh aaya jo school mein nahi samjha — maths mein 40% improvement!", rating: 5, role: "Class 10 Student" },
    { name: "Meena D.", text: "MP Board ke liye yahan sab kuch milta hai — notes, video, practice test. Beta self-study kar raha hai ab.", rating: 4, role: "Mother, Sudama Nagar" },
  ],
  sarkartravel: [
    { name: "Amit J.", text: "Flight + hotel package compare kiya — ₹3,000 bachaye!", rating: 5, role: "Frequent Traveler" },
    { name: "Kavita N.", text: "Shimla honeymoon package book kiya — bahut sundar hotels aur itinerary perfectly planned tha.", rating: 5, role: "Newlywed, Indore" },
    { name: "Sunil P.", text: "Train tickets nahi mil thi — Travel ne waitlist suggestion di, WL2 se confirm ho gayi. Bahut helpful!", rating: 4, role: "Regular Commuter" },
  ],
  sarkardukaan: [
    { name: "Ganesh P.", text: "Dukaan online ho gayi 10 minute mein — ab poore sheher mein orders aate hain.", rating: 5, role: "Kirana Shop Owner" },
    { name: "Lalita B.", text: "Main kapde online bechhti hoon — Dukaan ne meri puri dukaan smartphone pe layi. Koi shop rent nahi deni padegi!", rating: 5, role: "Boutique Owner, Palasia" },
    { name: "Mohammed S.", text: "Inventory manage karna itna aasan ho gaya — automatically pata chalta hai kab restock karna hai.", rating: 4, role: "Mobile Accessories Shop" },
  ],
  sarkarbazaar: [
    { name: "Lata S.", text: "Local crafts online bech pa rahi hain — Bazaar ne reach di worldwide.", rating: 5, role: "Handicraft Seller" },
    { name: "Prakash J.", text: "B2B orders aane lage suppliers se directly — beech ke hatane se margin badh gaya.", rating: 5, role: "Wholesaler, Cloth Market" },
    { name: "Nisha A.", text: "Shipping partner network ne delivery ko easy baya — DTDC se ghar tak pahunchta hai order safely.", rating: 4, role: "Home Baker" },
  ],
  sarkarjobs: [
    { name: "Ravi K.", text: "Verified companies mil gayi — pehle fraud ka darr tha, ab nahi.", rating: 5, role: "Fresh Graduate" },
    { name: "Sneha M.", text: "AI job match ne sahi company bheji — 3 interviews clear kiye, final selection!", rating: 5, role: "BBA Graduate, Palasia" },
    { name: "Arvind P.", text: "Salary comparison tool ne pata kiya ki mujhse kam mil raha tha — company negotiate kar payi is data se.", rating: 5, role: "Sales Executive" },
  ],
  sarkared: [
    { name: "Pooja M.", text: "Web development seekha — ab apna khud ka website bana leti hoon. ₹499/mein best course!", rating: 5, role: "Aspiring Developer" },
    { name: "Amit S.", text: "AI course se chatbot bana liya apne business ke liye — customer support automated ho gaya.", rating: 5, role: "Startup Founder" },
    { name: "Kiran B.", text: "Certificate mila course ke baad — HR ne bola yeh practical knowledge hai, offer letter mil gayi!", rating: 5, role: "BCA Student" },
  ],
  sarkarsarkar: [
    { name: "Bhagirath J.", text: "Aadhar card correction ke liye SarkarSarkar use kiya — ghar baithke ho gaya kaam!", rating: 5, role: "Senior Citizen" },
    { name: "Rekha D.", text: "Ration card banana tha — pehle taiyar the kagzaat galat ho gaye the, platform ne sab set kar diya.", rating: 5, role: "Homemaker, Rajwada" },
    { name: "Ghanshyam K.", text: "Online RTI file kari — 15 din mein jawaab mil gaya. Pehle mahino lag jaate the.", rating: 4, role: "RTI Activist" },
  ],
  sarkarwellness: [
    { name: "Meera D.", text: "Panchkarma treatment ne back pain door kiya — natural aur effective.", rating: 5, role: "Yoga Practitioner" },
    { name: "Dr. Ashok T.", text: "Ayurvedic consultation ne meri skin problem 3 mahine mein solve ki — chemical creams se zyada effective.", rating: 5, role: "Retired Teacher" },
    { name: "Priyanka R.", text: "Daily yoga classes join ki — stress kam hua, neend achhi aa rahi hai. Best wellness decision!", rating: 4, role: "Working Mom, Vijay Nagar" },
  ],
};

const DEFAULT_TESTIMONIALS = [
  { name: "Rahul S.", text: "Amazing service! Highly recommended to everyone.", rating: 5 },
  { name: "Priya M.", text: "Best experience ever. Will definitely come back.", rating: 5 },
  { name: "Amit K.", text: "Great quality and fast delivery. Very satisfied.", rating: 4 },
  { name: "Sneha R.", text: "Professional team, excellent results.", rating: 5 },
  { name: "Vikram P.", text: "They transformed our business completely.", rating: 5 },
  { name: "Neha T.", text: "Outstanding support and service quality.", rating: 4 },
];

export function TestimonialsPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const testimonials = BRAND_TESTIMONIALS[brand.slug] ?? (brand.testimonials_json ?? DEFAULT_TESTIMONIALS) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>Testimonials</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>Hamare Mariz Kya Kehte Hain</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">Asli vichar — SarkarHealth par bharosha karne wale mariz ke</p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item: any, i: number) => (
              <div key={i} className="card-lift rounded-2xl border bg-white p-6 h-full flex flex-col" style={{ borderColor: `${accent}30` }}>
                <div className="flex items-center gap-1 mb-4">{[1,2,3,4,5].map((s) => <span key={s} className={s <= (item.rating ?? 5) ? "text-amber-400" : "text-gray-200"}>★</span>)}</div>
                <p className="text-sm opacity-70 italic leading-relaxed flex-1">"{item.text}"</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: `${accent}20` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{item.name?.charAt(0) ?? "?"}</div>
                  <div><p className="font-semibold text-sm">{item.name}</p>{item.role && <p className="text-xs opacity-50">{item.role}</p>}</div>
                </div>
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
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Join our happy patients</h2>
              <p className="text-white/80 mb-8">Experience the {brand.name} difference today — 5000+ mariz already trust us.</p>
              <a href={`https://${brand.slug}.cashcard.live/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>Get Started →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
