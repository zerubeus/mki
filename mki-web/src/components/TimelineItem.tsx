import React from "react";
import type { HistoricalEvent, EventEra } from "../types"; // Adjust path if needed, assuming types.ts is in src/

interface TimelineItemProps {
  event: HistoricalEvent;
  isSelected: boolean;
  onSelect: (eventId: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const getEraColors = (era: EventEra, isSelected: boolean): string => {
  const baseColors: Record<EventEra, string> = {
    "Pre-Prophethood": "border-sky-500 bg-sky-100/90 text-sky-800",
    Meccan: "border-amber-500 bg-amber-100/90 text-amber-800",
    Medinan: "border-emerald-500 bg-emerald-100/90 text-emerald-800",
  };
  const selectedColors: Record<EventEra, string> = {
    "Pre-Prophethood":
      "border-sky-700 bg-sky-500/90 text-white ring-2 ring-sky-300",
    Meccan: "border-amber-700 bg-amber-500/90 text-white ring-2 ring-amber-300",
    Medinan:
      "border-emerald-700 bg-emerald-500/90 text-white ring-2 ring-emerald-300",
  };
  return isSelected ? selectedColors[era] : baseColors[era];
};

const getDotEraColors = (era: EventEra, isSelected: boolean): string => {
  const baseColors: Record<EventEra, string> = {
    "Pre-Prophethood": "bg-sky-500/90",
    Meccan: "bg-amber-500/90",
    Medinan: "bg-emerald-500/90",
  };
  const selectedColors: Record<EventEra, string> = {
    "Pre-Prophethood": "bg-sky-700 ring-4 ring-sky-300/50",
    Meccan: "bg-amber-700 ring-4 ring-amber-300/50",
    Medinan: "bg-emerald-700 ring-4 ring-emerald-300/50",
  };
  return isSelected ? selectedColors[era] : baseColors[era];
};

const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  isSelected,
  onSelect,
  isFirst,
  isLast,
}) => {
  const eraColors = event.era
    ? getEraColors(event.era, isSelected)
    : "border-gray-500 bg-gray-100/90 text-gray-800";
  const dotEraColors = event.era
    ? getDotEraColors(event.era, isSelected)
    : "bg-gray-500/90";

  return (
    <div className="flex items-center flex-shrink-0 group">
      {/* Timeline Line - Left */}
      {!isFirst && (
        <div
          className={`w-8 h-1 ${isSelected ? "bg-gray-500/90" : "bg-gray-300/70"}`}
        ></div>
      )}

      {/* Dot and Card Container */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <button
          onClick={() => onSelect(event.id)}
          className={`w-6 h-6 rounded-full ${dotEraColors} border-2 border-white shadow-md z-10 flex items-center justify-center transition-all duration-200 ease-in-out transform group-hover:scale-110`}
          aria-label={`Select event: ${event.title}`}
        >
          {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
        </button>

        {/* Event Card */}
        <button
          onClick={() => onSelect(event.id)}
          className={`mt-4 p-3 w-48 min-h-[100px] rounded-lg shadow-lg border text-left transition-all duration-200 ease-in-out transform group-hover:-translate-y-1 backdrop-blur-sm ${eraColors} ${isSelected ? "scale-105" : "hover:shadow-xl"}`}
        >
          <p className={`font-bold text-sm ${isSelected ? "text-white" : "text-gray-900"}`}>
            {event.year}
          </p>
          <p className={`text-xs mt-1 ${isSelected ? "text-gray-100" : "text-gray-700"}`}>
            {event.title}
          </p>
        </button>
      </div>

      {/* Timeline Line - Right */}
      {!isLast && (
        <div
          className={`w-8 h-1 ${isSelected ? "bg-gray-500/90" : "bg-gray-300/70"}`}
        ></div>
      )}
    </div>
  );
};

export default TimelineItem;
