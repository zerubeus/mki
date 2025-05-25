import React, { useState, useCallback, useMemo, useEffect } from "react";
import InteractiveMap from "./InteractiveMap"; // This will be InteractiveMapReact
import Timeline from "./Timeline";
import SelectedEventDisplay from "./SelectedEventDisplay";
import {
  HISTORICAL_EVENTS,
  MAP_INITIAL_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_EVENT_ZOOM,
} from "../data/seerahEvents"; // Adjusted path
import type { HistoricalEvent } from "../types"; // Adjusted path
import type { translations } from "../i18n/translations"; // Import translations type

// Define a type for one language's translations
type TranslationObject = (typeof translations)[keyof typeof translations];

// Define props for the component, including 't'
interface SeerahJourneyProps {
  t: TranslationObject;
  // Define other props if SeerahJourney is ever used without client:only and needs SSR props
}

const SeerahJourney: React.FC<SeerahJourneyProps> = ({ t }) => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] =
    useState<[number, number]>(MAP_INITIAL_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(MAP_INITIAL_ZOOM);

  const sortedEvents = useMemo(
    () =>
      [...HISTORICAL_EVENTS].sort((a, b) => {
        const yearA = parseInt(a.year.match(/\d+/)?.[0] || "0");
        const yearB = parseInt(b.year.match(/\d+/)?.[0] || "0");
        if (yearA !== yearB) return yearA - yearB;
        return a.id - b.id;
      }),
    [],
  );

  const handleEventSelect = useCallback(
    (eventId: number) => {
      setSelectedEventId(eventId);
      const event = sortedEvents.find((e) => e.id === eventId);
      if (event) {
        setMapCenter([event.coordinates.lat, event.coordinates.lng]);
        setMapZoom(MAP_EVENT_ZOOM);
      }
    },
    [sortedEvents],
  );

  const selectedEvent = useMemo(() => {
    return sortedEvents.find((event) => event.id === selectedEventId) || null;
  }, [selectedEventId, sortedEvents]);

  // Select the first event by default after sorting
  useEffect(() => {
    if (sortedEvents.length > 0 && selectedEventId === null) {
      handleEventSelect(sortedEvents[0].id);
    }
  }, [sortedEvents, selectedEventId, handleEventSelect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex flex-col p-4 md:p-8 space-y-6">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          {t.seerahJourneyTitle || "The Prophet's Path"}{" "}
          <span style={{ fontFamily: "'Amiri Quran', serif" }}>ﷺ</span>
        </h1>
        <p className="text-sm md:text-md text-gray-600 mt-1">
          {t.seerahJourneySubtitle || "An Interactive Journey Through Seerah"}
        </p>
      </header>

      <main className="flex-grow flex flex-col space-y-6 w-full max-w-5xl mx-auto">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl">
          <SelectedEventDisplay event={selectedEvent} />
        </div>

        <div className="bg-white p-1 md:p-2 rounded-xl shadow-xl">
          <InteractiveMap
            events={sortedEvents}
            selectedEventId={selectedEventId}
            onMarkerClick={handleEventSelect}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>

        <div className="bg-white p-2 md:p-4 rounded-xl shadow-xl">
          <Timeline
            events={sortedEvents}
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
          />
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 py-4">
        {t.seerahJourneyFooter ||
          "Map data &copy; OpenStreetMap contributors &copy; CartoDB. Event information compiled for educational purposes."}
      </footer>
    </div>
  );
};

export default SeerahJourney;
