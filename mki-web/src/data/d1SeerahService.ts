/**
 * D1-based Seerah Events Service
 *
 * Queries seerah events from Cloudflare D1.
 * Replaces the old CSV-based seerahEvents.ts
 */

import type { HistoricalEvent, GeoCoordinates, EventEra, EventType } from "../types";

type SupportedLocale = "ar" | "en" | "fr";

interface D1SeerahRow {
  id: number;
  event_id: string;
  locale: string;
  year_hijri: number | null;
  year_gregorian: number | null;
  title: string;
  description: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  era: string | null;
  event_type: string | null;
}

const DEFAULT_COORDINATES: GeoCoordinates = { lat: 21.4225, lng: 39.8262 };
const DEFAULT_EVENT_TYPE: EventType = "Personal";

function transformSeerahRow(row: D1SeerahRow): HistoricalEvent {
  const coordinates: GeoCoordinates =
    row.latitude != null && row.longitude != null
      ? { lat: row.latitude, lng: row.longitude }
      : DEFAULT_COORDINATES;

  // Format year label
  let year = "";
  if (row.year_gregorian && row.year_hijri) {
    year = `${row.year_gregorian} - ${row.year_hijri} AH`;
  } else if (row.year_gregorian) {
    year = String(row.year_gregorian);
  } else if (row.year_hijri) {
    year = `${row.year_hijri} AH`;
  }

  return {
    id: parseInt(row.event_id, 10) || row.id,
    year,
    title: row.title || "",
    description: row.description || "",
    locationName: row.location_name || "",
    coordinates,
    era: (row.era as EventEra) || "Meccan",
    eventType: (row.event_type as EventType) || DEFAULT_EVENT_TYPE,
  };
}

/**
 * Get localized seerah events from D1
 */
export async function getLocalizedEvents(
  db: D1Database,
  locale: SupportedLocale = "ar"
): Promise<HistoricalEvent[]> {
  const { results } = await db
    .prepare("SELECT * FROM seerah_events WHERE locale = ? ORDER BY year_gregorian ASC, id ASC")
    .bind(locale)
    .all<D1SeerahRow>();

  return results.map(transformSeerahRow);
}

/**
 * Get seerah events filtered by era
 */
export async function getEventsByEra(
  db: D1Database,
  locale: SupportedLocale,
  era: EventEra
): Promise<HistoricalEvent[]> {
  const { results } = await db
    .prepare("SELECT * FROM seerah_events WHERE locale = ? AND era = ? ORDER BY year_gregorian ASC")
    .bind(locale, era)
    .all<D1SeerahRow>();

  return results.map(transformSeerahRow);
}

/**
 * Get a single seerah event by ID
 */
export async function getSeerahEventById(
  db: D1Database,
  eventId: number,
  locale: SupportedLocale = "ar"
): Promise<HistoricalEvent | null> {
  const row = await db
    .prepare("SELECT * FROM seerah_events WHERE event_id = ? AND locale = ?")
    .bind(String(eventId), locale)
    .first<D1SeerahRow>();

  return row ? transformSeerahRow(row) : null;
}

/**
 * Get count of events by locale
 */
export async function getEventsCount(
  db: D1Database,
  locale: SupportedLocale
): Promise<number> {
  const result = await db
    .prepare("SELECT COUNT(*) as count FROM seerah_events WHERE locale = ?")
    .bind(locale)
    .first<{ count: number }>();

  return result?.count || 0;
}

// Map constants
export const MAP_INITIAL_CENTER: [number, number] = [24.7, 39.5];
export const MAP_INITIAL_ZOOM: number = 6;
export const MAP_EVENT_ZOOM: number = 9;
