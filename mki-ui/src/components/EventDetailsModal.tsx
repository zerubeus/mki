import React from "react";
import type { HistoricalEvent, EventEra } from "../types";

interface EventDetailsModalProps {
  event: HistoricalEvent | null;
  isOpen: boolean;
  onClose: () => void;
  locale: "ar" | "en";
}

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

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  locale,
}) => {
  if (!isOpen || !event) return null;

  const isRtl = locale === "ar";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1f2e] rounded-xl shadow-2xl border border-gray-700/50 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className={`flex items-center gap-3 flex-1 min-w-0 ${isRtl ? "flex-row-reverse" : ""}`}>
            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${getEraBadgeColors(event.era)}`}>
              {event.era}
            </span>
            <h2 className={`text-xl font-bold text-white truncate ${isRtl ? "font-arabic" : ""}`}>
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors ml-3"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-4 ${isRtl ? "text-right" : "text-left"}`}>
          {/* Year and Location */}
          <div className={`flex items-center gap-4 mb-4 text-sm ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-300">{event.year}</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-300">{event.locationName}</span>
            </div>
          </div>

          {/* Description */}
          <div className={`text-gray-300 leading-relaxed ${isRtl ? "font-arabic" : ""}`}>
            {event.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
