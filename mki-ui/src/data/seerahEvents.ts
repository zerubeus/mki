import type { HistoricalEvent, GeoCoordinates, EventEra } from "../types";

// Base event structure with coordinates and metadata
interface BaseEvent {
  id: number;
  year: string;
  coordinates: GeoCoordinates;
  era: EventEra;
}

// Localized content for events
interface LocalizedEventContent {
  title: string;
  description: string;
  locationName: string;
}

// Combined event structure
export interface LocalizedHistoricalEvent
  extends BaseEvent,
    LocalizedEventContent {}

// Base events with coordinates and metadata
const BASE_EVENTS: BaseEvent[] = [
  {
    id: 1,
    year: "570 CE",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Pre-Prophethood",
  },
  {
    id: 2,
    year: "c. 595 CE",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Pre-Prophethood",
  },
  {
    id: 3,
    year: "610 CE",
    coordinates: { lat: 21.4573, lng: 39.8593 },
    era: "Meccan",
  },
  {
    id: 4,
    year: "613 CE",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Meccan",
  },
  {
    id: 5,
    year: "619 CE",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Meccan",
  },
  {
    id: 6,
    year: "c. 621 CE",
    coordinates: { lat: 31.7761, lng: 35.2357 }, // Jerusalem (Al-Aqsa)
    era: "Meccan",
  },
  {
    id: 7,
    year: "622 CE",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Meccan", // Journey itself; Medinan era starts upon arrival
  },
  {
    id: 8,
    year: "622 CE",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Medinan",
  },
  {
    id: 9,
    year: "624 CE (2 AH)",
    coordinates: { lat: 23.7667, lng: 38.7917 },
    era: "Medinan",
  },
  {
    id: 10,
    year: "625 CE (3 AH)",
    coordinates: { lat: 24.5036, lng: 39.6136 },
    era: "Medinan",
  },
  {
    id: 11,
    year: "627 CE (5 AH)",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Medinan",
  },
  {
    id: 12,
    year: "628 CE (6 AH)",
    coordinates: { lat: 21.3175, lng: 39.6586 },
    era: "Medinan",
  },
  {
    id: 13,
    year: "630 CE (8 AH)",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Medinan",
  },
  {
    id: 14,
    year: "632 CE (10 AH)",
    coordinates: { lat: 21.3549, lng: 39.9841 }, // Mount Arafat
    era: "Medinan",
  },
  {
    id: 15,
    year: "632 CE (11 AH)",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Medinan",
  },
];

// English content
const ENGLISH_CONTENT: Record<number, LocalizedEventContent> = {
  1: {
    title: "Birth of Prophet Muhammad ﷺ",
    description:
      "Born in Mecca, in the tribe of Quraysh. His father, Abdullah, died before his birth, and his mother, Aminah, died when he was young.",
    locationName: "Mecca",
  },
  2: {
    title: "Marriage to Khadijah bint Khuwaylid",
    description:
      "Muhammad ﷺ married Khadijah, a wealthy and respected businesswoman in Mecca. She was his first wife and a great source of support.",
    locationName: "Mecca",
  },
  3: {
    title: "First Revelation",
    description:
      "While meditating in the Cave of Hira on Jabal al-Nour (Mountain of Light), Angel Jibril (Gabriel) appeared to Muhammad ﷺ and revealed the first verses of the Quran.",
    locationName: "Cave of Hira, Mecca",
  },
  4: {
    title: "Beginning of Public Preaching",
    description:
      "After a period of private preaching, Muhammad ﷺ began to publicly proclaim the message of Islam in Mecca, starting with his close relatives.",
    locationName: "Mecca",
  },
  5: {
    title: "Year of Sorrow ('Aam al-Huzn)",
    description:
      "A difficult year marked by the deaths of his beloved wife Khadijah and his uncle Abu Talib, who provided him protection from Quraysh.",
    locationName: "Mecca",
  },
  6: {
    title: "Isra and Mi'raj (Night Journey & Ascension)",
    description:
      "A miraculous physical and spiritual journey from Mecca to Al-Aqsa Mosque in Jerusalem, and then an ascension through the heavens.",
    locationName: "Mecca to Jerusalem",
  },
  7: {
    title: "The Hijra (Migration to Medina)",
    description:
      "Due to increasing persecution, Muhammad ﷺ and his followers migrated from Mecca to Yathrib, which was renamed Medina. This marks the beginning of the Islamic Hijri calendar.",
    locationName: "Medina",
  },
  8: {
    title: "Establishment of the Constitution of Medina",
    description:
      "A formal agreement establishing a multi-religious Islamic state in Medina, ensuring rights and responsibilities for Muslims, Jews, and other communities.",
    locationName: "Medina",
  },
  9: {
    title: "Battle of Badr",
    description:
      "The first major battle between Muslims of Medina and Quraysh of Mecca. A decisive Muslim victory despite being outnumbered, strengthening the early Muslim community.",
    locationName: "Badr",
  },
  10: {
    title: "Battle of Uhud",
    description:
      "Fought near Mount Uhud against Meccans seeking revenge for Badr. Muslims faced setbacks due to tactical errors after initial success.",
    locationName: "Mount Uhud, Medina",
  },
  11: {
    title: "Battle of the Trench (Khandaq)",
    description:
      "A siege of Medina by a confederation of Meccans and other tribes. Muslims successfully defended the city by digging a trench, a tactic suggested by Salman al-Farsi.",
    locationName: "Medina",
  },
  12: {
    title: "Treaty of Hudaybiyyah",
    description:
      "A pivotal 10-year peace treaty between Medina and Quraysh of Mecca, enabling Muslims to perform Umrah the following year and facilitating the spread of Islam.",
    locationName: "Hudaybiyyah (near Mecca)",
  },
  13: {
    title: "Conquest of Mecca",
    description:
      "Muhammad ﷺ and a large Muslim army entered Mecca almost unopposed. He granted amnesty to its people and cleansed the Kaaba of idols.",
    locationName: "Mecca",
  },
  14: {
    title: "Farewell Pilgrimage (Hajjat al-Wada)",
    description:
      "The only Hajj pilgrimage Muhammad ﷺ performed. He delivered his famous Farewell Sermon at Mount Arafat, summarizing key Islamic teachings.",
    locationName: "Mecca & Arafat",
  },
  15: {
    title: "Death of Prophet Muhammad ﷺ",
    description:
      "The Prophet ﷺ passed away in Medina in the house of his wife Aisha. He was buried in what is now the Green Dome in the Prophet's Mosque (Al-Masjid an-Nabawi).",
    locationName: "Medina",
  },
};

// Arabic content
const ARABIC_CONTENT: Record<number, LocalizedEventContent> = {
  1: {
    title: "ولادة النبي محمد ﷺ",
    description:
      "وُلد في مكة، في قبيلة قريش. توفي والده عبد الله قبل ولادته، وتوفيت والدته آمنة وهو صغير.",
    locationName: "مكة",
  },
  2: {
    title: "الزواج من خديجة بنت خويلد",
    description:
      "تزوج محمد ﷺ من خديجة، وهي امرأة أعمال ثرية ومحترمة في مكة. كانت زوجته الأولى ومصدر دعم كبير له.",
    locationName: "مكة",
  },
  3: {
    title: "الوحي الأول",
    description:
      "أثناء تأمله في غار حراء على جبل النور، ظهر له الملك جبريل عليه السلام وأنزل عليه الآيات الأولى من القرآن.",
    locationName: "غار حراء، مكة",
  },
  4: {
    title: "بداية الدعوة العلنية",
    description:
      "بعد فترة من الدعوة السرية، بدأ محمد ﷺ في إعلان رسالة الإسلام علناً في مكة، بدءاً من أقاربه المقربين.",
    locationName: "مكة",
  },
  5: {
    title: "عام الحزن",
    description:
      "عام صعب تميز بوفاة زوجته الحبيبة خديجة وعمه أبو طالب، الذي كان يوفر له الحماية من قريش.",
    locationName: "مكة",
  },
  6: {
    title: "الإسراء والمعراج",
    description:
      "رحلة معجزة جسدية وروحية من مكة إلى المسجد الأقصى في القدس، ثم العروج عبر السماوات.",
    locationName: "من مكة إلى القدس",
  },
  7: {
    title: "الهجرة إلى المدينة",
    description:
      "بسبب تزايد الاضطهاد، هاجر محمد ﷺ وأتباعه من مكة إلى يثرب، التي أُعيد تسميتها إلى المدينة. هذا يمثل بداية التقويم الهجري الإسلامي.",
    locationName: "المدينة",
  },
  8: {
    title: "وضع دستور المدينة",
    description:
      "اتفاقية رسمية لإنشاء دولة إسلامية متعددة الأديان في المدينة، تضمن الحقوق والمسؤوليات للمسلمين واليهود والمجتمعات الأخرى.",
    locationName: "المدينة",
  },
  9: {
    title: "غزوة بدر",
    description:
      "أول معركة كبرى بين مسلمي المدينة وقريش مكة. انتصار حاسم للمسلمين رغم قلة عددهم، مما قوى المجتمع المسلم المبكر.",
    locationName: "بدر",
  },
  10: {
    title: "غزوة أحد",
    description:
      "قاتل بالقرب من جبل أحد ضد المكيين الساعين للانتقام من بدر. واجه المسلمون نكسات بسبب أخطاء تكتيكية بعد النجاح الأولي.",
    locationName: "جبل أحد، المدينة",
  },
  11: {
    title: "غزوة الخندق (الأحزاب)",
    description:
      "حصار المدينة من قبل تحالف من المكيين والقبائل الأخرى. دافع المسلمون عن المدينة بنجاح بحفر خندق، وهي تكتيك اقترحه سلمان الفارسي.",
    locationName: "المدينة",
  },
  12: {
    title: "صلح الحديبية",
    description:
      "معاهدة سلام محورية لمدة 10 سنوات بين المدينة وقريش مكة، مكنت المسلمين من أداء العمرة في العام التالي وسهلت انتشار الإسلام.",
    locationName: "الحديبية (بالقرب من مكة)",
  },
  13: {
    title: "فتح مكة",
    description:
      "دخل محمد ﷺ وجيش مسلم كبير مكة دون مقاومة تُذكر. منح العفو لأهلها وطهر الكعبة من الأصنام.",
    locationName: "مكة",
  },
  14: {
    title: "حجة الوداع",
    description:
      "الحج الوحيد الذي أداه محمد ﷺ. ألقى خطبة الوداع الشهيرة في جبل عرفات، ملخصاً التعاليم الإسلامية الأساسية.",
    locationName: "مكة وعرفات",
  },
  15: {
    title: "وفاة النبي محمد ﷺ",
    description:
      "توفي النبي ﷺ في المدينة في بيت زوجته عائشة. دُفن في ما يُعرف الآن بالقبة الخضراء في المسجد النبوي.",
    locationName: "المدينة",
  },
};

// Function to get localized events
export function getLocalizedEvents(
  locale: "ar" | "en",
): LocalizedHistoricalEvent[] {
  const content = locale === "ar" ? ARABIC_CONTENT : ENGLISH_CONTENT;

  return BASE_EVENTS.map((baseEvent) => ({
    ...baseEvent,
    ...content[baseEvent.id],
  }));
}

// For backward compatibility, export English events as default
export const HISTORICAL_EVENTS: HistoricalEvent[] = getLocalizedEvents("en");

export const MAP_INITIAL_CENTER: [number, number] = [24.7, 39.5];
export const MAP_INITIAL_ZOOM: number = 6;
export const MAP_EVENT_ZOOM: number = 9;
