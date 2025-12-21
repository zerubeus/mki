import Papa from 'papaparse';

export interface CsvParseResult<T> {
  data: T[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

/**
 * Fetch a CSV file from URL and parse it using PapaParse
 */
export async function fetchAndParseCSV<T>(url: string): Promise<CsvParseResult<T>> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
  }

  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.replace(/^\uFEFF/, ''),
      complete: (results) => {
        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta,
        });
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Parse comma-separated numeric indices string into an array of numbers
 * Example: "30418, 20005, 11062" -> [30418, 20005, 11062]
 */
export function parseIndices(indicesStr: string | null | undefined): number[] {
  if (!indicesStr || typeof indicesStr !== 'string') return [];
  return indicesStr
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}

/**
 * Parse name field to extract Arabic and English parts
 * Format: "English Name ( Arabic Name" or "English Name ( Arabic Name ( رضي الله عنه"
 */
export function parseName(nameField: string): { nameEn: string; nameAr: string } {
  if (!nameField) {
    return { nameEn: '', nameAr: '' };
  }

  // Format: "Prophet Muhammad(saw) ( محمّد صلّی اللہ علیہ وآلہ وسلّم ( رضي الله عنه"
  // We want to extract the English part before first " (" and the Arabic part after
  const firstParenIndex = nameField.indexOf(' (');

  if (firstParenIndex === -1) {
    // No parentheses, use same value for both
    return { nameEn: nameField.trim(), nameAr: nameField.trim() };
  }

  const nameEn = nameField.substring(0, firstParenIndex).trim();

  // Extract Arabic part - look for Arabic characters
  const arabicMatch = nameField.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+[^(]*/);
  const nameAr = arabicMatch ? arabicMatch[0].trim() : nameEn;

  return { nameEn, nameAr };
}
