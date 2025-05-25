export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type EventEra = "Pre-Prophethood" | "Meccan" | "Medinan";

export interface HistoricalEvent {
  id: number; // Assuming numeric IDs from your example
  year: string; // e.g., "570 CE", "c. 595 CE"
  title: string;
  description: string;
  locationName: string;
  coordinates: GeoCoordinates;
  era: EventEra;
} 