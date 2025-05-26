import { territories } from "../historicalData";

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

// Simplified coordinates for demonstration purposes
// These are approximate and should be replaced with historically accurate boundaries
const regionCoordinates: Record<string, number[][][]> = {
  "mecca-city": [
    [
      [39.826, 21.423],
      [39.836, 21.423],
      [39.836, 21.413],
      [39.826, 21.413],
      [39.826, 21.423],
    ],
  ],
  "medina-city": [
    [
      [39.614, 24.467],
      [39.624, 24.467],
      [39.624, 24.457],
      [39.614, 24.457],
      [39.614, 24.467],
    ],
  ],
  "hijaz-region": [
    [
      [36.0, 29.0],
      [42.0, 29.0],
      [42.0, 20.0],
      [36.0, 20.0],
      [36.0, 29.0],
    ],
  ],
  "najd-region": [
    [
      [42.0, 29.0],
      [48.0, 29.0],
      [48.0, 20.0],
      [42.0, 20.0],
      [42.0, 29.0],
    ],
  ],
  "yemen-region": [
    [
      [42.0, 20.0],
      [48.0, 20.0],
      [48.0, 12.0],
      [42.0, 12.0],
      [42.0, 20.0],
    ],
  ],
  "syria-region": [
    [
      [34.0, 37.0],
      [42.0, 37.0],
      [42.0, 32.0],
      [34.0, 32.0],
      [34.0, 37.0],
    ],
  ],
  "iraq-region": [
    [
      [42.0, 37.0],
      [48.0, 37.0],
      [48.0, 29.0],
      [42.0, 29.0],
      [42.0, 37.0],
    ],
  ],
  "persia-region": [
    [
      [48.0, 37.0],
      [60.0, 37.0],
      [60.0, 25.0],
      [48.0, 25.0],
      [48.0, 37.0],
    ],
  ],
  "palestine-region": [
    [
      [34.0, 32.0],
      [36.0, 32.0],
      [36.0, 29.0],
      [34.0, 29.0],
      [34.0, 32.0],
    ],
  ],
  "desert-regions": [
    [
      [36.0, 32.0],
      [42.0, 32.0],
      [42.0, 29.0],
      [36.0, 29.0],
      [36.0, 32.0],
    ],
  ],
};

// Convert territories to GeoJSON features
export const createGeoJsonFromTerritories = (): GeoJsonCollection => {
  const features: GeoJsonFeature[] = territories.map((territory) => {
    // For territories with multiple regions, combine them into a MultiPolygon
    let geometry: GeoJsonFeature["geometry"];

    if (territory.regions.length === 1) {
      const regionId = territory.regions[0];
      geometry = {
        type: "Polygon",
        coordinates: regionCoordinates[regionId] || [
          [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
          ],
        ],
      };
    } else {
      // Create a MultiPolygon for territories with multiple regions
      geometry = {
        type: "MultiPolygon",
        coordinates: territory.regions.map(
          (regionId) =>
            regionCoordinates[regionId] || [
              [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
              ],
            ],
        ),
      };
    }

    return {
      type: "Feature",
      properties: {
        id: territory.id,
        name: territory.name,
        color: territory.color,
        description: territory.description,
        startYear: territory.startYear,
        endYear: territory.endYear,
      },
      geometry,
    };
  });

  return {
    type: "FeatureCollection",
    features,
  };
};

// Get GeoJSON features for a specific year
export const getGeoJsonForYear = (year: number): GeoJsonCollection => {
  const allGeoJson = createGeoJsonFromTerritories();
  const filteredFeatures = allGeoJson.features.filter(
    (feature) =>
      year >= feature.properties.startYear &&
      year <= feature.properties.endYear,
  );

  return {
    type: "FeatureCollection",
    features: filteredFeatures,
  };
};

// Get the min and max years from the territories data
export const getYearRange = (): { min: number; max: number } => {
  const allYears = territories.flatMap((t) => [t.startYear, t.endYear]);
  return {
    min: Math.min(...allYears),
    max: Math.max(...allYears),
  };
};

// Create and export the full GeoJSON collection
export const historicalTerritoriesGeoJson = createGeoJsonFromTerritories();
