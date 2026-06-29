import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_PLANS: Record<string, Array<{ name: string; price: string; period: string; features: string[]; highlighted: boolean; tagline?: string }>> = {
  sarkarconnect: [
    {
      name: "स्टार्टर",
      price: "मुफ्त",
      period: "",
      features: [
        "बेसिक डिजिटल कार्ड",
        "5 कनेक्ट/माह",
        "कैटलॉग में 3 प्रोडक्ट",
        "कम्युनिटी एक्सेस",
      ],
      highlighted: false,
      tagline: "नए व्यापारियों के लिए शुरुआत",
    },
    {
      name: "बिज़नेस",
      price: "₹799",
      period: "/माह",
      features: [
        "सब कुछ स्टार्टर में",
        "असीमित कनेक्ट",
        "असीमित प्रोडक्ट कैटलॉग",
        "डील ट्रैकिंग डैशबोर्ड",
        "प्राथमिकता समर्थन",
        "WhatsApp बिज़नेस बैज",
      ],
      highlighted: true,
      tagline: "⭐ सबसे लोकप्रिय — बढ़ते व्यापारों के लिए",
    },
    {
      name: "एंटरप्राइज",
      price: "₹2,499",
      period: "/माह",
      features: [
        "सब कुछ बिज़नेस में",
        "AI पार्टनर मैचिंग",
        "टीम मेंबर (5 तक)",
        "API एक्सेस",
        "कस्टम ब्रांडिंग",
        "समर्पित अकाउंट मैनेजर",
      ],
      highlighted: false,
      tagline: "बड़े व्यापारों के लिए",
    },
  ],
  sarkarhealth: [
    {
      name: "बेसिक",
      price: "मुफ्त",
      period: "",
      features: [
        "डॉक्टर खोज और प्रोफ़ाइल देखना",
        "2 अपॉइंटमेंट/माह",
        "बेसिक हेल्थ रिकॉर्ड",
        "कम्युनिटी फ़ोरम एक्सेस",
      ],
      highlighted: false,
      tagline: "शुरुआती स्वास्थ्य देखभाल",
    },
    {
      name: "हेल्थ प्रो",
      price: "₹299",
      period: "/माह",
      features: [
        "सब कुछ बेसिक में",
        "असीमित वीडियो कंसल्टेशन",
        "दवाई डिलीवरी (15% छूट)",
        "लैब टेस्ट बुकिंग (10% छूट)",
        "प्राथमिकता अपॉइंटमेंट",
        "हेल्थ रिपोर्ट डाउनलोड",
      ],
      highlighted: true,
      tagline: "⭐ सबसे लोकप्रिय — परिवार की सेहत",
    },
    {
      name: "फैमिली प्लान",
      price: "₹699",
      period: "/माह",
      features: [
        "सब कुछ हेल्थ प्रो में",
        "6 सदस्यों के लिए कवर",
        "असीमित कंसल्टेशन सभी के लिए",
        "मुफ्त लैब सैंपल कलेक्शन",
        "डॉक्टर होम विज़िट (मासिक 1)",
        "एमरजेंसी हेल्पलाइन 24/7",
      ],
      highlighted: false,
      tagline: "पूरे परिवार के लिए पूर्ण सुरक्षा",
    },
  ],
  sarkardost: [
    {
      name: "नीडी व्यवसाय",
      price: "मुफ्त",
      period: "",
      features: [
        "बेसिक लिस्टिंग (नाम, फोन, पता)",
        "समुदाय खोज में दिखना",
        "5 लीड/माह",
        "मोबाइल नंबर सत्यापन",
      ],
      highlighted: false,
      tagline: "शुरुआत करें — बिना किसी खर्च के",
    },
    {
      name: "प्रो व्यवसाय",
      price: "₹499",
      period: "/माह",
      features: [
        "सब कुछ नीडी में",
        "प्राथमिकता खोज में (टॉप पर)",
        "असीमित लीड",
        "WhatsApp नोटिफिकेशन",
        "फोटो गैलरी (10 फोटो)",
        "कैटेगरी विशेषज्ञता बैज",
        "एनालिटिक्स डैशबोर्ड",
      ],
      highlighted: true,
      tagline: "सबसे लोकप्रिय — तेज़ी से बढ़ें",
    },
    {
      name: "प्रीमियम पार्टनर",
      price: "₹1,499",
      period: "/माह",
      features: [
        "सब कुछ प्रो में",
        "विज्ञापन बैनर प्रदर्शन",
        "API एक्सेस (CRM इंटीग्रेशन)",
        "समर्पित अकाउंट मैनेजर",
        "कस्टम ब्रांड प्रोफ़ाइल पेज",
        "सीधे ग्राहक के संपर्क में",
        "प्राइसींग में 20% छूट",
      ],
      highlighted: false,
      tagline: "बड़े व्यापारों के लिए",
    },
  ],
  followup: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["5 रिमाइंडर/माह", "बेसिक टास्क", "ईमेल नोटिफिकेशन"], highlighted: false, tagline: "व्यक्तिगत उपयोग के लिए" },
    { name: "प्रो", price: "₹199", period: "/माह", features: ["असीमित रिमाइंडर", "WhatsApp एसएमएस", "टीम (3 सदस्य)", "AI ऑटोमेशन"], highlighted: true, tagline: "⭐ प्रोफेशनल्स के लिए" },
    { name: "बिज़नेस", price: "₹499", period: "/माह", features: ["सब कुछ प्रो में", "असीमित टीम", "API एक्सेस", "कस्टम ब्रांडिंग"], highlighted: false, tagline: "टीमों के लिए" },
  ],
  cloudplayer: [
    { name: "बेसिक", price: "मुफ्त", period: "", features: ["HD स्ट्रीमिंग", "5GB स्टोरेज", "मोबाइल ऐप"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "प्रीमियम", price: "₹299", period: "/माह", features: ["4K HDR", "100GB स्टोरेज", "ऑफलाइन डाउनलोड", "डॉल्बी ऑडियो"], highlighted: true, tagline: "⭐ सर्वोत्तम अनुभव" },
    { name: "फैमिली", price: "₹499", period: "/माह", features: ["5 प्रोफाइल", "200GB स्टोरेज", "प्राथमिकता समर्थन"], highlighted: false, tagline: "पूरे परिवार के लिए" },
  ],
  paisaflow: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक पोर्टफोलियो", "रिटर्न कैलकुलेटर", "बाज़ार समाचार"], highlighted: false, tagline: "निवेश शुरू करने के लिए" },
    { name: "गोल्ड", price: "₹499", period: "/माह", features: ["AI रिस्क एनालिसिस", "गोल-बेस्ड प्लान", "रियल-टाइम अलर्ट", "वित्तीय सलाह"], highlighted: true, tagline: "⭐ गंभीर निवेशकों के लिए" },
    { name: "प्लैटिनम", price: "₹999", period: "/माह", features: ["सब कुछ गोल्ड में", "समर्पित सलाहकार", "टैक्स प्लानिंग", "प्राथमिकता समर्थन"], highlighted: false, tagline: "उच्च-निवल व्यक्तियों के लिए" },
  ],
  yaadrakh: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["10 नोट्स/माह", "बेसिक रिमाइंडर", "मोबाइल ऐप"], highlighted: false, tagline: "व्यक्तिगत उपयोग" },
    { name: "प्रो", price: "₹149", period: "/माह", features: ["असीमित नोट्स", "AI नोट्स", "क्रॉस-डिवाइस सिंक", "स्मार्ट सर्च"], highlighted: true, tagline: "⭐ सर्वोत्तम मूल्य" },
    { name: "टीम", price: "₹399", period: "/माह", features: ["5 सदस्य", "टीम नोट्स", "साझा रिमाइंडर", "API एक्सेस"], highlighted: false, tagline: "टीमों के लिए" },
  ],
  "sarkar-ai": [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["100 क्वेरी/माह", "बेसिक AI", "हिंदी समर्थन"], highlighted: false, tagline: "AI का परीक्षण" },
    { name: "प्रो", price: "₹499", period: "/माह", features: ["असीमित क्वेरी", "संदर्भ समझ", "कार्य स्वचालन", "API एक्सेस"], highlighted: true, tagline: "⭐ प्रोफेशनल उपयोग" },
    { name: "एंटरप्राइज", price: "₹1,999", period: "/माह", features: ["कस्टम मॉडल", "समर्पित सहायता", "SLA", "बैच प्रोसेसिंग"], highlighted: false, tagline: "बड़े संगठनों के लिए" },
  ],
  sarkarfood: [
    { name: "ग्राहक", price: "मुफ्त", period: "", features: ["ऑर्डर ट्रैकिंग", "रेटिंग और रिव्यू", "बेसिक ऑफर"], highlighted: false, tagline: "खाने वालों के लिए" },
    { name: "प्रीमियम", price: "₹99", period: "/माह", features: ["मुफ्त डिलीवरी", "विशेष ऑफर", "प्राथमिकता समर्थन", "10% कैशबैक"], highlighted: true, tagline: "⭐ नियमित ग्राहकों के लिए" },
  ],
  sarkarfinance: [
    { name: "बेसिक", price: "मुफ्त", period: "", features: ["क्रेडिट स्कोर चेक", "लोन कैलकुलेटर", "बेसिक सलाह"], highlighted: false, tagline: "वित्तीय जागरूकता" },
    { name: "प्रीमियम", price: "₹299", period: "/माह", features: ["तत्काल लोन", "वित्तीय सलाह", "EMI ट्रैकर", "क्रेडिट सुधार"], highlighted: true, tagline: "⭐ सर्वोत्तम सेवा" },
  ],
  sarkarpay: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["UPI स्वीकार", "बेसिक डैशबोर्ड", "₹50,000/माह लिमिट"], highlighted: false, tagline: "छोटे व्यापारियों के लिए" },
    { name: "बिज़नेस", price: "₹499", period: "/माह", features: ["सभी मोड", "असीमित लेन-देन", "एनालिटिक्स", "API एक्सेस"], highlighted: true, tagline: "⭐ बढ़ते व्यापारों के लिए" },
    { name: "एंटरप्राइज", price: "₹1,499", period: "/माह", features: ["कस्टम ब्रांडिंग", "समर्पित सहायता", "SLA", "बहु-मुद्रा"], highlighted: false, tagline: "बड़े संगठनों के लिए" },
  ],
  sarkarmart: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक लिस्टिंग", "5 उत्पाद", "कम्युनिटी"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "सेलर", price: "₹399", period: "/माह", features: ["असीमित उत्पाद", "डिलीवरी नेटवर्क", "एनालिटिक्स", "कैशबैक"], highlighted: true, tagline: "⭐ सक्रिय विक्रेताओं के लिए" },
    { name: "प्रीमियम", price: "₹999", period: "/माह", features: ["प्रीमियम स्थान", "विज्ञापन", "API एक्सेस", "समर्पित सहायता"], highlighted: false, tagline: "बड़े विक्रेताओं के लिए" },
  ],
  sarkarlegal: [
    { name: "बेसिक", price: "मुफ्त", period: "", features: ["परामर्श (15 मिनट)", "दस्तावेज़ टेम्पलेट", "कानूनी लेख"], highlighted: false, tagline: "शुरुआती जानकारी" },
    { name: "प्रो", price: "₹499", period: "/माह", features: ["असीमित परामर्श", "दस्तावेज़ तैयारी", "कोर्ट सहायता"], highlighted: true, tagline: "⭐ पूर्ण कानूनी सहायता" },
  ],
  "justdial-agent": [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक लिस्टिंग", "5 लीड/माह", "रेटिंग प्रफाइल"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "प्रीमियम", price: "₹799", period: "/माह", features: ["प्रीमियम स्थान", "असीमित लीड", "एनालिटिक्स", "API एक्सेस"], highlighted: true, tagline: "⭐ बढ़ते व्यापारों के लिए" },
  ],
  sarkarmarketplace: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक लिस्टिंग", "3 श्रेणी", "कम्युनिटी"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "व्यापार", price: "₹599", period: "/माह", features: ["असीमित लिस्टिंग", "एनालिटिक्स", "लीड जनरेशन"], highlighted: true, tagline: "⭐ सक्रिय व्यापारियों के लिए" },
  ],
  ayurvedicwebsite: [
    { name: "ग्राहक", price: "मुफ्त", period: "", features: ["उत्पाड ब्राउज़", "बेसिक सलाह", "ऑर्डर ट्रैकिंग"], highlighted: false, tagline: "खरीदारों के लिए" },
    { name: "VIP", price: "₹199", period: "/माह", features: ["15% छूट", "मुफ्त शिपिंग", "वैद्य परामर्श", "विशेष उत्पाद"], highlighted: true, tagline: "⭐ नियमित ग्राहकों के लिए" },
  ],
  sarkarghar: [
    { name: "खोजी", price: "मुफ्त", period: "", features: ["संपत्ति ब्राउज़", "बेसिक फ़िल्टर", "संपर्क"], highlighted: false, tagline: "खोजने वालों के लिए" },
    { name: "प्रीमियम", price: "₹499", period: "/माह", features: ["वर्चुअल टूर", "लोन सहायता", "प्राथमिकता", "एनालिटिक्स"], highlighted: true, tagline: "⭐ गंभीर खरीदारों के लिए" },
  ],
  sarkarskills: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक कोर्स", "समुदाय", "बेसिक सामग्री"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "प्रो", price: "₹500", period: "/माह", features: ["सभी कोर्स", "प्रमाण-पत्र", "प्लेसमेंट सहायता", "लाइव सत्र"], highlighted: true, tagline: "⭐ करियर के लिए" },
  ],
  "hyperframes-realestate": [
    { name: "बेसिक", price: "मुफ्त", period: "", features: ["संपत्ति ब्राउज़", "संपर्क"], highlighted: false, tagline: "खोजने वालों के लिए" },
    { name: "प्रो", price: "₹999", period: "/माह", features: ["वीडियो टूर", "लोन सहायता", "एजेंट मैचिंग", "एनालिटिक्स"], highlighted: true, tagline: "⭐ गंभीर खरीदारों और एजेंटों के लिए" },
  ],
  sikshahub: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक सामग्री", "5 वीडियो/माह", "समुदाय"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "प्रो", price: "₹199", period: "/माह", features: ["सभी सामग्री", "असीमित वीडियो", "लाइव ट्यूशन", "प्रग्रेस रिपोर्ट"], highlighted: true, tagline: "⭐ पूरी तैयारी के लिए" },
  ],
  sarkartravel: [
    { name: "बेसिक", price: "मुफ्त", period: "", features: ["दर तुलना", "बेसिक बुकिंग", "यात्रा सुझाव"], highlighted: false, tagline: "यात्रियों के लिए" },
    { name: "प्रीमियम", price: "₹299", period: "/माह", features: ["विशेष दर", "बीमा", "24/7 सहायता", "लचीली बुकिंग"], highlighted: true, tagline: "⭐ बार-बार यात्रा करने वालों के लिए" },
  ],
  sarkardukaan: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक स्टोर", "5 उत्पाद", "UPI भुगतान"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "प्रो", price: "₹399", period: "/माह", features: ["असीमित उत्पाद", "डिलीवरी नेटवर्क", "एनालिटिक्स", "कस्टम डोमेन"], highlighted: true, tagline: "⭐ बढ़ते दुकानदारों के लिए" },
  ],
  sarkarbazaar: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक लिस्टिंग", "3 उत्पाद", "स्थानीय पहुंच"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "व्यापार", price: "₹599", period: "/माह", features: ["असीमित उत्पाद", "B2B नेटवर्क", "निर्यात सहायता", "एनालिटिक्स"], highlighted: true, tagline: "⭐ सक्रिय व्यापारियों के लिए" },
  ],
  sarkarjobs: [
    { name: "उम्मीदवार", price: "मुफ्त", period: "", features: ["प्रोफ़ाइल बनाएं", "5 आवेदन/माह", "बेसिक रिज्यूमे"], highlighted: false, tagline: "नौकरी खोजने वालों के लिए" },
    { name: "प्रो", price: "₹199", period: "/माह", features: ["असीमित आवेदन", "प्रीमियम रिज्यूमे", "कैरियर सलाह", "प्राथमिकता"], highlighted: true, tagline: "⭐ गंभीर उम्मीदवारों के लिए" },
  ],
  sarkared: [
    { name: "स्टार्टर", price: "मुफ्त", period: "", features: ["बेसिक कोर्स", "समुदाय", "बेसिक सामग्री"], highlighted: false, tagline: "शुरुआत के लिए" },
    { name: "प्रो", price: "₹499", period: "/माह", features: ["सभी कोर्स", "प्रमाण-पत्र", "प्लेसमेंट", "लाइव सत्र"], highlighted: true, tagline: "⭐ करियार के लिए" },
  ],
  sarkarsarkar: [
    { name: "नागरिक", price: "मुफ्त", period: "", features: ["सेवा सूची", "आवेदन सहायता", "स्थिति ट्रैकिंग"], highlighted: false, tagline: "सभी नागरिकों के लिए" },
    { name: "प्रीमियम", price: "₹199", period: "/माह", features: ["प्राथमिकता सहायता", "होम विजिट", "डॉक्यूमेंट पिकअप", "समर्पित सहायता"], highlighted: true, tagline: "⭐ पूर्ण सुविधा के लिए" },
  ],
  sarkarwellness: [
    { name: "बेसिक", price: "मुफ्त", period: "", features: ["स्वास्थ्य सलाह", "योग वीडियो", "पोषण योजना"], highlighted: false, tagline: "स्वास्थ्य जागरूकता" },
    { name: "प्रीमियम", price: "₹499", period: "/माह", features: ["वैद्य परामर्श", "व्यक्तिगत योजना", "पंचकर्म बुकिंग", "योग कक्षाएं"], highlighted: true, tagline: "⭐ पूर्ण स्वास्थ्य प्रबंधन" },
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
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>प्राइसिंग</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>साफ़ और सीधी कीमतें</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">
            अपने व्यापार के हिसाब से प्लान चुनें। कोई छुपी फीस नहीं, कभी भी रद्द कर सकते हैं।
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan: any, i: number) => (
              <div key={i} className={`card-lift rounded-2xl p-6 flex flex-col ${plan.highlighted ? "md:scale-105 shadow-2xl" : "shadow-sm"}`} style={plan.highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { border: `1px solid ${accent}30` }}>
                {plan.highlighted && <div className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">⭐ सबसे लोकप्रिय</div>}
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
                <a href={`https://${brand.slug}.cashcard.live/register`} className={`block text-center rounded-xl py-3 text-sm font-bold transition-all hover:translate-y-[-2px] ${plan.highlighted ? "bg-white" : "text-white"}`} style={!plan.highlighted ? { background: `linear-gradient(135deg, ${primary}, ${secondary})` } : { color: primary }}>
                  {plan.price === "मुफ्त" ? "अभी शुरू करें" : "सब्सक्राइब करें"}
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
            <h2 className="heading-md" style={{ color: primary }}>अक्सर पूछे जाने वाले सवाल</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Kya main free mein doctor se baat kar sakta hoon?", a: "Pehla consultation free hai! Uske baad Health Pro plan mein unlimited video consultations milte hain sirf �299/maheene." },
              { q: "Kya doctor ghar par aayega?", a: "Haan, Family Plan (₹699/mein) mein monthly 1 doctor home visit shamil hai — specialist physician aapke ghar aayega." },
              { q: "Dawai kaise order karein?", a: "Prescription upload karein ya direct order karein — generic options mein 40% tak bachat. Same-day delivery Indore mein." },
              { q: "Kya insurance claim hoga?", a: "Hum TPA tie-up ke saath hain — cashless claims aram se process hoti hain. Billing documents milte hain directly app mein." },
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
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Custom Plan Chahiye?</h2>
          <p className="text-white/80 mb-8">Badho hospitals, clinics aur chains ke liye special pricing available hai.</p>
              <a href={`https://${brand.slug}.cashcard.live/quote`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>कस्टम कोट मांगें →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
