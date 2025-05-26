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
      <div className="p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-center text-gray-700 h-full flex flex-col justify-center items-center min-h-[150px]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-500 mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-gray-600">Select an event to see details</p>
      </div>
    );
  }

  const eraBadgeColors = getEraBadgeColors(event.era);

  return (
    <div className="p-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{event.title}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${eraBadgeColors}`}>
          {event.era}
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-1">Year: {event.year}</p>
      <p className="text-sm text-gray-700 mb-3">Location: {event.locationName}</p>
      <p className="text-gray-800 text-sm leading-relaxed">{event.description}</p>
    </div>
  );
};

export default SelectedEventDisplay;