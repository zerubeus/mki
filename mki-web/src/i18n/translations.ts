export const translations = {
  ar: {
    // Header
    title: "اعرف دينك",
    subtitle: "معرفة إسلامية شاملة",

    // Topics
    aqida: "العقيدة",
    aqidaDesc: "أساسيات الإيمان والتوحيد",
    seera: "السيرة",
    seeraDesc: "سيرة النبي محمد صلى الله عليه وسلم",
    tareekh: "التاريخ",
    tareekhDesc: "تاريخ الإسلام والحضارة الإسلامية",

    // Description
    welcomeTitle: "مرحباً بك في موقع المعرفة الإسلامية",
    welcomeText:
      "هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من الكتاب والسنة. يمكنك تصفح المواضيع المختلفة لتعلم أساسيات الدين الإسلامي، من العقيدة والعبادات إلى السيرة النبوية وتاريخ الإسلام.",

    // Features
    feature1: "محتوى معتمد من الكتاب والسنة",
    feature2: "شرح مبسط ومفهوم للجميع",
    feature3: "متاح بعدة لغات",

    // Language names
    arabic: "ar",
    english: "en",

    // Page specific translations
    backToHome: "العودة للرئيسية",

    aqidaPageTitle: "العقيدة",
    aqidaPageDesc1:
      "يجري العمل على تطوير هذا القسم. نحن نعمل على تقديم محتوى شامل عن العقيدة الإسلامية.",

    seeraPageTitle: "السيرة النبوية",
    seeraPageDesc1:
      "يجري العمل على تطوير هذا القسم. نحن نعمل على تقديم معلومات مفصلة عن حياة النبي محمد (صلى الله عليه وسلم).",

    // SeerahJourney.tsx specific translations
    seerahJourneyTitle: "مسار النبي ﷺ",
    seerahJourneySubtitle: "رحلة تفاعلية عبر السيرة",
    seerahJourneyFooter:
      "بيانات الخريطة © مساهمو OpenStreetMap © CartoDB. تم تجميع معلومات الحدث لأغراض تعليمية.",
    timelineTitle: "الخط الزمني للأحداث",

    // Hadith page translations
    hadith: "الحديث",
    hadithDesc: "تحليل سلسلة إسناد الأحاديث",
    hadithPageTitle: "تحليل سلسلة إسناد الحديث",
    hadithPageSubtitle: "تحقق من صحة الأحاديث وتحليل سلاسل الرواة",
    narratorInfo: "معلومات الراوي",
    narratorStatus: "الحكم",
    narratorBiography: "الترجمة",
    chainComparison: "مقارنة",
    weakChain: "السند الضعيف",
    authenticChain: "السند الصحيح",
    selectNarrator: "اختر راوياً لعرض معلوماته",
    hadithText: "متن الحديث",
    chainGrade: "درجة السند",
    source: "المصدر",
    comparison: "المقارنة",
    comparisonDesc: "المعنى صحيح، اللفظ المشهور لم يصح",
  },

  en: {
    // Header
    title: "Know Your Religion",
    subtitle: "Comprehensive Islamic Knowledge",

    // Topics
    aqida: "Creed",
    aqidaDesc: "Foundations of faith and monotheism",
    seera: "Biography",
    seeraDesc: "Biography of Prophet Muhammad (PBUH)",
    tareekh: "History",
    tareekhDesc: "Islamic history and civilization",

    // Description
    welcomeTitle: "Welcome to the Islamic Knowledge Website",
    welcomeText:
      "This website aims to provide authentic and documented Islamic knowledge from the Quran and Sunnah. You can browse different topics to learn the basics of Islam, from creed and worship to the Prophet's biography and Islamic history.",

    // Features
    feature1: "Content based on Quran and Sunnah",
    feature2: "Simple explanations for everyone",
    feature3: "Available in multiple languages",

    // Language names
    arabic: "ar",
    english: "en",

    // Page specific translations
    backToHome: "Back to Home",

    aqidaPageTitle: "Creed",
    aqidaPageDesc1:
      "This section is currently under development. We\'re working on bringing you comprehensive content about Islamic creed and theology.",

    seeraPageTitle: "Prophetic Biography",
    seeraPageDesc1:
      "This section is currently under development. We are dedicated to providing detailed information about the life of Prophet Muhammad (peace be upon him).",

    // SeerahJourney.tsx specific translations
    seerahJourneyTitle: "The Prophet's Path ﷺ",
    seerahJourneySubtitle: "An Interactive Journey Through Seerah",
    seerahJourneyFooter:
      "Map data © OpenStreetMap contributors © CartoDB. Event information compiled for educational purposes.",
    timelineTitle: "Timeline of Events",

    // Hadith page translations
    hadith: "Hadith",
    hadithDesc: "Analysis of Hadith Chain of Narration",
    hadithPageTitle: "Hadith Chain Analysis",
    hadithPageSubtitle: "Verify hadith authenticity and analyze narrator chains",
    narratorInfo: "Narrator Information",
    narratorStatus: "Status",
    narratorBiography: "Biography",
    chainComparison: "Comparison",
    weakChain: "Weak Chain",
    authenticChain: "Authentic Chain",
    selectNarrator: "Select a narrator to view details",
    hadithText: "Hadith Text",
    chainGrade: "Chain Grade",
    source: "Source",
    comparison: "Comparison",
    comparisonDesc: "The meaning is correct, but the famous wording is not authenticated",
  },
} as const;

export type Locale = keyof typeof translations;
