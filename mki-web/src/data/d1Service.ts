/**
 * D1 Database Service
 *
 * Provides data access functions for hadith, narrator, and seerah data
 * stored in Cloudflare D1. Replaces CSV-based service for better performance.
 */

import type {
  ExtendedNarrator,
  CsvHadith,
  HistoricalEvent,
  NarratorStatus,
  NarratorGeneration,
  EventEra,
  EventType,
} from "../types";

// ============ Type Definitions for D1 Rows ============

interface D1NarratorRow {
  scholar_indx: number;
  name_en: string;
  name_ar: string;
  grade: string | null;
  status: string | null;
  generation: string | null;
  birth_year_hijri: number | null;
  birth_year_gregorian: number | null;
  death_year_hijri: number | null;
  death_year_gregorian: number | null;
  birth_place: string | null;
  death_place: string | null;
  death_reason: string | null;
  teachers: string | null;
  students: string | null;
  parents: string | null;
  spouse: string | null;
  siblings: string | null;
  children: string | null;
  places_of_stay: string | null;
  area_of_interest: string | null;
  tags: string | null;
  books: string | null;
}

interface D1HadithRow {
  id: number;
  hadith_id: number;
  source: string;
  chapter_no: number | null;
  hadith_no: number | null;
  chapter: string | null;
  text_ar: string | null;
  text_en: string | null;
}

interface D1ChainRow {
  hadith_id: number;
  chain_position: number;
  narrator_id: number;
}

interface D1RelationshipRow {
  narrator_id: number;
  related_id: number;
  relationship_type: string;
}

interface D1SeerahRow {
  id: number;
  event_id: string;
  locale: string;
  year_hijri: number | null;
  year_gregorian: number | null;
  title: string;
  description: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  era: string | null;
  event_type: string | null;
}

// ============ Transform Functions ============

function rowToNarrator(row: D1NarratorRow, teacherIndices: number[] = [], studentIndices: number[] = []): ExtendedNarrator {
  return {
    scholarIndx: row.scholar_indx,
    id: `rawi_${row.scholar_indx}`,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    status: (row.status as NarratorStatus) || "unknown",
    generation: (row.generation as NarratorGeneration) || "later",
    grade: row.grade || "",
    birthYear: row.birth_year_hijri ?? undefined,
    birthYearGregorian: row.birth_year_gregorian ?? undefined,
    deathYear: row.death_year_hijri ?? undefined,
    deathYearGregorian: row.death_year_gregorian ?? undefined,
    birthPlace: row.birth_place ?? undefined,
    deathPlace: row.death_place ?? undefined,
    deathReason: row.death_reason ?? undefined,
    teacherIndices,
    studentIndices,
    teachers: row.teachers ?? undefined,
    students: row.students ?? undefined,
    parents: row.parents ?? undefined,
    spouse: row.spouse ?? undefined,
    siblings: row.siblings ?? undefined,
    children: row.children ?? undefined,
    placesOfStay: row.places_of_stay ?? undefined,
    areaOfInterest: row.area_of_interest ?? undefined,
    tags: row.tags ?? undefined,
    books: row.books ?? undefined,
  };
}

function rowToHadith(row: D1HadithRow, chainIndices: number[] = []): CsvHadith {
  return {
    id: `hadith_${row.id}`,
    hadithId: row.hadith_id,
    source: row.source,
    chapterNo: row.chapter_no ?? 0,
    hadithNo: row.hadith_no ?? 0,
    chapter: row.chapter ?? "",
    chainIndices,
    textAr: row.text_ar ?? "",
    textEn: row.text_en ?? "",
  };
}

function rowToSeerahEvent(row: D1SeerahRow): HistoricalEvent {
  const yearLabel = row.year_hijri
    ? `${row.year_gregorian || ""} - ${row.year_hijri} هـ`
    : String(row.year_gregorian || "");

  return {
    id: parseInt(row.event_id, 10) || row.id,
    year: yearLabel.trim(),
    title: row.title,
    description: row.description || "",
    locationName: row.location_name || "",
    coordinates: {
      lat: row.latitude ?? 21.4225,
      lng: row.longitude ?? 39.8262,
    },
    era: (row.era as EventEra) || "Meccan",
    eventType: (row.event_type as EventType) || "Personal",
  };
}

// ============ Narrator Functions ============

/**
 * Get a narrator by their scholar index
 */
export async function getNarrator(
  db: D1Database,
  scholarIndx: number
): Promise<ExtendedNarrator | null> {
  const result = await db
    .prepare("SELECT * FROM narrators WHERE scholar_indx = ?")
    .bind(scholarIndx)
    .first<D1NarratorRow>();

  if (!result) return null;

  // Get relationships
  const relationships = await db
    .prepare("SELECT related_id, relationship_type FROM narrator_relationships WHERE narrator_id = ?")
    .bind(scholarIndx)
    .all<D1RelationshipRow>();

  const teacherIndices = relationships.results
    .filter((r) => r.relationship_type === "teacher")
    .map((r) => r.related_id);

  const studentIndices = relationships.results
    .filter((r) => r.relationship_type === "student")
    .map((r) => r.related_id);

  return rowToNarrator(result, teacherIndices, studentIndices);
}

/**
 * Get multiple narrators by their scholar indices
 */
export async function getNarratorsByIndices(
  db: D1Database,
  indices: number[]
): Promise<ExtendedNarrator[]> {
  if (indices.length === 0) return [];

  const placeholders = indices.map(() => "?").join(",");
  const result = await db
    .prepare(`SELECT * FROM narrators WHERE scholar_indx IN (${placeholders})`)
    .bind(...indices)
    .all<D1NarratorRow>();

  return result.results.map((row) => rowToNarrator(row));
}

/**
 * Search narrators by name
 */
export async function searchNarrators(
  db: D1Database,
  query: string,
  limit = 50
): Promise<ExtendedNarrator[]> {
  const searchTerm = `%${query}%`;

  const result = await db
    .prepare(`
      SELECT * FROM narrators
      WHERE name_en LIKE ? OR name_ar LIKE ? OR grade LIKE ?
      LIMIT ?
    `)
    .bind(searchTerm, searchTerm, searchTerm, limit)
    .all<D1NarratorRow>();

  return result.results.map((row) => rowToNarrator(row));
}

/**
 * Get narrator's teachers
 */
export async function getNarratorTeachers(
  db: D1Database,
  narratorId: number
): Promise<ExtendedNarrator[]> {
  const result = await db
    .prepare(`
      SELECT n.* FROM narrators n
      JOIN narrator_relationships r ON n.scholar_indx = r.related_id
      WHERE r.narrator_id = ? AND r.relationship_type = 'teacher'
    `)
    .bind(narratorId)
    .all<D1NarratorRow>();

  return result.results.map((row) => rowToNarrator(row));
}

/**
 * Get narrator's students
 */
export async function getNarratorStudents(
  db: D1Database,
  narratorId: number
): Promise<ExtendedNarrator[]> {
  const result = await db
    .prepare(`
      SELECT n.* FROM narrators n
      JOIN narrator_relationships r ON n.scholar_indx = r.related_id
      WHERE r.narrator_id = ? AND r.relationship_type = 'student'
    `)
    .bind(narratorId)
    .all<D1NarratorRow>();

  return result.results.map((row) => rowToNarrator(row));
}

// ============ Hadith Functions ============

/**
 * Get a hadith by source and hadith number
 */
export async function getHadith(
  db: D1Database,
  source: string,
  hadithNo: number
): Promise<{ hadith: CsvHadith; chain: ExtendedNarrator[] } | null> {
  const hadithResult = await db
    .prepare("SELECT * FROM hadiths WHERE source = ? AND hadith_no = ? LIMIT 1")
    .bind(source, hadithNo)
    .first<D1HadithRow>();

  if (!hadithResult) return null;

  // Get chain
  const chainResult = await db
    .prepare(`
      SELECT narrator_id FROM hadith_chains
      WHERE hadith_id = ?
      ORDER BY chain_position ASC
    `)
    .bind(hadithResult.hadith_id)
    .all<{ narrator_id: number }>();

  const chainIndices = chainResult.results.map((r) => r.narrator_id);

  // Get narrators in chain
  const chain = await getNarratorsByIndices(db, chainIndices);

  // Sort chain by original order
  const sortedChain = chainIndices
    .map((idx) => chain.find((n) => n.scholarIndx === idx))
    .filter((n): n is ExtendedNarrator => n !== undefined);

  return {
    hadith: rowToHadith(hadithResult, chainIndices),
    chain: sortedChain,
  };
}

/**
 * Get a hadith by its ID
 */
export async function getHadithById(
  db: D1Database,
  hadithId: number
): Promise<{ hadith: CsvHadith; chain: ExtendedNarrator[] } | null> {
  const hadithResult = await db
    .prepare("SELECT * FROM hadiths WHERE hadith_id = ? LIMIT 1")
    .bind(hadithId)
    .first<D1HadithRow>();

  if (!hadithResult) return null;

  // Get chain
  const chainResult = await db
    .prepare(`
      SELECT narrator_id FROM hadith_chains
      WHERE hadith_id = ?
      ORDER BY chain_position ASC
    `)
    .bind(hadithResult.hadith_id)
    .all<{ narrator_id: number }>();

  const chainIndices = chainResult.results.map((r) => r.narrator_id);
  const chain = await getNarratorsByIndices(db, chainIndices);

  const sortedChain = chainIndices
    .map((idx) => chain.find((n) => n.scholarIndx === idx))
    .filter((n): n is ExtendedNarrator => n !== undefined);

  return {
    hadith: rowToHadith(hadithResult, chainIndices),
    chain: sortedChain,
  };
}

/**
 * Get hadiths with pagination
 */
export async function getHadithsPaginated(
  db: D1Database,
  options: {
    source?: string;
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<{ hadiths: CsvHadith[]; total: number; pages: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const offset = (page - 1) * limit;

  let countQuery = "SELECT COUNT(*) as count FROM hadiths";
  let dataQuery = "SELECT * FROM hadiths";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.source) {
    conditions.push("source = ?");
    params.push(options.source);
  }

  if (options.search) {
    conditions.push("(text_ar LIKE ? OR text_en LIKE ? OR chapter LIKE ?)");
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (conditions.length > 0) {
    const whereClause = " WHERE " + conditions.join(" AND ");
    countQuery += whereClause;
    dataQuery += whereClause;
  }

  dataQuery += " ORDER BY hadith_id LIMIT ? OFFSET ?";

  // Get total count
  const countResult = await db
    .prepare(countQuery)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count ?? 0;

  // Get data
  const dataResult = await db
    .prepare(dataQuery)
    .bind(...params, limit, offset)
    .all<D1HadithRow>();

  // Get chains for all hadiths
  const hadithIds = dataResult.results.map((h) => h.hadith_id);
  let chainsMap: Map<number, number[]> = new Map();

  if (hadithIds.length > 0) {
    const placeholders = hadithIds.map(() => "?").join(",");
    const chainsResult = await db
      .prepare(`
        SELECT hadith_id, narrator_id FROM hadith_chains
        WHERE hadith_id IN (${placeholders})
        ORDER BY hadith_id, chain_position
      `)
      .bind(...hadithIds)
      .all<D1ChainRow>();

    for (const chain of chainsResult.results) {
      const existing = chainsMap.get(chain.hadith_id) || [];
      existing.push(chain.narrator_id);
      chainsMap.set(chain.hadith_id, existing);
    }
  }

  const hadiths = dataResult.results.map((row) =>
    rowToHadith(row, chainsMap.get(row.hadith_id) || [])
  );

  return {
    hadiths,
    total,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Search hadiths
 */
export async function searchHadiths(
  db: D1Database,
  query: string,
  limit = 50
): Promise<CsvHadith[]> {
  const searchTerm = `%${query}%`;

  const result = await db
    .prepare(`
      SELECT * FROM hadiths
      WHERE text_ar LIKE ? OR text_en LIKE ? OR chapter LIKE ? OR source LIKE ?
      LIMIT ?
    `)
    .bind(searchTerm, searchTerm, searchTerm, searchTerm, limit)
    .all<D1HadithRow>();

  return result.results.map((row) => rowToHadith(row));
}

/**
 * Get available hadith sources with counts
 */
export async function getHadithSources(
  db: D1Database
): Promise<{ source: string; count: number }[]> {
  const result = await db
    .prepare(`
      SELECT source, COUNT(*) as count FROM hadiths
      GROUP BY source
      ORDER BY count DESC
    `)
    .all<{ source: string; count: number }>();

  return result.results;
}

// ============ Seerah Functions ============

/**
 * Get seerah events for a specific locale
 */
export async function getSeerahEvents(
  db: D1Database,
  locale: "ar" | "en" | "fr" = "ar"
): Promise<HistoricalEvent[]> {
  const result = await db
    .prepare(`
      SELECT * FROM seerah_events
      WHERE locale = ?
      ORDER BY year_gregorian ASC, id ASC
    `)
    .bind(locale)
    .all<D1SeerahRow>();

  return result.results.map(rowToSeerahEvent);
}

/**
 * Get seerah events filtered by era
 */
export async function getSeerahEventsByEra(
  db: D1Database,
  locale: "ar" | "en" | "fr",
  era: EventEra
): Promise<HistoricalEvent[]> {
  const result = await db
    .prepare(`
      SELECT * FROM seerah_events
      WHERE locale = ? AND era = ?
      ORDER BY year_gregorian ASC, id ASC
    `)
    .bind(locale, era)
    .all<D1SeerahRow>();

  return result.results.map(rowToSeerahEvent);
}

/**
 * Get a single seerah event by ID
 */
export async function getSeerahEvent(
  db: D1Database,
  eventId: string,
  locale: "ar" | "en" | "fr" = "ar"
): Promise<HistoricalEvent | null> {
  const result = await db
    .prepare("SELECT * FROM seerah_events WHERE event_id = ? AND locale = ?")
    .bind(eventId, locale)
    .first<D1SeerahRow>();

  if (!result) return null;
  return rowToSeerahEvent(result);
}

// ============ Utility Functions ============

/**
 * Resolve chain indices to narrators (for compatibility with existing code)
 */
export async function resolveChain(
  db: D1Database,
  indices: number[]
): Promise<ExtendedNarrator[]> {
  const narrators = await getNarratorsByIndices(db, indices);

  // Return in original order
  return indices
    .map((idx) => narrators.find((n) => n.scholarIndx === idx))
    .filter((n): n is ExtendedNarrator => n !== undefined);
}
