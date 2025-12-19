import React, { useState, useCallback, useEffect, useMemo } from "react";
import InteractiveMap from "./InteractiveMap";
import TimelineSlider from "./TimelineSlider";
import type { HistoricalEvent, EventEra } from "../types";
import { MAP_EVENT_ZOOM } from "../data/seerahEvents";

interface SeerahInteractivityProps {
  sortedEvents: HistoricalEvent[];
  initialEventId: number | null;
  locale?: "ar" | "en";
}

const SeerahInteractivity: React.FC<SeerahInteractivityProps> = ({
  sortedEvents,
  initialEventId,
  locale = "en",
}) => {
  // Selection state
  const [selectedEventId, setSelectedEventId] = useState<number | null>(initialEventId);
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const initial = sortedEvents.find(e => e.id === initialEventId);
    return initial ? [initial.coordinates.lat, initial.coordinates.lng] : [21.4225, 39.8262];
  });
  const [mapZoom, setMapZoom] = useState<number>(MAP_EVENT_ZOOM);

  // Year state for timeline
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const initial = sortedEvents.find(e => e.id === initialEventId);
    if (initial) {
      const yearMatch = initial.year.match(/^(\d+)/);
      return yearMatch ? parseInt(yearMatch[1]) : 570;
    }
    return 570;
  });

  // Event info overlay state
  const [showEventInfo, setShowEventInfo] = useState<boolean>(true);

  // Get the selected event object
  const selectedEvent = useMemo(() => {
    return sortedEvents.find(e => e.id === selectedEventId) || null;
  }, [sortedEvents, selectedEventId]);


  // Handle event selection
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
      }
    },
    [sortedEvents],
  );

  // Handle year change from timeline slider
  const handleYearChange = useCallback(
    (year: number) => {
      setCurrentYear(year);
      // Find an event matching this year
      const eventsForYear = sortedEvents.filter(e => {
        const match = e.year.match(/^(\d+)/);
        return match && parseInt(match[1]) === year;
      });

      if (eventsForYear.length > 0) {
        handleEventSelect(eventsForYear[0].id);
      } else {
        // Find nearest event to this year
        let nearestEvent = sortedEvents[0];
        let minDiff = Infinity;

        sortedEvents.forEach(event => {
          const match = event.year.match(/^(\d+)/);
          if (match) {
            const eventYear = parseInt(match[1]);
            const diff = Math.abs(eventYear - year);
            if (diff < minDiff) {
              minDiff = diff;
              nearestEvent = event;
            }
          }
        });

        if (nearestEvent) {
          handleEventSelect(nearestEvent.id);
        }
      }
    },
    [sortedEvents, handleEventSelect],
  );

  // Select the first event by default if none selected
  useEffect(() => {
    if (sortedEvents.length > 0 && selectedEventId === null) {
      handleEventSelect(sortedEvents[0].id);
    }
  }, [sortedEvents, selectedEventId, handleEventSelect]);

  // Show event info overlay when a new event is selected
  useEffect(() => {
    if (selectedEventId !== null) {
      setShowEventInfo(true);
    }
  }, [selectedEventId]);

  // Helper function for era badge colors
  const getEraBadgeColors = (era: EventEra): string => {
    switch (era) {
      case "Pre-Prophethood":
        return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "Meccan":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Medinan":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Map Container */}
      <div className="relative flex-grow" style={{ minHeight: "400px" }}>
        {/* Map */}
        <InteractiveMap
          events={sortedEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={handleEventSelect}
          center={mapCenter}
          zoom={mapZoom}
          className="h-full"
        />

        {/* Event Info Overlay - positioned at top of map */}
        {selectedEvent && showEventInfo && (
          <div className="absolute top-2 left-2 right-2 z-[600]">
            <div className="bg-[#1a1f2e]/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white truncate">
                      {selectedEvent.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEraBadgeColors(selectedEvent.era)}`}>
                      {selectedEvent.era}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    {selectedEvent.year} • {selectedEvent.locationName}
                  </p>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {selectedEvent.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventInfo(false)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close event info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Slider - positioned at bottom of map */}
        <TimelineSlider
          events={sortedEvents}
          currentYear={currentYear}
          onYearChange={handleYearChange}
          locale={locale}
        />
      </div>
    </div>
  );
};

export default SeerahInteractivity;
