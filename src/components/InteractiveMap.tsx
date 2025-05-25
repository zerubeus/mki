import React, { useEffect, useRef } from 'react';
import type { HistoricalEvent, GeoCoordinates } from '../types'; // Adjusted path

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
}

const InteractiveMapReact: React.FC<InteractiveMapProps> = ({ events, selectedEventId, onMarkerClick, center, zoom }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null); // To store the Leaflet map instance
  const markersRef = useRef<any[]>([]); // To store marker instances

  const getIconHtml = (isSelected: boolean, era: string) => {
    let bgColor = 'bg-gray-500'; // Default
    if (era === 'Meccan') bgColor = 'bg-amber-500';
    if (era === 'Medinan') bgColor = 'bg-emerald-500';
    if (era === 'Pre-Prophethood') bgColor = 'bg-sky-500';

    if (isSelected) {
      return `<div class="${bgColor} w-5 h-5 rounded-full border-2 border-white shadow-lg ring-2 ring-offset-1 ring-black flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full"></div></div>`;
    }
    return `<div class="${bgColor} w-3 h-3 rounded-full border border-white shadow"></div>`;
  };

  useEffect(() => {
    if (mapRef.current && window.L && !leafletMapRef.current) {
      const map = window.L.map(mapRef.current).setView(center, zoom);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
      leafletMapRef.current = map;
    }
    // Not re-running on center/zoom: map view is updated by flyTo in another useEffect
  }, []); 

  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => leafletMapRef.current.removeLayer(marker));
    markersRef.current = [];

    // Add new markers
    events.forEach(event => {
      const isSelected = event.id === selectedEventId;
      const icon = window.L.divIcon({
        html: getIconHtml(isSelected, event.era),
        className: '', // Important to prevent default Leaflet icon styling and allow Tailwind
        iconSize: isSelected ? [20, 20] : [12, 12],
        iconAnchor: isSelected ? [10, 10] : [6, 6],
      });

      const marker = window.L.marker([event.coordinates.lat, event.coordinates.lng], { icon })
        .addTo(leafletMapRef.current)
        .on('click', () => onMarkerClick(event.id));
      
      marker.bindPopup(`<b>${event.title}</b><br>${event.locationName}`);
      
      markersRef.current.push(marker);
    });

  }, [events, selectedEventId, onMarkerClick]); // Update markers when events or selection changes

  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(center, zoom);
    }
  }, [center, zoom]); // Update map view when center or zoom props change

  return <div ref={mapRef} className="h-[400px] md:h-[500px] w-full rounded-lg shadow-md z-0" />;
};

export default InteractiveMapReact; 