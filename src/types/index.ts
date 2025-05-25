export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type EventEra = "Pre-Prophethood" | "Meccan" | "Medinan";

export interface HistoricalEvent {
  id: number;
  year: string;
  title: string;
  description: string;
  locationName: string;
  coordinates: GeoCoordinates;
  era: EventEra;
}
