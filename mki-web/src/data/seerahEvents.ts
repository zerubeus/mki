import type { HistoricalEvent, GeoCoordinates, EventEra, EventType } from "../types";
import { fetchAndParseCSV } from "../utils/csvParser";

const R2_BASE_URL = "https://r2.mustknowislam.com";

type SupportedLocale = "ar" | "en" | "fr";

const SEERA_EVENTS_URLS: Record<SupportedLocale, string> = {
  ar: `${R2_BASE_URL}/data/seera/seera_events.csv`,
  en: `${R2_BASE_URL}/data/seera/seera_events_en.csv`,
  fr: `${R2_BASE_URL}/data/seera/seera_events_fr.csv`,
};

interface CsvSeeraRow {
  event_id: number | string;
  title: string;
  hijri_year?: string | number;
  lunar_month?: string | number;
  gregorian_year: number | string;
  details: string;
  source_url?: string;
  location_name: string;
  geo_coordinates: string;
}

const seeraEventsCache = new Map<SupportedLocale, HistoricalEvent[]>();

const DEFAULT_COORDINATES: GeoCoordinates = { lat: 21.4225, lng: 39.8262 };
const DEFAULT_EVENT_TYPE: EventType = "Personal";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
};

const parseCoordinates = (value: unknown): GeoCoordinates => {
  const text = normalizeText(value);
  if (!text) return DEFAULT_COORDINATES;

  const [latText, lngText] = text.split(",");
  const lat = Number.parseFloat(latText);
  const lng = Number.parseFloat(lngText);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return DEFAULT_COORDINATES;
};

const formatYearLabel = (row: CsvSeeraRow): string => {
  const gregorianYear = toNumber(row.gregorian_year);
  const hijriYear = normalizeText(row.hijri_year);
  const lunarMonth = normalizeText(row.lunar_month);
  const hijriLabel = [hijriYear, lunarMonth].filter(Boolean).join(" ");

  if (gregorianYear && hijriLabel) return `${gregorianYear} - ${hijriLabel}`;
  if (gregorianYear) return String(gregorianYear);
  return hijriLabel || "";
};

const getEraFromGregorianYear = (gregorianYear: number | null): EventEra => {
  if (!gregorianYear) return "Meccan";
  if (gregorianYear < 610) return "Pre-Prophethood";
  if (gregorianYear < 622) return "Meccan";
  return "Medinan";
};

export async function getLocalizedEvents(
  locale: SupportedLocale = "ar",
): Promise<HistoricalEvent[]> {
  const cached = seeraEventsCache.get(locale);
  if (cached) return cached;

  const url = SEERA_EVENTS_URLS[locale];
  const result = await fetchAndParseCSV<CsvSeeraRow>(url);

  const events = result.data
    .map((row) => {
      const id = toNumber(row.event_id);
      const gregorianYear = toNumber(row.gregorian_year);

      if (!id) return null;

      return {
        id,
        year: formatYearLabel(row),
        title: normalizeText(row.title),
        description: normalizeText(row.details),
        locationName: normalizeText(row.location_name),
        coordinates: parseCoordinates(row.geo_coordinates),
        era: getEraFromGregorianYear(gregorianYear),
        eventType: DEFAULT_EVENT_TYPE,
      };
    })
    .filter((event): event is HistoricalEvent => Boolean(event));

  seeraEventsCache.set(locale, events);
  return events;
}

export const MAP_INITIAL_CENTER: [number, number] = [24.7, 39.5];
export const MAP_INITIAL_ZOOM: number = 6;
export const MAP_EVENT_ZOOM: number = 9;
