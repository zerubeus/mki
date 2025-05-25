import React from 'react';
import type { HistoricalEvent, EventEra } from '../types'; // Adjusted path with type-only import

interface SelectedEventDisplayProps {
  event: HistoricalEvent | null;
}

const getEraBadgeColors = (era: EventEra): string => {
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

const SelectedEventDisplay: React.FC<SelectedEventDisplayProps> = ({ event }) => {
  if (!event) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-500 h-full flex flex-col justify-center items-center min-h-[150px]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
        Select an event from the timeline or map to view details.
      </div>
    );
  }

  const eraBadgeColors = getEraBadgeColors(event.era);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md h-full min-h-[150px]">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{event.title}</h2>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${eraBadgeColors}`}>
          {event.era} Era
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-1">Year: {event.year}</p>
      <p className="text-sm text-gray-500 mb-3">Location: {event.locationName}</p>
      <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
    </div>
  );
};

export default SelectedEventDisplay; 