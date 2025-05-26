import React, { useEffect, useRef, useState } from "react";
import type { HistoricalEvent } from "../types";
import {
  getGeoJsonForYear,
  getYearRange,
} from "../data/geojson/historicalTerritories";

// Declare L on window if using CDN version of Leaflet and not importing via npm module directly
// For Astro with npm installed leaflet, direct import is fine, but this handles script tag loading.
declare global {
  interface Window {
    L: any; // Leaflet's global object
  }
}

interface InteractiveMapProps {
  events: HistoricalEvent[];
  selectedEventId: number | null;
  onMarkerClick: (eventId: number) => void;
  center: [number, number];
  zoom: number;
  year?: number; // Optional year to display specific historical boundaries
}

const InteractiveMapReact: React.FC<InteractiveMapProps> = ({
  events,
  selectedEventId,
  onMarkerClick,
  center,
  zoom,
  year = 622,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null); // To store the Leaflet map instance
  const markersRef = useRef<any[]>([]); // To store marker instances
  const geoJsonLayerRef = useRef<any>(null); // To store the GeoJSON layer
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [manualYear, setManualYear] = useState<number>(year);
  const [showTimeSlider, setShowTimeSlider] = useState<boolean>(false);
  const yearRange = getYearRange(); // Get min and max years from historical data

  const getIconHtml = (isSelected: boolean, era: string) => {
    let bgColor = "bg-gray-500"; // Default
    if (era === "Meccan") bgColor = "bg-amber-500";
    if (era === "Medinan") bgColor = "bg-emerald-500";
    if (era === "Pre-Prophethood") bgColor = "bg-sky-500";

    if (isSelected) {
      return `<div class="${bgColor} w-5 h-5 rounded-full border-2 border-white shadow-lg ring-2 ring-offset-1 ring-black flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>`;
    }
    return `<div class="${bgColor} w-3 h-3 rounded-full border border-white shadow"></div>`;
  };

  useEffect(() => {
    if (mapRef.current && window.L && !leafletMapRef.current) {
      // Create a map with a simple background
      const map = window.L.map(mapRef.current, {
        attributionControl: false,
        zoomControl: true,
        minZoom: 3,
        maxZoom: 10,
      }).setView(center, zoom);

      // Add a simple light background tile layer
      window.L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 10,
        },
      ).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    }
  }, []);

  // Update manual year when year prop changes
  useEffect(() => {
    setManualYear(year);
  }, [year]);

  // Add GeoJSON layer when map is ready or when year changes
  useEffect(() => {
    if (!mapReady || !leafletMapRef.current || !window.L) return;

    // Remove existing GeoJSON layer if it exists
    if (geoJsonLayerRef.current) {
      leafletMapRef.current.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    // Get GeoJSON data for the specified year (use manual year if time slider is shown)
    const yearToUse = showTimeSlider ? manualYear : year;
    const geoJsonData = getGeoJsonForYear(yearToUse);

    // Add GeoJSON layer to the map
    geoJsonLayerRef.current = window.L.geoJSON(geoJsonData, {
      style: (feature: GeoJSON.Feature) => ({
        fillColor: feature?.properties?.color || "#cccccc",
        weight: 1,
        opacity: 0.8,
        color: "#666",
        fillOpacity: 0.35,
      }),
      onEachFeature: (feature: GeoJSON.Feature, layer: any) => {
        if (feature.properties && feature.properties.name) {
          layer.bindTooltip(
            `<div class="font-semibold">${feature.properties.name}</div>
             <div class="text-xs">${feature.properties.description || ""}</div>`,
            { sticky: true },
          );
        }
      },
    }).addTo(leafletMapRef.current);

    // Send GeoJSON layer to back so markers appear on top
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.bringToBack();
    }
  }, [mapReady, year]);

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
        className: "", // Important to prevent default Leaflet icon styling and allow Tailwind
        iconSize: isSelected ? [20, 20] : [12, 12],
        iconAnchor: isSelected ? [10, 10] : [6, 6],
      });

      const marker = window.L.marker(
        [event.coordinates.lat, event.coordinates.lng],
        { icon },
      )
        .addTo(leafletMapRef.current)
        .on("click", () => onMarkerClick(event.id));

      marker.bindPopup(`<b>${event.title}</b><br>${event.locationName}`);

      markersRef.current.push(marker);
    });

    // Ensure markers are on top of GeoJSON layers
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.bringToBack();
    }
  }, [events, selectedEventId, onMarkerClick, mapReady]); // Update markers when events or selection changes

  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(center, zoom);
    }
  }, [center, zoom]); // Update map view when center or zoom props change

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualYear(parseInt(e.target.value));
  };

  const toggleTimeSlider = () => {
    setShowTimeSlider(!showTimeSlider);
  };

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="h-[400px] md:h-[500px] w-full rounded-lg shadow-md z-0"
      />

      {/* Time control button */}
      <button
        onClick={toggleTimeSlider}
        className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-md shadow-md z-10 text-xs font-medium"
      >
        {showTimeSlider ? "Hide Time Control" : "Show Time Control"}
      </button>

      {/* Time slider */}
      {showTimeSlider && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md z-10 w-4/5 max-w-md">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{yearRange.min} CE</span>
              <span className="font-semibold text-sm text-gray-800">
                {manualYear} CE
              </span>
              <span>{yearRange.max} CE</span>
            </div>
            <input
              type="range"
              min={yearRange.min}
              max={yearRange.max}
              value={manualYear}
              onChange={handleYearChange}
              className="w-full"
            />
            <div className="text-xs text-center text-gray-500">
              Drag to see historical boundaries change over time
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMapReact;
