/**
 * CSV-based Hadith Data Service
 *
 * Fetches and parses hadith and narrator data from CSV files at runtime.
 * Data is hosted on Cloudflare R2 for efficient delivery.
 * Provides caching and helper functions for data access.
 */

import { fetchAndParseCSV, parseIndices, parseName } from '../../utils/csvParser';

// R2 bucket base URL for hadith data
const R2_BASE_URL = 'https://r2.mustknowislam.com';
import { mapGradeToStatus, mapGradeToGeneration } from '../../utils/gradeMapper';
import type { CsvRawiRow, CsvHadithRow, ExtendedNarrator, CsvHadith } from '../../types';

// ============ Caches ============
let narratorsCache: Map<number, ExtendedNarrator> | null = null;
let hadithsCache: CsvHadith[] | null = null;

// ============ Helper Functions ============
/**
 * Normalize source name for consistent comparison
 */
function normalizeSource(source: string): string {
  return source.trim().toLowerCase();
}

// ============ Transform Functions ============

/**
 * Transform raw CSV row to ExtendedNarrator
 */
function transformRawi(row: CsvRawiRow): ExtendedNarrator {
  const { nameEn, nameAr } = parseName(row.name);
  const generation = mapGradeToGeneration(row.grade);

  return {
    scholarIndx: row.scholar_indx,
    id: `rawi_${row.scholar_indx}`,
    nameEn,
    nameAr,
    status: mapGradeToStatus(row.grade),
    generation,
    grade: row.grade || '',
    birthYear: row.birth_date_hijri || undefined,
    birthYearGregorian: row.birth_date_gregorian || undefined,
    deathYear: row.death_date_hijri || undefined,
    deathYearGregorian: row.death_date_gregorian || undefined,
    birthPlace: row.birth_place || undefined,
    deathPlace: row.death_place || undefined,
    deathReason: row.death_reason || undefined,
    teacherIndices: parseIndices(row.teachers_inds),
    studentIndices: parseIndices(row.students_inds),
    teachers: row.teachers || undefined,
    students: row.students || undefined,
    parents: row.parents || undefined,
    spouse: row.spouse || undefined,
    siblings: row.siblings || undefined,
    children: row.children || undefined,
    placesOfStay: row.places_of_stay || undefined,
    areaOfInterest: row.area_of_interest || undefined,
    tags: row.tags || undefined,
    books: row.books || undefined,
  };
}

/**
 * Transform raw CSV row to CsvHadith
 */
function transformHadith(row: CsvHadithRow): CsvHadith {
  return {
    id: `hadith_${row.id}`,
    hadithId: row.hadith_id,
    source: row.source?.trim() || '',
    chapterNo: row.chapter_no,
    hadithNo: row.hadith_no,
    chapter: row.chapter || '',
    chainIndices: parseIndices(row.chain_indx),
    textAr: row.text_ar || '',
    textEn: row.text_en || '',
  };
}

// ============ Data Loading Functions ============

/**
 * Load all narrators from CSV
 * Returns a Map for efficient lookups by scholarIndx
 */
export async function loadNarrators(): Promise<Map<number, ExtendedNarrator>> {
  if (narratorsCache) return narratorsCache;

  const result = await fetchAndParseCSV<CsvRawiRow>(`${R2_BASE_URL}/data/hadith-csv/all_rawis.csv`);

  narratorsCache = new Map();
  for (const row of result.data) {
    if (row.scholar_indx) {
      narratorsCache.set(row.scholar_indx, transformRawi(row));
    }
  }

  return narratorsCache;
}

/**
 * Load all hadiths from CSV
 */
export async function loadHadiths(): Promise<CsvHadith[]> {
  if (hadithsCache) return hadithsCache;

  const result = await fetchAndParseCSV<CsvHadithRow>(`${R2_BASE_URL}/data/hadith-csv/all_hadiths_clean.csv`);
  hadithsCache = result.data.map(transformHadith);

  return hadithsCache;
}

// ============ Narrator Access Functions ============

/**
 * Get a narrator by their scholar index
 */
export async function getNarratorByIndex(index: number): Promise<ExtendedNarrator | undefined> {
  const narrators = await loadNarrators();
  return narrators.get(index);
}

/**
 * Get all narrators as an array
 */
export async function getAllNarrators(): Promise<ExtendedNarrator[]> {
  const narrators = await loadNarrators();
  return Array.from(narrators.values());
}

/**
 * Search narrators by name
 */
export async function searchNarrators(query: string, limit = 50): Promise<ExtendedNarrator[]> {
  const narrators = await loadNarrators();
  const lowerQuery = query.toLowerCase();

  return Array.from(narrators.values())
    .filter(
      (n) =>
        n.nameAr.includes(query) ||
        n.nameEn.toLowerCase().includes(lowerQuery) ||
        n.grade.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}

// ============ Chain Resolution Functions ============

/**
 * Resolve chain indices to an array of narrators
 */
export async function resolveChain(indices: number[]): Promise<ExtendedNarrator[]> {
  const narrators = await loadNarrators();
  return indices.map((idx) => narrators.get(idx)).filter((n): n is ExtendedNarrator => n !== undefined);
}

/**
 * Get a narrator's teachers (resolved from indices)
 */
export async function getNarratorTeachers(narrator: ExtendedNarrator): Promise<ExtendedNarrator[]> {
  const narrators = await loadNarrators();
  return narrator.teacherIndices.map((idx) => narrators.get(idx)).filter((n): n is ExtendedNarrator => n !== undefined);
}

/**
 * Get a narrator's students (resolved from indices)
 */
export async function getNarratorStudents(narrator: ExtendedNarrator): Promise<ExtendedNarrator[]> {
  const narrators = await loadNarrators();
  return narrator.studentIndices.map((idx) => narrators.get(idx)).filter((n): n is ExtendedNarrator => n !== undefined);
}

// ============ Hadith Access Functions ============

/**
 * Get a hadith by its ID
 */
export async function getHadithById(id: string): Promise<CsvHadith | undefined> {
  const hadiths = await loadHadiths();
  return hadiths.find((h) => h.id === id);
}

/**
 * Search hadiths by text, chapter, or source
 */
export async function searchHadiths(query: string, limit = 50): Promise<CsvHadith[]> {
  const hadiths = await loadHadiths();
  const lowerQuery = query.toLowerCase();

  return hadiths
    .filter(
      (h) =>
        h.textAr.includes(query) ||
        h.textEn.toLowerCase().includes(lowerQuery) ||
        h.chapter.toLowerCase().includes(lowerQuery) ||
        h.source.toLowerCase().includes(lowerQuery)
    )
    .slice(0, limit);
}

/**
 * Get hadiths by source (e.g., "Sahih Bukhari")
 */
export async function getHadithsBySource(source: string): Promise<CsvHadith[]> {
  const hadiths = await loadHadiths();
  const normalizedSource = source.toLowerCase().trim();
  return hadiths.filter((h) => h.source.toLowerCase().includes(normalizedSource));
}

/**
 * Get paginated hadiths with optional source filter
 */
export async function getHadithsPaginated(
  page = 1,
  perPage = 20,
  source?: string
): Promise<{ hadiths: CsvHadith[]; total: number; pages: number }> {
  let hadiths = await loadHadiths();

  if (source) {
    const normalizedFilter = normalizeSource(source);
    hadiths = hadiths.filter((h) => normalizeSource(h.source) === normalizedFilter);
  }

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    hadiths: hadiths.slice(start, end),
    total: hadiths.length,
    pages: Math.ceil(hadiths.length / perPage),
  };
}

/**
 * Get available hadith sources with counts
 */
export async function getHadithSources(): Promise<{ source: string; count: number }[]> {
  const hadiths = await loadHadiths();
  const sourceCounts = new Map<string, number>();

  for (const hadith of hadiths) {
    const source = hadith.source.trim();
    sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  }

  return Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

// ============ Cache Management ============

/**
 * Clear all caches (useful for memory management or data refresh)
 */
export function clearCache(): void {
  narratorsCache = null;
  hadithsCache = null;
}

/**
 * Preload all data into cache
 */
export async function preloadData(): Promise<void> {
  await Promise.all([loadNarrators(), loadHadiths()]);
}
