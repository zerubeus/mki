import type { NarratorStatus, NarratorGeneration } from '../types';

/**
 * Map CSV grade values to NarratorStatus enum
 * CSV grades include: "Rasool Allah", "Comp.(RA)", "Follower(Tabi')", "Succ. (Taba' Tabi')", "3rd Century AH", etc.
 */
export function mapGradeToStatus(grade: string): NarratorStatus {
  if (!grade) return 'unknown';

  const normalizedGrade = grade.toLowerCase().trim();

  // Prophet
  if (normalizedGrade.includes('rasool') || normalizedGrade.includes('prophet')) {
    return 'prophet';
  }

  // Companion (Sahaba)
  if (
    normalizedGrade.includes('comp.') ||
    normalizedGrade.includes('صحابي') ||
    normalizedGrade.includes('companion') ||
    normalizedGrade.includes('(ra)')
  ) {
    return 'companion';
  }

  // Tabi'i (Follower) - These are trustworthy by default unless specified otherwise
  if (
    normalizedGrade.includes('follower') ||
    normalizedGrade.includes("tabi'") ||
    normalizedGrade.includes('tabi)') ||
    normalizedGrade.includes('تابعي')
  ) {
    return 'trustworthy';
  }

  // Taba' Tabi'i (Successor) - Also trustworthy by default
  if (
    normalizedGrade.includes('succ.') ||
    normalizedGrade.includes("taba'") ||
    normalizedGrade.includes('أتباع')
  ) {
    return 'trustworthy';
  }

  // Century scholars (3rd, 4th Century AH) - Later scholars, generally accepted
  if (normalizedGrade.includes('century ah')) {
    return 'trustworthy';
  }

  // Explicit trustworthy (ثقة)
  if (
    normalizedGrade.includes('ثقة') ||
    normalizedGrade.includes('trustworthy') ||
    normalizedGrade.includes('reliable') ||
    normalizedGrade.includes('thiqah')
  ) {
    return 'trustworthy';
  }

  // Truthful (صدوق)
  if (normalizedGrade.includes('صدوق') || normalizedGrade.includes('truthful') || normalizedGrade.includes('saduq')) {
    return 'truthful';
  }

  // Weak (ضعيف)
  if (
    normalizedGrade.includes('ضعيف') ||
    normalizedGrade.includes('weak') ||
    normalizedGrade.includes('لين') ||
    normalizedGrade.includes("da'if")
  ) {
    return 'weak';
  }

  // Collector (محدث/إمام)
  if (
    normalizedGrade.includes('collector') ||
    normalizedGrade.includes('محدث') ||
    normalizedGrade.includes('imam') ||
    normalizedGrade.includes('إمام')
  ) {
    return 'collector';
  }

  // Client of Prophet - treat as companion
  if (normalizedGrade.includes('client') || normalizedGrade.includes('مولى')) {
    return 'companion';
  }

  // Prophet's relative
  if (normalizedGrade.includes("prophet's relative")) {
    return 'companion';
  }

  // Default to unknown
  return 'unknown';
}

/**
 * Extract generation from grade string like "Comp.(RA) [1st Generation]" or "[7th generation]"
 */
export function extractGenerationFromGrade(grade: string): NarratorGeneration | null {
  if (!grade) return null;

  const genMatch = grade.match(/\[(\d+)(?:st|nd|rd|th)\s*[Gg]eneration\]/i);
  if (genMatch) {
    const genNum = parseInt(genMatch[1], 10);
    switch (genNum) {
      case 1:
        return 'sahaba';
      case 2:
      case 3:
        return 'tabieen';
      case 4:
      case 5:
      case 6:
        return 'atba_tabieen';
      default:
        return 'later';
    }
  }
  return null;
}

/**
 * Map CSV grade to NarratorGeneration
 */
export function mapGradeToGeneration(grade: string): NarratorGeneration {
  if (!grade) return 'later';

  // First try to extract from pattern
  const extracted = extractGenerationFromGrade(grade);
  if (extracted) return extracted;

  const normalizedGrade = grade.toLowerCase().trim();

  // Prophet
  if (normalizedGrade.includes('rasool') || normalizedGrade.includes('prophet')) {
    return 'prophet';
  }

  // Companion (1st Generation)
  if (
    normalizedGrade.includes('comp.') ||
    normalizedGrade.includes('صحابي') ||
    normalizedGrade.includes('(ra)') ||
    normalizedGrade.includes('client')
  ) {
    return 'sahaba';
  }

  // Tabi'een (2nd-3rd Generation) - Followers
  if (
    normalizedGrade.includes('follower') ||
    normalizedGrade.includes("tabi'") ||
    normalizedGrade.includes('تابعي')
  ) {
    return 'tabieen';
  }

  // Taba' Tabi'een (Successors to Followers)
  if (
    normalizedGrade.includes('succ.') ||
    normalizedGrade.includes("taba'") ||
    normalizedGrade.includes('أتباع')
  ) {
    return 'atba_tabieen';
  }

  // Century scholars
  if (normalizedGrade.includes('century ah')) {
    return 'later';
  }

  // Later scholars (default)
  return 'later';
}
