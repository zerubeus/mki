// Wikipedia region metadata with manual URL mapping

export interface WikipediaRegionInfo {
  regionName: string;
  wikipediaSlug: string;
  wikipediaSlugAr?: string; // Arabic Wikipedia slug if different
  titleEn: string;
  titleAr: string;
  description?: string;
  alternateNames?: string[];
}

// Manual mapping of regions to Wikipedia articles
export const wikipediaRegions: Record<string, WikipediaRegionInfo> = {
  // Major Empires
  "Sasanian Empire": {
    regionName: "Sasanian Empire",
    wikipediaSlug: "Sasanian_Empire",
    wikipediaSlugAr: "الإمبراطورية_الساسانية",
    titleEn: "Sasanian Empire",
    titleAr: "الإمبراطورية الساسانية",
    description: "The last pre-Islamic Persian empire (224-651 CE), ruling over much of Western Asia.",
    alternateNames: ["Sasanian E"],
  },
  "Sasanian E": {
    regionName: "Sasanian Empire",
    wikipediaSlug: "Sasanian_Empire",
    wikipediaSlugAr: "الإمبراطورية_الساسانية",
    titleEn: "Sasanian Empire",
    titleAr: "الإمبراطورية الساسانية",
    description: "The last pre-Islamic Persian empire (224-651 CE), ruling over much of Western Asia.",
  },
  "Eastern Roman Empire": {
    regionName: "Eastern Roman Empire",
    wikipediaSlug: "Byzantine_Empire",
    wikipediaSlugAr: "الإمبراطورية_البيزنطية",
    titleEn: "Byzantine Empire",
    titleAr: "الإمبراطورية الرومانية الشرقية",
    description: "The continuation of the Roman Empire in its eastern provinces during Late Antiquity and the Middle Ages.",
    alternateNames: ["E. Roman Emp", "Byzantine Empire"],
  },
  "E. Roman Emp": {
    regionName: "Eastern Roman Empire",
    wikipediaSlug: "Byzantine_Empire",
    wikipediaSlugAr: "الإمبراطورية_البيزنطية",
    titleEn: "Byzantine Empire",
    titleAr: "الإمبراطورية الرومانية الشرقية",
    description: "The continuation of the Roman Empire in its eastern provinces during Late Antiquity and the Middle Ages.",
  },
  "Gupta Empire": {
    regionName: "Gupta Empire",
    wikipediaSlug: "Gupta_Empire",
    titleEn: "Gupta Empire",
    titleAr: "إمبراطورية غوبتا",
    description: "An ancient Indian empire existing from the mid-to-late 3rd century CE to 543 CE.",
  },

  // Arab Kingdoms
  "Ghassanids": {
    regionName: "Ghassanids",
    wikipediaSlug: "Ghassanids",
    wikipediaSlugAr: "الغساسنة",
    titleEn: "Ghassanids",
    titleAr: "الغساسنة",
    description: "An Arab Christian kingdom that ruled parts of the Levant as clients of the Byzantine Empire.",
  },
  "Lakhmids": {
    regionName: "Lakhmids",
    wikipediaSlug: "Lakhmids",
    wikipediaSlugAr: "اللخميون",
    titleEn: "Lakhmids",
    titleAr: "اللخميون",
    description: "An Arab kingdom that ruled southern Iraq and parts of Arabia as clients of the Sasanian Empire.",
  },
  "Himyarite Kingdom": {
    regionName: "Himyarite Kingdom",
    wikipediaSlug: "Himyarite_Kingdom",
    wikipediaSlugAr: "مملكة_حمير",
    titleEn: "Himyarite Kingdom",
    titleAr: "مملكة حمير",
    description: "A kingdom in ancient Yemen that ruled much of the Arabian Peninsula from 110 BCE to 525 CE.",
    alternateNames: ["Himyarite K."],
  },
  "Himyarite K.": {
    regionName: "Himyarite Kingdom",
    wikipediaSlug: "Himyarite_Kingdom",
    wikipediaSlugAr: "مملكة_حمير",
    titleEn: "Himyarite Kingdom",
    titleAr: "مملكة حمير",
    description: "A kingdom in ancient Yemen that ruled much of the Arabian Peninsula from 110 BCE to 525 CE.",
  },
  "Kingdom of Kinda": {
    regionName: "Kingdom of Kinda",
    wikipediaSlug: "Kindah",
    wikipediaSlugAr: "كندة",
    titleEn: "Kingdom of Kinda",
    titleAr: "مملكة كندة",
    description: "An Arab tribal kingdom in central Arabia that existed from the 2nd to 6th century CE.",
    alternateNames: ["Kindah"],
  },
  "Kindah": {
    regionName: "Kingdom of Kinda",
    wikipediaSlug: "Kindah",
    wikipediaSlugAr: "كندة",
    titleEn: "Kingdom of Kinda",
    titleAr: "مملكة كندة",
    description: "An Arab tribal kingdom in central Arabia that existed from the 2nd to 6th century CE.",
  },

  // African Kingdoms
  "Axum": {
    regionName: "Axum",
    wikipediaSlug: "Kingdom_of_Aksum",
    wikipediaSlugAr: "مملكة_أكسوم",
    titleEn: "Kingdom of Aksum",
    titleAr: "مملكة أكسوم",
    description: "An ancient kingdom centered in what is now Eritrea and northern Ethiopia, a major trading empire.",
  },
  "Empire of Ghana": {
    regionName: "Empire of Ghana",
    wikipediaSlug: "Ghana_Empire",
    titleEn: "Ghana Empire",
    titleAr: "إمبراطورية غانا",
    description: "A West African empire located in the area of present-day southeastern Mauritania and western Mali.",
  },
  "Blemmyes": {
    regionName: "Blemmyes",
    wikipediaSlug: "Blemmyes",
    wikipediaSlugAr: "البليميون",
    titleEn: "Blemmyes",
    titleAr: "البليميون",
    description: "A nomadic Nubian tribal kingdom that lived in the Nubian Desert region.",
  },
  "Makkura": {
    regionName: "Makkura",
    wikipediaSlug: "Makuria",
    titleEn: "Makuria",
    titleAr: "مقرة",
    description: "A Nubian kingdom located in what is today Northern Sudan and Southern Egypt.",
  },
  "Nobatia": {
    regionName: "Nobatia",
    wikipediaSlug: "Nobatia",
    titleEn: "Nobatia",
    titleAr: "نوباتيا",
    description: "A Nubian kingdom in Lower Nubia that existed from the 4th to 7th century CE.",
  },

  // European Kingdoms
  "Visigoths": {
    regionName: "Visigoths",
    wikipediaSlug: "Visigoths",
    titleEn: "Visigoths",
    titleAr: "القوط الغربيون",
    description: "A Germanic people who formed one of the most important kingdoms after the fall of Rome.",
  },
  "Vandals": {
    regionName: "Vandals",
    wikipediaSlug: "Vandals",
    titleEn: "Vandals",
    titleAr: "الوندال",
    description: "A Germanic people who established a kingdom in North Africa.",
  },
  "Ostrogoths": {
    regionName: "Ostrogoths",
    wikipediaSlug: "Ostrogoths",
    titleEn: "Ostrogoths",
    titleAr: "القوط الشرقيون",
    description: "A Germanic people who established a kingdom in Italy after the fall of Rome.",
  },
  "Franks": {
    regionName: "Franks",
    wikipediaSlug: "Franks",
    titleEn: "Franks",
    titleAr: "الفرنجة",
    description: "A Germanic people who conquered Gaul and established the foundations of medieval France.",
  },

  // Indian Kingdoms
  "Vakataka": {
    regionName: "Vakataka",
    wikipediaSlug: "Vakataka_dynasty",
    titleEn: "Vakataka Dynasty",
    titleAr: "سلالة فاكاتاكا",
    description: "A royal Indian dynasty originating from the Deccan in the mid-3rd century CE.",
  },
  "Pallavas": {
    regionName: "Pallavas",
    wikipediaSlug: "Pallava_dynasty",
    titleEn: "Pallava Dynasty",
    titleAr: "سلالة بالافا",
    description: "An Indian dynasty that existed from 275 CE to 897 CE, ruling a portion of southern India.",
  },
  "Cholas": {
    regionName: "Cholas",
    wikipediaSlug: "Chola_dynasty",
    titleEn: "Chola Dynasty",
    titleAr: "سلالة تشولا",
    description: "A Tamil dynasty that ruled southern India from the 3rd century BCE to the 13th century CE.",
  },

  // Asian Kingdoms
  "Kushan Principalities": {
    regionName: "Kushan Principalities",
    wikipediaSlug: "Kushan_Empire",
    titleEn: "Kushan Empire",
    titleAr: "إمارات كوشان",
    description: "A syncretic empire that at its height stretched from Central Asia to northern India.",
    alternateNames: ["Kushan Prin."],
  },
  "Kushan Prin.": {
    regionName: "Kushan Principalities",
    wikipediaSlug: "Kushan_Empire",
    titleEn: "Kushan Empire",
    titleAr: "إمارات كوشان",
    description: "A syncretic empire that at its height stretched from Central Asia to northern India.",
  },
};

/**
 * Get Wikipedia region info by region name
 * Handles alternate names and abbreviations
 */
export function getWikipediaRegionInfo(regionName: string): WikipediaRegionInfo | null {
  // Direct lookup
  if (wikipediaRegions[regionName]) {
    return wikipediaRegions[regionName];
  }

  // Search through alternate names
  for (const info of Object.values(wikipediaRegions)) {
    if (info.alternateNames?.includes(regionName)) {
      return info;
    }
  }

  return null;
}

/**
 * Get Wikipedia URL for a given slug
 */
export function getWikipediaUrl(slug: string, lang: "en" | "ar" = "en"): string {
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`;
}
