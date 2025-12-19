import React, { useState, useCallback, useEffect, useMemo } from "react";
import InteractiveMap from "./InteractiveMap";
import FilterBar from "./FilterBar";
import TimelineSlider from "./TimelineSlider";
import type { HistoricalEvent, EventEra, EventType } from "../types";
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

  // Filter state
  const [activeEras, setActiveEras] = useState<EventEra[]>([]);
  const [activeTypes, setActiveTypes] = useState<EventType[]>([]);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter(event => {
      const eraMatch = activeEras.length === 0 || activeEras.includes(event.era);
      const typeMatch = activeTypes.length === 0 || activeTypes.includes(event.eventType);
      return eraMatch && typeMatch;
    });
  }, [sortedEvents, activeEras, activeTypes]);


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
      // Find an event matching this year (prefer filtered, fallback to all)
      const eventsForYear = filteredEvents.filter(e => {
        const match = e.year.match(/^(\d+)/);
        return match && parseInt(match[1]) === year;
      });

      if (eventsForYear.length > 0) {
        handleEventSelect(eventsForYear[0].id);
      } else {
        // Find nearest event to this year
        let nearestEvent = filteredEvents[0];
        let minDiff = Infinity;

        filteredEvents.forEach(event => {
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
    [filteredEvents, handleEventSelect],
  );

  // Handle era filter toggle
  const handleEraToggle = useCallback((era: EventEra) => {
    setActiveEras(prev =>
      prev.includes(era)
        ? prev.filter(e => e !== era)
        : [...prev, era]
    );
  }, []);

  // Handle type filter toggle
  const handleTypeToggle = useCallback((type: EventType) => {
    setActiveTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setActiveEras([]);
    setActiveTypes([]);
  }, []);

  // Select the first event by default if none selected
  useEffect(() => {
    if (sortedEvents.length > 0 && selectedEventId === null) {
      handleEventSelect(sortedEvents[0].id);
    }
  }, [sortedEvents, selectedEventId, handleEventSelect]);


  return (
    <div className="relative flex flex-col h-full">
      {/* Filter Bar */}
      <FilterBar
        activeEras={activeEras}
        activeTypes={activeTypes}
        onEraToggle={handleEraToggle}
        onTypeToggle={handleTypeToggle}
        onClearAll={handleClearFilters}
        locale={locale}
      />

      {/* Map Container */}
      <div className="relative flex-grow" style={{ minHeight: "400px" }}>
        {/* Map */}
        <InteractiveMap
          events={filteredEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={handleEventSelect}
          center={mapCenter}
          zoom={mapZoom}
          year={currentYear}
          className="h-full"
          locale={locale}
        />

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
