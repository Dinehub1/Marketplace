import { BrandHeader, BrandFooter } from "../brand-header";

const BRAND_SERVICES: Record<string, Array<{ icon: string; title: string; desc: string }>> = {
  sarkarconnect: [
    { icon: "🔗", title: "B2B कनेक्ट", desc: "सप्लायर, बायर और डिस्ट्रीब्यूटर से जुड़ें — अपने इंडस्ट्री के सबसे बड़े नेटवर्क में।" },
    { icon: "💼", title: "डिजिटल कार्ड", desc: "अपने व्यापार का प्रोफ़ेशनल डिजिटल कार्ड — QR कोड से शेयर करें, कनेक्ट करें।" },
    { icon: "📋", title: "प्रोडक्ट कैटलॉग", desc: "अपने उत्पादों को विस्तृत कैटलॉग में लिस्ट करें — इमेज, कीमत और विवरण के साथ।" },
    { icon: "📈", title: "डील मैनेजमेंट", desc: "हर लीड और डील ट्रैक करें — प्रपोज़ल से क्लोज़ तक पूरी प्रक्रिया।" },
    { icon: "🤖", title: "AI मैचिंग", desc: "हमारा AI आपकी ज़रूरत से मेल खाने वाले पार्टनर खोजता है — समय और पैसा बचाएं।" },
    { icon: "📊", title: "एनालिटिक्स डैशबोर्ड", desc: "आपके नेटवर्क की प्रदर्शन, डील की सफलता और ग्रोथ ट्रेंड्स देखें।" },
  ],
  sarkarhealth: [
      { icon: "🩺", title: "डॉक्टर कंसल्टेशन", desc: "MBBS, MD, Ayurvedic — किसी भी विशेषज्ञ से वीडियो या इन-पर्सन कंसल्टेशन बुक करें।" },
      { icon: "💊", title: "दवाई डिलीवरी", desc: "सभी ब्रांडेड और जनरिक दवाइयाँ — आपके दरवाजे पर, 40% तक बचत।" },
      { icon: "🏥", title: "लैब टेस्ट", desc: "ब्लड, यूरीन, ECG, X-Ray — आपके घर से सैंपल कलेक्शन और डिजिटल रिपोर्ट।" },
      { icon: "📋", title: "हेल्थ प्रोफ़ाइल", desc: "आपकी पूरी मेडिकल हिस्ट्री एक जगह — डॉक्टर को शेयर करें एक क्लिक में।" },
      { icon: "👨‍⚕️", title: "डॉक्टर खोज", desc: "स्पेशलिटी, अनुभव, रेटिंग और उपलब्धता के अनुसार सही डॉक्टर खोजें।" },
      { icon: "🚑", title: "एमरजेंसी", desc: "24/7 एमरजेंसी हेल्पलाइन — एम्बुलेंस बुकिंग और तत्काल मदद।" },
      { icon: "🧠", title: "मानसिक स्वास्थ्य परामर्श", desc: "लाइसेंस प्राप्त मनोवैज्ञानिक और काउंसलर से वीडियो काउंसलिंग — तनाव, चिंता, अवसाद के लिए गोपनीय समर्थन।" },
      { icon: "👵", title: "वरिष्ठ नागरिक देखभाल", desc: "घर बुजुर्गों की देखभाल — दवा प्रबंधन, नर्सिंग सहायता, नियमित जाँच, और साथी सेवाएँ।" },
      { icon: "👶", title: "बाल रोग विशेषज्ञ", desc: "अनुभवी पीडियाट्रिशियन से शिशु और बच्चों का देखभाल — टीकाकरण, विकास निगरानी, बीमारी का इलाज।" },
    ],
  sarkardost: [
    { icon: "🏪", title: "स्थानीय व्यापार लिस्टिंग", desc: "अपनी दुकान, कार्यालय या सेवा को इंदौर की सबसे बड़ी डिजिटल डायरेक्टरी पर लिस्ट करें।" },
    { icon: "📢", title: "लीड जनरेशन", desc: "संभावित ग्राहकों की जानकारी सीधे पाएं — WhatsApp और SMS पर तुरंत नोटिफिकेशन।" },
    { icon: "📊", title: "व्यापार एनालिटिक्स", desc: "आपकी लिस्टिंग के प्रदर्शन, ग्राहक इंटरैक्शन और प्रतिस्पर्धा की गहरी जानकारी।" },
    { icon: "🎯", title: "टार्गेटेड प्रचार", desc: "अपने इलाके और कैटेगरी के अनुसार ग्राहकों तक पहुंचें — बजट-फ्रेंडली विज्ञापन।" },
    { icon: "📱", title: "मोबाइल प्रोफ़ाइल", desc: "एक सुंदर मोबाइल-फ्रेंडली प्रोफ़ाइल पेज — आपकी डिजिटल पहचान।" },
    { icon: "🤝", title: "समुदाय नेटवर्किंग", desc: "अन्य स्थानीय व्यापारियों से जुड़ें, सहयोग बनाएं और एक-दूसरे को बढ़ावा दें।" },
  ],
  followup: [
    { icon: "📅", title: "रिमाइंडर सेटअप", desc: "WhatsApp, SMS, ईमेल — कई चैनलों से स्वचालित रिमाइंडर सेट करें।" },
    { icon: "📋", title: "टास्क मैनेजमेंट", desc: "टास्क बनाएं, असाइन करें, डेडलाइन तय करें और प्रगति देखें।" },
    { icon: "🔄", title: "ऑटोमेटेड फॉलो-अप", desc: "AI-संचालित संदेश — ग्राहकों को समय पर याद दिलाएं बिना मैन्युअल प्रयास के।" },
    { icon: "📊", title: "प्रोडक्टिविटी रिपोर्ट", desc: "दैनिक और साप्ताहिक रिपोर्ट — टीम की प्रगति का डेटा।" },
    { icon: "👥", title: "टीम कोऑर्डिनेशन", desc: "टीम के सदस्यों को टास्क असाइन करें और साथ काम करें।" },
    { icon: "🔗", title: "कैलेंडर सिंक", desc: "Google Calendar, Outlook — आपकी मौजूदा टूल्स से जुड़ें।" },
  ],
  cloudplayer: [
    { icon: "🎬", title: "मीडिया स्ट्रीमिंग", desc: "फिल्म, सीरीज़, डॉक्यूमेंट्री — किसी भी डिवाइस पर स्ट्रीम करें।" },
    { icon: "☁️", title: "क्लाउड लाइब्रेरी", desc: "अपनी पूरी मीडिया लाइब्रेरी क्लाउड पर सुरक्षित — कहीं से भी एक्सेस।" },
    { icon: "📡", title: "लाइव ब्रॉडकास्ट", desc: "लाइव इवेंट और वेबिनार — हज़ारों दर्शकों तक एक साथ पहुंचाएं।" },
    { icon: "📱", title: "ऑफलाइन डाउनलोड", desc: "इंटरनेट के बिना भी — ऑफलाइन देखने के लिए डाउनलोड करें।" },
    { icon: "🔊", title: "प्रीमियम ऑडियो", desc: "Dolby Atmos, सराउंड साउंड — सिनेमा जैसा अनुभव।" },
    { icon: "👨‍👩‍👧", title: "फैमिली प्लान", desc: "5 सदस्यों तक — एक अकाउंट, कई प्रोफाइल।" },
  ],
  paisaflow: [
    { icon: "💸", title: "इन्वेस्टमेंट प्लान", desc: "म्यूचुअल फंड, FD, स्टॉक — अपने लक्ष्य के अनुसार पोर्टफोलियो।" },
    { icon: "📈", title: "पोर्टफोलियो ट्रैकिंग", desc: "रियल-टाइम अपडेट — आपके सभी निवेश एक डैशबोर्ड में।" },
    { icon: "🎯", title: "गोल-बेस्ड प्लान", desc: "घर, शादी, बच्चे की शिक्षा — हर लक्ष्य के लिए कस्टम योजना।" },
    { icon: "🛡️", title: "रिस्क मैनेजमेंट", desc: "AI-आधारित रिस्क स्कोर — सुरक्षित निवेश का मार्गदर्शन।" },
    { icon: "📊", title: "रिटर्न एनालिटिक्स", desc: "अपने निवेश का प्रदर्शन — तुलना और सुधार के सुझाव।" },
    { icon: "🏦", title: "बैंक लिंक", desc: "सभी प्रमुख बैंकों से सीधा कनेक्शन — तेज़ और सुरक्षित।" },
  ],
  yaadrakh: [
    { icon: "🧠", title: "AI नोट्स", desc: "बातें सुनकर AI नोट्स बनाता है — संगठित और खोजने योग्य।" },
    { icon: "⏰", title: "स्मार्ट रिमाइंडर", desc: "सही समय पर सही याद — कभी कुछ ना भूलें।" },
    { icon: "🔄", title: "क्रॉस-डिवाइस सिंक", desc: "फोन, टैबलेट, लैपटॉप — हर जगह एक जैसा अनुभव।" },
    { icon: "🔍", title: "स्मार्ट सर्च", desc: "किसी भी नोट या टास्क को तुरंत खोजें — AI से।" },
    { icon: "📊", title: "डैशबोर्ड", desc: "आपकी प्रोडक्टिविटी का डेटा — सुधारने के सुझाव।" },
    { icon: "🔒", title: "एन्क्रिप्शन", desc: "आपका सब कुछ एन्क्रिप्टेड — सुरक्षा प्राथमिक।" },
  ],
  "sarkar-ai": [
    { icon: "🤖", title: "AI असिस्टेंट", desc: "24/7 उपलब्ध बुद्धिमान सहायक — प्रश्न, सलाह, कार्य।" },
    { icon: "⚡", title: "तत्काल उत्तर", desc: "मिलीसेकंड में प्रतिक्रिया — कोई प्रतीक्षा नहीं।" },
    { icon: "🧠", title: "संदर्भ समझ", desc: "AI बातचीत का संदर्ध याद रखता है — बुद्धिमान संवाद।" },
    { icon: "🔧", title: "कार्य स्वचालन", desc: "दोहराए जाने वाले कार्य — AI करे, आप फोकस करें।" },
    { icon: "🌐", title: "बहुभाषी", desc: "हिंदी, अंग्रेजी और 10+ भाषाएं — आपकी भाषा में।" },
    { icon: "🔗", title: "API एक्सेस", desc: "डेवलपर्स के लिए API — अपने ऐप्स में AI एकीकृत करें।" },
  ],
  sarkarfood: [
    { icon: "🍔", title: "ऑनलाइन ऑर्डर", desc: "50+ रेस्टोरेंट — ब्राउज़ करें, ऑर्डर करें, आराम से बैठें।" },
    { icon: "⚡", title: "तेज़ डिलीवरी", desc: "30 मिनट में हॉट खाना — वादा किए गए समय में।" },
    { icon: "💰", title: "बजट मेनू", desc: "₹99 से शुरू — हर जेब के हिसाब से।" },
    { icon: "🌿", title: "विशेष फ़िल्टर", desc: "जाइन, मुगलाई, कन्टीनेंटल — स्वाद के अनुसार।" },
    { icon: "📍", title: "लाइव ट्रैकिंग", desc: "ऑर्डर की स्थिति लाइव — पार्टर से दरवाजे तक।" },
    { icon: "🎁", title: "रिवॉर्ड्स", desc: "हर ऑर्डर पर पॉइंट्स — मुफ्त खाना पाएं।" },
  ],
  sarkarfinance: [
    { icon: "🏦", title: "पर्सनल लोन", desc: "₹10,000 से ₹10 लाख — तत्काल मंजूरी, कम दस्तावेज़।" },
    { icon: "📱", title: "ऑनलाइन आवेदन", desc: "घर बैठे पूरी प्रक्रिया — फोटो अपलोड, वेरिफिकेशन।" },
    { icon: "💳", title: "EMI कैलकुलेटर", desc: "पहले से पता — कितनी EMI, कितना ब्याज।" },
    { icon: "📊", title: "क्रेडिट स्कोर", desc: "मुफ्त CIBIL स्कोर चेक — सुधारने के टिप्स।" },
    { icon: "🤝", title: "वित्तीय सलाह", desc: "पंजीकृत सलाहकार — लोन, बीमा, निवेश।" },
    { icon: "🔒", title: "सुरक्षा", desc: "बैंक-स्तरीय एन्क्रिप्शन — डेटा सुरक्षित।" },
  ],
  sarkarpay: [
    { icon: "💰", title: "पेमेंट गेटवे", desc: "UPI, कार्ड, नेट बैंकिंग — सभी मोड एक जगह।" },
    { icon: "⚡", title: "इंस्टेंट सेटलमेंट", desc: "T+0 — बिक्री तुरंत बैंक में।" },
    { icon: "📊", title: "डैशबोर्ड", desc: "दैनिक बिक्री, रिफंड, चार्जबैक — एक जगह।" },
    { icon: "🔒", title: "सुरक्षा", desc: "PCI DSS कंप्लायंट — हर लेन-देन सुरक्षित।" },
    { icon: "📈", title: "एनालिटिक्स", desc: "बिक्री रुझान, सर्वोत्तम घंटे — डेटा से निर्णय।" },
    { icon: "🌐", title: "अंतर्राष्ट्रीय", desc: "विदेशी मुद्रा में भी भुगतान स्वीकार करें।" },
  ],
  sarkarmart: [
    { icon: "🛍️", title: "ऑनलाइन स्टोर", desc: "200+ स्थानीय ब्रांड — अनूठे उत्पाद।" },
    { icon: "🚚", title: "डिलीवरी", desc: "शहर भर में 24 घंटे के भीतर।" },
    { icon: "💸", title: "कैशबैक", desc: "हर खरीदारी पर 5-20% कैशबैक।" },
    { icon: "⭐", title: "रिव्यू", desc: "वेरिफ़ाइड समीक्षा — सही निर्णय लें।" },
    { icon: "🎁", title: "ऑफ़र", desc: "वीकंड डील्स और विशेष छूट।" },
    { icon: "🔄", title: "रिटर्न", desc: "7 दिन में आसान रिटर्न।" },
  ],
  sarkarlegal: [
    { icon: "⚖️", title: "कंसल्टेशन", desc: "अनुभवी वकील — सिविल, क्रिमिनल, कॉर्पोरेट।" },
    { icon: "📋", title: "दस्तावेज़", desc: "अनुबंद, एफिडेविट — मुफ्त टेम्पलेट।" },
    { icon: "🏛️", title: "कोर्ट", desc: "इंदौर न्यायालय में प्रतिनिधित्व।" },
    { icon: "📱", title: "ऑनलाइन", desc: "वीडियो कॉल पर परामर्श — घर बैठे।" },
    { icon: "💰", title: "शुल्क", desc: "पारदर्शित — पहली कंसल्टेशन मुफ्त।" },
    { icon: "🔒", title: "गोपनीयता", desc: "केस जानकारी पूर्णतः गोपनीय।" },
  ],
  "justdial-agent": [
    { icon: "📇", title: "डायरेक्टरी", desc: "3,233+ व्यापार — इंदौर की सबसे बड़ी सूची।" },
    { icon: "📊", title: "एनालिटिक्स", desc: "बाज़ार रुझान और प्रतिस्पर्धा की जानकारी।" },
    { icon: "🎯", title: "लीड", desc: "संभावित ग्राहकों की जानकारी।" },
    { icon: "📱", title: "प्रोफ़ाइल", desc: "मोबाइल-फ्रेंडली व्यापार प्रोफ़ाइल।" },
    { icon: "🏆", title: "रैंकिंग", desc: "प्रीमियम लिस्टिंग से टॉप पर।" },
    { icon: "🤝", title: "B2B", desc: "सप्लायर और बायर से जुड़ें।" },
  ],
  sarkarmarketplace: [
    { icon: "🧭", title: "डायरेक्टरी", desc: "3,233+ व्यापार — हर श्रेणी में।" },
    { icon: "🔍", title: "सर्च", desc: "नाम, श्रेणी, स्थान — तुरंत खोजें।" },
    { icon: "📱", title: "मोबाइल", desc: "किसी भी डिवाइस से एक्सेस।" },
    { icon: "⭐", title: "रिव्यू", desc: "समुदाय कि रेटिंग।" },
    { icon: "📊", title: "विश्लेषण", desc: "व्यापार प्रदर्शन का डेटा।" },
    { icon: "🤝", title: "नेटवर्क", desc: "व्यापारी जुड़ें और सहयोग करें।" },
  ],
  ayurvedicwebsite: [
    { icon: "🪷", title: "उत्पाद", desc: "शुद्ध आयुर्वेदिक — रासायनिक-मुक्त।" },
    { icon: "🏆", title: "प्रमाणन", desc: "AYUSH प्रमाणित — गुणवत्ता की गारंटी।" },
    { icon: "👨‍⚕️", title: "परामर्श", desc: "वैद्य से निःशुल्क परामर्श।" },
    { icon: "📦", title: "डिलीवरी", desc: "भारत भर में — ₹499+ पर मुफ्त।" },
    { icon: "🌿", title: "पूरक", desc: "अश्वगंधा, ब्राह्मी, त्रिफला।" },
    { icon: "💰", title: "मूल्य", desc: "₹99 से शुरू — हर जेब के लिए।" },
  ],
  sarkarghar: [
    { icon: "🏠", title: "सूची", desc: "500+ संपत्तियां — अपार्टमेंट, विला, प्लॉट।" },
    { icon: "🔍", title: "खोज", desc: "स्थान, बजट, आकार के अनुसार।" },
    { icon: "📊", title: "मूल्य", desc: "AI अनुमान — खरीदने से पहले पता।" },
    { icon: "📋", title: "कानूनी", desc: "दस्तावेज़ सत्यापन और रजिस्ट्रेशन।" },
    { icon: "🏦", title: "लोन", desc: "बैंक लोन सहायता।" },
    { icon: "📱", title: "टूर", desc: "360° वर्चुअल टूर।" },
  ],
  sarkarskills: [
    { icon: "🛠️", title: "प्रशिक्षण", desc: "डिजिटल मार्केटिंग, AI, ई-कॉमर्स।" },
    { icon: "🎓", title: "प्रमाण-पत्र", desc: "प्रशिक्षण पूर्ण होने पर।" },
    { icon: "👨‍🏫", title: "शिक्षक", desc: "10+ वर्ष अनुभव वाले।" },
    { icon: "📱", title: "सुविधा", desc: "ऑनलाइन और ऑफलाइन दोनों।" },
    { icon: "💼", title: "प्लेसमेंट", desc: "60% विद्यार्थी नौकरी पाते हैं।" },
    { icon: "💰", title: "किश्त", desc: "₹500/माह से शुरू।" },
  ],
  "hyperframes-realestate": [
    { icon: "🎥", title: "वीडियो टूर", desc: "4K वीडियो — दूर से प्रॉपर्टी देखें।" },
    { icon: "🗺️", title: "लोकेशन", desc: "Google Maps — परिवेश देखें।" },
    { icon: "📊", title: "मूल्य", desc: "प्रति वर्ग फुट दर और रुझान।" },
    { icon: "🤝", title: "एजेंट", desc: "अनुभवी रियल एस्टेट एजेंट से।" },
    { icon: "📋", title: "दस्तावेज़", desc: "रजिस्ट्रेशन और कानूनी सहायता।" },
    { icon: "💰", title: "लोन", desc: "15+ बैंक पार्टनर।" },
  ],
  sikshahub: [
    { icon: "📚", title: "सामग्री", desc: "CBSE, ICSE, MP Board — कक्षा 1-12।" },
    { icon: "🎥", title: "कक्षाएं", desc: "रिकॉर्डेड वीडियो — कभी भी, कहीं भी।" },
    { icon: "📝", title: "अभ्यास", desc: "प्रश्न और परीक्षण।" },
    { icon: "👨‍🏫", title: "ट्यूशन", desc: "लाइव सत्र — सीधे प्रश्न पूछें।" },
    { icon: "📊", title: "रिपोर्ट", desc: "माता-पिता के लिए प्रगति।" },
    { icon: "💰", title: "शुल्क", desc: "₹199/माह से।" },
  ],
  sarkartravel: [
    { icon: "✈️", title: "बुकिंग", desc: "फ्लाइट, होटल, पैकेज — घरेलू और अंतर्राष्ट्रीय।" },
    { icon: "💰", title: "दर", desc: "तुलना — हज़ारों रुपये बचाएं।" },
    { icon: "📅", title: "लचीलापन", desc: "तारीख बदलें या रद्द करें।" },
    { icon: "🎒", title: "पैकेज", desc: "हनीमून, परिवार, साहसिक।" },
    { icon: "📱", title: "सहायता", desc: "24/7 सहायता।" },
    { icon: "🛡️", title: "बीमा", desc: "यात्रा बीमा — सुरक्षा हर कदम पर।" },
  ],
  sarkardukaan: [
    { icon: "🛒", title: "स्टोर", desc: "ऑनलाइन दुकान — मिनटों में तैयार।" },
    { icon: "📱", title: "प्रबंधन", desc: "फोन से सब कुछ।" },
    { icon: "🚚", title: "डिलीवरी", desc: "शहर भर में।" },
    { icon: "💳", title: "भुगतान", desc: "UPI, कार्ड, COD।" },
    { icon: "📊", title: "स्टॉक", desc: "इन्वेंट्री ट्रैक।" },
    { icon: "📈", title: "विश्लेषण", desc: "बिक्री डेटा।" },
  ],
  sarkarbazaar: [
    { icon: "🏪", title: "व्यापारी", desc: "1,000+ स्थानीय व्यापारी।" },
    { icon: "🌐", title: "निर्यात", desc: "स्थानीय उत्पाद विश्व भर में।" },
    { icon: "📱", title: "ऐप", desc: "आसान ऑर्डर ऐप।" },
    { icon: "💰", title: "मूल्य", desc: "थोक दर — विशेष।" },
    { icon: "🚚", title: "शिपिंग", desc: "भारत भर में।" },
    { icon: "🤝", title: "नेटवर्क", desc: "B2B कनेक्शन।" },
  ],
  sarkarjobs: [
    { icon: "💼", title: "नौकरी", desc: "योग्यता के अनुसार मेल।" },
    { icon: "🏢", title: "कंपनियां", desc: "500+ वेरिफ़ाइड नियोक्ता।" },
    { icon: "📝", title: "रिज्यूमे", desc: "प्रोफ़ेशनल टेम्पलेट।" },
    { icon: "🎯", title: "सलाह", desc: "कैरियर काउंसलर।" },
    { icon: "📊", title: "टेस्ट", desc: "कौशल मूल्यांकन।" },
    { icon: "💰", title: "वेतन", desc: "उद्योग मानक तुलना।" },
  ],
  sarkared: [
    { icon: "🎓", title: "कोर्स", desc: "डिजिटल मार्केटिंग, AI, वेब।" },
    { icon: "👨‍🏫", title: "शिक्षक", desc: "10+ वर्ष अनुभव।" },
    { icon: "📜", title: "पत्र", desc: "प्रमाण-पत्र — करियर में शक्ति।" },
    { icon: "💼", title: "नौकरी", desc: "70% प्लेसमेंट।" },
    { icon: "📱", title: "ऑनलाइन", desc: "कभी भी, कहीं भी।" },
    { icon: "💰", title: "किश्त", desc: "₹499/माह से।" },
  ],
  sarkarsarkar: [
    { icon: "🏛️", title: "सेवाएं", desc: "आधार, पैन, पासपोर्ट, राशन।" },
    { icon: "📋", title: "आवेदन", desc: "फॉर्म भरने में सहायता।" },
    { icon: "📱", title: "ट्रैकिंग", desc: "स्थिति लाइव।" },
    { icon: "💰", title: "योजनाएं", desc: "सरकारी योजनाओं की जानकारी।" },
    { icon: "🤝", title: "शिकायत", desc: "ग्रेवांस रजिस्टर।" },
    { icon: "📞", title: "हेल्पलाइन", desc: "तात्कालिक सहायता।" },
  ],
  sarkarwellness: [
    { icon: "🌿", title: "उपचार", desc: "पंचकर्म, योग, प्राणायाम।" },
    { icon: "👨‍⚕️", title: "परामर्श", desc: "वैद्य से व्यक्तिगत योजना।" },
    { icon: "🧘", title: "योग", desc: "दैनिक कक्षाएं।" },
    { icon: "🥗", title: "आहार", desc: "आयुर्वेदिक पोषण।" },
    { icon: "🌱", title: "जड़ी-बूटी", desc: "शुद्ध प्राकृतिक।" },
    { icon: "📊", title: "ट्रैकिंग", desc: "स्वास्थ्य प्रगति।" },
  ],
};

const DEFAULT_SERVICES = [
  { icon: "⭐", title: "Premium Quality", desc: "Only the best for our customers. We never compromise on quality." },
  { icon: "🚀", title: "Fast Delivery", desc: "Quick and reliable service that respects your time." },
  { icon: "💬", title: "24/7 Support", desc: "Our team is always here to help you, any time of day." },
  { icon: "🔒", title: "Secure & Safe", desc: "Your data and transactions are protected with enterprise-grade security." },
  { icon: "💡", title: "Innovation First", desc: "We constantly improve our offerings with the latest technology." },
  { icon: "🤝", title: "Trusted by Thousands", desc: "Join our community of satisfied customers across India." },
];

export function ServicesPage({ brand }: { brand: any }) {
  const t = (brand.theme ?? {}) as Record<string, string>;
  const primary = t.primary ?? "#6d28d9";
  const secondary = t.secondary ?? "#8b5cf6";
  const accent = t.accent ?? "#c4b5fd";
  const bg = t.bg ?? "#faf5ff";
  const services = BRAND_SERVICES[brand.slug] ?? (brand.services_json ?? DEFAULT_SERVICES) as any[];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <BrandHeader brand={brand} />

      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-6" style={{ borderColor: `${accent}50`, color: primary }}>हमारी सेवाएं</div>
          <h1 className="heading-xl mb-6"><span style={{ color: primary }}>{brand.name} आपके लिए क्या कर सकता है?</span></h1>
          <p className="text-lg opacity-60 max-w-2xl mx-auto">
          Ghar baithe poora healthcare — doctor se milen, dawai payein, reports paayein — sab ek jagah.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s: any, i: number) => (
              <div key={i} className="card-lift rounded-2xl border bg-white p-6 h-full" style={{ borderColor: `${accent}30` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: `linear-gradient(135deg, ${primary}15, ${secondary}10)` }}>{s.icon ?? "✦"}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: primary }}>{s.title}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{s.desc}</p>
                {s.price && <p className="mt-3 text-sm font-semibold" style={{ color: secondary }}>{s.price}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-caption mb-3" style={{ color: primary }}>यह कैसे काम करता है</p>
            <h2 className="heading-md mb-4" style={{ color: primary }}>सरल और सीधा प्रक्रिया</h2>
            <p className="text-body max-w-2xl mx-auto">कुछ ही चरणों में अपना व्यापार ऑनलाइन ले जाएं</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: "1", t: "साइन अप करें", d: "मोबाइल नंबर से मिनटों में अकाउंट बनाएं" },
              { n: "2", t: "विवरण भरें", d: "अपने व्यापार की जानकारी, फोटो और सेवाएं जोड़ें" },
              { n: "3", t: "सत्यापन पाएं", d: "हमारी टीम आपकी जानकारी सत्यापित करेगी — सुरक्षा के लिए" },
              { n: "4", t: "लाइव हो जाएं", d: "अब इंदौर में हर ग्राहक आपको खोज सकता है!" },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white mx-auto mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>{step.n}</div>
                <h3 className="font-bold mb-1" style={{ color: primary }}>{step.t}</h3>
                <p className="text-sm opacity-60">{step.d}</p>
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
              <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4">शुरू करने को तैयार?</h2>
              <p className="text-white/80 mb-8">Aaj hi apni family ka health profile banaayein — pehla consultation free!</p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={`https://${brand.slug}.cashcard.live/contact`} className="bg-white px-8 py-3.5 rounded-xl font-bold text-sm hover:translate-y-[-2px] transition-transform shadow-lg" style={{ color: primary }}>संपर्क करें →</a>
                <a href={`https://${brand.slug}.cashcard.live/pricing`} className="border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors">प्राइसिंग देखें</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandFooter brand={brand} />
    </div>
  );
}
