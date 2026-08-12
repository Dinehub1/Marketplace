import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_FEATURES: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
  sarkardost: [
    { icon: "📍", title: "स्थानीय खोज", desc: "इंदौर के हर इलाके की दुकान, सेवा और विशेषज्ञ एक ही खिड़की पर — आसान और तेज़।" },
    { icon: "⭐", title: "सत्यापित समीक्षा", desc: "वास्तविक ग्राहकों की रेटिंग और समीक्षा — भरोसे का निर्णय लें सही सेवा चुनने में।" },
    { icon: "📢", title: "लाइव अपडेट", desc: "रोज़गार के अवसर, स्थानीय आयोजन और प्रशिक्षम की ताज़ा जानकारी सीधे आप तक।" },
    { icon: "💬", title: "सीधा संपर्क", desc: "मध्यस्थ के बिना सीधे सेवा प्रदाता से बात करें — WhatsApp, कॉल या संदेश से।" },
    { icon: "🏆", title: "समुदाय रैंकिंग", desc: "टॉप सेवा प्रदाताओं की रैंकिंग और बैज — सर्वोत्तम अनुभव की गारंटी।" },
    { icon: "📊", title: "व्यापार एनालिटिक्स", desc: "अपनी लिस्टिंग की प्रदर्शन जानें — व्यूज़, लीड और ग्राहक इंटरैक्शन का डैशबोर्ड।" },
  ],
  sarkarconnect: [
    { icon: "🔗", title: "B2B नेटवर्किंग", desc: "सप्लायर, मैन्युफैक्चरर, डिस्ट्रीब्यूटर और रिटेयर — सबसे जुड़ें व्यावसायिक नेटवर्क में।" },
    { icon: "💼", title: "डिजिटल कार्ड", desc: "अपने व्यापार का प्रोफ़ेशनल डिजिटल कार्ड बनाएं — शेयर करें, कनेक्ट करें, बढ़ें।" },
    { icon: "📈", title: "डील ट्रैकिंग", desc: "हर लीड, प्रपोज़ल और क्लोज़ डील का पूरा रिकॉर्ड — आपकी ग्रोथ का डेटा।" },
    { icon: "🤝", title: "बिज़नेस मैचिंग", desc: "AI-आधारित मैचिंग आपको सही पार्टनर से मिलाती है — ज़रूरत से मेल खाने वाले व्यापार।" },
    { icon: "📋", title: "प्रोडक्ट कैटलॉग", desc: "अपने उत्पादों और सेवाओं को कैटलॉग में लिस्ट करें — पूरे भारत में दिखाएं।" },
    { icon: "🔔", title: "रियल-टाइम नोटिफिकेशन", desc: "नए कनेक्ट रिक्वेस्ट, मैसेज और डील अपडेट — तुरंत सूचना।" },
  ],
  sarkarhealth: [
    { icon: "🩺", title: "वीडियो कंसल्टेशन", desc: "MBBS/MD डॉक्टरों से वीडियो कॉल पर मिलें — घर बैठे, 24/7 उपलब्ध।" },
    { icon: "💊", title: "दवाई डिलीवरी", desc: "सभी दवाइयाँ आपके दरवाजे पर — जनरिक विकल्प से 40% तक बचत।" },
    { icon: "📋", title: "हेल्थ रिकॉर्ड", desc: "आपकी पूरी मेडिकल हिस्ट्री सुरक्षित — रिपोर्ट, प्रिस्क्रिप्शन और अपॉइंटमेंट।" },
    { icon: "🏥", title: "लैब टेस्ट बुकिंग", desc: "ब्लड टेस्ट, X-Ray, ECG — आपके पास से सैंपल कलेक्शन और ऑनलाइन रिपोर्ट।" },
    { icon: "👨‍⚕️", title: "डॉक्टर खोज", desc: "स्पेशलिटी, अनुभव और रेटिंग के अनुसार सही डॉक्टर खोजें — क्लिक में।" },
    { icon: "🔔", title: "अपॉइंटमेंट रिमाइंडर", desc: "मिस न करें कोई अपॉइंटमेंट — SMS और WhatsApp रिमाइंडर।" },
  ],
  followup: [
    { icon: "📅", title: "स्मार्ट रिमाइंडर", desc: "WhatsApp, SMS और ईमेल — कई चैनलों से याद दिलाव, कभी ना भूलें।" },
    { icon: "📋", title: "टास्क ट्रैकिंग", desc: "हर टास्क का स्टेटस, डेडलाइन और प्राथमिकता — एक जगह देखें।" },
    { icon: "📊", title: "प्रग्रेस एनालिटिक्स", desc: "दैनिक, साप्ताहिक, मासिक रिपोर्ट — आपकी प्रोडक्टिविटी का डेटा।" },
    { icon: "🔄", title: "ऑटोमेटेड फॉलो-अप", desc: "AI-आधारित ऑटोमेटेड मैसेज — ग्राहकों को याद दिलाएं बिना मैन्युल काम के।" },
    { icon: "👥", title: "टीम कोऑर्डिनेशन", desc: "टीम के सदस्यों को असाइन करें, ट्रैक करें और साथ काम करें।" },
    { icon: "🔗", title: "क्रॉस-प्लेटफ़ॉर्म सिंक", desc: "Google Calendar, Notion, Trello — सब कुछ एक साथ सिंक।" },
  ],
  cloudplayer: [
      { icon: "⚡", title: "ज़ीरो बफ़रिंग", desc: "क्लाउड-नेटिव आर्किटेक्चर — तुरंत प्ले, कोई लैग नहीं।" },
      { icon: "☁️", title: "क्लाउड स्टोरेज", desc: "अपनी पूरी लाइब्रेरी क्लाउड पर — कहीं से भी, किसी भी डिवाइस से।" },
      { icon: "🎬", title: "4K HDR सपोर्ट", desc: "4K, HDR, Dolby Vision — सिनेमा-स्टैंडर्ड स्ट्रीमिंग।" },
      { icon: "📱", title: "क्रॉस-प्लेटफ़ॉर्म", desc: "Android, iOS, Web, Smart TV — हर जगह एक जैसा अनुभव।" },
      { icon: "🔊", title: "डॉल्बी ऑडियो", desc: "सराउंड साउंड एक्सपीरियंस — फिल्म जैसा ध्वनि अनुभव।" },
      { icon: "📡", title: "लाइव स्ट्रीमिंग", desc: "लाइव इवेंट, स्पोर्ट्ट और वेबिनार — किसी भी स्क्रीन पर।" },
      { icon: "💾", title: "ऑफ़लाइन डाउनलोड", desc: "अपनी पसंद की सामग्री डाउनलोड करें और इंटरनेट के बिना देखें।" },
      { icon: "👥", title: "मल्टी-यूज़र प्रोफाइल", desc: "प्रत्येक परिवार के सदस्य के लिए अलग प्रोफ़ाइल बनाएं, व्यक्तिगत सुझाव प्राप्त करें।" },
      { icon: "👪", title: "पेरेंटल कंट्रोल", desc: "उम्र-आधारित फ़िल्टर और स्क्रीन टाइम सीमाएँ सेट करें ताकि बच्चों के लिए सुरक्षित स्ट्रीमिंग हो।" },
    ],
  paisaflow: [
    { icon: "💸", title: "स्मार्ट इन्वेस्टमेंट", desc: "FD, म्यूचुअल फंड, स्टॉक — अपने जोखिम के अनुसार पोर्टफ़ोलियो।" },
    { icon: "📈", title: "रियल-टाइम ट्रैकिंग", desc: "आपके सभी निवेश की रियल-टाइम अपडेट — एक डैशबोर्ड में।" },
    { icon: "🎯", title: "गोल-बेस्ड प्लानिंग", desc: "घर, शादी, रिटायरमेंट — हर लक्ष्य के लिए कस्टम प्लान।" },
    { icon: "🛡️", title: "रिस्क एनालिसिस", desc: "AI-आधारित रिस्क स्कोर — सुरक्षित निवेश का गारंटी।" },
    { icon: "📊", title: "रिटर्न कैलकुलेटर", desc: "इन्वेस्ट करने से पहले देखें कितना कमाएंगे — पारदर्शिता।" },
    { icon: "🏦", title: "बैंक इंटीग्रेशन", desc: "सभी प्रमुख बैंकों से सीधा कनेक्शन — तेज़ और सुरक्षित।" },
  ],
  yaadrakh: [
      { icon: "🧠", title: "AI नोट्स", desc: "AI आपकी बातें सुनकर नोट्स बनाता है — संगठित और खोजने योग्य।" },
      { icon: "⏰", title: "स्मार्ट रिमाइंडर", desc: "कंटेक्स्ट-अवेयर रिमाइंडर — सही समय पर सही याद।" },
      { icon: "🔄", title: "क्रॉस-डिवाइस सिंक", desc: "फोन, टैबलेट, लैपटॉप — हर जगह एक जैसा अनुभव।" },
      { icon: "🔍", title: "स्मार्ट सर्च", desc: "किसी भी नोट, टास्क या रिमाइंडर को तुरंत खोजें — AI से।" },
      { icon: "📊", title: "प्रोडक्टिविटी डैशबोर्ड", desc: "आपकी दैनिक, साप्ताहिक प्रोडक्टिविटी ट्रेंड्स देखें।" },
      { icon: "🔒", title: "गोपनीयता", desc: "आपका सब कुछ एन्क्रिप्टेड — सिर्फ आपके पास पहुंच।" },
      { icon: "🎤", title: "वॉयस-टू-टेक्स्ट नोट्स", desc: "बोलकर नोट्स बनाएं — AI वास्तविक समय में बोलकर टेक्स्ट में बदलता है और संगठित करता है।" },
      { icon: "🏷️", title: "स्मार्ट श्रेणियाँ", desc: "AI आपके नोट्स को स्वचालित रूप से श्रेणियों में व्यवस्थित करता है — बैठक, व्यक्तिगत, काम आदि।" },
      { icon: "🤝", title: "साझा नोट्स", desc: "टीम या परिवार के साथ नोट्स सुरक्षित रूप से साझा करें — real-time सहयोग और टिप्पणियाँ।" },
    ],
  "sarkar-ai": [
    { icon: "🤖", title: "AI असिस्टेंट", desc: "24/7 उपलब्ध बुद्धिमान सहायक — प्रश्नों के उत्तर, सलाह और कार्य पूरा।" },
    { icon: "⚡", title: "तत्काल प्रतिक्रिया", desc: "मिलीसेकंड में उत्तर — कोई प्रतीक्षा नहीं, कोई विलंब नहीं।" },
    { icon: "🧠", title: "संदर्भ समझ", desc: "AI आपकी बातचीत का संदर्ध याद रखता है — हर बार नया नहीं, बल्कि बुद्धिमान।" },
    { icon: "🔧", title: "कार्य स्वचालन", desc: "दोहराए जाने वाले कार्य, ईमेल, रिपोर्ट — AI करे, आप फोकस करें।" },
    { icon: "🌐", title: "बहुभाषी समर्थन", desc: "हिंदी, अंग्रेजी और 10+ भाषाएं — आपकी भाषा में संवाद।" },
    { icon: "🔗", title: "API इंटीग्रेशन", desc: "आपके मौजूदा टूल्स से जुड़े — Zapier, Slack, WhatsApp और अधिक।" },
  ],
  sarkarfood: [
    { icon: "🍔", title: "इंदौर के बेटर किचन", desc: "50+ वेरिफ़ाइड रेस्टोरेंट और घरेलू खाना — हर स्वाद के अनुसार।" },
    { icon: "⚡", title: "30 मिनट डिलीवरी", desc: "हॉट और ताज़ा खाना — वादा किए गए समय में, या फ्री डिलीवरी।" },
    { icon: "💰", title: "बजट-फ्रेंडली", desc: "₹99 से शुरू — हर जेब के हिसाब से स्वादिष्ट भोजन।" },
    { icon: "🌿", title: "शाकाहारी और मांसाहारी", desc: "व्यक्तिगत पसंद के अनुसार फ़िल्टर — जाइन, मुगलाई, कन्टीनेंटल।" },
    { icon: "📍", title: "लाइव ट्रैकिंग", desc: "अपने ऑर्डर को लाइव ट्रैक करें — पार्टर से आपके दरवाजे तक।" },
    { icon: "🎁", title: "रिवॉर्ड्स और ऑफर", desc: "हर ऑर्डर पर पॉइंट्स, रिफर करें और ₹100 तक पाएं।" },
  ],
  sarkarfinance: [
    { icon: "🏦", title: "तत्काल लोन", desc: "₹10,000 से ₹10 लाख तक — दस्तावेज़ कम, मंजूरी तेज।" },
    { icon: "📱", title: "डिजिटल एप्लिकेशन", desc: "पूरी प्रक्रिया ऑनलाइन — घर बैठे अप्लाई करें, फोटो अपलोड करें।" },
    { icon: "💳", title: "लचीली चुकौती", desc: "3 से 36 महीने तक की EMI — आपकी सामर्थ्य के अनुसार।" },
    { icon: "📊", title: "क्रेडिट स्कोर चेक", desc: "मुफ्त में अपना CIBIL स्कोर जांचें — सुधारने के टिप्स भी पाएं।" },
    { icon: "🤝", title: "वित्तीय सलाह", desc: "पंजीकृत वित्तीय सलाहकार — लोन, बीमा और निवेश मार्गदर्शन।" },
    { icon: "🔒", title: "सुरक्षित डेटा", desc: "बैंक-स्तरीय एन्क्रिप्शन — आपकी जानकारी सुरक्षित।" },
  ],
  sarkarpay: [
    { icon: "💰", title: "सभी पेमेंट मोड", desc: "UPI, कार्ड, नेट बैंकिंग, EMI — एक प्लेटफ़ॉर्म में सब कुछ।" },
    { icon: "⚡", title: "इंस्टेंट सेटलमेंट", desc: "T+0 सेटलमेंट — बिक्री तुरंत आपके बैंक में।" },
    { icon: "📊", title: "लेन-देन डैशबोर्ड", desc: "दैनिक बिक्री, रिफंड और चार्जबैक — एक जगह देखें।" },
    { icon: "🔒", title: "PCI DSS कंप्लायंट", desc: "अंतरराष्ट्रीय सुरक्षा मानक — हर लेन-देन सुरक्षित।" },
    { icon: "📈", title: "राजस्व एनालिटिक्स", desc: "बिक्री का रुझान, सर्वोत्तम घंटे और ग्राहक व्यवहार का विश्लेषण।" },
    { icon: "🌐", title: "बहु-मुद्रा", desc: "INR से आगे — अंतरराष्ट्रीय भुगतान भी स्वीकार करें।" },
  ],
  sarkarmart: [
    { icon: "🛍️", title: "इंदौर के व्यापारी", desc: "200+ स्थानील ब्रांड और व्यापारी — अनूठे उत्पाद एक जगह।" },
    { icon: "🚚", title: "तेज़ डिलीवरी", desc: "शहर भर में 24 घंटे के भीतर — मुफ्त डिलीवरी ₹499+ पर।" },
    { icon: "💸", title: "कैशबैक ऑफ़र", desc: "हर खरीदारी पर 5-20% कैशबैक — स्थायी बचत।" },
    { icon: "⭐", title: "वेरिफ़ाइड रिव्यू", desc: "असली ग्राहकों की रेटिंग — सही खरीदारी का निर्णय लें।" },
    { icon: "🎁", title: "वीकंड डील्स", desc: "शनिवार-रविवार विशेष छूट — बॉक्मार्क करें, मिस न करें।" },
    { icon: "🔄", title: "आसान रिटर्न", desc: "7 दिन में रिटर्न — बिना किसी प्रश्न के पूरा रिफंड।" },
  ],
  sarkarlegal: [
    { icon: "⚖️", title: "वकील परामर्श", desc: "अनुभवी एडवोकेट जुड़िकियल — सिविल, क्रिमिनल, कॉर्पोरेट।" },
    { icon: "📋", title: "दस्तावेज़ तैयारी", desc: "अनुबंद, एफिडेविट, पुलिस शिकायत — मुफ्त टेंपट उपलब्ध।" },
    { icon: "🏛️", title: "कोर्ट प्रतिनिधित्व", desc: "इंदौर न्यायालय और उच्च न्यायालय में अनुभवी वकील।" },
    { icon: "📱", title: "ऑनलाइन कंसल्टेशन", desc: "वीडियो कॉल पर परामर्श — घर बैठे, बिना कतार के।" },
    { icon: "💰", title: "पारदर्शित शुल्क", desc: "पहले से पता — कोई छुपा शुल्क नहीं। पहली कंसल्टेशन मुफ्त।" },
    { icon: "🔒", title: "गोपनीयता", desc: "आपकी केस जानकारी पूर्णतः गोपनीय — वकील-ग्राहक प्रिविलेज।" },
  ],
  "justdial-agent": [
    { icon: "📇", title: "व्यापार डायरेक्टरी", desc: "3,233+ वेरिफ़ाइड व्यापार — इंदौर की सबसे विस्तृत सूची।" },
    { icon: "📊", title: "डेटा एनालिटिक्स", desc: "बाज़ार रुझान, प्रतिस्पर्धा और ग्राहक व्यवहार की गहरी जानकारी।" },
    { icon: "🎯", title: "लीड जनरेशन", desc: "ग्राहकों की जानकारी — संभावित डील आपके पास।" },
    { icon: "📱", title: "मोबाइल र्यूटिंग", desc: "अपने व्यापार की मोबाइल-फ्रेंडली प्रोफ़ाइल प्रबंधित करें।" },
    { icon: "🏆", title: "रैंकिंग बूस्ट", desc: "टॉप पर पहुंचें — प्रीमियम लिस्टिंग से अधिक ग्राहक।" },
    { icon: "🤝", title: "B2B कनेक्शन", desc: "सप्लायर और बायर से जुड़ें — व्यापार नेटवर्क का विस्तार।" },
  ],
  sarkarmarketplace: [
    { icon: "🧭", title: "3,233+ व्यापार", desc: "इंदौर की सबसे बड़ी डिजिटल डायरेक्टरी — हर श्रेणी में।" },
    { icon: "🔍", title: "स्मार्ट सर्च", desc: "नाम, श्रेणी, स्थान — तुरंत खोजें, तुरंत पाएं।" },
    { icon: "📱", title: "मोबाइल-फर्स्ट", desc: "किसी भी डिवाइस से एक्सेस — सुंदर और तेज़।" },
    { icon: "⭐", title: "समीक्षा प्रणाली", desc: "भरोसेमंड समुदाय कि रेटिंग — सही निर्णय लें।" },
    { icon: "📊", title: "व्यापार विश्लेषण", desc: "अपने व्यापार के प्रदर्शन का डेटा — व्यूज, लीड।" },
    { icon: "🤝", title: "समुदाय नेटवर्क", desc: "व्यापारी जुड़ें, सहयोग करें और पारस्परिक विकास करें।" },
  ],
  ayurvedicwebsite: [
    { icon: "🪷", title: "100% प्राकृतिक", desc: "शुद्ध जड़ी-बूटी और आयुर्वेदिक — रासायनिक-मुक्त, सुरक्षित, प्रभावी।" },
    { icon: "🏆", title: "AYUSH प्रमाणित", desc: "सभी उत्पाद सरकारी मानकों से प्रमाणित — गुणवत्ता की गारंटी।" },
    { icon: "👨‍⚕️", title: "वैद्य परामर्श", desc: "अनुभवी आयुर्वेदिक चिकित्सक से निःशुल्क परामर्श।" },
    { icon: "📦", title: "घर पर डिलीवरी", desc: "भारत भर में डिलीवरी — ₹499+ पर मुफ्त शिपिंग।" },
    { icon: "🌿", title: "खाद्य पूरक", desc: "अश्वगंधा, ब्राह्मी, त्रिफला — पारंपरिक और आधुनिक।" },
    { icon: "💰", title: "बजट-फ्रेंडली", desc: "₹99 से शुरू — जब सेहत हर जेब के हिसाब से हो।" },
  ],
  sarkarghar: [
    { icon: "🏠", title: "संपत्ति सूची", desc: "500+ सत्यापित संपत्तियां — अपार्टमेंट, विला, प्लॉट।" },
    { icon: "🔍", title: "स्थान अनुसार खोज", desc: "इलाका, बजट, आकार — अपनी जरूरत के हिसाब से।" },
    { icon: "📊", title: "मूल्य अनुमान", desc: "AI-आधारित मूल्य अनुमान — अधिक खरीदने से पहले पता करें।" },
    { icon: "📋", title: "कानूनी सहायता", desc: "दस्तावेज़ सत्यापन, रजिस्ट्रेशन — पूरी प्रक्रिया सहायता।" },
    { icon: "🏦", title: "लोन सहायता", desc: "बैंक लोन की सुविधा — आवेदन से मंजूरी तक साथ।" },
    { icon: "📱", title: "वर्चुअल टूर", desc: "360° वर्चुअल टूर — घर से ज़मीन देखें, फैसला करें।" },
  ],
  sarkarskills: [
    { icon: "🛠️", title: "व्यावसायिक प्रशिक्षण", desc: "डिजिटल मार्केटिंग, ई-कॉमर्स, AI — भविष्यौ कौशल।" },
    { icon: "🎓", title: "धारवाहिक प्रमाण-पत्र", desc: "प्रशिक्षण पूर्ण होने पर प्रमाण-पत्र — रोज़गार में शक्ति।" },
    { icon: "👨‍🏫", title: "उद्योग विशेषज्ञ", desc: "10+ वर्ष अनुभव वाले प्रशिक्षक — व्यावहारिक ज्ञान।" },
    { icon: "📱", title: "ऑनलाइन और ऑफलाइन", desc: "कक्षाएं और प्रत्यक्ष कार्यशालाएं — आपकी सुविधा के अनुसार।" },
    { icon: "💼", title: "नौकरी सहायता", desc: "प्लेसमेंट सहायता — 60% विद्यार्थी प्रशिक्षण पूरा कर नौकरी पाते हैं।" },
    { icon: "💰", title: "किश्त व्यवस्था", desc: "₹500/माह से शुरू — शिक्षा कोई बाध्यता नहीं, निवेश है।" },
  ],
  "hyperframes-realestate": [
    { icon: "🎥", title: "वीडियो टूर", desc: "दूर से देखें प्रॉपर्टी — 4K वीडियो विश्व भर में आपके पास।" },
    { icon: "🗺️", title: "वर्चुअल लोकेशन", desc: "Google Maps इंटीग्रेशन — प्रॉपर्टी का स्थान, परिवेश देखें।" },
    { icon: "📊", title: "प्राइस एनालिटिक्स", desc: "प्रति वर्ग फुट दर, बाज़ार रुझान — खरीदने से पहले पता करें।" },
    { icon: "🤝", title: "एजेंट मैचिंग", desc: "अनुभवी रियल एस्टेट एजेंट से जुड़ें — सीधा, बिना बिचौलिए।" },
    { icon: "📋", title: "दस्तावेज़ सहायता", desc: "रजिस्ट्रेशन, स्टाम्प ड्यूटी — पूरी कानूनी सहायता।" },
    { icon: "💰", title: "होम लोन सहायता", desc: "15+ बैंक पार्टनर — लोन आवेदन से मंजूरी तक।" },
  ],
  sikshahub: [
    { icon: "📚", title: "पाठ्यक्रम सामग्री", desc: "CBSE, ICSE, MP Board — कक्षा 1 से 12 तक पूरी सामग्री।" },
    { icon: "🎥", title: "वीडियो कक्षाएं", desc: "अनुभवी शिक्षकों की रिकॉर्डेड कक्षाएं — कभी भी, कहीं भी।" },
    { icon: "📝", title: "अभ्यास प्रश्न", desc: "हर अध्याय के लिए प्रश्न और परीक्षण — तैयारी पूरी तरह।" },
    { icon: "👨‍🏫", title: "लाइव ट्यूशन", desc: "शिक्षक से सीधे प्रश्न पूछें — साप्ताहिक लाइव सत्र।" },
    { icon: "📊", title: "प्रग्रेस ट्रैकिंग", desc: "बच्चे की तैयारी का डेटा — माता-पिता के लिए रिपोर्ट।" },
    { icon: "💰", title: "किफ़ायती", desc: "₹199/माह से शुरू — गुणवत्तापूर्ण शिक्षा हर घर के लिए।" },
  ],
  sarkartravel: [
    { icon: "✈️", title: "घरेलू और अंतर्राष्ट्रीय", desc: "भारत भर और विदेशों में — फ्लाइट, होटल, पैकेज।" },
    { icon: "💰", title: "सर्वोत्तम दर", desc: "तुलना खोजें — हज़ारों रुपये बचाएं।" },
    { icon: "📅", title: "लचीली बुकिंग", desc: "तारीख बदलें या रद्द करें — न्यूनतम शुल्क के साथ।" },
    { icon: "🎒", title: "यात्रा पैकेज", desc: "हनीमून, परिवार, साहसिक — विशेष पैकेज।" },
    { icon: "📱", title: "24/7 सहायता", desc: "यात्रा में कोई समस्या — हम उपलब्ध।" },
    { icon: "🛡️", title: "यात्रा बीमा", desc: "हर यात्रा पर सुरक्षा — अप्रत्याशित खर्च से बचाव।" },
  ],
  sarkardukaan: [
    { icon: "🛒", title: "डिजिटल दुकान", desc: "अपनी दुकान का ऑनलाइन स्टोर — मिनटों में तैयार।" },
    { icon: "📱", title: "मोबाइल प्रबंधन", desc: "फोन से ऑर्डर, स्टॉक और भुगतान — सब कुछ हाथ में।" },
    { icon: "🚚", title: "डिलीवरी नेटवर्क", desc: "शहर भर में डिलीवरी — स्वयं या भागीदार के माध्यम से।" },
    { icon: "💳", title: "डिजिटल भुगतान", desc: "UPI, कार्ड, COD — ग्राहक जैसा चाहें।" },
    { icon: "📊", title: "स्टॉक प्रबंधन", desc: "इन्वेंट्री ट्रैक, रिकॉर्ड — कोई उत्पाद ना कम पड़े।" },
    { icon: "📈", title: "बिक्री विश्लेषण", desc: "दैनिक बिक्री, सर्वोत्तम उत्पाद — डेटा से निर्णय लें।" },
  ],
  sarkarbazaar: [
    { icon: "🏪", title: "स्थानीय व्यापारी", desc: "इंदौर के 1,000+ व्यापारी — खाद्य, वस्त्र, इलेक्ट्रॉनिक्स।" },
    { icon: "🌐", title: "वैश्विक पहुंच", desc: "स्थानीय उत्पाद विश्व भर में — निर्यात का मंच।" },
    { icon: "📱", title: "ऑर्डर ऐप", desc: "ग्राहकों के लिए आसान ऐप — ब्राउज़, ऑर्डर, ट्रैक।" },
    { icon: "💰", title: "प्रतिस्पर्धी मूल्य", desc: "थोक दर — व्यापारियों के लिए विशेष।" },
    { icon: "🚚", title: "शिपिंग सहायता", desc: "भारत भर में शिपिंग — DTDC, Delhivery पार्टनर।" },
    { icon: "🤝", title: "व्यापार नेटवर्क", desc: "सप्लायर और खुदरा — B2B कनेक्शन का मंच।" },
  ],
  sarkarjobs: [
    { icon: "💼", title: "नौकरी मेल", desc: "आपकी योग्यता और स्थान के अनुसार नौकरियां — तुरंत सूचना।" },
    { icon: "🏢", title: "वेरिफ़ाइड कंपनियां", desc: "500+ पंजीकृत नियोक्ता — धोखाधड़ी मुक्त।" },
    { icon: "📝", title: "रिज्यूमे बिल्डर", desc: "प्रोफ़ेशनल रिज्यूमे टेम्पलेट — क्लिक में तैयार।" },
    { icon: "🎯", title: "कैरियर सलाह", desc: "अनुभवी कैरियर काउंसलर — मार्गदर्शन निःशुल्क।" },
    { icon: "📊", title: "कौशल मूल्यांकन", desc: "ऑनलाइन टेस्ट — अपनी क्षमता जानें, सुधारें।" },
    { icon: "💰", title: "वेतन तुलना", desc: "उसी भूमिका के लिए उद्योग मानक — सही मांग करें।" },
  ],
  sarkared: [
    { icon: "🎓", title: "करियर-ओरिएंटेड", desc: "डिजिटल मार्केटिंग, AI, वेब डेवलपमेंट — रोज़गार कौशल।" },
    { icon: "👨‍🏫", title: "उद्योग शिक्षक", desc: "10+ वर्ष अनुभव — व्यावहारिक और सैद्धांतिक ज्ञान।" },
    { icon: "📜", title: "प्रमाण-पत्र", desc: "प्रशिक्षण पूर्ण होने पर प्रमाण-पत्र — करियर में शक्ति।" },
    { icon: "💼", title: "प्लेसमेंट सहायता", desc: "70% विद्यार्थी प्रशिक्षण पूरा कर नौकरी पाते हैं।" },
    { icon: "📱", title: "ऑनलाइन सुविधा", desc: "कभी भी, कहीं भी सीखें — मोबाइल या लैपटॉप।" },
    { icon: "💰", title: "किश्त व्यवस्था", desc: "₹499/माह से शुरू — शिक्षा कोई बाध्यता नहीं।" },
  ],
  sarkarsarkar: [
    { icon: "🏛️", title: "सरकारी सेवाएं", desc: "आधार, पैन, पासपोर्ट, राशन कार्ड — सब एक जगह।" },
    { icon: "📋", title: "आवेदन सहायता", desc: "फॉर्म भरने में मदद — दस्तावेज़ जांच और प्रस्तुति।" },
    { icon: "📱", title: "स्थिति ट्रैकिंग", desc: "आवेदन की स्थिति लाइव — कब मिलेगा, पता हमेशा।" },
    { icon: "💰", title: "योजनाएं", desc: "सरकारी योजनाओं की जानकारी — पात्रता और लाभ।" },
    { icon: "🤝", title: "शिकायत निवारण", desc: "ग्रेवांस रजिस्टर करें — ट्रैक और समाधान सहायता।" },
    { icon: "📞", title: "हेल्पलाइन", desc: "सरकारी सेवाओं की जानकारी — तात्कालिक सहायता।" },
  ],
  sarkarwellness: [
    { icon: "🌿", title: "आयुर्वेदिक उपचार", desc: "पंचकर्म, योग, प्राणायाम — प्राचीन उपचार, आधुनिक विधि।" },
    { icon: "👨‍⚕️", title: "वैद्य परामर्श", desc: "अनुभवी आयुर्वेदिक चिकित्सक — व्यक्तिगत स्वास्थ्य योजना।" },
    { icon: "🧘", title: "योग और ध्यान", desc: "दैनिक योग कक्षाएं — शारीरिक और मानसिक स्वास्थ्य।" },
    { icon: "🥗", title: "पोषण सलाह", desc: "आयुर्वेदिक आहार योजना — दोष के अनुसार।" },
    { icon: "🌱", title: "जड़ी-बूटी", desc: "शुद्ध प्राकृतिक उत्पाद — रासायनिक-मुक्त।" },
    { icon: "📊", title: "स्वास्थ्य ट्रैकिंग", desc: "अपने स्वास्थ्य का डेटा — प्रगति देखें, प्रेरित रहें।" },
  ],
};

const DEFAULT_FEATURES = [
  { icon: "⚡", title: "Lightning Fast", desc: "Optimized for speed and performance. Every interaction feels instant." },
  { icon: "📱", title: "Mobile First", desc: "Designed for the way you work — flawless on every device." },
  { icon: "🔒", title: "Secure by Default", desc: "Enterprise-grade security protecting your data 24/7." },
  { icon: "📊", title: "Smart Analytics", desc: "Real-time insights that help you make better decisions." },
  { icon: "🔗", title: "Easy Integrations", desc: "Connect with the tools you already use seamlessly." },
  { icon: "🌐", title: "Global Scale", desc: "Serve customers anywhere in the world without limits." },
  { icon: "🤖", title: "AI Powered", desc: "Smart automation that saves you time and effort." },
  { icon: "💳", title: "Easy Payments", desc: "UPI, cards, net banking — pay however you prefer." },
];

export function FeaturesPage({ brand }: { brand: any }) {
  const theme = (brand.theme ?? {}) as Record<string, string>;
  const primary = theme.primary ?? "#6d28d9";
  const secondary = theme.secondary ?? "#8b5cf6";
  const accent = theme.accent ?? "#c4b5fd";
  const bg = theme.bg ?? "#faf5ff";
  const features = BRAND_FEATURES[brand.slug] ?? (brand.features_json ?? DEFAULT_FEATURES) as any[];

  // Brand-specific stats for the stats bar
    const brandStatsBar: Record<string, Array<{ v: string; l: string }>> = {
      sarkarhealth: [
        { v: "50+", l: "वेरिफ़ाइड डॉक्टर" },
        { v: "5,000+", l: "सक्रिय मरीज़" },
        { v: "4.9★", l: "औसत रेटिंग" },
        { v: "24/7", l: "हेल्पलाइन" },
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
        { t: "लक्षण बताएं", d: "अपनी बीमारी के बारे में बताएं — AI आपको सही डॉक्टर से मिलाएगा।" },
        { t: "वीडियो कॉल पर मिलें", d: "सुरक्षित वीडियो कंसल्टेशन — अपनी प्राइवेसी बनी रहेगी।" },
        { t: "प्रिस्क्रिप्शन और दवाई", d: "डिजिटल प्रिस्क्रिप्शन पाएं, दवाई दरवाजे पर ऑर्डर करें।" },
      ],
    };
    const howItWorks = brandHowItWorks[brand.slug] ?? [
      { t: "Sign Up in Minutes", d: "Bina credit card ke account banayein — bas mobile number chahiye." },
      { t: "Listing Jodein", d: "Apni dukan, service ya skill ki jankari bharein aur turant live hoen." },
      { t: "Customer Paayein aur Badhein", d: "Lead paayein, reviews ikattha karein aur apne community mein prasiddh banein." },
    ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute inset-0 opacity-[0.04]"><div className="absolute inset-0 grid-pattern" /></div>
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl opacity-10 animate-float" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-15 animate-float" style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})`, animationDelay: "3s" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
            {brand.name} की विशेषताएं
          </div>
          <h1 className="heading-xl mb-4">
            {brand.name} क्यों <span className="gradient-text">अलग</span> है?
          </h1>
          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto">
            इंदौर के समुदाय के लिए बनाई गई विशेष सुविधाएं — आपके व्यापार और जीवन को आसान बनाने के लिए।
          </p>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f: any, i: number) => (
            <div
              key={i}
              className={`card-lift group rounded-2xl border bg-white p-6 shadow-sm ${i === 0 || i === 4 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
              style={{ borderColor: `${accent}25` }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform ${i === 0 || i === 4 ? 'w-16 h-16 text-3xl' : ''}`} style={{ background: `linear-gradient(135deg, ${primary}12, ${secondary}08)` }}>
                {f.icon ?? "✦"}
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{f.title}</h3>
              <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <section className="section-tight">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl p-8 md:p-12 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
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
            <p className="text-caption mb-3" style={{ color: primary }}>यह कैसे काम करता है</p>
            <h2 className="heading-md" style={{ color: primary }}>तीन आसान चरणों मं शुरू करें</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold animate-pulse-glow" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{step.t}</h3>
                <p className="text-sm opacity-50">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
            <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 dot-pattern" /></div>
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">
                {brand.name} के साथ आज ही जुड़ें
              </h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">
                Indore ke hazaron rogi pahle se jude chuke hain — aap ab kab rahenge?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`/register`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>
                  मुफ्त में शुरू करें →
                </a>
                <a href={`/contact`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">
                  संपर्क करें
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
