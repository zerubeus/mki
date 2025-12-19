import React, { useEffect, useRef, useState } from "react";
import type { HistoricalEvent } from "../types";

interface InteractiveMapProps {
  events: HistoricalEvent[];
  selectedEventId: number | null;
  onMarkerClick: (eventId: number) => void;
  center: [number, number];
  zoom: number;
  year?: number;
  className?: string;
}

const InteractiveMapReact: React.FC<InteractiveMapProps> = ({
  events,
  selectedEventId,
  onMarkerClick,
  center,
  zoom,
  year = 622,
  className = "h-[400px] md:h-[500px]",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletReady, setLeafletReady] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState<boolean>(false);

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
  }, [leafletReady, center, zoom]);

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
      {/* Year display overlay */}
      <div className="absolute top-4 right-4 z-[500] pointer-events-none">
        <div className="bg-[#1a1f2e]/90 backdrop-blur-sm text-white text-4xl font-bold px-6 py-3 rounded-lg border border-gray-700/50 shadow-xl">
          {year}
        </div>
      </div>
      <div
        ref={mapRef}
        className={`${className} w-full rounded-lg shadow-md z-0`}
      />
    </div>
  );
};

export default InteractiveMapReact;
