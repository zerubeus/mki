import React from 'react';
import type { HistoricalEvent } from '../types'; // Adjusted path

interface TimelineItemProps {
  event: HistoricalEvent;
  isSelected: boolean;
  onSelect: (eventId: number) => void;
  isFirst: boolean;
  isLast: boolean;
  // selectedEventId?: number | null; // Added to receive actual selected ID if needed for advanced connector
}

const getEraColors = (era: string, isSelected: boolean) => {
  if (isSelected) return 'bg-blue-600 border-blue-700';
  switch (era) {
    case 'Pre-Prophethood': return 'bg-sky-400 border-sky-500';
    case 'Meccan': return 'bg-amber-400 border-amber-500';
    case 'Medinan': return 'bg-emerald-400 border-emerald-500';
    default: return 'bg-gray-400 border-gray-500';
  }
};

const TimelineItem: React.FC<TimelineItemProps> = ({ event, isSelected, onSelect, isFirst, isLast }) => {
  const eraColorClasses = getEraColors(event.era, isSelected);

  return (
    <div className="flex flex-col items-center flex-shrink-0 w-48 mx-2 relative pb-8 group cursor-pointer" onClick={() => onSelect(event.id)}>
      {/* Connector Line - simplified: active if current item is selected. More complex logic would be in parent. */}
      {!isLast && (
        <div className={`absolute top-[10px] left-1/2 h-[3px] w-full ${isSelected ? 'bg-blue-500' : 'bg-gray-300'} z-0`} />
      )}
      
      {/* Event Dot */} 
      <div className={`relative z-10 w-5 h-5 rounded-full ${eraColorClasses} border-2 border-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>

      {/* Event Card */} 
      <div className={`mt-3 p-3 rounded-lg shadow-lg w-full text-center transition-all duration-200 ease-in-out ${isSelected ? 'bg-blue-600 text-white scale-105' : 'bg-white text-gray-700 group-hover:shadow-xl' }`}>
        <p className={`font-semibold text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{event.year}</p>
        <h4 className={`mt-1 text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{event.title}</h4>
      </div>
    </div>
  );
};

export default TimelineItem; 