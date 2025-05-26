export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export type EventEra = "Pre-Prophethood" | "Meccan" | "Medinan";

// Declare L on window if using CDN version of Leaflet and not importing via npm module directly
// For Astro with npm installed leaflet, direct import is fine, but this handles script tag loading.
declare global {
  interface Window {
    L: any; // Leaflet's global object
  }
}

export interface HistoricalEvent {
  id: number;
  year: string;
  title: string;
  description: string;
  locationName: string;
  coordinates: GeoCoordinates;
  era: EventEra;
}
