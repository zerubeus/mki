/**
 * D1-based Hadith Data Service
 *
 * Queries hadith and narrator data from Cloudflare D1.
 * Replaces the old CSV service with efficient SQL queries.
 */

import { mapGradeToStatus, mapGradeToGeneration } from '../../utils/gradeMapper';
import type { ExtendedNarrator, CsvHadith } from '../../types';

// ============ Types ============

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

// ============ Transform Functions ============

function transformNarrator(row: D1NarratorRow): ExtendedNarrator {
  return {
    scholarIndx: row.scholar_indx,
    id: `rawi_${row.scholar_indx}`,
    nameEn: row.name_en || '',
    nameAr: row.name_ar || '',
    status: row.status || mapGradeToStatus(row.grade || ''),
    generation: row.generation || mapGradeToGeneration(row.grade || ''),
    grade: row.grade || '',
    birthYear: row.birth_year_hijri || undefined,
    birthYearGregorian: row.birth_year_gregorian || undefined,
    deathYear: row.death_year_hijri || undefined,
    deathYearGregorian: row.death_year_gregorian || undefined,
    birthPlace: row.birth_place || undefined,
    deathPlace: row.death_place || undefined,
    deathReason: row.death_reason || undefined,
    teacherIndices: [],
    studentIndices: [],
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

function transformHadith(row: D1HadithRow, chainIndices: number[] = []): CsvHadith {
  return {
    id: `hadith_${row.id}`,
    hadithId: row.hadith_id,
    source: row.source || '',
    chapterNo: row.chapter_no || 0,
    hadithNo: row.hadith_no || 0,
    chapter: row.chapter || '',
    chainIndices,
    textAr: row.text_ar || '',
    textEn: row.text_en || '',
  };
}

// ============ Narrator Functions ============

/**
 * Get a narrator by their scholar index
 */
export async function getNarratorByIndex(
  db: D1Database,
  index: number
): Promise<ExtendedNarrator | undefined> {
  const row = await db
    .prepare('SELECT * FROM narrators WHERE scholar_indx = ?')
    .bind(index)
    .first<D1NarratorRow>();

  if (!row) return undefined;

  // Get teacher/student indices from relationships
  const relationships = await db
    .prepare('SELECT related_id, relationship_type FROM narrator_relationships WHERE narrator_id = ?')
    .bind(index)
    .all<{ related_id: number; relationship_type: string }>();

  const narrator = transformNarrator(row);
  narrator.teacherIndices = relationships.results
    .filter((r) => r.relationship_type === 'teacher')
    .map((r) => r.related_id);
  narrator.studentIndices = relationships.results
    .filter((r) => r.relationship_type === 'student')
    .map((r) => r.related_id);

  return narrator;
}

/**
 * Get all narrators (with pagination for efficiency)
 */
export async function getAllNarrators(
  db: D1Database,
  limit = 1000,
  offset = 0
): Promise<ExtendedNarrator[]> {
  const { results } = await db
    .prepare('SELECT * FROM narrators LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all<D1NarratorRow>();

  return results.map(transformNarrator);
}

/**
 * Search narrators by name
 */
export async function searchNarrators(
  db: D1Database,
  query: string,
  limit = 50
): Promise<ExtendedNarrator[]> {
  const searchPattern = `%${query}%`;
  const { results } = await db
    .prepare(
      'SELECT * FROM narrators WHERE name_ar LIKE ? OR name_en LIKE ? OR grade LIKE ? LIMIT ?'
    )
    .bind(searchPattern, searchPattern, searchPattern, limit)
    .all<D1NarratorRow>();

  return results.map(transformNarrator);
}

/**
 * Get narrator's teachers
 */
export async function getNarratorTeachers(
  db: D1Database,
  narratorIndex: number
): Promise<ExtendedNarrator[]> {
  const { results } = await db
    .prepare(`
      SELECT n.* FROM narrators n
      JOIN narrator_relationships r ON n.scholar_indx = r.related_id
      WHERE r.narrator_id = ? AND r.relationship_type = 'teacher'
    `)
    .bind(narratorIndex)
    .all<D1NarratorRow>();

  return results.map(transformNarrator);
}

/**
 * Get narrator's students
 */
export async function getNarratorStudents(
  db: D1Database,
  narratorIndex: number
): Promise<ExtendedNarrator[]> {
  const { results } = await db
    .prepare(`
      SELECT n.* FROM narrators n
      JOIN narrator_relationships r ON n.scholar_indx = r.related_id
      WHERE r.narrator_id = ? AND r.relationship_type = 'student'
    `)
    .bind(narratorIndex)
    .all<D1NarratorRow>();

  return results.map(transformNarrator);
}

// ============ Hadith Functions ============

/**
 * Get a hadith by its ID (the string id like "hadith_123")
 */
export async function getHadithById(
  db: D1Database,
  id: string
): Promise<CsvHadith | undefined> {
  // Extract numeric ID from "hadith_123" format
  const numericId = parseInt(id.replace('hadith_', ''), 10);
  if (isNaN(numericId)) return undefined;

  const row = await db
    .prepare('SELECT * FROM hadiths WHERE id = ?')
    .bind(numericId)
    .first<D1HadithRow>();

  if (!row) return undefined;

  // Get chain indices
  const { results: chainResults } = await db
    .prepare('SELECT narrator_id FROM hadith_chains WHERE hadith_id = ? ORDER BY chain_position')
    .bind(row.hadith_id)
    .all<{ narrator_id: number }>();

  const chainIndices = chainResults.map((r) => r.narrator_id);
  return transformHadith(row, chainIndices);
}

/**
 * Get a hadith by hadith_id (the numeric unique identifier)
 */
export async function getHadithByHadithId(
  db: D1Database,
  hadithId: number
): Promise<CsvHadith | undefined> {
  const row = await db
    .prepare('SELECT * FROM hadiths WHERE hadith_id = ?')
    .bind(hadithId)
    .first<D1HadithRow>();

  if (!row) return undefined;

  // Get chain indices
  const { results: chainResults } = await db
    .prepare('SELECT narrator_id FROM hadith_chains WHERE hadith_id = ? ORDER BY chain_position')
    .bind(hadithId)
    .all<{ narrator_id: number }>();

  const chainIndices = chainResults.map((r) => r.narrator_id);
  return transformHadith(row, chainIndices);
}

/**
 * Get a hadith by source and hadith number
 */
export async function getHadithBySourceAndNumber(
  db: D1Database,
  source: string,
  hadithNo: number
): Promise<CsvHadith | undefined> {
  const searchPattern = `%${source.trim()}%`;
  const row = await db
    .prepare('SELECT * FROM hadiths WHERE source LIKE ? AND hadith_no = ?')
    .bind(searchPattern, hadithNo)
    .first<D1HadithRow>();

  if (!row) return undefined;

  // Get chain indices
  const { results: chainResults } = await db
    .prepare('SELECT narrator_id FROM hadith_chains WHERE hadith_id = ? ORDER BY chain_position')
    .bind(row.hadith_id)
    .all<{ narrator_id: number }>();

  const chainIndices = chainResults.map((r) => r.narrator_id);
  return transformHadith(row, chainIndices);
}

/**
 * Search hadiths by text
 */
export async function searchHadiths(
  db: D1Database,
  query: string,
  limit = 50
): Promise<CsvHadith[]> {
  const searchPattern = `%${query}%`;
  const { results } = await db
    .prepare(
      'SELECT * FROM hadiths WHERE text_ar LIKE ? OR text_en LIKE ? OR chapter LIKE ? OR source LIKE ? LIMIT ?'
    )
    .bind(searchPattern, searchPattern, searchPattern, searchPattern, limit)
    .all<D1HadithRow>();

  // Fetch chain indices for all hadiths
  const hadithIds = results.map((r) => r.hadith_id);
  const chainMap = new Map<number, number[]>();

  if (hadithIds.length > 0) {
    const placeholders = hadithIds.map(() => '?').join(',');
    const { results: chainResults } = await db
      .prepare(`SELECT hadith_id, narrator_id FROM hadith_chains WHERE hadith_id IN (${placeholders}) ORDER BY hadith_id, chain_position`)
      .bind(...hadithIds)
      .all<{ hadith_id: number; narrator_id: number }>();

    for (const row of chainResults) {
      if (!chainMap.has(row.hadith_id)) {
        chainMap.set(row.hadith_id, []);
      }
      chainMap.get(row.hadith_id)!.push(row.narrator_id);
    }
  }

  return results.map((r) => transformHadith(r, chainMap.get(r.hadith_id) || []));
}

/**
 * Get hadiths by source
 */
export async function getHadithsBySource(
  db: D1Database,
  source: string
): Promise<CsvHadith[]> {
  const searchPattern = `%${source}%`;
  const { results } = await db
    .prepare('SELECT * FROM hadiths WHERE source LIKE ?')
    .bind(searchPattern)
    .all<D1HadithRow>();

  // Fetch chain indices for all hadiths
  const hadithIds = results.map((r) => r.hadith_id);
  const chainMap = new Map<number, number[]>();

  if (hadithIds.length > 0) {
    const placeholders = hadithIds.map(() => '?').join(',');
    const { results: chainResults } = await db
      .prepare(`SELECT hadith_id, narrator_id FROM hadith_chains WHERE hadith_id IN (${placeholders}) ORDER BY hadith_id, chain_position`)
      .bind(...hadithIds)
      .all<{ hadith_id: number; narrator_id: number }>();

    for (const row of chainResults) {
      if (!chainMap.has(row.hadith_id)) {
        chainMap.set(row.hadith_id, []);
      }
      chainMap.get(row.hadith_id)!.push(row.narrator_id);
    }
  }

  return results.map((r) => transformHadith(r, chainMap.get(r.hadith_id) || []));
}

/**
 * Get paginated hadiths with optional source filter
 */
export async function getHadithsPaginated(
  db: D1Database,
  page = 1,
  perPage = 20,
  source?: string
): Promise<{ hadiths: CsvHadith[]; total: number; pages: number }> {
  const offset = (page - 1) * perPage;

  let query: string;
  let countQuery: string;
  let params: (string | number)[];

  if (source) {
    const searchPattern = `%${source.trim()}%`;
    query = 'SELECT * FROM hadiths WHERE source LIKE ? LIMIT ? OFFSET ?';
    countQuery = 'SELECT COUNT(*) as count FROM hadiths WHERE source LIKE ?';
    params = [searchPattern, perPage, offset];
  } else {
    query = 'SELECT * FROM hadiths LIMIT ? OFFSET ?';
    countQuery = 'SELECT COUNT(*) as count FROM hadiths';
    params = [perPage, offset];
  }

  const [{ results }, countResult] = await Promise.all([
    source
      ? db.prepare(query).bind(params[0], params[1], params[2]).all<D1HadithRow>()
      : db.prepare(query).bind(params[0], params[1]).all<D1HadithRow>(),
    source
      ? db.prepare(countQuery).bind(params[0]).first<{ count: number }>()
      : db.prepare(countQuery).first<{ count: number }>(),
  ]);

  const total = countResult?.count || 0;

  // Fetch chain indices for all hadiths in one query
  const hadithIds = results.map((r) => r.hadith_id);
  const chainMap = new Map<number, number[]>();

  if (hadithIds.length > 0) {
    const placeholders = hadithIds.map(() => '?').join(',');
    const { results: chainResults } = await db
      .prepare(`SELECT hadith_id, narrator_id FROM hadith_chains WHERE hadith_id IN (${placeholders}) ORDER BY hadith_id, chain_position`)
      .bind(...hadithIds)
      .all<{ hadith_id: number; narrator_id: number }>();

    // Group by hadith_id
    for (const row of chainResults) {
      if (!chainMap.has(row.hadith_id)) {
        chainMap.set(row.hadith_id, []);
      }
      chainMap.get(row.hadith_id)!.push(row.narrator_id);
    }
  }

  return {
    hadiths: results.map((r) => transformHadith(r, chainMap.get(r.hadith_id) || [])),
    total,
    pages: Math.ceil(total / perPage),
  };
}

/**
 * Get available hadith sources with counts
 */
export async function getHadithSources(
  db: D1Database
): Promise<{ source: string; count: number }[]> {
  const { results } = await db
    .prepare('SELECT source, COUNT(*) as count FROM hadiths GROUP BY source ORDER BY count DESC')
    .all<{ source: string; count: number }>();

  return results;
}

// ============ Chain Resolution ============

/**
 * Resolve chain indices to narrators
 */
export async function resolveChain(
  db: D1Database,
  indices: number[]
): Promise<ExtendedNarrator[]> {
  if (indices.length === 0) return [];

  const placeholders = indices.map(() => '?').join(',');
  const { results } = await db
    .prepare(`SELECT * FROM narrators WHERE scholar_indx IN (${placeholders})`)
    .bind(...indices)
    .all<D1NarratorRow>();

  // Maintain order from indices
  const narratorMap = new Map(results.map((r) => [r.scholar_indx, transformNarrator(r)]));
  return indices.map((idx) => narratorMap.get(idx)).filter((n): n is ExtendedNarrator => n !== undefined);
}

// ============ Compatibility Wrappers ============
// These provide the same interface as csvService for easier migration

let dbInstance: D1Database | null = null;

export function setDb(db: D1Database): void {
  dbInstance = db;
}

function getDb(): D1Database {
  if (!dbInstance) {
    throw new Error('D1 database not initialized. Call setDb() first.');
  }
  return dbInstance;
}

// Wrapper functions that use the stored db instance
export async function loadNarrators(): Promise<Map<number, ExtendedNarrator>> {
  const narrators = await getAllNarrators(getDb(), 50000, 0);
  return new Map(narrators.map((n) => [n.scholarIndx, n]));
}

export async function loadHadiths(): Promise<CsvHadith[]> {
  const { hadiths } = await getHadithsPaginated(getDb(), 1, 50000);
  return hadiths;
}

export function clearCache(): void {
  // No-op for D1 (no client-side cache)
}

export async function preloadData(): Promise<void> {
  // No-op for D1 (data is queried on demand)
}
