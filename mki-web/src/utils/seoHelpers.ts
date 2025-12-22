/**
 * SEO Helper Functions
 * Utilities for URL slugification, meta tag generation, etc.
 */

/**
 * Convert hadith source name to URL-friendly slug
 * e.g., " Sahih Bukhari " -> "bukhari"
 */
export function sourceToSlug(source: string): string {
  const normalized = source.trim().toLowerCase();

  // Map common source names to short slugs
  const slugMap: Record<string, string> = {
    'sahih bukhari': 'bukhari',
    'sahih muslim': 'muslim',
    'sunan an-nasai': 'nasai',
    "sunan an-nasa'i": 'nasai',
    'sunan abi dawud': 'abudawud',
    'sunan abu dawud': 'abudawud',
    'jami at-tirmidhi': 'tirmidhi',
    "jami` at-tirmidhi": 'tirmidhi',
    'sunan ibn majah': 'ibnmajah',
    'muwatta malik': 'muwatta',
    'musnad ahmad': 'ahmad',
    'riyad as-salihin': 'riyadussalihin',
    'mishkat al-masabih': 'mishkat',
    'bulugh al-maram': 'bulugh',
    'al-adab al-mufrad': 'adab',
  };

  // Check if we have a mapping
  for (const [key, slug] of Object.entries(slugMap)) {
    if (normalized.includes(key)) {
      return slug;
    }
  }

  // Fallback: create slug from source name
  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert URL slug back to source name for display
 */
export function slugToSource(slug: string): string {
  const sourceMap: Record<string, string> = {
    'bukhari': 'Sahih Bukhari',
    'muslim': 'Sahih Muslim',
    'nasai': "Sunan an-Nasa'i",
    'abudawud': 'Sunan Abi Dawud',
    'tirmidhi': 'Jami at-Tirmidhi',
    'ibnmajah': 'Sunan Ibn Majah',
    'muwatta': 'Muwatta Malik',
    'ahmad': 'Musnad Ahmad',
    'riyadussalihin': 'Riyad as-Salihin',
    'mishkat': 'Mishkat al-Masabih',
    'bulugh': 'Bulugh al-Maram',
    'adab': 'Al-Adab Al-Mufrad',
  };

  return sourceMap[slug] || slug;
}

/**
 * Truncate text for meta description (max 160 chars)
 */
export function truncateForMeta(text: string, maxLength = 160): string {
  if (!text) return '';

  // Clean up the text
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  return truncated.substring(0, lastSpace) + '...';
}

/**
 * Generate hadith page title
 */
export function generateHadithTitle(
  source: string,
  hadithNo: number,
  locale: 'ar' | 'en'
): string {
  const sourceName = source.trim();

  if (locale === 'ar') {
    return `${sourceName} - حديث رقم ${hadithNo} | MustKnowIslam`;
  }

  return `${sourceName} - Hadith ${hadithNo} | MustKnowIslam`;
}

/**
 * Generate hadith page description
 */
export function generateHadithDescription(
  hadith: { textAr: string; textEn: string; source: string },
  locale: 'ar' | 'en'
): string {
  const text = locale === 'ar' ? hadith.textAr : hadith.textEn;
  return truncateForMeta(text);
}

/**
 * Get all unique source slugs from hadiths
 */
export function getUniqueSources(hadiths: { source: string }[]): string[] {
  const sources = new Set<string>();

  for (const hadith of hadiths) {
    sources.add(sourceToSlug(hadith.source));
  }

  return Array.from(sources);
}
