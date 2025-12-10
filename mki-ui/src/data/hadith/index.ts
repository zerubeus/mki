/**
 * Hadith Dataset - CSV-based storage
 *
 * This module provides typed access to hadith and narrator data
 * stored as CSV files, loaded at runtime for optimal performance.
 */

// Re-export from CSV service
export {
  loadNarrators,
  loadHadiths,
  getNarratorByIndex,
  getAllNarrators,
  searchNarrators,
  resolveChain,
  getNarratorTeachers,
  getNarratorStudents,
  getHadithById,
  searchHadiths,
  getHadithsBySource,
  getHadithsPaginated,
  getHadithSources,
  clearCache,
  preloadData,
} from './csvService';

// Re-export constants
export * from './constants';

// Re-export types
export type {
  ExtendedNarrator,
  CsvHadith,
  CsvRawiRow,
  CsvHadithRow,
} from '../../types';
