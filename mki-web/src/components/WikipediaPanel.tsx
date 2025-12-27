import React, { useEffect, useState } from "react";
import type { WikipediaRegionInfo } from "../data/wikipediaRegions";
import { fetchWikipediaSummary, getWikipediaPageUrl, type WikipediaSummary } from "../utils/wikipediaApi";

interface WikipediaPanelProps {
  regionInfo: WikipediaRegionInfo | null;
  regionName: string;
  isOpen: boolean;
  onClose: () => void;
  locale: "ar" | "en" | "fr";
}

type LoadingState = "idle" | "loading" | "success" | "error";

const WikipediaPanel: React.FC<WikipediaPanelProps> = ({
  regionInfo,
  regionName,
  isOpen,
  onClose,
  locale,
}) => {
  const [summary, setSummary] = useState<WikipediaSummary | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Fetch Wikipedia summary when region changes
  useEffect(() => {
    if (!isOpen || !regionInfo) {
      setSummary(null);
      setLoadingState("idle");
      return;
    }

    const fetchSummary = async () => {
      setLoadingState("loading");
      setError(null);

      try {
        // Try to fetch in the user's locale first
        let slug = regionInfo.wikipediaSlug;
        let lang: "en" | "ar" | "fr" = "en";

        if (locale === "ar" && regionInfo.wikipediaSlugAr) {
          slug = regionInfo.wikipediaSlugAr;
          lang = "ar";
        } else if (locale === "fr" && regionInfo.wikipediaSlugFr) {
          slug = regionInfo.wikipediaSlugFr;
          lang = "fr";
        } else if (locale === "fr") {
          // For French, try to use English slug on French Wikipedia
          lang = "fr";
        }

        const data = await fetchWikipediaSummary(slug, lang);
        setSummary(data);
        setLoadingState("success");
      } catch (err) {
        // If locale-specific fetch failed, try English as fallback
        if (locale !== "en") {
          try {
            const data = await fetchWikipediaSummary(regionInfo.wikipediaSlug, "en");
            setSummary(data);
            setLoadingState("success");
            return;
          } catch {
            // Fall through to error handling
          }
        }
        setError("Failed to load Wikipedia content");
        setLoadingState("error");
      }
    };

    fetchSummary();
  }, [isOpen, regionInfo, locale]);

  if (!isOpen) return null;

  const title = regionInfo
    ? (locale === "ar" ? regionInfo.titleAr : locale === "fr" && regionInfo.titleFr ? regionInfo.titleFr : regionInfo.titleEn)
    : regionName;

  const getLocaleSlugAndLang = (): { slug: string; lang: "en" | "ar" | "fr" } => {
    if (!regionInfo) return { slug: regionName, lang: "en" };
    if (locale === "ar" && regionInfo.wikipediaSlugAr) {
      return { slug: regionInfo.wikipediaSlugAr, lang: "ar" };
    }
    if (locale === "fr") {
      return { slug: regionInfo.wikipediaSlugFr || regionInfo.wikipediaSlug, lang: "fr" };
    }
    return { slug: regionInfo.wikipediaSlug, lang: "en" };
  };

  const { slug: wikiSlug, lang: wikiLang } = getLocaleSlugAndLang();
  const wikipediaUrl = regionInfo
    ? getWikipediaPageUrl(wikiSlug, wikiLang)
    : `https://${locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en"}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(regionName)}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1f2e] rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className={`text-xl font-bold text-white ${locale === "ar" ? "font-arabic" : ""}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingState === "loading" && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
            </div>
          )}

          {loadingState === "error" && (
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">{error}</div>
              {regionInfo?.description && (
                <p className="text-gray-300 mb-4">{regionInfo.description}</p>
              )}
            </div>
          )}

          {loadingState === "success" && summary && (
            <div className={`${locale === "ar" ? "text-right" : "text-left"}`}>
              {/* Thumbnail */}
              {summary.thumbnail && (
                <div className={`${locale === "ar" ? "float-left ml-4" : "float-right mr-4"} mb-4`}>
                  <img
                    src={summary.thumbnail.source}
                    alt={summary.title}
                    className="rounded-lg shadow-md max-w-[200px] h-auto"
                    style={{ maxHeight: "200px", objectFit: "cover" }}
                  />
                </div>
              )}

              {/* Description */}
              {summary.description && (
                <p className="text-amber-400 text-sm mb-3 italic">
                  {summary.description}
                </p>
              )}

              {/* Extract */}
              <div
                className="text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: summary.extractHtml || summary.extract }}
              />

              <div className="clear-both"></div>
            </div>
          )}

          {loadingState === "idle" && !regionInfo && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                {locale === "ar"
                  ? "لا تتوفر معلومات ويكيبيديا لهذه المنطقة"
                  : locale === "fr"
                  ? "Aucune information Wikipédia disponible pour cette région"
                  : "No Wikipedia information available for this region"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50 bg-[#151927]">
          <a
            href={wikipediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            <span>{locale === "ar" ? "اقرأ المزيد على ويكيبيديا" : locale === "fr" ? "En savoir plus sur Wikipédia" : "Read more on Wikipedia"}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default WikipediaPanel;
