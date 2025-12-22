/**
 * Hadith Dataset Constants
 * Labels, colors, and configuration for UI
 */

// Status colors for visualization
export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  prophet: {
    bg: "bg-purple-600",
    text: "text-white",
    border: "border-purple-400",
  },
  companion: {
    bg: "bg-teal-500",
    text: "text-white",
    border: "border-teal-300",
  },
  trustworthy: {
    bg: "bg-emerald-500",
    text: "text-white",
    border: "border-emerald-300",
  },
  truthful: {
    bg: "bg-green-400",
    text: "text-gray-900",
    border: "border-green-200",
  },
  unknown: {
    bg: "bg-orange-500",
    text: "text-white",
    border: "border-orange-300",
  },
  weak: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-300",
  },
  collector: {
    bg: "bg-gray-500",
    text: "text-white",
    border: "border-gray-300",
  },
};

// Hex colors for Mermaid diagrams
export const statusHexColors: Record<string, string> = {
  prophet: "#9333ea",
  companion: "#14b8a6",
  trustworthy: "#22c55e",
  truthful: "#4ade80",
  unknown: "#f97316",
  weak: "#ef4444",
  collector: "#6b7280",
};

// Grade colors
export const gradeColors: Record<string, { bg: string; text: string }> = {
  sahih: { bg: "bg-emerald-500", text: "text-white" },
  hasan: { bg: "bg-yellow-500", text: "text-gray-900" },
  daif: { bg: "bg-orange-500", text: "text-white" },
  mawdu: { bg: "bg-red-600", text: "text-white" },
};

// Generation labels
export const generationLabels = {
  ar: {
    prophet: "النبي ﷺ",
    sahaba: "الصحابة (0-100 هـ)",
    tabieen: "التابعون (50-150 هـ)",
    atba_tabieen: "أتباع التابعين (100-200 هـ)",
    later: "المتأخرون (200-500 هـ)",
  },
  en: {
    prophet: "The Prophet ﷺ",
    sahaba: "Companions (0-100 AH)",
    tabieen: "Successors (50-150 AH)",
    atba_tabieen: "Followers of Successors (100-200 AH)",
    later: "Later Scholars (200-500 AH)",
  },
};

// Status labels
export const statusLabels = {
  ar: {
    prophet: "النبي ﷺ",
    companion: "صحابي",
    trustworthy: "ثقة",
    truthful: "صدوق",
    unknown: "مجهول",
    weak: "ضعيف",
    collector: "المخرج",
  },
  en: {
    prophet: "Prophet ﷺ",
    companion: "Companion",
    trustworthy: "Trustworthy",
    truthful: "Truthful",
    unknown: "Unknown",
    weak: "Weak",
    collector: "Collector",
  },
};

// Grade labels
export const gradeLabels = {
  ar: {
    sahih: "صحيح",
    hasan: "حسن",
    daif: "ضعيف",
    mawdu: "موضوع",
  },
  en: {
    sahih: "Authentic",
    hasan: "Good",
    daif: "Weak",
    mawdu: "Fabricated",
  },
};

// Generation order for sorting
export const generationOrder = ["prophet", "sahaba", "tabieen", "atba_tabieen", "later"];
