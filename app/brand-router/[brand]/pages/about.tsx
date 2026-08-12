import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_ABOUT: Record<string, { story: string; mission: string; vision?: string; values: Array<{ icon: string; title: string; desc: string }>; whyChoose?: Array<{ title: string; desc: string }>; stats?: Array<{ label: string; value: string }> }> = {
  sarkarconnect: {
    story: "SarkarConnect का जन्म एक सवाल से हुआ — भारत में करोड़ों छोटे और मध्यम व्यापारी हैं, फिर भी उनके पास सही B2B नेटवर्क तक पहुंच नहीं।\n\n2024 में, हमने SarkarConnect लॉन्च किया — एक प्लेटफ़ॉर्म जो व्यापारियों को उनके इंडस्ट्री, लोकेशन और ज़रूरत के आधार पर जोड़ता है।\n\nआज, SarkarConnect 10,000+ वेरिफ़ाइड बिज़नेस को जोड़ता है — मैन्युफैक्चरिंग, इलेक्ट्रॉनिक्स, टेक्सटाइल, खाद्य प्रसंस्करण और दर्जनों अन्य सेक्टर में। हर महीने सैकड़ों नए डील क्लोज़ होते हैं।",
    mission: "हमारा मिशन भारत के MSME के लिए B2B ट्रेड को डिजिटल और पारदर्शी बनाना है — ताकि हर व्यापारी सही पार्टनर तक पहुंच सके, बिना बिचौलियों के।",
    values: [
      { icon: "🔗", title: "कनेक्शन", desc: "हम सिर्फ प्लेटफ़ॉर्म नहीं, रिश्ते बनाते हैं — हर कनेक्शन को मानते हैं।" },
      { icon: "✅", title: "सत्यापन", desc: "हर बिज़नेस वेरिफ़ाइड है — असली व्यापारियों के लिए असली नेटवर्क।" },
      { icon: "📈", title: "ग्रोथ", desc: "हमारा लक्ष्य आपकी ग्रोथ है — हर फीचर व्यापार बढ़ाने के लिए बना है।" },
      { icon: "🇮🇳", title: "भारत परंपरा", desc: "स्वदेशी व्यापार को बढ़ावा — हम Make in India के प्रति प्रतिबद्ध हैं।" },
    ],
  },
  sarkarhealth: {
    story: "SarkarHealth की शुरुआत इंदौर के एक सरकारी हॉस्पिटल में हुई — जहाँ एक युवा डॉक्टर ने देखा कि मरीज़ों को सही डॉक्टर मिलने में घंटों इंतज़ार करना पड़ता है।\n\n2025 में, हमने SarkarHealth लॉन्च किया — एक डिजिटल हेल्थकेयर प्लेटफ़ॉर्म जो मरीज़ों को वेरिफ़ाइड डॉक्टरों, लैब टेस्ट और दवाई डिलीवरी से जोड़ता है।\n\nआज, SarkarHealth 50+ वेरिफ़ाइड डॉक्टरों, 10+ लैब पार्टनर्स और 5,000+ सक्रिय मरीज़ों की सेवा कर रहा है — इंदौर में सबसे तेज़ी से बढ़ता डिजिटल हेल्थकेयर नेटवर्क।",
    mission: "हमारा मिशन हर इंदौरवासी को किफ़ायती और गुणवत्तापूर्ण स्वास्थ्य सेवा देना है — चाहे वह कोई भी इलाका हो या आय का स्तर।",
    values: [
      { icon: "🩺", title: "चिकित्सा उत्तरदायित्व", desc: "हर डॉक्टर लाइसेंस्ड और वेरिफ़ाइड है — आपकी सेहत हमारी ज़िम्मेदारी।" },
      { icon: "💰", title: "किफ़ायत", desc: "सार्वजनिक हॉस्पिटल जैसे दर — बिना किसी छुपी फीस के।" },
      { icon: "🔒", title: "गोपनीयता", desc: "आपका हेल्थ डेटा पूरी तरह एन्क्रिप्टेड और सुरक्षित है।" },
      { icon: "❤️", title: "मरीज़ केंद्रित", desc: "हर फीचर मरीज़ की सुविधा के लिए बना है — आराम से स्वास्थ्य सेवा।" },
    ],
  },
  sarkardost: {
      story: "SarkarDost की शुरुआत इंदौर में हुई — जहाँ एक सामान्य चाय की दुकान से मिले दो दोस्तों ने देखा कि स्थानीय व्यापारियों को अपने ग्राहकों तक पहुंचने के लिए रोज़गार का संघर्ष करना पड़ता है।\\n\\n2024 में, हमने तय किया कि इंदौर के हर दुकानदार, सेवा प्रदाता और विशेषज्ञ को एक समान मंच मिलना चाहिए — जहाँ वे अपनी क्षमता से ग्राहक पा सकें, बिना बड़े प्लेटफ़ॉर्मों की भारी फीस चुकाए।\\n\\nआज SarkarDost इंदौर के 800+ स्थानीय व्यापारों, 40,000+ सक्रिय उपयोगकर्ताओं और 25+ इलाकों को जोड़ता है — एक समुदाय जहाँ भरोसा, स्थानीयता और तकनीक मिलती है। हमारी यात्रा राजवाड़ा की छोटी चाय की दुकान से शुरू हुई, जहाँ राजू भाई ने अपनी दुकान की ऑनलाइन उपस्थिति बनाकर अपने दैनिक ग्राहकों में 3倍增长 देखी। आज, हम उसी espírito के साथ हर छोटे व्यापारी को डिजिटल सफलता दिलाने के लिए प्रतिबद्ध हैं।",
      mission: "हमारा मिशन इंदौर के हर व्यापार को डिजिटल रूप से सशक्त बनाना है — ताकि वे अपनी कार्यक्षेत्र से सीमित न रहें और पूरे शहर के ग्राहकों तक पहुंच सकें। हम विश्वास करते हैं कि हर स्थानीय दुकान, चाहे वह चाय की दुकान हो या प्रोफेशनल सर्विस, डिजिटल युग में विकास का हकदार है।",
      vision: "इंदौर का सबसे भरोसेमंद स्थानीय व्यवसाय नेटवर्क बनना, जहाँ हर व्यापारी अपने पड़ोस के ग्राहक से जुड़ सके और हर नागरिक अपने पड़ोस की सेवाओं को आसानी से खोज सके।",
      values: [
        { icon: "🤝", title: "भरोसा", desc: "हर लिस्टिंग और समीक्षा सत्यापित है — हम पारदर्शिता को प्राथमिकता देते हैं।" },
        { icon: "📍", title: "स्थानीयता", desc: "इंदौर पहले — हमारी हर विशेषता शहर की ज़रूरतों के अनुसार बनी है।" },
        { icon: "🚀", title: "सादगी", desc: "टेक्नोलॉジー आसान होनी चाहिए — हमारा प्लेटफ़ॉर्म किसी भी उम्र के व्यापारी को चला सके।" },
        { icon: "💚", title: "समुदाय", desc: "हम व्यापार नहीं, रिश्ते बनाते हैं — हर इंटरैक्शन को बराबरी का मानते हैं।" },
        { icon: "📈", title: "वृद्धि", desc: "हमारे प्लेटफ़ॉर्म पर सूचीबद्ध व्यापारियों को औसतन 60% अधिक ग्राहक मिलते हैं।" },
      ],
      whyChoose: [
        { title: "विश्वासीय समुदाय", desc: "सत्यापित सूचियों और वास्तविक ग्राहक समीक्षाओं के माध्यम से भरोसा बनाएं।" },
        { title: "स्थानीय फोकस", desc: "इंदौर के प्रत्येक क्षेत्र — विजय नगर से राजवाड़ा तक — विशेष रूप से सेवा प्रदान की जाती है।" },
        { title: "सरल प्रबंधन", desc: "एकल डैशबोर्ड से अपनी सूची, अपॉइंटमेंट और ग्राहक संदेशों का प्रबंधन करें।" },
        { title: "विकास-केंद्रित", desc: "हमारे विपणन टूल्स और विश्लेषिकी आपके व्यवसाय के विस्तार में मदद करते हैं।" },
        { title: "सस्ता समाधान", desc: "महंगे प्लेटफ़ॉर्म शुल्क के बिना आवश्यक सुविधाएँ प्राप्त करें — हमारी मूल्य निर्धारण स्थानीय व्यापारियों के लिए डिज़ाइन की गई है।" },
      ],
      stats: [
        { label: "सक्रिय व्यापारियों", value: "800+" },
        { label: "मासिक उपयोगकर्ता", value: "40,000+" },
        { label: "सेवा वाले क्षेत्र", value: "25+" },
        { label: "औसत ग्राहक वृद्धि", value: "60%" },
        { label: "सत्यापित समीक्षाएँ", value: "15,000+" },
        { label: "टीम सदस्य", value: "15+" },
      ],
    },
  followup: {
    story: "FollowUp का जन्म एक सामान्य समस्या से हुआ — व्यापारी, डॉक्टर, लॉयर और प्रोफेशनल्स के पास सैकड़ों क्लाइंट हैं, लेकिन फॉलो-अप भूलने से डील नहीं होती।\n\n2025 में, हमने FollowUp लॉन्च किया — एक स्मार्ट रिमाइंडर और टास्क मैनेजमेंट प्लेटफ़ॉर्म जो AI से चलता है।\n\nआज, FollowUp 2,000+ प्रोफेशनल्स को उनके कार्य को व्यवस्थित करने में मदद करता है — इंदौर में सबसे तेज़ी से बढ़ता प्रोडक्टिविटी टूल।",
    mission: "हमारा मिशन हर प्रोफेशनल को उनके कार्य को स्वचालित करना है — ताकि वे फॉलो-अप ना भूलें और अपने बिज़नेस को बढ़ा सकें।",
    values: [
      { icon: "📅", title: "स्मार्ट", desc: "AI-संचालित रिमाइंडर — सही समय पर सही संदेश।" },
      { icon: "🔄", title: "स्वचालन", desc: "दोहराए जाने वाले कार्य स्वचालित — समय बचाएं।" },
      { icon: "📊", title: "डेटा", desc: "प्रोडक्टिविटी का डेटा — सुधारने के सुझाव।" },
      { icon: "🤝", title: "टीम", desc: "टीम के साथ सहयोग — सबको एक साथ।" },
    ],
  },
  cloudplayer: {
    story: "Cloud Player की शुरुआत तब हुई जब एक मीडिया कंपनी ने देखा कि उपयोगकर्ता क्लाउड स्ट्रीमिंग में बफ़रिंग और लैग से तंग आ चुके हैं।\n\n2024 में, हमने Cloud Player लॉन्च किया — क्लाउड-नेटिव आर्किटेक्चर के साथ ज़ीरो बफ़रिंग स्ट्रीमिंग।\n\nआज, Cloud Player 10,000+ सक्रिय उपयोगकर्ताओं को 4K HDR कंटेंट प्रदान करता है — इंडिया में सबसे तेज़ क्लाउड स्ट्रीमिंग प्लेटफ़ॉर्म।",
    mission: "हमारा मिशन हर भारतीय को अविश्वसनीय मूल्य पर प्रीमियम मीडिया अनुभव देना है — बफ़रिंग के बिना।",
    values: [
      { icon: "⚡", title: "गति", desc: "ज़ीरो बफ़रिंग — तुरंत प्ले।" },
      { icon: "☁️", title: "क्लाउड", desc: "कहीं से भी, किसी भी डिवाइस से।" },
      { icon: "🎬", title: "गुणवत्ता", desc: "4K HDR — सिनेमा जैसा अनुभव।" },
      { icon: "🔊", title: "ध्वनि", desc: "Dolby Atmos — श्रवण अनुभव।" },
    ],
  },
  paisaflow: {
    story: "PaisaFlow का जन्म एक सवाल से हुआ — भारत में करोड़ों लोग हैं जो निवेश करना चाहते हैं, लेकिन सही मार्गदर्शन नहीं मिलता।\n\n2025 में, हमने PaisaFlow लॉन्च किया — एक स्मार्ट इन्वेस्टमेंट प्लेटफ़ॉर्म जो AI-आधारित रिस्क एनालिसिस प्रदान करता है।\n\nआज, PaisaFlow 5,000+ निवेशकों को सही निवेश निर्णय लेने में मदद करता है — इंदौर में सबसे विश्वसनीय वित्तीय प्लेटफ़ॉर्म।",
    mission: "हमारा मिशन हर भारतीय को सुरक्षित और लाभदायक निवेश के अवसर प्रदान करना है — छोटे निवेशकों से बड़े निवेशकों तक।",
    values: [
      { icon: "💸", title: "लाभ", desc: "स्मार्ट निवेश — बेहतर रिटर्न।" },
      { icon: "🛡️", title: "सुरक्षा", desc: "AI रिस्क स्कोर — सुरक्षित निवेश।" },
      { icon: "📈", title: "ट्रैकिंग", desc: "रियल-टाइम पोर्टफोलियो।" },
      { icon: "🏦", title: "बैंक", desc: "सभी प्रमुख बैंकों से जुड़ाव।" },
    ],
  },
  yaadrakh: {
    story: "YaadRakh का जन्म एक व्यक्ति की समस्या से हुआ — ज़िंदगी में इतने काम होते हैं कि कुछ ना कुछ भूल ही जाता है।\n\n2025 में, हमने YaadRakh लॉन्च किया — एक AI-संचालित नोट्स और रिमाइंडर ऐप जो आपकी बातें सुकर नोट्स बनाता है।\n\nआज, YaadRakh 3,000+ उपयोगकर्ताओं को उनकी दैनिक ज़िम्मेदारियां याद रखने में मदद करता है — इंदौर में सबसे अच्छा प्रोडक्टिविटी ऐप।",
    mission: "हमारा मिशन हर व्यक्ति को उनकी दैनिक ज़िम्मेदारियां याद रखने में मदद करना है — AI की सहायता से।",
    values: [
      { icon: "🧠", title: "AI", desc: "AI नोट्स — संगठित और खोजने योग्य।" },
      { icon: "⏰", title: "रिमाइंडर", desc: "स्मार्ट रिमाइंडर — कभी ना भूलें।" },
      { icon: "🔄", title: "सिंक", desc: "क्रॉस-डिवाइस — हर जगह।" },
      { icon: "🔒", title: "सुरक्षा", desc: "एन्क्रिप्टेड — सिर्फ आपका।" },
    ],
  },
  "sarkar-ai": {
    story: "Sarkar AI का जन्म 2024 में हुआ — जब AI तकनीक ने भारत में तेज़ी से प्रगति की।\n\nहमने देखा कि छोटे व्यापारियों और शिक्षकों के पास AI का उपयोग करने का साधन नहीं — Sarkar AI ने इस अंतर को दूर किया।\n\nआज, Sarkar AI 2,000+ उपयोगकर्ताओं को AI असिस्टेंट, कार्य स्वचालन और बहुभाषी समर्थन प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को AI तकनीक का लाभ प्रदान करना है — सरल, किफ़ायती और प्रभावी।",
    values: [
      { icon: "🤖", title: "AI", desc: "24/7 उपलब्ध — बुद्धिमान सहायक।" },
      { icon: "⚡", title: "तेज़", desc: "मिलीसेकंड में उत्तर।" },
      { icon: "🌐", title: "भाषा", desc: "हिंदी और 10+ भाषाएं।" },
      { icon: "🔧", title: "स्वचालन", desc: "कार्य स्वचालित — समय बचाएं।" },
    ],
  },
  sarkarfood: {
    story: "SarkarFood की शुरुआत 2024 में हुई — इंदौर के स्वादिष्ट भोजन को हर घर तक पहुंचाने के लिए।\n\nहमने देखा कि स्थानीय रेस्टोरेंट और घरेलू खाना बनाने वालों को ग्राहकों तक पहुंचने के लिए बड़े प्लेटफ़ॉर्मों की भारी फीस चुकानी पड़ती है।\n\nआज, SarkarFood 50+ रेस्टोरेंट और 10,000+ सक्रिय ग्राहकों को जोड़ता है — इंदौर का अपना खाद्य प्लेटफ़ॉर्म।",
    mission: "हमारा मिशन इंदौर के स्वादिष्ट भोजन को हर घर तक पहुंचाना है — तेज़ डिलीवरी और किफ़ायती मूल्य पर।",
    values: [
      { icon: "🍔", title: "स्वाद", desc: "50+ किचन — हर स्वाद के अनुसार।" },
      { icon: "⚡", title: "तेज़", desc: "30 मिनट डिलीवरी।" },
      { icon: "💰", title: "किफ़ायती", desc: "₹99 से शुरू।" },
      { icon: "🎁", title: "रिवॉर्ड्स", desc: "हर ऑर्डर पर पॉइंट्स।" },
    ],
  },
  sarkarfinance: {
    story: "SarkarFinance का जन्म 2025 में हुआ — जब भारत में छोटे व्यापारियों और व्यक्तियों को समय पर लोन नहीं मिलता था।\n\nहमने देखा कि पारंपरिक बैंकों की प्रक्रिया जटिल और समय लेने वाली है — SarkarFinance ने इसे सरल बनाया।\n\nआज, SarkarFinance 3,000+ ग्राहकों को तत्काल लोन और वित्तीय सलाह प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को समय पर वित्तीय सहायता प्रदान करना है — जटिल प्रक्रिया के बिना।",
    values: [
      { icon: "🏦", title: "तत्काल", desc: "तत्काल मंजूरी — कम दस्तावेज़।" },
      { icon: "📱", title: "डिजिटल", desc: "ऑनलाइन प्रक्रिया — घर बैठे।" },
      { icon: "💳", title: "लचीलापन", desc: "3-36 महीने की EMI।" },
      { icon: "🔒", title: "सुरक्षा", desc: "बैंक-स्तरीय एन्क्रिप्शन।" },
    ],
  },
  sarkarpay: {
    story: "SarkarPay का जन्म 2024 में हुआ — जब UPI और डिजिटल पेमेंट ने भारत को बदल दिया।\n\nहमने देखा कि छोटे व्यापारियों को पेमेंट कलेक्ट करने में समस्या होती है — SarkarPay ने एक सरल समाधान दिया।\n\nआज, SarkarPay 5,000+ व्यापारियों को सभी पेमेंट मोड एक जगह प्रदान करता है।",
    mission: "हमारा मिशन हर व्यापारी को सरल और सुरक्षित पेमेंट समाधान देना है — बिना किसी छुपी फीस के।",
    values: [
      { icon: "💰", title: "सब कुछ", desc: "UPI, कार्ड, नेट बैंकिंग।" },
      { icon: "⚡", title: "तुरंत", desc: "T+0 सेटलमेंट।" },
      { icon: "🔒", title: "सुरक्षा", desc: "PCI DSS कंप्लायंट।" },
      { icon: "📈", title: "विश्लेषण", desc: "बिक्री डेटा एक जगह।" },
    ],
  },
  sarkarmart: {
    story: "SarkarMart का जन्म 2024 में हुआ — इंदौर के स्थानीय व्यापारियों को ऑनलाइन मंच देने के लिए।\n\nहमने देखा कि स्थानीय ब्रांड और व्यापारी बड़े प्लेटफ़ॉर्मों के सामने मजबूर थे — SarkarMart ने उन्हें सशक्त बनाया।\n\nआज, SarkarMart 200+ स्थानीय ब्रांड और 15,000+ ग्राहकों को जोड़ता है।",
    mission: "हमारा मिशन इंदौर के स्थानीय व्यापारियों को वैश्विक बाज़ार तक पहुंचाना है।",
    values: [
      { icon: "🛍️", title: "स्थानीय", desc: "200+ स्थानीय ब्रांड।" },
      { icon: "🚚", title: "डिलीवरी", desc: "24 घंटे के भीतर।" },
      { icon: "💸", title: "कैशबैक", desc: "5-20% हर खरीदारी पर।" },
      { icon: "🔄", title: "रिटर्न", desc: "7 दिन आसान रिटर्न।" },
    ],
  },
  sarkarlegal: {
    story: "SarkarLegal का जन्म 2025 में हुआ — जब भारत में सामान्य लोगों को कानूनी मदद की सबसे अधिक जरूरत थी।\n\nहमने देखा कि वकीलों तक पहुंचना महंगा और जटिल है — SarkarLegal ने इसे सरल और किफ़ायती बनाया।\n\nआज, SarkarLegal 1,000+ ग्राहकों को वकील परामर्श और दस्तावेज़ सहायता प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को कानूनी मदद की सुविधा प्रदान करना है — घर बैठे, किफ़ायती शुल्क पर।",
    values: [
      { icon: "⚖️", title: "परामर्श", desc: "अनुभवी वकील।" },
      { icon: "📋", title: "दस्तावेज़", desc: "मुफ्त टेम्पलेट।" },
      { icon: "📱", title: "ऑनलाइन", desc: "वीडियो कॉल पर।" },
      { icon: "💰", title: "शुल्क", desc: "पहली कंसल्टेशन मुफ्त।" },
    ],
  },
  "justdial-agent": {
    story: "JustDial Agent का जन्म 2024 में हुआ — इंदौर के व्यापारियों को सही ग्राहकों तक पहुंचाने के लिए।\n\nहमने देखा कि स्थानीय व्यापारियों को अपने ग्राहकों तक पहुंचने के लिए डेटा की जरूरत है — JustDial Agent ने इसे पूरा किया।\n\nआज, JustDial Agent 3,233+ व्यापारों और 50,000+ उपयोगकर्ताओं को जोड़ता है।",
    mission: "हमारा मिशन इंदौर के हर व्यापार को डिजिटल डायरेक्टरी में दृश्य बनाना है।",
    values: [
      { icon: "📇", title: "डायरेक्टरी", desc: "3,233+ व्यापार।" },
      { icon: "📊", title: "एनालिटिक्स", desc: "बाज़ार डेटा।" },
      { icon: "🎯", title: "लीड", desc: "संभावित ग्राहक।" },
      { icon: "🏆", title: "रैंकिंग", desc: "प्रीमियम लिस्टिंग।" },
    ],
  },
  sarkarmarketplace: {
    story: "SarkarMarketplace का जन्म 2024 में हुआ — इंदौर की सबसे बड़ी डिजिटल डायरेक्टरी बनाने के लिए।\n\nहमने देखा कि इंदौर के व्यापारियों को एक केंद्रीकृत मंच चाहिए — SarkarMarketplace ने इसे सशक्त बनाया।\n\nआज, SarkarMarketplace 3,233+ व्यापारों और 100,000+ मासिक उपयोगकर्ताओं को सेवा देता है।",
    mission: "हमारा मिशन इंदौर के हर व्यापार को एक ही मंच पर लाना है — सरल और प्रभावी।",
    values: [
      { icon: "🧭", title: "व्यापार", desc: "3,233+ व्यापार।" },
      { icon: "🔍", title: "सर्च", desc: "तुरंत खोजें।" },
      { icon: "⭐", title: "रिव्यू", desc: "समुदाय रेटिंग।" },
      { icon: "🤝", title: "नेटवर्क", desc: "व्यापारी जुड़ें।" },
    ],
  },
  ayurvedicwebsite: {
    story: "Mera Ayurvedic का जन्म 2024 में हुआ — शुद्ध आयुर्वेदिक उत्पादों को हर भारतीय तक पहुंचाने के लिए।\n\nहमने देखा कि बाज़ार में नकली आयुर्वेदिक उत्पादों की भरमार है — Mera Ayurvedic ने असली और प्रमाणित उत्पादों का मंच बनाया।\n\nआज, Mera Ayurvedic 5,000+ ग्राहकों को AYUSH प्रमाणित उत्पाद प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को शुद्ध और प्रमाणित आयुर्वेदिक उत्पाद देना है — किफ़ायती मूल्य पर।",
    values: [
      { icon: "🪷", title: "शुद्ध", desc: "100% प्राकृतिक।" },
      { icon: "🏆", title: "प्रमाणन", desc: "AYUSH प्रमाणित।" },
      { icon: "👨‍⚕️", title: "परामर्श", desc: "वैद्य निःशुल्क।" },
      { icon: "💰", title: "मूल्य", desc: "₹99 से शुरू।" },
    ],
  },
  sarkarghar: {
    story: "SarkarGhar का जन्म 2025 में हुआ — इंदौर में घर खोजने की प्रक्रिया को सरल बनाने के लिए।\n\nहमने देखा कि संपत्ति खोजना और खरीदना जटिल है — SarkarGhar ने इसे सरल और पारदर्शी बनाया।\n\nआज, SarkarGhar 500+ संपत्तियों और 2,000+ सक्रिय उपयोगकर्ताओं को सेवा देता है।",
    mission: "हमारा मिशन हर इंदौरवासी को उनका सपनों का घर देना है — बिना किसी परेशानी के।",
    values: [
      { icon: "🏠", title: "संपत्ति", desc: "500+ सत्यापित।" },
      { icon: "🔍", title: "खोज", desc: "स्थान अनुसार।" },
      { icon: "📊", title: "मूल्य", desc: "AI अनुमान।" },
      { icon: "🏦", title: "लोन", desc: "बैंक सहायता।" },
    ],
  },
  sarkarskills: {
    story: "SarkarSkills का जन्म 2024 में हुआ — भारत के युवाओं को रोज़गार कौशल सिखाने के लिए।\n\nहमने देखा कि हज़ारों युवा पढ़ाई पूरी कर बैठे हैं बिना कौशल के — SarkarSkills ने उन्हें शक्ति दी।\n\nआज, SarkarSkills 2,000+ विद्यार्थियों को व्यावसायिक प्रशिक्षण और प्लेसमेंट प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय युवा को रोज़गार कौशल सिखाना है — किफ़ायती शुल्क पर।",
    values: [
      { icon: "🛠️", title: "कौशल", desc: "व्यावसायिक प्रशिक्षण।" },
      { icon: "🎓", title: "प्रमाण-पत्र", desc: "प्रशिक्षण पूर्ण पर।" },
      { icon: "💼", title: "नौकरी", desc: "60% प्लेसमेंट।" },
      { icon: "💰", title: "किश्त", desc: "₹500/माह से।" },
    ],
  },
  "hyperframes-realestate": {
    story: "Hyperframes Real Estate का जन्म 2025 में हुआ — रियल एस्टेट को वीडियो-आधारित बनाने के लिए।\n\nहमने देखा कि संपत्ति देखने के लिए घूमना पड़ता है — Hyperframes ने वीडियो टूर से इसे आसान बनाया।\n\nआज, Hyperframes 200+ संपत्तियों और 5,000+ उपयोगकर्ताओं को वीडियो-आधारित सेवा प्रदान करता है।",
    mission: "हमारा मिशन रियल एस्टेट को वीडियो-आधारित और पारदर्शी बनाना है — घर बैठे संपत्ति देखें।",
    values: [
      { icon: "🎥", title: "वीडियो", desc: "4K वीडियो टूर।" },
      { icon: "🗺️", title: "लोकेशन", desc: "Google Maps।" },
      { icon: "📊", title: "मूल्य", desc: "बाज़ार रुझान।" },
      { icon: "💰", title: "लोन", desc: "15+ बैंक पार्टनर।" },
    ],
  },
  sikshahub: {
    story: "SikshaHub का जन्म 2024 में हुआ — गुणवत्तापूर्ण शिक्षा को हर घर तक पहुंचाने के लिए।\n\nहमने देखा कि छोटे शहरों में शिक्षा की गुणवत्ता कम है — SikshaHub ने ऑनलाइन मंच बनाया।\n\nआज, SikshaHub 3,000+ विद्यार्थियों को CBSE/ICSE/MP Board सामग्री और वीडियो कक्षाएं प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय बच्चे को गुणवत्तापूर्ण शिक्षा देना है — किफ़ायती शुल्क पर।",
    values: [
      { icon: "📚", title: "सामग्री", desc: "CBSE, ICSE, MP Board।" },
      { icon: "🎥", title: "कक्षाएं", desc: "वीडियो कक्षाएं।" },
      { icon: "👨‍🏫", title: "ट्यूशन", desc: "लाइव सत्र।" },
      { icon: "💰", title: "शुल्क", desc: "₹199/माह से।" },
    ],
  },
  sarkartravel: {
    story: "SarkarTravel का जन्म 2024 में हुआ — यात्रा को सरल और किफ़ायती बनाने के लिए।\n\nहमने देखा कि यात्रा बुकिंग में कई मध्यस्थ हैं — SarkarTravel ने सीधा मंच बनाया।\n\nआज, SarkarTravel 2,000+ यात्रियों को फ्लाइट, होटल और पैकेज बुकिंग प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को यात्रा को सरल और किफ़ायती बनाना है।",
    values: [
      { icon: "✈️", title: "बुकिंग", desc: "फ्लाइट, होटल, पैकेज।" },
      { icon: "💰", title: "दर", desc: "सर्वोत्तम दर।" },
      { icon: "📅", title: "लचीलापन", desc: "बदलें या रद्द करें।" },
      { icon: "🛡️", title: "बीमा", desc: "यात्रा बीमा।" },
    ],
  },
  sarkardukaan: {
    story: "SarkarDukaan का जन्म 2024 में हुआ — छोटे दुकानदारों को डिजिटल बनाने के लिए।\n\nहमने देखा कि दुकानदार ऑनलाइन जाना चाहते हैं लेकिन तकनीक नहीं आती — SarkarDukaan ने आसान समाधान दिया।\n\nआज, SarkarDukaan 1,000+ दुकानदारों को डिजिटल स्टोर और डिलीवरी नेटवर्क प्रदान करता है।",
    mission: "हमारा मिशन हर छोटे दुकानदार को डिजिटल बनाना है — सरल और किफ़ायती तरीके से।",
    values: [
      { icon: "🛒", title: "स्टोर", desc: "मिनटों में तैयार।" },
      { icon: "📱", title: "प्रबंधन", desc: "फोन से सब कुछ।" },
      { icon: "🚚", title: "डिलीवरी", desc: "शहर भर में।" },
      { icon: "💳", title: "भुगतान", desc: "UPI, कार्ड, COD।" },
    ],
  },
  sarkarbazaar: {
    story: "SarkarBazaar का जन्म 2024 में हुआ — इंदौर के स्थानीय व्यापारियों को वैश्विक बाज़ार तक पहुंचाने के लिए।\n\nहमने देखा कि स्थानीय उत्पादों को वैश्विक मंच नहीं मिलता — SarkarBazaar ने निर्यात का मंच बनाया।\n\nआज, SarkarBazaar 1,000+ व्यापारियों को B2B और B2C दोनों मंच प्रदान करता है।",
    mission: "हमारा मिशन इंदौर के स्थानीय उत्पादों को विश्व भर में पहुंचाना है।",
    values: [
      { icon: "🏪", title: "स्थानीय", desc: "1,000+ व्यापारी।" },
      { icon: "🌐", title: "निर्यात", desc: "वैश्विक पहुंच।" },
      { icon: "💰", title: "मूल्य", desc: "थोक दर।" },
      { icon: "🚚", title: "शिपिंग", desc: "भारत भर में।" },
    ],
  },
  sarkarjobs: {
    story: "SarkarJobs का जन्म 2024 में हुआ — भारत के युवाओं को सही नौकरी से जोड़ने के लिए।\n\nहमने देखा कि नौकरी खोजने में धोखाधड़ी होती है — SarkarJobs ने वेरिफ़ाइड नियोक्ताओं का मंच बनाया।\n\nआज, SarkarJobs 500+ कंपनियों और 10,000+ उम्मीदवारों को जोड़ता है।",
    mission: "हमारा मिशन हर भारतीय युवा को सही और वेरिफ़ाइड नौकरी देना है।",
    values: [
      { icon: "💼", title: "नौकरी", desc: "योग्यता के अनुसार।" },
      { icon: "🏢", title: "कंपनियां", desc: "500+ वेरिफ़ाइड।" },
      { icon: "📝", title: "रिज्यूमे", desc: "प्रोफ़ेशनल टेम्पलेट।" },
      { icon: "💰", title: "वेतन", desc: "उद्योग मानक।" },
    ],
  },
  sarkared: {
    story: "SarkarEd का जन्म 2024 में हुआ — भारत के युवाओं को करियर-ओरिएंटेड कौशल सिखाने के लिए।\n\nहमने देखा कि पारंपरिक शिक्षा रोज़गार के लिए पर्याप्त नहीं — SarkarEd ने व्यावसायिक प्रशिक्षण शुरू किया।\n\nआज, SarkarEd 3,000+ विद्यार्थियों को डिजिटल मार्केटिंग, AI और वेब डेवलपमेंट सिखाता है।",
    mission: "हमारा मिशन हर भारतीय युवा को करियर-ओरिएंटेड कौशल सिखाना है।",
    values: [
      { icon: "🎓", title: "कोर्स", desc: "AI, वेब, मार्केटिंग।" },
      { icon: "👨‍🏫", title: "शिक्षक", desc: "10+ वर्ष अनुभव।" },
      { icon: "📜", title: "प्रमाण-पत्र", desc: "प्रशिक्षण पूर्ण पर।" },
      { icon: "💼", title: "नौकरी", desc: "70% प्लेसमेंट।" },
    ],
  },
  sarkarsarkar: {
    story: "SarkarSarkar का जन्म 2025 में हुआ — सरकारी सेवाओं को हर भारतीय तक पहुंचाने के लिए।\n\nहमने देखा कि सरकारी सेवाओं में कतार और देरी है — SarkarSarkar ने इसे डिजिटल बनाया।\n\nआज, SarkarSarkar 5,000+ नागरिकों को आधार, पैन, पासपोर्ट और अन्य सेवाएं प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को सरकारी सेवाओं की सुविधा देना है — घर बैठे।",
    values: [
      { icon: "🏛️", title: "सेवाएं", desc: "आधार, पैन, पासपोर्ट।" },
      { icon: "📋", title: "आवेदन", desc: "फॉर्म भरने में सहायता।" },
      { icon: "📱", title: "ट्रैकिंग", desc: "स्थिति लाइव।" },
      { icon: "💰", title: "योजनाएं", desc: "सरकारी योजनाएं।" },
    ],
  },
  sarkarwellness: {
    story: "SarkarWellness का जन्म 2024 में हुआ — आयुर्वेद और योग को आधुनिक विधि से जोड़ने के लिए।\n\nहमने देखा कि लोग स्वास्थ्य के लिए प्राकृतिक तरीके खोज रहे हैं — SarkarWellness ने पंचकर्म, योग और पोषण का मंच बनाया।\n\nआज, SarkarWellness 2,000+ ग्राहकों को आयुर्वेदिक उपचार और स्वास्थ्य योजना प्रदान करता है।",
    mission: "हमारा मिशन हर भारतीय को प्राकृतिक और आयुर्वेदिक स्वास्थ्य सेवा देना है।",
    values: [
      { icon: "🌿", title: "उपचार", desc: "पंचकर्म, योग।" },
      { icon: "👨‍⚕️", title: "परामर्श", desc: "वैद्य सलाह।" },
      { icon: "🥗", title: "आहार", desc: "आयुर्वेदिक पोषण।" },
      { icon: "📊", title: "ट्रैकिंग", desc: "स्वास्थ्य प्रगति।" },
    ],
  },
};

export function AboutPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const team = (brand.team_json ?? []) as any[];
  const about = BRAND_ABOUT[brand.slug];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.04]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-2xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${secondary}, ${accent})`, animationDelay: "3s" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            {brand.name} के बारे में
          </div>
          <h1 className="heading-xl mb-6">
            <span style={{ color: primary }}>{brand.name}</span>{" "}
            <span className="gradient-text">— कहानी</span>
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto leading-relaxed">{brand.tagline}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={`/contact`} className="btn-primary">संपर्क करें</a>
            <a href={`/services`} className="btn-secondary">हमारी सेवाएं</a>
          </div>
        </div>
      </section>

      {/* STORY */}
      {about && (
        <section className="section">
          <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-caption mb-3" style={{ color: primary }}>हमारी कहानी</p>
              <h2 className="heading-md mb-4" style={{ color: primary }}>इंदौर से, इंदौर के लिए</h2>
              <p className="text-body leading-relaxed whitespace-pre-line mb-4">
                {about.story}
              </p>
              {about.mission && (
                <div className="rounded-2xl p-5 border-l-4" style={{ borderColor: primary, backgroundColor: `${primary}05` }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: primary }}>हमारा मिशन</p>
                  <p className="text-sm opacity-70">{about.mission}</p>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">{brand.emoji ?? "🤝"}</div>
                    <p className="text-2xl font-bold" style={{ color: primary }}>{brand.name}</p>
                    <p className="text-sm opacity-50 mt-1">इंदौर का समुदाय नेटवर्क</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl shadow-lg flex items-center justify-center text-3xl animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>🏙️</div>
            </div>
          </div>
        </section>
      )}

      {/* VALUES */}
      {about && (
        <section className="section-tight">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-caption mb-3" style={{ color: primary }}>हमारे मूल्य</p>
              <h2 className="heading-md" style={{ color: primary }}>{brand.name} ko alag banane wali cheezein</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {about.values.map((v, i) => (
                <div key={i} className="rounded-2xl border bg-white p-6 text-center" style={{ borderColor: `${accent}30` }}>
                  <div className="text-4xl mb-3">{v.icon}</div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{v.title}</h3>
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
                <div key={s.l} className="text-center rounded-2xl border p-6 bg-white" style={{ borderColor: `${accent}30` }}>
                  <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: primary }}>{s.v}</div>
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
              <p className="text-caption mb-3" style={{ color: primary }}>लोग</p>
              <h2 className="heading-md mb-4" style={{ color: primary }}>हमारी टीम से मिलें</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {team.map((m: any, i: number) => (
                <div key={i} className="card-lift rounded-2xl border bg-white p-6 text-center" style={{ borderColor: `${accent}30` }}>
                  {m.photo ? <img src={m.photo} alt={m.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover shadow-md" /> : <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-md" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{m.name?.charAt(0) ?? "?"}</div>}
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
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">Saathe badhne ko taiyar?</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                {brand.name} ke saath apni sehat ka khayal rakhein — aaj hi download karein.
              </p>
              <a href={`/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm inline-block hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>बातचीत शुरू करें →</a>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
