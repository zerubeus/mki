/**
 * Hadith Dataset - D1-based storage
 *
 * This module provides typed access to hadith and narrator data
 * stored in Cloudflare D1 database.
 */

// Re-export from D1 service
export {
  // Core functions that need db parameter
  getNarratorByIndex,
  getAllNarrators,
  searchNarrators,
  getNarratorTeachers,
  getNarratorStudents,
  getHadithById,
  getHadithByHadithId,
  searchHadiths,
  getHadithsBySource,
  getHadithsPaginated,
  getHadithSources,
  resolveChain,
  // Compatibility wrappers
  setDb,
  loadNarrators,
  loadHadiths,
  clearCache,
  preloadData,
} from './d1Service';

// Re-export constants
export * from './constants';

// Re-export types
export type {
  ExtendedNarrator,
  CsvHadith,
  CsvRawiRow,
  CsvHadithRow,
} from '../../types';
