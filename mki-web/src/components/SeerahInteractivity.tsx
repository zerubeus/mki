import React, { useState, useCallback, useEffect, useMemo } from "react";
import InteractiveMap from "./InteractiveMap";
import TimelineSlider from "./TimelineSlider";
import WikipediaPanel from "./WikipediaPanel";
import EventDetailsModal from "./EventDetailsModal";
import type { HistoricalEvent, EventEra } from "../types";
import { MAP_EVENT_ZOOM } from "../data/d1SeerahService";
import { getWikipediaRegionInfo, type WikipediaRegionInfo } from "../data/wikipediaRegions";

interface SeerahInteractivityProps {
  sortedEvents: HistoricalEvent[];
  initialEventId: number | null;
  locale?: "ar" | "en" | "fr";
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
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

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
          onRegionClick={handleRegionClick}
          center={mapCenter}
          zoom={mapZoom}
          className="h-full"
          locale={locale}
        />

        {/* Compact Event Card - positioned at top of map */}
        {selectedEvent && showEventInfo && (
          <div className="absolute top-2 left-2 right-2 z-[600]">
            <div
              className="bg-[#1a1f2e]/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 px-3 py-2 cursor-pointer hover:bg-[#1a1f2e] transition-colors"
              onClick={() => setShowDetailsModal(true)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border ${getEraBadgeColors(selectedEvent.era)}`}>
                    {selectedEvent.era}
                  </span>
                  <h3 className="text-sm font-semibold text-white truncate">
                    {selectedEvent.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{selectedEvent.year}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEventInfo(false);
                  }}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close event info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        locale={locale}
      />
    </div>
  );
};

export default SeerahInteractivity;
