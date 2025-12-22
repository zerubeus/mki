// Wikipedia REST API utilities

export interface WikipediaSummary {
  title: string;
  displaytitle: string;
  extract: string;
  extractHtml: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  contentUrls: {
    desktop: { page: string; edit: string };
    mobile: { page: string; edit: string };
  };
  description?: string;
  lang: string;
}

const WIKIPEDIA_API_BASE_EN = "https://en.wikipedia.org/api/rest_v1";
const WIKIPEDIA_API_BASE_AR = "https://ar.wikipedia.org/api/rest_v1";

// Simple in-memory cache
const summaryCache: Map<string, { data: WikipediaSummary; timestamp: number }> = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch Wikipedia article summary
 * Uses the Wikipedia REST API v1
 */
export async function fetchWikipediaSummary(
  slug: string,
  lang: "en" | "ar" = "en"
): Promise<WikipediaSummary> {
  const cacheKey = `${lang}:${slug}`;

  // Check cache
  const cached = summaryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const baseUrl = lang === "ar" ? WIKIPEDIA_API_BASE_AR : WIKIPEDIA_API_BASE_EN;
  const url = `${baseUrl}/page/summary/${encodeURIComponent(slug)}`;

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      // Wikipedia API recommends identifying your app
      "Api-User-Agent": "MKI-Seerah-Map/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia API error: ${response.status} ${response.statusText}`);
  }

  const data: WikipediaSummary = await response.json();

  // Cache the result
  summaryCache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}

/**
 * Clear the Wikipedia cache
 */
export function clearWikipediaCache(): void {
  summaryCache.clear();
}

/**
 * Get direct Wikipedia URL for opening in new tab
 */
export function getWikipediaPageUrl(slug: string, lang: "en" | "ar" = "en"): string {
  const domain = lang === "ar" ? "ar.wikipedia.org" : "en.wikipedia.org";
  return `https://${domain}/wiki/${encodeURIComponent(slug)}`;
}
