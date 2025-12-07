/**
 * Hadith Books - Fetched from /public/data/hadith/
 *
 * Source: https://github.com/AhmedBaset/hadith-json
 * Total: 40,943 hadiths from 9 books
 *
 * Files are stored in /public/data/hadith/ and fetched on demand.
 * This prevents bundling 68MB of JSON into the client bundle.
 */

export interface ImportedHadith {
  id: string;
  textAr: string;
  textEn: string;
  topic?: string;
  topicAr?: string;
  source: string;
  sourceAr: string;
  bookId: number;
  chapterId: number;
  hadithNumber: number;
  narrator?: string;
  chainId?: string;  // Reference to chain in chains.json
}

export type BookKey =
  | 'bukhari'
  | 'muslim'
  | 'abudawud'
  | 'tirmidhi'
  | 'nasai'
  | 'ibnmajah'
  | 'malik'
  | 'ahmed'
  | 'darimi';

export const bookInfo: Record<BookKey, { nameEn: string; nameAr: string; count: number }> = {
  bukhari: { nameEn: 'Sahih al-Bukhari', nameAr: 'صحيح البخاري', count: 7277 },
  muslim: { nameEn: 'Sahih Muslim', nameAr: 'صحيح مسلم', count: 7459 },
  abudawud: { nameEn: 'Sunan Abu Dawud', nameAr: 'سنن أبي داود', count: 5276 },
  tirmidhi: { nameEn: "Jami' at-Tirmidhi", nameAr: 'جامع الترمذي', count: 4053 },
  nasai: { nameEn: "Sunan an-Nasa'i", nameAr: 'سنن النسائي', count: 5768 },
  ibnmajah: { nameEn: 'Sunan Ibn Majah', nameAr: 'سنن ابن ماجه', count: 4345 },
  malik: { nameEn: 'Muwatta Malik', nameAr: 'موطأ مالك', count: 1985 },
  ahmed: { nameEn: 'Musnad Ahmad', nameAr: 'مسند أحمد', count: 1374 },
  darimi: { nameEn: 'Sunan ad-Darimi', nameAr: 'سنن الدارمي', count: 3406 },
};

// Cache for loaded books
const bookCache = new Map<BookKey, ImportedHadith[]>();

/**
 * Fetch a book's hadiths from public folder
 * Data is cached after first load
 */
export async function loadBook(book: BookKey): Promise<ImportedHadith[]> {
  // Return cached if available
  if (bookCache.has(book)) {
    return bookCache.get(book)!;
  }

  // Fetch from public folder
  const response = await fetch(`/data/hadith/${book}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load ${book}: ${response.statusText}`);
  }

  const hadiths: ImportedHadith[] = await response.json();
  bookCache.set(book, hadiths);
  return hadiths;
}

/**
 * Get a specific hadith by book and number
 */
export async function getHadithByNumber(
  book: BookKey,
  hadithNumber: number
): Promise<ImportedHadith | undefined> {
  const hadiths = await loadBook(book);
  return hadiths.find(h => h.hadithNumber === hadithNumber);
}

/**
 * Search hadiths in a specific book (exact match)
 */
export async function searchInBook(
  book: BookKey,
  query: string
): Promise<ImportedHadith[]> {
  const hadiths = await loadBook(book);
  const lowerQuery = query.toLowerCase();

  return hadiths.filter(h =>
    h.textAr.includes(query) ||
    h.textEn.toLowerCase().includes(lowerQuery) ||
    h.topic?.toLowerCase().includes(lowerQuery) ||
    h.topicAr?.includes(query)
  );
}

/**
 * Simple fuzzy match score (higher = better match)
 */
function fuzzyScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerText.includes(lowerQuery)) return 100;

  // Word match
  const words = lowerQuery.split(/\s+/);
  let score = 0;
  for (const word of words) {
    if (word.length > 2 && lowerText.includes(word)) {
      score += 10;
    }
  }

  return score;
}

/**
 * Fuzzy search hadiths in a specific book
 * Returns results sorted by relevance
 */
export async function fuzzySearchInBook(
  book: BookKey,
  query: string,
  limit: number = 50
): Promise<Array<ImportedHadith & { score: number }>> {
  const hadiths = await loadBook(book);

  const scored = hadiths.map(h => {
    const score = Math.max(
      fuzzyScore(h.textAr, query),
      fuzzyScore(h.textEn, query),
      fuzzyScore(h.topic || '', query) * 1.5,
      fuzzyScore(h.topicAr || '', query) * 1.5,
      fuzzyScore(h.narrator || '', query) * 1.2
    );
    return { ...h, score };
  });

  return scored
    .filter(h => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Fuzzy search across ALL books
 * Returns results sorted by relevance with book info
 */
export async function fuzzySearchAllBooks(
  query: string,
  limit: number = 50
): Promise<Array<ImportedHadith & { score: number; bookKey: BookKey }>> {
  const allBooks = Object.keys(bookInfo) as BookKey[];
  const results: Array<ImportedHadith & { score: number; bookKey: BookKey }> = [];

  for (const bookKey of allBooks) {
    try {
      const bookResults = await fuzzySearchInBook(bookKey, query, limit);
      results.push(...bookResults.map(h => ({ ...h, bookKey })));
    } catch (e) {
      console.warn(`Failed to search ${bookKey}:`, e);
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get hadiths by chapter in a book
 */
export async function getHadithsByChapter(
  book: BookKey,
  chapterId: number
): Promise<ImportedHadith[]> {
  const hadiths = await loadBook(book);
  return hadiths.filter(h => h.chapterId === chapterId);
}

/**
 * Get paginated hadiths from a book
 */
export async function getHadithsPaginated(
  book: BookKey,
  page: number = 1,
  perPage: number = 20
): Promise<{ hadiths: ImportedHadith[]; total: number; pages: number }> {
  const hadiths = await loadBook(book);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    hadiths: hadiths.slice(start, end),
    total: hadiths.length,
    pages: Math.ceil(hadiths.length / perPage),
  };
}

/**
 * Clear the cache (useful for memory management)
 */
export function clearCache(): void {
  bookCache.clear();
  narratorsCache = null;
  chainsCache = null;
}

// Cache for narrators and chains (normalized data)
let narratorsCache: string[] | null = null;
let chainsCache: Record<string, number[]> | null = null;

/**
 * Load narrators array from narrators.json
 */
export async function loadNarrators(): Promise<string[]> {
  if (narratorsCache) {
    return narratorsCache;
  }

  const response = await fetch('/data/hadith/narrators.json');
  if (!response.ok) {
    throw new Error(`Failed to load narrators: ${response.statusText}`);
  }

  narratorsCache = await response.json();
  return narratorsCache!;
}

/**
 * Load chains mapping from chains.json
 */
export async function loadChains(): Promise<Record<string, number[]>> {
  if (chainsCache) {
    return chainsCache;
  }

  const response = await fetch('/data/hadith/chains.json');
  if (!response.ok) {
    throw new Error(`Failed to load chains: ${response.statusText}`);
  }

  chainsCache = await response.json();
  return chainsCache!;
}

/**
 * Resolve a chain ID to an array of narrator names
 */
export async function resolveChain(chainId: string): Promise<string[] | null> {
  const [narrators, chains] = await Promise.all([
    loadNarrators(),
    loadChains(),
  ]);

  const narratorIds = chains[chainId];
  if (!narratorIds) {
    return null;
  }

  return narratorIds.map(id => narrators[id]);
}
