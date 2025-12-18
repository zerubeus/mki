import { useState, useEffect, useCallback } from "react";
import {
  getHadithsPaginated,
  searchHadiths,
  getHadithSources,
} from "../data/hadith/csvService";
import { sourceToSlug } from "../utils/seoHelpers";
import type { CsvHadith } from "../types";

interface HadithBrowserProps {
  locale: "ar" | "en";
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Source info with Arabic names
const sourceInfo: Record<string, { nameAr: string; nameEn: string }> = {
  "Sahih Bukhari": { nameAr: "صحيح البخاري", nameEn: "Sahih Bukhari" },
  "sahih bukhari": { nameAr: "صحيح البخاري", nameEn: "Sahih Bukhari" },
  "Sahih Muslim": { nameAr: "صحيح مسلم", nameEn: "Sahih Muslim" },
  "sahih muslim": { nameAr: "صحيح مسلم", nameEn: "Sahih Muslim" },
  "Sunan Abu Dawud": { nameAr: "سنن أبي داود", nameEn: "Sunan Abu Dawud" },
  "Jami at-Tirmidhi": { nameAr: "جامع الترمذي", nameEn: "Jami at-Tirmidhi" },
  "Sunan an-Nasai": { nameAr: "سنن النسائي", nameEn: "Sunan an-Nasai" },
  "Sunan Ibn Majah": { nameAr: "سنن ابن ماجه", nameEn: "Sunan Ibn Majah" },
  "Muwatta Malik": { nameAr: "موطأ مالك", nameEn: "Muwatta Malik" },
  "Musnad Ahmad": { nameAr: "مسند أحمد", nameEn: "Musnad Ahmad" },
  "Sunan ad-Darimi": { nameAr: "سنن الدارمي", nameEn: "Sunan ad-Darimi" },
};

function getSourceDisplay(source: string, locale: "ar" | "en"): string {
  const normalizedSource = source.trim();
  const info = sourceInfo[normalizedSource] || sourceInfo[normalizedSource.toLowerCase()];
  if (info) {
    return locale === "ar" ? info.nameAr : info.nameEn;
  }
  return source;
}

export default function HadithBrowser({ locale }: HadithBrowserProps) {
  const [selectedSource, setSelectedSource] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hadiths, setHadiths] = useState<CsvHadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);

  const isRTL = locale === "ar";
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load available sources on mount
  useEffect(() => {
    const loadSources = async () => {
      try {
        const sourcesData = await getHadithSources();
        setSources(sourcesData);
      } catch (error) {
        console.error("Failed to load sources:", error);
      }
    };
    loadSources();
  }, []);

  // Build URL for hadith detail page (SEO-friendly URLs)
  const getHadithUrl = (hadith: CsvHadith): string => {
    const sourceSlug = sourceToSlug(hadith.source);
    const basePath = locale === "ar" ? "/hadith" : "/en/hadith";
    return `${basePath}/${sourceSlug}/${hadith.hadithNo}`;
  };

  // Extract chapter name (Arabic or English based on locale)
  const getChapterDisplay = (chapter: string): string => {
    // Format: "Revelation - كتاب بدء الوحى"
    const parts = chapter.split(" - ");
    if (parts.length === 2) {
      return locale === "ar" ? parts[1] : parts[0];
    }
    return chapter;
  };

  // Load hadiths
  const loadHadiths = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedSearch.trim()) {
        // Search mode
        const results = await searchHadiths(debouncedSearch, 100);
        // Filter by source if selected
        const filtered = selectedSource === "all"
          ? results
          : results.filter(h => h.source.trim().toLowerCase() === selectedSource.trim().toLowerCase());
        setHadiths(filtered);
        setTotalCount(filtered.length);
        setTotalPages(1);
      } else {
        // Browse mode with pagination
        const sourceFilter = selectedSource === "all" ? undefined : selectedSource;
        const result = await getHadithsPaginated(page, 20, sourceFilter);
        setHadiths(result.hadiths);
        setTotalPages(result.pages);
        setTotalCount(result.total);
      }
    } catch (error) {
      console.error("Failed to load hadiths:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSource, page, debouncedSearch]);

  useEffect(() => {
    loadHadiths();
  }, [loadHadiths]);

  // Reset page when source or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedSource, debouncedSearch]);

  return (
    <div
      className={`min-h-screen bg-[#0f1319] text-white p-4 ${isRTL ? "font-['Cairo']" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        {/* Navigation bar */}
        <div className="flex justify-between items-center mb-4">
          <a
            href={locale === "ar" ? "/" : "/en/"}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {locale === "ar" ? "الصفحة الرئيسية" : "Home"}
          </a>
          <select
            className="px-4 py-2 border border-gray-700 rounded-lg bg-[#1a1f2e] text-gray-300 font-medium cursor-pointer transition-all duration-300 hover:border-amber-700/50 focus:outline-none focus:border-amber-600 appearance-none text-center min-w-[100px]"
            onChange={(e) => window.location.href = e.target.value}
            value={locale === "ar" ? "/hadith" : "/en/hadith"}
          >
            <option value="/hadith">العربية</option>
            <option value="/en/hadith">English</option>
          </select>
        </div>

        <h1 className="text-2xl font-bold text-amber-400 mb-4 text-center">
          {locale === "ar" ? "مكتبة الحديث" : "Hadith Library"}
        </h1>

        {/* Search & Filters */}
        <div className="bg-[#1a1f2e] rounded-lg p-4 mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "ar" ? "ابحث في الأحاديث..." : "Search hadiths..."}
              className="w-full bg-[#0f1319] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-gray-500 hover:text-white`}
              >
                ✕
              </button>
            )}
          </div>

          {/* Source Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSource("all")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedSource === "all"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {locale === "ar" ? "الكل" : "All Books"}
            </button>
            {sources.map(({ source, count }) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedSource === source
                    ? "bg-amber-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {getSourceDisplay(source, locale)}
                <span className="ml-1 text-xs opacity-70">({count.toLocaleString()})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-gray-400 text-sm mb-4">
          {loading ? (
            <span>{locale === "ar" ? "جاري التحميل..." : "Loading..."}</span>
          ) : (
            <span>
              {locale === "ar"
                ? `${totalCount.toLocaleString()} حديث`
                : `${totalCount.toLocaleString()} hadiths`}
              {debouncedSearch && (
                <span className="text-amber-400 ml-2">
                  {locale === "ar" ? `للبحث: "${debouncedSearch}"` : `for: "${debouncedSearch}"`}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Hadith List */}
        <div className="space-y-3">
          {hadiths.map((hadith) => (
            <a
              key={`${hadith.source}-${hadith.hadithNo}`}
              href={getHadithUrl(hadith)}
              className="block bg-[#1a1f2e] rounded-lg border border-gray-700/50 p-4 hover:bg-[#252a3a] hover:border-amber-600/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Source badge */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-amber-600/20 text-amber-400 text-xs px-2 py-0.5 rounded">
                      {getSourceDisplay(hadith.source, locale)} #{hadith.hadithNo}
                    </span>
                    {hadith.chapter && (
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {getChapterDisplay(hadith.chapter)}
                      </span>
                    )}
                  </div>

                  {/* Preview text */}
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {locale === "ar" ? hadith.textAr : hadith.textEn}
                  </p>
                </div>

                {/* Arrow icon */}
                <span className="text-gray-500 group-hover:text-amber-400 transition-colors flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </span>
              </div>
            </a>
          ))}

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
            </div>
          )}

          {/* Empty state */}
          {!loading && hadiths.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {!searchQuery ? (
                <p>{locale === "ar" ? "اختر كتاباً أو ابحث" : "Select a book or search"}</p>
              ) : (
                <p>{locale === "ar" ? "لا توجد نتائج" : "No results found"}</p>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!debouncedSearch && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              {locale === "ar" ? "السابق" : "Previous"}
            </button>
            <span className="text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              {locale === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
