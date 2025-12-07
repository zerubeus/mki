import hijazGeoJson from "./geojson/hijaz.geojson?raw";

// GeoJSON types
export interface GeoJsonFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    color: string;
    description?: string;
    startYear: number;
    endYear: number;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

// Load all territory GeoJSON files
const territories: GeoJsonCollection[] = [
  JSON.parse(hijazGeoJson) as GeoJsonCollection,
  // Add more territories here as needed
];

// Get GeoJSON features for a specific year
export const getGeoJsonForYear = (year: number): GeoJsonCollection => {
  const features: GeoJsonFeature[] = [];
  
  territories.forEach(collection => {
    collection.features.forEach(feature => {
      if (year >= feature.properties.startYear && year <= feature.properties.endYear) {
        features.push(feature);
      }
    });
  });

  return {
    type: "FeatureCollection",
    features,
  };
};

// Get the min and max years from all territories
export const getYearRange = (): { min: number; max: number } => {
  let min = Infinity;
  let max = -Infinity;
  
  territories.forEach(collection => {
    collection.features.forEach(feature => {
      if (feature.properties.startYear < min) min = feature.properties.startYear;
      if (feature.properties.endYear > max) max = feature.properties.endYear;
    });
  });
  
  return {
    min: min === Infinity ? 600 : min,
    max: max === -Infinity ? 700 : max,
  };
};