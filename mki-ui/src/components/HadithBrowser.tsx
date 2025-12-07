import { useState, useEffect, useCallback } from "react";
import {
  getHadithsPaginated,
  fuzzySearchInBook,
  fuzzySearchAllBooks,
  bookInfo,
  type BookKey,
  type ImportedHadith,
} from "../data/hadith/books";

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

// Extract book key from hadith id (e.g., "bukhari-1" -> "bukhari")
function getBookFromId(id: string): string {
  const lastDash = id.lastIndexOf("-");
  if (lastDash === -1) return id;
  return id.substring(0, lastDash);
}

export default function HadithBrowser({ locale }: HadithBrowserProps) {
  const [selectedBook, setSelectedBook] = useState<BookKey | "all">("bukhari");
  const [searchQuery, setSearchQuery] = useState("");
  const [hadiths, setHadiths] = useState<ImportedHadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isRTL = locale === "ar";
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build URL for hadith detail page
  const getHadithUrl = (hadith: ImportedHadith): string => {
    const book = getBookFromId(hadith.id);
    const basePath = locale === "ar" ? "/hadith/view" : "/en/hadith/view";
    return `${basePath}?book=${book}&number=${hadith.hadithNumber}`;
  };

  // Load hadiths
  const loadHadiths = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedSearch.trim()) {
        // Search mode
        if (selectedBook === "all") {
          const results = await fuzzySearchAllBooks(debouncedSearch, 100);
          setHadiths(results);
          setTotalCount(results.length);
          setTotalPages(1);
        } else {
          const results = await fuzzySearchInBook(selectedBook, debouncedSearch, 100);
          setHadiths(results);
          setTotalCount(results.length);
          setTotalPages(1);
        }
      } else if (selectedBook !== "all") {
        // Browse mode
        const result = await getHadithsPaginated(selectedBook, page, 20);
        setHadiths(result.hadiths);
        setTotalPages(result.pages);
        setTotalCount(result.total);
      } else {
        setHadiths([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to load hadiths:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBook, page, debouncedSearch]);

  useEffect(() => {
    loadHadiths();
  }, [loadHadiths]);

  // Reset page when book or search changes
  useEffect(() => {
    setPage(1);
  }, [selectedBook, debouncedSearch]);

  const books = Object.entries(bookInfo) as [BookKey, typeof bookInfo[BookKey]][];

  return (
    <div
      className={`min-h-screen bg-[#0f1319] text-white p-4 ${isRTL ? "font-['Cairo']" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-amber-400 mb-4 text-center">
          {locale === "ar" ? "مكتبة الحديث" : "Hadith Library"}
        </h1>

        {/* Link to Isnad Visualization */}
        <div className="text-center mb-6">
          <a
            href={locale === "ar" ? "/hadith/isnad" : "/en/hadith/isnad"}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/50 rounded-lg text-amber-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            {locale === "ar" ? "عرض أمثلة تحليل الإسناد" : "View Isnad Analysis Examples"}
          </a>
        </div>

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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Book Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBook("all")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedBook === "all"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {locale === "ar" ? "الكل" : "All Books"}
            </button>
            {books.map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedBook(key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedBook === key
                    ? "bg-amber-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {locale === "ar" ? info.nameAr : info.nameEn}
                <span className="ml-1 text-xs opacity-70">({info.count.toLocaleString()})</span>
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
              key={hadith.id}
              href={getHadithUrl(hadith)}
              className="block bg-[#1a1f2e] rounded-lg border border-gray-700/50 p-4 hover:bg-[#252a3a] hover:border-amber-600/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Source badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-600/20 text-amber-400 text-xs px-2 py-0.5 rounded">
                      {locale === "ar" ? hadith.sourceAr : hadith.source} #{hadith.hadithNumber}
                    </span>
                    {hadith.topic && (
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                        {locale === "ar" ? hadith.topicAr : hadith.topic}
                      </span>
                    )}
                  </div>

                  {/* Preview text */}
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {locale === "ar" ? hadith.textAr : hadith.textEn}
                  </p>
                </div>

                {/* Arrow icon */}
                <span className="text-gray-500 group-hover:text-amber-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </span>
              </div>
            </a>
          ))}

          {/* Empty state */}
          {!loading && hadiths.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {selectedBook === "all" && !searchQuery ? (
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
