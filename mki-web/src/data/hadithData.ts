import type { Narrator, Hadith } from "../types";

// Narrators Database
export const narrators: Record<string, Narrator> = {
  // The Prophet
  prophet: {
    id: "prophet",
    nameAr: "النبي ﷺ",
    nameEn: "The Prophet ﷺ",
    status: "prophet",
    generation: "prophet",
    deathYear: 11,
    biographyAr: "محمد بن عبد الله، رسول الله وخاتم الأنبياء",
    biographyEn: "Muhammad ibn Abdullah, the Messenger of Allah and the Seal of the Prophets",
  },

  // Companions (Sahaba)
  anas: {
    id: "anas",
    nameAr: "أنس بن مالك",
    nameEn: "Anas ibn Malik",
    status: "companion",
    generation: "sahaba",
    birthYear: -10,
    deathYear: 93,
    biographyAr: "أنس بن مالك بن النضر الأنصاري، خادم رسول الله ﷺ",
    biographyEn: "Anas ibn Malik, the servant of the Prophet ﷺ for ten years",
    grade: "صحابي جليل",
  },
  muawiya_jahima: {
    id: "muawiya_jahima",
    nameAr: "معاوية بن جاهمة",
    nameEn: "Muawiya ibn Jahima",
    status: "companion",
    generation: "sahaba",
    deathYear: 93,
    biographyAr: "معاوية بن جاهمة السلمي، صحابي روى حديث الجهاد والأم",
    biographyEn: "Muawiya ibn Jahima as-Sulami, a companion who narrated the hadith about jihad and mother",
    grade: "صحابي",
  },

  // Successors (Tabi'een)
  abu_nadr_abbar: {
    id: "abu_nadr_abbar",
    nameAr: "أبو النضر الأبار",
    nameEn: "Abu al-Nadr al-Abbar",
    status: "unknown",
    generation: "tabieen",
    biographyAr: "أبو النضر الأبار، مجهول العين لم يوثقه أحد",
    biographyEn: "Abu al-Nadr al-Abbar, unknown narrator not authenticated by scholars",
    grade: "مجهول",
  },
  mansur_muhajir: {
    id: "mansur_muhajir",
    nameAr: "منصور بن المهاجر",
    nameEn: "Mansur ibn al-Muhajir",
    status: "unknown",
    generation: "tabieen",
    biographyAr: "التاريخ: غير معروف. لا يُعرف في كتب الرجال، قال ابن طاهر: منصور وأبو النضر لا يعرفان",
    biographyEn: "Date: Unknown. Not known in biographical dictionaries. Ibn Tahir said: Mansur and Abu al-Nadr are unknown",
    grade: "مجهول العين - لم يوثقه أحد",
  },

  // Followers of Successors (Atba' al-Tabi'een)
  thabit_bunani: {
    id: "thabit_bunani",
    nameAr: "ثابت البناني",
    nameEn: "Thabit al-Bunani",
    status: "trustworthy",
    generation: "atba_tabieen",
    birthYear: 36,
    deathYear: 127,
    biographyAr: "ثابت بن أسلم البناني، من ثقات التابعين",
    biographyEn: "Thabit ibn Aslam al-Bunani, one of the trustworthy successors",
    grade: "ثقة",
  },
  mualla_hisham: {
    id: "mualla_hisham",
    nameAr: "معلى بن هشام",
    nameEn: "Mu'alla ibn Hisham",
    status: "trustworthy",
    generation: "atba_tabieen",
    deathYear: 165,
    biographyAr: "معلى بن هشام، ثقة من رواة الحديث",
    biographyEn: "Mu'alla ibn Hisham, trustworthy narrator",
    grade: "ثقة",
  },
  yahya_kathir: {
    id: "yahya_kathir",
    nameAr: "يحيى بن كثير",
    nameEn: "Yahya ibn Kathir",
    status: "trustworthy",
    generation: "atba_tabieen",
    deathYear: 129,
    biographyAr: "يحيى بن كثير الأنصاري، ثقة ثبت",
    biographyEn: "Yahya ibn Kathir al-Ansari, trustworthy and firm",
    grade: "ثقة ثبت",
  },
  rawh_ubada: {
    id: "rawh_ubada",
    nameAr: "روح بن عبادة",
    nameEn: "Rawh ibn Ubada",
    status: "trustworthy",
    generation: "atba_tabieen",
    birthYear: 115,
    deathYear: 205,
    biographyAr: "روح بن عبادة بن العلاء القيسي البصري، ثقة فاضل",
    biographyEn: "Rawh ibn Ubada al-Qaysi al-Basri, trustworthy and virtuous",
    grade: "ثقة فاضل",
  },

  // Later Narrators
  muhammad_muthanna: {
    id: "muhammad_muthanna",
    nameAr: "محمد بن المثنى",
    nameEn: "Muhammad ibn al-Muthanna",
    status: "trustworthy",
    generation: "later",
    birthYear: 167,
    deathYear: 252,
    biographyAr: "محمد بن المثنى بن عبيد العنزي، ثقة ثبت",
    biographyEn: "Muhammad ibn al-Muthanna al-Anazi, trustworthy and firm",
    grade: "ثقة ثبت",
  },

  // Companions for Moon Splitting Hadith
  ibn_masud: {
    id: "ibn_masud",
    nameAr: "عبد الله بن مسعود",
    nameEn: "Abdullah ibn Mas'ud",
    status: "companion",
    generation: "sahaba",
    birthYear: -32,
    deathYear: 32,
    biographyAr: "عبد الله بن مسعود الهذلي، من السابقين الأولين، وأحد كبار علماء الصحابة",
    biographyEn: "Abdullah ibn Mas'ud al-Hudhali, one of the earliest converts and a leading scholar among the companions",
    grade: "صحابي جليل",
  },
  anas_splitting: {
    id: "anas_splitting",
    nameAr: "أنس بن مالك",
    nameEn: "Anas ibn Malik",
    status: "companion",
    generation: "sahaba",
    birthYear: -10,
    deathYear: 93,
    biographyAr: "أنس بن مالك بن النضر الأنصاري، خادم رسول الله ﷺ",
    biographyEn: "Anas ibn Malik, the servant of the Prophet ﷺ for ten years",
    grade: "صحابي جليل",
  },
  ibn_abbas: {
    id: "ibn_abbas",
    nameAr: "عبد الله بن عباس",
    nameEn: "Abdullah ibn Abbas",
    status: "companion",
    generation: "sahaba",
    birthYear: -3,
    deathYear: 68,
    biographyAr: "عبد الله بن عباس بن عبد المطلب، حبر الأمة وترجمان القرآن",
    biographyEn: "Abdullah ibn Abbas, the scholar of the Ummah and interpreter of the Quran",
    grade: "صحابي جليل",
  },

  // Successors for Moon Splitting Hadith
  masruq: {
    id: "masruq",
    nameAr: "مسروق بن الأجدع",
    nameEn: "Masruq ibn al-Ajda'",
    status: "trustworthy",
    generation: "tabieen",
    deathYear: 63,
    biographyAr: "مسروق بن الأجدع الهمداني، تابعي ثقة، من كبار أصحاب ابن مسعود",
    biographyEn: "Masruq ibn al-Ajda' al-Hamdani, trustworthy successor, one of the senior students of Ibn Mas'ud",
    grade: "ثقة عابد",
  },
  abu_mamar: {
    id: "abu_mamar",
    nameAr: "أبو معمر",
    nameEn: "Abu Ma'mar",
    status: "trustworthy",
    generation: "tabieen",
    deathYear: 130,
    biographyAr: "أبو معمر عبد الله بن سخبرة الأزدي، ثقة",
    biographyEn: "Abu Ma'mar Abdullah ibn Sakhbara al-Azdi, trustworthy",
    grade: "ثقة",
  },
  ibrahim_nakhai: {
    id: "ibrahim_nakhai",
    nameAr: "إبراهيم النخعي",
    nameEn: "Ibrahim al-Nakha'i",
    status: "trustworthy",
    generation: "tabieen",
    birthYear: 46,
    deathYear: 96,
    biographyAr: "إبراهيم بن يزيد النخعي، فقيه الكوفة، ثقة إمام",
    biographyEn: "Ibrahim ibn Yazid al-Nakha'i, the jurist of Kufa, trustworthy imam",
    grade: "ثقة إمام",
  },

  // Later narrators for Moon Splitting
  amash: {
    id: "amash",
    nameAr: "الأعمش",
    nameEn: "Al-A'mash",
    status: "trustworthy",
    generation: "atba_tabieen",
    birthYear: 61,
    deathYear: 148,
    biographyAr: "سليمان بن مهران الأعمش، ثقة حافظ، من أثبت الناس في إبراهيم النخعي",
    biographyEn: "Sulayman ibn Mihran al-A'mash, trustworthy hafiz, one of the most reliable narrators from Ibrahim al-Nakha'i",
    grade: "ثقة حافظ",
  },
  waki: {
    id: "waki",
    nameAr: "وكيع بن الجراح",
    nameEn: "Waki' ibn al-Jarrah",
    status: "trustworthy",
    generation: "atba_tabieen",
    birthYear: 129,
    deathYear: 197,
    biographyAr: "وكيع بن الجراح الرؤاسي، ثقة حافظ عابد",
    biographyEn: "Waki' ibn al-Jarrah al-Ru'asi, trustworthy hafiz and devout worshipper",
    grade: "ثقة حافظ عابد",
  },
  sufyan_uyayna: {
    id: "sufyan_uyayna",
    nameAr: "سفيان بن عيينة",
    nameEn: "Sufyan ibn Uyayna",
    status: "trustworthy",
    generation: "atba_tabieen",
    birthYear: 107,
    deathYear: 198,
    biographyAr: "سفيان بن عيينة الهلالي، ثقة حافظ فقيه إمام حجة",
    biographyEn: "Sufyan ibn Uyayna al-Hilali, trustworthy hafiz, jurist, imam, and authority",
    grade: "ثقة حافظ إمام",
  },

  // Collectors
  bukhari: {
    id: "bukhari",
    nameAr: "البخاري",
    nameEn: "Al-Bukhari",
    status: "collector",
    generation: "later",
    birthYear: 194,
    deathYear: 256,
    biographyAr: "محمد بن إسماعيل البخاري، أمير المؤمنين في الحديث، صاحب الجامع الصحيح",
    biographyEn: "Muhammad ibn Isma'il al-Bukhari, the Commander of the Faithful in Hadith, author of Sahih al-Bukhari",
    grade: "المخرج",
  },
  muslim: {
    id: "muslim",
    nameAr: "مسلم",
    nameEn: "Muslim",
    status: "collector",
    generation: "later",
    birthYear: 204,
    deathYear: 261,
    biographyAr: "مسلم بن الحجاج القشيري النيسابوري، صاحب الصحيح",
    biographyEn: "Muslim ibn al-Hajjaj al-Qushayri al-Naysaburi, author of Sahih Muslim",
    grade: "المخرج",
  },

  // Collectors
  nasai: {
    id: "nasai",
    nameAr: "النسائي",
    nameEn: "Al-Nasa'i",
    status: "collector",
    generation: "later",
    birthYear: 215,
    deathYear: 303,
    biographyAr: "أحمد بن شعيب النسائي، صاحب السنن",
    biographyEn: "Ahmad ibn Shu'ayb al-Nasa'i, author of Sunan al-Nasa'i",
    grade: "المخرج",
  },
  ibn_majah: {
    id: "ibn_majah",
    nameAr: "ابن ماجه",
    nameEn: "Ibn Majah",
    status: "collector",
    generation: "later",
    birthYear: 209,
    deathYear: 273,
    biographyAr: "محمد بن يزيد بن ماجه القزويني، صاحب السنن",
    biographyEn: "Muhammad ibn Yazid ibn Majah al-Qazwini, author of Sunan Ibn Majah",
    grade: "المخرج",
  },
  khatib_baghdadi: {
    id: "khatib_baghdadi",
    nameAr: "الخطيب البغدادي",
    nameEn: "Al-Khatib al-Baghdadi",
    status: "collector",
    generation: "later",
    birthYear: 392,
    deathYear: 463,
    biographyAr: "أحمد بن علي الخطيب البغدادي، صاحب تاريخ بغداد",
    biographyEn: "Ahmad ibn Ali al-Khatib al-Baghdadi, author of Tarikh Baghdad",
    grade: "المخرج",
  },
};

// Sample Hadiths with multiple chains
export const hadiths: Hadith[] = [
  {
    id: "jannah-ummahat",
    textAr: "الجنة تحت أقدام الأمهات",
    textEn: "Paradise is under the feet of mothers",
    topicAr: "بر الوالدين",
    topic: "Honoring Parents",
    analysisAr: `هذا الحديث ضعيف لا يصح عن النبي ﷺ بهذا اللفظ.

علة الحديث:
• منصور بن المهاجر: مجهول العين، لم يوثقه أحد من أهل العلم
• أبو النضر الأبار: مجهول، قال ابن طاهر: "منصور وأبو النضر لا يُعرفان"

الخلاصة: الإسناد ضعيف جداً لجهالة راويين متتاليين في السند.

ملاحظة: الحديث الصحيح في هذا الباب هو حديث معاوية بن جاهمة السلمي أنه جاء إلى النبي ﷺ يستأذنه في الجهاد، فقال له النبي ﷺ: "أحية أمك؟" قال: نعم. قال: "الزم رجلها فثَمَّ الجنة" - رواه النسائي وابن ماجه بإسناد صحيح.`,
    analysisEn: `This hadith is weak and not authentically attributed to the Prophet ﷺ with this wording.

Defects in the chain:
• Mansur ibn al-Muhajir: Unknown narrator, not authenticated by any scholar
• Abu al-Nadr al-Abbar: Unknown narrator. Ibn Tahir said: "Mansur and Abu al-Nadr are not known"

Conclusion: The chain is very weak due to two consecutive unknown narrators.

Note: The authentic hadith on this topic is the hadith of Muawiya ibn Jahima al-Sulami who came to the Prophet ﷺ asking permission for jihad. The Prophet ﷺ asked: "Is your mother alive?" He said: Yes. The Prophet said: "Stay by her feet, for there is Paradise" - Narrated by al-Nasa'i and Ibn Majah with an authentic chain.`,
    chains: [
      {
        id: "chain-weak",
        grade: "daif",
        source: "Al-Khatib al-Baghdadi",
        sourceAr: "الخطيب البغدادي",
        narrators: [
          "khatib_baghdadi",
          "mansur_muhajir",
          "abu_nadr_abbar",
          "anas",
          "prophet",
        ],
        referenceNumber: "تاريخ بغداد",
      },
    ],
  },
  {
    id: "moon-splitting",
    textAr: "انشق القمر على عهد رسول الله ﷺ فِلْقَتَيْن، فلقة فوق الجبل وفلقة دونه، فقال رسول الله ﷺ: اشهدوا",
    textEn: "The moon was split into two parts during the time of the Prophet ﷺ - one part above the mountain and one below it. The Prophet ﷺ said: 'Bear witness'",
    topicAr: "معجزات النبي ﷺ",
    topic: "Miracles of the Prophet ﷺ",
    analysisAr: `هذا الحديث صحيح متواتر، رواه جمع من الصحابة منهم:
• عبد الله بن مسعود
• أنس بن مالك
• عبد الله بن عباس
• جبير بن مطعم
• عبد الله بن عمر

وقد أخرجه البخاري ومسلم في صحيحيهما من طرق متعددة.

قال الله تعالى: ﴿اقْتَرَبَتِ السَّاعَةُ وَانشَقَّ الْقَمَرُ﴾ [القمر: 1]

إسناد البخاري:
جميع رواة هذا الإسناد ثقات أثبات:
• الأعمش: ثقة حافظ
• إبراهيم النخعي: ثقة إمام فقيه
• أبو معمر: ثقة
• مسروق: ثقة عابد من كبار التابعين
• عبد الله بن مسعود: صحابي جليل من السابقين الأولين

الخلاصة: الحديث صحيح بلا ريب، وانشقاق القمر معجزة ثابتة للنبي ﷺ بالقرآن والسنة المتواترة.`,
    analysisEn: `This hadith is authentic and mutawatir (mass-transmitted), narrated by multiple companions including:
• Abdullah ibn Mas'ud
• Anas ibn Malik
• Abdullah ibn Abbas
• Jubayr ibn Mut'im
• Abdullah ibn Umar

It was recorded by both al-Bukhari and Muslim in their Sahih collections through multiple chains.

Allah says: "The Hour has drawn near and the moon has split" [Al-Qamar: 1]

Al-Bukhari's Chain:
All narrators in this chain are trustworthy and reliable:
• Al-A'mash: Trustworthy hafiz
• Ibrahim al-Nakha'i: Trustworthy imam and jurist
• Abu Ma'mar: Trustworthy
• Masruq: Trustworthy worshipper, senior successor
• Abdullah ibn Mas'ud: Noble companion, one of the earliest converts

Conclusion: The hadith is authentic without doubt, and the splitting of the moon is a confirmed miracle of the Prophet ﷺ established by the Quran and mutawatir Sunnah.`,
    chains: [
      {
        id: "chain-ibn-masud",
        grade: "sahih",
        source: "Sahih al-Bukhari",
        sourceAr: "صحيح البخاري",
        narrators: [
          "bukhari",
          "waki",
          "amash",
          "ibrahim_nakhai",
          "masruq",
          "ibn_masud",
          "prophet",
        ],
        referenceNumber: "3636",
      },
      {
        id: "chain-anas",
        grade: "sahih",
        source: "Sahih al-Bukhari",
        sourceAr: "صحيح البخاري",
        narrators: [
          "bukhari",
          "sufyan_uyayna",
          "amash",
          "ibrahim_nakhai",
          "anas_splitting",
          "prophet",
        ],
        referenceNumber: "3638",
      },
      {
        id: "chain-ibn-abbas",
        grade: "sahih",
        source: "Sahih Muslim",
        sourceAr: "صحيح مسلم",
        narrators: [
          "muslim",
          "waki",
          "sufyan_uyayna",
          "amash",
          "ibn_abbas",
          "prophet",
        ],
        referenceNumber: "2802",
      },
    ],
  },
];

// Helper function to get narrator by ID
export function getNarrator(id: string): Narrator | undefined {
  return narrators[id];
}

// Helper function to get hadith by ID
export function getHadith(id: string): Hadith | undefined {
  return hadiths.find((h) => h.id === id);
}

// Status colors for visualization
export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  prophet: {
    bg: "bg-purple-600",
    text: "text-white",
    border: "border-purple-400",
  },
  companion: {
    bg: "bg-teal-500",
    text: "text-white",
    border: "border-teal-300",
  },
  trustworthy: {
    bg: "bg-emerald-500",
    text: "text-white",
    border: "border-emerald-300",
  },
  truthful: {
    bg: "bg-green-400",
    text: "text-gray-900",
    border: "border-green-200",
  },
  unknown: {
    bg: "bg-orange-500",
    text: "text-white",
    border: "border-orange-300",
  },
  weak: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-300",
  },
  collector: {
    bg: "bg-gray-500",
    text: "text-white",
    border: "border-gray-300",
  },
};

// Grade colors
export const gradeColors: Record<string, { bg: string; text: string }> = {
  sahih: { bg: "bg-emerald-500", text: "text-white" },
  hasan: { bg: "bg-yellow-500", text: "text-gray-900" },
  daif: { bg: "bg-orange-500", text: "text-white" },
  mawdu: { bg: "bg-red-600", text: "text-white" },
};

// Generation labels
export const generationLabels = {
  ar: {
    prophet: "النبي ﷺ",
    sahaba: "الصحابة (0-100 هـ)",
    tabieen: "التابعون (50-150 هـ)",
    atba_tabieen: "أتباع التابعين (100-200 هـ)",
    later: "المتأخرون (200-500 هـ)",
  },
  en: {
    prophet: "The Prophet ﷺ",
    sahaba: "Companions (0-100 AH)",
    tabieen: "Successors (50-150 AH)",
    atba_tabieen: "Followers of Successors (100-200 AH)",
    later: "Later Scholars (200-500 AH)",
  },
};

// Status labels
export const statusLabels = {
  ar: {
    prophet: "النبي ﷺ",
    companion: "صحابي",
    trustworthy: "ثقة",
    truthful: "صدوق",
    unknown: "مجهول",
    weak: "ضعيف",
    collector: "المخرج",
  },
  en: {
    prophet: "Prophet ﷺ",
    companion: "Companion",
    trustworthy: "Trustworthy",
    truthful: "Truthful",
    unknown: "Unknown",
    weak: "Weak",
    collector: "Collector",
  },
};

// Grade labels
export const gradeLabels = {
  ar: {
    sahih: "صحيح",
    hasan: "حسن",
    daif: "ضعيف",
    mawdu: "موضوع",
  },
  en: {
    sahih: "Authentic",
    hasan: "Good",
    daif: "Weak",
    mawdu: "Fabricated",
  },
};
