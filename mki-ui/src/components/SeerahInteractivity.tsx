import React, { useState, useCallback, useEffect, useMemo } from "react";
import InteractiveMap from "./InteractiveMap";
import TimelineSlider from "./TimelineSlider";
import WikipediaPanel from "./WikipediaPanel";
import EventBottomSheet from "./EventBottomSheet";
import type { HistoricalEvent } from "../types";
import { MAP_EVENT_ZOOM } from "../data/seerahEvents";
import { getWikipediaRegionInfo, type WikipediaRegionInfo } from "../data/wikipediaRegions";

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

  // Event info overlay state
  const [showEventInfo, setShowEventInfo] = useState<boolean>(true);

  // Wikipedia panel state
  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);
  const [selectedRegionInfo, setSelectedRegionInfo] = useState<WikipediaRegionInfo | null>(null);
  const [showWikipediaPanel, setShowWikipediaPanel] = useState<boolean>(false);

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
      }
    },
    [sortedEvents],
  );

  // Handle region click for Wikipedia panel
  const handleRegionClick = useCallback((regionName: string) => {
    const regionInfo = getWikipediaRegionInfo(regionName);
    setSelectedRegionName(regionName);
    setSelectedRegionInfo(regionInfo);
    setShowWikipediaPanel(true);
  }, []);

  // Close Wikipedia panel
  const handleCloseWikipediaPanel = useCallback(() => {
    setShowWikipediaPanel(false);
  }, []);

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

  return (
    <div className="relative flex flex-col h-full">
      {/* Map Container */}
      <div className="relative flex-grow" style={{ minHeight: "400px" }}>
        {/* Map */}
        <InteractiveMap
          events={sortedEvents}
          selectedEventId={selectedEventId}
          onMarkerClick={handleEventSelect}
          onRegionClick={handleRegionClick}
          center={mapCenter}
          zoom={mapZoom}
          className="h-full"
          locale={locale}
        />

        {/* Event Bottom Sheet - draggable panel */}
        {showEventInfo && (
          <EventBottomSheet
            event={selectedEvent}
            onClose={() => setShowEventInfo(false)}
            locale={locale}
          />
        )}

        {/* Timeline Slider - positioned at bottom of map */}
        <TimelineSlider
          events={sortedEvents}
          selectedEventId={selectedEventId}
          onEventSelect={handleEventSelect}
          locale={locale}
        />
      </div>

      {/* Wikipedia Panel */}
      <WikipediaPanel
        regionInfo={selectedRegionInfo}
        regionName={selectedRegionName || ""}
        isOpen={showWikipediaPanel}
        onClose={handleCloseWikipediaPanel}
        locale={locale}
      />
    </div>
  );
};

export default SeerahInteractivity;
