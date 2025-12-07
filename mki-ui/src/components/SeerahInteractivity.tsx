import React, { useState, useCallback, useEffect } from "react";
import InteractiveMap from "./InteractiveMap";
import Timeline from "./Timeline";
import type { HistoricalEvent } from "../types";
import { MAP_EVENT_ZOOM } from "../data/seerahEvents";

interface SeerahInteractivityProps {
  sortedEvents: HistoricalEvent[];
  initialEventId: number | null;
  timelineTitle: string;
}

const SeerahInteractivity: React.FC<SeerahInteractivityProps> = ({
  sortedEvents,
  initialEventId,
  timelineTitle,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(initialEventId);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const initial = sortedEvents.find(e => e.id === initialEventId);
    return initial ? [initial.coordinates.lat, initial.coordinates.lng] : [21.4225, 39.8262];
  });
  const [mapZoom, setMapZoom] = useState<number>(MAP_EVENT_ZOOM);
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const initial = sortedEvents.find(e => e.id === initialEventId);
    if (initial) {
      const yearMatch = initial.year.match(/^(\d+)/);
      return yearMatch ? parseInt(yearMatch[1]) : 622;
    }
    return 622;
  });

  const handleEventSelect = useCallback(
    (eventId: number) => {
      setSelectedEventId(eventId);
      const event = sortedEvents.find((e) => e.id === eventId);
      if (event) {
        setMapCenter([event.coordinates.lat, event.coordinates.lng]);
        setMapZoom(MAP_EVENT_ZOOM);
        
        // Update year
        const yearMatch = event.year.match(/^(\d+)/);
        if (yearMatch && yearMatch[1]) {
          setCurrentYear(parseInt(yearMatch[1]));
        }

        // Update the event display
        updateEventDisplay(event);
      }
    },
    [sortedEvents],
  );

  // Function to update the static event display
  const updateEventDisplay = (event: HistoricalEvent) => {
    const displayElement = document.getElementById('event-display');
    if (displayElement) {
      const getEraBadgeColors = (era: string): string => {
        switch (era) {
          case "Pre-Prophethood":
            return "bg-sky-100 text-sky-800";
          case "Meccan":
            return "bg-amber-100 text-amber-800";
          case "Medinan":
            return "bg-emerald-100 text-emerald-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };

      displayElement.innerHTML = `
        <div class="p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-800">${event.title}</h2>
            <span class="px-3 py-1 rounded-full text-sm font-medium ${getEraBadgeColors(event.era)}">
              ${event.era}
            </span>
          </div>
          <p class="text-sm text-gray-700 mb-1">Year: ${event.year}</p>
          <p class="text-sm text-gray-700 mb-3">Location: ${event.locationName}</p>
          <p class="text-gray-800 text-sm leading-relaxed">${event.description}</p>
        </div>
      `;
    }
  };

  // Select the first event by default if none selected
  useEffect(() => {
    if (sortedEvents.length > 0 && selectedEventId === null) {
      handleEventSelect(sortedEvents[0].id);
    }
  }, [sortedEvents, selectedEventId, handleEventSelect]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-white p-1 md:p-2 rounded-xl shadow-xl">
        <InteractiveMap
          events={sortedEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={handleEventSelect}
          center={mapCenter}
          zoom={mapZoom}
          year={currentYear}
        />
      </div>

      <div className="bg-white p-2 md:p-4 rounded-xl shadow-xl">
        <Timeline
          events={sortedEvents}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          title={timelineTitle}
        />
      </div>
    </div>
  );
};

export default SeerahInteractivity;