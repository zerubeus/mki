export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type EventEra = "Pre-Prophethood" | "Meccan" | "Medinan";

export type EventType = "Birth" | "Marriage" | "Religious" | "Battle" | "Treaty" | "Death" | "Migration" | "Personal";

// Declare L on window if using CDN version of Leaflet and not importing via npm module directly
// For Astro with npm installed leaflet, direct import is fine, but this handles script tag loading.
declare global {
  interface Window {
    L: any; // Leaflet's global object
  }
}

export interface HistoricalEvent {
  id: number;
  year: string;
  title: string;
  description: string;
  locationName: string;
  coordinates: GeoCoordinates;
  era: EventEra;
  eventType: EventType;
}

// Hadith Types
export type NarratorStatus =
  | "prophet"      // النبي ﷺ
  | "companion"    // صحابي
  | "trustworthy"  // ثقة
  | "truthful"     // صدوق
  | "unknown"      // مجهول
  | "weak"         // ضعيف
  | "collector";   // المخرج

export type HadithGrade =
  | "sahih"        // صحيح
  | "hasan"        // حسن
  | "daif"         // ضعيف
  | "mawdu";       // موضوع

export type NarratorGeneration =
  | "prophet"      // النبي
  | "sahaba"       // الصحابة
  | "tabieen"      // التابعون
  | "atba_tabieen" // أتباع التابعين
  | "later";       // المتأخرون

export interface Narrator {
  id: string;
  nameAr: string;
  nameEn: string;
  status: NarratorStatus;
  generation: NarratorGeneration;
  birthYear?: number;  // Hijri year
  deathYear?: number;  // Hijri year
  biographyAr?: string;
  biographyEn?: string;
  grade?: string;      // Scholar's grading of this narrator
}

export interface IsnadChain {
  id: string;
  grade: HadithGrade;
  narrators: string[];  // Array of narrator IDs in order (from collector to prophet)
  source: string;       // The hadith collection (e.g., "Bukhari", "Muslim")
  sourceAr: string;
  referenceNumber?: string;
}

export interface Hadith {
  id: string;
  textAr: string;
  textEn: string;
  chains: IsnadChain[];
  topic?: string;
  topicAr?: string;
  analysisAr?: string;
  analysisEn?: string;
}

// ============ CSV-based Types ============

/**
 * Extended Narrator type from CSV dataset (all_rawis.csv)
 * Contains rich biographical and relationship data
 */
export interface ExtendedNarrator {
  // Core identification
  scholarIndx: number;
  id: string; // Generated from scholarIndx for compatibility (e.g., "rawi_1")
  nameAr: string;
  nameEn: string;

  // Classification (mapped from CSV grade)
  status: NarratorStatus;
  generation: NarratorGeneration;
  grade: string; // Original grade from CSV (e.g., "Comp.(RA) [1st Generation]")

  // Dates
  birthYear?: number; // Hijri
  birthYearGregorian?: number;
  deathYear?: number; // Hijri
  deathYearGregorian?: number;
  birthPlace?: string;
  deathPlace?: string;
  deathReason?: string;

  // Relationships - Indices for linking
  teacherIndices: number[];
  studentIndices: number[];

  // Relationships - Display names
  teachers?: string;
  students?: string;

  // Family information
  parents?: string;
  spouse?: string;
  siblings?: string;
  children?: string;

  // Additional biographical info
  placesOfStay?: string;
  areaOfInterest?: string;
  tags?: string;
  books?: string;
}

/**
 * Raw CSV row from all_rawis.csv
 */
export interface CsvRawiRow {
  scholar_indx: number;
  name: string;
  grade: string;
  parents?: string;
  spouse?: string;
  siblings?: string;
  children?: string;
  birth_date_place?: string;
  places_of_stay?: string;
  death_date_place?: string;
  teachers?: string;
  students?: string;
  area_of_interest?: string;
  tags?: string;
  books?: string;
  students_inds?: string;
  teachers_inds?: string;
  birth_place?: string;
  birth_date?: string;
  birth_date_hijri?: number;
  birth_date_gregorian?: number;
  death_date_hijri?: number;
  death_date_gregorian?: number;
  death_place?: string;
  death_reason?: string;
}

/**
 * Raw CSV row from all_hadiths_clean.csv
 */
export interface CsvHadithRow {
  id: number;
  hadith_id: number;
  source: string;
  chapter_no: number;
  hadith_no: number;
  chapter: string;
  chain_indx: string;
  text_ar: string;
  text_en: string;
}

/**
 * Processed Hadith from CSV dataset
 */
export interface CsvHadith {
  id: string; // Generated from row id (e.g., "hadith_1")
  hadithId: number;
  source: string; // e.g., "Sahih Bukhari"
  chapterNo: number;
  hadithNo: number;
  chapter: string; // e.g., "Revelation - كتاب بدء الوحى"
  chainIndices: number[]; // Parsed from chain_indx, references scholarIndx in all_rawis.csv
  textAr: string;
  textEn: string;
}

// ============ Wikipedia Types ============

// Re-export from data and utils modules
export type { WikipediaRegionInfo } from "../data/wikipediaRegions";
export type { WikipediaSummary } from "../utils/wikipediaApi";
