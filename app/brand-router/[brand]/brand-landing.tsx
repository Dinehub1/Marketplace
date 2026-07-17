import { BrandHeader, BrandFooter } from "./brand-header";
import { getBrandBusinesses } from "@/lib/brands";

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
      headline: "इंदौर की ताकत, आपकी जुड़ान",
      subheadline: "SarkarDost आपको आपने समुदाय से जोड़ता है — सेवाएं, अवसर और भरोसे के नेता, एक ही खिड़की पर।",
      highlights: [
        "📍 इंदौर की स्थानीय खोज — दूकान, सेवा, और विशेषज्ञ",
        "🤝 समुदाय भरोसा — समीक्षाएं, रेटिंग और वास्तविक फीडबैक",
        "📢 अवसर और सूचनाएं — रोज़गार, आयोजन और प्रशिक्षण की जानकारी",
      ],
    },
    "sarkarconnect": {
      headline: "B2B कनेक्शन जो काम करते हैं",
      subheadline: "SarkarConnect भारत के व्यापारियों को जोड़ता है — सप्लायर से लेकर डिस्ट्रीब्यूटर तक, एक ही प्लेटफ़ॉर्म पर।",
      highlights: [
        "🔗 वेरिफ़ाइड बिज़नेस नेटवर्क — हज़ारों सक्रिय व्यापारी",
        "📈 डील ट्रैकिंग — सीधे लीड से क्लोज़ तक का रिकॉर्ड",
        "💼 डिजिटल कार्ड — अपने व्यापार को प्रोफ़ेशनल तरीके से प्रेज़ेंट करें",
      ],
    },
    "sarkarhealth": {
      headline: "आपकी सेहत, हमारी ज़िम्मेदारी",
      subheadline: "SarkarHealth इंदौर के लिए पूर्ण हेल्थकेयर समाधान — डॉक्टर से लेकर दवाई तक, एक ही ऐप में।",
      highlights: [
        "🩺 वीडियो कंसल्टेशन — कहीं भी, कभी भी डॉक्टर से मिलें",
        "💊 ऑनलाइन दवाई ऑर्डर — घर बैठे दवाई पाएं",
        "📋 हेल्थ रिकॉर्ड — आपकी पूरी मेडिकल जानकारी सुरक्षित एक जगह",
      ],
    },
    "followup": {
      headline: "फॉलो-अप न भूलें, काम न गवाएं",
      subheadline: "FollowUp आपकी प्रोडक्टिविटी का साथी — याद दिलाएं, टास्क ट्रैक करें, हर काम पूरा करें।",
      highlights: [
        "📅 स्मार्ट रिमाइंडर — WhatsApp और SMS से याद दिलाव",
        "📋 टास्क ट्रैकिंग — हर फॉलो-अप का रिकॉर्ड",
        "📊 प्रग्रेस रिपोर्ट — दैनिन, साप्ताहिक और मासिक डैशबोर्ड",
      ],
    },
    "cloudplayer": {
      headline: "स्ट्रीमिंग का नया स्टैंडर्ड",
      subheadline: "Cloud Player — क्लाउड-पावर्ड मीडिया प्लेयर, बिना बफ़रिंग के आपका पसंदीदा कंटेंट।",
      highlights: [
        "⚡ ज़ीरो बफ़रिंग — तुरंत प्ले, कोई इंतज़ार नहीं",
        "☁️ क्लाउड स्टोरेज — कहीं से भी, कोई भी डिवाइस से",
        "🎬 4K सपोर्ट — उच्च गुणवत्ता कंटेंट बिना रुकावट",
      ],
    },
    "paisaflow": {
      headline: "हर रुपये पर स्मार्ट रिटर्न",
      subheadline: "PaisaFlow — आपकी बचत को निवेश में बदलें, रोज़ाना रिटर्न कमाएं।",
      highlights: [
        "💸 स्मार्ट रिटर्न — FD से लेकर म्यूचुअल फंड तक",
        "📈 पोर्फ़ोलियो ट्रैकिंग — रियल-टाइम अपडेट",
        "🎯 गोल-बेस्ड इन्वेस्टमेंट — आपके लक्ष्य के अनुसार",
      ],
    },
    "yaadrakh": {
      headline: "याद रखें, आगे बढ़ें",
      subheadline: "YaadRakh — आपकी प्रोडक्टिविटी का AI साथी जो आपकी याददाश्त को ताकत बनाता है।",
      highlights: [
        "🧠 स्मार्ट नोट्स — AI से संगठित और खोजने योग्य",
        "⏰ इंटेलिजेंट रिमाइंडर — समय पर याद दिलाव",
        "🔄 क्रॉस-डिवाइस सिंक — फोन, टैबलेट और लैपटॉप पर",
      ],
    },
    "sarkar-ai": {
      headline: "AI है तो सरकार है — आपका AI, आपका एम्पायर",
      subheadline: "Sarkar AI — बिना कोड लिखे AI पावर्ड बिज़नेस टूल्स। कंटेंट बनाएं, डेटा एनालाइज़ करें — सब एक ही प्लेटफ़ॉर्म पर।",
      highlights: ["🤖 AI कंटेंट जनरेटर — पोस्ट, इमेल और एड्स सेकंड में", "📊 स्मार्ट एनालिटिक्स — इंसाइट्स और रिपोर्ट्स", "💬 AI चैटबॉट — 24/7 स्वचालिक सपोर्ट"],
    },
    "sarkarfinance": {
      headline: "पैसा मिले, सही वक्त पर — वित्तीय सुविया अब आसान",
      subheadline: "SarkarFinance — लोन, म्यूचुअल फंड और वित्तीय सेवाएं अब डिजिटल और पारदर्शी।",
      highlights: ["📈 लोन कैलकुलेटर — तुरंत EMI और इंटरेस्ट रेट", "💳 क्रेडिट स्कोर चेक — फ्री में चेक करें", "🏦 डिजिटल बैंकिंग — बिना शाखा विज़िट के"],
    },
    "sarkarpay": {
      headline: "पेमेंट आए, बिज़नेस बढ़े — तेज़ और सुरक्षित",
      subheadline: "SarkarPay — UPI, QR कोड और ऑनलाइन पेमेंट सोल्यूशन आपके बिज़नेस के लिए।",
      highlights: ["⚡ UPI पेमेंट — तुरंत ट्रांसफ़र, कोई देरी नहीं", "📱 QR कोड — स्कैन करें और पे करें", "🔒 100% सुरक्षित — बैंक-ग्रेड एन्क्रिप्शन"],
    },
    "sarkarmart": {
      headline: "इंदौर का अपना मार्ट — लोकल बिज़नेस, ग्लोबल रीच",
      subheadline: "SarkarMart — अपनी दुकान को डिजिटल करें, पूरे इंदौर तक पहुंचें।",
      highlights: ["🛒 ऑनलाइन स्टोर — मिनटों में सेटअप", "📦 इन्वेंट्री मैनेजमेंट — स्टॉक ऑटो-ट्रैक", "📊 सेल्स डैशबोर्ड — रियल-टाइम एनालिटिक्स"],
    },
    "sarkarlegal": {
      headline: "कानूनी मदद, अब आसान — आपका कानूनी साथी",
      subheadline: "SarkarLegal — वकील से बात करें, डॉक्यूमेंट बनाएं, सलाह पाएं घर बैठे।",
      highlights: ["⚖️ ऑनलाइन वकील कंसल्टेशन — रियल-टाइम", "📄 डॉक्यूमेंट जनरेटर — अग्रीमेंट, नोटिस", "🔍 कानूनी खोज — हज़ारों केस लॉ एक जगह"],
    },
    "justdial-agent": {
      headline: "डेटा है तो डील है — डेटा-ड्रिवन बिज़नेस इंटेलिजेंस",
      subheadline: "JustDial Agent — बिज़नेस डेटा से स्मार्ट डिसीज़न लें और लीड जनरेट करें।",
      highlights: ["📊 बिज़नेस एनालिटिक्स — ट्रेंड और इंसाइट्स", "🎯 लीड जनरेशन — पोटेंशियल कस्टमर खोजें", "📱 मोबाइल डैशबोर्ड — हर जगह से मॉनिटर करें"],
    },
    "sarkarmarketplace": {
      headline: "इंदौर का सबसे बड़ा डायरेक्टरी — हज़ारों बिज़नेस, एक प्लेटफ़ॉर्म",
      subheadline: "SarkarMarketplace — 3,233+ वेरिफ़ाइड बिज़नेस को एक ही जगह पाएं।",
      highlights: ["🔍 स्मार्ट सर्च — ज़िप कोड और कैटेगरी से", "⭐ वेरिफ़ाइड रेटिंग — असली कस्टमर रिव्यू", "📍 लोकल डिस्कवरी — पास का बेस्ट ढूंढें"],
    },
    "ayurvedicwebsite": {
      headline: "100% प्राकृतिक, 100% भरोसेमंद — आयुर्वेदिक स्वास्थ्य",
      subheadline: "Mera Ayurvedic — 5,000 साल पुरानी आयुर्वेदिक परंपरा, आधुनिक विज्ञान के साथ।",
      highlights: ["🌿 प्राकृतिक उत्पाद — बिना रसायन के", "👨‍⚕️ आयुर्वेदिक परामर्श — ऑनलाइन डॉक्टर", "💊 व्यक्तिगत उपचार — आपकी देह प्रकृति के अनुसार"],
    },
    "sarkarghar": {
      headline: "घर मिले, ना कोई टेंशन — इंदौर का परफ़ेक्ट होम",
      subheadline: "SarkarGhar — रियल एस्टेट खोजें, किराया या खरीदें, सब डिजिटल।",
      highlights: ["🏠 स्मार्ट सर्च — बजट और लोकेशन के अनुसार", "📊 प्राइस एनालिटिक्स — मार्केट ट्रेंड जानें", "🔑 वर्चुअल टूर — घर देखो बिना जाए"],
    },
    "sarkarskills": {
      headline: "स्किल बनाओ, ज़िंदगी बदलो — सीखो कुछ नया",
      subheadline: "SarkarSkills — ऑनलाइन कोर्स, सर्टिफिकेशन और करियर गाइडेंस एक ही जगह।",
      highlights: ["📚 500+ कोर्स — टेक, बिज़नेस, क्रिएटिव", "🏅 सर्टिफिकेट — जॉब-रेडी क्रेडेंशियल", "👨‍🏫 एक्सपर्ट मेंटरिंग — वन-ऑन-वन गाइडेंस"],
    },
    "hyperframes-realestate": {
      headline: "घर देखो, वीडियो से — वर्चुअल टूर, रियल डिसीज़न",
      subheadline: "Hyperframes — 3D वर्चुअल टूर और वीडियो विज़ुअलाइज़ेशन से रियल एस्टेट में क्रांति।",
      highlights: ["🎥 3D वर्चुअल टूर — घर में घूमो बिना जाए", "📹 प्रोफ़ेशनल वीडियो — प्रॉपर्टी को स्टार बनाएं", "🗺️ इंटरैक्टिव मैप — प्रॉपर्टी लेआउट देखें"],
    },
    "sikshahub": {
      headline: "पढ़ाई हर घर पर — एजुकेशन फॉर एवरीवन",
      subheadline: "SikshaHub — ऑनलाइन क्लासेस, ट्यूटर और स्टडी मटेरियल — बिना कोई सीमा के।",
      highlights: ["📖 लाइव क्लासेस — रियल-टाइम इंटरैक्शन", "🎯 प्रैक्टिस टेस्ट — हर वीक मॉक एग्ज़ाम", "👨‍🏫 एक्सपर्ट टीचर्स — टॉप एजुकेटर्स से सीखें"],
    },
    "sarkartravel": {
      headline: "सफर करो, यादें बनाओ — ट्रैवल मोर, वरी लेस",
      subheadline: "SarkarTravel — बुकिंग, प्लानिंग और ट्रैवल गाइड — सब एक ही ऐप में।",
      highlights: ["✈️ फ्लाइट बुकिंग — सस्ते टिकट पाएं", "🏨 होटल रिज़र्वेशन — बेस्ट डील्स", "🗺️ ट्रैवल प्लानर — AI-बेस्ड इटिनरी"],
    },
    "sarkardukaan": {
      headline: "अपनी दुकान, अब डिजिटल — यूज़र-फ्रेंडली ऑनलाइन स्टोर",
      subheadline: "SarkarDukaan — अपने व्यापार को डिजिटल करें, मिनटों में ऑनलाइन स्टोर बनाएं।",
      highlights: ["🛍️ ऑनलाइन स्टोर बिल्डर — ड्रैग-एंड-ड्रॉप", "📦 इन्वेंट्री ट्रैकिंग — स्टॉक ऑटो-मैनेज", "💳 पेमेंट गेटवे — UPI, कार्ड, नेट बैंकिंग"],
    },
    "sarkarbazaar": {
      headline: "इंदौर का बाज़ार, अब ऑनलाइन — लोकल बिज़नेस, ग्लोबल रीच",
      subheadline: "SarkarBazaar — लोकल व्यापारियों को ग्लोबल मार्केट से जोड़ता है।",
      highlights: ["🏪 मल्टी-वेंडर मार्केटप्लेस — सैकड़ों विक्रेता", "📦 लॉजिस्टिक सपोर्ट — डिलीवरी पार्टनर नेटवर्क", "📊 मार्केट एनालिटिक्स — सेल्स ट्रेंड और इंसाइट्स"],
    },
    "sarkarjobs": {
      headline: "नौकरी ढूंढो, करियर बनाओ — जॉब्स दैटा मैचिंग",
      subheadline: "SarkarJobs — AI-पावर्ड जॉब मैचिंग, रिज़्यूमे बिल्डर और करियर गाइडेंस।",
      highlights: ["🎯 AI जॉब मैच — आपकी स्किल के अनुसार", "📝 रिज़्यूमे बिल्डर — प्रोफ़ेशनल टेम्पलेट", "📊 सैलरी इंसाइट — इंडस्ट्री बेंचमार्क"],
    },
    "sarkared": {
      headline: "सीखो, बढ़ो, बनो — स्किल्स दैट पे",
      subheadline: "SarkarEd — ऑनलाइन सर्टिफिकेशन, स्किल डेवलपमेंट और करियर-फोकस्ड कोर्सेज।",
      highlights: ["🎓 सर्टिफिकेट कोर्स — ग्लोबली रिकग्नाइज़्ड", "💻 लाइव प्रोजेक्ट्स — रियल-वर्ल्ड एक्सपीरियंस", "🤝 प्लेसमेंट सपोर्ट — इंटरव्यू प्रिप"],
    },
    "sarkarsarkar": {
      headline: "आपकी सरकार, आपके हाथ — गवर्नमेंट सेवाएं अब डिजिटल",
      subheadline: "SarkarSarkar — सरकारी सेवाएं, दस्तावेज़ और अधिकार — सब एक खिड़की पर।",
      highlights: ["🏛️ डिजिटल सेवाएं — आधार, पैन कार्ड, पासपोर्ट", "📄 दस्तावेज़ जनरेटर — फॉर्म और अप्लिकेशन", "🔍 RTI ऑनलाइन — सूचना का अधिकार, आसानी से"],
    },
    "sarkarwellness": {
      headline: "आयुर्वेद से स्वास्थ्य — एंशिएंट वेलनेस, मॉडर्न हीलिंग",
      subheadline: "SarkarWellness — योग, आयुर्वेद और प्राकृतिक उपचार आपके लिए।",
      highlights: ["🧘 योग क्लासेस — ऑनलाइन और ऑफलाइन", "🌿 आयुर्वेदिक उपचार — व्यक्तिगत प्लान", "🧠 मेंटल वेलनेस — मेडिटेशन और काउंसलिंग"],
    },
    "sarkarfood": {
      headline: "Indore's Best Food, Delivered to Your Door in 30 Minutes",
      subheadline: "Order from 200+ top-rated restaurants across Indore. From street food to fine dining — we bring it all, hot and fresh.",
      highlights: ["🚀 Live Order Tracking — Track your meal from kitchen to doorstep", "⚡ 30-Min Express Delivery — Hot, fresh food in half an hour", "🏪 200+ Restaurant Partners — Indore's best kitchens on one app"],
    },
  };

  const hero = brandHero[brand.slug] || {
    headline: brand.tagline || brand.name,
    subheadline: brand.description || `${brand.name} — आपकी विश्वसनीय प्लेटफ़ॉर्म।`,
    highlights: [],
  };

  // Brand-specific stats
    const brandStats: Record<string, Array<{ v: string; label: string; icon: string }>> = {
      sarkarhealth: [
        { v: "50+", label: "वेरिफ़ाइड डॉक्टर", icon: "🩺" },
        { v: "5,000+", label: "सक्रिय मरीज़", icon: "👥" },
        { v: "4.9★", label: "डॉक्टर रेटिंग", icon: "⭐" },
        { v: "24/7", label: "हेल्पलाइन", icon: "🚑" },
      ],
    };
    const stats = brandStats[brand.slug] ?? [
      { v: "10,000+", label: "सक्रिय उपयोगकर्ता", icon: "👥" },
      { v: "5,000+", label: "सफल इंटरैक्शन", icon: "✅" },
      { v: "4.9★", label: "औसत रेटिंग", icon: "⭐" },
      { v: "24/7", label: "समर्थन उपलब्ध", icon: "🛟" },
    ];

  // Brand-specific steps
    const brandSteps: Record<string, Array<{ n: string; t: string; d: string }>> = {
      sarkarhealth: [
        { n: "1", t: "डॉक्टर चुनें", d: "विशेषज्ञता और अनुभव के अनुसार सही डॉक्टर खोजें — प्रोफ़ाइल पढ़ें, रेटिंग देखें।" },
        { n: "2", t: "अपॉइंटमेंट बुक करें", d: "वीडियो या इन-पर्सन — अपनी सुविधा के अनुसार चुनें। तुरंत कन्फर्मेशन।" },
        { n: "3", t: "कंसल्ट करें", d: "डॉक्टर से मिलें, प्रिस्क्रिप्शन पाएं, दवाई ऑर्डर करें — सब एक जगह।" },
      ],
    };
    const steps = brandSteps[brand.slug] ?? [
      { n: "1", t: "Sign Up Karein", d: "Minutes mein account banayein — bina kisi complexity ke, bas mobile number se." },
      { n: "2", t: "Services Dhoen ya Bechhein", d: "Apni zaroorat ke anusaar services dhoen ya apne business ko promote karein." },
      { n: "3", t: "Judein aur Badhein", d: "Connections banayein, deals karein aur apne community mein progress karein." },
    ];

  // Brand-specific community
    const brandCommunity: Record<string, Array<{ icon: string; t: string; d: string }>> = {
      sarkarhealth: [
        { icon: "🏥", t: "हॉस्पिटल और क्लीनिक", d: "50+ पार्टनर हॉस्पिटल — इंदौर में सबसे बड़ा नेटवर्क" },
        { icon: "👨‍⚕️", t: "डॉक्टर्स", d: "MBBS, MD, BAMS — सभी विशेषज्ञता के वेरिफ़ाइड प्रैक्टिशनर" },
        { icon: "👨‍👩‍👧‍👦", t: "परिवार", d: "हर उम्र के मरीज़ — बच्चों से बुज़ुर्गों तक पूरा ख्याल" },
        { icon: "🔬", t: "लैब पार्टनर्स", d: "NABL सर्टिफ़ाइड लैब — सटीक रिपोर्ट, तेज़ डिलीवरी" },
      ],
    };
    const community = brandCommunity[brand.slug] ?? [
      { icon: "👤", t: "उपयोगकर्ता", d: "अपनी ज़रूरतों के अनुसार सेवाएं खोजें और भरोसेमंद पार्टनर पाएं" },
      { icon: "🏪", t: "व्यापारी", d: "अपने व्यापार को ऑनलाइन ले जाएं और नए ग्राहकों तक पहुंचें" },
      { icon: "👨‍💼", t: "पेशेवर", d: "अपनी कौशल को प्रमोट करें और सही अवसर पाएं" },
      { icon: "🏠", t: "परिवार", d: "परिवार की ज़रूरतों के लिए सही सेवा — एक ही जगह" },
    ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 30% 20%, ${primary} 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${secondary} 0%, transparent 50%)` }} />
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})`, animationDelay: "3s" }} />

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mb-4 text-6xl">{brand.emoji ?? "🤝"}</div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: primary }}>
            {brand.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl font-semibold" style={{ color: secondary }}>
            {hero.headline}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base opacity-70 leading-relaxed">
            {hero.subheadline}
          </p>

          {/* Highlights */}
          {hero.highlights.length > 0 && (
            <div className="mt-8 mx-auto max-w-2xl space-y-3 text-left">
              {hero.highlights.map((h: string, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-white/80 backdrop-blur-sm border px-5 py-3" style={{ borderColor: `${accent}30` }}>
                  <span className="text-lg mt-0.5">{h.split(" ")[0]}</span>
                  <span className="text-sm font-medium opacity-80">{h.substring(h.indexOf(" ") + 1)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {brand.features?.leads && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                📥 लीड कैप्चर
              </span>
            )}
            {brand.features?.payments && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                💳 UPI पेमेंट
              </span>
            )}
            {showListings && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                🗂️ {total.toLocaleString()} लिस्टिंग
              </span>
            )}
            {!brand.features?.leads && !brand.features?.payments && (
              <span className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: accent, color: primary }}>
                🏘️ इंदौर के {total > 0 ? `${total.toLocaleString()}+` : "हज़ारों"} स्थानीय व्यवसाय
              </span>
            )}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={`https://${brand.slug}.cashcard.live/login`}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
              style={{ backgroundColor: primary }}
            >
              शुरू करें →
            </a>
            <a
              href={`https://${brand.slug}.cashcard.live/about`}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold border-2 hover:bg-gray-50 transition-all"
              style={{ borderColor: accent, color: primary }}
            >
              और जानें
            </a>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="border-t" style={{ borderColor: `${accent}20` }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i} className="rounded-2xl p-6 border bg-white" style={{ borderColor: `${accent}20` }}>
                <div className="text-2xl mb-2">{s.icon}</div>
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
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>यह कैसे काम करता है</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>तीन आसान चरणों मं शुरू करें</h2>
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
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primary }}>समुदाय का हिस्सा बनें</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>{brand.name} का उपयोग कौन करता है?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {community.map((u, i) => (
              <div key={i} className="rounded-2xl border bg-white p-6 text-center" style={{ borderColor: `${accent}30` }}>
                <div className="text-4xl mb-3">{u.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{u.t}</h3>
                <p className="text-sm opacity-60">{u.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      {showListings && rows.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-12 w-full">
          <h2 className="mb-6 text-2xl font-bold" style={{ color: primary }}>
            Featured <span className="text-sm font-normal opacity-50">({total.toLocaleString()})</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b: any) => (
              <div key={b.id} className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${accent}40` }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{b.name}</span>
                  {b.rating && <span className="text-xs text-amber-500">★ {b.rating}</span>}
                </div>
                {b.category && <p className="mt-1 text-xs opacity-50">{b.category}</p>}
                <p className="mt-2 text-xs opacity-40">{[b.area, b.city].filter(Boolean).join(", ")}</p>
                {b.phone && <a href={`tel:${b.phone}`} className="mt-1 inline-block text-xs font-medium" style={{ color: primary }}>📞 {b.phone}</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
            Aaj hi shuru karein — {brand.name} ke saath juden
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Free mein register karein aur {brand.name} ke saath apna safar shuru karein — ghar baithe.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`https://${brand.slug}.cashcard.live/register`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>
              मुफ्त में शुरू करें →
            </a>
            <a href={`https://${brand.slug}.cashcard.live/contact`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
              संपर्क करें
            </a>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
