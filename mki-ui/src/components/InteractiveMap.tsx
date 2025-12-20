import React, { useEffect, useRef, useState } from "react";
import type { HistoricalEvent } from "../types";
import meccaSvg from "../assets/mecca.svg?url";
import worldBordersUrl from "../data/geojson/world_500.geojson?url";

interface InteractiveMapProps {
  events: HistoricalEvent[];
  selectedEventId: number | null;
  onMarkerClick: (eventId: number) => void;
  center: [number, number];
  zoom: number;
  className?: string;
  locale?: "ar" | "en";
}

// Color palette for regions - distinct colors with vintage/muted feel
const regionColors = [
  '#E6B8AF', // Dusty rose
  '#F4CCCC', // Light pink
  '#FCE5CD', // Peach
  '#FFF2CC', // Light yellow
  '#D9EAD3', // Light green
  '#D0E0E3', // Light teal
  '#C9DAF8', // Light blue
  '#D9D2E9', // Light purple
  '#EAD1DC', // Pink lavender
  '#DD7E6B', // Salmon
  '#E69138', // Orange
  '#F1C232', // Gold
  '#6AA84F', // Forest green
  '#45818E', // Teal
  '#3D85C6', // Blue
  '#674EA7', // Purple
  '#A64D79', // Magenta
  '#CC4125', // Red brown
  '#E06666', // Coral
  '#93C47D', // Sage green
  '#76A5AF', // Steel blue
  '#8E7CC3', // Lavender
  '#C27BA0', // Rose
  '#B6D7A8', // Mint
  '#A2C4C9', // Aqua
];

// Region name translations (English to Arabic)
const regionTranslations: Record<string, string> = {
  "Himyarite Kingdom": "مملكة حمير",
  "Axum": "أكسوم",
  "Sasanian Empire": "الإمبراطورية الساسانية",
  "Eastern Roman Empire": "الإمبراطورية الرومانية الشرقية",
  "Gupta Empire": "إمبراطورية غوبتا",
  "Lakhmids": "اللخميون",
  "Ghassanids": "الغساسنة",
  "Kindah": "كندة",
  "Makkura": "مقرة",
  "Nobatia": "نوباتيا",
  "Alodia": "علوة",
};

const InteractiveMapReact: React.FC<InteractiveMapProps> = ({
  events,
  selectedEventId,
  onMarkerClick,
  center,
  zoom,
  className = "h-[400px] md:h-[500px]",
  locale = "en",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const meccaMarkerRef = useRef<any>(null);
  const bordersLayerRef = useRef<any>(null);
  const labelsLayerRef = useRef<any[]>([]);
  const geoDataRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);

  // Mecca coordinates - always shown on the map
  const MECCA_COORDS: [number, number] = [21.42000223039767, 39.8247860544908];

  // Check for Leaflet library availability with retry (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const checkLeaflet = setInterval(() => {
      if (window.L) {
        setLeafletReady(true);
        clearInterval(checkLeaflet);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(checkLeaflet);
      console.error("Leaflet failed to load within timeout");
    }, 10000);

    return () => {
      clearInterval(checkLeaflet);
      clearTimeout(timeout);
    };
  }, []);

  const getIconHtml = (isSelected: boolean, era: string) => {
    let bgColor = "bg-gray-500";
    if (era === "Meccan") bgColor = "bg-amber-500";
    if (era === "Medinan") bgColor = "bg-emerald-500";
    if (era === "Pre-Prophethood") bgColor = "bg-sky-500";

    if (isSelected) {
      return `<div class="${bgColor} w-5 h-5 rounded-full border-2 border-white shadow-lg ring-2 ring-offset-1 ring-black flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>`;
    }
    return `<div class="${bgColor} w-3 h-3 rounded-full border border-white shadow"></div>`;
  };

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMapRef.current) return;

    const map = window.L.map(mapRef.current, {
      attributionControl: true,
      zoomControl: true,
      minZoom: 3,
      maxZoom: 16,
    }).setView(center, zoom);

    // Use Stamen Watercolor tiles for vintage/historical aesthetic
    window.L.tileLayer(
      "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
      {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>. Hosted by <a href="https://stadiamaps.com/">Stadia Maps</a>.',
        maxZoom: 16,
        minZoom: 0,
      },
    ).addTo(map);

    leafletMapRef.current = map;
    setMapReady(true);

    // Listen for zoom changes
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });
  }, [leafletReady, center, zoom]);

  // Helper function to get polygon center
  const getPolygonCenter = (coordinates: any): [number, number] | null => {
    try {
      let allCoords: number[][] = [];

      // Handle MultiPolygon - flatten all coordinates
      if (Array.isArray(coordinates[0][0][0])) {
        coordinates.forEach((polygon: any) => {
          polygon.forEach((ring: any) => {
            allCoords = allCoords.concat(ring);
          });
        });
      } else {
        // Regular Polygon
        coordinates.forEach((ring: any) => {
          allCoords = allCoords.concat(ring);
        });
      }

      if (allCoords.length === 0) return null;

      // Calculate centroid
      let sumLng = 0, sumLat = 0;
      allCoords.forEach(coord => {
        sumLng += coord[0];
        sumLat += coord[1];
      });

      return [sumLat / allCoords.length, sumLng / allCoords.length];
    } catch {
      return null;
    }
  };

  // Calculate font size based on zoom level
  const getLabelFontSize = (zoomLevel: number): number => {
    // Scale from 12px at zoom 3 to 24px at zoom 10
    const minZoom = 3;
    const maxZoom = 10;
    const minSize = 12;
    const maxSize = 24;

    if (zoomLevel <= minZoom) return minSize;
    if (zoomLevel >= maxZoom) return maxSize;

    const ratio = (zoomLevel - minZoom) / (maxZoom - minZoom);
    return Math.round(minSize + ratio * (maxSize - minSize));
  };

  // Function to create/update labels
  const updateLabels = (data: any, zoomLevel: number) => {
    if (!leafletMapRef.current || !window.L) return;

    // Remove existing labels
    labelsLayerRef.current.forEach(label => {
      leafletMapRef.current.removeLayer(label);
    });
    labelsLayerRef.current = [];

    const fontSize = getLabelFontSize(zoomLevel);

    // Add permanent labels for each region
    data.features.forEach((feature: any) => {
      const englishName = feature.properties?.NAME || feature.properties?.ABBREVN;
      if (!englishName) return;

      const center = getPolygonCenter(feature.geometry.coordinates);
      if (!center) return;

      // Get translated name based on locale
      const displayName = locale === 'ar'
        ? (regionTranslations[englishName] || englishName)
        : englishName;

      // Create label marker with zoom-scaled font
      const labelIcon = window.L.divIcon({
        html: `<div class="region-name-label" style="
          font-size: ${fontSize}px;
          font-weight: 600;
          color: #3E2723;
          text-shadow:
            -1px -1px 0 rgba(255,255,255,0.9),
            1px -1px 0 rgba(255,255,255,0.9),
            -1px 1px 0 rgba(255,255,255,0.9),
            1px 1px 0 rgba(255,255,255,0.9),
            0 0 8px rgba(255,255,255,0.8);
          white-space: nowrap;
          pointer-events: none;
          letter-spacing: 1px;
          ${locale === 'ar' ? 'font-family: Arial, sans-serif;' : 'font-family: Georgia, serif;'}
        ">${displayName}</div>`,
        className: '',
        iconAnchor: [0, 0],
      });

      const labelMarker = window.L.marker(center, {
        icon: labelIcon,
        interactive: false,
      }).addTo(leafletMapRef.current);

      labelsLayerRef.current.push(labelMarker);
    });
  };

  // Add world borders layer when map is ready
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !window.L) return;

    // Fetch and add GeoJSON borders layer
    fetch(worldBordersUrl)
      .then(response => response.json())
      .then(data => {
        // Store the geo data for label updates
        geoDataRef.current = data;

        // Remove existing borders layer if it exists
        if (bordersLayerRef.current) {
          leafletMapRef.current.removeLayer(bordersLayerRef.current);
        }

        // Add GeoJSON borders layer with styling - each region gets a unique color
        let featureIndex = 0;
        bordersLayerRef.current = window.L.geoJSON(data, {
          style: () => {
            const color = regionColors[featureIndex % regionColors.length];
            featureIndex++;
            return {
              color: '#8B4513', // Brown border for vintage look
              weight: 1.5,
              opacity: 0.7,
              fillColor: color,
              fillOpacity: 0.5,
            };
          },
        }).addTo(leafletMapRef.current);

        // Initial label creation
        updateLabels(data, currentZoom);
      })
      .catch(err => console.error('Failed to load borders:', err));
  }, [mapReady]);

  // Update labels when zoom or locale changes
  useEffect(() => {
    if (geoDataRef.current && mapReady) {
      updateLabels(geoDataRef.current, currentZoom);
    }
  }, [currentZoom, locale]);

  // Add Mecca marker - always visible on map
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !window.L) return;

    // Remove existing Mecca marker if it exists
    if (meccaMarkerRef.current) {
      leafletMapRef.current.removeLayer(meccaMarkerRef.current);
      meccaMarkerRef.current = null;
    }

    // Create Mecca icon using divIcon with img tag for better SVG rendering
    const meccaIcon = window.L.divIcon({
      html: `<img src="${meccaSvg}" style="width: 48px; height: 48px;" alt="Mecca" />`,
      className: '', // Remove default leaflet styles
      iconSize: [48, 48],
      iconAnchor: [24, 24], // Center the icon
    });

    // Add Mecca marker with high z-index
    meccaMarkerRef.current = window.L.marker(MECCA_COORDS, {
      icon: meccaIcon,
      zIndexOffset: 1000, // Ensure it appears above other markers
    })
      .addTo(leafletMapRef.current)
      .bindTooltip('Mecca (مكة المكرمة)', { direction: 'top', offset: [0, -24] });
  }, [mapReady]);

  // Add markers when map is ready or events change
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach((marker) =>
      leafletMapRef.current.removeLayer(marker),
    );
    markersRef.current = [];

    // Add new markers
    events.forEach((event) => {
      const isSelected = event.id === selectedEventId;
      const icon = window.L.divIcon({
        html: getIconHtml(isSelected, event.era),
        className: "",
        iconSize: isSelected ? [20, 20] : [12, 12],
        iconAnchor: isSelected ? [10, 10] : [6, 6],
      });

      const marker = window.L.marker(
        [event.coordinates.lat, event.coordinates.lng],
        { icon },
      )
        .addTo(leafletMapRef.current)
        .on("click", () => onMarkerClick(event.id));

      // Use tooltip instead of popup to prevent click interception
      marker.bindTooltip(
        `<b>${event.title}</b><br>${event.locationName}`,
        { direction: 'top', offset: [0, -10] }
      );

      markersRef.current.push(marker);
    });
  }, [events, selectedEventId, onMarkerClick, mapReady]);

  // Update map view when center/zoom changes
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(center, zoom);
    }
  }, [center, zoom]);

  return (
    <div className="relative h-full">
      <div
        ref={mapRef}
        className={`${className} w-full rounded-lg shadow-md z-0`}
      />
    </div>
  );
};

export default InteractiveMapReact;
