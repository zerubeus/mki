export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type EventEra = "Pre-Prophethood" | "Meccan" | "Medinan";

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
