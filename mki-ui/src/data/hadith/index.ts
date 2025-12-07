/**
 * Hadith Dataset - JSON-based storage
 *
 * This module provides typed access to hadith and narrator data
 * stored as JSON files for optimal Astro static generation.
 */

import narratorsData from './narrators.json';
import hadithsData from './hadiths.json';
import type { Narrator, Hadith, NarratorGeneration, NarratorStatus, HadithGrade } from '../../types';

// Re-export constants
export * from './constants';

// Type the imported JSON
export const narrators = narratorsData as Record<string, Narrator>;
export const hadiths = hadithsData as Hadith[];

// ============ Narrator Helpers ============

export function getNarrator(id: string): Narrator | undefined {
  return narrators[id];
}

export function getAllNarrators(): Narrator[] {
  return Object.values(narrators);
}

export function getNarratorsByGeneration(generation: NarratorGeneration): Narrator[] {
  return Object.values(narrators).filter(n => n.generation === generation);
}

export function getNarratorsByStatus(status: NarratorStatus): Narrator[] {
  return Object.values(narrators).filter(n => n.status === status);
}

export function getNarratorTeachers(narrator: Narrator): Narrator[] {
  // Note: The current Narrator interface doesn't have teachers/students
  // This is a placeholder for future extension
  return [];
}

export function getNarratorStudents(narrator: Narrator): Narrator[] {
  // Note: The current Narrator interface doesn't have teachers/students
  // This is a placeholder for future extension
  return [];
}

// ============ Hadith Helpers ============

export function getHadith(id: string): Hadith | undefined {
  return hadiths.find(h => h.id === id);
}

export function getHadithsByTopic(topic: string): Hadith[] {
  return hadiths.filter(h =>
    h.topic?.toLowerCase().includes(topic.toLowerCase()) ||
    h.topicAr?.includes(topic)
  );
}

export function getHadithsByNarrator(narratorId: string): Hadith[] {
  return hadiths.filter(h =>
    h.chains.some(chain => chain.narrators.includes(narratorId))
  );
}

export function getHadithsByGrade(grade: HadithGrade): Hadith[] {
  return hadiths.filter(h =>
    h.chains.some(chain => chain.grade === grade)
  );
}

// ============ Chain Helpers ============

export function getChainNarrators(narratorIds: string[]): Narrator[] {
  return narratorIds
    .map(id => narrators[id])
    .filter((n): n is Narrator => n !== undefined);
}

export function findCommonLink(hadith: Hadith): string | null {
  if (hadith.chains.length < 2) return null;

  // Count narrator occurrences across chains (excluding prophet and collectors)
  const counts: Record<string, number> = {};

  for (const chain of hadith.chains) {
    for (const narratorId of chain.narrators) {
      const narrator = narrators[narratorId];
      if (narrator && narrator.status !== 'prophet' && narrator.status !== 'collector') {
        counts[narratorId] = (counts[narratorId] || 0) + 1;
      }
    }
  }

  // Find narrator appearing in most chains
  let maxCount = 1;
  let commonLink: string | null = null;

  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      commonLink = id;
    }
  }

  return commonLink;
}

// ============ Search ============

export function searchHadiths(query: string): Hadith[] {
  const lowerQuery = query.toLowerCase();
  return hadiths.filter(h =>
    h.textAr.includes(query) ||
    h.textEn?.toLowerCase().includes(lowerQuery) ||
    h.topic?.toLowerCase().includes(lowerQuery) ||
    h.topicAr?.includes(query)
  );
}

export function searchNarrators(query: string): Narrator[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(narrators).filter(n =>
    n.nameAr.includes(query) ||
    n.nameEn.toLowerCase().includes(lowerQuery)
  );
}
