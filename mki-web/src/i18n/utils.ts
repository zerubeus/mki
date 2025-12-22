import { translations, type Locale } from "./translations";

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.ar;
}

export function isRTL(locale: Locale): boolean {
  return locale === "ar";
}

export function getDir(locale: Locale): "rtl" | "ltr" {
  return isRTL(locale) ? "rtl" : "ltr";
}

export function getLangFromUrl(url: URL): Locale {
  // Astro.currentLocale should be preferred when available in .astro files
  // This utility can still be used in other contexts or as a fallback
  const segments = url.pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (
    firstSegment &&
    (translations as Record<string, unknown>).hasOwnProperty(firstSegment)
  ) {
    return firstSegment as Locale;
  }

  return "ar"; // Default to Arabic if no known locale segment is found
}
