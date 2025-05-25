import { translations, type Locale } from './translations';

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.ar;
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function getDir(locale: Locale): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getLangFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && ['en', 'ar'].includes(firstSegment)) {
    return firstSegment as Locale;
  }
  
  return 'ar';
} 